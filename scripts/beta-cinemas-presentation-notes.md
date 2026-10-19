# Lời thuyết trình Beta Cinemas

**Thời lượng dự kiến:** 4–5 phút, gồm phần demo ở slide 5.  
**Lưu ý khi trình bày:** Checkout hiện mô phỏng; đơn cần Admin xác nhận trước khi check-in.

## Slide 1 — Giới thiệu dự án (30–40 giây)

Xin chào thầy cô và các bạn. Nhóm em xin giới thiệu Beta Cinemas, một website hỗ trợ khách hàng tìm phim, xem lịch và đặt vé trực tuyến. Dự án hiện có 14 trang MPA, kết nối REST API và được triển khai trên Vercel. Khách hàng có thể chọn ghế, dùng voucher và theo dõi vé; phía nhân viên có thể xử lý đơn và check-in. Nhóm hiện gồm Nguyễn Văn Trọng, Vũ Tiến Lập và Phạm Anh Duy.

## Slide 2 — Các chức năng chính (35–45 giây)

Website có sáu nhóm chức năng. Khách có thể tìm phim và xem trailer, sau đó chọn lịch ở một trong mười cụm rạp. Khi đặt vé, hệ thống hiển thị sơ đồ 152 ghế và giữ chỗ trong năm phút. Người dùng có thể chọn combo và nhập voucher; phía server kiểm tra điều kiện mã. Checkout đang là mô phỏng, nên đơn sẽ ở trạng thái chờ Admin xác nhận. Sau khi được xác nhận, vé QR dùng cho bước check-in.

## Slide 3 — Phạm vi MVP (40–50 giây)

MVP tập trung vào luồng cốt lõi từ chọn phim đến nhận vé. Nhóm đã hoàn thành 14 trên 14 trang, API giữ ghế và xử lý voucher, điểm; các thao tác Admin gồm xác nhận đơn và check-in. Phần chưa có là cổng thanh toán thật, gửi vé qua email hoặc SMS, và cơ sở dữ liệu production bền vững. Nhóm chủ động để các tính năng ngoài luồng đặt vé chính sang giai đoạn sau.

## Slide 4 — Giải pháp và kiến trúc (35–45 giây)

Về kỹ thuật, giao diện dùng Vite MPA, SCSS và JavaScript thuần. Bun hỗ trợ backend và công cụ dự án; json-server cung cấp REST API, còn json-server-auth xử lý JWT và phân quyền. Dữ liệu demo gồm phim, rạp, lịch chiếu, combo, vé và hội viên. Mã giao diện dùng api.js và storage.js để làm việc với API. Phần quản trị có năm tab phục vụ duyệt đơn và check-in.

## Slide 5 — Demo luồng đặt vé (60–90 giây)

Sau đây nhóm xin demo luồng chính. Đầu tiên, em tìm một bộ phim, chọn rạp, ngày và suất chiếu. Tiếp theo, em đăng nhập rồi chọn ghế; hệ thống giữ ghế trong năm phút. Em có thể thêm combo và nhập voucher để server kiểm tra. Khi checkout, hệ thống tạo đơn chờ xác nhận vì thanh toán hiện đang mô phỏng. Admin xác nhận đơn, sau đó vé QR sẵn sàng cho check-in. Nếu còn thời gian, nhóm sẽ xem nhanh hồ sơ hội viên và các tab Admin.

## Slide 6 — Nhóm và hướng phát triển (35–45 giây)

Trong nhóm, Nguyễn Văn Trọng phụ trách kiến trúc, API, xác thực và triển khai. Vũ Tiến Lập phụ trách các phần giao diện checkout, combo, bảng giá, tin tức và rạp. Phạm Anh Duy phụ trách đặt ghế, giữ chỗ, voucher, hội viên và công cụ Admin. Khó khăn chính là giữ trạng thái ghế và đơn nhất quán giữa giao diện với API; nhóm xử lý bằng việc để server xác nhận thao tác quan trọng và đồng bộ dữ liệu qua các module API. Tiếp theo, nhóm dự kiến tích hợp thanh toán thật, lưu dữ liệu production, gửi vé tự động và mở rộng công cụ quản trị. Cảm ơn thầy cô và các bạn đã lắng nghe.
