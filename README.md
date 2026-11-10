# Wandora

Hệ thống quản lý và đề xuất địa điểm du lịch. Next.js App Router phục vụ cả frontend và API, TypeScript strict, tổ chức theo feature lấy cảm hứng từ [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).

## Chạy local

Yêu cầu Node.js >= 20.9, npm và Docker Desktop với Linux containers.

```powershell
npm install
Copy-Item .env.example .env.local
# Sửa JWT_SECRET, NEO4J_PASSWORD và SEED_ADMIN_PASSWORD trước khi chạy.
docker compose --env-file .env.local up -d --wait
npm run db:seed
npm run dev
```

Mở http://localhost:3000 và đăng nhập bằng SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Sinh JWT_SECRET ngẫu nhiên bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Không commit `.env.local`. APP_URL phải khớp origin thực tế; production phải dùng HTTPS để cookie Secure hoạt động.

## Kiểm tra

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

Khi server và Neo4j/Redis đang chạy: `npm run test:smoke` kiểm tra auth trên database thật, tạo một user thử nghiệm (không dùng production database).

## Cấu trúc

```text
src/app/                 Next.js routes, layouts, API composition
src/features/auth/       Schemas, UI, password, sessions and login
src/features/users/      Admin user creation UI
src/lib/                 Shared HTTP, API client, database connections
src/config/              Validated server environment
src/types/               Shared public user type
scripts/                 Idempotent initial admin seed
tests/                   Auth validation and password tests
docs/                    Original report and implementation decisions
```

Routes chỉ kết nối HTTP với logic nghiệp vụ. UI không import server module. Shared code không phụ thuộc features; compose các features ở tầng app. Không tạo folder rỗng hoặc barrel file khi chưa cần.

## Auth API

| Endpoint               | Mục đích                               | Quyền                                 |
| ---------------------- | -------------------------------------- | ------------------------------------- |
| POST /api/auth/login   | Đăng nhập bằng email/password          | Public, giới hạn 10 lần/15 phút/email |
| POST /api/auth/refresh | Xoay vòng refresh token                | Refresh cookie hợp lệ                 |
| POST /api/auth/logout  | Xóa session và cookie                  | Session hiện tại                      |
| GET /api/auth/me       | Lấy user hiện tại                      | Đã đăng nhập                          |
| GET /api/users         | Danh sách user, search/sort/pagination | Admin                                 |
| POST /api/users        | Tạo user với email/name/password/role  | Admin                                 |

POST requests yêu cầu header Origin bằng APP_URL, kể cả khi gọi bằng curl hoặc Postman. Password tạo user tối thiểu 12 ký tự. Không có public signup. User được lưu trong Neo4j với constraint email/id unique, mật khẩu băm scrypt có salt. Chỉ public fields được trả về client.

Access JWT sống 1 giờ, refresh token opaque sống 7 ngày. Cookie HttpOnly, SameSite=Lax, Secure trong production. Redis chỉ lưu hash refresh token và user ID. Rotation dùng Lua compare-and-set để hai request không cùng dùng một token cũ. Mỗi rotation cấp TTL 7 ngày mới (sliding session). Logout revoke ngay session, access token của session đó không còn hợp lệ. Mỗi request protected kiểm tra Redis và đọc role hiện tại từ Neo4j.

## UI foundation

MUI + Emotion, Zustand, React Hook Form + Zod và Sonner đã được tích hợp. Trang public `/`, khám phá `/explore`, login `/login`, workspace `/dashboard`, admin `/admin`, bảng user `/admin/users`, tạo user `/admin/users/create`, trang mẫu `/admin/components`.

Hồ sơ `/profile` hỗ trợ sửa tên/điện thoại/giới thiệu và đổi mật khẩu. Admin có thể sửa thông tin, đổi quyền và khóa/mở khóa user. Quên mật khẩu `/forgot-password` gửi link dùng một lần, hết hạn 15 phút tới Mailpit local: mở http://localhost:8025 để đọc email. SMTP local mặc định `127.0.0.1:1025`; Mailpit chạy cùng compose. Xem [docs/account-management.md](docs/account-management.md). Chạy `npm run test:accounts` để kiểm tra các luồng này bằng tài khoản thử nghiệm.

Xem [docs/ui-foundation.md](docs/ui-foundation.md) cho API các component Table, toolbar, pagination, card, badge, form, dialog và layout. `src/lib/theme.ts` quản lý theme chung; Zustand chỉ giữ trạng thái UI, không lưu token hoặc credentials.

## Database và phạm vi

Neo4j + Redis chạy mặc định. MongoDB được chuẩn bị trong profile `travel`, Cassandra trong `analytics`:

```powershell
docker compose --env-file .env.local --profile travel --profile analytics up -d
```

Các container chỉ bind loopback; compose dành cho local development. MongoDB đã có CRUD địa điểm, khách sạn, nhà hàng, dịch vụ và cache Redis. Cassandra lưu lịch sử xem/tìm kiếm, có API thống kê cá nhân và trang `/activity`. Sau khi bật profile analytics, chạy `npm run db:init-cassandra`. Xem [docs/activity-cassandra.md](docs/activity-cassandra.md) để biết schema, cách demo, kiểm thử và hợp đồng dữ liệu cho phần đề xuất Neo4j.

### Nạp dữ liệu mẫu

Sau khi các container đã chạy, nạp theo thứ tự. Mọi lệnh chạy lại được, trừ `db:seed-interactions` (xem bên dưới):

```powershell
npm run db:seed               # tài khoản admin (Neo4j)
npm run db:mongo-indexes      # index MongoDB, gồm index tiện ích
npm run db:seed-travel        # địa điểm, khách sạn, nhà hàng, dịch vụ; tự tính tiện ích ở cuối
npm run db:init-cassandra     # schema Cassandra
npm run db:sync-neo4j         # địa điểm và tiện ích sang Neo4j (phải chạy sau db:seed-travel)
npm run db:seed-interactions  # đánh giá, yêu thích mẫu cho phần đề xuất (chỉ chạy một lần)
```

`db:seed-interactions` bật/tắt yêu thích (`toggleFavorite`), nên chạy lần hai sẽ **bỏ** các lượt yêu thích đã tạo ở lần đầu; đánh giá thì được ghi đè nên không bị nhân đôi. Muốn nạp lại từ đầu thì xoá dữ liệu Neo4j rồi chạy lại các lệnh trên.

Nếu sửa quy tắc chuẩn hoá tiện ích hoặc nhập dữ liệu trực tiếp vào MongoDB, chạy `npm run db:backfill-amenities` để tính lại `amenities` của mọi địa điểm, rồi `npm run db:sync-neo4j` để cập nhật đồ thị.

## Khám phá và tìm theo tiện ích

Trang `/explore` mở cho cả khách chưa đăng nhập. Ô "Tìm kiếm" là full-text search của MongoDB trên tên, mô tả và thẻ (khớp theo từ, phân biệt dấu). Mục "Tìm theo tiện ích" cho chọn tối đa 10 tiện ích rồi bấm tìm; chỉ khi bấm mới gọi API.

**Tiện ích** là mã chuẩn trong [src/features/places/amenities.ts](src/features/places/amenities.ts): `hotel`, `restaurant`, `cafe`, `pool`, `spa`, `amusement_park`, `beach`, `tour`, `transport`, `ticket`. Trường `amenities` của địa điểm được **tự tính** từ category, tags và dữ liệu con (khách sạn, nhà hàng, dịch vụ), nên không nhập tay; cập nhật dữ liệu con sẽ tính lại. Chuỗi tự do như "hồ bơi", "bể bơi", "pool" đều quy về `pool`.

```text
GET /api/places/by-amenities?amenities=pool,spa&region=&category=&minRating=&page=0&pageSize=12
```

Mỗi địa điểm trả kèm `match`: tiện ích khớp đúng (`matched`), tiện ích chỉ có bản gần giống (`similar`), tiện ích còn thiếu (`missing`), loại (`full` khớp đủ, `partial` khớp một phần, `similar` chỉ gần giống) và `score`. Mã tiện ích lạ hoặc để trống trả 400. Kết quả được cache Redis (header `X-Cache`).

**Điểm** = (số tiện ích khớp đúng + tổng trọng số tiện ích gần giống) / số tiện ích đã chọn, cộng tối đa 0.009 theo đánh giá chỉ để phân hạng địa điểm bằng điểm. "Khớp đủ" luôn đứng đầu; còn lại xếp theo điểm chứ không theo nhãn. Bảng độ gần giống (ví dụ hồ bơi ≈ bãi biển 0.7) nằm trong `amenitySimilarities` và được đồng bộ sang Neo4j:

```text
(:Place)-[:HAS_AMENITY]->(:Amenity)
(:Amenity)-[:SIMILAR_TO {weight}]-(:Amenity)
(:User)-[:SEARCHED_FOR {count}]->(:Amenity)
```

Phần "gần giống" lấy từ Neo4j. Nếu Neo4j không dùng được (quá 3 giây hoặc lỗi kết nối), tìm kiếm vẫn trả kết quả khớp đúng, giao diện báo "chưa có gợi ý gần giống" và kết quả đó không bị cache.

### Đề xuất

`GET /api/recommendations` chọn chiến lược theo thứ tự: `collaborative` (người dùng có sở thích giống nhau) → `interest` (các tiện ích người dùng đã tìm, mỗi tiện ích tính tối đa 5 lần) → `content_based` (danh mục và vùng đã thích/đánh giá) → `trending`. Khi Neo4j không dùng được, gợi ý, địa điểm liên quan và thịnh hành lùi về địa điểm đánh giá cao nhất từ MongoDB. Yêu thích chỉ lưu trong Neo4j nên không có phương án lùi.
