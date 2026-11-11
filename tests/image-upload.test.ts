import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  imageListSchema,
  isImageSource,
  MAX_IMAGE_BYTES,
  uploadFilenamePattern,
} from '../src/features/places/image-policy';
import {
  ImageUploadError,
  readImageForm,
  storeImage,
} from '../src/features/places/server/image-upload';

test('album accepts twenty ordered images, uploaded paths, and rejects unsafe URLs', () => {
  const local = '/api/uploads/12345678-1234-4234-8234-123456789abc.webp';
  const images = [local, ...Array.from({ length: 19 }, (_, i) => `https://example.com/${i}.jpg`)];
  assert.deepEqual(imageListSchema.parse(images), images);
  assert.equal(
    imageListSchema.safeParse([...images, 'https://example.com/extra.jpg']).success,
    false,
  );
  for (const unsafe of [
    'javascript:alert(1)',
    'data:image/png;base64,abc',
    'file:///etc/passwd',
    '/api/uploads/../secret',
    '//other.com/x.jpg',
    'https://user:pass@example.com/a.jpg',
  ])
    assert.equal(isImageSource(unsafe), false, unsafe);
});

test('image upload verifies decoded bytes, converts to webp and ignores supplied filenames', async (t) => {
  const directory = await mkdtemp(path.join(process.cwd(), '.tmp-image-tests-'));
  t.after(async () => {
    assert.ok(directory.startsWith(path.join(process.cwd(), '.tmp-image-tests-')));
    await rm(directory, { recursive: true, force: true });
  });
  const source = await sharp({
    create: { width: 2600, height: 1300, channels: 3, background: '#075985' },
  })
    .png()
    .toBuffer();
  const stored = await storeImage(
    new File([new Uint8Array(source)], '../../outside.svg', { type: 'image/png' }),
    directory,
  );
  const filename = stored.url.split('/').at(-1)!;
  assert.equal(uploadFilenamePattern.test(filename), true);
  assert.deepEqual(await readdir(directory), [filename]);
  const metadata = await sharp(await readFile(path.join(directory, filename))).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 2400);
  assert.equal(metadata.height, 1200);
  for (const file of [
    new File(['<svg/>'], 'fake.png', { type: 'image/png' }),
    new File(['html'], 'x.html', { type: 'text/html' }),
    new File([], 'empty.jpg', { type: 'image/jpeg' }),
  ]) {
    await assert.rejects(() => storeImage(file, directory), ImageUploadError);
  }
  await assert.rejects(
    () =>
      storeImage(
        new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'huge.jpg', { type: 'image/jpeg' }),
        directory,
      ),
    (e: unknown) => e instanceof ImageUploadError && e.status === 413,
  );
  assert.deepEqual(await readdir(directory), [filename]);
});

test('multipart parser requires exactly one file and bounds real bytes even with a false length', async () => {
  const form = new FormData();
  form.append('file', new File(['test'], 'a.png', { type: 'image/png' }));
  const file = await readImageForm(
    new Request('http://localhost/api/uploads', { method: 'POST', body: form }),
  );
  assert.equal(file.name, 'a.png');
  form.append('extra', new File(['test'], 'b.png', { type: 'image/png' }));
  await assert.rejects(
    () =>
      readImageForm(new Request('http://localhost/api/uploads', { method: 'POST', body: form })),
    (e: unknown) => e instanceof ImageUploadError && e.status === 400,
  );
  await assert.rejects(
    () =>
      readImageForm(
        new Request('http://localhost/api/uploads', {
          method: 'POST',
          body: new Uint8Array(MAX_IMAGE_BYTES + 65537),
          headers: { 'content-type': 'multipart/form-data; boundary=test', 'content-length': '1' },
        }),
      ),
    (e: unknown) => e instanceof ImageUploadError && e.status === 413,
  );
});
