# Kịch bản thuyết trình Beta Cinemas

**Thời lượng dự kiến:** 4–5 phút, gồm demo. Nội dung checkout được mô tả đúng là mô phỏng; đơn cần Admin xác nhận.

## Slide 1 — Giới thiệu dự án

Xin chào thầy cô và các bạn. Nhóm em xin giới thiệu dự án Beta Cinemas, một website đặt vé xem phim trực tuyến.

Mục tiêu của website là giúp khán giả tìm phim, xem lịch chiếu và chọn vé thuận tiện hơn. Dự án gồm 14 trang, kết nối với REST API và được triển khai trên Vercel.

Ngoài khách hàng, hệ thống còn có phần dành cho Admin để xử lý đơn và check-in vé. Nhóm hiện gồm Nguyễn Văn Trọng, Vũ Tiến Lập và Phạm Anh Duy. Sau đây, em xin giới thiệu các chức năng chính.

## Slide 2 — Chức năng chính

Đầu tiên là phần phim. Người dùng có thể xem danh sách phim và trailer. Tiếp theo là lịch chiếu, nơi người dùng chọn rạp, ngày và suất phù hợp.

Khi đặt vé, website hiển thị sơ đồ 152 ghế. Người dùng đăng nhập để tiếp tục và ghế được giữ trong năm phút. Sau đó, khách có thể chọn combo bắp nước và nhập voucher. Server sẽ kiểm tra mã giảm giá.

Ở bước cuối, hệ thống tạo đơn và vé QR. Thanh toán hiện đang mô phỏng, nên đơn cần Admin xác nhận trước khi khách dùng vé để check-in. Website cũng có trang thành viên để xem điểm và voucher.

## Slide 3 — Phạm vi MVP

Nhóm tập trung hoàn thiện luồng đặt vé cơ bản: chọn phim, chọn suất, đăng nhập, chọn ghế, chọn combo và tạo đơn.

Trong phạm vi hiện tại, hệ thống đã có các trang chính, chức năng giữ ghế, kiểm tra voucher và điểm, cùng phần Admin xác nhận đơn và check-in.

Một số tính năng vẫn đang để ở dạng mô phỏng. Dự án chưa kết nối cổng thanh toán thật, chưa tự gửi vé qua email hoặc SMS và chưa dùng cơ sở dữ liệu production bền vững. Vì vậy, bản hiện tại phù hợp để trình diễn luồng nghiệp vụ; trước khi đưa vào sử dụng thật cần hoàn thiện các phần này.

## Slide 4 — Giải pháp kỹ thuật

Về giao diện, nhóm dùng Vite MPA, SCSS và JavaScript. Backend dùng Bun; REST API được cung cấp qua json-server. Phần xác thực dùng JWT và hỗ trợ phân quyền tài khoản User với Admin.

Dữ liệu demo gồm phim, rạp, lịch chiếu, combo, đơn vé và tài khoản thành viên. Các phần giao diện gọi API thông qua những module dùng chung để hiển thị dữ liệu và cập nhật trạng thái.

Khu vực Admin có năm tab, tập trung vào việc quản lý đơn và check-in. Cách chia này giúp khách hàng thao tác trên các trang đặt vé, còn nhân viên xử lý nghiệp vụ ở khu vực quản trị.

## Slide 5 — Demo đặt vé

Sau đây nhóm em xin demo một lượt đặt vé.

Trước tiên, em tìm bộ phim muốn xem, sau đó chọn rạp, ngày và suất chiếu. Ở bước chọn ghế, em đăng nhập rồi chọn ghế còn trống. Hệ thống sẽ giữ ghế trong năm phút để hoàn tất đơn.

Tiếp theo, em chọn combo và nhập voucher nếu có. Website gửi thông tin lên server để kiểm tra điều kiện áp dụng. Sau khi xác nhận thông tin, em tiếp tục checkout. Vì thanh toán thật chưa được tích hợp, hệ thống tạo đơn ở trạng thái chờ Admin xác nhận.

Admin mở khu vực quản trị để xác nhận đơn. Khi vé đã sẵn sàng, mã QR được dùng cho bước check-in. Như vậy, demo vừa rồi đi qua các bước chính từ chọn phim đến nhận vé.

## Slide 6 — Nhóm và hướng phát triển

Về phân công, Nguyễn Văn Trọng phụ trách kiến trúc hệ thống, API, xác thực và triển khai. Vũ Tiến Lập phụ trách các trang checkout, combo, bảng giá, tin tức và rạp. Phạm Anh Duy phụ trách đặt ghế, giữ chỗ, voucher, thành viên và công cụ Admin.

Một khó khăn của dự án là giữ trạng thái ghế và đơn nhất quán giữa giao diện và server. Nhóm xử lý bằng cách để server xác nhận các thao tác quan trọng như giữ ghế và tạo đơn, sau đó giao diện tải lại trạng thái từ API.

Trong giai đoạn tiếp theo, nhóm muốn tích hợp cổng thanh toán thật, lưu dữ liệu production ổn định, gửi vé qua email hoặc SMS và bổ sung công cụ quản lý sơ đồ phòng chiếu, ưu đãi.

Phần trình bày của nhóm em đến đây là hết. Cảm ơn thầy cô và các bạn đã lắng nghe. Nhóm em xin nhận câu hỏi.
