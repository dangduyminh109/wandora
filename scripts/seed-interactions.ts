import { closeMongo, getMongo } from '../src/lib/db/mongodb';
import { getNeo4j } from '../src/lib/db/neo4j';
import { createUser, findUser } from '../src/features/auth/server/users';
import { ensureFavorite } from '../src/features/places/server/favorites';
import { createOrUpdateReview } from '../src/features/places/server/reviews';

const sampleUsers = [
  {
    email: 'thanh.traveler@wandora.local',
    name: 'Lan Thanh',
    password: 'Password123456@',
    role: 'user' as const,
  },
  {
    email: 'minh.explorer@wandora.local',
    name: 'Duy Minh',
    password: 'Password123456@',
    role: 'user' as const,
  },
  {
    email: 'ky.adventurer@wandora.local',
    name: 'Du Kỵ',
    password: 'Password123456@',
    role: 'user' as const,
  },
  {
    email: 'huong.backpacker@wandora.local',
    name: 'Thu Hương',
    password: 'Password123456@',
    role: 'user' as const,
  },
];

async function main() {
  console.log('--- Khởi tạo dữ liệu người dùng & tương tác mẫu (Seed Interactions) ---');
  const mongo = await getMongo();
  const neo4jDriver = getNeo4j();

  try {
    // 1. Tạo hoặc lấy thông tin người dùng mẫu
    const users: { id: string; name: string; email: string }[] = [];
    for (const u of sampleUsers) {
      let existing = await findUser('email', u.email);
      if (!existing) {
        await createUser(u);
        existing = await findUser('email', u.email);
        console.log(`Đã tạo người dùng mẫu: ${u.name} (${u.email})`);
      } else {
        console.log(`Người dùng mẫu đã tồn tại: ${u.name}`);
      }
      if (existing) {
        users.push({ id: existing.id, name: existing.name, email: existing.email });
      }
    }

    // 2. Lấy danh sách địa điểm theo danh mục từ MongoDB
    const places = await mongo.collection('places').find({}).toArray();
    if (places.length === 0) {
      console.log(
        'Chưa có địa điểm nào trong MongoDB. Vui lòng chạy npm run db:seed-travel trước.',
      );
      return;
    }

    const beachPlaces = places.filter((p) => p.category === 'beach');
    const culturePlaces = places.filter((p) => p.category === 'culture');
    const naturePlaces = places.filter((p) => p.category === 'nature' || p.category === 'mountain');

    console.log(
      `Phân loại địa điểm: ${beachPlaces.length} biển, ${culturePlaces.length} văn hóa, ${naturePlaces.length} thiên nhiên/núi.`,
    );

    const [u1, u2, u3, u4] = users;

    // Kịch bản tương tác:
    // User 1 (Lan Thanh): Thích biển (Mỹ Khê, Phú Quốc, Nha Trang)
    if (u1 && beachPlaces.length >= 3) {
      for (const p of beachPlaces.slice(0, 3)) {
        const id = p._id.toHexString();
        await ensureFavorite(u1.id, id);
        await createOrUpdateReview(id, u1, {
          rating: 5,
          comment: `Bãi biển tuyệt đẹp, cát trắng mịn và dịch vụ xung quanh rất tốt!`,
        });
      }
      console.log(`Đã tạo tương tác cho ${u1.name} (Sở thích: Biển)`);
    }

    // User 2 (Duy Minh): Thích biển (chung với Lan Thanh) VÀ thích di tích văn hóa (Huế, Hội An)
    if (u2 && beachPlaces.length >= 2 && culturePlaces.length >= 2) {
      for (const p of beachPlaces.slice(0, 2)) {
        const id = p._id.toHexString();
        await ensureFavorite(u2.id, id);
        await createOrUpdateReview(id, u2, {
          rating: 5,
          comment: `Nước biển trong xanh, thích hợp nghỉ dưỡng cùng gia đình.`,
        });
      }
      for (const p of culturePlaces.slice(0, 2)) {
        const id = p._id.toHexString();
        await ensureFavorite(u2.id, id);
        await createOrUpdateReview(id, u2, {
          rating: 5,
          comment: `Không gian cổ kính, mang đậm dấu ấn lịch sử hào hùng của dân tộc.`,
        });
      }
      console.log(`Đã tạo tương tác cho ${u2.name} (Sở thích: Biển & Văn hóa)`);
    }

    // User 3 (Du Kỵ): Thích thiên nhiên & núi rừng
    if (u3 && naturePlaces.length >= 3) {
      for (const p of naturePlaces.slice(0, 3)) {
        const id = p._id.toHexString();
        await ensureFavorite(u3.id, id);
        await createOrUpdateReview(id, u3, {
          rating: 5,
          comment: `Cảnh sắc thiên nhiên hùng vĩ, không khí trong lành mát mẻ.`,
        });
      }
      console.log(`Đã tạo tương tác cho ${u3.name} (Sở thích: Thiên nhiên/Núi)`);
    }

    // User 4 (Thu Hương): Thích trải nghiệm văn hóa
    if (u4 && culturePlaces.length >= 3) {
      for (const p of culturePlaces.slice(0, 3)) {
        const id = p._id.toHexString();
        await ensureFavorite(u4.id, id);
        await createOrUpdateReview(id, u4, {
          rating: 4,
          comment: `Kiến trúc rất độc đáo và ấn tượng, đáng để ghé thăm khi có dịp.`,
        });
      }
      console.log(`Đã tạo tương tác cho ${u4.name} (Sở thích: Văn hóa)`);
    }

    console.log('--- Nạp dữ liệu tương tác thành công! ---');
  } finally {
    await neo4jDriver.close();
    await closeMongo();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Lỗi khi nạp tương tác mẫu:', err);
  process.exitCode = 1;
});
