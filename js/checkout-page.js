/**
 * Beta Cinemas - Checkout & E-Ticket QR Code Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast, getCurrentUser } from "./common.js"
import { getMoviesData, getCinemas } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let moviesData = getMoviesData()
	let cinemasData = getCinemas()

	try {
		if (!moviesData || !cinemasData.length) {
			const [mRes, cRes] = await Promise.all([
				fetch("/data/movies.json").then(r => r.json()),
				fetch("/data/cinemas.json").then(r => r.json()),
			])
			moviesData = mRes
			cinemasData = cRes
		}
	} catch (err) {
		console.error("Failed to load checkout dependencies:", err)
		return
	}

	// Parse URL params
	const urlParams = new URLSearchParams(window.location.search)
	const movieId = urlParams.get("movieId") || "utlan2"
	const cinemaId = urlParams.get("cinemaId") || "beta-thainguyen"
	const dateStr = urlParams.get("date") || "2026-09-26"
	const timeSlot = urlParams.get("time") || "14:30"
	const screenName = urlParams.get("screen") || "Phòng chiếu 1"
	const formatName = urlParams.get("format") || "2D Phụ Đề"
	const seatsParam = urlParams.get("seats") || "D05, D06"
	const concessionsParam = urlParams.get("concessions") || "1x Beta Combo Đôi"
	const totalParam = +urlParams.get("total") || 255000

	const allMovies = [
		...(moviesData.items.nowshowing || []),
		...(moviesData.items.special || []),
		...(moviesData.items.upcoming || []),
	]
	const currentMovie = allMovies.find(m => m.id === movieId) || allMovies[0]
	const currentCinema = cinemasData.find(c => c.id === cinemaId) || cinemasData[0]

	// Fill user data if logged in
	const user = getCurrentUser()
	if (user) {
		const nameInput = document.getElementById("cust-fullname")
		const phoneInput = document.getElementById("cust-phone")
		const emailInput = document.getElementById("cust-email")
		if (nameInput && !nameInput.value) nameInput.value = user.name || ""
		if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || ""
		if (emailInput && !emailInput.value) emailInput.value = user.email || ""
	}

	// Render order review in sidebar
	const sPoster = document.getElementById("co-poster-img")
	const sTitle = document.getElementById("co-movie-title")
	const sCinema = document.getElementById("co-cinema-name")
	const sTime = document.getElementById("co-showtime-text")
	const sFormat = document.getElementById("co-format-tag")
	const sSeats = document.getElementById("co-seats-text")
	const sConcessions = document.getElementById("co-concessions-text")
	const sTotal = document.getElementById("co-total-amount")

	if (sPoster) sPoster.src = currentMovie.poster
	if (sTitle) sTitle.textContent = currentMovie.title
	if (sCinema) sCinema.textContent = currentCinema.name
	if (sTime) sTime.textContent = `${timeSlot} - ${formatDateVN(dateStr)}`
	if (sFormat) sFormat.textContent = `${screenName} (${formatName})`
	if (sSeats) sSeats.textContent = seatsParam
	if (sConcessions) sConcessions.textContent = concessionsParam || "Không chọn"
	if (sTotal) sTotal.textContent = formatCurrency(totalParam)

	// Payment Method selection
	let selectedPayment = "momo"
	document.querySelectorAll(".payment-option-card").forEach(card => {
		card.addEventListener("click", () => {
			document.querySelectorAll(".payment-option-card").forEach(c => c.classList.remove("active"))
			card.classList.add("active")
			selectedPayment = card.dataset.method
		})
	})

	// Hold Countdown Timer (10:00 minutes)
	let remainingSeconds = 600
	const timerDisplay = document.getElementById("hold-timer-digits")
	const timerInterval = setInterval(() => {
		remainingSeconds--
		if (remainingSeconds <= 0) {
			clearInterval(timerInterval)
			if (timerDisplay) timerDisplay.textContent = "00:00"
			showToast("Thời gian giữ vé đã hết. Vui lòng thực hiện đặt vé lại.", "warning", 6000)
			document.getElementById("btn-submit-payment")?.setAttribute("disabled", "true")
			return
		}
		const m = String(Math.floor(remainingSeconds / 60)).padStart(2, "0")
		const s = String(remainingSeconds % 60).padStart(2, "0")
		if (timerDisplay) timerDisplay.textContent = `${m}:${s}`
	}, 1000)

	// Handle Submit Payment
	const payForm = document.getElementById("form-checkout-payment")
	const checkoutLayout = document.getElementById("checkout-main-grid")
	const eticketSuccessView = document.getElementById("eticket-success-view")

	payForm?.addEventListener("submit", e => {
		e.preventDefault()

		const termsCheck = document.getElementById("agree-terms-check")
		if (!termsCheck?.checked) {
			showToast("Vui lòng đồng ý với điều khoản sử dụng của rạp trước khi thanh toán.", "warning")
			return
		}

		const fullName = document.getElementById("cust-fullname")?.value.trim()
		const phone = document.getElementById("cust-phone")?.value.trim()
		const email = document.getElementById("cust-email")?.value.trim()

		if (!fullName || !phone || !email) {
			showToast("Vui lòng điền đầy đủ họ tên, số điện thoại và email nhận vé.", "warning")
			return
		}

		clearInterval(timerInterval)

		// Generate Booking Code
		const bookingCode = "BT" + Math.floor(100000 + Math.random() * 900000)

		// Save into user's booking history
		const newTicket = {
			id: bookingCode,
			movieId: currentMovie.id,
			movieTitle: currentMovie.title,
			moviePoster: currentMovie.poster,
			cinemaName: currentCinema.name,
			screenName,
			formatName,
			date: dateStr,
			time: timeSlot,
			seats: seatsParam,
			concessions: concessionsParam,
			total: totalParam,
			paymentMethod: selectedPayment,
			bookingDate: new Date().toISOString(),
			status: "paid", // paid / completed
		}

		try {
			const existingHistory = JSON.parse(localStorage.getItem("beta_booking_history") || "[]")
			existingHistory.unshift(newTicket)
			localStorage.setItem("beta_booking_history", JSON.stringify(existingHistory))
		} catch (err) {
			console.warn("Could not save to booking history:", err)
		}

		// Switch to E-Ticket View
		if (checkoutLayout) checkoutLayout.style.display = "none"
		if (eticketSuccessView) {
			eticketSuccessView.style.display = "block"
			renderETicketContent(newTicket)
			window.scrollTo({ top: 0, behavior: "smooth" })
		}

		showToast(`🎉 Thanh toán thành công! Mã vé: ${bookingCode}. Chúc bạn xem phim vui vẻ!`, "success", 6000)
	})

	function renderETicketContent(ticket) {
		const codeEl = document.getElementById("et-ticket-code-val")
		const qrCodeBox = document.getElementById("et-qr-code-box")
		const movieEl = document.getElementById("et-movie-title")
		const cinemaEl = document.getElementById("et-cinema-name")
		const screenEl = document.getElementById("et-screen-format")
		const timeEl = document.getElementById("et-showtime-val")
		const seatsEl = document.getElementById("et-seats-val")
		const combosEl = document.getElementById("et-combos-val")
		const totalEl = document.getElementById("et-total-val")
		const barcodeNum = document.getElementById("et-barcode-digits")

		if (codeEl) codeEl.textContent = ticket.id
		if (movieEl) movieEl.textContent = ticket.movieTitle
		if (cinemaEl) cinemaEl.textContent = ticket.cinemaName
		if (screenEl) screenEl.textContent = `${ticket.screenName} (${ticket.formatName})`
		if (timeEl) timeEl.textContent = `${ticket.time} - ${formatDateVN(ticket.date)}`
		if (seatsEl) seatsEl.textContent = ticket.seats
		if (combosEl) combosEl.textContent = ticket.concessions || "Không kèm bắp nước"
		if (totalEl) totalEl.textContent = formatCurrency(ticket.total)
		if (barcodeNum) barcodeNum.textContent = `${ticket.id} - KIOSK VERIFY`

		// Generate Sharp Vector SVG QR Code with Beta logo in center
		if (qrCodeBox) {
			qrCodeBox.innerHTML = `
				<svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
					<rect width="200" height="200" fill="#ffffff" rx="10" />
					<!-- QR Pattern Outer Markers -->
					<rect x="15" y="15" width="45" height="45" fill="#015198" rx="6" />
					<rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="3" />
					<rect x="29" y="29" width="17" height="17" fill="#015198" rx="2" />

					<rect x="140" y="15" width="45" height="45" fill="#015198" rx="6" />
					<rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="3" />
					<rect x="154" y="29" width="17" height="17" fill="#015198" rx="2" />

					<rect x="15" y="140" width="45" height="45" fill="#015198" rx="6" />
					<rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="3" />
					<rect x="29" y="154" width="17" height="17" fill="#015198" rx="2" />

					<!-- QR Data Blocks -->
					<rect x="70" y="20" width="12" height="12" fill="#1e293b" />
					<rect x="90" y="20" width="12" height="24" fill="#1e293b" />
					<rect x="110" y="20" width="18" height="12" fill="#1e293b" />

					<rect x="70" y="44" width="24" height="12" fill="#1e293b" />
					<rect x="110" y="44" width="12" height="24" fill="#1e293b" />

					<rect x="20" y="70" width="12" height="24" fill="#1e293b" />
					<rect x="40" y="80" width="20" height="12" fill="#1e293b" />
					<rect x="70" y="70" width="14" height="14" fill="#1e293b" />
					<rect x="140" y="70" width="20" height="12" fill="#1e293b" />
					<rect x="170" y="80" width="15" height="24" fill="#1e293b" />

					<!-- Center Beta Logo Shield -->
					<circle cx="100" cy="100" r="24" fill="#015198" />
					<circle cx="100" cy="100" r="20" fill="#ffffff" />
					<text x="100" y="106" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#015198" text-anchor="middle">β</text>

					<!-- Bottom QR Data -->
					<rect x="70" y="130" width="18" height="14" fill="#1e293b" />
					<rect x="100" y="135" width="24" height="12" fill="#1e293b" />
					<rect x="135" y="130" width="14" height="24" fill="#1e293b" />
					<rect x="160" y="140" width="24" height="14" fill="#1e293b" />

					<rect x="70" y="160" width="24" height="24" fill="#1e293b" />
					<rect x="110" y="165" width="18" height="18" fill="#1e293b" />
					<rect x="145" y="165" width="40" height="18" fill="#1e293b" />
				</svg>
			`
		}

		// Download ticket button mock
		document.getElementById("btn-download-ticket")?.addEventListener("click", () => {
			showToast(`Đã lưu vé điện tử ${ticket.id} vào thiết bị của bạn thành công!`, "success")
		})
	}
})
