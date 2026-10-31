# Lịch sử và phân tích hành vi (thành viên 2)

## Phạm vi đã triển khai

- Ghi `place_view` khi người dùng thực sự mở trang chi tiết; không ghi từ server render/prefetch.
- Ghi `search` sau khi truy vấn từ khóa thành công ở trang Khám phá, trang kết quả đầu tiên. Đổi bộ lọc/phân trang không ghi lặp từ khóa; từ khóa rỗng không ghi.
- Trang `/activity`: lịch sử theo ngày UTC, xem thêm bằng cursor và thống kê cá nhân 7 ngày.
- API lấy user từ session, thời gian từ server, metadata địa điểm từ MongoDB; client không chọn người sở hữu sự kiện.
- Giới hạn ghi 120 sự kiện/phút/user bằng Redis. Lỗi analytics không chặn việc khám phá; API trả lỗi thay vì báo đã lưu thành công.

## Schema và truy vấn

`activity_by_user_day`: partition key `(user_id, day)`, clustering key `event_id timeuuid DESC`; metadata gồm `occurred_at`, `type`, `place_id`, `label`, `category`, `region`.

Chia partition theo ngày UTC để lịch sử không dồn vào một partition suốt vòng đời tài khoản. TTL 90 ngày. Truy vấn luôn chỉ rõ user và ngày, không dùng `ALLOW FILTERING` hoặc quét toàn cluster. Dữ liệu metadata là snapshot lúc xem, vẫn có ý nghĩa khi địa điểm đổi tên/xóa.

| API                                                  | Quyền và kết quả                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `POST /api/activity`                                 | Đăng nhập và cùng origin; body `{type:"place_view",placeId}` hoặc `{type:"search",search}` |
| `GET /api/activity?day=2026-10-24&limit=20&before=…` | Chỉ lịch sử của session hiện tại; `events`, `next`; cursor dùng cùng ngày                  |
| `GET /api/activity/stats?days=7`                     | 1–30 ngày UTC gần nhất; lượt xem/tìm kiếm, top địa điểm/danh mục/khu vực/từ khóa           |

Thống kê đọc tối đa 1.000 sự kiện/ngày, trả `truncated: true` nếu còn dữ liệu. Khi đó số đếm là của mẫu đã đọc, không phải tổng đầy đủ. Đây là thống kê theo yêu cầu cho đồ án, chưa phải pipeline phân tích toàn hệ thống.

## Chạy local và demo

```powershell
npm install
docker compose --env-file .env.local --profile travel --profile analytics up -d --wait
npm run db:init-cassandra
npm run db:mongo-indexes
npm run db:seed
npm run db:seed-travel
npm run dev
```

Biến cấu hình: `CASSANDRA_CONTACT_POINTS` (danh sách host phân cách dấu phẩy), `CASSANDRA_DATACENTER`, `CASSANDRA_KEYSPACE` (mặc định `wandora`). Script khởi tạo dùng replication factor 1 cho local; production cần topology, xác thực và TLS riêng.

Demo: đăng nhập → tìm “biển” → mở một địa điểm → vào Lịch sử hoạt động → kiểm tra lượt tìm, lượt xem, khu vực → chọn ngày khác → quay về ngày hiện tại. Đăng nhập tài khoản khác để chứng minh không xem được lịch sử người trước. Ngày lọc là UTC, thời gian từng sự kiện hiển thị theo máy người dùng.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
# Server và Neo4j/Redis/MongoDB/Cassandra phải đang chạy; chỉ dùng database local/test.
npm run test:activity
```

Smoke test tạo hai tài khoản tạm, kiểm tra quyền, origin, validation, lưu thật, phân trang, cô lập user và thống kê; dọn tài khoản và lịch sử sau khi chạy. Không chạy với production.

## Hợp đồng tích hợp với thành viên 3

`userId` là UUID User trong Neo4j; `placeId` là chuỗi ObjectId MongoDB. `place_view` phản ánh quan tâm ngầm, không đồng nghĩa yêu thích hay đánh giá. Thành viên 3 có thể đọc lịch sử từng user/ngày ở server để tạo trọng số cho graph/thuật toán đề xuất. API hiện tại chỉ phục vụ chính người đăng nhập; chưa có endpoint xuất dữ liệu toàn bộ user.

Phần Cassandra có thể demo độc lập với thuật toán. Demo tích hợp cuối cần thêm thuật toán Neo4j, dữ liệu thật và kết quả thực nghiệm của cả nhóm. Chưa coi báo cáo cuối hay thuật toán đề xuất là hoàn thành chỉ vì có module này.

Driver dùng prepared statements và kết nối dùng chung theo [tài liệu Apache Cassandra Node.js driver](https://github.com/apache/cassandra-nodejs-driver).

## Kết quả kiểm tra ngày 24/10/2026

- Lint và kiểm tra TypeScript: đạt; production build Next.js 16.4.3: đạt.
- Unit tests: 34/34 đạt, bao gồm validation sự kiện/cursor, ngày UTC qua năm mới và xếp hạng hành vi.
- `test:activity`: đạt trên Neo4j, Redis, Cassandra 5 và MongoDB 8.3.8 local. Kiểm tra lưu/đọc thật, cursor không trùng, quyền truy cập, same-origin, cô lập hai user, metadata địa điểm từ server và thống kê.
- Khởi tạo schema Cassandra hai lần: đạt, không xóa dữ liệu.
- Dependency được cập nhật trong các dải phiên bản tương thích đã khai báo; npm báo 0 vulnerabilities sau cập nhật.
- MongoDB phục vụ kiểm thử dùng container riêng tại cổng 27018; không dùng dữ liệu MongoDB hiện có của dự án.
- Kiểm tra giao diện thực tế: tìm “biển”, mở Bãi biển Mỹ Khê, trang lịch sử ghi đúng 1 lượt tìm và 1 lượt xem, khu vực quan tâm Đà Nẵng. Trạng thái lỗi khi Cassandra chưa chạy cũng đã kiểm tra. Tài khoản, lịch sử và container MongoDB thử đã được dọn.

Đây là kết quả chức năng trên môi trường local, chưa phải đo tải hoặc benchmark Cassandra. Không suy ra hiệu năng production từ các kiểm tra này.
