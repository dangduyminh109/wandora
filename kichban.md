# Kịch bản demo đồ án Wandora – Nhóm 404

**Đề tài:** Hệ thống quản lý và đề xuất địa điểm du lịch (Wandora)
**Giảng viên:** ThS. Ngô Minh Anh Thư
**Tổng thời lượng:** khoảng 25–30 phút

| Thứ tự | Thành viên | Phần trình bày | CSDL | Thời lượng |
|---|---|---|---|---|
| 0 | Đặng Duy Minh | Mở đầu: giới thiệu, kiến trúc | Cả 4 | 3 phút |
| 1 | Hồ Du Kỵ | Dữ liệu địa điểm/dịch vụ, CRUD, tìm kiếm, lọc, Redis cache | MongoDB, Redis | 10 phút |
| 2 | Đặng Duy Minh | Lịch sử hoạt động, phân tích hành vi | Cassandra | 6 phút |
| 3 | Phạm Thị Lan Thanh | Quan hệ du lịch, đánh giá, yêu thích, đề xuất | Neo4j | 8 phút |
| 4 | Đặng Duy Minh | Kiểm thử, kết luận | Cả 4 | 3 phút |

---

## A. Chuẩn bị chung (làm trước giờ demo, cả nhóm)

### A.1. Khởi động hạ tầng
```powershell
docker compose --env-file .env.local --profile travel --profile analytics up -d
docker ps --format "{{.Names}} {{.Status}}"
```
Phải thấy đủ 5 container đang chạy: `wandora-mongodb-1`, `wandora-redis-1`, `wandora-neo4j-1`, `wandora-cassandra-1`, `wandora-mailpit-1`. Cassandra khởi động chậm (1–2 phút), nên bật sớm.

> Phải có `--env-file .env.local`, nếu không compose báo thiếu `NEO4J_PASSWORD`.

### A.2. Khởi tạo dữ liệu (chỉ chạy một lần, an toàn khi chạy lại)
```powershell
npm run db:seed              # tài khoản admin
npm run db:mongo-indexes     # index MongoDB
npm run db:seed-travel       # địa điểm, khách sạn, nhà hàng, dịch vụ mẫu
npm run db:init-cassandra    # keyspace + bảng Cassandra
npm run db:sync-neo4j        # đồng bộ địa điểm từ MongoDB sang Neo4j
npm run db:seed-interactions # người dùng mẫu + yêu thích + đánh giá (cho phần đề xuất)
```
`.env.local` cần có đủ `CASSANDRA_KEYSPACE=wandora`.

### A.3. Chạy ứng dụng
```powershell
npm run dev        # http://localhost:3000
```
Nếu lần đầu bị lỗi "Redis connection failed" thì Redis chưa chạy, kiểm tra lại A.1 rồi khởi động lại `npm run dev`.

### A.4. Tài khoản dùng khi demo
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@wandora.local` | `Admin@123456` |
| Người dùng mẫu (có dữ liệu tương tác) | `thanh.traveler@wandora.local` | `Password123456@` |
| Người dùng mẫu | `minh.explorer@wandora.local` | `Password123456@` |
| Người dùng mẫu | `ky.adventurer@wandora.local` | `Password123456@` |
| Người dùng mẫu | `huong.backpacker@wandora.local` | `Password123456@` |

Mật khẩu admin lấy từ `.env.local` (`SEED_ADMIN_PASSWORD`), nếu đã đổi thì dùng giá trị mới.

### A.5. Kết nối DBCode
| CSDL | Cấu hình |
|---|---|
| MongoDB | `mongodb://localhost:27017/wandora` (không cần tài khoản) |
| Redis | `redis://localhost:6379` (không có mật khẩu) |
| Neo4j | Host `localhost`, cổng `7687`, giao thức `bolt://`, user `neo4j`, mật khẩu theo `NEO4J_PASSWORD` trong `.env.local`, database `neo4j` |
| Cassandra | Host `localhost`, cổng `9042`, datacenter `datacenter1`, keyspace `wandora`, không cần xác thực |

Nếu DBCode không hỗ trợ sẵn Cassandra, dùng terminal: `docker exec -it wandora-cassandra-1 cqlsh`.

### A.6. Bố trí màn hình và dự phòng
- Trình duyệt: hai cửa sổ ẩn danh riêng, một cho admin và một cho người dùng, để khỏi phải đăng xuất liên tục.
- DevTools → Network → lọc Fetch/XHR, để thấy header `X-Cache`.
- Chạy thử toàn bộ kịch bản một lượt trước giờ demo.
- Chụp sẵn ảnh màn hình các kết quả quan trọng (bảng `bench:cache`, đồ thị Neo4j, bảng Cassandra) phòng khi mạng hoặc máy chậm.
- **Không** chạy `npm run db:seed-travel -- --reset` khi demo: lệnh này xóa toàn bộ dữ liệu du lịch.

---

## B. Mở đầu (Đặng Duy Minh, 3 phút)

**Nói:**
> "Nhóm em xin trình bày đề tài Wandora, hệ thống quản lý và đề xuất địa điểm du lịch. Bài toán có bốn kiểu dữ liệu khác nhau: thông tin địa điểm linh hoạt, lịch sử hoạt động ghi nhiều, quan hệ giữa người dùng và địa điểm, và phản hồi tức thời. Vì vậy nhóm dùng bốn CSDL NoSQL, mỗi loại làm đúng thế mạnh của nó."

**Chiếu bảng vai trò (mục 3.1 trong tài liệu):**

| CSDL | Loại | Đảm nhận | Người phụ trách |
|---|---|---|---|
| MongoDB 8 | Document | Địa điểm, khách sạn, nhà hàng, dịch vụ, đánh giá | Hồ Du Kỵ |
| Redis 7 | Key-Value | Phiên đăng nhập, giới hạn tần suất, cache tìm kiếm | Hồ Du Kỵ |
| Cassandra 5 | Column Family | Lịch sử xem, tìm kiếm theo người dùng và thời gian | Đặng Duy Minh |
| Neo4j 5.26 | Graph | Tài khoản, quan hệ người dùng – địa điểm – danh mục – vùng | Phạm Thị Lan Thanh |

**Nêu nguyên tắc đồng bộ (mục 3.3):**
- MongoDB là nguồn dữ liệu gốc của địa điểm. Khi tạo/sửa/xóa, hệ thống ghi MongoDB trước, rồi cập nhật nút trong Neo4j và xóa cache Redis.
- Hành vi người dùng ghi sang Cassandra không chặn luồng chính.
- Giữa các CSDL là nhất quán cuối cùng, có script đối soát.

**Mở trình duyệt, đi một vòng ngắn:**
1. Trang chủ `/` (khách chưa đăng nhập): thấy số liệu thống kê và địa điểm nổi bật.
2. Chuyển lời: "Phần đầu là dữ liệu địa điểm và cache, bạn Kỵ sẽ trình bày."

---

## C. Phần 1 – MongoDB và Redis cache (Hồ Du Kỵ, 10 phút)

Bám theo FR05, FR06, FR07, FR09, FR10 và mục 5.1 của tài liệu.

### C.1. Mô hình dữ liệu trong MongoDB (2 phút)
Mở DBCode, database `wandora`:
1. Nêu 5 collection: `places`, `hotels`, `restaurants`, `services`, `reviews`.
2. Mở một document `places`, chỉ các trường: `name`, `slug`, `category`, `region`, `location` (GeoJSON), `tags`, `ratingAvg`.
3. Mở một document `hotels`, chỉ `placeId` (tham chiếu về `places`) và `priceLevel`.
4. Mở tab Indexes của `places`, giải thích từng index:
   - `text (name, description, tags)`: tìm theo từ khóa.
   - `2dsphere (location)`: truy vấn theo vị trí.
   - `(category, region)`: lọc kết hợp.
   - `slug` unique: đường dẫn thân thiện, không trùng.
   - `ratingAvg`: sắp xếp theo đánh giá.
5. Chốt: "Dữ liệu địa điểm linh hoạt, lồng nhau và có tọa độ nên Document Store phù hợp hơn bảng quan hệ."

### C.2. CRUD địa điểm (2 phút) – FR05, FR07
Đăng nhập admin, vào **Admin → Địa điểm** (`/admin/places`):
1. **Create:** tạo địa điểm mới (tên, danh mục, vùng, tọa độ, thẻ). Qua DBCode làm mới collection `places`, thấy document mới có `slug` tự sinh. Nếu trùng tên thì hệ thống thêm hậu tố `-2`, `-3`.
2. **Read:** mở `/explore/<slug>`, trang chi tiết có kèm khách sạn, nhà hàng, dịch vụ của địa điểm.
3. **Update:** sửa mô tả, qua DBCode thấy `updatedAt` đổi.
4. **Validate:** bỏ trống tên hoặc nhập tọa độ sai, form báo lỗi tiếng Việt (Zod kiểm tra cả client và server).
5. **Delete:** xóa địa điểm vừa tạo. Nhấn mạnh việc xóa kèm dữ liệu con (hotels, restaurants, services, reviews) để không bị mồ côi. Kiểm tra lại trong DBCode.
6. **Đồng bộ sang Neo4j:** sau khi tạo/sửa, mở Neo4j Browser (http://localhost:7474) chạy `MATCH (p:Place) RETURN p.name, p.category, p.region ORDER BY p.name LIMIT 5` để thấy nút tương ứng. Nếu bước đồng bộ Neo4j lỗi, hệ thống chỉ ghi log và thao tác chính vẫn thành công (nhất quán cuối cùng).

### C.3. CRUD khách sạn, nhà hàng, dịch vụ (1 phút) – FR06
Vào **Admin → Khách sạn** (tương tự nhà hàng, dịch vụ):
- Thêm một khách sạn gắn với địa điểm (ô chọn địa điểm có gợi ý theo tên).
- Chỉ thuộc tính riêng theo loại: khách sạn và nhà hàng có `priceLevel` từ 1 đến 4, dịch vụ có `type`.
- Dùng ô tìm kiếm, sắp xếp theo tên hoặc mức giá, và phân trang.

### C.4. Tìm kiếm và lọc (2 phút) – FR09
Vào **Khám phá** (`/explore`):
1. Tìm `biển`, rồi `hang động`. Giải thích: dùng text index, xếp theo độ liên quan (`textScore`).
2. Lọc danh mục + vùng (ví dụ Biển + Đà Nẵng) và đánh giá tối thiểu ≥ 4. Đổi cách sắp xếp, chuyển trang.
3. Qua DBCode chạy truy vấn tương ứng:
   ```js
   db.places.find({ $text: { $search: "biển" } })
   db.places.find({ category: "beach", region: "Đà Nẵng", ratingAvg: { $gte: 4 } })
     .explain("executionStats")
   ```
   Chỉ `IXSCAN` trong `winningPlan` để chứng minh dùng index, không quét toàn bộ (`COLLSCAN`).

### C.5. Redis cache (2 phút) – FR10
1. Ở tab Network, gọi một tìm kiếm lần đầu: header `X-Cache: MISS`. Tải lại cùng truy vấn: `X-Cache: HIT`.
2. Ở terminal:
   ```powershell
   docker exec -it wandora-redis-1 redis-cli
   KEYS cache:*
   TTL <một khóa bất kỳ>
   ```
   Khóa có dạng `cache:v<phiên bản>:places:search:<băm tham số>`, TTL mặc định 300 giây.
3. **Vô hiệu hóa khi dữ liệu đổi:** sửa một địa điểm rồi tìm lại, `X-Cache` về `MISS`. Giải thích: mỗi lần ghi tăng `cache:catalog:version`, mọi khóa cũ tự mất hiệu lực.
4. **Chịu lỗi (fail-open):** nói bằng lời rằng khi Redis lỗi, hệ thống bỏ qua cache và đọc thẳng MongoDB. Nếu muốn demo thật bằng `docker stop wandora-redis-1`, lưu ý đăng nhập mới và ghi hoạt động cũng cần Redis, nên chỉ làm khi đã đăng nhập sẵn rồi `docker start wandora-redis-1` ngay.

### C.6. Số liệu có/không cache (1 phút)
```powershell
npm run bench:cache
```
Bảng kết quả gồm thời gian trung bình và P95, có và không cache, và số lần nhanh hơn. Chạy trước một lần và chụp ảnh phòng khi máy chậm.
**Chốt:** "Cache giảm độ trễ và giảm tải cho MongoDB ở các truy vấn lặp lại."

**Chuyển lời:** "Tiếp theo, bạn Minh sẽ trình bày phần ghi nhận lịch sử và phân tích hành vi."

### Câu hỏi có thể gặp (Kỵ)
| Câu hỏi | Gợi ý trả lời |
|---|---|
| Vì sao tách hotels/restaurants/services khỏi `places`? | Số lượng lớn, cập nhật độc lập, truy vấn riêng theo `priceLevel` hoặc `type`; liên kết bằng `placeId`. |
| Vì sao không nhúng review vào `places`? | Review tăng không giới hạn, tránh document phình to; có index `(placeId, userId)` unique để mỗi người chỉ một đánh giá. |
| Index 2dsphere dùng làm gì? | Hỗ trợ `$near`, `$geoWithin` theo tọa độ. Giao diện hiện chưa dùng, nên nói thật là đã chuẩn bị sẵn để mở rộng. |
| Cache có thể lỗi thời không? | Có TTL 300 giây và cơ chế version tăng sau mỗi lần ghi. |
| Nếu Redis chết? | Hệ thống bỏ qua cache và đọc MongoDB, chỉ chậm hơn, không hỏng. |

---

## D. Phần 2 – Cassandra: lịch sử và phân tích hành vi (Đặng Duy Minh, 6 phút)

Bám theo FR11, FR12.

### D.1. Mô hình dữ liệu Cassandra (1,5 phút)
Mở `docker exec -it wandora-cassandra-1 cqlsh` (hoặc DBCode):
```sql
DESCRIBE KEYSPACE wandora;
```
Chỉ bảng `activity_by_user_day`:
- **Partition key** `(user_id, day)`: mỗi người dùng mỗi ngày là một phân vùng, nên đọc lịch sử một ngày chỉ chạm một phân vùng và phân vùng không phình vô hạn.
- **Clustering key** `event_id` (timeuuid) sắp xếp **giảm dần**: sự kiện mới nhất đọc đầu tiên.
- **TTL 90 ngày** (`default_time_to_live = 7776000`): dữ liệu tự hết hạn.
- Thiết kế theo truy vấn (query-driven): truy vấn chính là "lấy lịch sử của một người dùng trong một ngày".

> **Lưu ý trung thực:** tài liệu mô tả sơ bộ hai bảng `user_activity_by_user` và `place_views_by_day`. Bản cài đặt gộp lại thành một bảng `activity_by_user_day`, và các thống kê (lượt xem, địa điểm phổ biến) được tính từ bảng này trong tầng ứng dụng, chứ chưa có bảng bộ đếm riêng. Nếu giảng viên hỏi, nói rõ đây là thay đổi thiết kế có chủ đích để đơn giản hóa và nêu như một hướng mở rộng.

### D.2. Ghi nhận hoạt động (2 phút) – FR11
Trong cửa sổ người dùng (đăng nhập `minh.explorer@wandora.local`):
1. Vào `/explore`, gõ từ khóa tìm kiếm (ví dụ `biển`). Sự kiện **search** được ghi sau khi ngừng gõ (debounce) để không ghi từng phím.
2. Mở 2–3 trang chi tiết địa điểm khác nhau. Mỗi lần mở ghi sự kiện **place_view**.
3. Quay lại cqlsh, truy vấn bằng đúng khóa phân vùng (cần `user_id` và `day`):
   ```sql
   -- Lấy user_id từ Neo4j: MATCH (u:User {email:'minh.explorer@wandora.local'}) RETURN u.id
   SELECT type, label, category, region, occurred_at
   FROM wandora.activity_by_user_day
   WHERE user_id = '<id>' AND day = '<YYYY-MM-DD hôm nay>';
   ```
   Thấy các sự kiện vừa tạo, mới nhất ở trên cùng.
4. Chỉ TTL: `SELECT label, TTL(label) FROM wandora.activity_by_user_day WHERE user_id='<id>' AND day='<ngày>' LIMIT 1;` thấy số giây còn lại, khoảng 90 ngày.
5. Nêu hai điểm thiết kế an toàn: ghi sự kiện **không chặn** luồng người dùng, và có **giới hạn tần suất 120 sự kiện/phút/người dùng** (dùng Redis, trả mã 429 khi vượt).

### D.3. Lịch sử và phân tích hành vi (2,5 phút) – FR12
Vào **Lịch sử hoạt động** (`/activity`):
1. Chọn ngày, xem danh sách sự kiện theo ngày, có nút tải thêm (phân trang theo `event_id`, không dùng OFFSET).
2. Thẻ **"Hoạt động trong 7 ngày qua"**: tổng số, lượt xem, lượt tìm kiếm, top địa điểm, top danh mục, top vùng, top từ khóa tìm kiếm.
3. Giải thích cách tính: hệ thống đọc 7 phân vùng (một phân vùng mỗi ngày), gộp và xếp hạng. Đây là lý do thiết kế phân vùng theo ngày: đọc nhanh, giới hạn tối đa 1000 sự kiện/ngày để không bị quá tải.
4. Vào `/dashboard`: các "tìm kiếm hàng đầu" lấy từ cùng nguồn Cassandra.
5. Đăng nhập admin, vào `/admin`: thẻ số lượng hoạt động (7 ngày) hiển thị trên trang quản trị.

> **Giới hạn cần nói thẳng:** thống kê hiện tính **theo từng người dùng** (hoạt động của chính người đang đăng nhập). Chưa có thống kê tổng hợp toàn hệ thống như "địa điểm được xem nhiều nhất trên toàn site". Đó là hướng phát triển (thêm bảng bộ đếm `place_views_by_day` đúng như thiết kế sơ bộ).

**Chuyển lời:** "Phần cuối là quan hệ đồ thị và đề xuất, bạn Thanh trình bày."

### Câu hỏi có thể gặp (Minh)
| Câu hỏi | Gợi ý trả lời |
|---|---|
| Vì sao dùng Cassandra thay vì MongoDB cho lịch sử? | Ghi khối lượng lớn, truy vấn theo khóa phân vùng + thời gian, TTL tự dọn dữ liệu. |
| Vì sao phân vùng theo `(user_id, day)`? | Tránh phân vùng vô hạn của một người dùng lâu năm; đọc một ngày chạm đúng một phân vùng. |
| Vì sao dùng timeuuid? | Vừa duy nhất vừa có thứ tự thời gian, làm clustering key để lấy sự kiện mới nhất trước. |
| Cassandra có join, có truy vấn tùy ý không? | Không. Phải thiết kế bảng theo truy vấn; đây là đánh đổi để có hiệu năng ghi. |
| Một node thì tính nhất quán thế nào? | Môi trường demo chạy một node (hệ số nhân bản 1); triển khai thật sẽ tăng số node và hệ số nhân bản. |

---

## E. Phần 3 – Neo4j: quan hệ, đánh giá, yêu thích, đề xuất (Phạm Thị Lan Thanh, 8 phút)

Bám theo FR07, FR08, FR13, FR14.

### E.1. Mô hình đồ thị (2 phút)
Mở Neo4j Browser (http://localhost:7474) hoặc DBCode, chạy:
```cypher
// Đếm nút theo loại
MATCH (n) RETURN labels(n) AS loai, count(*) AS so_luong;

// Xem đồ thị quan hệ của một vài địa điểm
MATCH (p:Place)-[r:IN_CATEGORY|LOCATED_IN]->(x)
RETURN p, r, x LIMIT 25;
```
Giải thích:
- Nút: `(:User)`, `(:Place)`, `(:Category)`, `(:Region)`.
- Quan hệ: `(:Place)-[:IN_CATEGORY]->(:Category)`, `(:Place)-[:LOCATED_IN]->(:Region)`, `(:User)-[:LIKED]->(:Place)`, `(:User)-[:RATED]->(:Place)`.
- Neo4j chỉ giữ **nút tham chiếu** (id, tên, danh mục, vùng, điểm đánh giá). Dữ liệu đầy đủ nằm ở MongoDB, khi cần hiển thị thì lấy theo id.
- Ràng buộc duy nhất cho `Place.id`, `Category.name`, `Region.name`.

Chạy thêm một truy vấn quan hệ người dùng:
```cypher
MATCH (u:User)-[r:LIKED|RATED]->(p:Place)
RETURN u.name, type(r), p.name LIMIT 20;
```

### E.2. Yêu thích và đánh giá (2 phút) – FR08
Đăng nhập `thanh.traveler@wandora.local`:
1. Mở một địa điểm, bấm nút **Yêu thích**. Quay lại Neo4j chạy:
   ```cypher
   MATCH (u:User {email:'thanh.traveler@wandora.local'})-[r:LIKED]->(p:Place)
   RETURN p.name, r.createdAt ORDER BY r.createdAt DESC LIMIT 5;
   ```
   Thấy quan hệ `LIKED` mới. Bấm lần nữa thì quan hệ bị xóa (bật/tắt).
2. Vào `/favorites` xem danh sách yêu thích (thứ tự mới nhất trước).
3. Viết một **đánh giá** (1–5 sao và nhận xét) ở trang chi tiết. Qua DBCode chứng minh luồng ghi **ba nơi**:
   - MongoDB: collection `reviews` có bản ghi mới, `places.ratingAvg` và `ratingCount` được tính lại.
   - Neo4j: nút `Place` được cập nhật `ratingAvg`, `ratingCount`.
   - Redis: cache bị vô hiệu (khóa version tăng).
4. Nhắc: mỗi người dùng chỉ một đánh giá cho mỗi địa điểm (đánh giá lại thì cập nhật bản cũ).

### E.3. Đề xuất cá nhân hóa (2,5 phút) – FR13, FR14
Vào `/dashboard` của người dùng `thanh.traveler@wandora.local`, phần **"Gợi ý dành riêng cho bạn"**. Giải thích ba chiến lược theo thứ tự ưu tiên (có trong `recommendations.ts`):

1. **Lọc cộng tác (collaborative):** tìm người dùng có cùng địa điểm đã thích/đánh giá, rồi gợi ý các địa điểm họ thích mà bạn chưa có. Truy vấn Cypher đi qua 3 bước quan hệ:
   ```cypher
   MATCH (me:User {email:'thanh.traveler@wandora.local'})-[:LIKED|RATED]->(p:Place)
         <-[:LIKED|RATED]-(other:User)-[:LIKED|RATED]->(rec:Place)
   WHERE other <> me AND NOT (me)-[:LIKED|RATED]->(rec)
   RETURN rec.name, count(DISTINCT other) AS do_tuong_dong
   ORDER BY do_tuong_dong DESC, rec.ratingAvg DESC LIMIT 8;
   ```
   Chỉ dùng khi có đủ ứng viên (tối thiểu 4).
2. **Theo nội dung (content-based):** nếu chưa đủ dữ liệu cộng tác, gợi ý địa điểm cùng danh mục và cùng vùng với những nơi đã thích.
3. **Thịnh hành (cold start):** người dùng mới chưa có lịch sử thì gợi ý địa điểm được yêu thích và đánh giá cao nhất.

**Chứng minh cold start:** admin tạo một người dùng mới (`/admin/users/create`), đăng nhập bằng người đó, `/dashboard` hiển thị gợi ý thịnh hành. Sau khi người này thích vài địa điểm, tải lại sẽ chuyển sang chiến lược theo nội dung hoặc cộng tác.

### E.4. Địa điểm liên quan (1 phút) – FR14
Mở trang chi tiết một địa điểm, cuối trang có mục **địa điểm liên quan**. Truy vấn dựa trên cùng danh mục, cộng thêm điểm nếu cùng vùng, và điểm đánh giá:
```cypher
MATCH (cur:Place {slug:'<slug>'})-[:IN_CATEGORY]->(c)<-[:IN_CATEGORY]-(rec:Place)
WHERE rec <> cur
OPTIONAL MATCH (cur)-[:LOCATED_IN]->(r)<-[:LOCATED_IN]-(rec)
RETURN rec.name, count(r)*3 + coalesce(rec.ratingAvg,0) AS diem
ORDER BY diem DESC LIMIT 4;
```

**Chuyển lời:** "Cuối cùng, bạn Minh tổng kết phần kiểm thử và kết luận."

### Câu hỏi có thể gặp (Thanh)
| Câu hỏi | Gợi ý trả lời |
|---|---|
| Vì sao dùng đồ thị cho đề xuất? | Duyệt quan hệ nhiều bước (người dùng – địa điểm – người dùng khác – địa điểm) nhanh và truy vấn ngắn gọn; bảng quan hệ cần nhiều phép join. |
| Cold start xử lý thế nào? | Chiến lược thứ ba: gợi ý thịnh hành dựa trên số lượt thích, đánh giá và điểm trung bình. |
| Neo4j lệch với MongoDB thì sao? | Chạy `npm run db:sync-neo4j` để đồng bộ lại toàn bộ; ghi mới thì đồng bộ ngay và lỗi chỉ ghi log. |
| Vì sao Neo4j không lưu toàn bộ địa điểm? | Tránh nhân đôi dữ liệu; MongoDB là nguồn gốc, Neo4j chỉ giữ tham chiếu phục vụ quan hệ. |
| Độ chính xác đề xuất đo thế nào? | Dữ liệu mẫu còn nhỏ, nên chỉ kiểm thử bằng kịch bản có kết quả dự đoán được; đánh giá định lượng là hướng phát triển. |

---

## F. Kiểm thử và kết luận (Đặng Duy Minh, 3 phút)

### F.1. Kiểm thử tự động
```powershell
npm test            # kiểm thử đơn vị
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
```
Kết quả mong đợi: tất cả test đạt, không có lỗi kiểu và lint. Nếu thời gian ít thì chỉ chiếu kết quả đã chạy sẵn.

### F.2. Kiểm thử luồng xác thực (tùy chọn)
```powershell
npm run test:smoke      # đăng nhập, làm mới phiên, đăng xuất
npm run test:accounts   # quản lý tài khoản
```
Các script này cần ứng dụng và CSDL đang chạy. Chạy thử trước, chỉ trình chiếu nếu ổn định.

### F.3. Các điểm nhấn về bảo mật (mục 4.2)
- Mật khẩu băm scrypt có salt; cookie HttpOnly; kiểm tra Origin cho yêu cầu ghi.
- Phiên đăng nhập lưu băm refresh token trong Redis, xoay vòng bằng script Lua.
- Giới hạn tần suất: đăng nhập 10 lần/15 phút/email, quên mật khẩu 5 lần/15 phút/email.
- Phân quyền kiểm tra độc lập ở API, không chỉ ở giao diện (người dùng thường vào `/admin` sẽ nhận trang "Quyền truy cập giới hạn").

### F.4. Kết luận
> "Hệ thống đã hiện thực đủ bốn CSDL phối hợp: MongoDB giữ dữ liệu địa điểm, Redis cache và phiên, Cassandra ghi lịch sử, Neo4j quan hệ và đề xuất. Có số liệu so sánh có/không cache."

**Hạn chế (nói trước để giảng viên không phải hỏi):**
- Dữ liệu mẫu, quy mô nhỏ, chưa triển khai production.
- Thống kê hành vi tính theo từng người dùng, chưa có tổng hợp toàn hệ thống.
- Cassandra và các CSDL khác chạy một node.
- Chưa đo định lượng độ chính xác của thuật toán đề xuất.

**Hướng phát triển:** bảng bộ đếm lượt xem theo ngày, đề xuất kết hợp lịch sử Cassandra, cơ chế đối soát tự động, nhiều node.

---

## G. Xử lý sự cố nhanh

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Đăng nhập lỗi 503, log "Redis connection failed" | Container Redis chưa chạy | `docker compose --env-file .env.local --profile travel --profile analytics up -d`, rồi khởi động lại `npm run dev` |
| Compose báo thiếu `NEO4J_PASSWORD` | Thiếu `--env-file` | Thêm `--env-file .env.local` |
| `db:init-cassandra` báo "did not reply before timeout" | Cassandra đang khởi động | Đợi 1–2 phút, chạy lại |
| DBCode Neo4j báo "unauthorized" | Sai mật khẩu | Dùng đúng `NEO4J_PASSWORD` trong `.env.local` (không phải `JWT_SECRET`) |
| Trang đề xuất trống hoặc chỉ có thịnh hành | Chưa có dữ liệu tương tác | `npm run db:sync-neo4j` rồi `npm run db:seed-interactions` |
| `/activity` trống | Người dùng chưa có hoạt động hôm nay | Tìm kiếm và mở vài trang chi tiết, rồi tải lại; kiểm tra chọn đúng ngày (giờ UTC) |
| `X-Cache` luôn là MISS | Redis tắt, hoặc truy vấn khác nhau giữa các lần | Kiểm tra Redis đang chạy, gọi lại đúng cùng một truy vấn |
| Tìm kiếm không ra kết quả | Chưa có dữ liệu hoặc chưa tạo index | `npm run db:seed-travel` và `npm run db:mongo-indexes` |

## H. Danh sách kiểm tra trước giờ demo

- [ ] 5 container Docker đang chạy
- [ ] Đã chạy đủ các lệnh ở mục A.2 và `.env.local` có `CASSANDRA_KEYSPACE`
- [ ] `npm run dev` chạy không lỗi, đăng nhập được admin và người dùng mẫu
- [ ] Đã kết nối DBCode cho cả 4 CSDL
- [ ] Đã chạy `npm run bench:cache` và chụp ảnh kết quả
- [ ] Đã tạo sẵn hoạt động trên Cassandra (tìm kiếm, xem địa điểm) cho người dùng demo
- [ ] Đã chạy thử toàn bộ kịch bản một lượt
- [ ] Pin điện thoại/laptop đầy hoặc cắm sạc, tắt thông báo
