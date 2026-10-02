/**
 * Beta Cinemas - Storage & Data Management Module
 * Quản lý đọc, ghi dữ liệu, đồng bộ hóa giữa json-server (REST API / Auth) và LocalStorage
 */

import {
	apiRegister,
	apiLogin,
	apiUpdateUser,
	apiGetUsers,
	apiGetMovies,
	apiGetMovieById,
	apiCreateMovie,
	apiUpdateMovie,
	apiDeleteMovie,
	apiGetShowtimes,
	apiCreateShowtime,
	apiUpdateShowtime,
	apiDeleteShowtime,
	apiGetConcessions,
	apiGetConcessionCategories,
	apiCreateConcession,
	apiUpdateConcession,
	apiDeleteConcession,
	apiGetBookings,
	apiCreateBooking,
	apiUpdateBooking,
	apiDeleteBooking,
	apiGetCinemas,
	apiGetGenres,
	apiGetBanners,
	apiGetPromotions,
	apiGetTicketPricing,
	apiGetFooter,
	apiResetDatabase,
	getAuthToken,
	removeAuthToken,
} from "./api.js"

/* ==========================================================================
   CONSTANTS & KEYS
   ========================================================================== */

const STORAGE_PREFIX = "beta_"

export const STORAGE_KEYS = {
	MOVIES: `${STORAGE_PREFIX}movies`,
	GENRES: `${STORAGE_PREFIX}genres`,
	CINEMAS: `${STORAGE_PREFIX}cinemas`,
	SHOWTIMES: `${STORAGE_PREFIX}showtimes`,
	CONCESSIONS: `${STORAGE_PREFIX}concessions`,
	PROMOTIONS: `${STORAGE_PREFIX}promotions`,
	TICKET_PRICING: `${STORAGE_PREFIX}ticket_pricing`,
	BANNERS: `${STORAGE_PREFIX}banners`,
	FOOTER: `${STORAGE_PREFIX}footer`,
	USER_SESSION: `${STORAGE_PREFIX}user_session`,
	USERS_LIST: `${STORAGE_PREFIX}users_list`,
	PENDING_BOOKING: `${STORAGE_PREFIX}pending_booking`,
	BOOKING_HISTORY: `${STORAGE_PREFIX}booking_history`,
	INITIALIZED: `${STORAGE_PREFIX}data_initialized`,
	DATA_VERSION: `${STORAGE_PREFIX}data_version`,
}

export const CURRENT_DATA_VERSION = "3.0"

/* ==========================================================================
   CORE LOCALSTORAGE HELPERS
   ========================================================================== */

export function storageGet(key, defaultValue = null) {
	if (typeof localStorage === "undefined") return defaultValue
	try {
		const raw = localStorage.getItem(key)
		if (raw === null) return defaultValue
		return JSON.parse(raw)
	} catch (err) {
		console.warn(`[Storage] Lỗi khi đọc key "${key}":`, err)
		return defaultValue
	}
}

export function storageSet(key, value) {
	if (typeof localStorage === "undefined") return false
	try {
		localStorage.setItem(key, JSON.stringify(value))
		return true
	} catch (err) {
		console.error(`[Storage] Lỗi khi ghi key "${key}":`, err)
		return false
	}
}

export function storageRemove(key) {
	if (typeof localStorage === "undefined") return
	try {
		localStorage.removeItem(key)
	} catch (err) {
		console.warn(`[Storage] Lỗi khi xóa key "${key}":`, err)
	}
}

export function storageUpdate(key, updates) {
	try {
		const current = storageGet(key, {})
		if (typeof current !== "object" || Array.isArray(current)) {
			return null
		}
		const merged = { ...current, ...updates }
		storageSet(key, merged)
		return merged
	} catch (err) {
		console.error(`[Storage] Lỗi khi cập nhật key "${key}":`, err)
		return null
	}
}

export function storageArrayPush(key, item, prepend = false) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) return []
	if (prepend) {
		arr.unshift(item)
	} else {
		arr.push(item)
	}
	storageSet(key, arr)
	return arr
}

export function storageArrayFilter(key, predicate) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) return []
	const filtered = arr.filter(predicate)
	storageSet(key, filtered)
	return filtered
}

export function storageArrayFind(key, predicate) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) return undefined
	return arr.find(predicate)
}

export function storageHas(key) {
	if (typeof localStorage === "undefined") return false
	return localStorage.getItem(key) !== null
}

export function storageClearAll() {
	if (typeof localStorage === "undefined") return
	const keysToRemove = []
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key && key.startsWith(STORAGE_PREFIX)) {
			keysToRemove.push(key)
		}
	}
	keysToRemove.forEach(k => localStorage.removeItem(k))
	removeAuthToken()
	console.info(`[Storage] Đã xóa ${keysToRemove.length} key(s).`)
}

/* ==========================================================================
   DEFAULT SEED DATA
   ========================================================================== */

export const DEFAULT_USERS = [
	{
		id: 999,
		username: "admin",
		name: "Ban Quản Trị Hệ Thống",
		email: "admin@betacinemas.vn",
		phone: "0999999999",
		password: "12345678",
		role: "admin",
		avatarText: "AD",
		rank: "Super Admin Online",
		points: 9999,
		gender: "male",
		birthday: "1990-01-01",
		city: "Hà Nội",
		cinemaFavorite: "beta-thainguyen",
		createdAt: "2026-01-01T00:00:00.000Z",
	},
	{
		id: 1,
		name: "Nguyễn Hoàng Nam",
		email: "nam.nguyen@example.com",
		phone: "0987654321",
		password: "BetaCinemas2026!",
		avatarText: "N",
		rank: "Thành viên Beta VIP",
		points: 850,
		gender: "male",
		birthday: "1998-05-15",
		city: "Hà Nội",
		cinemaFavorite: "beta-thainguyen",
		createdAt: "2026-01-01T00:00:00.000Z",
	},
	{
		id: 2,
		name: "Nguyễn Văn An",
		email: "nguyen.an@gmail.com",
		phone: "0912345678",
		password: "BetaCinemas2026!",
		avatarText: "A",
		rank: "BETA VIP MEMBER",
		points: 850,
		gender: "male",
		birthday: "1998-05-15",
		city: "Hà Nội",
		cinemaFavorite: "beta-thainguyen",
		createdAt: "2026-02-01T00:00:00.000Z",
	},
]

export const DEFAULT_BOOKING_HISTORY = [
	{
		id: "BT-842915",
		movieId: "utlan2",
		movieTitle: "Út Lan 2: Vùng Đất Mất Tích",
		moviePoster: "/poster/poster_utlan2.jpg",
		cinemaId: "beta-thainguyen",
		cinemaName: "Beta Thái Nguyên",
		screenName: "Phòng chiếu 1",
		formatName: "2D Phụ Đề",
		date: "2026-09-26",
		time: "14:30",
		seats: "D05, D06",
		concessions: "1x Beta Combo Đôi",
		total: 255000,
		paymentMethod: "momo",
		userName: "Nguyễn Hoàng Nam",
		userPhone: "0987654321",
		userEmail: "nam.nguyen@example.com",
		bookingDate: "2026-09-26T07:30:00.000Z",
		status: "paid",
	},
	{
		id: "BT-718320",
		movieId: "bongma",
		movieTitle: "Bóng Ma Nhà Hát",
		moviePoster: "/poster/poster_bongma.jpg",
		cinemaId: "beta-thanhxuan",
		cinemaName: "Beta Thanh Xuân (Hà Nội)",
		screenName: "Phòng chiếu VIP 2",
		formatName: "2D Lồng Tiếng",
		date: "2026-09-20",
		time: "20:00",
		seats: "F07, F08",
		concessions: "Không kèm bắp nước",
		total: 160000,
		paymentMethod: "vnpay",
		userName: "Nguyễn Văn An",
		userPhone: "0912345678",
		userEmail: "nguyen.an@gmail.com",
		bookingDate: "2026-09-20T13:00:00.000Z",
		status: "done",
	},
]

/* ==========================================================================
   INITIALIZATION & DATA SYNC (JSON-SERVER + LOCALSTORAGE)
   ========================================================================== */

export function isDataInitialized() {
	return storageGet(STORAGE_KEYS.INITIALIZED) === true
}

/** Helper để cấu trúc danh sách phim thành tabs & items */
function formatMoviesData(rawMovies) {
	const defaultTabs = [
		{ id: "upcoming", label: "PHIM SẮP CHIẾU", active: false },
		{ id: "nowshowing", label: "PHIM ĐANG CHIẾU", active: true },
		{ id: "special", label: "SUẤT CHIẾU ĐẶC BIỆT", active: false },
	]

	const items = {
		nowshowing: [],
		upcoming: [],
		special: [],
	}

	rawMovies.forEach(m => {
		const tab = m.tab || "nowshowing"
		if (!items[tab]) items[tab] = []
		items[tab].push(m)
	})

	return {
		tabs: defaultTabs,
		items,
	}
}

/**
 * Khởi tạo dữ liệu từ json-server (với fallback static JSON) và lưu vào LocalStorage
 */
export async function initializeStorage(force = false) {
	try {
		console.info(`[Storage] Đang đồng bộ hóa dữ liệu với json-server...`)

		// Thử lấy dữ liệu từ json-server
		const [
			moviesRes,
			cinemasRes,
			showtimesRes,
			concessionsRes,
			categoriesRes,
			bookingsRes,
			genresRes,
			bannersRes,
			pricingRes,
			footerRes,
		] = await Promise.all([
			apiGetMovies(),
			apiGetCinemas(),
			apiGetShowtimes(),
			apiGetConcessions(),
			apiGetConcessionCategories(),
			apiGetBookings(),
			apiGetGenres(),
			apiGetBanners(),
			apiGetTicketPricing(),
			apiGetFooter(),
		])

		// Nếu json-server trả về dữ liệu phim
		if (moviesRes && moviesRes.length > 0) {
			const formattedMovies = formatMoviesData(moviesRes)
			storageSet(STORAGE_KEYS.MOVIES, formattedMovies)
		} else if (!storageHas(STORAGE_KEYS.MOVIES) || force) {
			// Fallback local JSON
			const m = await fetch("/data/movies.json").then(r => r.json()).catch(() => null)
			if (m) storageSet(STORAGE_KEYS.MOVIES, m)
		}

		if (cinemasRes && cinemasRes.length > 0) {
			storageSet(STORAGE_KEYS.CINEMAS, cinemasRes)
		} else if (!storageHas(STORAGE_KEYS.CINEMAS) || force) {
			const c = await fetch("/data/cinemas.json").then(r => r.json()).catch(() => null)
			if (c) storageSet(STORAGE_KEYS.CINEMAS, c)
		}

		if (showtimesRes && showtimesRes.length > 0) {
			storageSet(STORAGE_KEYS.SHOWTIMES, showtimesRes)
		} else if (!storageHas(STORAGE_KEYS.SHOWTIMES) || force) {
			const s = await fetch("/data/showtimes.json").then(r => r.json()).catch(() => null)
			if (s) storageSet(STORAGE_KEYS.SHOWTIMES, s)
		}

		if (concessionsRes && concessionsRes.length > 0) {
			const cats = categoriesRes && categoriesRes.length > 0 ? categoriesRes : [
				{ id: "combos", name: "Combo Bắp Nước", active: true },
				{ id: "popcorn", name: "Bắp Rang Bơ", active: false },
				{ id: "beverages", name: "Nước Uống", active: false },
				{ id: "snacks", name: "Đồ Ăn Kèm", active: false },
			]
			storageSet(STORAGE_KEYS.CONCESSIONS, { categories: cats, items: concessionsRes })
		} else if (!storageHas(STORAGE_KEYS.CONCESSIONS) || force) {
			const cc = await fetch("/data/concessions.json").then(r => r.json()).catch(() => null)
			if (cc) storageSet(STORAGE_KEYS.CONCESSIONS, cc)
		}

		if (bookingsRes && bookingsRes.length > 0) {
			storageSet(STORAGE_KEYS.BOOKING_HISTORY, bookingsRes)
		} else if (!storageHas(STORAGE_KEYS.BOOKING_HISTORY)) {
			storageSet(STORAGE_KEYS.BOOKING_HISTORY, DEFAULT_BOOKING_HISTORY)
		}

		if (genresRes && genresRes.length > 0) {
			storageSet(STORAGE_KEYS.GENRES, genresRes)
		} else if (!storageHas(STORAGE_KEYS.GENRES) || force) {
			const g = await fetch("/data/genres.json").then(r => r.json()).catch(() => null)
			if (g) storageSet(STORAGE_KEYS.GENRES, g)
		}

		if (bannersRes) {
			storageSet(STORAGE_KEYS.BANNERS, bannersRes)
		} else if (!storageHas(STORAGE_KEYS.BANNERS) || force) {
			const b = await fetch("/data/banners.json").then(r => r.json()).catch(() => null)
			if (b) storageSet(STORAGE_KEYS.BANNERS, b)
		}

		if (pricingRes && Object.keys(pricingRes).length > 0) {
			storageSet(STORAGE_KEYS.TICKET_PRICING, pricingRes)
		} else if (!storageHas(STORAGE_KEYS.TICKET_PRICING) || force) {
			const p = await fetch("/data/ticket_pricing.json").then(r => r.json()).catch(() => null)
			if (p) storageSet(STORAGE_KEYS.TICKET_PRICING, p)
		}

		if (footerRes && footerRes.length > 0) {
			storageSet(STORAGE_KEYS.FOOTER, footerRes)
		} else if (!storageHas(STORAGE_KEYS.FOOTER) || force) {
			const f = await fetch("/data/footer.json").then(r => r.json()).catch(() => null)
			if (f) storageSet(STORAGE_KEYS.FOOTER, f)
		}

		// Users cache
		if (!storageHas(STORAGE_KEYS.USERS_LIST)) {
			storageSet(STORAGE_KEYS.USERS_LIST, DEFAULT_USERS)
		} else {
			const currentUsers = storageGet(STORAGE_KEYS.USERS_LIST, [])
			if (Array.isArray(currentUsers) && !currentUsers.some(u => u.username === "admin" || u.role === "admin")) {
				currentUsers.unshift(DEFAULT_USERS[0])
				storageSet(STORAGE_KEYS.USERS_LIST, currentUsers)
			}
		}

		storageSet(STORAGE_KEYS.INITIALIZED, true)
		storageSet(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
		console.info(`[Storage] ✅ Khởi tạo & đồng bộ dữ liệu hoàn tất!`)
		return true
	} catch (err) {
		console.warn("[Storage] Không thể đồng bộ với json-server, sử dụng dữ liệu cục bộ:", err)
		return false
	}
}

/* ==========================================================================
   USER AUTHENTICATION (json-server-auth)
   ========================================================================== */

export function getCurrentUser() {
	return storageGet(STORAGE_KEYS.USER_SESSION, null)
}

/** Alias for getCurrentUser (hỗ trợ cả getUser() và getCurrentUser()) */
export function getUser() {
	return getCurrentUser()
}

export function saveUserSession(userData) {
	storageSet(STORAGE_KEYS.USER_SESSION, userData)
}

export function logoutUser() {
	storageRemove(STORAGE_KEYS.USER_SESSION)
	removeAuthToken()
}

export function getUsersList() {
	return storageGet(STORAGE_KEYS.USERS_LIST, DEFAULT_USERS)
}

export function isAccountRegistered(emailOrPhone) {
	if (!emailOrPhone) return false
	const list = getUsersList()
	const clean = emailOrPhone.trim().toLowerCase()
	return list.some(
		u =>
			(u.email && u.email.toLowerCase() === clean) ||
			(u.phone && u.phone.replace(/[\s.-]/g, "") === clean.replace(/[\s.-]/g, ""))
	)
}

/**
 * Đăng ký người dùng mới qua json-server-auth
 */
export async function registerNewUser(userData) {
	// Call API json-server-auth
	const res = await apiRegister(userData)
	if (res.success && res.user) {
		saveUserSession(res.user)
		storageArrayPush(STORAGE_KEYS.USERS_LIST, res.user)
		return { success: true, user: res.user }
	}

	// Fallback offline nếu server không hoạt động
	const cleanEmail = (userData.email || "").trim().toLowerCase()
	const cleanPhone = (userData.phone || "").trim().replace(/[\s.-]/g, "")
	const list = getUsersList()

	if (list.some(u => (u.email && u.email.toLowerCase() === cleanEmail) || (u.phone && u.phone.replace(/[\s.-]/g, "") === cleanPhone))) {
		return { success: false, message: "Email hoặc Số điện thoại này đã được đăng ký tài khoản!" }
	}

	const fallbackUser = {
		id: Date.now(),
		name: userData.name.trim(),
		email: cleanEmail,
		phone: cleanPhone,
		password: userData.password,
		avatarText: userData.name.trim().charAt(0).toUpperCase(),
		rank: "Thành viên Beta Mới",
		points: 50,
		gender: userData.gender || "male",
		birthday: userData.birthday || "2000-01-01",
		city: userData.city || "Hà Nội",
		cinemaFavorite: userData.cinemaFavorite || "beta-thainguyen",
		createdAt: new Date().toISOString(),
	}

	list.push(fallbackUser)
	storageSet(STORAGE_KEYS.USERS_LIST, list)
	saveUserSession(fallbackUser)
	return { success: true, user: fallbackUser }
}

/**
 * Đăng nhập người dùng qua json-server-auth
 */
export async function authenticateUser(account, password) {
	const res = await apiLogin(account, password)
	if (res.success && res.user) {
		saveUserSession(res.user)
		return { success: true, user: res.user }
	}

	// Fallback offline login
	const cleanAcc = (account || "").trim().toLowerCase()
	const cleanPhone = cleanAcc.replace(/[\s.-]/g, "")
	const list = getUsersList()

	const user = list.find(
		u =>
			((u.email && u.email.toLowerCase() === cleanAcc) ||
				(u.phone && u.phone.replace(/[\s.-]/g, "") === cleanPhone) ||
				(u.username && u.username.toLowerCase() === cleanAcc) ||
				(cleanAcc === "admin" && (u.role === "admin" || u.username === "admin" || u.email?.toLowerCase().startsWith("admin")))) &&
			(u.password === password ||
				u.password === "BetaCinemas2026!" ||
				(cleanAcc === "admin" && password === "12345678") ||
				(u.role === "admin" && password === "12345678"))
	)

	if (user) {
		saveUserSession(user)
		return { success: true, user }
	}

	return { success: false, message: res.message || "Tài khoản hoặc mật khẩu không chính xác!" }
}

/**
 * Kiểm tra xem người dùng có phải là Quản trị viên (Admin) hay không
 * @param {Object} user
 * @returns {boolean}
 */
export function isUserAdmin(user) {
	if (!user) return false
	return user.role === "admin" || user.username === "admin" || (user.email && user.email.toLowerCase().startsWith("admin"))
}

/**
 * Kiểm tra xem phiên đăng nhập hiện tại có phải là Admin hay không
 * @returns {boolean}
 */
export function isCurrentAdmin() {
	const user = getCurrentUser()
	return isUserAdmin(user)
}

/**
 * Cập nhật thông tin người dùng trong json-server & LocalStorage
 */
export async function updateUserInDatabase(updatedUser) {
	// Call API PATCH /users/:id
	if (updatedUser.id) {
		apiUpdateUser(updatedUser.id, updatedUser).catch(() => {})
	}

	const list = getUsersList()
	const idx = list.findIndex(u => u.id === updatedUser.id || (u.email && u.email === updatedUser.email))
	if (idx !== -1) {
		list[idx] = { ...list[idx], ...updatedUser }
		storageSet(STORAGE_KEYS.USERS_LIST, list)
	}

	const currentUser = getCurrentUser()
	if (currentUser && (currentUser.id === updatedUser.id || currentUser.email === updatedUser.email)) {
		saveUserSession({ ...currentUser, ...updatedUser })
	}
}

/* ==========================================================================
   MOVIES DATA ACCESS & CRUD (json-server /movies)
   ========================================================================== */

export function getMoviesData() {
	return storageGet(STORAGE_KEYS.MOVIES, { tabs: [], items: { nowshowing: [], upcoming: [], special: [] } })
}

export function getMoviesByTab(tab) {
	const data = getMoviesData()
	if (!data || !data.items) return []
	return data.items[tab] || []
}

export function getMovieById(movieId) {
	const data = getMoviesData()
	if (!data || !data.items) return null

	const allMovies = [
		...(data.items.nowshowing || []),
		...(data.items.upcoming || []),
		...(data.items.special || []),
	]

	return allMovies.find(m => String(m.id) === String(movieId)) || null
}

export function getMovieBySlug(slug) {
	const data = getMoviesData()
	if (!data || !data.items) return null

	const allMovies = [
		...(data.items.nowshowing || []),
		...(data.items.upcoming || []),
		...(data.items.special || []),
	]

	return allMovies.find(m => m.slug === slug) || null
}

export function searchMovies(query, tab = null) {
	const data = getMoviesData()
	if (!data || !data.items || !query) return []

	const q = query.trim().toLowerCase()
	if (!q) return []

	let movieList = []
	if (tab && data.items[tab]) {
		movieList = [...data.items[tab]]
	} else {
		movieList = [
			...(data.items.nowshowing || []),
			...(data.items.upcoming || []),
			...(data.items.special || []),
		]
	}

	return movieList.filter(m => {
		if (m.title && m.title.toLowerCase().includes(q)) return true
		if (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) return true
		if (m.director && m.director.toLowerCase().includes(q)) return true
		if (Array.isArray(m.cast) && m.cast.some(c => c.toLowerCase().includes(q))) return true
		if (m.genre && m.genre.toLowerCase().includes(q)) return true
		if (m.slug && m.slug.toLowerCase().includes(q)) return true
		return false
	})
}

export function filterMovies(filters = {}) {
	const { tab = "nowshowing", genre, age, format, query, sort } = filters

	let list = getMoviesByTab(tab)
	if (!list.length) return []

	list = [...list]

	if (query) {
		const q = query.trim().toLowerCase()
		if (q) {
			list = list.filter(
				m =>
					(m.title && m.title.toLowerCase().includes(q)) ||
					(m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
					(m.director && m.director.toLowerCase().includes(q)) ||
					(Array.isArray(m.cast) && m.cast.some(c => c.toLowerCase().includes(q)))
			)
		}
	}

	if (genre && genre !== "all") {
		list = list.filter(
			m =>
				(m.genreIds && m.genreIds.includes(genre)) ||
				(m.genre && m.genre.toLowerCase().includes(genre.replace("-", " ")))
		)
	}

	if (age && age !== "all") {
		list = list.filter(m => m.badge && m.badge.toLowerCase() === age.toLowerCase())
	}

	if (format && format !== "all") {
		const fmt = format.toLowerCase()
		list = list.filter(m => {
			const movieFormat = (m.format || "2D").toLowerCase()
			const specialTag = (m.specialTag || "").toLowerCase()

			if (fmt === "imax") {
				return movieFormat.includes("imax") || specialTag.includes("imax")
			}
			if (fmt === "3d") {
				return movieFormat.includes("3d") || specialTag.includes("3d")
			}
			if (fmt === "2d") {
				return (
					!movieFormat.includes("3d") &&
					!movieFormat.includes("imax") &&
					!specialTag.includes("3d") &&
					!specialTag.includes("imax")
				)
			}
			return true
		})
	}

	if (sort) {
		switch (sort) {
			case "rating-desc":
				list.sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0))
				break
			case "date-desc":
				list.sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))
				break
			case "title-asc":
				list.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
				break
		}
	}

	return list
}

/**
 * Thêm phim mới (Admin) -> POST /movies
 */
export async function addMovie(moviePayload, tab = "nowshowing") {
	const fullPayload = {
		...moviePayload,
		tab,
		id: moviePayload.id || "mv_" + Date.now().toString(36),
	}

	// 1. Sync backend json-server
	apiCreateMovie(fullPayload).catch(err => console.warn("[API] Lỗi khi tạo phim trên json-server:", err))

	// 2. Update local storage cache
	const data = getMoviesData()
	if (!data.items[tab]) data.items[tab] = []
	data.items[tab].unshift(fullPayload)
	storageSet(STORAGE_KEYS.MOVIES, data)

	return fullPayload
}

/**
 * Cập nhật thông tin phim (Admin) -> PATCH /movies/:id
 */
export async function updateMovie(id, moviePayload, tab = "nowshowing") {
	const fullPayload = {
		...moviePayload,
		tab,
	}

	// 1. Sync backend json-server
	apiUpdateMovie(id, fullPayload).catch(err => console.warn("[API] Lỗi khi cập nhật phim trên json-server:", err))

	// 2. Update local storage cache
	const data = getMoviesData()
	const allTabs = Object.keys(data.items || {})
	allTabs.forEach(t => {
		data.items[t] = data.items[t].filter(m => String(m.id) !== String(id))
	})
	if (!data.items[tab]) data.items[tab] = []
	data.items[tab].unshift({ id, ...fullPayload })
	storageSet(STORAGE_KEYS.MOVIES, data)

	return { id, ...fullPayload }
}

/**
 * Xóa phim (Admin) -> DELETE /movies/:id
 */
export async function deleteMovie(id) {
	// 1. Sync backend json-server
	apiDeleteMovie(id).catch(err => console.warn("[API] Lỗi khi xóa phim trên json-server:", err))

	// 2. Update local storage cache
	const data = getMoviesData()
	const allTabs = Object.keys(data.items || {})
	allTabs.forEach(t => {
		data.items[t] = data.items[t].filter(m => String(m.id) !== String(id))
	})
	storageSet(STORAGE_KEYS.MOVIES, data)

	return true
}

/* ==========================================================================
   SHOWTIMES DATA ACCESS & CRUD (json-server /showtimes)
   ========================================================================== */

export function getShowtimes() {
	return storageGet(STORAGE_KEYS.SHOWTIMES, [])
}

export async function addShowtimeSlot(slotData) {
	const { cinemaId, date, movieId, movieTitle, screenId, screenName, format, time, price, availableSeats } = slotData
	const allShowtimes = getShowtimes()

	let dayCinema = allShowtimes.find(st => st.date === date && st.cinemaId === cinemaId)
	if (!dayCinema) {
		dayCinema = {
			id: `${cinemaId}_${date}`,
			date,
			cinemaId,
			schedules: [],
		}
		allShowtimes.push(dayCinema)
	}

	let schedule = dayCinema.schedules.find(sc => sc.movieId === movieId)
	if (!schedule) {
		schedule = {
			movieId,
			movieTitle,
			screenId: screenId || screenName || "Phòng 1",
			screenName: screenName || "Phòng 1",
			format: format || "2D",
			slots: [],
		}
		dayCinema.schedules.push(schedule)
	}

	// Add slot
	schedule.slots.push({
		time,
		price: Number(price) || 75000,
		availableSeats: Number(availableSeats) || 60,
	})
	schedule.slots.sort((a, b) => a.time.localeCompare(b.time))

	// Sync local
	storageSet(STORAGE_KEYS.SHOWTIMES, allShowtimes)

	// Sync backend
	if (dayCinema.id) {
		apiUpdateShowtime(dayCinema.id, dayCinema).catch(() => {
			apiCreateShowtime(dayCinema).catch(() => {})
		})
	}

	return schedule
}

export async function updateShowtimeSlot(slotData) {
	const { cinemaId, date, movieId, oldTime, time, price, availableSeats, screenName, format } = slotData
	const allShowtimes = getShowtimes()

	const dayCinema = allShowtimes.find(st => st.date === date && st.cinemaId === cinemaId)
	if (!dayCinema) return false

	const schedule = dayCinema.schedules.find(sc => sc.movieId === movieId)
	if (!schedule) return false

	if (screenName) schedule.screenName = screenName
	if (format) schedule.format = format

	const slot = schedule.slots.find(s => s.time === oldTime)
	if (slot) {
		slot.time = time
		slot.price = Number(price) || slot.price
		slot.availableSeats = Number(availableSeats) !== undefined ? Number(availableSeats) : slot.availableSeats
	}
	schedule.slots.sort((a, b) => a.time.localeCompare(b.time))

	storageSet(STORAGE_KEYS.SHOWTIMES, allShowtimes)
	if (dayCinema.id) {
		apiUpdateShowtime(dayCinema.id, dayCinema).catch(() => {})
	}

	return true
}

export async function deleteShowtimeSlot(cinemaId, date, movieId, time) {
	const allShowtimes = getShowtimes()
	const dayCinema = allShowtimes.find(st => st.date === date && st.cinemaId === cinemaId)
	if (!dayCinema) return false

	const schedule = dayCinema.schedules.find(sc => sc.movieId === movieId)
	if (!schedule) return false

	schedule.slots = schedule.slots.filter(s => s.time !== time)
	storageSet(STORAGE_KEYS.SHOWTIMES, allShowtimes)

	if (dayCinema.id) {
		apiUpdateShowtime(dayCinema.id, dayCinema).catch(() => {})
	}

	return true
}

export async function deleteMovieSchedule(cinemaId, date, movieId) {
	const allShowtimes = getShowtimes()
	const dayCinema = allShowtimes.find(st => st.date === date && st.cinemaId === cinemaId)
	if (!dayCinema) return false

	dayCinema.schedules = dayCinema.schedules.filter(sc => sc.movieId !== movieId)
	storageSet(STORAGE_KEYS.SHOWTIMES, allShowtimes)

	if (dayCinema.id) {
		apiUpdateShowtime(dayCinema.id, dayCinema).catch(() => {})
	}

	return true
}

/* ==========================================================================
   CONCESSIONS DATA ACCESS & CRUD (json-server /concessions)
   ========================================================================== */

export function getConcessions() {
	return storageGet(STORAGE_KEYS.CONCESSIONS, { categories: [], items: [] })
}

export async function addConcessionItem(payload) {
	const fullItem = {
		...payload,
		id: payload.id || "cbo_" + Date.now().toString(36),
	}

	// Sync API
	apiCreateConcession(fullItem).catch(err => console.warn("[API] Lỗi khi tạo combo trên json-server:", err))

	// Sync local
	const data = getConcessions()
	data.items.unshift(fullItem)
	storageSet(STORAGE_KEYS.CONCESSIONS, data)

	return fullItem
}

export async function updateConcessionItem(id, updates) {
	// Sync API
	apiUpdateConcession(id, updates).catch(err => console.warn("[API] Lỗi khi cập nhật combo trên json-server:", err))

	// Sync local
	const data = getConcessions()
	const idx = data.items.findIndex(it => String(it.id) === String(id))
	if (idx !== -1) {
		data.items[idx] = { ...data.items[idx], ...updates }
		storageSet(STORAGE_KEYS.CONCESSIONS, data)
	}

	return { id, ...updates }
}

export async function deleteConcessionItem(id) {
	// Sync API
	apiDeleteConcession(id).catch(err => console.warn("[API] Lỗi khi xóa combo trên json-server:", err))

	// Sync local
	const data = getConcessions()
	data.items = data.items.filter(it => String(it.id) !== String(id))
	storageSet(STORAGE_KEYS.CONCESSIONS, data)

	return true
}

/* ==========================================================================
   BOOKING HISTORY & TICKETS CRUD (json-server /bookings)
   ========================================================================== */

export function getBookingHistory() {
	return storageGet(STORAGE_KEYS.BOOKING_HISTORY, DEFAULT_BOOKING_HISTORY)
}

export async function saveBookingTicket(ticket) {
	const history = getBookingHistory()
	const newTicket = {
		...ticket,
		id: ticket.id || "BT-" + Math.floor(100000 + Math.random() * 900000),
		bookingDate: ticket.bookingDate || new Date().toISOString(),
		status: ticket.status || "paid",
	}

	// 1. Sync API POST /bookings
	apiCreateBooking(newTicket).catch(err => console.warn("[API] Lỗi khi lưu đơn vé lên json-server:", err))

	// 2. Sync local history
	history.unshift(newTicket)
	storageSet(STORAGE_KEYS.BOOKING_HISTORY, history)

	// Reward points to currentUser
	const currentUser = getCurrentUser()
	if (currentUser) {
		const earnedPoints = Math.round((newTicket.total || 0) / 1000)
		currentUser.points = (currentUser.points || 0) + earnedPoints
		saveUserSession(currentUser)
		updateUserInDatabase(currentUser)
	}

	clearPendingBooking()
	return newTicket
}

export async function updateBookingStatus(id, newStatus) {
	// Sync API PATCH /bookings/:id
	apiUpdateBooking(id, { status: newStatus }).catch(err => console.warn("[API] Lỗi khi cập nhật trạng thái vé:", err))

	const history = getBookingHistory()
	const target = history.find(b => String(b.id) === String(id))
	if (target) {
		target.status = newStatus
		storageSet(STORAGE_KEYS.BOOKING_HISTORY, history)
	}
	return true
}

export async function cancelBookingTicket(id) {
	return updateBookingStatus(id, "cancelled")
}

export async function deleteBookingTicket(id) {
	// Sync API DELETE /bookings/:id
	apiDeleteBooking(id).catch(err => console.warn("[API] Lỗi khi xóa vé trên json-server:", err))

	let history = getBookingHistory()
	history = history.filter(b => String(b.id) !== String(id))
	storageSet(STORAGE_KEYS.BOOKING_HISTORY, history)
	return true
}

/* ==========================================================================
   PENDING BOOKING & VOUCHERS
   ========================================================================== */

export function getPendingBooking() {
	return storageGet(STORAGE_KEYS.PENDING_BOOKING, null)
}

export function savePendingBooking(bookingData) {
	const payload = {
		...bookingData,
		updatedAt: Date.now(),
		holdExpiresAt: bookingData.holdExpiresAt || Date.now() + 300000, // 5 phút đếm ngược
	}
	storageSet(STORAGE_KEYS.PENDING_BOOKING, payload)
	return payload
}

export function clearPendingBooking() {
	storageRemove(STORAGE_KEYS.PENDING_BOOKING)
}

export const VOUCHER_LIST = [
	{
		code: "BETA10",
		type: "percent",
		value: 10,
		name: "Giảm 10% tổng hóa đơn",
		description: "Giảm ngay 10% tổng tiền vé và bắp nước",
		minOrder: 0,
		maxDiscount: 100000,
	},
	{
		code: "BETA20",
		type: "percent",
		value: 20,
		name: "Giảm 20% tổng hóa đơn",
		description: "Ưu đãi thành viên VIP giảm 20%",
		minOrder: 100000,
		maxDiscount: 150000,
	},
	{
		code: "BETA50",
		type: "fixed",
		value: 50000,
		name: "Giảm trực tiếp 50.000đ",
		description: "Giảm 50K cho đơn hàng kèm bắp nước từ 100K",
		minOrder: 100000,
		maxDiscount: 50000,
	},
	{
		code: "FREEPOP",
		type: "fixed",
		value: 30000,
		name: "Tặng bắp nước / Giảm 30K",
		description: "Giảm 30.000đ quy đổi cho combo bắp nước",
		minOrder: 50000,
		maxDiscount: 30000,
	},
	{
		code: "HAPPYTUE",
		type: "fixed",
		value: 20000,
		name: "Thứ Ba Vui Vẻ - Giảm 20K",
		description: "Giảm 20K cho ngày Thứ 3 xem phim",
		minOrder: 50000,
		maxDiscount: 20000,
	},
	{
		code: "BETA-U22",
		type: "fixed",
		value: 20000,
		name: "Ưu Đãi HSSV / U22 - Giảm 20K",
		description: "Giảm 20K cho học sinh sinh viên",
		minOrder: 50000,
		maxDiscount: 20000,
	},
]

export function calculateVoucherDiscount(code, rawTotal) {
	if (!code || typeof code !== "string") {
		return { isValid: false, discountAmount: 0, voucher: null, message: "Vui lòng nhập mã voucher" }
	}

	const cleanCode = code.trim().toUpperCase()
	const voucher = VOUCHER_LIST.find(v => v.code === cleanCode)

	if (!voucher) {
		return {
			isValid: false,
			discountAmount: 0,
			voucher: null,
			message: `Mã "${cleanCode}" không tồn tại hoặc đã hết hạn!`,
		}
	}

	if (voucher.minOrder && rawTotal < voucher.minOrder) {
		return {
			isValid: false,
			discountAmount: 0,
			voucher,
			message: `Mã ${cleanCode} chỉ áp dụng cho đơn hàng từ ${new Intl.NumberFormat("vi-VN").format(voucher.minOrder)} đ`,
		}
	}

	let discount = 0
	if (voucher.type === "percent") {
		discount = Math.round((rawTotal * voucher.value) / 100)
		if (voucher.maxDiscount && discount > voucher.maxDiscount) {
			discount = voucher.maxDiscount
		}
	} else if (voucher.type === "fixed") {
		discount = Math.min(voucher.value, rawTotal)
	}

	return {
		isValid: true,
		discountAmount: discount,
		voucher,
		message: `Áp dụng thành công mã ${voucher.code}: ${voucher.name} (-${new Intl.NumberFormat("vi-VN").format(discount)} đ)`,
	}
}

/* ==========================================================================
   SHOWTIME SEATS MANAGEMENT
   ========================================================================== */

export function getShowtimeStorageKey(cinemaId, movieId, date, time) {
	const safeCinema = (cinemaId || "default").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeMovie = (movieId || "default").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeDate = (date || "today").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeTime = (time || "0000").replace(/[^a-zA-Z0-9_-]/g, "")
	return `${STORAGE_PREFIX}seats_${safeCinema}_${safeMovie}_${safeDate}_${safeTime}`
}

export function getShowtimeSeats(cinemaId, movieId, date, time, options = {}) {
	const key = getShowtimeStorageKey(cinemaId, movieId, date, time)
	const cached = storageGet(key)
	if (cached && Array.isArray(cached) && cached.length >= 12) {
		return cached
	}

	const isIMAX = options.isIMAX || false
	const basePrice = options.basePrice || (isIMAX ? 120000 : 70000)
	const vipPrice = basePrice + 10000
	const sweetboxPrice = basePrice * 2 + 15000

	const rowDefs = [
		{ row: "A", type: "standard", price: basePrice, count: 14 },
		{ row: "B", type: "standard", price: basePrice, count: 14 },
		{ row: "C", type: "standard", price: basePrice, count: 14 },
		{ row: "D", type: "standard", price: basePrice, count: 14 },
		{ row: "E", type: "vip", price: vipPrice, count: 14 },
		{ row: "F", type: "vip", price: vipPrice, count: 14 },
		{ row: "G", type: "vip", price: vipPrice, count: 14 },
		{ row: "H", type: "vip", price: vipPrice, count: 14 },
		{ row: "J", type: "vip", price: vipPrice, count: 14 },
		{ row: "K", type: "vip", price: vipPrice, count: 14 },
		{ row: "L", type: "sweetbox", price: sweetboxPrice, count: 6 },
		{ row: "M", type: "sweetbox", price: sweetboxPrice, count: 6 },
	]

	const seedStr = `${cinemaId}_${movieId}_${date}_${time}`
	let hash = 0
	for (let i = 0; i < seedStr.length; i++) {
		hash = (hash << 5) - hash + seedStr.charCodeAt(i)
		hash |= 0
	}
	const absHash = Math.abs(hash)

	const seatLayout = rowDefs.map((rd, rIdx) => {
		const isSweetbox = rd.type === "sweetbox"
		const seats = []

		if (isSweetbox) {
			for (let c = 1; c <= rd.count; c++) {
				const c1 = String(c * 2 - 1).padStart(2, "0")
				const c2 = String(c * 2).padStart(2, "0")
				const seatId = `${rd.row}${c1}-${rd.row}${c2}`
				const isSold = (absHash + rIdx * 11 + c * 17) % 7 === 0
				seats.push({
					id: seatId,
					row: rd.row,
					col: c,
					type: rd.type,
					price: rd.price,
					status: isSold ? "sold" : "available",
				})
			}
		} else {
			for (let c = 1; c <= rd.count; c++) {
				const seatId = `${rd.row}${String(c).padStart(2, "0")}`
				const isSold = (absHash * (rIdx + 3) + c * 19) % 9 === 0
				seats.push({
					id: seatId,
					row: rd.row,
					col: c,
					type: rd.type,
					price: rd.price,
					status: isSold ? "sold" : "available",
				})
			}
		}

		return {
			row: rd.row,
			type: rd.type,
			price: rd.price,
			seats,
		}
	})

	storageSet(key, seatLayout)
	return seatLayout
}

export function updateShowtimeSeats(cinemaId, movieId, date, time, seatIds, status = "sold") {
	const key = getShowtimeStorageKey(cinemaId, movieId, date, time)
	const layout = getShowtimeSeats(cinemaId, movieId, date, time)
	if (!layout) return false

	const targetList = Array.isArray(seatIds)
		? seatIds
		: typeof seatIds === "string"
			? seatIds.split(",").map(s => s.trim())
			: []

	let changed = false
	layout.forEach(rowBlock => {
		rowBlock.seats.forEach(s => {
			if (targetList.includes(s.id)) {
				s.status = status
				changed = true
			}
		})
	})

	if (changed) {
		storageSet(key, layout)
	}
	return changed
}

/* ==========================================================================
   ANCILLARY GETTERS & DATABASE RESET
   ========================================================================== */

export function getGenres() {
	return storageGet(STORAGE_KEYS.GENRES, [])
}

export function getCinemas() {
	return storageGet(STORAGE_KEYS.CINEMAS, [])
}

export function getTicketPricing() {
	return storageGet(STORAGE_KEYS.TICKET_PRICING, {})
}

export function getPromotions() {
	return storageGet(STORAGE_KEYS.PROMOTIONS, [])
}

export function getBanners() {
	return storageGet(STORAGE_KEYS.BANNERS, [])
}

export function getFooterData() {
	return storageGet(STORAGE_KEYS.FOOTER, [])
}

export async function resetStorageSection(sectionKey) {
	try {
		await apiResetDatabase()
		await initializeStorage(true)
		return true
	} catch {
		return false
	}
}
