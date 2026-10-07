/* ==========================================================================
   BETA CINEMAS - INTERNATIONALIZATION (i18n) MODULE
   Comprehensive Bi-directional Translation Engine (Vietnamese <-> English)
   Universal across all 14 pages and dynamic components.
   ========================================================================== */

export const LANG_KEY = "beta_lang"

/**
 * Master Phrase Mapping (Vietnamese -> English)
 * Hand-curated to ensure authentic, professional cinema terminology.
 */
export const PHRASE_PAIRS = [
	// --- Page Titles (<title>) ---
	["Bảng Giá Vé Xem Phim | Beta Cinemas", "Movie Ticket Pricing | Beta Cinemas"],
	["Hệ Thống Rạp Chiếu Phim Toàn Quốc | Beta Cinemas", "Nationwide Cinema Network | Beta Cinemas"],
	["Danh Sách Phim Chiếu Rạp Mới Nhất | Beta Cinemas", "Latest Cinema Movies Directory | Beta Cinemas"],
	["Tin Mới & Sự Kiện Ưu Đãi | Beta Cinemas", "News & Special Offers | Beta Cinemas"],
	["Chương Trình Thành Viên & Điểm Thưởng | Beta Cinemas", "Membership Program & Rewards | Beta Cinemas"],
	["Beta Cinemas - Rạp Phim Cho Mọi Nhà", "Beta Cinemas - Cinema for Everyone"],
	["Trang Quản Trị (Admin Portal) | Beta Cinemas", "Admin Portal | Beta Cinemas"],
	["Không Tìm Thấy Trang (404) | Beta Cinemas", "Page Not Found (404) | Beta Cinemas"],
	["Sự Cố Kỹ Thuật (500) | Beta Cinemas", "Technical Issue (500) | Beta Cinemas"],
	["Lịch Chiếu Phim | Beta Cinemas", "Movie Showtimes | Beta Cinemas"],
	["Đặt Vé Xem Phim | Beta Cinemas", "Ticket Booking | Beta Cinemas"],
	["Thanh Toán Đơn Vé | Beta Cinemas", "Order Checkout | Beta Cinemas"],
	["Hồ Sơ Cá Nhân | Beta Cinemas", "My Profile | Beta Cinemas"],
	["Chi Tiết Phim | Beta Cinemas", "Movie Details | Beta Cinemas"],

	// --- Header & Global Navigation ---
	["Lịch Chiếu Theo Rạp", "Showtimes by Cinema"],
	["Phim Đang Chiếu", "Now Showing"],
	["Phim Sắp Chiếu", "Coming Soon"],
	["Suất Chiếu Đặc Biệt", "Special Screenings"],
	["PHIM ĐANG CHIẾU", "NOW SHOWING"],
	["PHIM SẮP CHIẾU", "COMING SOON"],
	["SUẤT CHIẾU ĐẶC BIỆT", "SPECIAL SCREENINGS"],
	["Tin Mới Và Ưu Đãi", "News & Offers"],
	["Tin Mới & Ưu Đãi", "News & Offers"],
	["Tin Mới & Chương Trình Khuyến Mãi", "News & Special Promotions"],
	["Tin Mới & Sự Kiện Ưu Đãi", "News & Special Offers"],
	["TIN MỚI & ƯU ĐÃI", "NEWS & OFFERS"],
	["TIN MỚI VÀ ƯU ĐÃI", "NEWS & OFFERS"],
	["Nhượng Quyền", "Franchise"],
	["Thành Viên", "Membership"],
	["Giá Vé", "Ticket Pricing"],
	["GIÁ VÉ", "TICKET PRICING"],
	["Đăng nhập", "Log In"],
	["Đăng ký", "Register"],
	["Đăng xuất", "Log Out"],
	["Trang cá nhân", "My Profile"],
	["Thông tin tài khoản", "Account Details"],
	["Lịch sử đặt vé", "Booking History"],
	["Ưu đãi của tôi", "My Vouchers"],
	["Trang Quản Trị (Admin)", "Admin Dashboard"],
	["Trang Quản Trị", "Admin Dashboard"],
	["Hồ Sơ Cá Nhân", "My Profile"],
	["Giao diện:", "Theme:"],
	["Ngôn ngữ:", "Language:"],
	["Đăng nhập / Đăng ký thành viên", "Log In / Register"],
	["Beta Thái Nguyên", "Beta Thai Nguyen"],
	["Chọn rạp", "Select Cinema"],
	["Chọn rạp chiếu", "Select Cinema"],
	["Tìm kiếm rạp...", "Search cinema..."],
	["Tìm rạp chiếu...", "Search cinema..."],
	["Tìm rạp", "Search cinema"],
	["Khám Phá Hệ Thống Cụm Rạp Beta Cinemas", "Explore Beta Cinemas Network Nationwide"],
	["Khám Phá Hệ Thống", "Explore the Network"],
	["Cụm Rạp Beta Cinemas", "Beta Cinemas Network"],
	["Cụm Rạp Beta", "Beta Cinemas"],
	["Hệ Thống Cụm Rạp", "Cinema Network"],
	["Hệ Thống Rạp Chiếu Phim Toàn Quốc", "Nationwide Cinema Network"],
	["Mạng Lưới Rạp Chiếu Toàn Quốc", "Nationwide Cinema Network"],
	["📍 Mạng Lưới Rạp Chiếu Toàn Quốc", "📍 Nationwide Cinema Network"],
	["⚙️ Quản Trị", "⚙️ Admin"],
	["Quản Trị", "Admin"],
	["Phim", "Movies"],
	["Rạp", "Cinemas"],
	["Trang chủ", "Home"],
	["TRANG CHỦ", "HOME"],

	// --- Quick Booking Bar & Homepage ---
	["Mua vé nhanh", "Quick Ticket Booking"],
	["MUA VÉ NHANH", "QUICK BOOKING"],
	["1. Chọn phim", "1. Select Movie"],
	["2. Chọn rạp", "2. Select Cinema"],
	["3. Chọn ngày", "3. Select Date"],
	["4. Chọn suất", "4. Select Showtime"],
	["1. Chọn Phim", "1. Select Movie"],
	["2. Chọn Rạp", "2. Select Cinema"],
	["3. Chọn Ngày", "3. Select Date"],
	["4. Chọn Suất", "4. Select Showtime"],
	["MUA VÉ", "BUY TICKETS"],
	["Mua vé", "Buy Tickets"],
	["ĐẶT VÉ", "BOOK NOW"],
	["Đặt vé", "Book Now"],
	["Chi tiết", "Details"],
	["Xem chi tiết", "View Details"],
	["Xem Chi Tiết", "View Details"],
	["Xem trailer", "Watch Trailer"],
	["Xem Trailer", "Watch Trailer"],
	["Tìm kiếm phim...", "Search movies..."],
	["Xem tất cả", "View All"],
	["XEM TẤT CẢ", "VIEW ALL"],
	["Tất cả", "All"],
	["Tất Cả", "All"],
	["Phim nổi bật", "Featured Movies"],
	["Quảng cáo trái", "Left Banner"],
	["Quảng cáo phải", "Right Banner"],
	["Lên đầu trang", "Back to Top"],
	["Slide trước", "Previous Slide"],
	["Slide sau", "Next Slide"],

	// --- 404 & 500 Error Pages ---
	["THÔNG BÁO LỖI HỆ THỐNG", "SYSTEM NOTIFICATION"],
	["Rất Tiếc! Trang Bạn Tìm Không Tồn Tại", "Oops! Page Not Found"],
	["bạn truy cập có thể đã bị thay đổi, xóa bỏ hoặc không tồn tại trong hệ thống của Beta Cinemas.", "you accessed may have been moved, deleted, or does not exist on Beta Cinemas."],
	["Đường dẫn", "The URL"],
	["TRỞ VỀ TRANG CHỦ", "RETURN TO HOMEPAGE"],
	["Trở về trang chủ", "Return to Homepage"],
	["LỊCH CHIẾU PHIM", "MOVIE SHOWTIMES"],
	["Bạn có thể quan tâm đến các nội dung hot:", "You may be interested in:"],
	["Giá Vé Rạp Beta", "Beta Ticket Pricing"],
	["LỖI MÁY CHỦ (500 SERVER ERROR)", "SERVER ERROR (500 INTERNAL SERVER ERROR)"],
	["Đã Xảy Ra Sự Cố Kỹ Thuật!", "A Technical Issue Occurred!"],
	["Hệ thống máy chủ Beta Cinemas đang gặp gián đoạn tạm thời hoặc đang trong quá trình nâng cấp dịch vụ.", "Beta Cinemas servers are experiencing temporary interruption or undergoing maintenance."],
	["Vui lòng thử lại sau giây phút.", "Please try again shortly."],
	["TẢI LẠI TRANG", "RELOAD PAGE"],
	["Nếu sự cố vẫn tiếp diễn, vui lòng liên hệ CSKH Hotline:", "If the issue persists, please contact Support Hotline:"],
	["Gửi Email Hỗ Trợ", "Send Support Email"],
	["Kiểm Tra Lịch Chiếu", "Check Showtimes"],
	["Trang 404 Sample", "404 Sample Page"],
	["Đã Xảy Ra Lỗi!", "An Error Occurred!"],
	["Vui lòng thử lại sau", "Please try again later"],

	// --- Admin Portal (admin.html, admin-page.js) ---
	["ADMIN SECURITY GATEWAY", "ADMIN SECURITY GATEWAY"],
	["ADMIN PORTAL", "ADMIN PORTAL"],
	["Cổng Đăng Nhập Quản Trị Viên", "Admin Login Gateway"],
	["Khu vực này yêu cầu xác thực bảo mật. Bạn cần đăng nhập tài khoản admin", "This area requires security authorization. Please log in with admin account"],
	["Tài khoản Quản trị", "Admin Username"],
	["Mật khẩu bảo mật", "Security Password"],
	["Đăng Nhập Quản Trị", "Admin Login"],
	["Hiện mật khẩu", "Show password"],
	["Ẩn mật khẩu", "Hide password"],
	["← Quay lại trang chủ rạp chiếu", "← Back to Cinema Website"],
	["Quay lại trang chủ", "Back to Homepage"],
	["Ban Quản Trị Hệ Thống", "System Administrator"],
	["Super Admin Online", "Super Admin Online"],
	["Quản Lý Rạp Phim", "Cinema Management"],
	["Quản Lý Phim", "Movie Management"],
	["Lịch & Suất Chiếu", "Showtimes & Schedules"],
	["Combo Bắp Nước", "Concessions & Combos"],
	["Lịch Sử Đơn Vé", "Booking Orders History"],
	["🚪 Đăng Xuất Admin", "🚪 Admin Log Out"],
	["🌐 Xem Trang Rạp Chiếu", "🌐 View Cinema Website"],
	["Bộ nhớ LocalStorage:", "LocalStorage Memory:"],
	["● Sẵn sàng", "● Ready"],
	["Mở Menu", "Toggle Menu"],
	["Tổng Quan Dashboard", "Dashboard Overview"],
	["Hệ thống quản trị rạp Beta Cinemas", "Beta Cinemas Management System"],
	["➕ Thêm Nhanh", "➕ Quick Add"],
	["🔄 Reset Dữ Liệu", "🔄 Reset Data"],
	["Khôi phục toàn bộ dữ liệu mẫu ban đầu", "Reset all sample data to defaults"],
	["Xem hồ sơ cá nhân", "View my profile"],
	["Đăng xuất khỏi tài khoản Quản trị viên", "Log out of Administrator account"],
	["Tổng Doanh Thu", "Total Revenue"],
	["từ LocalStorage", "from LocalStorage"],
	["đơn hợp lệ", "valid orders"],
	["Số Vé Bán Ra", "Tickets Sold"],
	["đơn hàng", "orders"],
	["đã giao dịch", "transacted"],
	["Tổng Phim Hệ Thống", "Total Movies in System"],
	["đang chiếu", "now showing"],
	["trên toàn quốc", "nationwide"],
	["Suất Chiếu Đang Lịch", "Active Scheduled Showtimes"],
	["Khả dụng", "Available"],
	["tại các cụm rạp", "across cinemas"],
	["4 danh mục", "4 categories"],
	["combo & ăn vặt", "combos & snacks"],
	["📊 Thống Kê Doanh Thu & Doanh Số Theo Phim", "📊 Revenue & Sales Breakdown by Movie"],
	["Dữ liệu phân tích trực tiếp từ LocalStorage", "Analytics data directly from LocalStorage"],
	["Chưa có dữ liệu giao dịch vé nào", "No ticket transaction data yet"],
	["⚡ Thao Tác Quản Trị Nhanh", "⚡ Quick Administrative Actions"],
	["Thêm mới nội dung trực tiếp vào LocalStorage", "Add new content directly into LocalStorage"],
	["➕ Thêm Phim Mới", "➕ Add New Movie"],
	["➕ Tạo Suất Chiếu Mới", "➕ Create New Showtime"],
	["➕ Thêm Combo Bắp Nước", "➕ Add Concession Combo"],
	["🎟️ Xem Lịch Sử Đơn Vé", "🎟️ View Booking History"],
	["🎟️ Đơn Đặt Vé Mới Nhất", "🎟️ Recent Booking Orders"],
	["Mã vé", "Ticket Code"],
	["Khách hàng", "Customer"],
	["Tổng tiền", "Total Amount"],
	["Trạng thái", "Status"],
	["Chưa có đơn đặt vé nào", "No booking orders yet"],
	["🎬 Phim Nổi Bật Đang Chiếu", "🎬 Featured Now Showing Movies"],
	["Quản lý phim", "Manage movies"],
	["Tất cả danh mục phim", "All movie categories"],
	["Phim đang chiếu (nowshowing)", "Now Showing (nowshowing)"],
	["Phim sắp chiếu (upcoming)", "Coming Soon (upcoming)"],
	["Suất chiếu đặc biệt (special)", "Special Screenings (special)"],
	["Phim Đang Chiếu (nowshowing)", "Now Showing (nowshowing)"],
	["Phim Sắp Chiếu (upcoming)", "Coming Soon (upcoming)"],
	["Suất Chiếu Đặc Biệt (special)", "Special Screenings (special)"],
	["🔄 Khôi phục phim gốc", "🔄 Reset Original Movies"],
	["Khôi phục danh sách phim ban đầu từ file JSON", "Reset original movie list from JSON file"],
	["Tìm theo tên, đạo diễn, thể loại...", "Search by title, director, genre..."],
	["Danh Sách Phim Trong Hệ Thống", "Movie List in System"],
	["Hiển thị 0 phim", "Displaying 0 movies"],
	["Tên Phim", "Movie Title"],
	["Danh Mục", "Category"],
	["Thể Loại", "Genre"],
	["Thời Lượng", "Duration"],
	["Độ Tuổi", "Age Rating"],
	["Đạo Diễn", "Director"],
	["Đánh Giá", "Rating"],
	["Thao Tác", "Actions"],
	["Không có phim nào phù hợp", "No matching movies found"],
	["🏛️ Chọn Rạp Phim", "🏛️ Select Cinema"],
	["📅 Chọn Ngày Chiếu", "📅 Select Date"],
	["🔄 Khôi phục lịch chiếu", "🔄 Reset Showtimes"],
	["Khôi phục toàn bộ lịch chiếu gốc từ JSON", "Reset all original showtimes from JSON"],
	["➕ Thêm Combo / Bắp Nước", "➕ Add Combo / Concessions"],
	["Tất cả danh mục món", "All menu categories"],
	["Combo Bắp Nước (combos)", "Concession Combos (combos)"],
	["Bắp Rang Bơ (popcorn)", "Popcorn (popcorn)"],
	["Nước Uống (beverages)", "Beverages (beverages)"],
	["Đồ Ăn Kèm (snacks)", "Snacks (snacks)"],
	["Bắp Rang Bơ", "Popcorn"],
	["Nước Uống", "Beverages"],
	["Đồ Ăn Kèm", "Snacks"],
	["🔄 Khôi phục mặc định", "🔄 Reset Defaults"],
	["Tìm tên combo, món...", "Search combo, item name..."],
	["Menu Bắp Nước & Giá Bán", "Concessions Menu & Pricing"],
	["Hiển thị 0 món", "Displaying 0 items"],
	["Chờ Xem / Đã Thanh Toán", "Awaiting / Paid"],
	["Đã Soát Vé / Đã Xem", "Checked-in / Watched"],
	["Đã Hủy", "Cancelled"],
	["Tìm theo mã vé, tên khách, phim, rạp...", "Search by ticket code, customer, movie, cinema..."],
	["Danh Sách Vé Đã Đặt Toàn Hệ Thống", "System-wide Booked Tickets List"],
	["0 đơn đặt vé", "0 booking orders"],
	["Mã Vé", "Ticket Code"],
	["Khách Hàng", "Customer"],
	["Phim & Rạp", "Movie & Cinema"],
	["Suất Chiếu", "Showtime"],
	["Ghế & Bắp", "Seats & Concessions"],
	["Tổng Tiền", "Total Price"],
	["Quản Lý Trạng Thái", "Manage Status"],
	["Không tìm thấy đơn đặt vé nào phù hợp", "No matching booking orders found"],
	["Thêm Phim Mới", "Add New Movie"],
	["Tên Phim (Tiếng Việt)", "Movie Title (Vietnamese)"],
	["Tên Gốc / Tiếng Anh", "Original / English Title"],
	["Danh Mục Phim", "Movie Category"],
	["Độ Tuổi (Badge)", "Age Rating (Badge)"],
	["P - Phổ biến mọi độ tuổi", "P - General Audiences"],
	["K - Dưới 13 tuổi có phụ huynh kèm", "K - Under 13 with Adult"],
	["T13 - Khán giả từ 13 tuổi", "T13 - Ages 13 and above"],
	["T16 - Khán giả từ 16 tuổi", "T16 - Ages 16 and above"],
	["T18 - Khán giả từ 18 tuổi", "T18 - Ages 18 and above"],
	["Ngày Khởi Chiếu", "Release Date"],
	["Điểm Đánh Giá (Rating)", "Rating Score"],
	["Định Dạng Chiếu", "Projection Format"],
	["Chọn Ảnh Poster Nhanh", "Quick Poster Presets"],
	["Đường Dẫn Ảnh Poster", "Poster Image URL"],
	["Tóm Tắt Nội Dung Phim", "Movie Synopsis"],
	["Hủy Bỏ", "Cancel"],
	["💾 Lưu Vào LocalStorage", "💾 Save to LocalStorage"],
	["Thêm Suất Chiếu Mới", "Add New Showtime"],
	["Rạp Chiếu", "Cinema"],
	["Ngày Chiếu", "Screening Date"],
	["Phim Chiếu", "Screening Movie"],
	["Phòng Chiếu", "Auditorium"],
	["Định Dạng Suất", "Showtime Format"],
	["2D Phụ Đề", "2D Subtitle"],
	["2D Lồng Tiếng", "2D Dubbed"],
	["3D Phụ Đề", "3D Subtitle"],
	["IMAX 3D", "IMAX 3D"],
	["Khung Giờ Chiếu (HH:mm)", "Showtime (HH:mm)"],
	["Giá Vé Cơ Bản (VNĐ)", "Base Ticket Price (VND)"],
	["Số Ghế Khả Dụng", "Available Seats Count"],
	["💾 Lưu Suất Chiếu", "💾 Save Showtime"],
	["Thêm Combo Bắp Nước Mới", "Add New Concession Combo"],
	["Tên Mặt Hàng / Combo", "Item / Combo Name"],
	["Danh Mục Mặt Hàng", "Item Category"],
	["Nhãn Badge Khuyến Mãi", "Promo Badge Label"],
	["Giá Bán Thực Tế (VNĐ)", "Actual Price (VND)"],
	["Giá Gốc (Để gạch giá khuyến mãi, VNĐ)", "Original Price (For strike-through)"],
	["Đường Dẫn Hình Ảnh", "Image URL"],
	["Mô Tả Thành Phần", "Ingredients Description"],
	["💾 Lưu Giá & Mặt Hàng", "💾 Save Price & Item"],
	["Sửa Phim", "Edit Movie"],
	["Xóa Phim", "Delete Movie"],
	["Sửa Suất", "Edit Showtime"],
	["Xóa Suất", "Delete Showtime"],
	["Sửa Món", "Edit Item"],
	["Xóa Món", "Delete Item"],
	["Xem Vé", "View Ticket"],
	["Hủy Vé", "Cancel Ticket"],
	["Soát Vé", "Check-in Ticket"],
	["Chờ Xem", "Awaiting"],
	["Đã Xem", "Watched"],

	// --- Pricing Page (pricing.html, pricing-page.js) ---
	["Bảng Giá Vé Xem Phim Hệ Thống Beta Cinemas", "Beta Cinemas Ticket Pricing Table"],
	["Bảng Giá Vé Xem Phim", "Movie Ticket Pricing Table"],
	["Bảng Giá Vé", "Ticket Pricing"],
	["BẢNG GIÁ VÉ", "TICKET PRICING"],
	["Giá vé tiêu chuẩn áp dụng tại các cụm rạp Beta Cinemas trên toàn quốc. Đã bao gồm thuế GTGT. Áp dụng cho các định dạng chiếu 2D, 3D và IMAX Laser hiện đại.", "Standard ticket pricing applicable at Beta Cinemas nationwide. VAT included. Valid for 2D, 3D, and IMAX Laser formats."],
	["Phòng Chiếu 2D Standard", "2D Standard Auditorium"],
	["Phòng Chiếu 3D Digital", "3D Digital Auditorium"],
	["Phòng Chiếu IMAX 3D Laser", "IMAX 3D Laser Auditorium"],
	["Loại Ghế", "Seat Type"],
	["Thứ 2 - Thứ 5", "Mon - Thu"],
	["Thứ 2, 4, 5", "Mon, Wed, Thu"],
	["Thứ 6 - CN & Ngày Lễ", "Fri - Sun & Holidays"],
	["Thứ 6, 7, CN & Lễ", "Fri, Sat, Sun & Holidays"],
	["Thứ Ba Vui Vẻ (Happy Tuesday)", "Happy Tuesday"],
	["Thứ Ba Vui Vẻ", "Happy Tuesday"],
	["Ghế Thường (Standard)", "Standard Seat"],
	["Ghế Thường", "Standard Seat"],
	["Ghế VIP (Vị trí trung tâm)", "VIP Seat (Center Prime)"],
	["Ghế VIP (Góc nhìn vàng)", "VIP Seat (Prime View)"],
	["Ghế VIP", "VIP Seat"],
	["Ghế Đôi (Sweetbox 2 người)", "Sweetbox Couple Seat (2 Guests)"],
	["Ghế Đôi (Sweetbox)", "Couple Seat (Sweetbox)"],
	["Ghế Đôi", "Sweetbox Couple Seat"],
	["Chính Sách Ưu Đãi Nổi Bật", "Featured Promotional Policies"],
	["Học Sinh - Sinh Viên & U22", "Students & U22"],
	["Học Sinh - Sinh Viên", "Students"],
	["Đồng giá vé 2D chỉ", "Flat 2D ticket price only"],
	["áp dụng từ Thứ 2 đến Thứ 6 trước 17h00. Vui lòng xuất trình thẻ HSSV hoặc CCCD dưới 22 tuổi khi soát vé.", "valid Monday to Friday before 5:00 PM. Please present student ID or citizen ID under 22 at check-in."],
	["ĐỒNG GIÁ 50.000 ₫", "SPECIAL 50,000 ₫"],
	["Đặc Quyền Thành Viên Beta", "Beta Member Privileges"],
	["Tích lũy từ 5% đến 10% điểm thưởng cho mọi giao dịch mua vé và bắp nước. Đổi vé xem phim miễn phí vào ngày hội thành viên hàng tháng.", "Earn 5% to 10% reward points on all ticket & concession purchases. Redeem free movie tickets on monthly Member Days."],
	["TÍCH ĐIỂM ĐẾN 10%", "UP TO 10% POINTS"],
	["Mọi suất chiếu vào Thứ 3 hàng tuần chỉ từ", "All showtimes every Tuesday starting from"],
	["cho tất cả khách hàng. Không giới hạn số lượng vé mua online hoặc tại rạp.", "for all guests. No limit on tickets purchased online or at the box office."],
	["ĐỒNG GIÁ THỨ 3", "TUESDAY DEAL"],
	["Quy Định & Phụ Thu Giá Vé", "Pricing Policies & Surcharges"],
	["Một số lưu ý quan trọng khi mua vé xem phim tại các cụm rạp Beta Cinemas:", "Important guidelines when purchasing tickets at Beta Cinemas:"],
	["📅 Phụ Thu Ngày Lễ & Tết:", "📅 Holiday & New Year Surcharge:"],
	["Áp dụng biểu giá Thứ 7 - Chủ Nhật cho tất cả các ngày nghỉ lễ, Tết theo quy định của Nhà nước.", "Weekend pricing applies to all statutory public holidays and Tet."],
	["👓 Kính 3D & Phòng Chiếu Laser:", "👓 3D Glasses & Laser Auditoriums:"],
	["Giá vé 3D đã bao gồm mượn kính 3D tiêu chuẩn. Vui lòng hoàn trả kính nguyên vẹn sau khi kết thúc suất chiếu.", "3D tickets include standard 3D glasses rental. Please return intact glasses after the screening."],
	["👶 Trẻ Em & Người Cao Tuổi:", "👶 Children & Seniors:"],
	["Trẻ em dưới 0.7m được miễn phí vé khi ngồi cùng ghế với người lớn. Người cao tuổi trên 55 tuổi áp dụng đồng giá 50.000đ (kèm CCCD).", "Children under 0.7m enter free when sharing a seat with an adult. Seniors over 55 get flat 50,000đ pricing (ID required)."],
	["🎁 Bạn đang tìm kiếm chương trình khuyến mãi & mã giảm giá?", "🎁 Looking for promotions & discount codes?"],
	["Khám phá ngay các ưu đãi vé phim hot nhất, mã voucher bắp nước tại trang Tin Mới & Ưu Đãi.", "Discover the hottest movie deals, popcorn & drink vouchers on the News & Deals page."],
	["Xem Tin Mới & Ưu Đãi →", "View News & Deals →"],
	["Xem Tin Mới & Ưu Đãi", "View News & Deals"],

	// --- Profile Page (profile.html, profile-page.js) ---
	["Điểm Tích Lũy", "Accumulated Points"],
	["Điểm", "Points"],
	["⭐ Tích 10% điểm giá trị vé & bắp nước", "⭐ Earn 10% points on tickets & concessions"],
	["Lịch Sử Đặt Vé Xem Phim", "Movie Booking History"],
	["Lịch Sử Đặt Vé", "Booking History"],
	["Thông Tin Tài Khoản", "Account Information"],
	["Danh sách vé đã đặt và mã vé điện tử QR Code của bạn", "List of booked tickets and your electronic QR Code tickets"],
	["Tìm theo tên phim hoặc mã vé...", "Search by movie name or ticket code..."],
	["Đã thanh toán", "Paid"],
	["Đã sử dụng", "Used"],
	["Đã hủy", "Cancelled"],
	["Đã Thanh Toán", "Paid"],
	["Đã Sử Dụng", "Used"],
	["Đã Hủy", "Cancelled"],
	["Thành viên Beta VIP", "Beta VIP Member"],
	["BETA VIP MEMBER", "BETA VIP MEMBER"],
	["Thông Tin Cá Nhân", "Personal Information"],
	["Cập nhật thông tin tài khoản được lưu trữ an toàn trong LocalStorage", "Update account information stored securely in LocalStorage"],
	["● Đã đồng bộ LocalStorage", "● Synced with LocalStorage"],
	["Ảnh đại diện / Ký tự đại diện", "Avatar / Initials"],
	["Nhập 1-2 ký tự viết tắt làm Avatar", "Enter 1-2 initials for Avatar"],
	["Họ và tên", "Full Name"],
	["Nhập họ và tên", "Enter full name"],
	["Địa chỉ Email", "Email Address"],
	["Số điện thoại", "Phone Number"],
	["Ngày sinh", "Date of Birth"],
	["Giới tính", "Gender"],
	["Nam", "Male"],
	["Nữ", "Female"],
	["Khác", "Other"],
	["Tỉnh / Thành phố", "Province / City"],
	["Rạp Beta ưa thích", "Preferred Beta Cinema"],
	["Rạp yêu thích", "Favorite Cinema"],
	["💾 Lưu Thay Đổi Vào LocalStorage", "💾 Save Changes to LocalStorage"],
	["Đặt Lại Mặc Định", "Reset to Default"],
	["Lưu Thay Đổi Thông Tin", "Save Changes"],
	["Ưu Đãi Của Tôi", "My Vouchers & Perks"],
	["Ưu Đãi & Voucher Độc Quyền", "Exclusive Offers & Vouchers"],
	["Nhập mã tại bước thanh toán để được giảm giá", "Enter code at checkout to apply discount"],
	["Danh sách mã giảm giá và voucher của bạn", "List of your discount codes and vouchers"],
	["Dùng ngay", "Use now"],
	["Sao chép", "Copy"],
	["Giảm ngay 10% tổng hóa đơn đặt vé online cho thành viên VIP", "10% off total online booking for VIP members"],
	["Hạn sử dụng: 31/12/2026 • Còn 5 lượt", "Valid until: Dec 31, 2026 • 5 uses left"],
	["Giảm 50.000đ khi đặt vé kèm combo bắp nước từ 100K", "50,000đ off ticket with concession combo from 100K"],
	["Hạn sử dụng: 30/11/2026 • Còn 2 lượt", "Valid until: Nov 30, 2026 • 2 uses left"],
	["Tặng 01 ly nước ngọt lớn khi mua từ 02 vé xem phim cuối tuần", "Free 01 large soda with 02 weekend movie tickets"],
	["Hạn sử dụng: 15/10/2026 • Còn 1 lượt", "Valid until: Oct 15, 2026 • 1 use left"],
	["Hạn sử dụng:", "Valid until:"],
	["Hạn dùng", "Valid Thru"],
	["Thay Đổi Mật Khẩu", "Change Password"],
	["Đổi Mật Khẩu", "Change Password"],
	["Bảo vệ tài khoản và điểm thưởng thành viên", "Protect your account and reward points"],
	["Mật khẩu hiện tại", "Current Password"],
	["Nhập mật khẩu hiện tại", "Enter current password"],
	["Mật khẩu mới", "New Password"],
	["Tối thiểu 6 ký tự", "Minimum 6 characters"],
	["Xác nhận mật khẩu mới", "Confirm New Password"],
	["Nhập lại mật khẩu mới", "Re-enter new password"],
	["Cập Nhật Mật Khẩu", "Update Password"],
	["🎟️ Xem Vé Điện Tử", "🎟️ View E-Ticket"],
	["Xem Vé Điện Tử", "View E-Ticket"],
	["✕ Hủy Vé", "✕ Cancel Ticket"],
	["Hủy Vé", "Cancel Ticket"],
	["Đặt Lại Suất Chiếu", "Re-book Showtime"],
	["Thanh toán qua", "Paid via"],
	["Mã Vé:", "Ticket Code:"],
	["Mã vé:", "Ticket Code:"],
	["Ghế:", "Seats:"],
	["Ghế Ngồi", "Seats"],
	["Không kèm bắp", "No concessions"],
	["Bạn Chưa Có Lịch Sử Đặt Vé", "No Booking History Yet"],
	["Hãy chọn phim yêu thích và trải nghiệm rạp Beta Cinemas ngay hôm nay!", "Choose your favorite movie and experience Beta Cinemas today!"],
	["Xem Danh Sách Phim", "Browse Movies"],
	["VÉ XEM PHIM ĐIỆN TỬ", "ELECTRONIC MOVIE TICKET"],
	["MÃ QUÉT TẠI RẠP (KIOSK)", "KIOSK SCAN CODE"],
	["Xuất trình mã QR này tại quầy hoặc máy in vé tự động", "Present this QR code at the counter or automatic kiosk"],
	["Phòng / Định dạng", "Screen / Format"],
	["Thời Gian", "Time & Date"],
	["Tổng Tiền Đã Thanh Toán", "Total Paid"],
	["In Vé / Lưu Vé", "Print / Save Ticket"],
	["Chi tiết vé điện tử", "E-Ticket Details"],
	["Đóng cửa sổ", "Close window"],

	// --- Showtimes & Booking (schedule.html, booking.html, checkout.html) ---
	["LỊCH CHIẾU PHIM TOÀN HỆ THỐNG", "NATIONWIDE MOVIE SHOWTIMES"],
	["Chọn cụm rạp yêu thích và ngày xem để tra cứu toàn bộ suất chiếu phim bom tấn cùng số ghế trống theo thời gian thực.", "Choose your preferred cinema and date to check all showtimes and available seats in real-time."],
	["LỊCH CHIẾU & SUẤT VÉ", "SHOWTIMES & TICKETS"],
	["Chỉ hiển thị các khu vực và rạp phim đang có suất chiếu khả dụng", "Only showing regions and cinemas with available showtimes"],
	["Còn vé", "Available"],
	["Sắp hết vé", "Selling Fast"],
	["Hết vé", "Sold Out"],
	["1. CHỌN NGÀY XEM", "1. SELECT DATE"],
	["2. KHU VỰC CÓ SUẤT CHIẾU:", "2. REGIONS WITH SHOWTIMES:"],
	["Không Có Suất Chiếu Vào Ngày Này", "No Showtimes on This Date"],
	["Hiện tại không có rạp nào có lịch chiếu", "Currently no cinemas have showtimes"],
	["vào ngày", "on"],
	["Quý khách vui lòng chọn các ngày khác có suất chiếu ở mục", "Please select another date with available showtimes in section"],
	["phía trên.", "above."],
	["Chọn ngày xem", "Select Date"],
	["Chọn phim cần xem", "Select Movie"],
	["Không có suất chiếu phù hợp", "No matching showtimes found"],
	["Suất chiếu hôm nay", "Today's Showtimes"],
	["Chọn rạp để xem lịch chiếu", "Select a cinema to view showtimes"],
	["Vui lòng chọn rạp và ngày", "Please select a cinema and date"],
	["Hôm nay", "Today"],
	["Ngày mai", "Tomorrow"],
	["Chủ Nhật", "Sunday"],
	["Thứ Hai", "Monday"],
	["Thứ Ba", "Tuesday"],
	["Thứ Tư", "Wednesday"],
	["Thứ Năm", "Thursday"],
	["Thứ Sáu", "Friday"],
	["Thứ Bảy", "Saturday"],
	["Thứ 2", "Mon"],
	["Thứ 3", "Tue"],
	["Thứ 4", "Wed"],
	["Thứ 5", "Thu"],
	["Thứ 6", "Fri"],
	["Thứ 7", "Sat"],
	["CN", "Sun"],
	["Đặt Vé & Bắp Nước", "Ticket & Concession Booking"],
	["Quay lại chọn suất chiếu", "Back to showtimes"],
	["Suất Chiếu", "Showtime"],
	["Chọn Ghế", "Select Seats"],
	["Bắp Nước", "Concessions"],
	["Thanh Toán", "Payment"],
	["1. SƠ ĐỒ CHỌN GHẾ", "1. SEAT SELECTION MAP"],
	["2. COMBO BẮP NƯỚC & ĐỒ ĂN", "2. POPCORN & CONCESSION COMBOS"],
	["Sơ đồ ghế ngồi xem phim", "Movie Seat Layout"],
	["Tên Phim", "Movie Title"],
	["Màn Hình Lớn", "Large Screen"],
	["Thời gian giữ ghế 5 phút", "5-minute seat hold time"],
	["Giữ ghế:", "Hold seats:"],
	["Thời gian giữ ghế", "Seat hold time"],
	["Thời gian giữ ghế còn lại:", "Seat hold time remaining:"],
	["MÀN HÌNH CHIẾU / SCREEN", "CINEMA SCREEN"],
	["MÀN HÌNH CHIẾU", "CINEMA SCREEN"],
	["Màn Hình Chiếu", "Cinema Screen"],
	["Màn hình", "Screen"],
	["Chú thích loại ghế", "Seat Legend"],
	["Ghế đã đặt", "Booked"],
	["Ghế đang chọn", "Selected"],
	["Đã Bán", "Sold Out"],
	["Không thể chọn", "Unavailable"],
	["Đang Chọn", "Selected"],
	["Tối đa 8 ghế", "Max 8 seats"],
	["TIẾP TỤC CHỌN BẮP NƯỚC", "CONTINUE TO CONCESSIONS"],
	["🍿 QUẦY BẮP NƯỚC & COMBO ƯU ĐÃI", "🍿 CONCESSIONS & COMBO DEALS"],
	["Thưởng thức bắp rang bơ nóng hổi thơm giòn cùng nước giải khát mát lạnh xem phim trọn vẹn hơn!", "Enjoy hot crispy popcorn and refreshing cold drinks for the ultimate movie experience!"],
	["Quay lại chọn Ghế", "Back to Seat Selection"],
	["TÓM TẮT ĐƠN HÀNG", "ORDER SUMMARY"],
	["Ghế đã chọn:", "Selected seats:"],
	["Chưa chọn", "None selected"],
	["Tổng cộng:", "Total:"],
	["Tổng tiền:", "Total:"],
	["Tổng thanh toán:", "Total Payable:"],
	["TIẾP TỤC ĐẶT VÉ", "CONTINUE TO BOOK"],
	["Bước 1", "Step 1"],
	["Bước 2", "Step 2"],
	["Bước 3", "Step 3"],
	["Bước 4", "Step 4"],
	["Thông Tin Người Nhận Vé", "Ticket Receiver Information"],
	["BẮT BUỘC", "REQUIRED"],
	["Địa chỉ Email nhận vé điện tử", "Email address for e-ticket"],
	["Vé điện tử & mã QR sẽ được gửi trực tiếp đến địa chỉ email này sau khi hoàn tất giao dịch.", "E-ticket and QR code will be sent directly to this email address after payment completion."],
	["Phương Thức Thanh Toán", "Payment Methods"],
	["AN TOÀN 100%", "100% SECURE"],
	["Ví Điện Tử MoMo", "MoMo E-Wallet"],
	["Quét mã QR qua ứng dụng MoMo siêu tốc", "Instant QR scan via MoMo app"],
	["Khuyên dùng", "Recommended"],
	["Ví Điện Tử ZaloPay", "ZaloPay E-Wallet"],
	["Thanh toán liền mạch trong Zalo hoặc ứng dụng ZaloPay", "Seamless payment in Zalo or ZaloPay app"],
	["Thẻ ATM Nội Địa / Internet Banking", "Domestic ATM / Internet Banking"],
	["Hỗ trợ 40+ ngân hàng Việt Nam (Vietcombank, Techcombank, MB,...)", "Supports 40+ Vietnamese banks (Vietcombank, Techcombank, MB,...)"],
	["Thẻ Quốc Tế (Visa, MasterCard, JCB)", "International Cards (Visa, MasterCard, JCB)"],
	["Hỗ trợ thẻ tín dụng và ghi nợ quốc tế bảo mật 3D Secure", "Supports credit & debit cards with 3D Secure protection"],
	["Mã giảm giá / Voucher", "Discount Code / Voucher"],
	["Nhập mã voucher...", "Enter voucher code..."],
	["Áp dụng", "Apply"],
	["Thanh toán ngay", "Pay Now"],
	["Tôi đồng ý với Điều khoản sử dụng và Chính sách của Beta Cinemas", "I agree to the Terms of Service and Privacy Policy of Beta Cinemas"],
	["ĐẶT VÉ THÀNH CÔNG!", "BOOKING SUCCESSFUL!"],
	["Đặt Vé Thành Công", "Booking Successful"],
	["Mã đơn hàng:", "Booking Order Code:"],
	["Rạp chiếu:", "Cinema:"],
	["Phòng chiếu:", "Auditorium:"],
	["Suất chiếu:", "Showtime:"],
	["Ghế ngồi:", "Seats:"],
	["Bắp nước kèm theo:", "Concessions:"],
	["Thông tin người nhận vé", "Ticket Receiver Info"],
	["Xác nhận đặt vé", "Confirm Booking"],
	["Họ và tên", "Full Name"],
	["Tiếp tục", "Continue"],
	["Quay lại", "Back"],

	// --- Movie Details (movie-detail.html, movie-detail-page.js) ---
	["Thông tin tổng quan phim", "Movie Overview"],
	["Đang tải...", "Loading..."],
	["Đang tải tên phim...", "Loading movie title..."],
	["Đang tải tóm tắt nội dung phim...", "Loading movie synopsis..."],
	["(Đánh giá tích cực từ hơn 2.400 khán giả)", "(Positive reviews from over 2,400 viewers)"],
	["Đánh giá tích cực từ hơn 2.400 khán giả", "Positive reviews from over 2,400 viewers"],
	["Thời lượng:", "Duration:"],
	["Thể loại:", "Genre:"],
	["Định dạng:", "Format:"],
	["Ngôn ngữ:", "Language:"],
	["Phụ đề:", "Subtitle:"],
	["Đạo diễn", "Director"],
	["Khởi chiếu", "Release Date"],
	["Diễn viên chính", "Main Cast"],
	["Quốc gia", "Country"],
	["Hệ thống chiếu", "Cinema System"],
	["Beta Cinemas toàn quốc", "Beta Cinemas nationwide"],
	["ĐẶT VÉ NGAY", "BOOK TICKETS NOW"],
	["Xem Trailer", "Watch Trailer"],
	["Tóm Tắt Nội Dung", "Story Synopsis"],
	["Trailer Chính Thức", "Official Trailer"],
	["Diễn Viên & Đoàn Làm Phim", "Cast & Crew"],
	["Không tìm thấy thông tin phim", "Movie Information Not Found"],
	["Khám phá danh sách phim đang chiếu", "Explore Now Showing Movies"],
	["Phim chỉ dành cho khán giả từ đủ 18 tuổi trở lên. Khán giả vui lòng xuất trình giấy tờ tùy thân có hình ảnh xác minh độ tuổi tại quầy soát vé rạp.", "This film is classified for audiences aged 18 and older (18+). Please present valid photo ID at the ticket counter."],
	["Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+). Khán giả vui lòng xuất trình CCCD hoặc giấy tờ tùy thân có hình ảnh xác minh độ tuổi tại quầy soát vé.", "This film is classified for audiences aged 18 and older (18+). Please present citizen ID or photo ID at the ticket counter."],
	["Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+). Khán giả dưới 16 tuổi không được phép vào rạp theo quy định của Cục Điện ảnh.", "This film is classified for audiences aged 16 and older (16+). Audiences under 16 are not permitted into the cinema as regulated by the Cinema Department."],
	["Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+). Vui lòng mang giấy tờ tùy thân khi xem phim.", "This film is classified for audiences aged 13 and older (13+). Please bring photo ID when attending."],
	["Phim được phổ biến đến người xem dưới 13 tuổi với điều kiện có cha mẹ hoặc người bảo hộ đi cùng.", "This film is suitable for audiences under 13 provided they are accompanied by a parent or guardian."],
	["Phim được phép phổ biến rộng rãi đến người xem ở mọi lứa tuổi (P). Thích hợp cho cả gia đình cùng thưởng thức.", "This film is classified for general exhibition to audiences of all ages (P). Suitable for the whole family."],
	["LỊCH CHIẾU & ĐẶT VÉ NHANH", "SHOWTIMES & FAST BOOKING"],
	["Chọn rạp chiếu:", "Select Cinema:"],
	["Chọn ngày chiếu:", "Select Date:"],
	["Không có suất chiếu trong ngày đã chọn", "No showtimes on the selected date"],
	["Vui lòng chọn rạp khác hoặc ngày khác để tiếp tục.", "Please select another cinema or date to continue."],

	// --- Member Page (member.html, member-page.js) ---
	["Chương Trình Thành Viên & Đổi Quà", "Membership Program & Rewards"],
	["Chương Trình Thành Viên Beta Cinemas", "Beta Cinemas Membership Program"],
	["Bấm để lật thẻ xem mã vạch", "Click to flip card and view barcode"],
	["Chủ thẻ / Card Holder", "Card Holder"],
	["Xuất trình mã này cho nhân viên tại quầy vé hoặc quầy bắp nước để tích điểm & áp dụng ưu đãi hội viên.", "Present this code to staff at the box office or concession counter to earn points & apply member perks."],
	["Lật Thẻ Xem Mã Vạch Quẹt Quầy", "Flip Card for Counter Barcode"],
	["Đặc Quyền Thành Viên Beta VIP", "Beta VIP Member Privileges"],
	["Chào Mừng Hội Viên Beta Cinemas!", "Welcome Beta Cinemas Member!"],
	["Trở thành thành viên Beta để nhận vô vàn ưu đãi độc quyền, tích điểm đổi quà và tận hưởng dịch vụ rạp phim tốt nhất.", "Become a Beta member to unlock exclusive benefits, earn reward points, and enjoy premium cinema perks."],
	["Hạng Hội Viên Hiện Tại", "Current Membership Tier"],
	["Tích 7% cho mọi đơn vé", "Earn 7% on all ticket orders"],
	["Chi Tiêu Tích Lũy 2026", "Accumulated Spending 2026"],
	["Xếp hạng cập nhật tự động", "Tier automatically updated"],
	["Hạng VIP (Đang áp dụng)", "VIP Tier (Active)"],
	["Cần thêm 150 điểm để lên DIAMOND 💎", "Need 150 more points to reach DIAMOND 💎"],
	["Đạt hạng Beta Diamond để nhận đặc quyền x2 điểm ngày hội thành viên và vé mời Premiere phim chiếu sớm.", "Reach Beta Diamond to earn 2x points on Member Days and Premiere invitations for early screenings."],
	["Đổi Quà Bằng Điểm Thưởng", "Redeem Rewards with Points"],
	["Lịch Sử Tích & Tiêu Điểm", "Points Earn & Spend History"],
	["Xem Vé Đã Mua", "View Purchased Tickets"],
	["Bạn chưa đăng nhập tài khoản thành viên?", "Not logged into your member account?"],
	["Đăng ký thành viên Beta Cinemas ngay để nhận 50 điểm thưởng và tận hưởng ưu đãi 5% - 10%!", "Register as a Beta Cinemas member now to receive 50 bonus points and enjoy 5% - 10% benefits!"],
	["Đăng Ký Thành Viên Ngay", "Register Member Now"],
	["Gian Hàng Đổi Điểm Thưởng Hội Viên", "Member Points Redemption Store"],
	["Sử dụng điểm tích lũy của bạn để đổi ngay mã voucher giảm giá, bắp nước hoặc vé xem phim miễn phí", "Use your accumulated points to redeem discount vouchers, concessions, or free movie tickets"],
	["Điểm của bạn:", "Your Points:"],
	["Tất Cả Quà Tặng", "All Rewards"],
	["Mã Giảm Giá", "Discount Vouchers"],
	["Vé Xem Phim & Ghế", "Movie Tickets & Seats"],
	["Công Cụ Tính Điểm & Quyền Lợi Dự Kiến", "Estimated Points & Benefits Calculator"],
	["Kéo thanh chi tiêu để xem số điểm tích lũy và số tiền tiết kiệm bạn nhận được mỗi năm cùng Beta Cinemas", "Slide your spending amount to see accumulated points and annual savings with Beta Cinemas"],
	["Mức chi tiêu xem phim hàng tháng:", "Monthly movie spending:"],
	["Hạng Dự Kiến: BETA VIP", "Estimated Tier: BETA VIP"],
	["Điểm tích lũy / năm:", "Accumulated points / year:"],
	["Tiết kiệm quy đổi:", "Converted savings:"],
	["Tỷ lệ tích lũy: 7% giá trị đơn vé và combo", "Earn rate: 7% of ticket and combo value"],
	["Tặng 02 vé xem phim 2D + 01 bắp ngọt dịp sinh nhật", "Gift: 02 2D tickets + 01 sweet popcorn on your birthday"],
	["Ưu tiên check-in tại quầy vé riêng (Priority Line)", "Priority check-in line at box office"],
	["Bảng So Sánh Quyền Lợi Các Hạng Hội Viên", "Membership Tiers Comparison Table"],
	["Hệ thống phân hạng minh bạch, chi tiêu càng nhiều - quyền lợi càng lớn", "Transparent tier system: spend more, get more benefits"],
	["Beta Standard", "Beta Standard"],
	["Đăng ký mới • Miễn phí tham gia", "New registration • Free to join"],
	["Tích điểm mọi giao dịch", "Earn points on all transactions"],
	["Tích lũy 5% giá trị vé & bắp nước", "Accumulate 5% on tickets & concessions"],
	["Tặng 01 vé xem phim 2D sinh nhật", "Gift: 01 2D movie ticket on your birthday"],
	["Đổi điểm lấy vé và bắp nước miễn phí", "Redeem points for free tickets and snacks"],
	["BETA VIP", "BETA VIP"],
	["BETA DIAMOND", "BETA DIAMOND"],
	["Chi tiêu từ 2.000.000đ/năm", "Spending from 2,000,000đ/year"],
	["Chi tiêu từ 6.000.000đ/năm", "Spending from 6,000,000đ/year"],
	["Tích lũy 7% giá trị vé & bắp nước", "Accumulate 7% on tickets & concessions"],
	["Tích lũy 10% giá trị vé & bắp nước", "Accumulate 10% on tickets & concessions"],
	["Nhân đôi điểm (x2) vào ngày hội thành viên", "Double points (2x) on Member Days"],
	["Vé mời tham dự suất chiếu sớm Premiere", "Invitations to Premiere early screenings"],
	["Quà tặng sinh nhật đặc biệt độc quyền", "Exclusive special birthday gift"],
	["Câu Hỏi Thường Gặp (F.A.Q)", "Frequently Asked Questions (FAQ)"],
	["Đổi quà", "Redeem"],
	["Đổi ngay", "Redeem Now"],
	["Đặc Quyền Cấp Bậc", "Tier Privileges"],
	["Đổi Quà Tặng", "Redeem Rewards"],
	["Lịch Sử Điểm", "Points History"],
	["Điểm hiện có:", "Current Points:"],
	["Điểm hiện có", "Current Points"],

	// --- News Page (news.html, news-page.js) ---
	["Cập nhật liên tục các ưu đãi vé phim hot nhất, mã voucher bắp nước và sự kiện điện ảnh đặc biệt tại Beta Cinemas.", "Continuously updating the hottest movie ticket deals, concession vouchers, and special cinema events at Beta Cinemas."],
	["Tất Cả Ưu Đãi", "All Offers"],
	["Khuyến Mãi Vé", "Ticket Deals"],
	["Ưu Đãi Thành Viên", "Member Perks"],
	["Tin Tức Rạp", "Cinema News"],
	["Áp dụng đến", "Valid until"],
	["Xem chi tiết ưu đãi", "View Offer Details"],
	["Chi tiết ưu đãi", "Offer Details"],
	["Điều kiện áp dụng", "Terms & Conditions"],
	["Không có bài viết khuyến mãi nào trong danh mục này", "No promotions found in this category"],
	["Vui lòng chọn danh mục khác hoặc quay lại sau nhé!", "Please select another category or check back later!"],
	["ƯU ĐÃI", "OFFER"],

	// --- Cinemas Page (cinemas.html, cinemas-page.js) ---
	["Trải nghiệm không gian điện ảnh trẻ trung chuẩn quốc tế với phòng chiếu hiện đại, công nghệ âm thanh vòm sống động, ghế ngồi êm ái cùng menu bắp nước đa dạng tại các cụm rạp Beta Cinemas trên toàn quốc.", "Experience international standard youthful cinema with modern auditoriums, immersive surround sound, comfortable seating, and a diverse snack menu across Beta Cinemas nationwide."],
	["Cụm", "Cinemas"],
	["Rạp toàn quốc", "Nationwide"],
	["Phòng", "Screens"],
	["Chiếu kỹ thuật số", "Digital Screens"],
	["Ghế", "Seats"],
	["Ghế tiêu chuẩn & VIP", "Standard & VIP Seats"],
	["Âm thanh Dolby 7.1", "Dolby 7.1 Sound"],
	["Tìm theo tên rạp, đường phố, quận/huyện, tỉnh thành...", "Search by cinema name, street, district, city..."],
	["Tìm kiếm rạp", "Search cinemas"],
	["Xóa tìm kiếm", "Clear search"],
	["Lọc theo khu vực", "Filter by region"],
	["Tất Cả (10)", "All (10)"],
	["Hà Nội (2)", "Hanoi (2)"],
	["TP. Hồ Chí Minh (2)", "Ho Chi Minh City (2)"],
	["Miền Bắc (5)", "Northern Region (5)"],
	["Miền Trung - Miền Nam", "Central & Southern"],
	["Miền Trung/Nam (1)", "Central / South (1)"],
	["Rạp bạn đang chọn:", "Your selected cinema:"],
	["(Đang được ưu tiên khi xem lịch chiếu và đặt vé)", "(Prioritized for showtimes and ticket bookings)"],
	["Xem Lịch Chiếu Tại Rạp Này →", "View Showtimes at This Cinema →"],
	["Xem Lịch Chiếu Tại Rạp Này", "View Showtimes at This Cinema"],
	["Danh Sách Cụm Rạp", "Cinema List"],
	["(10 rạp)", "(10 cinemas)"],
	["💡 Nhấp \"Đặt Làm Rạp Của Tôi\" để đồng bộ hệ thống đặt vé nhanh", "💡 Click \"Set as My Cinema\" to sync fast ticket booking"],
	["🍿 Trải nghiệm bắp nước & Dịch vụ chuẩn Hollywood tại Beta Cinemas", "🍿 Experience Concessions & Hollywood Standards at Beta Cinemas"],
	["Hệ thống phòng chiếu được trang bị máy chiếu kỹ thuật số Laser tiên tiến, hệ thống âm thanh vòm Dolby 7.1 chân thực, cùng ghế bọc nỉ êm ái và quầy bắp nước thơm ngon luôn sẵn sàng đón tiếp quý khán giả.", "Auditoriums are equipped with advanced Laser digital projectors, authentic Dolby 7.1 surround sound, comfortable upholstered seating, and delicious concessions ready to serve you."],
	["Xem Bảng Giá Vé", "View Pricing Table"],
	["Đặc Quyền Thành Viên →", "Member Privileges →"],
	["Đặc Quyền Thành Viên", "Member Privileges"],
	["Xem Bản Đồ", "View Map"],
	["Xem Lịch Chiếu", "View Showtimes"],
	["Đặt Làm Rạp Mặc Định", "Set as Default Cinema"],
	["Đặt Làm Rạp Của Tôi", "Set as My Cinema"],
	["Rạp Mặc Định", "Default Cinema"],
	["Rạp Của Tôi", "My Cinema"],
	["Đang Chọn", "Selected"],
	["Địa chỉ:", "Address:"],
	["Địa chỉ", "Address"],
	["Điện thoại:", "Phone:"],
	["Điện thoại", "Phone"],
	["Phòng chiếu:", "Screens:"],
	["Phòng chiếu", "Screens"],
	["Số ghế:", "Seats:"],
	["Số ghế", "Seats"],
	["Giờ mở cửa:", "Opening Hours:"],
	["Giờ mở cửa", "Opening Hours"],
	["Bảng Giá Vé Rạp Này", "Pricing for This Cinema"],
	["Hotline phản ánh:", "Feedback Hotline:"],
	["Chỉ Đường Google Maps", "Get Google Maps Directions"],

	// --- Movies Directory (movies.html, movies-page.js) ---
	["DANH SÁCH PHIM ĐIỆN ẢNH", "CINEMA MOVIES DIRECTORY"],
	["Danh Sách Phim", "Movie Directory"],
	["Khám phá toàn bộ phim bom tấn đang công chiếu và sắp đổ bộ tại các cụm rạp Beta Cinemas trên toàn quốc.", "Explore all blockbuster movies now showing and coming soon across Beta Cinemas nationwide."],
	["Bộ lọc tìm kiếm phim", "Movie Search Filters"],
	["Tìm tên phim, đạo diễn hoặc diễn viên...", "Search movie, director or cast..."],
	["Độ tuổi: Tất cả", "Age Rating: All"],
	["Định dạng: Tất cả", "Format: All"],
	["Sắp xếp: Mặc định", "Sort: Default"],
	["Đánh giá cao nhất ⭐", "Top Rated ⭐"],
	["Ngày khởi chiếu mới nhất", "Latest Release Date"],
	["Tên phim A - Z", "Movie Title A - Z"],
	["Đặt lại", "Reset"],
	["Khởi chiếu:", "Release Date:"],
	["Khởi chiếu", "Release Date"],
	["Thời lượng:", "Duration:"],
	["Thời lượng", "Duration"],
	["Đạo diễn:", "Director:"],
	["Đạo diễn", "Director"],
	["Diễn viên:", "Cast:"],
	["Diễn viên", "Cast"],
	["Thể loại:", "Genre:"],
	["Thể loại", "Genre"],
	["Ngôn ngữ:", "Language:"],
	["Ngôn ngữ", "Language"],
	["Định dạng:", "Format:"],
	["Định dạng", "Format"],
	["Nội dung phim", "Synopsis"],
	["Trailer Phim", "Movie Trailer"],
	["Lịch Chiếu & Đặt Vé", "Showtimes & Booking"],
	["Đang chiếu", "Now Showing"],
	["Sắp chiếu", "Coming Soon"],
	["Suất đặc biệt", "Special Screening"],
	["Đánh giá:", "Rating:"],
	["phút", "mins"],

	// --- Footer (All pages) ---
	["Tuyển dụng", "Careers"],
	["Giới thiệu", "About Us"],
	["Liên hệ", "Contact Us"],
	["Liên Hệ", "Contact Us"],
	["F.A.Q", "FAQ"],
	["Hoạt động xã hội", "Social Responsibility"],
	["Điều khoản sử dụng", "Terms of Service"],
	["Chính sách thanh toán, đổi trả - hoàn vé", "Payment, Refund & Ticket Exchange Policy"],
	["Chính sách thanh toán", "Payment Policy"],
	["Chính sách bảo mật", "Privacy Policy"],
	["Điều khoản bảo mật", "Privacy Policy"],
	["Hướng dẫn đặt vé online", "Online Booking Guide"],
	["Liên hệ quảng cáo", "Advertising Inquiries"],
	["Tải Ứng Dụng", "Download App"],
	["Beta Cinemas cho iOS", "Beta Cinemas for iOS"],
	["Beta Cinemas cho Android", "Beta Cinemas for Android"],
	["CÔNG TY CỔ PHẦN BETA MEDIA", "BETA MEDIA JOINT STOCK COMPANY"],
	["Giấy chứng nhận ĐKKD số: 0106633482 - Đăng ký lần đầu ngày 08/09/2014 tại Sở Kế hoạch và Đầu tư Thành phố Hà Nội", "Business Reg. No. 0106633482 - First registered on 08/09/2014 by Hanoi Department of Planning and Investment"],
	["Giấy chứng nhận ĐKKD số: 0106633482 - Đăng ký lần đầu ngày 08/09/2014 tại Sở Kế hoạch và Đầu tư TP. Hà Nội", "Business Reg. No. 0106633482 - First registered on 08/09/2014 by Hanoi Department of Planning and Investment"],
	["Địa chỉ: Tầng 3, số 595, đường Giải Phóng, Phường Tương Mai, Hà Nội", "Address: 3rd Floor, 595 Giai Phong St, Tuong Mai Ward, Hanoi"],
	["LIÊN HỆ CHĂM SÓC KHÁCH HÀNG:", "CUSTOMER SUPPORT:"],
	["LIÊN HỆ QUẢNG CÁO:", "ADVERTISING INQUIRIES:"],
	["KẾT NỐI VỚI CHÚNG TÔI", "CONNECT WITH US"],
	["ĐÃ THÔNG BÁO", "REGISTERED WITH"],
	["BỘ CÔNG THƯƠNG", "MINISTRY OF INDUSTRY & TRADE"],
	["Tất cả các quyền được bảo lưu.", "All rights reserved."],
	["Bản quyền thuộc về Beta Media.", "All rights reserved by Beta Media."],
	["Thiết kế bởi Beta Media.", "Designed by Beta Media."],
	["© 2026 Beta Cinemas. All rights reserved. Thiết kế bởi Beta Media.", "© 2026 Beta Cinemas. All rights reserved. Designed by Beta Media."],
	["Hotline: 1900 636807", "Hotline: 1900 636 807"],
	["Hotline: 1900 636 807", "Hotline: 1900 636 807"],
	["Phim nổi bật", "Featured Movies"],
	["Slide trước", "Previous Slide"],
	["Slide sau", "Next Slide"],
	["Lên đầu trang", "Back to top"],
	["Quảng cáo trái", "Left Sponsor Banner"],
	["Quảng cáo phải", "Right Sponsor Banner"],
	["Cụm Rạp Beta", "Beta Cinema Locations"],
	["Cụm rạp Beta", "Beta Cinema Locations"],

	// --- Member Page & Digital Card ---
	["Điểm Thưởng Tích Lũy", "Accumulated Reward Points"],
	["Hạng Hội Viên Hiện Tại", "Current Membership Tier"],
	["Chi Tiêu Tích Lũy 2026", "Accumulated Spending 2026"],
	["giá trị quy đổi", "redemption value"],
	["Tích 7% cho mọi đơn vé", "Earn 7% on all ticket orders"],
	["Tích 10% cho mọi đơn vé", "Earn 10% on all ticket orders"],
	["Tích 5% cho mọi đơn vé", "Earn 5% on all ticket orders"],
	["Xếp hạng cập nhật tự động", "Tier updated automatically"],
	["Đặc Quyền Thành Viên Beta VIP", "Beta VIP Member Privileges"],
	["Đặc Quyền Thành Viên BETA VIP", "BETA VIP Member Privileges"],
	["Đặc Quyền Thành Viên BETA DIAMOND", "BETA DIAMOND Member Privileges"],
	["Đặc Quyền Thành Viên BETA STANDARD", "BETA STANDARD Member Privileges"],
	["Đặc Quyền Thành Viên", "Member Privileges"],
	["Đặc Quyền VVIP Tối Đa", "Maximum VVIP Privileges"],
	["Hạng Cao Cấp Nhất: DIAMOND", "Highest Tier: DIAMOND"],
	["Chào Mừng Hội Viên Beta Cinemas!", "Welcome Beta Cinemas Member!"],
	["Xin Chào", "Welcome"],
	["Quý Hội Viên", "Valued Member"],
	["Hạng thẻ của bạn đang được áp dụng tỷ lệ tích lũy", "Your card tier applies an accumulation rate of"],
	["cho tất cả các giao dịch vé và bắp nước tại mọi cụm rạp Beta toàn quốc.", "for all ticket and concession transactions at all Beta cinemas nationwide."],
	["Hạng VIP (Đang áp dụng)", "VIP Tier (Current)"],
	["Cần thêm 150 điểm để lên DIAMOND", "Need 150 more points for DIAMOND"],
	["Đổi Quà Bằng Điểm Thưởng", "Redeem Rewards with Points"],
	["Lịch Sử Tích & Tiêu Điểm", "Points History"],
	["Xem Vé Đã Mua", "View Purchased Tickets"],
	["Lật Thẻ Xem Mã Vạch Quẹt Quầy", "Flip Card to View Barcode"],
	["Bấm để lật thẻ xem mã vạch", "Click to flip card and view barcode"],
	["Chủ thẻ / Card Holder", "Card Holder"],
	["Hạn dùng", "Valid Thru"],
	["Xuất trình mã này cho nhân viên tại quầy vé hoặc quầy bắp nước để tích điểm & áp dụng ưu đãi hội viên.", "Present this code to staff at the box office or concession counter to earn points and apply member discounts."],
	["Đạt hạng Beta Diamond để nhận đặc quyền x2 điểm ngày hội thành viên và vé mời Premiere phim chiếu sớm.", "Reach Beta Diamond to receive 2x points on Member Day and Premiere invitations for early screenings."],
	["Tích lũy điểm thưởng không giới hạn cho mọi giao dịch xem phim và đồ ăn nhẹ. Đổi ngay vé miễn phí và hàng loạt voucher ưu đãi độc quyền.", "Earn unlimited reward points for every movie and snack transaction. Instantly redeem free tickets and exclusive vouchers."],
	["Bạn đang sở hữu hạng thành viên cao nhất với tỷ lệ tích lũy tối đa 10% và miễn phí nâng hạng ghế!", "You hold the highest membership tier with up to 10% points earning and free seat upgrades!"],
	["Hạng Standard", "Standard Tier"],
	["Hạng VIP", "VIP Tier"],
	["Cần thêm", "Need more"],
	["điểm để lên VIP", "points for VIP"],
	["điểm để lên DIAMOND", "points for DIAMOND"],
	["Tích lũy thêm điểm để nâng tỷ lệ tích lũy lên 7% và nhận quà sinh nhật 2 vé 2D + 1 combo.", "Earn more points to upgrade accumulation rate to 7% and receive birthday gifts: 2 2D tickets + 1 combo."],
	["Lên hạng Diamond để được nhân đôi điểm vào ngày hội thành viên (15 hàng tháng) và vé mời Premiere.", "Upgrade to Diamond for 2x points on Member Day (15th monthly) and Premiere invitations."],
	["Chương Trình Khách Hàng Thân Thiết", "Loyalty Rewards Program"],
	["Đăng Ký Thành Viên Beta Cinemas", "Register for Beta Cinemas Membership"],
	["Hạng Thẻ", "Membership Tier"],
	["Thẻ Thành Viên", "Member Card"],
	["THÀNH VIÊN BETA", "BETA MEMBER"],
	["KHÁCH HÀNG THÂN THIẾT", "LOYAL CUSTOMER"],
	["Tất cả danh mục", "All categories"],
	["Vé Xem Phim Miễn Phí", "Free Movie Tickets"],
	["Combo Bắp Nước", "Concession Combos"],
	["Quà Lưu Niệm Phim", "Movie Souvenirs"],

	// --- Auth Modal & User Prompts ---
	["ĐĂNG NHẬP THÀNH VIÊN", "MEMBER LOGIN"],
	["ĐĂNG KÝ THÀNH VIÊN", "MEMBER REGISTRATION"],
	["Email hoặc Số điện thoại", "Email or Phone Number"],
	["Mật khẩu", "Password"],
	["Xác nhận mật khẩu", "Confirm Password"],
	["Quên mật khẩu?", "Forgot password?"],
	["Đăng Nhập", "Log In"],
	["Đăng Ký Tài Khoản", "Create Account"],
	["Đăng Ký", "Register"],
	["Bạn chưa có tài khoản?", "Don't have an account?"],
	["Đăng ký ngay", "Register now"],
	["Bạn đã có tài khoản?", "Already have an account?"],
	["Đăng nhập ngay", "Log in now"],
]

// Sort phrases descending by length so longer multi-word phrases match before substrings
PHRASE_PAIRS.sort((a, b) => b[0].length - a[0].length)

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Global Maps & Precompiled Regexes
const EXACT_MAP = new Map()
const REVERSE_EXACT_MAP = new Map()
const COMPILED_REGEXES = []
const COMPILED_REGEXES_EN_TO_VI = []

function initPhraseIndices() {
	EXACT_MAP.clear()
	REVERSE_EXACT_MAP.clear()
	COMPILED_REGEXES.length = 0
	COMPILED_REGEXES_EN_TO_VI.length = 0

	// 1. Vietnamese -> English forward mapping
	for (const [vi, en] of PHRASE_PAIRS) {
		const norm = vi.trim().replace(/\s+/g, " ")
		if (!EXACT_MAP.has(norm)) {
			EXACT_MAP.set(norm, en)
		}
		const lower = norm.toLowerCase()
		if (!EXACT_MAP.has(lower)) {
			EXACT_MAP.set(lower, en)
		}

		// Build flexible whitespace regex
		const tokens = norm.split(" ").map(escapeRegex)
		const first = tokens[0]
		const last = tokens[tokens.length - 1]

		let pattern = tokens.join("\\s+")
		// Add word boundary checks for Unicode words
		if (/^[\p{L}\p{N}]/u.test(first)) {
			pattern = `(?<![\\p{L}\\p{N}])${pattern}`
		}
		if (/[\p{L}\p{N}]$/u.test(last)) {
			pattern = `${pattern}(?![\\p{L}\\p{N}])`
		}

		try {
			COMPILED_REGEXES.push({
				vi: norm,
				en,
				regex: new RegExp(pattern, "giu"),
			})
		} catch (e) {
			console.warn("Could not compile regex for:", vi, e)
		}
	}

	// 2. English -> Vietnamese reverse mapping
	// Create extended pair list including emoji-stripped versions
	const reversePairs = [...PHRASE_PAIRS]
	for (const [vi, en] of PHRASE_PAIRS) {
		const cleanVi = vi.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s\uFE0F\u200D]+/u, "").trim()
		const cleanEn = en.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s\uFE0F\u200D]+/u, "").trim()
		if (cleanVi && cleanEn && (cleanVi !== vi || cleanEn !== en)) {
			reversePairs.push([cleanVi, cleanEn])
		}
	}

	// Sort descending by English phrase length so longer phrases match first
	reversePairs.sort((a, b) => b[1].length - a[1].length)

	const SKIP_WORDS = new Set([
		"in", "to", "at", "by", "or", "on", "as", "is", "it", "no", "ok", "id", "en", "vi",
		"the", "a", "an", "of", "and", "hot", "new", "all", "vip", "imax", "2d", "3d", "4d", "per"
	])

	for (const [vi, en] of reversePairs) {
		const normEn = en.trim().replace(/\s+/g, " ")
		const normVi = vi.trim().replace(/\s+/g, " ")
		if (!normEn || !normVi) continue

		if (!REVERSE_EXACT_MAP.has(normEn)) {
			REVERSE_EXACT_MAP.set(normEn, normVi)
		}
		const lowerEn = normEn.toLowerCase()
		if (!REVERSE_EXACT_MAP.has(lowerEn)) {
			REVERSE_EXACT_MAP.set(lowerEn, normVi)
		}

		// Skip short single words or common prepositions for substring regex
		if (!normEn.includes(" ") && (normEn.length < 3 || SKIP_WORDS.has(lowerEn))) {
			continue
		}

		const tokens = normEn.split(" ").map(escapeRegex)
		const first = tokens[0]
		const last = tokens[tokens.length - 1]

		let pattern = tokens.join("\\s+")
		if (/^[\p{L}\p{N}]/u.test(first)) {
			pattern = `(?<![\\p{L}\\p{N}])${pattern}`
		}
		if (/[\p{L}\p{N}]$/u.test(last)) {
			pattern = `${pattern}(?![\\p{L}\\p{N}])`
		}

		try {
			COMPILED_REGEXES_EN_TO_VI.push({
				en: normEn,
				vi: normVi,
				regex: new RegExp(pattern, "giu"),
			})
		} catch (e) {
			console.warn("Could not compile reverse regex for:", en, e)
		}
	}
}

initPhraseIndices()

/** Legacy object export for backward compatibility */
export const TRANSLATIONS = {
	vi: Object.fromEntries(PHRASE_PAIRS.map(([vi]) => [vi, vi])),
	en: Object.fromEntries(PHRASE_PAIRS.map(([vi, en]) => [vi, en])),
}

/** Get saved language ('vi' | 'en') */
export function getSavedLang() {
	if (typeof localStorage === "undefined") return "vi"
	const val = localStorage.getItem(LANG_KEY)
	return val === "en" ? "en" : "vi"
}

/** Translate single text string bi-directionally */
export function translateString(text, targetLang = getSavedLang()) {
	if (!text || typeof text !== "string") return text

	const trimmed = text.trim()
	if (!trimmed) return text

	// Target: Vietnamese (translate English -> Vietnamese)
	if (targetLang === "vi") {
		// Fast exit: if text has no ASCII letters, it is not English
		if (!/[a-zA-Z]/.test(text)) return text

		const norm = trimmed.replace(/\s+/g, " ")

		// 1. Direct Exact Match O(1)
		if (REVERSE_EXACT_MAP.has(norm)) {
			const vi = REVERSE_EXACT_MAP.get(norm)
			const lead = text.match(/^\s*/)[0]
			const trail = text.match(/\s*$/)[0]
			return lead + vi + trail
		}

		// 2. Direct Case-Insensitive Exact Match
		const normLower = norm.toLowerCase()
		if (REVERSE_EXACT_MAP.has(normLower)) {
			let vi = REVERSE_EXACT_MAP.get(normLower)
			if (norm === norm.toUpperCase() && /[A-Z]/.test(norm)) {
				vi = vi.toUpperCase()
			}
			const lead = text.match(/^\s*/)[0]
			const trail = text.match(/\s*$/)[0]
			return lead + vi + trail
		}

		// 3. Substring replacement for multi-phrase or mixed sentence nodes
		let result = text
		for (const item of COMPILED_REGEXES_EN_TO_VI) {
			item.regex.lastIndex = 0
			if (item.regex.test(result)) {
				item.regex.lastIndex = 0
				result = result.replace(item.regex, match => {
					if (match === match.toUpperCase() && /[A-Z]/.test(match)) {
						return item.vi.toUpperCase()
					}
					return item.vi
				})
			}
		}
		return result
	}

	// Target: English (translate Vietnamese -> English)
	const norm = trimmed.replace(/\s+/g, " ")

	// 1. Direct Exact Match O(1)
	if (EXACT_MAP.has(norm)) {
		const en = EXACT_MAP.get(norm)
		const lead = text.match(/^\s*/)[0]
		const trail = text.match(/\s*$/)[0]
		return lead + en + trail
	}

	// 2. Direct Case-Insensitive Exact Match
	const normLower = norm.toLowerCase()
	if (EXACT_MAP.has(normLower)) {
		let en = EXACT_MAP.get(normLower)
		if (norm === norm.toUpperCase() && /[A-ZÀ-Ỹ]/.test(norm)) {
			en = en.toUpperCase()
		}
		const lead = text.match(/^\s*/)[0]
		const trail = text.match(/\s*$/)[0]
		return lead + en + trail
	}

	// 3. Substring replacement for multi-phrase or mixed sentence nodes
	let result = text
	for (const item of COMPILED_REGEXES) {
		item.regex.lastIndex = 0
		if (item.regex.test(result)) {
			item.regex.lastIndex = 0
			result = result.replace(item.regex, match => {
				if (match === match.toUpperCase() && /[A-ZÀ-Ỹ]/.test(match)) {
					return item.en.toUpperCase()
				}
				return item.en
			})
		}
	}
	return result
}

/** Translate single key */
export function t(key, defaultVal = "") {
	const lang = getSavedLang()
	if (lang === "vi") {
		if (!key) return defaultVal || ""
		const norm = key.trim().replace(/\s+/g, " ")
		if (REVERSE_EXACT_MAP.has(norm)) return REVERSE_EXACT_MAP.get(norm)
		if (REVERSE_EXACT_MAP.has(norm.toLowerCase())) return REVERSE_EXACT_MAP.get(norm.toLowerCase())
		return translateString(key, "vi") || defaultVal || key
	}
	const norm = (key || "").trim().replace(/\s+/g, " ")
	if (EXACT_MAP.has(norm)) return EXACT_MAP.get(norm)
	if (EXACT_MAP.has(norm.toLowerCase())) return EXACT_MAP.get(norm.toLowerCase())
	return translateString(key, "en") || defaultVal || key
}

/**
 * Universal Recursive DOM Translation Engine
 * Deep-walks text nodes and attributes, storing original Vietnamese in __orig properties
 * so switching between English and Vietnamese is 100% lossless.
 */
let isTranslating = false

export function translateDom(lang = getSavedLang()) {
	if (typeof document === "undefined" || !document.body || isTranslating) return
	isTranslating = true

	try {
		const isEn = lang === "en"

		// 1. Document Title
		if (isEn) {
			if (document.__origTitle === undefined) {
				document.__origTitle = document.title
			}
			document.title = translateString(document.__origTitle, "en")
		} else {
			let vi = document.__origTitle
			if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
				vi = translateString(document.title || "", "vi")
			}
			document.title = vi
			document.__origTitle = vi
		}

		// 2. Process Text Nodes
		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode(node) {
					if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT
					const tag = node.parentElement.tagName.toLowerCase()
					if (tag === "script" || tag === "style" || tag === "svg" || tag === "code") {
						return NodeFilter.FILTER_REJECT
					}
					// Ignore pure whitespace
					if (!node.nodeValue || !node.nodeValue.trim()) {
						return NodeFilter.FILTER_SKIP
					}
					return NodeFilter.FILTER_ACCEPT
				},
			},
			false,
		)

		let currentNode = walker.nextNode()
		while (currentNode) {
			if (isEn) {
				if (currentNode.__origText === undefined) {
					// Guard against nodeValue already being in English: resolve original vi
					const maybeVi = translateString(currentNode.nodeValue, "vi")
					currentNode.__origText = maybeVi !== currentNode.nodeValue ? maybeVi : currentNode.nodeValue
				}
				const orig = currentNode.__origText
				const translated = translateString(orig, "en")
				if (translated !== currentNode.nodeValue) {
					currentNode.nodeValue = translated
				}
			} else {
				// Switching to VI
				let vi = currentNode.__origText
				if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
					vi = translateString(currentNode.nodeValue, "vi")
				}
				if (vi !== currentNode.nodeValue) {
					currentNode.nodeValue = vi
				}
				currentNode.__origText = vi
			}
			currentNode = walker.nextNode()
		}

		// 3. Process Input/Textarea Placeholders
		document.querySelectorAll("input, textarea").forEach(el => {
			if (isEn) {
				if (el.__origPlaceholder === undefined) {
					const maybeVi = translateString(el.placeholder || "", "vi")
					el.__origPlaceholder = maybeVi
				}
				if (el.__origPlaceholder) {
					const translated = translateString(el.__origPlaceholder, "en")
					if (translated !== el.placeholder) {
						el.placeholder = translated
					}
				}
			} else {
				let vi = el.__origPlaceholder
				if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
					vi = translateString(el.placeholder || "", "vi")
				}
				if (vi !== el.placeholder) {
					el.placeholder = vi
				}
				el.__origPlaceholder = vi
			}
		})

		// 4. Process Titles & Tooltips
		document.querySelectorAll("[title]").forEach(el => {
			if (el.classList.contains("theme-toggle-btn") || el.classList.contains("lang-toggle-btn")) return

			if (isEn) {
				if (el.__origTitle === undefined) {
					const maybeVi = translateString(el.title || "", "vi")
					el.__origTitle = maybeVi
				}
				if (el.__origTitle) {
					const translated = translateString(el.__origTitle, "en")
					if (translated !== el.title) {
						el.title = translated
					}
				}
			} else {
				let vi = el.__origTitle
				if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
					vi = translateString(el.title || "", "vi")
				}
				if (vi !== el.title) {
					el.title = vi
				}
				el.__origTitle = vi
			}
		})

		// 5. Process Aria Labels
		document.querySelectorAll("[aria-label]").forEach(el => {
			if (el.classList.contains("theme-toggle-btn") || el.classList.contains("lang-toggle-btn")) return

			const current = el.getAttribute("aria-label") || ""
			if (isEn) {
				if (el.__origAriaLabel === undefined) {
					const maybeVi = translateString(current, "vi")
					el.__origAriaLabel = maybeVi
				}
				if (el.__origAriaLabel) {
					const translated = translateString(el.__origAriaLabel, "en")
					if (translated !== current) {
						el.setAttribute("aria-label", translated)
					}
				}
			} else {
				let vi = el.__origAriaLabel
				if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
					vi = translateString(current, "vi")
				}
				if (vi !== current) {
					el.setAttribute("aria-label", vi)
				}
				el.__origAriaLabel = vi
			}
		})

		// 6. Process Select Options
		document.querySelectorAll("select option").forEach(opt => {
			if (isEn) {
				if (opt.__origText === undefined) {
					const maybeVi = translateString(opt.textContent || "", "vi")
					opt.__origText = maybeVi
				}
				if (opt.__origText) {
					const translated = translateString(opt.__origText, "en")
					if (translated !== opt.textContent) {
						opt.textContent = translated
					}
				}
			} else {
				let vi = opt.__origText
				if (!vi || (/[a-zA-Z]/.test(vi) && translateString(vi, "vi") !== vi)) {
					vi = translateString(opt.textContent || "", "vi")
				}
				if (vi !== opt.textContent) {
					opt.textContent = vi
				}
				opt.__origText = vi
			}
		})

		// 7. Update Language Toggle Buttons on page
		updateLangButtons(lang)
	} catch (err) {
		console.warn("Translation engine encountered an issue:", err)
	} finally {
		isTranslating = false
	}
}

/** Update all language toggle buttons */
export function updateLangButtons(lang = getSavedLang()) {
	if (typeof document === "undefined") return
	const isVi = lang === "vi"
	const flag = isVi ? "🇬🇧" : "🇻🇳"
	const code = isVi ? "EN" : "VI"
	const title = isVi ? "Chuyển sang English" : "Chuyển sang Tiếng Việt"
	const ariaLabel = isVi
		? "Ngôn ngữ hiện tại: Tiếng Việt. Nhấp để chuyển sang Tiếng Anh."
		: "Current language: English. Click to switch to Vietnamese."

	document.querySelectorAll(".lang-toggle-btn").forEach(btn => {
		btn.setAttribute("title", title)
		btn.setAttribute("aria-label", ariaLabel)
		btn.innerHTML = `
			<span class="lang-flag">${flag}</span>
			<span class="lang-code">${code}</span>
		`
	})
}

/** Render HTML markup for a Language Toggle Button */
export function renderLangToggleButtonHtml(extraClasses = "") {
	const lang = getSavedLang()
	const isVi = lang === "vi"
	const flag = isVi ? "🇬🇧" : "🇻🇳"
	const code = isVi ? "EN" : "VI"
	const title = isVi ? "Chuyển sang English" : "Chuyển sang Tiếng Việt"
	const ariaLabel = isVi
		? "Ngôn ngữ hiện tại: Tiếng Việt. Nhấp để chuyển sang Tiếng Anh."
		: "Current language: English. Click to switch to Vietnamese."

	return `
		<button type="button" class="lang-toggle-btn ${extraClasses}" id="lang-toggle-btn"
			title="${title}"
			aria-label="${ariaLabel}">
			<span class="lang-flag">${flag}</span>
			<span class="lang-code">${code}</span>
		</button>
	`
}

/** Apply a language, translate entire page, and persist */
export function applyLang(lang, notify = false) {
	const validLang = lang === "en" ? "en" : "vi"
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("lang", validLang)
	}

	try {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(LANG_KEY, validLang)
		}
	} catch (e) {
		console.warn("Could not save language to localStorage:", e)
	}

	// 1. Immediately translate current DOM
	if (typeof document !== "undefined") {
		translateDom(validLang)
	}

	// 2. Dispatch event to notify components so they re-render
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("betaLangChange", { detail: { lang: validLang } }))
	}

	// 3. Immediately re-translate DOM to catch any synchronous component re-renders
	if (typeof document !== "undefined") {
		translateDom(validLang)
		// And schedule a requestAnimationFrame to catch microtasks/render queues
		requestAnimationFrame(() => {
			translateDom(validLang)
		})
	}

	if (notify && typeof window !== "undefined" && typeof window.__showToast === "function") {
		const msg = validLang === "en" ? "Language switched to English" : "Đã chuyển ngôn ngữ sang Tiếng Việt"
		window.__showToast(msg, "info", 2000)
	}
}

/** Toggle between 'vi' and 'en' */
export function toggleLang(notify = true) {
	const current = getSavedLang()
	const next = current === "en" ? "vi" : "en"
	applyLang(next, notify)
	return next
}

/** Bind click events to all language toggle buttons */
export function bindLangToggleEvents() {
	if (typeof document === "undefined") return
	document.querySelectorAll(".lang-toggle-btn").forEach(btn => {
		if (btn.dataset.langBound === "true") return
		btn.dataset.langBound = "true"
		btn.addEventListener("click", e => {
			e.preventDefault()
			e.stopPropagation()
			toggleLang(true)
		})
	})
}

/**
 * MutationObserver to automatically translate dynamically injected content
 * (e.g. cinema lists, movie cards, pricing tabs, auth modals).
 */
let debounceTimer = null

export function initI18nObserver() {
	if (typeof document === "undefined" || !document.body || window.__i18nObserverActive) return
	window.__i18nObserverActive = true

	const observer = new MutationObserver(mutations => {
		if (isTranslating) return

		let hasChanges = false
		for (const m of mutations) {
			if (m.type === "childList" && m.addedNodes.length > 0) {
				for (const node of m.addedNodes) {
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (node.id === "toast-container" || node.classList?.contains("toast")) continue
						hasChanges = true
						break
					} else if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim()) {
						hasChanges = true
						break
					}
				}
				if (hasChanges) break
			}
			if (m.type === "characterData") {
				hasChanges = true
				break
			}
		}

		if (hasChanges) {
			if (debounceTimer) cancelAnimationFrame(debounceTimer)
			debounceTimer = requestAnimationFrame(() => {
				translateDom(getSavedLang())
			})
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
	})
}
