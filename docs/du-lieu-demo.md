# Dữ liệu người dùng và tương tác demo

30 tài khoản người dùng hư cấu có tên tự nhiên, dùng địa chỉ nội bộ `@wandora.local`. Giữ nguyên tài khoản admin. Mật khẩu chung theo yêu cầu: `NoSql@123456789`.

- 100 đánh giá có bình luận (mỗi cặp người dùng–địa điểm duy nhất).
- 1.000 hoạt động trong 21 ngày: 800 lượt xem, 200 lượt tìm kiếm.
- 5 nhóm sở thích, mỗi nhóm 6 người. Không phải dữ liệu khảo sát thực tế.
- Cassandra giữ sự kiện; Neo4j lưu VIEWED/SEARCHED_FOR được tổng hợp từ chính các sự kiện này, cùng LIKED/RATED.
- Gợi ý cộng tác dùng độ giao nhau giữa người dùng; thích trọng số 3, đánh giá tích cực 2, xem 1. Đánh giá dưới 4 không là tín hiệu tích cực.
- Không gợi ý lại địa điểm đã xem/thích/đánh giá. Có dự phòng theo tiện ích, danh mục và danh sách phổ biến.

| Họ tên | Email | Sở thích |
|---|---|---|
| Nguyễn Minh Anh | nguyen.minh.anh@wandora.local | Nghỉ dưỡng biển |
| Trần Hoàng Nam | tran.hoang.nam@wandora.local | Nghỉ dưỡng biển |
| Lê Thu Hà | le.thu.ha@wandora.local | Nghỉ dưỡng biển |
| Phạm Quỳnh Mai | pham.quynh.mai@wandora.local | Nghỉ dưỡng biển |
| Võ Đức Huy | vo.duc.huy@wandora.local | Nghỉ dưỡng biển |
| Đặng Ngọc Linh | dang.ngoc.linh@wandora.local | Nghỉ dưỡng biển |
| Bùi Anh Tuấn | bui.anh.tuan@wandora.local | Thiên nhiên và leo núi |
| Đỗ Khánh Vy | do.khanh.vy@wandora.local | Thiên nhiên và leo núi |
| Ngô Hải Đăng | ngo.hai.dang@wandora.local | Thiên nhiên và leo núi |
| Dương Thảo Nguyên | duong.thao.nguyen@wandora.local | Thiên nhiên và leo núi |
| Hồ Gia Bảo | ho.gia.bao@wandora.local | Thiên nhiên và leo núi |
| Vũ Thanh Trúc | vu.thanh.truc@wandora.local | Thiên nhiên và leo núi |
| Nguyễn Phương Thảo | nguyen.phuong.thao@wandora.local | Văn hóa và di sản |
| Trần Quốc Bảo | tran.quoc.bao@wandora.local | Văn hóa và di sản |
| Lê Hoài An | le.hoai.an@wandora.local | Văn hóa và di sản |
| Phạm Minh Khang | pham.minh.khang@wandora.local | Văn hóa và di sản |
| Võ Ngọc Hân | vo.ngoc.han@wandora.local | Văn hóa và di sản |
| Đặng Tuấn Kiệt | dang.tuan.kiet@wandora.local | Văn hóa và di sản |
| Bùi Hà My | bui.ha.my@wandora.local | Ẩm thực và thành phố |
| Đỗ Nhật Minh | do.nhat.minh@wandora.local | Ẩm thực và thành phố |
| Ngô Bảo Châu | ngo.bao.chau@wandora.local | Ẩm thực và thành phố |
| Dương Đức Phúc | duong.duc.phuc@wandora.local | Ẩm thực và thành phố |
| Hồ Thanh Tâm | ho.thanh.tam@wandora.local | Ẩm thực và thành phố |
| Vũ Khánh Linh | vu.khanh.linh@wandora.local | Ẩm thực và thành phố |
| Nguyễn Gia Hân | nguyen.gia.han@wandora.local | Du lịch gia đình |
| Trần Anh Dũng | tran.anh.dung@wandora.local | Du lịch gia đình |
| Lê Ngọc Ánh | le.ngoc.anh@wandora.local | Du lịch gia đình |
| Phạm Đức Anh | pham.duc.anh@wandora.local | Du lịch gia đình |
| Võ Thùy Dương | vo.thuy.duong@wandora.local | Du lịch gia đình |
| Đặng Hoàng Long | dang.hoang.long@wandora.local | Du lịch gia đình |

Chạy lại (thay dữ liệu cũ, tự sao lưu trước): `npm run db:seed-interactions -- --reset`.
Khai thác lại lịch sử hiện có: `npm run db:mine-activity`.
