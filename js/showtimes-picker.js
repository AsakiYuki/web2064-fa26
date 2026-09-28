/**
 * Beta Cinemas - Showtimes Selector & Interactive Seat Booking Component
 * Chức năng chọn rạp, chọn ngày và lọc suất chiếu tương ứng
 * Render sơ đồ ghế động, đếm ngược giữ ghế, tính tổng tiền tự động
 */
import { formatCurrency, showToast, formatDateVN } from "./common.js"
import { getCinemas, getMoviesData, getShowtimes, getTicketPricing, getShowtimeSeats, updateShowtimeSeats, storageGet, storageSet, STORAGE_KEYS } from "./storage.js"

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
		this.selectedCinemaId = "beta-thainguyen"

		// Seat booking modal state
		this.currentBooking = {
			movie: null,
			cinema: null,
			slot: null,
			format: "",
			date: "",
			selectedSeats: [], // Array of { id: "D05", type: "vip", price: 75000 }
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

			this.render()
			this.initSeatModal()
		} catch (err) {
			console.error("Failed to initialize ShowtimePicker:", err)
		}
	}

	/** Generate 7 days starting from 2026-09-26 */
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

	/** Get list of unique cities */
	getCities() {
		const cities = new Set()
		this.cinemas.forEach(c => {
			if (c.city) cities.add(c.city)
		})
		return Array.from(cities)
	}

	render() {
		const container = document.getElementById(this.containerId)
		if (!container) return

		const dates = this.getDatesList()
		const cities = this.getCities()
		const filteredCinemas =
			this.selectedCity === "all"
				? this.cinemas
				: this.cinemas.filter(c => c.city === this.selectedCity)

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
						<p>Chọn ngày xem và cụm rạp để hiển thị danh sách các suất chiếu chính xác nhất</p>
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

				<!-- 2. CINEMA SELECTOR -->
				<div class="cinema-filter-container">
					<div class="city-pills-row">
						<span class="city-label">2. CHỌN KHU VỰC:</span>
						<button type="button" class="city-pill-btn ${this.selectedCity === "all" ? "active" : ""}" data-city="all">Tất cả</button>
						${cities
							.map(
								city => `
							<button type="button" class="city-pill-btn ${this.selectedCity === city ? "active" : ""}" data-city="${city}">${city}</button>
						`,
							)
							.join("")}
					</div>

					<div class="cinemas-list-grid" id="cinemas-list-grid">
						${filteredCinemas
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
			</div>
		`

		this.attachEvents()
	}

	/** Render results based on single movie mode or schedule mode */
	renderShowtimeResults() {
		const currentCinema = this.cinemas.find(c => c.id === this.selectedCinemaId)
		if (!currentCinema) {
			return `<div class="no-showtimes-notice"><div class="notice-icon">🏢</div><p>Vui lòng chọn cụm rạp để xem lịch chiếu.</p></div>`
		}

		// Find in showtimes.json for (selectedDate, selectedCinemaId)
		let scheduleEntry = this.showtimes.find(
			s => s.date === this.selectedDate && s.cinemaId === this.selectedCinemaId,
		)

		// Fallback: If not in json, generate dynamic realistic schedule so user can explore any date/cinema seamlessly
		if (!scheduleEntry) {
			scheduleEntry = this.generateFallbackSchedule(this.selectedDate, currentCinema)
		}

		// Mode A: Single Movie Mode (movie-detail.html)
		if (this.movieId) {
			const movieSchedules = (scheduleEntry.schedules || []).filter(s => s.movieId === this.movieId)

			if (!movieSchedules.length) {
				return `
					<div class="no-showtimes-notice">
						<div class="notice-icon">🎬</div>
						<p>Hiện tại chưa có suất chiếu của phim này tại <strong>${currentCinema.name}</strong> vào ngày <strong>${this.selectedDate}</strong>.</p>
						<p style="margin-top: 8px; font-size: 13px; color: #94a3b8;">Bạn có thể chọn rạp khác hoặc ngày khác ở phía trên nhé!</p>
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
					<p>Không tìm thấy suất chiếu nào tại <strong>${currentCinema.name}</strong> vào ngày <strong>${this.selectedDate}</strong>.</p>
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
				<div class="schedule-movie-row" style="background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:20px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); display:grid; grid-template-columns: 140px 1fr; gap:20px;">
					<div class="schedule-movie-thumb" style="aspect-ratio:2/3; border-radius:8px; overflow:hidden; position:relative;">
						<a href="/movie-detail.html?id=${mId}">
							<img src="${movieInfo.poster}" alt="${movieInfo.title}" style="width:100%; height:100%; object-fit:cover;" />
							<span style="position:absolute; top:6px; left:6px; background:#e63946; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">${movieInfo.badge || "T18"}</span>
						</a>
					</div>
					<div class="schedule-movie-content" style="display:flex; flex-direction:column; gap:8px;">
						<h3 style="margin:0; font-size:18px; font-weight:800; color:#1a1a2e;">
							<a href="/movie-detail.html?id=${mId}" style="color:inherit; text-decoration:none;">${movieInfo.title}</a>
						</h3>
						<div style="font-size:13px; color:#6b7280; display:flex; gap:12px; flex-wrap:wrap;">
							<span>🎭 ${movieInfo.genre || "Hành động"}</span>
							<span>⏱️ ${movieInfo.duration || "110 phút"}</span>
							${movieInfo.ratingScore ? `<span>⭐ ${movieInfo.ratingScore}/10</span>` : ""}
						</div>

						<div class="schedule-groups-wrap" style="margin-top:10px;">
							${groupList
								.map(
									g => `
								<div style="margin-bottom:12px;">
									<div style="font-size:13px; font-weight:700; color:#0284c7; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
										<span style="background:#e0f2fe; padding:2px 8px; border-radius:4px;">${g.format}</span>
										<span style="color:#64748b; font-size:12px;">- ${g.screenName}</span>
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

	/** Generate dynamic realistic schedule for dates / cinemas not explicitly stored */
	generateFallbackSchedule(dateStr, cinema) {
		const sampleMovies = this.movies.slice(0, 4)
		const formats = ["2D Phụ Đề", "2D Lồng Tiếng", "IMAX 3D"]
		const times = [
			["09:30", "12:15", "15:00", "18:00", "20:45"],
			["10:00", "13:15", "16:30", "19:45", "22:15"],
			["11:00", "14:15", "17:30", "20:30"],
			["13:45", "17:45", "21:15"],
		]

		const schedules = sampleMovies.map((m, idx) => {
			const isImax = idx === 2 && cinema.facilities?.some(f => f.includes("IMAX"))
			const fmt = isImax ? "IMAX 3D" : formats[idx % 2]
			const basePrice = isImax ? 130000 : 70000
			const slotTimes = times[idx % times.length]

			return {
				movieId: m.id,
				movieTitle: m.title,
				screenId: `${cinema.id}-P${idx + 1}`,
				screenName: isImax ? "Phòng IMAX" : `Phòng chiếu ${idx + 1}`,
				format: fmt,
				slots: slotTimes.map(t => ({
					time: t,
					price: basePrice,
					availableSeats: Math.floor(Math.random() * 55) + 5,
				})),
			}
		})

		return {
			date: dateStr,
			cinemaId: cinema.id,
			schedules,
		}
	}

	calcEndTime(startTime, durationMinutes = 105) {
		const [h, m] = startTime.split(":").map(Number)
		const totalMinutes = h * 60 + m + durationMinutes
		const endH = Math.floor(totalMinutes / 60) % 24
		const endM = totalMinutes % 60
		return `~${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
	}

	/**
	 * Lấy suất chiếu đã lọc theo ngày + rạp hiện tại từ LocalStorage
	 * @returns {Object|null} scheduleEntry { date, cinemaId, schedules: [...] }
	 */
	getFilteredShowtimes() {
		const currentCinema = this.cinemas.find(c => c.id === this.selectedCinemaId)
		if (!currentCinema) return null

		// Tìm trong dữ liệu showtimes chính xác theo date + cinemaId
		let scheduleEntry = this.showtimes.find(
			s => s.date === this.selectedDate && s.cinemaId === this.selectedCinemaId,
		)

		// Fallback: sinh lịch mẫu nếu không tìm thấy
		if (!scheduleEntry) {
			scheduleEntry = this.generateFallbackSchedule(this.selectedDate, currentCinema)
		}

		// Nếu đang ở mode single-movie, lọc chỉ hiện phim đó
		if (this.movieId) {
			const filtered = (scheduleEntry.schedules || []).filter(s => s.movieId === this.movieId)
			return { ...scheduleEntry, schedules: filtered }
		}

		return scheduleEntry
	}

	attachEvents() {
		const container = document.getElementById(this.containerId)
		if (!container) return

		// Date buttons - smooth scroll active card vào view
		container.querySelectorAll(".date-card-btn").forEach(btn => {
			btn.addEventListener("click", () => {
				this.selectedDate = btn.dataset.date
				this.renderShowtimeResultsOnly()
				// Update active class without full re-render
				container.querySelectorAll(".date-card-btn").forEach(b => b.classList.remove("active"))
				btn.classList.add("active")
				// Smooth scroll date card into view
				btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
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
				// Animate active state
				container.querySelectorAll(".cinema-card-choice").forEach(c => c.classList.remove("active"))
				card.classList.add("active")
				// Only re-render results section (không flash toàn trang)
				this.renderShowtimeResultsOnly()
			})
		})

		// Showtime slot click -> Open seat selection
		this.attachSlotEvents(container)
	}

	/** Attach click events cho các slot-btn (gọi riêng khi partial re-render) */
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
				this.openSeatModal(slotData)
			})
		})
	}

	/** Re-render chỉ phần kết quả suất chiếu (không flash toàn bộ picker) */
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
						title="${seat.id} (${formatCurrency(seat.price)})">
						${isSweetbox ? "👫" : seat.id.slice(1)}
					</div>
				`
			})

			seatRowsHTML += `
				<div class="seat-row">
					<span class="row-label">${rowBlock.row}</span>
					${seatsInRow}
					<span class="row-label">${rowBlock.row}</span>
				</div>
			`
		})

		body.innerHTML = `
			<div class="seat-modal-header">
				<h3>${slotData.movieTitle}</h3>
				<div class="seat-modal-meta">
					<span>🏢 <strong>${slotData.cinemaName}</strong></span>
					<span>🚪 <strong>${slotData.screenName} (${slotData.format})</strong></span>
					<span>📅 <strong>${formatDateVN(slotData.date)}</strong></span>
					<span>⏰ <strong>${slotData.time}</strong></span>
				</div>
				<div class="seat-modal-timer-badge" id="modal-seat-timer-badge" aria-label="Thời gian giữ ghế">
					<span>⏱️ Thời gian giữ ghế: <strong id="modal-timer-digits">05:00</strong></span>
				</div>
			</div>

			<!-- Screen visual -->
			<div class="screen-graphic-wrap">
				<div class="screen-curve"></div>
				<span class="screen-label">MÀN HÌNH CHIẾU / SCREEN</span>
			</div>

			<!-- Interactive Seat Map -->
			<div class="seat-map-grid" id="seat-map-interactive">
				${seatRowsHTML}
			</div>

			<!-- Legend -->
			<div class="seat-legend">
				<div class="legend-col"><span class="sample-seat sample-std"></span> Ghế Thường (${formatCurrency(basePrice)})</div>
				<div class="legend-col"><span class="sample-seat sample-vip"></span> Ghế VIP (${formatCurrency(basePrice + 10000)})</div>
				<div class="legend-col"><span class="sample-seat sample-swb"></span> Ghế Đôi Sweetbox (${formatCurrency(basePrice * 2 + 10000)})</div>
				<div class="legend-col"><span class="sample-seat sample-sold"></span> Đã bán</div>
				<div class="legend-col"><span class="sample-seat sample-sel"></span> Đang chọn</div>
			</div>

			<!-- Footer Checkout -->
			<div class="seat-modal-footer">
				<div class="selected-summary">
					<div class="seats-chosen-text">Ghế đã chọn: <strong id="chosen-seats-label">Chưa chọn ghế</strong></div>
					<div class="total-price-text" id="total-price-label">0 đ</div>
				</div>
				<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
					<a href="/booking.html?movieId=${slotData.movieId}&cinemaId=${slotData.cinemaId}&date=${slotData.date}&time=${slotData.time}&screen=${encodeURIComponent(slotData.screenName)}&format=${encodeURIComponent(slotData.format)}"
						class="btn-goto-full-booking"
						style="background:#0284c7; color:#fff; padding:12px 18px; border-radius:8px; font-weight:800; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; transition:background 0.2s;">
						<span>🍿 Chọn Bắp Nước Kèm Vé</span>
					</a>
					<button type="button" class="btn-confirm-booking" id="btn-confirm-seat-booking" disabled>
						XÁC NHẬN ĐẶT VÉ
					</button>
				</div>
			</div>
		`

		// Gán sự kiện click và phím điều khiển cho ghế
		const seatItems = body.querySelectorAll(".seat-item:not(.seat-sold)")
		seatItems.forEach(seat => {
			const toggleSeat = () => {
				const id = seat.dataset.seatId
				const price = +seat.dataset.price
				const type = seat.dataset.seatType

				const existingIdx = this.currentBooking.selectedSeats.findIndex(s => s.id === id)
				if (existingIdx > -1) {
					// Bỏ chọn ghế
					this.currentBooking.selectedSeats.splice(existingIdx, 1)
					seat.classList.remove("seat-selected")
					seat.setAttribute("aria-checked", "false")
				} else {
					// Giới hạn 8 ghế tối đa
					const MAX_SEATS = 8
					if (this.currentBooking.selectedSeats.length >= MAX_SEATS) {
						seat.classList.add("seat-shake")
						setTimeout(() => seat.classList.remove("seat-shake"), 400)
						showToast(`⚠️ Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong 1 lần đặt.`, "warning")
						return
					}
					// Chọn ghế mới
					this.currentBooking.selectedSeats.push({ id, price, type })
					seat.classList.add("seat-selected")
					seat.setAttribute("aria-checked", "true")
				}

				if (typeof navigator !== "undefined" && navigator.vibrate) {
					navigator.vibrate(25)
				}
				this.updateBookingSummary()
			}

			seat.setAttribute("role", "checkbox")
			seat.setAttribute("aria-checked", "false")
			seat.setAttribute("tabindex", "0")
			seat.addEventListener("click", toggleSeat)
			seat.addEventListener("keydown", e => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					toggleSeat()
				}
			})
		})

		// Confirm booking button
		const confirmBtn = body.querySelector("#btn-confirm-seat-booking")
		confirmBtn.addEventListener("click", () => {
			if (!this.currentBooking.selectedSeats.length) return
			const seatNames = this.currentBooking.selectedSeats.map(s => s.id).join(", ")
			const total = this.currentBooking.selectedSeats.reduce((sum, s) => sum + s.price, 0)
			const bookingCode = "BT" + Math.floor(100000 + Math.random() * 900000)

			this.closeSeatModal()
			showToast(
				`🎉 Đặt vé thành công! Mã: <strong>${bookingCode}</strong>. Phim: ${slotData.movieTitle} - Ghế: [${seatNames}] - Tổng: ${formatCurrency(total)}. Vui lòng kiểm tra email.`,
				"success",
				7000,
			)
		})

		const modal = document.getElementById("seat-booking-modal")
		modal.classList.add("active")
		document.body.style.overflow = "hidden"
		this.startModalCountdown()
	}

	startModalCountdown() {
		if (this.modalTimerInterval) clearInterval(this.modalTimerInterval)
		let seconds = 300
		let warned = false

		const digitsEl = document.getElementById("modal-timer-digits")
		const badgeEl = document.getElementById("modal-seat-timer-badge")

		const updateDigits = () => {
			const m = Math.floor(Math.max(0, seconds) / 60)
			const s = Math.max(0, seconds) % 60
			if (digitsEl) digitsEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
			if (badgeEl) badgeEl.classList.toggle("timer-danger", seconds <= 60)

			if (seconds === 60 && !warned) {
				warned = true
				showToast("⚠️ Thời gian giữ ghế chỉ còn 1 phút! Vui lòng sớm xác nhận.", "warning", 4000)
			}

			if (seconds <= 0) {
				clearInterval(this.modalTimerInterval)
				this.modalTimerInterval = null

				if (this.currentBooking && this.currentBooking.selectedSeats.length > 0) {
					this.currentBooking.selectedSeats = []
					const body = document.getElementById("seat-modal-body")
					if (body) {
						body.querySelectorAll(".seat-item.seat-selected").forEach(s => {
							s.classList.remove("seat-selected")
							s.setAttribute("aria-checked", "false")
						})
					}
					this.updateBookingSummary()
					showToast("⏰ Đã hết thời gian giữ ghế 5 phút! Vui lòng chọn lại ghế.", "warning", 6000)
				}
				setTimeout(() => this.startModalCountdown(), 1000)
			}
		}

		updateDigits()
		this.modalTimerInterval = setInterval(() => {
			seconds--
			updateDigits()
		}, 1000)
	}

	updateBookingSummary() {
		const chosenLabel = document.getElementById("chosen-seats-label")
		const totalLabel = document.getElementById("total-price-label")
		const confirmBtn = document.getElementById("btn-confirm-seat-booking")

		if (!chosenLabel || !totalLabel || !confirmBtn) return

		const seats = this.currentBooking.selectedSeats
		if (seats.length === 0) {
			chosenLabel.textContent = "Chưa chọn ghế"
			totalLabel.textContent = "0 đ"
			confirmBtn.disabled = true
		} else {
			// Phân loại ghế và tính tổng tiền theo từng loại
			const standardSeats = seats.filter(s => s.type === "standard")
			const vipSeats = seats.filter(s => s.type === "vip")
			const sweetboxSeats = seats.filter(s => s.type === "sweetbox")

			const standardTotal = standardSeats.reduce((sum, s) => sum + s.price, 0)
			const vipTotal = vipSeats.reduce((sum, s) => sum + s.price, 0)
			const sweetboxTotal = sweetboxSeats.reduce((sum, s) => sum + s.price, 0)
			const grandTotal = standardTotal + vipTotal + sweetboxTotal

			// Chuỗi tóm tắt theo từng loại ghế
			const typeDetails = []
			if (standardSeats.length > 0) {
				typeDetails.push(`${standardSeats.length} Thường (${formatCurrency(standardTotal)})`)
			}
			if (vipSeats.length > 0) {
				typeDetails.push(`${vipSeats.length} VIP (${formatCurrency(vipTotal)})`)
			}
			if (sweetboxSeats.length > 0) {
				typeDetails.push(`${sweetboxSeats.length} Đôi (${formatCurrency(sweetboxTotal)})`)
			}

			const seatNames = seats.map(s => s.id).join(", ")
			chosenLabel.innerHTML = `<strong>${seatNames}</strong> <span style="display:block; font-size:12px; color:#94a3b8; font-weight:500; margin-top:2px;">Phân loại: ${typeDetails.join(" • ")}</span>`
			totalLabel.textContent = formatCurrency(grandTotal)
			confirmBtn.disabled = false
		}
	}

	closeSeatModal() {
		if (this.modalTimerInterval) {
			clearInterval(this.modalTimerInterval)
			this.modalTimerInterval = null
		}
		const modal = document.getElementById("seat-booking-modal")
		if (modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	}
}
