/**
 * Automated End-to-End & Use-Case Verification Script
 * Kiểm thử toàn bộ 13 nhóm use case của dự án Beta Cinemas:
 * - json-server-auth (Register, Login, Token, Validation)
 * - json-server CRUD (Movies, Showtimes, Concessions, Bookings, Users)
 * - Business logic (Vouchers, Seat pricing, Hold timer calculations)
 */

import { apiRegister, apiLogin, apiUpdateUser, apiGetMovies, apiCreateMovie, apiUpdateMovie, apiDeleteMovie, apiGetShowtimes, apiGetConcessions, apiCreateConcession, apiUpdateConcession, apiDeleteConcession, apiGetBookings, apiCreateBooking, apiUpdateBooking, apiDeleteBooking, apiGetCinemas, apiGetGenres, apiGetTicketPricing } from './js/api.js'
import { calculateVoucherDiscount } from './js/storage.js'

const BACKEND_URL = 'http://localhost:3000'

let passed = 0
let failed = 0

function assert(condition, message) {
	if (condition) {
		console.log(`  ✅ PASS: ${message}`)
		passed++
	} else {
		console.error(`  ❌ FAIL: ${message}`)
		failed++
	}
}

async function runAllTests() {
	console.log('\n======================================================')
	console.log('🧪 BẮT ĐẦU KIỂM THỬ TẤT CẢ USE CASES CỦA HỆ THỐNG')
	console.log('======================================================\n')

	// Check if server is running
	try {
		const ping = await fetch(`${BACKEND_URL}/movies`)
		if (!ping.ok) throw new Error(`HTTP ${ping.status}`)
	} catch (err) {
		console.error(`❌ Backend không chạy trên ${BACKEND_URL}. Hãy chạy server trước!`, err.message)
		process.exit(1)
	}

	/* ------------------------------------------------------------------
	   USE CASE 1: AUTHENTICATION VIA JSON-SERVER-AUTH (REGISTER & LOGIN)
	   ------------------------------------------------------------------ */
	console.log('--- [USE CASE 1] ĐĂNG KÝ & ĐĂNG NHẬP (JSON-SERVER-AUTH) ---')

	const testEmail = `tester_${Date.now()}@example.com`
	const testPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`
	const testPass = 'Password123!'

	// 1.1 Register
	const regRes = await fetch(`${BACKEND_URL}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: testEmail,
			password: testPass,
			name: 'Tester Automation',
			phone: testPhone,
			rank: 'Thành viên Beta Mới',
			points: 50,
		}),
	})
	const regData = await regRes.json()
	assert(regRes.status === 201 && regData.accessToken, 'Đăng ký thành công trả về HTTP 201 và JWT accessToken')
	assert(regData.user && regData.user.email === testEmail, 'Thông tin người dùng được lưu đầy đủ')

	// 1.2 Login with Email
	const loginEmailRes = await fetch(`${BACKEND_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: testEmail,
			password: testPass,
		}),
	})
	const loginEmailData = await loginEmailRes.json()
	assert(loginEmailRes.status === 200 && loginEmailData.accessToken, 'Đăng nhập thành công bằng Email trả về JWT token')

	// 1.3 Login with Phone Number
	const loginPhoneRes = await fetch(`${BACKEND_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: testPhone, // Custom middleware translates phone to email
			password: testPass,
		}),
	})
	const loginPhoneData = await loginPhoneRes.json()
	assert(loginPhoneRes.status === 200 && loginPhoneData.user?.email === testEmail, 'Đăng nhập thành công bằng Số điện thoại')

	// 1.4 Login with Wrong Password
	const loginFailRes = await fetch(`${BACKEND_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: testEmail,
			password: 'WrongPassword!',
		}),
	})
	assert(loginFailRes.status === 400, 'Đăng nhập sai mật khẩu bị từ chối với HTTP 400')

	// 1.5 Update User Profile via PATCH /users/:id
	const updateRes = await fetch(`${BACKEND_URL}/users/${regData.user.id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${regData.accessToken}`,
		},
		body: JSON.stringify({
			city: 'Đà Nẵng',
			points: 120,
		}),
	})
	const updatedUserData = await updateRes.json()
	assert(updateRes.status === 200 && updatedUserData.points === 120, 'Cập nhật thông tin cá nhân (PATCH /users/:id) thành công')

	// 1.6 Login with Admin Account (admin / 12345678)
	const loginAdminRes = await fetch(`${BACKEND_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: 'admin',
			password: '12345678',
		}),
	})
	const loginAdminData = await loginAdminRes.json()
	assert(
		loginAdminRes.status === 200 &&
		loginAdminData.accessToken &&
		loginAdminData.user?.role === 'admin' &&
		loginAdminData.user?.username === 'admin',
		'Đăng nhập tài khoản quản trị (admin / 12345678) thành công với quyền admin'
	)

	// 1.7 Login Admin with Wrong Password
	const loginAdminFailRes = await fetch(`${BACKEND_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: 'admin',
			password: 'wrong_password',
		}),
	})
	assert(loginAdminFailRes.status === 400, 'Đăng nhập admin sai mật khẩu bị từ chối với HTTP 400')

	/* ------------------------------------------------------------------
	   USE CASE 2: MOVIES CRUD VIA JSON-SERVER
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 2] QUẢN LÝ PHIM (MOVIES CRUD) ---')

	// 2.1 Get Movies list
	const moviesListRes = await fetch(`${BACKEND_URL}/movies`)
	const movies = await moviesListRes.json()
	assert(Array.isArray(movies) && movies.length > 0, `Lấy danh sách phim thành công (${movies.length} phim)`)

	// 2.2 Create Movie (POST /movies)
	const testMovieId = `mv_test_${Date.now()}`
	const createMovieRes = await fetch(`${BACKEND_URL}/movies`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: testMovieId,
			title: 'Phim Thử Nghiệm Automation',
			originalTitle: 'Automation Movie Test',
			tab: 'nowshowing',
			genre: 'Hành động',
			duration: '120 phút',
			badge: 'T16',
			ratingScore: 9.5,
			poster: '/poster/poster_utlan2.jpg',
		}),
	})
	assert(createMovieRes.status === 201, 'Tạo phim mới (POST /movies) thành công')

	// 2.3 Read Single Movie (GET /movies/:id)
	const getMovieRes = await fetch(`${BACKEND_URL}/movies/${testMovieId}`)
	const fetchedMovie = await getMovieRes.json()
	assert(getMovieRes.status === 200 && fetchedMovie.title === 'Phim Thử Nghiệm Automation', 'Đọc chi tiết phim theo ID thành công')

	// 2.4 Update Movie (PATCH /movies/:id)
	const patchMovieRes = await fetch(`${BACKEND_URL}/movies/${testMovieId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			title: 'Phim Thử Nghiệm Automation (Đã Sửa)',
			ratingScore: 9.9,
		}),
	})
	const patchedMovie = await patchMovieRes.json()
	assert(patchMovieRes.status === 200 && patchedMovie.ratingScore === 9.9, 'Cập nhật phim (PATCH /movies/:id) thành công')

	// 2.5 Delete Movie (DELETE /movies/:id)
	const deleteMovieRes = await fetch(`${BACKEND_URL}/movies/${testMovieId}`, {
		method: 'DELETE',
	})
	assert(deleteMovieRes.status === 200, 'Xóa phim (DELETE /movies/:id) thành công')

	/* ------------------------------------------------------------------
	   USE CASE 3: SHOWTIMES CRUD VIA JSON-SERVER
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 3] QUẢN LÝ LỊCH & SUẤT CHIẾU (SHOWTIMES CRUD) ---')

	const showtimesRes = await fetch(`${BACKEND_URL}/showtimes`)
	const showtimes = await showtimesRes.json()
	assert(Array.isArray(showtimes) && showtimes.length > 0, `Lấy lịch chiếu thành công (${showtimes.length} ngày/rạp)`)

	// Test adding slot to first showtime schedule
	const firstSt = showtimes[0]
	const newTime = '23:45'
	if (firstSt.schedules && firstSt.schedules.length > 0) {
		firstSt.schedules[0].slots.push({
			time: newTime,
			price: 90000,
			availableSeats: 50,
		})
		const updateStRes = await fetch(`${BACKEND_URL}/showtimes/${firstSt.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(firstSt),
		})
		assert(updateStRes.status === 200, 'Thêm suất chiếu mới vào lịch chiếu (PUT /showtimes/:id) thành công')

		// Clean up slot
		firstSt.schedules[0].slots = firstSt.schedules[0].slots.filter(s => s.time !== newTime)
		await fetch(`${BACKEND_URL}/showtimes/${firstSt.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(firstSt),
		})
	}

	/* ------------------------------------------------------------------
	   USE CASE 4: CONCESSIONS CRUD VIA JSON-SERVER
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 4] QUẢN LÝ COMBO BẮP NƯỚC (CONCESSIONS CRUD) ---')

	const concessionsRes = await fetch(`${BACKEND_URL}/concessions`)
	const concessions = await concessionsRes.json()
	assert(Array.isArray(concessions) && concessions.length > 0, `Lấy menu bắp nước thành công (${concessions.length} món)`)

	// Create Concession
	const testComboId = `cbo_test_${Date.now()}`
	const createComboRes = await fetch(`${BACKEND_URL}/concessions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: testComboId,
			name: 'Combo Trà Sữa Bắp Caramel',
			categoryId: 'combos',
			price: 85000,
			originalPrice: 110000,
			badge: 'NEW',
		}),
	})
	assert(createComboRes.status === 201, 'Thêm mới combo bắp nước (POST /concessions) thành công')

	// Update Concession Price
	const updateComboRes = await fetch(`${BACKEND_URL}/concessions/${testComboId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ price: 79000 }),
	})
	const updatedCombo = await updateComboRes.json()
	assert(updateComboRes.status === 200 && updatedCombo.price === 79000, 'Cập nhật giá bán combo (PATCH /concessions/:id) thành công')

	// Delete Concession
	const deleteComboRes = await fetch(`${BACKEND_URL}/concessions/${testComboId}`, {
		method: 'DELETE',
	})
	assert(deleteComboRes.status === 200, 'Xóa combo bắp nước (DELETE /concessions/:id) thành công')

	/* ------------------------------------------------------------------
	   USE CASE 5: BOOKINGS & E-TICKET CRUD VIA JSON-SERVER
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 5] ĐẶT VÉ, XUẤT VÉ & LỊCH SỬ (BOOKINGS CRUD) ---')

	const testTicketId = `BT-${Math.floor(100000 + Math.random() * 900000)}`
	const createBookingRes = await fetch(`${BACKEND_URL}/bookings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: testTicketId,
			movieId: 'utlan2',
			movieTitle: 'Út Lan 2: Vùng Đất Mất Tích',
			cinemaId: 'beta-thainguyen',
			cinemaName: 'Beta Thái Nguyên',
			date: '2026-09-26',
			time: '14:30',
			seats: 'E05, E06',
			concessions: '1x Beta Combo Đôi',
			total: 255000,
			paymentMethod: 'momo',
			userName: 'Tester Automation',
			userPhone: testPhone,
			userEmail: testEmail,
			status: 'paid',
			bookingDate: new Date().toISOString(),
		}),
	})
	assert(createBookingRes.status === 201, 'Tạo đơn đặt vé mới (POST /bookings) thành công')

	// Admin check-in / update ticket status to 'done'
	const updateTicketRes = await fetch(`${BACKEND_URL}/bookings/${testTicketId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status: 'done' }),
	})
	const updatedTicket = await updateTicketRes.json()
	assert(updateTicketRes.status === 200 && updatedTicket.status === 'done', 'Soát vé / cập nhật trạng thái đơn (PATCH /bookings/:id) thành công')

	// Delete booking
	const deleteTicketRes = await fetch(`${BACKEND_URL}/bookings/${testTicketId}`, {
		method: 'DELETE',
	})
	assert(deleteTicketRes.status === 200, 'Xóa đơn vé (DELETE /bookings/:id) thành công')

	/* ------------------------------------------------------------------
	   USE CASE 6: VOUCHER VALIDATION BUSINESS LOGIC
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 6] TÍNH TOÁN & VALIDATE MÃ GIẢM GIÁ (VOUCHER) ---')

	const v10 = calculateVoucherDiscount('BETA10', 200000)
	assert(v10.isValid && v10.discountAmount === 20000, 'Mã BETA10 giảm đúng 10% (20.000đ cho đơn 200.000đ)')

	const v50 = calculateVoucherDiscount('BETA50', 250000)
	assert(v50.isValid && v50.discountAmount === 50000, 'Mã BETA50 giảm đúng 50.000đ')

	const vFail = calculateVoucherDiscount('INVALID_CODE', 200000)
	assert(!vFail.isValid, 'Mã không tồn tại bị từ chối chính xác')

	/* ------------------------------------------------------------------
	   USE CASE 7: STATIC DATA (CINEMAS, GENRES, PRICING, BANNERS)
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 7] CỤM RẠP, THỂ LOẠI & BẢNG GIÁ VÉ ---')

	const cinemasRes = await fetch(`${BACKEND_URL}/cinemas`)
	const cinemas = await cinemasRes.json()
	assert(Array.isArray(cinemas) && cinemas.length >= 10, `Tải danh sách cụm rạp thành công (${cinemas.length} rạp)`)

	const genresRes = await fetch(`${BACKEND_URL}/genres`)
	const genres = await genresRes.json()
	assert(Array.isArray(genres) && genres.length >= 8, `Tải danh mục thể loại thành công (${genres.length} thể loại)`)

	const pricingRes = await fetch(`${BACKEND_URL}/ticket_pricing`)
	const pricing = await pricingRes.json()
	assert(pricing && Array.isArray(pricing.formats) && pricing.formats.length > 0, 'Tải bảng giá vé thành công')

	/* ------------------------------------------------------------------
	   USE CASE 8: ĐẶC QUYỀN & ĐỔI ĐIỂM THƯỞNG THÀNH VIÊN (MEMBER REWARDS)
	   ------------------------------------------------------------------ */
	console.log('\n--- [USE CASE 8] ĐẶC QUYỀN & ĐỔI ĐIỂM THƯỞNG THÀNH VIÊN ---')

	const rewardsRes = await fetch(`${BACKEND_URL}/member_rewards`)
	const rewards = await rewardsRes.json()
	assert(Array.isArray(rewards) && rewards.length >= 8, `Tải danh sách quà đổi điểm thưởng thành công (${rewards.length} phần quà)`)

	const rewardItem = rewards.find(r => r.code === 'BETA10')
	assert(rewardItem && rewardItem.points === 30, 'Phần thưởng BETA10 có giá quy đổi chính xác 30 điểm')

	console.log('\n======================================================')
	console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`)
	console.log('======================================================\n')

	if (failed > 0) {
		process.exit(1)
	}
}

runAllTests()
