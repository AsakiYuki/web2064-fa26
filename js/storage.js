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
	INITIALIZED: `${STORAGE_PREFIX}data_initialized`,
	DATA_VERSION: `${STORAGE_PREFIX}data_version`,
}

/** Phiên bản dữ liệu mẫu - tăng lên khi JSON cập nhật để tự động sync lại LS */
export const CURRENT_DATA_VERSION = "2.1"

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
		// Có thể do QuotaExceededError
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
 * Chỉ dùng khi value lưu trữ là object
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
 * (chỉ xóa các key có prefix "beta_")
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
   DATA INITIALIZATION (SEED)
   ========================================================================== */

/**
 * Kiểm tra xem đã khởi tạo dữ liệu mẫu chưa
 * @returns {boolean}
 */
export function isDataInitialized() {
	return storageGet(STORAGE_KEYS.INITIALIZED) === true
}

/**
 * Fetch dữ liệu từ file JSON và lưu vào LocalStorage
 * @param {string} storageKey - Key lưu trong LS
 * @param {string} jsonPath - Đường dẫn tới file JSON
 * @returns {Promise<*>} Dữ liệu đã fetch
 */
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

/**
 * Khởi tạo và nạp toàn bộ dữ liệu mẫu vào LocalStorage
 * Chỉ chạy khi lần đầu (chưa có flag INITIALIZED)
 * @param {boolean} force - true = luôn nạp lại, bỏ qua flag
 * @returns {Promise<boolean>} true nếu khởi tạo thành công
 */
export async function initializeStorage(force = false) {
	const currentVer = storageGet(STORAGE_KEYS.DATA_VERSION)
	if (!force && isDataInitialized() && currentVer === CURRENT_DATA_VERSION) {
		console.info(`[Storage] Dữ liệu phiên bản v${CURRENT_DATA_VERSION} đã được khởi tạo trước đó. Bỏ qua.`)
		return true
	}

	console.info(`[Storage] Bắt đầu nạp dữ liệu mẫu (v${CURRENT_DATA_VERSION}) vào LocalStorage...`)

	const seedTasks = Object.entries(DATA_SOURCE_MAP).map(([key, path]) => fetchAndSeed(key, path))

	try {
		const results = await Promise.all(seedTasks)
		const allSuccess = results.every(r => r !== null)

		if (allSuccess) {
			storageSet(STORAGE_KEYS.INITIALIZED, true)
			storageSet(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
			console.info(`[Storage] ✅ Khởi tạo dữ liệu thành công! Toàn bộ data (v${CURRENT_DATA_VERSION}) đã được nạp vào LocalStorage.`)
		} else {
			console.warn("[Storage] ⚠️ Một số dữ liệu không nạp được. Sẽ thử lại lần sau.")
		}

		return allSuccess
	} catch (err) {
		console.error("[Storage] ❌ Lỗi nghiêm trọng khi khởi tạo dữ liệu:", err)
		return false
	}
}

/* ==========================================================================
   HIGH-LEVEL DATA ACCESSORS
   Các hàm tiện ích cấp cao để truy xuất dữ liệu đã lưu
   ========================================================================== */

/**
 * Lấy toàn bộ dữ liệu phim từ LocalStorage
 * @returns {Object|null} { tabs, items: { nowshowing, upcoming, special } }
 */
export function getMoviesData() {
	return storageGet(STORAGE_KEYS.MOVIES, null)
}

/**
 * Lấy danh sách phim theo tab (nowshowing / upcoming / special)
 * @param {string} tab - Tên tab
 * @returns {Array} Mảng phim
 */
export function getMoviesByTab(tab) {
	const data = getMoviesData()
	if (!data || !data.items) return []
	return data.items[tab] || []
}

/**
 * Tìm một phim theo ID trong toàn bộ danh sách
 * @param {string} movieId - ID phim
 * @returns {Object|null} Thông tin phim hoặc null
 */
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

/**
 * Tìm phim theo slug
 * @param {string} slug
 * @returns {Object|null}
 */
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

/**
 * Tìm kiếm phim theo từ khóa (tên, đạo diễn, diễn viên, thể loại)
 * @param {string} query - Từ khóa tìm kiếm
 * @param {string} [tab] - Giới hạn trong tab (optional)
 * @returns {Array} Danh sách phim phù hợp
 */
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
		// Tìm theo tên phim (Việt + gốc)
		if (m.title && m.title.toLowerCase().includes(q)) return true
		if (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) return true

		// Tìm theo đạo diễn
		if (m.director && m.director.toLowerCase().includes(q)) return true

		// Tìm theo diễn viên
		if (Array.isArray(m.cast) && m.cast.some(c => c.toLowerCase().includes(q))) return true

		// Tìm theo thể loại
		if (m.genre && m.genre.toLowerCase().includes(q)) return true

		// Tìm theo slug
		if (m.slug && m.slug.toLowerCase().includes(q)) return true

		return false
	})
}

/**
 * Lọc phim theo nhiều tiêu chí
 * @param {Object} filters - Các tiêu chí lọc
 * @param {string} [filters.tab] - Tab phim
 * @param {string} [filters.genre] - Slug thể loại
 * @param {string} [filters.age] - Badge độ tuổi (P, K, T13, T16, T18)
 * @param {string} [filters.format] - Định dạng (2D, 3D, IMAX)
 * @param {string} [filters.query] - Từ khóa tìm kiếm
 * @param {string} [filters.sort] - Kiểu sắp xếp
 * @returns {Array} Mảng phim đã lọc và sắp xếp
 */
export function filterMovies(filters = {}) {
	const { tab = "nowshowing", genre, age, format, query, sort } = filters

	let list = getMoviesByTab(tab)
	if (!list.length) return []

	// Spread để không mutate data gốc
	list = [...list]

	// Lọc theo từ khóa tìm kiếm
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

	// Lọc theo thể loại
	if (genre && genre !== "all") {
		list = list.filter(m =>
			(m.genreIds && m.genreIds.includes(genre)) ||
			(m.genre && m.genre.toLowerCase().includes(genre.replace("-", " ")))
		)
	}

	// Lọc theo độ tuổi
	if (age && age !== "all") {
		list = list.filter(m => m.badge && m.badge.toLowerCase() === age.toLowerCase())
	}

	// Lọc theo định dạng (2D, 3D, IMAX)
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

	// Sắp xếp
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
 * Lấy danh sách thể loại
 * @returns {Array}
 */
export function getGenres() {
	return storageGet(STORAGE_KEYS.GENRES, [])
}

/**
 * Lấy danh sách rạp phim
 * @returns {Array}
 */
export function getCinemas() {
	return storageGet(STORAGE_KEYS.CINEMAS, [])
}

/**
 * Lấy dữ liệu suất chiếu
 * @returns {Object|Array}
 */
export function getShowtimes() {
	return storageGet(STORAGE_KEYS.SHOWTIMES, [])
}

/**
 * Lấy danh sách combo bắp nước
 * @returns {Array}
 */
export function getConcessions() {
	return storageGet(STORAGE_KEYS.CONCESSIONS, [])
}

/**
 * Lấy bảng giá vé
 * @returns {Object}
 */
export function getTicketPricing() {
	return storageGet(STORAGE_KEYS.TICKET_PRICING, {})
}

/**
 * Lấy danh sách khuyến mãi
 * @returns {Array}
 */
export function getPromotions() {
	return storageGet(STORAGE_KEYS.PROMOTIONS, [])
}

/**
 * Lấy dữ liệu banner trang chủ
 * @returns {Array}
 */
export function getBanners() {
	return storageGet(STORAGE_KEYS.BANNERS, [])
}

/**
 * Lấy dữ liệu footer
 * @returns {Array}
 */
export function getFooterData() {
	return storageGet(STORAGE_KEYS.FOOTER, [])
}

/* ==========================================================================
   SHOWTIME SEATS MANAGEMENT (LocalStorage)
   ========================================================================== */

/**
 * Tạo key lưu trữ sơ đồ ghế cho một suất chiếu cụ thể trong LocalStorage
 */
export function getShowtimeStorageKey(cinemaId, movieId, date, time) {
	const safeCinema = (cinemaId || "default").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeMovie = (movieId || "default").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeDate = (date || "today").replace(/[^a-zA-Z0-9_-]/g, "")
	const safeTime = (time || "0000").replace(/[^a-zA-Z0-9_-]/g, "")
	return `${STORAGE_PREFIX}seats_${safeCinema}_${safeMovie}_${safeDate}_${safeTime}`
}

/**
 * Lấy hoặc khởi tạo sơ đồ ghế ngồi của một suất chiếu từ LocalStorage
 * @param {string} cinemaId
 * @param {string} movieId
 * @param {string} date
 * @param {string} time
 * @param {Object} options - { basePrice, isIMAX }
 * @returns {Array} Danh sách các hàng ghế và từng ghế cùng trạng thái (available / sold)
 */
export function getShowtimeSeats(cinemaId, movieId, date, time, options = {}) {
	const key = getShowtimeStorageKey(cinemaId, movieId, date, time)
	const cached = storageGet(key)
	if (cached && Array.isArray(cached) && cached.length > 0) {
		return cached
	}

	// Nếu chưa có trong LocalStorage, khởi tạo sơ đồ ghế mẫu và lưu vào LS
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

	// Hash để tạo ngẫu nhiên nhưng cố định các ghế đã bán (15-20% ghế)
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

	// Lưu vào LocalStorage
	storageSet(key, seatLayout)
	return seatLayout
}

/**
 * Cập nhật trạng thái ghế (ví dụ 'sold' khi đặt thành công hoặc 'held' khi đang giữ)
 */
export function updateShowtimeSeats(cinemaId, movieId, date, time, seatIds, status = "sold") {
	const key = getShowtimeStorageKey(cinemaId, movieId, date, time)
	const layout = getShowtimeSeats(cinemaId, movieId, date, time)
	if (!layout) return false

	let changed = false
	layout.forEach(rowBlock => {
		rowBlock.seats.forEach(s => {
			if (seatIds.includes(s.id)) {
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

