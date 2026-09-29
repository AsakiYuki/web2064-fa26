/**
 * Beta Cinemas - Seat Selection & Concessions Booking Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast } from "./common.js"
import { getMoviesData, getCinemas, getConcessions, getTicketPricing, getShowtimeSeats, updateShowtimeSeats } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let moviesData = getMoviesData()
	let cinemasData = getCinemas()
	let concessionsData = getConcessions()
	let pricingData = getTicketPricing()

	try {
		if (!moviesData || !cinemasData.length || !concessionsData.length) {
			const [mRes, cRes, fRes, pRes] = await Promise.all([
				fetch("/data/movies.json").then(r => r.json()),
				fetch("/data/cinemas.json").then(r => r.json()),
				fetch("/data/concessions.json").then(r => r.json()),
				fetch("/data/ticket_pricing.json").then(r => r.json()).catch(() => null),
			])
			moviesData = mRes
			cinemasData = cRes
			concessionsData = fRes
			pricingData = pRes
		}
	} catch (err) {
		console.error("Failed to load booking data:", err)
		return
	}

	// Read URL query params
	const urlParams = new URLSearchParams(window.location.search)
	const movieId = urlParams.get("movieId") || "utlan2"
	const cinemaId = urlParams.get("cinemaId") || "beta-thainguyen"
	const dateStr = urlParams.get("date") || "2026-09-26"
	const timeSlot = urlParams.get("time") || "14:30"
	const screenName = urlParams.get("screen") || "Phòng chiếu 1"
	const formatName = urlParams.get("format") || "2D Phụ Đề"

	// Find movie & cinema
	const allMovies = [
		...(moviesData.items.nowshowing || []),
		...(moviesData.items.special || []),
		...(moviesData.items.upcoming || []),
	]
	// Check if movieId exists in database
	const reqMovieId = urlParams.get("movieId")
	if (reqMovieId && !allMovies.some(m => m.id === reqMovieId)) {
		window.location.href = `/404.html?from=${encodeURIComponent(window.location.pathname + window.location.search)}`
		return
	}

	const currentMovie = allMovies.find(m => m.id === movieId) || allMovies[0]
	const currentCinema = cinemasData.find(c => c.id === cinemaId) || cinemasData[0]

	// Booking State
	const bookingState = {
		movie: currentMovie,
		cinema: currentCinema,
		date: dateStr,
		time: timeSlot,
		screen: screenName,
		format: formatName,
		selectedSeats: [], // { id, row, col, type, price }
		selectedConcessions: new Map(), // concessionId -> { item, qty }
		discountAmount: 0,
		appliedCoupon: null,
		currentStep: 1, // 1: Seats, 2: Concessions
	}

	// Base seat prices
	const isIMAX = formatName.toLowerCase().includes("imax")
	const baseStandardPrice = isIMAX ? 120000 : 70000
	const baseVipPrice = baseStandardPrice + 10000
	const baseSweetboxPrice = baseStandardPrice * 2 + 15000

	initBookingInfoDisplay()
	renderSeatMap()
	renderConcessions()
	updateSummarySidebar()
	initTabSwitcher()
	initCouponCode()
	initCheckoutModal()
	initHoldTimer()

	/* ==========================================================================
	   1. INITIALIZE MOVIE & CINEMA DETAILS IN HEADER / SUMMARY
	   ========================================================================== */
	function initBookingInfoDisplay() {
		document.title = `Chọn Ghế & Bắp Nước: ${currentMovie.title} | Beta Cinemas`

		// Summary Movie Info
		const sPoster = document.getElementById("summary-poster-img")
		const sTitle = document.getElementById("summary-movie-title")
		const sCinema = document.getElementById("summary-cinema-name")
		const sTime = document.getElementById("summary-showtime-text")
		const sFormat = document.getElementById("summary-format-tag")

		if (sPoster) sPoster.src = currentMovie.poster
		if (sTitle) sTitle.textContent = currentMovie.title
		if (sCinema) sCinema.textContent = currentCinema.name
		if (sTime) sTime.textContent = `${timeSlot} - ${formatDateVN(dateStr)}`
		if (sFormat) sFormat.textContent = `${screenName} (${formatName})`

		// Hall info in seat card
		const hallTitle = document.getElementById("hall-movie-title")
		const hallMeta = document.getElementById("hall-sub-meta")
		if (hallTitle) hallTitle.textContent = currentMovie.title
		if (hallMeta) hallMeta.textContent = `${currentCinema.name} | ${screenName} | Suất ${timeSlot} (${formatDateVN(dateStr)})`

		// Legend prices
		const legStdPrice = document.getElementById("legend-price-std")
		const legVipPrice = document.getElementById("legend-price-vip")
		const legSwbPrice = document.getElementById("legend-price-swb")
		if (legStdPrice) legStdPrice.textContent = formatCurrency(baseStandardPrice)
		if (legVipPrice) legVipPrice.textContent = formatCurrency(baseVipPrice)
		if (legSwbPrice) legSwbPrice.textContent = formatCurrency(baseSweetboxPrice)
	}

	/* ==========================================================================
	   2. SEAT MAP RENDERING (STANDARD, VIP, SWEETBOX)
	   ========================================================================== */
	function renderSeatMap() {
		const container = document.getElementById("seat-rows-container")
		if (!container) return

		// Nạp sơ đồ ghế động của suất chiếu trực tiếp từ LocalStorage
		const seatLayout = getShowtimeSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, {
			isIMAX,
			basePrice: baseStandardPrice,
		})

		let rowsHTML = ""
		seatLayout.forEach(rowBlock => {
			const isSweetbox = rowBlock.type === "sweetbox"
			let rowSeatsHTML = ""

			rowBlock.seats.forEach(seat => {
				const isSold = seat.status === "sold"
				const isSelected = bookingState.selectedSeats.some(s => s.id === seat.id)

				if (isSweetbox) {
					rowSeatsHTML += `
						<div class="seat-unit seat-sweetbox ${isSold ? "seat-sold" : ""} ${isSelected ? "seat-selected" : ""}"
							data-seat-id="${seat.id}"
							data-row="${seat.row}"
							data-col="${seat.col}"
							data-type="${seat.type}"
							data-price="${seat.price}"
							title="${seat.id} (Ghế đôi Sweetbox: ${formatCurrency(seat.price)})"
							role="checkbox"
							aria-checked="${isSelected ? "true" : "false"}"
							tabindex="${isSold ? "-1" : "0"}">
							<span class="swb-icon">👫</span> ${seat.id}
						</div>
					`
				} else {
					// Lối đi sau ghế 3 và ghế 9
					if (seat.col === 4 || seat.col === 10) {
						rowSeatsHTML += `<div class="seat-aisle-divider"></div>`
					}

					rowSeatsHTML += `
						<div class="seat-unit seat-${seat.type} ${isSold ? "seat-sold" : ""} ${isSelected ? "seat-selected" : ""}"
							data-seat-id="${seat.id}"
							data-row="${seat.row}"
							data-col="${seat.col}"
							data-type="${seat.type}"
							data-price="${seat.price}"
							title="${seat.id} (${seat.type === "vip" ? "VIP" : "Thường"}: ${formatCurrency(seat.price)})"
							role="checkbox"
							aria-checked="${isSelected ? "true" : "false"}"
							tabindex="${isSold ? "-1" : "0"}">
							${seat.col}
						</div>
					`
				}
			})

			rowsHTML += `
				<div class="seat-row-block">
					<span class="row-letter">${rowBlock.row}</span>
					${rowSeatsHTML}
					<span class="row-letter">${rowBlock.row}</span>
				</div>
			`
		})

		container.innerHTML = rowsHTML

		// Gán sự kiện click và bàn phím cho các ghế còn trống
		container.querySelectorAll(".seat-unit:not(.seat-sold)").forEach(seat => {
			seat.addEventListener("click", () => handleSeatToggle(seat))
			seat.addEventListener("keydown", e => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					handleSeatToggle(seat)
				}
			})
		})
	}

	function handleSeatToggle(seatEl) {
		if (seatEl.classList.contains("seat-sold")) return

		const id = seatEl.dataset.seatId
		const row = seatEl.dataset.row
		const col = +seatEl.dataset.col
		const type = seatEl.dataset.type
		const price = +seatEl.dataset.price

		const existingIdx = bookingState.selectedSeats.findIndex(s => s.id === id)

		if (existingIdx > -1) {
			// Bỏ chọn ghế: Xóa khỏi danh sách, phục hồi màu ban đầu theo loại ghế
			bookingState.selectedSeats.splice(existingIdx, 1)
			seatEl.classList.remove("seat-selected")
			seatEl.setAttribute("aria-checked", "false")
			showToast(`Đã bỏ chọn ghế ${id}`, "info", 1500)
		} else {
			// Giới hạn số lượng ghế tối đa là 8 ghế
			const MAX_SEATS = 8
			if (bookingState.selectedSeats.length >= MAX_SEATS) {
				seatEl.classList.add("seat-shake")
				setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
				showToast(`⚠️ Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong 1 lần đặt.`, "warning")
				return
			}
			// Chọn ghế mới: Thêm vào danh sách và đổi sang màu xanh ngọc nổi bật
			bookingState.selectedSeats.push({ id, row, col, type, price })
			seatEl.classList.add("seat-selected")
			seatEl.setAttribute("aria-checked", "true")

			if (bookingState.selectedSeats.length === MAX_SEATS) {
				showToast(`Bạn đã chọn đủ tối đa ${MAX_SEATS} ghế.`, "info", 2000)
			}
		}

		// Rung nhẹ haptic feedback trên thiết bị di động nếu hỗ trợ
		if (typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(25)
		}

		updateSummarySidebar()
	}

	/* ==========================================================================
	   3. CONCESSIONS & FOOD/DRINKS SECTION RENDERING
	   ========================================================================== */
	function renderConcessions() {
		const catTabsWrap = document.getElementById("concessions-category-tabs")
		const grid = document.getElementById("concessions-grid")
		if (!grid || !concessionsData) return

		let selectedCategory = "all"

		// Render Category Tabs
		if (catTabsWrap) {
			const cats = [{ id: "all", name: "Tất Cả Món" }, ...(concessionsData.categories || [])]
			catTabsWrap.innerHTML = cats
				.map(
					c => `
				<button type="button" class="cat-btn ${selectedCategory === c.id ? "active" : ""}" data-cat="${c.id}">
					${c.name}
				</button>
			`,
				)
				.join("")

			catTabsWrap.querySelectorAll(".cat-btn").forEach(btn => {
				btn.addEventListener("click", () => {
					catTabsWrap.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"))
					btn.classList.add("active")
					selectedCategory = btn.dataset.cat
					filterAndRenderItems()
				})
			})
		}

		function filterAndRenderItems() {
			let items = concessionsData.items || []
			if (selectedCategory !== "all") {
				items = items.filter(it => it.categoryId === selectedCategory)
			}

			grid.innerHTML = items
				.map(item => {
					const qty = bookingState.selectedConcessions.get(item.id)?.qty || 0

					return `
					<div class="concession-item-card ${qty > 0 ? "has-qty" : ""}" id="concession-card-${item.id}">
						<div class="c-thumb-wrap">
							<img src="${item.image || "/promo/promo_deal.jpg"}" alt="${item.name}" loading="lazy" />
							${item.badge ? `<span class="c-badge">${item.badge}</span>` : ""}
						</div>
						<div class="c-details">
							<div>
								<h3 class="c-name">${item.name}</h3>
								<p class="c-desc">${item.description || ""}</p>
							</div>

							<div class="c-pricing-row">
								<div class="price-box">
									<span class="price-current">${formatCurrency(item.price)}</span>
									${item.originalPrice ? `<span class="price-old">${formatCurrency(item.originalPrice)}</span>` : ""}
								</div>

								<div class="qty-control">
									<button type="button" class="qty-btn btn-minus" data-id="${item.id}" ${qty === 0 ? "disabled" : ""} aria-label="Giảm số lượng">-</button>
									<span class="qty-display" id="qty-val-${item.id}">${qty}</span>
									<button type="button" class="qty-btn btn-plus" data-id="${item.id}" aria-label="Tăng số lượng">+</button>
								</div>
							</div>
						</div>
					</div>
				`
				})
				.join("")

			// Attach plus/minus listeners
			grid.querySelectorAll(".btn-plus").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const item = concessionsData.items.find(it => it.id === id)
					if (!item) return

					const currentQty = bookingState.selectedConcessions.get(id)?.qty || 0
					if (currentQty >= 10) {
						showToast("Số lượng tối đa cho mỗi món là 10.", "warning")
						return
					}

					bookingState.selectedConcessions.set(id, { item, qty: currentQty + 1 })
					updateConcessionQtyUI(id)
					updateSummarySidebar()
				})
			})

			grid.querySelectorAll(".btn-minus").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const currentQty = bookingState.selectedConcessions.get(id)?.qty || 0
					if (currentQty <= 1) {
						bookingState.selectedConcessions.delete(id)
					} else {
						const item = concessionsData.items.find(it => it.id === id)
						bookingState.selectedConcessions.set(id, { item, qty: currentQty - 1 })
					}
					updateConcessionQtyUI(id)
					updateSummarySidebar()
				})
			})
		}

		filterAndRenderItems()
	}

	function updateConcessionQtyUI(id) {
		const qtyValEl = document.getElementById(`qty-val-${id}`)
		const card = document.getElementById(`concession-card-${id}`)
		const qty = bookingState.selectedConcessions.get(id)?.qty || 0

		if (qtyValEl) qtyValEl.textContent = qty
		if (card) {
			card.classList.toggle("has-qty", qty > 0)
			const minusBtn = card.querySelector(".btn-minus")
			if (minusBtn) minusBtn.disabled = qty === 0
		}
	}

	/* ==========================================================================
	   4. ORDER SUMMARY SIDEBAR & DYNAMIC CALCULATION
	   ========================================================================== */
	function updateSummarySidebar() {
		const seatsListWrap = document.getElementById("summary-seats-breakdown")
		const concessionsListWrap = document.getElementById("summary-concessions-breakdown")
		const totalAmountEl = document.getElementById("summary-grand-total")
		const checkoutBtn = document.getElementById("btn-checkout-now")
		const step2Btn = document.getElementById("btn-goto-concessions")
		const seatBadge = document.getElementById("tab-badge-seats")
		const comboBadge = document.getElementById("tab-badge-combos")

		// 1. Tính toán tổng tiền ghế tự động theo từng loại ghế (Thường, VIP, Ghế đôi)
		const standardSeats = bookingState.selectedSeats.filter(s => s.type === "standard")
		const vipSeats = bookingState.selectedSeats.filter(s => s.type === "vip")
		const sweetboxSeats = bookingState.selectedSeats.filter(s => s.type === "sweetbox")

		const standardTotal = standardSeats.reduce((sum, s) => sum + s.price, 0)
		const vipTotal = vipSeats.reduce((sum, s) => sum + s.price, 0)
		const sweetboxTotal = sweetboxSeats.reduce((sum, s) => sum + s.price, 0)
		const seatsTotal = standardTotal + vipTotal + sweetboxTotal

		if (seatBadge) seatBadge.textContent = bookingState.selectedSeats.length

		if (seatsListWrap) {
			if (bookingState.selectedSeats.length === 0) {
				seatsListWrap.innerHTML = `<span class="empty-placeholder">Chưa chọn ghế nào</span>`
			} else {
				let seatRowsHTML = ""

				// Ghế Thường
				if (standardSeats.length > 0) {
					seatRowsHTML += `
						<div class="breakdown-row">
							<div class="row-desc">
								<strong>Ghế Thường (${standardSeats.length}x)</strong>
								<small>${standardSeats.map(s => s.id).join(", ")} • ${formatCurrency(standardSeats[0].price)}/ghế</small>
							</div>
							<div class="row-val">${formatCurrency(standardTotal)}</div>
						</div>
					`
				}

				// Ghế VIP
				if (vipSeats.length > 0) {
					seatRowsHTML += `
						<div class="breakdown-row">
							<div class="row-desc">
								<strong style="color: #fbbf24;">Ghế VIP (${vipSeats.length}x)</strong>
								<small>${vipSeats.map(s => s.id).join(", ")} • ${formatCurrency(vipSeats[0].price)}/ghế</small>
							</div>
							<div class="row-val" style="color: #fbbf24;">${formatCurrency(vipTotal)}</div>
						</div>
					`
				}

				// Ghế Đôi Sweetbox
				if (sweetboxSeats.length > 0) {
					seatRowsHTML += `
						<div class="breakdown-row">
							<div class="row-desc">
								<strong style="color: #f472b6;">Ghế Đôi Sweetbox (${sweetboxSeats.length}x)</strong>
								<small>${sweetboxSeats.map(s => s.id).join(", ")} • ${formatCurrency(sweetboxSeats[0].price)}/cặp</small>
							</div>
							<div class="row-val" style="color: #f472b6;">${formatCurrency(sweetboxTotal)}</div>
						</div>
					`
				}

				// Dòng tổng cộng tiền ghế
				seatRowsHTML += `
					<div class="breakdown-subtotal-row">
						<span>Tổng tiền ghế (${bookingState.selectedSeats.length} ghế):</span>
						<strong>${formatCurrency(seatsTotal)}</strong>
					</div>
				`

				seatsListWrap.innerHTML = seatRowsHTML
			}
		}

		// 2. Calculate concessions total
		let concessionsTotal = 0
		let totalConcessionCount = 0
		const concessionRows = []

		bookingState.selectedConcessions.forEach(({ item, qty }) => {
			const itemSubtotal = item.price * qty
			concessionsTotal += itemSubtotal
			totalConcessionCount += qty
			concessionRows.push(`
				<div class="breakdown-row">
					<div class="row-desc">
						<strong>${item.name}</strong>
						<small>Số lượng: ${qty} x ${formatCurrency(item.price)}</small>
					</div>
					<div class="row-val">${formatCurrency(itemSubtotal)}</div>
				</div>
			`)
		})

		if (comboBadge) comboBadge.textContent = totalConcessionCount

		if (concessionsListWrap) {
			if (concessionRows.length === 0) {
				concessionsListWrap.innerHTML = `<span class="empty-placeholder">Chưa chọn bắp nước</span>`
			} else {
				concessionsListWrap.innerHTML = concessionRows.join("")
			}
		}

		// 3. Discount calculation
		const rawGrandTotal = seatsTotal + concessionsTotal
		let discount = 0
		if (bookingState.appliedCoupon === "BETA10") {
			discount = Math.round(rawGrandTotal * 0.1)
		} else if (bookingState.appliedCoupon === "BETA50") {
			discount = Math.min(50000, rawGrandTotal)
		}
		bookingState.discountAmount = discount

		const finalTotal = Math.max(0, rawGrandTotal - discount)

		if (totalAmountEl) {
			totalAmountEl.textContent = formatCurrency(finalTotal)
		}

		// Enable / disable buttons
		const hasSeats = bookingState.selectedSeats.length > 0
		if (step2Btn) step2Btn.disabled = !hasSeats

		if (checkoutBtn) {
			checkoutBtn.disabled = !hasSeats
			if (bookingState.currentStep === 1) {
				checkoutBtn.innerHTML = `
					<span>TIẾP TỤC CHỌN BẮP NƯỚC</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
				`
			} else {
				checkoutBtn.innerHTML = `
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
					<span>THANH TOÁN ${formatCurrency(finalTotal)}</span>
				`
			}
		}
	}

	/* ==========================================================================
	   5. STEPPER & TAB SWITCHER LOGIC
	   ========================================================================== */
	function initTabSwitcher() {
		const tabSeats = document.getElementById("tab-view-seats")
		const tabCombos = document.getElementById("tab-view-combos")
		const seatSection = document.getElementById("section-seat-selection")
		const comboSection = document.getElementById("section-concessions-selection")
		const step2Btn = document.getElementById("btn-goto-concessions")
		const backBtn = document.getElementById("btn-back-to-seats")
		const checkoutBtn = document.getElementById("btn-checkout-now")

		const stepItemSeats = document.getElementById("step-indicator-seats")
		const stepItemCombos = document.getElementById("step-indicator-combos")

		function switchToStep(step) {
			bookingState.currentStep = step
			if (step === 1) {
				seatSection.style.display = "block"
				comboSection.style.display = "none"
				tabSeats?.classList.add("active")
				tabCombos?.classList.remove("active")
				stepItemSeats?.classList.add("active")
				stepItemSeats?.classList.remove("completed")
				stepItemCombos?.classList.remove("active")
			} else {
				seatSection.style.display = "none"
				comboSection.style.display = "block"
				tabSeats?.classList.remove("active")
				tabCombos?.classList.add("active")
				stepItemSeats?.classList.remove("active")
				stepItemSeats?.classList.add("completed")
				stepItemCombos?.classList.add("active")
				window.scrollTo({ top: 120, behavior: "smooth" })
			}
			updateSummarySidebar()
		}

		tabSeats?.addEventListener("click", () => switchToStep(1))
		tabCombos?.addEventListener("click", () => {
			if (bookingState.selectedSeats.length === 0) {
				showToast("Vui lòng chọn ít nhất 1 ghế trước khi chọn bắp nước.", "info")
				return
			}
			switchToStep(2)
		})

		step2Btn?.addEventListener("click", () => switchToStep(2))
		backBtn?.addEventListener("click", () => switchToStep(1))

		checkoutBtn?.addEventListener("click", () => {
			if (bookingState.selectedSeats.length === 0) {
				showToast("Vui lòng chọn ghế ngồi xem phim.", "warning")
				return
			}
			if (bookingState.currentStep === 1) {
				switchToStep(2)
			} else {
				// Proceed to checkout page
				const seatNames = bookingState.selectedSeats.map(s => s.id).join(", ")
				const comboList = []
				bookingState.selectedConcessions.forEach(({ item, qty }) => {
					comboList.push(`${qty}x ${item.name}`)
				})
				const concessionsStr = comboList.join(", ")

				const seatsTotal = bookingState.selectedSeats.reduce((sum, s) => sum + s.price, 0)
				let concessionsTotal = 0
				bookingState.selectedConcessions.forEach(({ item, qty }) => {
					concessionsTotal += item.price * qty
				})
				const finalTotal = Math.max(0, seatsTotal + concessionsTotal - bookingState.discountAmount)

				const checkoutUrl = `/checkout.html?movieId=${encodeURIComponent(currentMovie.id)}&cinemaId=${encodeURIComponent(currentCinema.id)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}&screen=${encodeURIComponent(screenName)}&format=${encodeURIComponent(formatName)}&seats=${encodeURIComponent(seatNames)}&concessions=${encodeURIComponent(concessionsStr)}&total=${finalTotal}`

				window.location.href = checkoutUrl
			}
		})
	}

	/* ==========================================================================
	   6. COUPON CODE / VOUCHER LOGIC
	   ========================================================================== */
	function initCouponCode() {
		const applyBtn = document.getElementById("btn-apply-coupon")
		const input = document.getElementById("coupon-input")
		const msg = document.getElementById("coupon-msg")

		if (!applyBtn || !input) return

		applyBtn.addEventListener("click", () => {
			const code = input.value.trim().toUpperCase()
			if (!code) return

			if (code === "BETA10") {
				bookingState.appliedCoupon = "BETA10"
				if (msg) {
					msg.style.display = "block"
					msg.textContent = "Áp dụng thành công mã BETA10: Giảm 10% tổng đơn hàng!"
				}
				showToast("Áp dụng mã giảm giá 10% thành công!", "success")
			} else if (code === "BETA50") {
				bookingState.appliedCoupon = "BETA50"
				if (msg) {
					msg.style.display = "block"
					msg.textContent = "Áp dụng thành công mã BETA50: Giảm 50.000đ!"
				}
				showToast("Áp dụng mã giảm 50.000đ thành công!", "success")
			} else {
				showToast("Mã ưu đãi không hợp lệ hoặc đã hết hạn. Hãy thử BETA10 hoặc BETA50!", "warning")
				return
			}
			updateSummarySidebar()
		})
	}

	/* ==========================================================================
	   7. E-TICKET CONFIRMATION MODAL & CHECKOUT
	   ========================================================================== */
	function initCheckoutModal() {
		let modal = document.getElementById("eticket-modal")
		if (!modal) {
			modal = document.createElement("div")
			modal.id = "eticket-modal"
			modal.className = "modal-backdrop"
			modal.innerHTML = `
				<div class="modal-content eticket-modal-content" role="dialog" aria-modal="true" aria-label="Vé xem phim điện tử">
					<button class="modal-close-btn" id="eticket-modal-close" aria-label="Đóng">&#x2715;</button>
					<div id="eticket-modal-body"></div>
				</div>
			`
			document.body.appendChild(modal)

			modal.addEventListener("click", e => {
				if (e.target === modal) closeETicketModal()
			})
			modal.querySelector("#eticket-modal-close").addEventListener("click", closeETicketModal)
		}
	}

	function openETicketModal() {
		const modal = document.getElementById("eticket-modal")
		const body = document.getElementById("eticket-modal-body")
		if (!modal || !body) return

		const bookingCode = "BT" + Math.floor(100000 + Math.random() * 900000)
		const seatNames = bookingState.selectedSeats.map(s => s.id).join(", ")

		// Concession list text
		const comboList = []
		bookingState.selectedConcessions.forEach(({ item, qty }) => {
			comboList.push(`${qty}x ${item.name}`)
		})
		const combosText = comboList.length ? comboList.join("<br/>") : "Không chọn bắp nước"

		// Total price
		const seatsTotal = bookingState.selectedSeats.reduce((sum, s) => sum + s.price, 0)
		let concessionsTotal = 0
		bookingState.selectedConcessions.forEach(({ item, qty }) => {
			concessionsTotal += item.price * qty
		})
		const finalTotal = Math.max(0, seatsTotal + concessionsTotal - bookingState.discountAmount)

		body.innerHTML = `
			<div class="ticket-head-banner">
				<div class="success-icon-badge">🎉</div>
				<h3>Đặt Vé Thành Công!</h3>
				<p>Cảm ơn bạn đã lựa chọn Beta Cinemas. Thông tin vé đã được lưu vào hệ thống.</p>
			</div>

			<div class="ticket-body-details">
				<div class="ticket-code-row">
					<div class="t-code-label">MÃ ĐẶT VÉ (BOOKING CODE)</div>
					<div class="t-code-val">${bookingCode}</div>
				</div>

				<div class="ticket-info-grid">
					<div class="ti-item" style="grid-column: 1 / -1;">
						<span class="ti-lbl">Phim</span>
						<span class="ti-val" style="color:#fbbf24; font-size:15px;">${currentMovie.title}</span>
					</div>

					<div class="ti-item">
						<span class="ti-lbl">Rạp Chiếu</span>
						<span class="ti-val">${currentCinema.name}</span>
					</div>

					<div class="ti-item">
						<span class="ti-lbl">Phòng Chiếu</span>
						<span class="ti-val">${screenName} (${formatName})</span>
					</div>

					<div class="ti-item">
						<span class="ti-lbl">Ngày Xem</span>
						<span class="ti-val">${formatDateVN(dateStr)}</span>
					</div>

					<div class="ti-item">
						<span class="ti-lbl">Suất Chiếu</span>
						<span class="ti-val">${timeSlot}</span>
					</div>

					<div class="ti-item" style="grid-column: 1 / -1;">
						<span class="ti-lbl">Ghế Đã Chọn</span>
						<span class="ti-val" style="color:#10b981; font-size:16px;">${seatNames}</span>
					</div>

					<div class="ti-item" style="grid-column: 1 / -1;">
						<span class="ti-lbl">Combo Bắp Nước</span>
						<span class="ti-val" style="font-size:13px; font-weight:500;">${combosText}</span>
					</div>

					<div class="ti-item" style="grid-column: 1 / -1; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 10px;">
						<span class="ti-lbl">Tổng Tiền Thanh Toán</span>
						<span class="ti-val" style="color:#fbbf24; font-size:20px;">${formatCurrency(finalTotal)}</span>
					</div>
				</div>

				<!-- Barcode / QR Visual -->
				<div class="barcode-wrapper">
					<div class="barcode-lines"></div>
					<span>${bookingCode} - SCAN AT KIOSK</span>
				</div>
			</div>

			<div class="ticket-footer-actions">
				<a href="/movies.html" class="btn-ticket-done">Quay Về Trang Phim</a>
			</div>
		`

		modal.classList.add("active")
		document.body.style.overflow = "hidden"

		showToast(`Vé ${bookingCode} của bạn đã được xuất thành công!`, "success", 6000)
	}

	function closeETicketModal() {
		const modal = document.getElementById("eticket-modal")
		if (modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	}

	/* ==========================================================================
	   8. HOLD COUNTDOWN TIMER (5 PHÚT VÀ TỰ ĐỘNG HỦY KHI HẾT GIỜ)
	   ========================================================================== */
	let holdTimerInterval = null
	let holdSecondsRemaining = 300 // 5 phút = 300 giây
	let hasNotifiedOneMinute = false

	function formatTimeDigits(totalSecs) {
		const m = Math.floor(Math.max(0, totalSecs) / 60)
		const s = Math.max(0, totalSecs) % 60
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
	}

	function updateHoldTimerUI(secs) {
		const formatted = formatTimeDigits(secs)
		const sidebarTimerEl = document.getElementById("booking-timer-countdown")
		const hallTimerEl = document.getElementById("hall-timer-digits")
		const sidebarBadge = document.getElementById("booking-timer-badge")
		const hallTag = document.getElementById("hall-countdown-tag")

		if (sidebarTimerEl) sidebarTimerEl.textContent = formatted
		if (hallTimerEl) hallTimerEl.textContent = formatted

		// Cảnh báo đỏ nhấp nháy khi còn dưới 60 giây
		const isDanger = secs <= 60
		if (sidebarBadge) sidebarBadge.classList.toggle("timer-danger", isDanger)
		if (hallTag) hallTag.classList.toggle("timer-danger", isDanger)

		if (secs === 60 && !hasNotifiedOneMinute) {
			hasNotifiedOneMinute = true
			showToast("⚠️ Thời gian giữ ghế chỉ còn 1 phút! Vui lòng sớm xác nhận đặt vé.", "warning", 6000)
		}

		// Tự động hủy khi hết giờ (00:00)
		if (secs <= 0) {
			clearInterval(holdTimerInterval)
			holdTimerInterval = null

			if (bookingState.selectedSeats.length > 0) {
				const cancelCount = bookingState.selectedSeats.length
				bookingState.selectedSeats = []

				// Bỏ chọn tất cả ghế trên sơ đồ giao diện
				const container = document.getElementById("seat-rows-container")
				if (container) {
					container.querySelectorAll(".seat-unit.seat-selected").forEach(seat => {
						seat.classList.remove("seat-selected")
						seat.setAttribute("aria-checked", "false")
					})
				}

				updateSummarySidebar()

				showToast(
					`⏰ Đã hết thời gian giữ ghế 5 phút! Hệ thống đã tự động hủy ${cancelCount} ghế bạn chọn để nhường cho khách hàng khác. Vui lòng chọn lại ghế.`,
					"warning",
					8000,
				)
			} else {
				showToast("⏰ Đã hết thời gian giữ ghế 5 phút! Vui lòng chọn lại ghế ngồi.", "info", 5000)
			}

			// Khởi động lại đợt giữ ghế mới sau 1 giây
			setTimeout(() => {
				startHoldCountdown()
			}, 1000)
		}
	}

	function startHoldCountdown() {
		if (holdTimerInterval) clearInterval(holdTimerInterval)
		holdSecondsRemaining = 300
		hasNotifiedOneMinute = false
		updateHoldTimerUI(holdSecondsRemaining)

		holdTimerInterval = setInterval(() => {
			holdSecondsRemaining--
			updateHoldTimerUI(holdSecondsRemaining)
		}, 1000)
	}

	function initHoldTimer() {
		startHoldCountdown()
	}
})
