/**
 * Beta Cinemas - LocalStorage Utility Module
 * Quản lý đọc, ghi, cập nhật dữ liệu trong LocalStorage
 * Tự động khởi tạo (seed) dữ liệu mẫu khi chạy lần đầu
 */

/* ==========================================================================
   CONSTANTS & KEYS
   ========================================================================== */

/** Prefix để tránh xung đột key với app khác */
const STORAGE_PREFIX = "beta_"

/** Các key dữ liệu chính */
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

/** Phiên bản dữ liệu mẫu - tăng lên khi JSON cập nhật để tự động sync lại LS */
export const CURRENT_DATA_VERSION = "2.2"

/** Mapping từ STORAGE_KEYS sang đường dẫn file JSON tương ứng */
const DATA_SOURCE_MAP = {
	[STORAGE_KEYS.MOVIES]: "/data/movies.json",
	[STORAGE_KEYS.GENRES]: "/data/genres.json",
	[STORAGE_KEYS.CINEMAS]: "/data/cinemas.json",
	[STORAGE_KEYS.SHOWTIMES]: "/data/showtimes.json",
	[STORAGE_KEYS.CONCESSIONS]: "/data/concessions.json",
	[STORAGE_KEYS.PROMOTIONS]: "/data/promotions.json",
	[STORAGE_KEYS.TICKET_PRICING]: "/data/ticket_pricing.json",
	[STORAGE_KEYS.BANNERS]: "/data/banners.json",
	[STORAGE_KEYS.FOOTER]: "/data/footer.json",
}

/* ==========================================================================
   CORE CRUD OPERATIONS
   ========================================================================== */

/**
 * Đọc dữ liệu từ LocalStorage theo key
 * @param {string} key - Key trong LocalStorage
 * @param {*} defaultValue - Giá trị mặc định nếu key không tồn tại
 * @returns {*} Dữ liệu đã parse, hoặc defaultValue
 */
export function storageGet(key, defaultValue = null) {
	try {
		const raw = localStorage.getItem(key)
		if (raw === null) return defaultValue
		return JSON.parse(raw)
	} catch (err) {
		console.warn(`[Storage] Lỗi khi đọc key "${key}":`, err)
		return defaultValue
	}
}

/**
 * Ghi dữ liệu vào LocalStorage
 * @param {string} key - Key trong LocalStorage
 * @param {*} value - Dữ liệu cần lưu (sẽ tự JSON.stringify)
 * @returns {boolean} true nếu ghi thành công
 */
export function storageSet(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value))
		return true
	} catch (err) {
		console.error(`[Storage] Lỗi khi ghi key "${key}":`, err)
		if (err.name === "QuotaExceededError") {
			console.warn("[Storage] LocalStorage đã đầy! Cần xóa bớt dữ liệu cũ.")
		}
		return false
	}
}

/**
 * Xóa dữ liệu theo key khỏi LocalStorage
 * @param {string} key - Key cần xóa
 */
export function storageRemove(key) {
	try {
		localStorage.removeItem(key)
	} catch (err) {
		console.warn(`[Storage] Lỗi khi xóa key "${key}":`, err)
	}
}

/**
 * Cập nhật một phần dữ liệu (merge object) trong LocalStorage
 * @param {string} key - Key trong LocalStorage
 * @param {Object} updates - Object chứa các field cần cập nhật
 * @returns {Object|null} Object sau khi merge, hoặc null nếu lỗi
 */
export function storageUpdate(key, updates) {
	try {
		const current = storageGet(key, {})
		if (typeof current !== "object" || Array.isArray(current)) {
			console.warn(`[Storage] Key "${key}" không phải object, không thể merge.`)
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

/**
 * Thêm một item vào mảng trong LocalStorage
 * @param {string} key - Key chứa mảng
 * @param {*} item - Item cần thêm
 * @param {boolean} prepend - true = thêm đầu, false = thêm cuối
 * @returns {Array} Mảng sau khi thêm
 */
export function storageArrayPush(key, item, prepend = false) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) {
		console.warn(`[Storage] Key "${key}" không phải array.`)
		return []
	}
	if (prepend) {
		arr.unshift(item)
	} else {
		arr.push(item)
	}
	storageSet(key, arr)
	return arr
}

/**
 * Xóa item khỏi mảng trong LocalStorage theo điều kiện
 * @param {string} key - Key chứa mảng
 * @param {Function} predicate - Hàm lọc, return true để GIỮ LẠI
 * @returns {Array} Mảng sau khi lọc
 */
export function storageArrayFilter(key, predicate) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) return []
	const filtered = arr.filter(predicate)
	storageSet(key, filtered)
	return filtered
}

/**
 * Tìm item trong mảng LocalStorage
 * @param {string} key - Key chứa mảng
 * @param {Function} predicate - Hàm tìm kiếm
 * @returns {*} Item tìm thấy hoặc undefined
 */
export function storageArrayFind(key, predicate) {
	const arr = storageGet(key, [])
	if (!Array.isArray(arr)) return undefined
	return arr.find(predicate)
}

/**
 * Kiểm tra key có tồn tại trong LocalStorage không
 * @param {string} key
 * @returns {boolean}
 */
export function storageHas(key) {
	return localStorage.getItem(key) !== null
}

/**
 * Xóa toàn bộ dữ liệu Beta Cinemas khỏi LocalStorage
 */
export function storageClearAll() {
	const keysToRemove = []
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key && key.startsWith(STORAGE_PREFIX)) {
			keysToRemove.push(key)
		}
	}
	keysToRemove.forEach(k => localStorage.removeItem(k))
	console.info(`[Storage] Đã xóa ${keysToRemove.length} key(s) với prefix "${STORAGE_PREFIX}".`)
}

/* ==========================================================================
   DEFAULT SEED USERS & DATA INITIALIZATION
   ========================================================================== */

export const DEFAULT_USERS = [
	{
		id: "usr_01",
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
		id: "usr_02",
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
		bookingDate: "2026-09-20T13:00:00.000Z",
		status: "done",
	},
]

export function isDataInitialized() {
	return storageGet(STORAGE_KEYS.INITIALIZED) === true
}

async function fetchAndSeed(storageKey, jsonPath) {
	try {
		const res = await fetch(jsonPath)
		if (!res.ok) throw new Error(`HTTP ${res.status} khi fetch ${jsonPath}`)
		const data = await res.json()
		storageSet(storageKey, data)
		return data
	} catch (err) {
		console.error(`[Storage] Không thể seed "${storageKey}" từ ${jsonPath}:`, err)
		return null
	}
}

export async function initializeStorage(force = false) {
	const currentVer = storageGet(STORAGE_KEYS.DATA_VERSION)
	if (!force && isDataInitialized() && currentVer === CURRENT_DATA_VERSION) {
		return true
	}

	console.info(`[Storage] Bắt đầu nạp dữ liệu mẫu (v${CURRENT_DATA_VERSION}) vào LocalStorage...`)

	const seedTasks = Object.entries(DATA_SOURCE_MAP).map(([key, path]) => fetchAndSeed(key, path))

	try {
		const results = await Promise.all(seedTasks)
		const allSuccess = results.every(r => r !== null)

		// Seed users list if not present
		if (!storageHas(STORAGE_KEYS.USERS_LIST)) {
			storageSet(STORAGE_KEYS.USERS_LIST, DEFAULT_USERS)
		}

		// Seed booking history if not present
		if (!storageHas(STORAGE_KEYS.BOOKING_HISTORY)) {
			storageSet(STORAGE_KEYS.BOOKING_HISTORY, DEFAULT_BOOKING_HISTORY)
		}

		if (allSuccess) {
			storageSet(STORAGE_KEYS.INITIALIZED, true)
			storageSet(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
			console.info(`[Storage] ✅ Khởi tạo dữ liệu thành công (v${CURRENT_DATA_VERSION})!`)
		}

		return allSuccess
	} catch (err) {
		console.error("[Storage] ❌ Lỗi nghiêm trọng khi khởi tạo dữ liệu:", err)
		return false
	}
}

/* ==========================================================================
   VOUCHER / COUPON DEFINITIONS & HELPER
   ========================================================================== */

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

/**
 * Validate and calculate voucher discount
 * @param {string} code - Voucher code
 * @param {number} rawTotal - Order total before discount
 * @returns {Object} { isValid, discountAmount, voucher, message }
 */
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
   PENDING BOOKING MANAGEMENT (LocalStorage)
   ========================================================================== */

/**
 * Lấy đơn đặt vé tạm thời (Pending Booking)
 * @returns {Object|null}
 */
export function getPendingBooking() {
	const pending = storageGet(STORAGE_KEYS.PENDING_BOOKING, null)
	if (!pending) return null

	// Kiểm tra xem đơn tạm đã hết hạn giữ vé chưa (nếu có timestamp expiresAt)
	if (pending.holdExpiresAt && Date.now() > pending.holdExpiresAt) {
		console.info("[Storage] Đơn đặt vé tạm thời đã hết hạn giữ vé.")
		// We still return it or null based on expiration
	}
	return pending
}

/**
 * Lưu đơn đặt vé tạm thời vào LocalStorage
 * @param {Object} bookingData
 */
export function savePendingBooking(bookingData) {
	const payload = {
		...bookingData,
		updatedAt: Date.now(),
		holdExpiresAt: bookingData.holdExpiresAt || Date.now() + 600000, // 10 phút mặc định
	}
	storageSet(STORAGE_KEYS.PENDING_BOOKING, payload)
	return payload
}

/**
 * Xóa đơn đặt vé tạm thời
 */
export function clearPendingBooking() {
	storageRemove(STORAGE_KEYS.PENDING_BOOKING)
}

/* ==========================================================================
   BOOKING HISTORY MANAGEMENT (LocalStorage)
   ========================================================================== */

/**
 * Lấy toàn bộ lịch sử vé đã mua
 * @returns {Array}
 */
export function getBookingHistory() {
	return storageGet(STORAGE_KEYS.BOOKING_HISTORY, DEFAULT_BOOKING_HISTORY)
}

/**
 * Lưu vé mới đã thanh toán thành công vào lịch sử
 * @param {Object} ticket
 */
export function saveBookingTicket(ticket) {
	const history = getBookingHistory()
	const newTicket = {
		...ticket,
		id: ticket.id || "BT-" + Math.floor(100000 + Math.random() * 900000),
		bookingDate: ticket.bookingDate || new Date().toISOString(),
		status: ticket.status || "paid",
	}

	history.unshift(newTicket)
	storageSet(STORAGE_KEYS.BOOKING_HISTORY, history)

	// Nếu user đang đăng nhập, tích điểm thưởng (10% tổng tiền vé)
	const currentUser = getCurrentUser()
	if (currentUser) {
		const earnedPoints = Math.round((newTicket.total || 0) / 1000)
		currentUser.points = (currentUser.points || 0) + earnedPoints
		saveUserSession(currentUser)
		updateUserInDatabase(currentUser)
	}

	// Xóa pending booking
	clearPendingBooking()

	return newTicket
}

/* ==========================================================================
   USER AUTHENTICATION & DATABASE (LocalStorage)
   ========================================================================== */

export function getUsersList() {
	return storageGet(STORAGE_KEYS.USERS_LIST, DEFAULT_USERS)
}

export function isAccountRegistered(emailOrPhone) {
	if (!emailOrPhone) return false
	const list = getUsersList()
	const clean = emailOrPhone.trim().toLowerCase()
	return list.some(
		u => (u.email && u.email.toLowerCase() === clean) || (u.phone && u.phone.replace(/\s+/g, "") === clean.replace(/\s+/g, ""))
	)
}

export function registerNewUser(userData) {
	const list = getUsersList()
	const cleanEmail = (userData.email || "").trim().toLowerCase()
	const cleanPhone = (userData.phone || "").trim().replace(/\s+/g, "")

	if (list.some(u => (u.email && u.email.toLowerCase() === cleanEmail) || (u.phone && u.phone.replace(/\s+/g, "") === cleanPhone))) {
		return { success: false, message: "Email hoặc Số điện thoại này đã được đăng ký tài khoản!" }
	}

	const newUser = {
		id: "usr_" + Date.now(),
		name: userData.name.trim(),
		email: cleanEmail,
		phone: cleanPhone,
		password: userData.password,
		avatarText: userData.name.trim().charAt(0).toUpperCase(),
		rank: "Thành viên Beta Mới",
		points: 50, // Tặng 50 điểm thưởng ban đầu
		gender: userData.gender || "male",
		birthday: userData.birthday || "2000-01-01",
		city: userData.city || "Hà Nội",
		cinemaFavorite: userData.cinemaFavorite || "beta-thainguyen",
		createdAt: new Date().toISOString(),
	}

	list.push(newUser)
	storageSet(STORAGE_KEYS.USERS_LIST, list)
	saveUserSession(newUser)

	return { success: true, user: newUser }
}

export function authenticateUser(account, password) {
	const list = getUsersList()
	const cleanAcc = (account || "").trim().toLowerCase()
	const cleanPhone = cleanAcc.replace(/\s+/g, "")

	const user = list.find(
		u =>
			((u.email && u.email.toLowerCase() === cleanAcc) ||
				(u.phone && u.phone.replace(/\s+/g, "") === cleanPhone)) &&
			u.password === password
	)

	if (!user) {
		return { success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" }
	}

	saveUserSession(user)
	return { success: true, user }
}

export function updateUserInDatabase(updatedUser) {
	const list = getUsersList()
	const idx = list.findIndex(u => u.id === updatedUser.id || (u.email && u.email === updatedUser.email))
	if (idx !== -1) {
		list[idx] = { ...list[idx], ...updatedUser }
		storageSet(STORAGE_KEYS.USERS_LIST, list)
	}
}

export function getCurrentUser() {
	return storageGet(STORAGE_KEYS.USER_SESSION, null)
}

export function saveUserSession(userData) {
	storageSet(STORAGE_KEYS.USER_SESSION, userData)
}

export function logoutUser() {
	storageRemove(STORAGE_KEYS.USER_SESSION)
}

/* ==========================================================================
   HIGH-LEVEL DATA ACCESSORS (MOVIES, GENRES, CINEMAS, SHOWTIMES)
   ========================================================================== */

export function getMoviesData() {
	return storageGet(STORAGE_KEYS.MOVIES, null)
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

	return allMovies.find(m => m.id === movieId) || null
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

	let movieList
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
			list = list.filter(m =>
				(m.title && m.title.toLowerCase().includes(q)) ||
				(m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
				(m.director && m.director.toLowerCase().includes(q)) ||
				(Array.isArray(m.cast) && m.cast.some(c => c.toLowerCase().includes(q)))
			)
		}
	}

	if (genre && genre !== "all") {
		list = list.filter(m =>
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
				return !movieFormat.includes("3d") && !movieFormat.includes("imax") &&
					!specialTag.includes("3d") && !specialTag.includes("imax")
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

export function getGenres() {
	return storageGet(STORAGE_KEYS.GENRES, [])
}

export function getCinemas() {
	return storageGet(STORAGE_KEYS.CINEMAS, [])
}

export function getShowtimes() {
	return storageGet(STORAGE_KEYS.SHOWTIMES, [])
}

export function getConcessions() {
	return storageGet(STORAGE_KEYS.CONCESSIONS, [])
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

/* ==========================================================================
   SHOWTIME SEATS MANAGEMENT (LocalStorage)
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
	if (cached && Array.isArray(cached) && cached.length > 0) {
		return cached
	}

	const isIMAX = options.isIMAX || false
	const basePrice = options.basePrice || (isIMAX ? 120000 : 70000)
	const vipPrice = basePrice + 10000
	const sweetboxPrice = basePrice * 2 + 15000

	const rowDefs = [
		{ row: "A", type: "standard", price: basePrice, count: 12 },
		{ row: "B", type: "standard", price: basePrice, count: 12 },
		{ row: "C", type: "standard", price: basePrice, count: 12 },
		{ row: "D", type: "vip", price: vipPrice, count: 12 },
		{ row: "E", type: "vip", price: vipPrice, count: 12 },
		{ row: "F", type: "vip", price: vipPrice, count: 12 },
		{ row: "G", type: "vip", price: vipPrice, count: 12 },
		{ row: "H", type: "vip", price: vipPrice, count: 12 },
		{ row: "J", type: "sweetbox", price: sweetboxPrice, count: 5 },
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
				const seatId = `J0${c * 2 - 1}-J0${c * 2}`
				const isSold = (absHash + rIdx * 7 + c * 11) % 5 === 0
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
				const isSold =
					(absHash * (rIdx + 1) + c * 13) % 7 === 0 ||
					(rd.row === "F" && (c === 6 || c === 7)) ||
					(rd.row === "E" && c === 5)
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
