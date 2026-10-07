/**
 * Beta Cinemas - API Client for Json-Server & Json-Server-Auth
 * Quản lý giao tiếp HTTP với backend json-server:
 * - Đăng ký, Đăng nhập (json-server-auth / JWT)
 * - CRUD Phim, Lịch & Suất Chiếu, Combo Bắp Nước, Đơn Đặt Vé (json-server)
 */

// Auto-detect API base endpoint (Vite proxy /api -> localhost:3000, or fallback direct)
const isBrowser = typeof window !== "undefined"
const API_BASE = isBrowser && (window.location.port === "5173" || window.location.port === "4173")
	? "/api"
	: (typeof process !== "undefined" && process.env?.BACKEND_URL) || "http://localhost:3000"

const TOKEN_KEY = "beta_auth_token"

/* ==========================================================================
   TOKEN & HEADERS MANAGEMENT
   ========================================================================== */

export function getAuthToken() {
	if (typeof localStorage === "undefined") return ""
	return localStorage.getItem(TOKEN_KEY) || ""
}

export function setAuthToken(token) {
	if (typeof localStorage === "undefined") return
	if (token) {
		localStorage.setItem(TOKEN_KEY, token)
	} else {
		localStorage.removeItem(TOKEN_KEY)
	}
}

export function removeAuthToken() {
	if (typeof localStorage === "undefined") return
	localStorage.removeItem(TOKEN_KEY)
}

function getHeaders(isJson = true) {
	const headers = {}
	if (isJson) headers["Content-Type"] = "application/json"
	const token = getAuthToken()
	if (token) {
		headers["Authorization"] = `Bearer ${token}`
	}
	return headers
}

async function request(endpoint, options = {}) {
	const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
	const config = {
		...options,
		headers: {
			...getHeaders(options.body !== undefined),
			...(options.headers || {}),
		},
	}

	try {
		const res = await fetch(url, config)
		const text = await res.text()
		let data = null
		try {
			data = text ? JSON.parse(text) : null
		} catch {
			data = text
		}

		if (!res.ok) {
			const errorMsg = typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`
			return { ok: false, status: res.status, error: errorMsg, data: null }
		}

		return { ok: true, status: res.status, data }
	} catch (err) {
		console.warn(`[API] Request failed for ${endpoint}:`, err)
		return { ok: false, status: 0, error: err.message, data: null }
	}
}

/* ==========================================================================
   AUTHENTICATION APIS (json-server-auth: POST /register, POST /login)
   ========================================================================== */

/**
 * Đăng ký tài khoản mới qua json-server-auth
 * @param {Object} userData - { email, password, name, phone, ... }
 */
export async function apiRegister(userData) {
	const payload = {
		...userData,
		email: (userData.email || "").trim().toLowerCase(),
		name: (userData.name || "").trim(),
		phone: (userData.phone || "").trim().replace(/[\s.-]/g, ""),
		avatarText: (userData.name || "B").trim().charAt(0).toUpperCase(),
		rank: userData.rank || "Thành viên Beta Mới",
		points: userData.points !== undefined ? userData.points : 50,
		gender: userData.gender || "male",
		birthday: userData.birthday || "2000-01-01",
		city: userData.city || "Hà Nội",
		cinemaFavorite: userData.cinemaFavorite || "beta-thainguyen",
		createdAt: new Date().toISOString(),
	}

	const res = await request("/register", {
		method: "POST",
		body: JSON.stringify(payload),
	})

	if (res.ok && res.data) {
		if (res.data.accessToken) {
			setAuthToken(res.data.accessToken)
		}
		return { success: true, user: res.data.user || res.data, token: res.data.accessToken }
	}

	return { success: false, message: res.error || "Đăng ký thất bại. Vui lòng thử lại!" }
}

/**
 * Đăng nhập tài khoản qua json-server-auth
 * Hỗ trợ đăng nhập bằng cả Email hoặc Số điện thoại
 * @param {string} account - Email hoặc số điện thoại
 * @param {string} password - Mật khẩu
 */
export async function apiLogin(account, password) {
	const cleanAcc = (account || "").trim()

	const res = await request("/login", {
		method: "POST",
		body: JSON.stringify({
			email: cleanAcc,
			password,
		}),
	})

	if (res.ok && res.data) {
		if (res.data.accessToken) {
			setAuthToken(res.data.accessToken)
		}
		return { success: true, user: res.data.user || res.data, token: res.data.accessToken }
	}

	return { success: false, message: res.error || "Tài khoản hoặc mật khẩu không chính xác!" }
}

/**
 * Cập nhật thông tin profile người dùng
 * @param {number|string} userId
 * @param {Object} updates
 */
export async function apiUpdateUser(userId, updates) {
	const res = await request(`/users/${userId}`, {
		method: "PATCH",
		body: JSON.stringify(updates),
	})
	return res.ok ? { success: true, user: res.data } : { success: false, message: res.error }
}

/**
 * Lấy danh sách người dùng
 */
export async function apiGetUsers() {
	const res = await request("/users")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

/* ==========================================================================
   MOVIES CRUD APIS (json-server: /movies)
   ========================================================================== */

export async function apiGetMovies(params = {}) {
	const query = new URLSearchParams(params).toString()
	const endpoint = query ? `/movies?${query}` : "/movies"
	const res = await request(endpoint)
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetMovieById(id) {
	const res = await request(`/movies/${id}`)
	return res.ok ? res.data : null
}

export async function apiCreateMovie(movie) {
	const res = await request("/movies", {
		method: "POST",
		body: JSON.stringify(movie),
	})
	return res.ok ? { success: true, movie: res.data } : { success: false, error: res.error }
}

export async function apiUpdateMovie(id, updates) {
	const res = await request(`/movies/${id}`, {
		method: "PATCH",
		body: JSON.stringify(updates),
	})
	return res.ok ? { success: true, movie: res.data } : { success: false, error: res.error }
}

export async function apiDeleteMovie(id) {
	const res = await request(`/movies/${id}`, {
		method: "DELETE",
	})
	return res.ok ? { success: true } : { success: false, error: res.error }
}

/* ==========================================================================
   SHOWTIMES CRUD APIS (json-server: /showtimes)
   ========================================================================== */

export async function apiGetShowtimes() {
	const res = await request("/showtimes")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiCreateShowtime(showtime) {
	const res = await request("/showtimes", {
		method: "POST",
		body: JSON.stringify(showtime),
	})
	return res.ok ? { success: true, showtime: res.data } : { success: false, error: res.error }
}

export async function apiUpdateShowtime(id, showtime) {
	const res = await request(`/showtimes/${id}`, {
		method: "PUT",
		body: JSON.stringify(showtime),
	})
	return res.ok ? { success: true, showtime: res.data } : { success: false, error: res.error }
}

export async function apiDeleteShowtime(id) {
	const res = await request(`/showtimes/${id}`, {
		method: "DELETE",
	})
	return res.ok ? { success: true } : { success: false, error: res.error }
}

/* ==========================================================================
   CONCESSIONS CRUD APIS (json-server: /concessions)
   ========================================================================== */

export async function apiGetConcessions() {
	const res = await request("/concessions")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetConcessionCategories() {
	const res = await request("/concession_categories")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiCreateConcession(item) {
	const res = await request("/concessions", {
		method: "POST",
		body: JSON.stringify(item),
	})
	return res.ok ? { success: true, concession: res.data } : { success: false, error: res.error }
}

export async function apiUpdateConcession(id, updates) {
	const res = await request(`/concessions/${id}`, {
		method: "PATCH",
		body: JSON.stringify(updates),
	})
	return res.ok ? { success: true, concession: res.data } : { success: false, error: res.error }
}

export async function apiDeleteConcession(id) {
	const res = await request(`/concessions/${id}`, {
		method: "DELETE",
	})
	return res.ok ? { success: true } : { success: false, error: res.error }
}

/* ==========================================================================
   BOOKINGS CRUD APIS (json-server: /bookings)
   ========================================================================== */

export async function apiGetBookings() {
	const res = await request("/bookings")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiCreateBooking(booking) {
	const res = await request("/bookings", {
		method: "POST",
		body: JSON.stringify(booking),
	})
	return res.ok ? { success: true, booking: res.data } : { success: false, error: res.error }
}

export async function apiUpdateBooking(id, updates) {
	const res = await request(`/bookings/${id}`, {
		method: "PATCH",
		body: JSON.stringify(updates),
	})
	return res.ok ? { success: true, booking: res.data } : { success: false, error: res.error }
}

export async function apiDeleteBooking(id) {
	const res = await request(`/bookings/${id}`, {
		method: "DELETE",
	})
	return res.ok ? { success: true } : { success: false, error: res.error }
}

/* ==========================================================================
   STATIC & SYSTEM APIS (/cinemas, /genres, /banners, /promotions, etc.)
   ========================================================================== */

export async function apiGetCinemas() {
	const res = await request("/cinemas")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetGenres() {
	const res = await request("/genres")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetBanners() {
	const res = await request("/banners")
	return res.ok ? res.data : null
}

export async function apiGetPromotions() {
	const res = await request("/promotions")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetTicketPricing() {
	const res = await request("/ticket_pricing")
	return res.ok ? res.data : {}
}

export async function apiGetFooter() {
	const res = await request("/footer")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiGetMemberRewards() {
	const res = await request("/member_rewards")
	return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function apiResetDatabase() {
	const res = await request("/reset-db", { method: "POST" })
	return res.ok
}
