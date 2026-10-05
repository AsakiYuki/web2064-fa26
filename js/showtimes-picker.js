/**
 * Beta Cinemas - Showtimes Selector & Interactive Seat Booking Component
 * Chức năng chọn rạp, chọn ngày và lọc suất chiếu tương ứng
 * CHỈ hiển thị các khu vực/rạp phim thực sự CÓ suất chiếu, ẩn các khu vực/rạp không có suất chiếu
 */
import { formatCurrency, showToast, formatDateVN, translateDom, getSavedLang } from "./common.js"
import {
	getCinemas,
	getMoviesData,
	getShowtimes,
	getTicketPricing,
	getShowtimeSeats,
	updateShowtimeSeats,
} from "./storage.js"

export class ShowtimePicker {
	constructor(options = {}) {
		this.containerId = options.containerId || "showtimes-container"
		this.movieId = options.movieId || null // if null, shows all movies (schedule page)
		this.onSlotSelect = options.onSlotSelect || null

		this.cinemas = []
		this.movies = []
		this.showtimes = []
		this.ticketPricing = null

		this.selectedDate = null
		this.selectedCity = "all"
		this.selectedCinemaId = null

		// Seat booking modal state
		this.currentBooking = {
			movie: null,
			cinema: null,
			slot: null,
			format: "",
			date: "",
			selectedSeats: [],
		}
	}

	async init() {
		try {
			let cinemas = getCinemas()
			let moviesData = getMoviesData()
			let showtimesData = getShowtimes()
			let pricing = getTicketPricing()

			// Fallback nếu LocalStorage chưa có
			if (!cinemas.length || !moviesData) {
				const [c, m, s, p] = await Promise.all([
					fetch("/data/cinemas.json").then(r => r.json()),
					fetch("/data/movies.json").then(r => r.json()),
					fetch("/data/showtimes.json").then(r => r.json()),
					fetch("/data/ticket_pricing.json").then(r => r.json()).catch(() => null),
				])
				cinemas = c
				moviesData = m
				showtimesData = s
				pricing = p
			}

			this.cinemas = cinemas || []
			this.movies = [
				...(moviesData?.items?.nowshowing || []),
				...(moviesData?.items?.special || []),
				...(moviesData?.items?.upcoming || []),
			]
			this.showtimes = showtimesData || []
			this.ticketPricing = pricing

			// Default date is today: 2026-09-26
			this.selectedDate = "2026-09-26"

			// Check URL param for cinema if available
			const urlParams = new URLSearchParams(window.location.search)
			if (urlParams.get("cinema")) {
				const cinemaParam = urlParams.get("cinema")
				const found = this.cinemas.find(c => c.id === cinemaParam)
				if (found) this.selectedCinemaId = found.id
			}

			// Validate and auto-pick the first available cinema for this date/movie
			this.validateActiveSelection()

			this.render()
			this.initSeatModal()

			window.addEventListener("betaLangChange", () => {
				this.render()
			})
		} catch (err) {
			console.error("Failed to initialize ShowtimePicker:", err)
		}
	}

	/** Generate 8 days starting from 2026-09-26 */
	getDatesList() {
		const baseDate = new Date("2026-09-26T00:00:00")
		const dates = []
		const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]

		for (let i = 0; i < 8; i++) {
			const d = new Date(baseDate)
			d.setDate(baseDate.getDate() + i)

			const yyyy = d.getFullYear()
			const mm = String(d.getMonth() + 1).padStart(2, "0")
			const dd = String(d.getDate()).padStart(2, "0")
			const dateStr = `${yyyy}-${mm}-${dd}`

			let label = dayNames[d.getDay()]
			let tag = ""
			if (i === 0) {
				label = "Hôm nay"
				tag = "Hot"
			} else if (i === 1) {
				label = "Ngày mai"
			}

			dates.push({
				dateStr,
				dayLabel: label,
				dateFormatted: `${dd}/${mm}`,
				tag,
			})
		}
		return dates
	}

	/**
	 * Kiểm tra xem một rạp có suất chiếu vào ngày dateStr (cho movieId nếu có) không
	 * @param {string} cinemaId
	 * @param {string} dateStr
	 * @returns {boolean}
	 */
	hasShowtimes(cinemaId, dateStr) {
		const entry = this.showtimes.find(s => s.date === dateStr && s.cinemaId === cinemaId)
		if (!entry || !Array.isArray(entry.schedules) || entry.schedules.length === 0) {
			return false
		}

		if (this.movieId) {
			return entry.schedules.some(
				sch => sch.movieId === this.movieId && Array.isArray(sch.slots) && sch.slots.length > 0
			)
		}

		return entry.schedules.some(sch => Array.isArray(sch.slots) && sch.slots.length > 0)
	}

	/**
	 * Lấy danh sách rạp THỰC SỰ CÓ SUẤT CHIẾU cho ngày và khu vực hiện tại
	 * @param {string} dateStr
	 * @param {string} city - "all" hoặc tên thành phố
	 * @returns {Array}
	 */
	getAvailableCinemas(dateStr, city = "all") {
		return this.cinemas.filter(c => {
			const matchesCity = city === "all" || c.city === city
			return matchesCity && this.hasShowtimes(c.id, dateStr)
		})
	}

	/**
	 * Lấy danh sách các khu vực/thành phố THỰC SỰ CÓ RẠP CÓ SUẤT CHIẾU
	 * @param {string} dateStr
	 * @returns {Array}
	 */
	getAvailableCities(dateStr) {
		const cities = new Set()
		this.cinemas.forEach(c => {
			if (c.city && this.hasShowtimes(c.id, dateStr)) {
				cities.add(c.city)
			}
		})
		return Array.from(cities)
	}

	/**
	 * Tự động đồng bộ và điều chỉnh rạp/khu vực được chọn nếu rạp hiện tại không có suất chiếu
	 */
	validateActiveSelection() {
		const availableCities = this.getAvailableCities(this.selectedDate)

		// Nếu thành phố đang chọn không còn rạp nào có suất chiếu -> reset về 'all'
		if (this.selectedCity !== "all" && !availableCities.includes(this.selectedCity)) {
			this.selectedCity = "all"
		}

		const availableCinemas = this.getAvailableCinemas(this.selectedDate, this.selectedCity)

		// Nếu rạp đang chọn không có trong danh sách rạp có suất chiếu -> chọn rạp đầu tiên có suất chiếu
		if (!availableCinemas.some(c => c.id === this.selectedCinemaId)) {
			this.selectedCinemaId = availableCinemas.length > 0 ? availableCinemas[0].id : null
		}
	}

	render() {
		const container = document.getElementById(this.containerId)
		if (!container) return

		this.validateActiveSelection()

		const dates = this.getDatesList()
		const availableCities = this.getAvailableCities(this.selectedDate)
		const availableCinemas = this.getAvailableCinemas(this.selectedDate, this.selectedCity)

		container.innerHTML = `
			<div class="showtimes-section" id="showtimes-picker-box">
				<div class="showtimes-header">
					<div class="title-wrap">
						<h2>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
							LỊCH CHIẾU & SUẤT VÉ
						</h2>
						<p>Chỉ hiển thị các khu vực và rạp phim đang có suất chiếu khả dụng</p>
					</div>
					<div class="legend-quick">
						<div class="legend-item"><span class="dot dot-avail"></span> Còn vé</div>
						<div class="legend-item"><span class="dot dot-almost"></span> Sắp hết vé</div>
						<div class="legend-item"><span class="dot dot-full"></span> Hết vé</div>
					</div>
				</div>

				<!-- 1. DATE CAROUSEL SELECTOR -->
				<div class="date-selector-wrap">
					<div class="date-selector-label">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						1. CHỌN NGÀY XEM
					</div>
					<div class="date-selector-scroll" id="date-selector-scroll">
						${dates
							.map(
								d => `
							<button type="button" class="date-card-btn ${this.selectedDate === d.dateStr ? "active" : ""}" data-date="${d.dateStr}">
								<span class="date-day-name">${d.dayLabel}</span>
								<span class="date-day-num">${d.dateFormatted}</span>
								${d.tag ? `<span class="date-status-tag">${d.tag}</span>` : ""}
							</button>
						`,
							)
							.join("")}
					</div>
				</div>

				<!-- 2. CINEMA & REGION SELECTOR (CHỈ HIỂN THỊ KHU VỰC VÀ RẠP CÓ SUẤT CHIẾU) -->
				<div id="cinema-and-results-section">
					${this.renderCinemaAndResults(availableCities, availableCinemas)}
				</div>
			</div>
		`

		this.attachEvents()
		translateDom(getSavedLang())
	}

	renderCinemaAndResults(availableCities, availableCinemas) {
		if (availableCities.length === 0 || availableCinemas.length === 0) {
			const targetMovie = this.movieId ? this.movies.find(m => m.id === this.movieId) : null
			const movieNameText = targetMovie ? ` của phim <strong>${targetMovie.title}</strong>` : ""
			return `
				<div class="no-showtimes-notice" style="background: rgba(24, 24, 37, 0.7); border: 1px dashed rgba(88, 91, 112, 0.4); border-radius: 12px; padding: 48px 24px; text-align: center; margin-top: 24px;">
					<div class="notice-icon" style="font-size: 48px; margin-bottom: 12px;">🎬</div>
					<h3 style="color: #cdd6f4; font-size: 18px; margin: 0 0 8px;">Không Có Suất Chiếu Vào Ngày Này</h3>
					<p style="color: #a6adc8; font-size: 14px; margin: 0 0 16px; max-width: 520px; margin-left: auto; margin-right: auto;">
						Hiện tại không có rạp nào có lịch chiếu${movieNameText} vào ngày <strong>${formatDateVN(this.selectedDate)}</strong>.
					</p>
					<p style="color: #89b4fa; font-size: 13px; font-weight: 600; margin: 0;">
						💡 Quý khách vui lòng chọn các ngày khác có suất chiếu ở mục <strong>1. CHỌN NGÀY XEM</strong> phía trên.
					</p>
				</div>
			`
		}

		return `
			<div class="cinema-filter-container">
				<div class="city-pills-row">
					<span class="city-label">2. KHU VỰC CÓ SUẤT CHIẾU:</span>
					<button type="button" class="city-pill-btn ${this.selectedCity === "all" ? "active" : ""}" data-city="all">
						Tất cả (${availableCinemas.length} rạp)
					</button>
					${availableCities
						.map(city => {
							const countInCity = this.getAvailableCinemas(this.selectedDate, city).length
							return `
								<button type="button" class="city-pill-btn ${this.selectedCity === city ? "active" : ""}" data-city="${city}">
									${city} (${countInCity})
								</button>
							`
						})
						.join("")}
				</div>

				<div class="cinemas-list-grid" id="cinemas-list-grid">
					${availableCinemas
						.map(
							c => `
						<div class="cinema-card-choice ${this.selectedCinemaId === c.id ? "active" : ""}" data-cinema-id="${c.id}">
							<div class="cinema-name">
								${c.name}
								<span class="check-mark">✓</span>
							</div>
							<div class="cinema-addr">${c.address || ""}</div>
							<div class="cinema-facs">
								${(c.facilities || []).slice(0, 2).map(f => `<span class="fac-tag">${f}</span>`).join("")}
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</div>

			<!-- 3. SLOTS SCHEDULE DISPLAY -->
			<div class="showtimes-results-wrap" id="showtimes-results-wrap">
				${this.renderShowtimeResults()}
			</div>
		`
	}

	/** Render kết quả suất chiếu của rạp đang chọn */
	renderShowtimeResults() {
		const currentCinema = this.cinemas.find(c => c.id === this.selectedCinemaId)
		if (!currentCinema) {
			return `
				<div class="no-showtimes-notice">
					<div class="notice-icon">🏢</div>
					<p>Vui lòng chọn rạp chiếu phim để xem danh sách suất chiếu.</p>
				</div>
			`
		}

		const scheduleEntry = this.showtimes.find(
			s => s.date === this.selectedDate && s.cinemaId === this.selectedCinemaId
		)

		if (!scheduleEntry || !Array.isArray(scheduleEntry.schedules) || scheduleEntry.schedules.length === 0) {
			return `
				<div class="no-showtimes-notice">
					<div class="notice-icon">🎬</div>
					<p>Không có suất chiếu tại <strong>${currentCinema.name}</strong> vào ngày <strong>${formatDateVN(this.selectedDate)}</strong>.</p>
				</div>
			`
		}

		// Mode A: Single Movie Mode (movie-detail.html)
		if (this.movieId) {
			const movieSchedules = (scheduleEntry.schedules || []).filter(s => s.movieId === this.movieId)

			if (!movieSchedules.length) {
				return `
					<div class="no-showtimes-notice">
						<div class="notice-icon">🎬</div>
						<p>Hiện tại rạp <strong>${currentCinema.name}</strong> chưa có suất chiếu của phim này vào ngày <strong>${formatDateVN(this.selectedDate)}</strong>.</p>
						<p style="margin-top: 8px; font-size: 13px; color: #94a3b8;">Quý khách vui lòng chọn cụm rạp khác ở phía trên nhé!</p>
					</div>
				`
			}

			return movieSchedules
				.map(
					group => `
				<div class="showtime-group-card">
					<div class="group-title-row">
						<div class="format-title">
							<span class="format-badge">${group.format}</span>
							<span>${group.movieTitle}</span>
						</div>
						<div class="screen-name">${group.screenName}</div>
					</div>
					<div class="slots-grid">
						${group.slots
							.map(
								slot => `
							<button type="button" class="slot-btn ${slot.availableSeats === 0 ? "disabled" : ""}"
								data-movie-id="${group.movieId}"
								data-movie-title="${group.movieTitle}"
								data-cinema-id="${currentCinema.id}"
								data-cinema-name="${currentCinema.name}"
								data-screen-name="${group.screenName}"
								data-format="${group.format}"
								data-time="${slot.time}"
								data-price="${slot.price}"
								data-seats="${slot.availableSeats}">
								<span class="slot-time">${slot.time}</span>
								<span class="slot-end">${this.calcEndTime(slot.time, 110)}</span>
								<span class="slot-price">${formatCurrency(slot.price)}</span>
								<span class="slot-seats ${
									slot.availableSeats === 0
										? "seats-red"
										: slot.availableSeats <= 10
											? "seats-yellow"
											: "seats-green"
								}">
									${slot.availableSeats === 0 ? "Hết vé" : `${slot.availableSeats} ghế trống`}
								</span>
							</button>
						`,
							)
							.join("")}
					</div>
				</div>
			`,
				)
				.join("")
		}

		// Mode B: All Movies Mode (schedule.html)
		const schedules = scheduleEntry.schedules || []
		if (!schedules.length) {
			return `
				<div class="no-showtimes-notice">
					<div class="notice-icon">🍿</div>
					<p>Không tìm thấy suất chiếu nào tại <strong>${currentCinema.name}</strong> vào ngày <strong>${formatDateVN(this.selectedDate)}</strong>.</p>
				</div>
			`
		}

		// Group schedules by movieId
		const movieMap = new Map()
		schedules.forEach(item => {
			if (!movieMap.has(item.movieId)) {
				movieMap.set(item.movieId, [])
			}
			movieMap.get(item.movieId).push(item)
		})

		let html = ""
		for (const [mId, groupList] of movieMap.entries()) {
			const movieInfo = this.movies.find(m => m.id === mId) || {
				title: groupList[0].movieTitle,
				poster: "/poster/poster_utlan2.jpg",
				genre: "Phim Chiếu Rạp",
				duration: "105 phút",
				badge: "T18",
			}

			html += `
				<div class="schedule-movie-row" style="background:#313244; border-radius:12px; border:1px solid rgba(88, 91, 112, 0.4); padding:20px; margin-bottom:20px; box-shadow:0 8px 24px rgba(0,0,0,0.25); display:grid; grid-template-columns: 140px 1fr; gap:20px;">
					<div class="schedule-movie-thumb" style="aspect-ratio:2/3; border-radius:8px; overflow:hidden; position:relative;">
						<a href="/movie-detail.html?id=${mId}">
							<img src="${movieInfo.poster}" alt="${movieInfo.title}" style="width:100%; height:100%; object-fit:cover;" />
							<span style="position:absolute; top:6px; left:6px; background:#f38ba8; color:#11111b; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">${movieInfo.badge || "T18"}</span>
						</a>
					</div>
					<div class="schedule-movie-content" style="display:flex; flex-direction:column; gap:8px;">
						<h3 style="margin:0; font-size:18px; font-weight:800; color:#cdd6f4;">
							<a href="/movie-detail.html?id=${mId}" style="color:inherit; text-decoration:none;">${movieInfo.title}</a>
						</h3>
						<div style="font-size:13px; color:#a6adc8; display:flex; gap:12px; flex-wrap:wrap;">
							<span>🎭 ${movieInfo.genre || "Hành động"}</span>
							<span>⏱️ ${movieInfo.duration || "110 phút"}</span>
							${movieInfo.ratingScore ? `<span>⭐ ${movieInfo.ratingScore}/10</span>` : ""}
						</div>

						<div class="schedule-groups-wrap" style="margin-top:10px;">
							${groupList
								.map(
									g => `
								<div style="margin-bottom:12px;">
									<div style="font-size:13px; font-weight:700; color:#89b4fa; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
										<span style="background:rgba(137, 180, 250, 0.15); color:#89b4fa; padding:2px 8px; border-radius:4px;">${g.format}</span>
										<span style="color:#a6adc8; font-size:12px;">- ${g.screenName}</span>
									</div>
									<div class="slots-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:10px;">
										${g.slots
											.map(
												slot => `
											<button type="button" class="slot-btn ${slot.availableSeats === 0 ? "disabled" : ""}"
												data-movie-id="${mId}"
												data-movie-title="${movieInfo.title}"
												data-cinema-id="${currentCinema.id}"
												data-cinema-name="${currentCinema.name}"
												data-screen-name="${g.screenName}"
												data-format="${g.format}"
												data-time="${slot.time}"
												data-price="${slot.price}"
												data-seats="${slot.availableSeats}">
												<span class="slot-time">${slot.time}</span>
												<span class="slot-price">${formatCurrency(slot.price)}</span>
												<span class="slot-seats ${slot.availableSeats === 0 ? "seats-red" : slot.availableSeats <= 10 ? "seats-yellow" : "seats-green"}">
													${slot.availableSeats === 0 ? "Hết vé" : `${slot.availableSeats} ghế`}
												</span>
											</button>
										`,
											)
											.join("")}
									</div>
								</div>
							`,
								)
								.join("")}
						</div>
					</div>
				</div>
			`
		}

		return html
	}

	calcEndTime(startTime, durationMinutes = 105) {
		const [h, m] = startTime.split(":").map(Number)
		const totalMinutes = h * 60 + m + durationMinutes
		const endH = Math.floor(totalMinutes / 60) % 24
		const endM = totalMinutes % 60
		return `~${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
	}

	attachEvents() {
		const container = document.getElementById(this.containerId)
		if (!container) return

		// Date buttons
		container.querySelectorAll(".date-card-btn").forEach(btn => {
			btn.addEventListener("click", () => {
				this.selectedDate = btn.dataset.date
				this.render()
			})
		})

		// City pills
		container.querySelectorAll(".city-pill-btn").forEach(btn => {
			btn.addEventListener("click", () => {
				this.selectedCity = btn.dataset.city
				this.render()
			})
		})

		// Cinema choice cards
		container.querySelectorAll(".cinema-card-choice").forEach(card => {
			card.addEventListener("click", () => {
				this.selectedCinemaId = card.dataset.cinemaId
				container.querySelectorAll(".cinema-card-choice").forEach(c => c.classList.remove("active"))
				card.classList.add("active")
				this.renderShowtimeResultsOnly()
			})
		})

		// Showtime slot click -> Open seat selection
		this.attachSlotEvents(container)
	}

	attachSlotEvents(container) {
		const wrap = container || document.getElementById(this.containerId)
		if (!wrap) return

		wrap.querySelectorAll(".slot-btn:not(.disabled)").forEach(btn => {
			btn.addEventListener("click", () => {
				const slotData = {
					movieId: btn.dataset.movieId,
					movieTitle: btn.dataset.movieTitle,
					cinemaId: btn.dataset.cinemaId,
					cinemaName: btn.dataset.cinemaName,
					screenName: btn.dataset.screenName,
					format: btn.dataset.format,
					time: btn.dataset.time,
					price: +btn.dataset.price,
					date: this.selectedDate,
				}

				if (typeof this.onSlotSelect === "function") {
					this.onSlotSelect(slotData)
				} else {
					const bookingUrl = `/booking.html?movieId=${encodeURIComponent(slotData.movieId)}&cinemaId=${encodeURIComponent(slotData.cinemaId)}&date=${encodeURIComponent(slotData.date)}&time=${encodeURIComponent(slotData.time)}&screen=${encodeURIComponent(slotData.screenName)}&format=${encodeURIComponent(slotData.format)}`
					window.location.href = bookingUrl
				}
			})
		})
	}

	renderShowtimeResultsOnly() {
		const resultsWrap = document.getElementById("showtimes-results-wrap")
		if (!resultsWrap) return
		resultsWrap.style.opacity = "0.4"
		resultsWrap.style.transition = "opacity 0.2s ease"
		setTimeout(() => {
			resultsWrap.innerHTML = this.renderShowtimeResults()
			resultsWrap.style.opacity = "1"
			this.attachSlotEvents(resultsWrap)
		}, 150)
	}

	/* ==========================================================================
	   INTERACTIVE SEAT SELECTION MODAL
	   ========================================================================== */
	initSeatModal() {
		let modal = document.getElementById("seat-booking-modal")
		if (!modal) {
			modal = document.createElement("div")
			modal.id = "seat-booking-modal"
			modal.className = "modal-backdrop"
			modal.innerHTML = `
				<div class="modal-content seat-modal-content" role="dialog" aria-modal="true" aria-label="Chọn ghế ngồi">
					<button class="modal-close-btn" id="seat-modal-close" aria-label="Đóng">&#x2715;</button>
					<div id="seat-modal-body"></div>
				</div>
			`
			document.body.appendChild(modal)

			modal.addEventListener("click", e => {
				if (e.target === modal) this.closeSeatModal()
			})
			modal.querySelector("#seat-modal-close").addEventListener("click", () => this.closeSeatModal())
		}
	}

	openSeatModal(slotData) {
		this.currentBooking = {
			...slotData,
			selectedSeats: [],
		}

		const body = document.getElementById("seat-modal-body")
		if (!body) return

		const basePrice = slotData.price || 75000
		const seatLayout = getShowtimeSeats(slotData.cinemaId, slotData.movieId, slotData.date, slotData.time, {
			basePrice,
			isIMAX: (slotData.format || "").toLowerCase().includes("imax"),
		})

		let seatRowsHTML = ""
		seatLayout.forEach(rowBlock => {
			let seatsInRow = ""
			const isSweetbox = rowBlock.type === "sweetbox"

			rowBlock.seats.forEach(seat => {
				const isSold = seat.status === "sold"
				seatsInRow += `
					<div class="seat-item seat-${seat.type} ${isSold ? "seat-sold" : ""}"
						data-seat-id="${seat.id}"
						data-seat-type="${seat.type}"
						data-price="${seat.price}"
						data-status="${seat.status}"
						title="${seat.id} (${seat.type === "vip" ? "Ghế VIP" : seat.type === "sweetbox" ? "Ghế Đôi Sweetbox" : "Ghế Thường"}: ${formatCurrency(seat.price)})"
						role="checkbox"
						aria-checked="false"
						tabindex="${isSold ? "-1" : "0"}">
						${isSweetbox ? "👫" : seat.col}
					</div>
				`
			})

			seatRowsHTML += `
				<div class="seat-row-line">
					<span class="row-label">${rowBlock.row}</span>
					<div class="row-seats-wrap ${isSweetbox ? "sweetbox-wrap" : ""}">${seatsInRow}</div>
					<span class="row-label">${rowBlock.row}</span>
				</div>
			`
		})

		body.innerHTML = `
			<div class="seat-modal-header">
				<div>
					<h3 class="sm-movie-title">${slotData.movieTitle}</h3>
					<div class="sm-meta-info">
						<span>🏛️ ${slotData.cinemaName}</span>
						<span>📽️ ${slotData.screenName} (${slotData.format})</span>
						<span>⏱️ ${slotData.time} - ${formatDateVN(slotData.date)}</span>
					</div>
				</div>
				<div class="hold-timer-pill" id="seat-modal-hold-timer">
					<span>Giữ ghế: </span>
					<strong id="modal-timer-digits">05:00</strong>
				</div>
			</div>

			<!-- Screen Screen Visual -->
			<div class="modal-screen-indicator">
				<div class="screen-glow"></div>
				<span class="screen-text">MÀN HÌNH CHIẾU PHIM</span>
			</div>

			<!-- Seat Grid Container -->
			<div class="modal-seat-grid-container" id="modal-seat-grid-container">
				${seatRowsHTML}
			</div>

			<!-- Legend -->
			<div class="modal-seat-legend">
				<div class="l-item"><div class="l-box std"></div> <span>Thường (${formatCurrency(basePrice)})</span></div>
				<div class="l-item"><div class="l-box vip"></div> <span>VIP (${formatCurrency(basePrice + 10000)})</span></div>
				<div class="l-item"><div class="l-box swb"></div> <span>Ghế đôi (${formatCurrency(basePrice * 2 + 15000)})</span></div>
				<div class="l-item"><div class="l-box sold"></div> <span>Đã bán</span></div>
				<div class="l-item"><div class="l-box sel"></div> <span>Đang chọn</span></div>
			</div>

			<!-- Bottom bar with Selected seats & Price -->
			<div class="modal-booking-bottom-bar">
				<div class="mb-seats-info">
					<div class="seats-count-label">Ghế đã chọn: <strong id="modal-selected-seats-text">Chưa chọn</strong></div>
					<div class="seats-total-price">Tổng cộng: <strong id="modal-total-price-text">0 ₫</strong></div>
				</div>
				<button type="button" class="btn-modal-proceed" id="btn-modal-proceed" disabled>
					<span>TIẾP TỤC ĐẶT VÉ</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
				</button>
			</div>
		`

		const modal = document.getElementById("seat-booking-modal")
		modal?.classList.add("active")
		document.body.style.overflow = "hidden"

		this.attachSeatModalEvents(slotData)
		this.startModalHoldTimer()
		translateDom(getSavedLang())
	}

	attachSeatModalEvents(slotData) {
		const modalBody = document.getElementById("seat-modal-body")
		if (!modalBody) return

		modalBody.querySelectorAll(".seat-item:not(.seat-sold)").forEach(seatEl => {
			seatEl.addEventListener("click", () => this.toggleSeat(seatEl))
		})

		const proceedBtn = document.getElementById("btn-modal-proceed")
		proceedBtn?.addEventListener("click", () => {
			if (!this.currentBooking.selectedSeats.length) {
				showToast("Vui lòng chọn ít nhất 1 ghế để tiếp tục.", "warning")
				return
			}

			const seatNames = this.currentBooking.selectedSeats.map(s => s.id).join(", ")
			const totalAmount = this.currentBooking.selectedSeats.reduce((sum, s) => sum + s.price, 0)

			this.closeSeatModal()

			// Redirect to full booking page (Step 2: Concessions & Checkout)
			const bookingUrl = `/booking.html?movieId=${encodeURIComponent(slotData.movieId)}&cinemaId=${encodeURIComponent(slotData.cinemaId)}&date=${encodeURIComponent(slotData.date)}&time=${encodeURIComponent(slotData.time)}&screen=${encodeURIComponent(slotData.screenName)}&format=${encodeURIComponent(slotData.format)}&seats=${encodeURIComponent(seatNames)}&total=${totalAmount}`

			window.location.href = bookingUrl
		})
	}

	toggleSeat(seatEl) {
		if (seatEl.classList.contains("seat-sold") || seatEl.dataset.status === "sold") return

		const seatId = seatEl.dataset.seatId
		const seatType = seatEl.dataset.seatType
		const seatPrice = +seatEl.dataset.price

		const existingIdx = this.currentBooking.selectedSeats.findIndex(s => s.id === seatId)

		if (existingIdx > -1) {
			this.currentBooking.selectedSeats.splice(existingIdx, 1)
			seatEl.classList.remove("seat-selected")
			seatEl.setAttribute("aria-checked", "false")
		} else {
			if (this.currentBooking.selectedSeats.length >= 8) {
				showToast("Bạn chỉ có thể chọn tối đa 8 ghế trong 1 lượt đặt.", "warning")
				return
			}
			this.currentBooking.selectedSeats.push({
				id: seatId,
				type: seatType,
				price: seatPrice,
			})
			seatEl.classList.add("seat-selected")
			seatEl.setAttribute("aria-checked", "true")
		}

		this.updateModalSelectedUI()
	}

	updateModalSelectedUI() {
		const seatsTextEl = document.getElementById("modal-selected-seats-text")
		const priceTextEl = document.getElementById("modal-total-price-text")
		const proceedBtn = document.getElementById("btn-modal-proceed")

		const seats = this.currentBooking.selectedSeats
		const total = seats.reduce((sum, s) => sum + s.price, 0)

		if (seatsTextEl) {
			seatsTextEl.textContent = seats.length ? seats.map(s => s.id).join(", ") : "Chưa chọn"
		}
		if (priceTextEl) {
			priceTextEl.textContent = formatCurrency(total)
		}
		if (proceedBtn) {
			proceedBtn.disabled = seats.length === 0
		}
	}

	startModalHoldTimer() {
		let seconds = 300
		const timerDigits = document.getElementById("modal-timer-digits")

		if (this.modalHoldInterval) clearInterval(this.modalHoldInterval)

		this.modalHoldInterval = setInterval(() => {
			seconds--
			if (seconds <= 0) {
				clearInterval(this.modalHoldInterval)
				showToast("Thời gian giữ ghế đã hết! Vui lòng chọn lại.", "warning")
				this.closeSeatModal()
				return
			}
			const m = String(Math.floor(seconds / 60)).padStart(2, "0")
			const s = String(seconds % 60).padStart(2, "0")
			if (timerDigits) timerDigits.textContent = `${m}:${s}`
		}, 1000)
	}

	closeSeatModal() {
		if (this.modalHoldInterval) clearInterval(this.modalHoldInterval)
		const modal = document.getElementById("seat-booking-modal")
		if (modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	}
}
