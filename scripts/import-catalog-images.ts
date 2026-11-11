import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getMongo, closeMongo } from '../src/lib/db/mongodb';
import { getRedis } from '../src/lib/db/redis';

type Credit = { url: string; source: string; author: string; license: string; licenseUrl: string };
type Asset = Credit & { group: string; filename: string; description: string };

async function main() {
  const assets: Asset[] = JSON.parse(await readFile('docs/catalog-image-assets.json', 'utf8'));
  for (const asset of assets) {
    await access(path.join(process.env.UPLOAD_DIR || 'data/uploads', path.basename(asset.url)));
  }
  const pool = (group: string) => assets.filter((asset) => asset.group === group);
  // The second bedroom photo has an unmade bed; use the two reviewed room photos.
  const hotels = pool('hotel').filter((asset) => !asset.filename.endsWith('phòng ngủ) (1).jpg'));
  const restaurants = pool('restaurant');
  if (
    !hotels.length ||
    !restaurants.length ||
    !pool('transport').length ||
    !pool('motorbike').length
  )
    throw new Error('Thiếu bộ ảnh minh họa đã kiểm tra.');
  const db = await getMongo();
  const places = await db.collection('places').find({}).toArray();
  const byId = new Map(places.map((place) => [String(place._id), place]));
  const totals: Record<string, number> = {};
  for (const kind of ['hotels', 'restaurants', 'services']) {
    let updated = 0;
    const items = await db
      .collection(kind)
      .find({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] })
      .toArray();
    for (const item of items) {
      const hash = createHash('sha256').update(String(item._id)).digest().readUInt32BE(0);
      let credits: Credit[];
      if (kind === 'hotels' || kind === 'restaurants') {
        const options = kind === 'hotels' ? hotels : restaurants;
        credits = [options[hash % options.length], options[(hash + 1) % options.length]];
      } else if (item.type === 'transport') {
        credits = pool('transport');
      } else if (/thuê xe máy/i.test(String(item.name))) {
        credits = pool('motorbike');
      } else {
        // For tours/tickets, illustrate the destination associated with that service.
        const own = byId.get(String(item.placeId));
        const place = own?.images?.length
          ? own
          : places.find((place) => place.category === own?.category && place.images?.length);
        credits = place?.imageCredits?.length
          ? place.imageCredits.slice(0, 1)
          : [restaurants[hash % restaurants.length]];
      }
      const images = [...new Set(credits.map((credit) => credit.url))];
      const result = await db.collection(kind).updateOne(
        {
          _id: item._id,
          $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
        },
        {
          $set: {
            images,
            illustrativeImages: images,
            imageCredits: credits,
            updatedAt: new Date(),
          },
        },
      );
      updated += result.modifiedCount;
    }
    totals[kind] = updated;
    console.log(
      kind,
      'added:',
      updated,
      'remaining without images:',
      await db
        .collection(kind)
        .countDocuments({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] }),
    );
  }
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const section =
    '<section id="catalog-illustrations"><h2>Ảnh minh họa khách sạn, nhà hàng và dịch vụ</h2><p>Các cơ sở trong dữ liệu demo sử dụng ảnh minh họa, không phải ảnh xác thực của từng cơ sở. Ảnh được đổi kích thước và chuyển WebP.</p><ul>' +
    assets
      .map(
        (asset) =>
          `<li>${escape(asset.filename)} — ${escape(asset.author)} — ${escape(asset.license)} <a href="${escape(asset.source)}">Nguồn</a> ${asset.licenseUrl ? `<a href="${escape(asset.licenseUrl)}">Giấy phép</a>` : ''}</li>`,
      )
      .join('\n') +
    '</ul></section>';
  const creditsPage = await readFile('public/image-credits.html', 'utf8');
  await writeFile(
    'public/image-credits.html',
    creditsPage
      .replace(/<section id="catalog-illustrations">[\s\S]*?<\/section>/, '')
      .replace('</html>', section + '</html>'),
  );
  await writeFile(
    'docs/nguon-anh-khach-san-nha-hang-dich-vu.md',
    '# Nguồn ảnh minh họa\n\nẢnh minh họa cho dữ liệu demo, không xác thực cơ sở kinh doanh. Ảnh đã đổi kích thước và chuyển WebP, giữ giấy phép gốc. Tour/vé sử dụng ảnh của địa điểm tương ứng; xem thêm `nguon-anh-dia-diem.md`.\n\n' +
      assets
        .map(
          (asset) =>
            `- **${asset.filename}**: ${asset.author}; ${asset.license}. [Nguồn](${asset.source})${asset.licenseUrl ? ` · [Giấy phép](${asset.licenseUrl})` : ''}`,
        )
        .join('\n'),
  );
  const redis = await getRedis();
  await redis.incr('cache:catalog:version');
  await redis.quit();
  await closeMongo();
  console.log('DONE', totals);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
