# Wandora implementation plan

## Source review

`bao_cao_nosql.docx` là khung báo cáo đồ án “Hệ thống quản lý và đề xuất địa điểm du lịch”, nhóm 404. Tài liệu có tiêu đề chương, mục và bảng phân công nhưng phần nội dung, schema, yêu cầu chức năng chi tiết và kết quả thực nghiệm chưa được điền. Không coi các tiêu đề kiểm thử hoặc kết quả trong khung báo cáo là chức năng đã triển khai.

Ảnh hội thoại được cung cấp làm bối cảnh: Next.js cho frontend/backend; tham khảo Bulletproof React; admin tạo user trong Neo4j; refresh token trong Redis 7 ngày và xoay vòng; access token 1 giờ. CRUD địa điểm/khách sạn/nhà hàng và Cassandra là phần sau khởi tạo. Tên dự án Wandora theo yêu cầu trực tiếp của người dùng.

## Initial decisions

- Một ứng dụng Next.js App Router với Route Handlers, không tách backend service ở giai đoạn đầu.
- Feature boundaries theo [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md): shared → features → app; imports trực tiếp vào module.
- Neo4j: user, role; sau này mở rộng quan hệ user, địa điểm và gợi ý.
- Redis: refresh sessions và login throttling; sau này cache truy vấn.
- MongoDB: dự kiến dữ liệu địa điểm, khách sạn, nhà hàng và metadata dịch vụ. Chưa chốt schema.
- Cassandra: dự kiến lịch sử hoạt động và sự kiện theo user/time. Chưa chốt partition key hoặc query patterns.
- Auth TTL sliding 7 ngày sau mỗi refresh là giả định triển khai; có thể bổ sung giới hạn tuổi phiên tuyệt đối theo yêu cầu nhóm.
- UI starter: Geist, white #FFFFFF, ink #163047, ocean #075985, surface #F1F7FA, muted #516579; login split layout và admin form, responsive. Không dựng dữ liệu địa điểm giả.

## Next milestones

> Cập nhật triển khai: MongoDB CRUD và Redis cache đã có. Cassandra đã có module lịch sử, thống kê cá nhân, trang `/activity`, script khởi tạo và kiểm thử. Xem `docs/activity-cassandra.md`. Danh sách dưới đây giữ lại quyết định ban đầu; phần thuật toán đề xuất và demo tích hợp toàn hệ thống vẫn cần hoàn thiện.

1. Chốt schema và quyền CRUD địa điểm/dịch vụ; thêm MongoDB repository và API có pagination/filter.
2. Định nghĩa event và query patterns Cassandra trước khi thiết kế bảng.
3. Thiết kế các quan hệ Neo4j và thuật toán gợi ý từ dữ liệu thật.
4. Thêm search caching Redis và phép đo cache/no cache theo chương 5.
5. Bổ sung quản lý tài khoản: reset password, disable user, audit log và revocation tất cả session.

Tài liệu nguồn được giữ nguyên. Remote GitHub: https://github.com/dangduyminh109/wandora.git; chỉ cấu hình local, chưa push.
