/**
 * Beta Cinemas - Seat Selection & Concessions Booking Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast, translateDom, getSavedLang } from "./common.js"
import {
	getMoviesData,
	getCinemas,
	getConcessions,
	getTicketPricing,
	getShowtimeSeats,
	updateShowtimeSeats,
	isSeatSold,
	calculateVoucherDiscount,
	savePendingBooking,
	getPendingBooking,
	saveBookingTicket,
	clearPendingBooking,
	isPendingBookingExpired,
	canSelectSeat,
	canDeselectSeat,
	areSeatsContiguous,
	isSeatAvailable,
	checkSeatsAvailability,
	getOrCreateHoldSessionId,
	holdSeats,
	releaseSeatHold,
	getHeldSeats,
	getSeatHold,
	getSeatStatus,
} from "./storage.js"

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

	// Base seat prices
	const isIMAX = formatName.toLowerCase().includes("imax")
	const baseStandardPrice = isIMAX ? 120000 : 70000
	const baseVipPrice = baseStandardPrice + 10000
	const baseSweetboxPrice = baseStandardPrice * 2 + 15000

	// Kiểm tra và khôi phục dữ liệu đã chọn khi người dùng F5 / reload trang
	const pending = getPendingBooking()
	const isMatchingShowtime = Boolean(
		pending &&
		pending.movieId === currentMovie.id &&
		pending.cinemaId === currentCinema.id &&
		pending.date === dateStr &&
		pending.time === timeSlot,
	)
	const isSameShowtime = isMatchingShowtime

	// Hold session identifier (ưu tiên kế thừa holdId từ pending booking hoặc URL để giữ nguyên phiên khi F5)
	const holdIdFromUrl = urlParams.get("holdId")
	let holdSessionId = holdIdFromUrl || (isMatchingShowtime && pending?.holdId) || getOrCreateHoldSessionId()

	// Hold timer variables (defined early to prevent TDZ access)
	let holdTimerInterval = null
	let holdSecondsRemaining = 300 // 5 phút = 300 giây
	let hasNotifiedOneMinute = false
	let isProceedingToCheckout = false

	let initialStep = 1
	if (urlParams.get("step") === "2" || window.location.hash === "#combos" || window.location.hash === "#concessions" || (isMatchingShowtime && pending?.currentStep === 2)) {
		initialStep = 2
	}

	// Restore hold timer from pending booking if not expired
	if (isMatchingShowtime && pending?.holdExpiresAt && pending.holdExpiresAt > Date.now()) {
		holdSecondsRemaining = Math.max(10, Math.floor((pending.holdExpiresAt - Date.now()) / 1000))
	}

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
		appliedCoupon: (isMatchingShowtime && pending?.voucherCode) ? pending.voucherCode : null,
		currentStep: initialStep, // 1: Seats, 2: Concessions
	}

	// 1. Tự động khôi phục dữ liệu đã chọn khi người dùng F5 / reload trang
	let restoredSeatsCount = 0
	let restoredConcessionsCount = 0

	if (isMatchingShowtime) {
		const now = Date.now()
		const isExpired = pending.holdExpiresAt ? now >= pending.holdExpiresAt : false

		if (isExpired) {
			// Phiên giữ ghế đã quá 5 phút trong lúc người dùng rời trang / reload muộn
			clearPendingBooking()
			if (pending.holdId) {
				releaseSeatHold(pending.holdId)
			}
			showToast("⏰ Phiên giữ ghế trước đó của bạn đã hết thời gian (5 phút). Vui lòng chọn lại ghế.", "warning", 6000)
		} else {
			// Phiên giữ ghế vẫn còn hiệu lực -> Khôi phục chính xác thời gian còn lại
			if (pending.holdExpiresAt) {
				holdSecondsRemaining = Math.max(5, Math.ceil((pending.holdExpiresAt - now) / 1000))
			}

			// Khôi phục danh sách ghế đã chọn
			const rawSeats = Array.isArray(pending.selectedSeats) ? pending.selectedSeats : []
			const seatIds = rawSeats.map(s => (typeof s === "string" ? s : s.id)).filter(Boolean)

			if (seatIds.length > 0) {
				const avail = checkSeatsAvailability(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatIds, holdSessionId)
				const validSeatIds = seatIds.filter(id => !avail.unavailableSeats.includes(id))

				if (validSeatIds.length > 0) {
					// Gia hạn / xác nhận lại phiên giữ ghế với các ghế hợp lệ
					holdSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, validSeatIds, holdSessionId)

					const seatLayout = getShowtimeSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, {
						isIMAX,
						basePrice: baseStandardPrice,
					})

					validSeatIds.forEach(id => {
						for (const row of seatLayout) {
							const foundSeat = row.seats.find(s => s.id === id)
							if (foundSeat && foundSeat.status !== "sold") {
								bookingState.selectedSeats.push({
									id: foundSeat.id,
									row: foundSeat.row,
									col: foundSeat.col,
									type: foundSeat.type,
									price: foundSeat.price,
								})
								break
							}
						}
					})
					restoredSeatsCount = bookingState.selectedSeats.length
				}
			}

			// Khôi phục danh sách bắp nước & combo đã chọn
			if (Array.isArray(pending.selectedConcessions)) {
				pending.selectedConcessions.forEach(c => {
					if (!c || !c.id || !c.qty || c.qty <= 0) return
					const fullItem = concessionsData?.items?.find(it => it.id === c.id) || {
						id: c.id,
						name: c.name || "Món ăn kèm",
						price: c.price || 0,
						image: c.image || "/promo/promo_deal.jpg",
						description: c.description || "",
					}
					const validQty = Math.min(10, Math.max(1, c.qty))
					bookingState.selectedConcessions.set(c.id, {
						item: fullItem,
						qty: validQty,
					})
					restoredConcessionsCount += validQty
				})
			}

			// Khôi phục mã giảm giá
			if (pending.voucherCode) {
				bookingState.appliedCoupon = pending.voucherCode
				bookingState.discountAmount = pending.discountAmount || 0
			}

			// Khôi phục bước hiện tại (nếu trước khi F5 đang ở bước chọn bắp nước)
			const requestedStep = +(urlParams.get("step") || pending.currentStep || 1)
			if (requestedStep === 2 && bookingState.selectedSeats.length > 0) {
				bookingState.currentStep = 2
			} else {
				bookingState.currentStep = 1
			}
		}
	}

	// 2. Pre-populate selected seats from URL if provided (e.g. from modal or direct link) và chưa có ghế từ pending
	const seatsParam = urlParams.get("seats")
	if (seatsParam && bookingState.selectedSeats.length === 0) {
		const seatIds = seatsParam.split(",").map(s => s.trim()).filter(Boolean)
		const seatLayout = getShowtimeSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, {
			isIMAX,
			basePrice: baseStandardPrice,
		})
		seatIds.forEach(id => {
			for (const row of seatLayout) {
				const foundSeat = row.seats.find(s => s.id === id)
				if (foundSeat && foundSeat.status !== "sold") {
					bookingState.selectedSeats.push({
						id: foundSeat.id,
						row: foundSeat.row,
						col: foundSeat.col,
						type: foundSeat.type,
						price: foundSeat.price,
					})
					break
				}
			}
		})
		if (bookingState.selectedSeats.length > 0) {
			holdSeats(
				currentCinema.id,
				currentMovie.id,
				dateStr,
				timeSlot,
				bookingState.selectedSeats.map(s => s.id),
				holdSessionId,
			)
			restoredSeatsCount = bookingState.selectedSeats.length
		}
	}

	if (restoredSeatsCount > 0 || restoredConcessionsCount > 0) {
		const parts = []
		if (restoredSeatsCount > 0) parts.push(`${restoredSeatsCount} ghế (${bookingState.selectedSeats.map(s => s.id).join(", ")})`)
		if (restoredConcessionsCount > 0) parts.push(`${restoredConcessionsCount} phần bắp nước`)
		showToast(`✨ Đã tự động khôi phục ${parts.join(" & ")} bạn đã chọn!`, "info", 3500)
	}

	initBookingInfoDisplay()
	renderSeatMap()
	renderConcessions()
	updateSummarySidebar()
	initTabSwitcher()
	initCouponCode()
	initCheckoutModal()
	initHoldTimer()
	initExitConfirmation()
	translateDom(getSavedLang())

	// Lắng nghe thay đổi ghế giữ từ các tab khác theo thời gian thực
	window.addEventListener("storage", e => {
		if (e.key === "beta_seat_holds" || e.key === "beta_bookings") {
			renderSeatMap()
		}
	})

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

		const heldByOthers = getHeldSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, holdSessionId)

		let rowsHTML = ""
		seatLayout.forEach(rowBlock => {
			const isSweetbox = rowBlock.type === "sweetbox"
			let rowSeatsHTML = ""

			rowBlock.seats.forEach(seat => {
				const isSold = seat.status === "sold"
				const isHeld = !isSold && heldByOthers.includes(seat.id)
				const isSelected = bookingState.selectedSeats.some(s => s.id === seat.id)
				const statusClass = isSold ? "seat-sold" : isHeld ? "seat-holding" : isSelected ? "seat-selected" : ""
				const statusData = isSold ? "sold" : isHeld ? "holding" : isSelected ? "selected" : "available"

				if (isSweetbox) {
					rowSeatsHTML += `
						<div class="seat-unit seat-sweetbox ${statusClass}"
							data-seat-id="${seat.id}"
							data-row="${seat.row}"
							data-col="${seat.col}"
							data-type="${seat.type}"
							data-price="${seat.price}"
							data-status="${statusData}"
							title="${seat.id} (${isSold ? "Đã bán" : isHeld ? "Khách khác đang giữ tạm 5 phút" : `Ghế đôi Sweetbox: ${formatCurrency(seat.price)}`})"
							role="checkbox"
							aria-checked="${isSelected ? "true" : "false"}"
							tabindex="${isSold || isHeld ? "-1" : "0"}">
							<span class="swb-icon">👫</span> ${seat.id}
						</div>
					`
				} else {
					// Lối đi sau ghế 3 và ghế 11 (bố cục chuẩn 3 - 8 - 3 ghế)
					if (seat.col === 4 || seat.col === 12) {
						rowSeatsHTML += `<div class="seat-aisle-divider"></div>`
					}

					rowSeatsHTML += `
						<div class="seat-unit seat-${seat.type} ${statusClass}"
							data-seat-id="${seat.id}"
							data-row="${seat.row}"
							data-col="${seat.col}"
							data-type="${seat.type}"
							data-price="${seat.price}"
							data-status="${statusData}"
							title="${seat.id} (${isSold ? "Đã bán" : isHeld ? "Khách khác đang giữ tạm 5 phút" : `${seat.type === "vip" ? "VIP" : "Thường"}: ${formatCurrency(seat.price)}`})"
							role="checkbox"
							aria-checked="${isSelected ? "true" : "false"}"
							tabindex="${isSold || isHeld ? "-1" : "0"}">
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

		// Gán sự kiện click và bàn phím cho tất cả các ghế (kể cả ghế đã bán/đang giữ để phản hồi)
		container.querySelectorAll(".seat-unit").forEach(seat => {
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
		const id = seatEl.dataset.seatId
		if (seatEl.classList.contains("seat-sold") || isSeatSold(currentCinema.id, currentMovie.id, dateStr, timeSlot, id)) {
			showToast(`Ghế ${id} đã có người đặt, vui lòng chọn ghế khác.`, "warning", 2500)
			return
		}

		const row = seatEl.dataset.row
		const col = +seatEl.dataset.col
		const type = seatEl.dataset.type
		const price = +seatEl.dataset.price
		const isSold = seatEl.classList.contains("seat-sold") || seatEl.dataset.status === "sold"

		// 1. Kiểm tra ghế đã bán
		if (isSold) {
			seatEl.classList.add("seat-shake")
			setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
			showToast(`⚠️ Ghế ${id} đã được người khác đặt trước, không thể chọn! Vui lòng chọn ghế còn trống khác.`, "warning")
			return
		}

		// 2. Kiểm tra ghế đang được người khác giữ trong 5 phút
		const heldByOthers = getHeldSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, holdSessionId)
		const isHeld = seatEl.classList.contains("seat-holding") || seatEl.dataset.status === "holding" || heldByOthers.includes(id)
		if (isHeld) {
			seatEl.classList.add("seat-holding")
			seatEl.dataset.status = "holding"
			seatEl.classList.add("seat-shake")
			setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
			showToast(`⏳ Ghế ${id} đang được khách hàng khác giữ tạm thời trong phiên đặt vé (5 phút). Vui lòng chọn ghế khác!`, "warning")
			return
		}

		const existingIdx = bookingState.selectedSeats.findIndex(s => s.id === id)

		if (existingIdx > -1) {
			// Bỏ chọn ghế: Kiểm tra xem các ghế còn lại có bị tách rời không
			const check = canDeselectSeat(bookingState.selectedSeats, id)
			if (!check.allowed) {
				seatEl.classList.add("seat-shake")
				setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
				showToast(check.message, "warning")
				return
			}

			bookingState.selectedSeats.splice(existingIdx, 1)
			seatEl.classList.remove("seat-selected")
			seatEl.setAttribute("aria-checked", "false")

			if (bookingState.selectedSeats.length === 0) {
				releaseSeatHold(holdSessionId)
				stopHoldCountdown()
				showToast(`Đã bỏ chọn ghế ${id}. Đã hủy giữ ghế.`, "info", 1500)
			} else {
				const seatIds = bookingState.selectedSeats.map(s => s.id)
				holdSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatIds, holdSessionId)
				showToast(`Đã bỏ chọn ghế ${id}`, "info", 1200)
			}
		} else {
			const targetSeat = { id, row, col, type, price, status: "available" }

			// Kiểm tra chọn ghế sát nhau & liền kề
			const check = canSelectSeat(bookingState.selectedSeats, targetSeat, holdSessionId)
			if (!check.allowed) {
				seatEl.classList.add("seat-shake")
				setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
				showToast(check.message, "warning")
				return
			}

			// Thêm ghế vào danh sách
			bookingState.selectedSeats.push(targetSeat)
			seatEl.classList.add("seat-selected")
			seatEl.setAttribute("aria-checked", "true")

			// Ghi nhận giữ ghế vào hệ thống
			const seatIds = bookingState.selectedSeats.map(s => s.id)
			const holdRes = holdSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatIds, holdSessionId)
			if (!holdRes.success) {
				bookingState.selectedSeats.pop()
				seatEl.classList.remove("seat-selected")
				seatEl.setAttribute("aria-checked", "false")
				seatEl.classList.add("seat-shake")
				setTimeout(() => seatEl.classList.remove("seat-shake"), 400)
				showToast(holdRes.message || "Không thể giữ ghế này!", "warning")
				renderSeatMap()
				return
			}

			// Nếu đây là ghế đầu tiên, bắt đầu đếm ngược 5 phút
			if (bookingState.selectedSeats.length === 1) {
				startHoldCountdown(holdRes.remainingSeconds || 300)
				showToast(`Đã chọn ghế ${id}. Hệ thống bắt đầu giữ ghế trong 5 phút!`, "info", 2000)
			} else {
				showToast(`Đã chọn ghế ${id}.`, "info", 1200)
			}

			if (bookingState.selectedSeats.length === 8) {
				showToast(`Bạn đã chọn đủ tối đa 8 ghế.`, "info", 2000)
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
								<strong style="color: #fab387;">Ghế VIP (${vipSeats.length}x)</strong>
								<small>${vipSeats.map(s => s.id).join(", ")} • ${formatCurrency(vipSeats[0].price)}/ghế</small>
							</div>
							<div class="row-val" style="color: #fab387;">${formatCurrency(vipTotal)}</div>
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

		// 3. Discount calculation using calculateVoucherDiscount helper
		const rawGrandTotal = seatsTotal + concessionsTotal
		let discount = 0
		let couponMsgText = ""

		if (bookingState.appliedCoupon) {
			const res = calculateVoucherDiscount(bookingState.appliedCoupon, rawGrandTotal)
			if (res.isValid) {
				discount = res.discountAmount
				couponMsgText = res.message
			} else {
				bookingState.appliedCoupon = null
				discount = 0
				couponMsgText = ""
			}
		}
		bookingState.discountAmount = discount

		const finalTotal = Math.max(0, rawGrandTotal - discount)

		// Render coupon message & breakdown if coupon is applied
		const couponMsgEl = document.getElementById("coupon-msg")
		if (couponMsgEl) {
			if (couponMsgText) {
				couponMsgEl.style.display = "block"
				couponMsgEl.style.color = "#10b981"
				couponMsgEl.textContent = couponMsgText
			} else if (!bookingState.appliedCoupon) {
				couponMsgEl.style.display = "none"
			}
		}

		// Add discount breakdown row if discount > 0
		let discountRow = document.getElementById("summary-discount-row")
		if (discount > 0) {
			if (!discountRow && concessionsListWrap) {
				discountRow = document.createElement("div")
				discountRow.id = "summary-discount-row"
				discountRow.className = "summary-breakdown-section"
				concessionsListWrap.parentElement.insertBefore(discountRow, document.querySelector(".summary-coupon-box"))
			}
			if (discountRow) {
				discountRow.style.display = "block"
				discountRow.innerHTML = `
					<div class="breakdown-group-title" style="color: #10b981;">🎟️ Ưu đãi giảm giá (${bookingState.appliedCoupon})</div>
					<div class="breakdown-row">
						<div class="row-desc">
							<strong style="color: #10b981;">Mã voucher ${bookingState.appliedCoupon}</strong>
							<small>Đã áp dụng giảm trực tiếp</small>
						</div>
						<div class="row-val" style="color: #10b981; font-weight: 800;">-${formatCurrency(discount)}</div>
					</div>
				`
			}
		} else if (discountRow) {
			discountRow.style.display = "none"
		}

		if (totalAmountEl) {
			totalAmountEl.textContent = formatCurrency(finalTotal)
		}

		// Persist Pending Booking to LocalStorage
		syncPendingBookingToStorage(seatsTotal, concessionsTotal, finalTotal)

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

	function updateBookingUrl() {
		try {
			const u = new URL(window.location.href)
			if (bookingState.selectedSeats.length > 0) {
				u.searchParams.set("seats", bookingState.selectedSeats.map(s => s.id).join(","))
			} else {
				u.searchParams.delete("seats")
			}
			if (holdSessionId) {
				u.searchParams.set("holdId", holdSessionId)
			}
			if (bookingState.currentStep === 2) {
				u.searchParams.set("step", "2")
			} else {
				u.searchParams.delete("step")
			}
			window.history.replaceState(null, "", u.toString())
		} catch (e) { }
	}

	function syncPendingBookingToStorage(seatsTotal, concessionsTotal, finalTotal) {
		if (bookingState.selectedSeats.length === 0) {
			clearPendingBooking()
			updateBookingUrl()
			return
		}

		const seatNames = bookingState.selectedSeats.map(s => s.id).join(", ")
		const comboList = []
		bookingState.selectedConcessions.forEach(({ item, qty }) => {
			comboList.push({
				id: item.id,
				name: item.name,
				price: item.price,
				qty,
				image: item.image,
				description: item.description,
			})
		})

		const currentHold = getSeatHold(holdSessionId)
		const holdExpiresAt = currentHold?.expiresAt || Date.now() + holdSecondsRemaining * 1000

		const pendingPayload = {
			movieId: currentMovie.id,
			movieTitle: currentMovie.title,
			moviePoster: currentMovie.poster,
			cinemaId: currentCinema.id,
			cinemaName: currentCinema.name,
			screenName,
			formatName,
			date: dateStr,
			time: timeSlot,
			currentStep: bookingState.currentStep,
			selectedSeats: bookingState.selectedSeats,
			seatsString: seatNames,
			selectedConcessions: comboList,
			concessionsString: comboList.map(c => `${c.qty}x ${c.name}`).join(", ") || "Không kèm bắp nước",
			seatsTotal,
			concessionsTotal,
			voucherCode: bookingState.appliedCoupon,
			discountAmount: bookingState.discountAmount,
			grandTotal: finalTotal,
			holdId: holdSessionId,
			holdExpiresAt,
			currentStep: bookingState.currentStep,
		}

		savePendingBooking(pendingPayload)
		updateBookingUrl()
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

		function switchToStep(step, smoothScroll = true) {
			bookingState.currentStep = step
			if (step === 1) {
				if (seatSection) seatSection.style.display = "block"
				if (comboSection) comboSection.style.display = "none"
				tabSeats?.classList.add("active")
				tabCombos?.classList.remove("active")
				stepItemSeats?.classList.add("active")
				stepItemSeats?.classList.remove("completed")
				stepItemCombos?.classList.remove("active")
				try {
					const url = new URL(window.location)
					url.searchParams.set("step", "1")
					window.history.replaceState({}, "", url)
				} catch (e) { }
			} else {
				if (seatSection) seatSection.style.display = "none"
				if (comboSection) comboSection.style.display = "block"
				tabSeats?.classList.remove("active")
				tabCombos?.classList.add("active")
				stepItemSeats?.classList.remove("active")
				stepItemSeats?.classList.add("completed")
				stepItemCombos?.classList.add("active")
				try {
					const url = new URL(window.location)
					url.searchParams.set("step", "2")
					if (bookingState.selectedSeats.length > 0) {
						url.searchParams.set("seats", bookingState.selectedSeats.map(s => s.id).join(","))
					}
					window.history.replaceState({}, "", url)
				} catch (e) { }
				if (smoothScroll) {
					window.scrollTo({ top: 120, behavior: "smooth" })
				}
			}
			updateBookingUrl()
			updateSummarySidebar()
		}

		function validateSeatsBeforeProceed() {
			if (bookingState.selectedSeats.length === 0) {
				showToast("Vui lòng chọn ghế ngồi xem phim trước khi tiếp tục.", "warning")
				return false
			}
			if (!areSeatsContiguous(bookingState.selectedSeats)) {
				showToast("⚠️ Vui lòng chọn các ghế ngồi sát nhau trong cùng một hàng, không được để trống ghế ở giữa!", "warning")
				return false
			}
			// Kiểm tra tất cả ghế đã chọn có còn trống không (bỏ qua hold của chính mình)
			const seatIds = bookingState.selectedSeats.map(s => s.id)
			const availCheck = checkSeatsAvailability(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatIds, holdSessionId)
			if (!availCheck.allAvailable) {
				showToast(`⚠️ Ghế [${availCheck.unavailableSeats.join(", ")}] đã không còn khả dụng hoặc đã hết thời gian giữ ghế! Vui lòng chọn lại.`, "warning", 4000)
				bookingState.selectedSeats = bookingState.selectedSeats.filter(s => !availCheck.unavailableSeats.includes(s.id))
				renderSeatMap()
				updateSummarySidebar()
				return false
			}
			// Gia hạn / làm mới hold cho các ghế này
			holdSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatIds, holdSessionId)
			return true
		}

		tabSeats?.addEventListener("click", () => switchToStep(1))
		tabCombos?.addEventListener("click", () => {
			if (!validateSeatsBeforeProceed()) return
			switchToStep(2)
		})

		step2Btn?.addEventListener("click", () => {
			if (!validateSeatsBeforeProceed()) return
			switchToStep(2)
		})
		backBtn?.addEventListener("click", () => switchToStep(1))

		checkoutBtn?.addEventListener("click", () => {
			if (!validateSeatsBeforeProceed()) return
			if (bookingState.currentStep === 1) {
				switchToStep(2)
			} else {
				// Save final pending booking before going to checkout
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

				syncPendingBookingToStorage(seatsTotal, concessionsTotal, finalTotal)

				const checkoutUrl = `/checkout.html?movieId=${encodeURIComponent(currentMovie.id)}&cinemaId=${encodeURIComponent(currentCinema.id)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}&screen=${encodeURIComponent(screenName)}&format=${encodeURIComponent(formatName)}&seats=${encodeURIComponent(seatNames)}&concessions=${encodeURIComponent(concessionsStr)}&voucher=${encodeURIComponent(bookingState.appliedCoupon || "")}&discount=${bookingState.discountAmount}&total=${finalTotal}&holdId=${encodeURIComponent(holdSessionId)}`

				isProceedingToCheckout = true
				window.location.href = checkoutUrl
			}
		})

		// Auto restore step 2 if returning or reloading on concessions step
		if (bookingState.currentStep === 2 && bookingState.selectedSeats.length > 0) {
			switchToStep(2, false)
		} else {
			switchToStep(1, false)
		}
	}

	/* ==========================================================================
	   6. COUPON CODE / VOUCHER LOGIC
	   ========================================================================== */
	function initCouponCode() {
		const applyBtn = document.getElementById("btn-apply-coupon")
		const input = document.getElementById("coupon-input")
		const msg = document.getElementById("coupon-msg")

		if (!applyBtn || !input) return

		// Điền sẵn mã voucher nếu được khôi phục từ phiên trước
		if (bookingState.appliedCoupon) {
			input.value = bookingState.appliedCoupon
		}

		applyBtn.addEventListener("click", () => {
			const code = input.value.trim().toUpperCase()
			if (!code) {
				bookingState.appliedCoupon = null
				if (msg) {
					msg.style.display = "none"
					msg.textContent = ""
				}
				updateSummarySidebar()
				return
			}

			const seatsTotal = bookingState.selectedSeats.reduce((sum, s) => sum + s.price, 0)
			let concessionsTotal = 0
			bookingState.selectedConcessions.forEach(({ item, qty }) => {
				concessionsTotal += item.price * qty
			})
			const rawTotal = seatsTotal + concessionsTotal

			const result = calculateVoucherDiscount(code, rawTotal)
			if (result.isValid) {
				bookingState.appliedCoupon = code
				if (msg) {
					msg.style.display = "block"
					msg.style.color = "#10b981"
					msg.textContent = result.message
				}
				showToast(result.message, "success")
			} else {
				bookingState.appliedCoupon = null
				if (msg) {
					msg.style.display = "block"
					msg.style.color = "#ef4444"
					msg.textContent = result.message
				}
				showToast(result.message, "warning")
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
						<span class="ti-val" style="color:#fab387; font-size:15px;">${currentMovie.title}</span>
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
						<span class="ti-val" style="color:#a6e3a1; font-size:16px;">${seatNames}</span>
					</div>

					<div class="ti-item" style="grid-column: 1 / -1;">
						<span class="ti-lbl">Combo Bắp Nước</span>
						<span class="ti-val" style="font-size:13px; font-weight:500;">${combosText}</span>
					</div>

					<div class="ti-item" style="grid-column: 1 / -1; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 10px;">
						<span class="ti-lbl">Tổng Tiền Thanh Toán</span>
						<span class="ti-val" style="color:#fab387; font-size:20px;">${formatCurrency(finalTotal)}</span>
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

		// 1. Permanently update seats to 'sold' in LocalStorage
		const seatList = bookingState.selectedSeats.map(s => s.id)
		updateShowtimeSeats(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatList, "sold")

		// 2. Save ticket to booking history
		const newTicket = {
			id: bookingCode,
			movieId: currentMovie.id,
			movieTitle: currentMovie.title,
			moviePoster: currentMovie.poster,
			cinemaId: currentCinema.id,
			cinemaName: currentCinema.name,
			screenName,
			formatName,
			date: dateStr,
			time: timeSlot,
			seats: seatNames,
			concessions: comboList.map(c => `${c.qty}x ${c.name}`).join(", ") || "Không kèm bắp nước",
			total: finalTotal,
			voucherCode: bookingState.appliedCoupon || null,
			discountAmount: bookingState.discountAmount || 0,
			paymentMethod: "counter",
			bookingDate: new Date().toISOString(),
			status: "paid",
		}
		saveBookingTicket(newTicket)
		clearPendingBooking()

		// 3. Clear selected seats and re-render seat map so booked seats immediately show as sold
		bookingState.selectedSeats = []
		renderSeatMap()
		updateSummarySidebar()

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
	function formatTimeDigits(totalSecs) {
		const m = Math.floor(Math.max(0, totalSecs) / 60)
		const s = Math.max(0, totalSecs) % 60
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
	}

	function updateHoldTimerUI(secs, isActive = true) {
		const formatted = formatTimeDigits(secs)
		const sidebarTimerEl = document.getElementById("booking-timer-countdown")
		const hallTimerEl = document.getElementById("hall-timer-digits")
		const sidebarBadge = document.getElementById("booking-timer-badge")
		const hallTag = document.getElementById("hall-countdown-tag")
		const timerSubtext = sidebarBadge?.querySelector(".timer-subtext")

		if (sidebarTimerEl) sidebarTimerEl.textContent = formatted
		if (hallTimerEl) hallTimerEl.textContent = formatted

		// Trạng thái nghỉ (chưa chọn ghế nào)
		if (!isActive || bookingState.selectedSeats.length === 0) {
			if (sidebarBadge) {
				sidebarBadge.classList.remove("timer-danger", "timer-active")
			}
			if (hallTag) {
				hallTag.classList.remove("timer-danger", "timer-active")
			}
			if (timerSubtext) timerSubtext.textContent = "Chưa chọn ghế"
			return
		}

		if (timerSubtext) timerSubtext.textContent = "Thời gian giữ ghế"

		// Cảnh báo đỏ nhấp nháy khi còn dưới 60 giây
		const isDanger = secs <= 60
		if (sidebarBadge) {
			sidebarBadge.classList.add("timer-active")
			sidebarBadge.classList.toggle("timer-danger", isDanger)
		}
		if (hallTag) {
			hallTag.classList.add("timer-active")
			hallTag.classList.toggle("timer-danger", isDanger)
		}

		if (secs === 60 && !hasNotifiedOneMinute) {
			hasNotifiedOneMinute = true
			showToast("⚠️ Thời gian giữ ghế chỉ còn 1 phút! Vui lòng sớm xác nhận đặt vé.", "warning", 6000)
		}

		// Tự động hủy khi hết giờ (00:00)
		if (secs <= 0) {
			stopHoldCountdown()
			releaseSeatHold(holdSessionId)

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

				// Nếu đang ở bước combo bắp nước, tự động chuyển về bước chọn ghế
				if (bookingState.currentStep === 2) {
					const tabSeats = document.getElementById("tab-view-seats")
					tabSeats?.click()
				}

				updateSummarySidebar()

				showToast(
					`⏰ Đã hết thời gian giữ ghế 5 phút! Hệ thống đã tự động giải phóng ${cancelCount} ghế bạn chọn để nhường cho khách hàng khác. Vui lòng chọn lại ghế.`,
					"warning",
					8000,
				)
			}
			updateHoldTimerUI(300, false)
		}
	}

	function startHoldCountdown(resetToMax = false) {
		if (holdTimerInterval) clearInterval(holdTimerInterval)
		if (resetToMax || !holdSecondsRemaining || holdSecondsRemaining <= 0) {
			holdSecondsRemaining = 300
		}
		hasNotifiedOneMinute = false
		updateHoldTimerUI(holdSecondsRemaining, true)

		holdTimerInterval = setInterval(() => {
			holdSecondsRemaining--
			updateHoldTimerUI(holdSecondsRemaining, true)
		}, 1000)
	}

	function stopHoldCountdown() {
		if (holdTimerInterval) {
			clearInterval(holdTimerInterval)
			holdTimerInterval = null
		}
		holdSecondsRemaining = 300
		hasNotifiedOneMinute = false
		updateHoldTimerUI(300, false)
	}

	function initHoldTimer() {
		if (bookingState.selectedSeats.length > 0) {
			const existingHold = getSeatHold(holdSessionId)
			const secs = existingHold
				? Math.max(0, Math.ceil((existingHold.expiresAt - Date.now()) / 1000))
				: holdSecondsRemaining
			startHoldCountdown(secs || holdSecondsRemaining || 300)
		} else {
			stopHoldCountdown()
		}
	}

	/* ==========================================================================
	   9. BẢO VỆ PHIÊN ĐẶT VÉ: XÁC NHẬN KHI RỜI KHỎI TRANG & CLEAR GIỮ GHẾ
	   ========================================================================== */
	function initExitConfirmation() {
		let isLeavingConfirmed = false
		let isReloadKey = false

		// Bắt phím F5 / Ctrl+R / Cmd+R để không kích hoạt beforeunload khi người dùng chủ động làm mới trang
		window.addEventListener("keydown", e => {
			if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"))) {
				isReloadKey = true
			}
		})

		window.addEventListener("keyup", () => {
			setTimeout(() => {
				isReloadKey = false
			}, 1500)
		})

		function getExitConfirmMessage() {
			const isEn = getSavedLang() === "en"
			return isEn
				? "Are you sure you want to leave the booking page?\n\nIf you leave, your selected seats and concessions will be cancelled."
				: "⚠️ Bạn có chắc chắn muốn rời khỏi trang đặt vé?\n\nNếu bạn rời đi, các ghế và bắp nước đang giữ của bạn sẽ bị hủy để nhường cho khách hàng khác."
		}

		// 1. Chặn và hỏi người dùng khi click bất kỳ liên kết nào rời khỏi trang đặt vé (Logo, Trang chủ, Phim, Lịch chiếu, v.v.)
		document.addEventListener(
			"click",
			e => {
				// Chỉ can thiệp nếu người dùng đã chọn ghế hoặc đang giữ ghế
				if (bookingState.selectedSeats.length === 0 || isProceedingToCheckout) return

				const anchor = e.target.closest("a")
				if (!anchor) return

				const href = anchor.getAttribute("href")
				if (!href) return

				// Bỏ qua các liên kết nội bộ, modal, hành động javascript: hoặc mở tab mới
				if (
					href === "#" ||
					href.startsWith("#") ||
					href.startsWith("javascript:") ||
					anchor.target === "_blank"
				) {
					return
				}

				// Bỏ qua nếu là liên kết chuyển tiếp tới trang thanh toán
				if (href.includes("checkout.html")) {
					isProceedingToCheckout = true
					return
				}

				// Phân tích URL đích
				try {
					const destUrl = new URL(anchor.href, window.location.href)
					const currentUrl = new URL(window.location.href)

					// Nếu là cùng trang booking hiện tại (chỉ khác hash)
					if (
						destUrl.origin === currentUrl.origin &&
						destUrl.pathname === currentUrl.pathname &&
						destUrl.search === currentUrl.search
					) {
						return
					}

					// Người dùng đang muốn rời khỏi trang đặt vé (quay về trang chủ hoặc trang khác)
					e.preventDefault()
					e.stopPropagation()

					const confirmLeave = window.confirm(getExitConfirmMessage())
					if (confirmLeave) {
						isLeavingConfirmed = true
						// Giải phóng ghế đang giữ và xóa đơn tạm
						releaseSeatHold(holdSessionId)
						clearPendingBooking()
						window.location.href = anchor.href
					}
				} catch (err) {
					// URL không hợp lệ
				}
			},
			true,
		)

		// 2. Xử lý nút Back/Forward của trình duyệt (History Popstate)
		window.addEventListener("popstate", () => {
			if (bookingState.selectedSeats.length > 0 && !isLeavingConfirmed && !isProceedingToCheckout) {
				const confirmLeave = window.confirm(getExitConfirmMessage())
				if (confirmLeave) {
					isLeavingConfirmed = true
					releaseSeatHold(holdSessionId)
					clearPendingBooking()
					window.history.back()
				} else {
					// Giữ người dùng ở lại trang đặt vé
					window.history.pushState(null, "", window.location.href)
				}
			}
		})

		// 3. Thông báo của trình duyệt khi đóng tab / đóng cửa sổ (beforeunload)
		window.addEventListener("beforeunload", e => {
			if (
				isProceedingToCheckout ||
				isLeavingConfirmed ||
				isReloadKey ||
				bookingState.selectedSeats.length === 0
			) {
				return
			}

			const msg = getExitConfirmMessage()
			e.preventDefault()
			e.returnValue = msg
			return msg
		})
	}

	// Listen for global language switch events
	window.addEventListener("betaLangChange", () => {
		translateDom(getSavedLang())
	})
})
