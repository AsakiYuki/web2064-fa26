/**
 * Beta Cinemas - Checkout & E-Ticket QR Code Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast, getCurrentUser, openAuthModal, updateHeaderAccountUI, translateDom, getSavedLang } from "./common.js"
import {
	getMoviesData,
	getCinemas,
	getPendingBooking,
	clearPendingBooking,
	saveBookingTicket,
	demoConfirmPayment,
	validateVoucherForCheckout,
	checkSeatsAvailability,
	releaseSeatHold,
} from "./storage.js"
import { generateQRCodeSVG } from "./qrcode.js"
import { apiHoldSeats } from "./api.js"

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

	// 1. Read from LocalStorage Pending Booking or fallback to URL query params
	const pending = getPendingBooking()
	const urlParams = new URLSearchParams(window.location.search)
	const holdId = urlParams.get("holdId") || pending?.holdId
	if (!pending || !holdId) {
		showToast("Phiên giữ ghế không hợp lệ. Vui lòng chọn suất và ghế lại.", "error", 6000)
		window.location.replace("/schedule.html")
		return
	}

	const movieId = urlParams.get("movieId") || pending?.movieId || "utlan2"
	const cinemaId = urlParams.get("cinemaId") || pending?.cinemaId || "beta-thainguyen"
	const dateStr = urlParams.get("date") || pending?.date || "2026-09-26"
	const timeSlot = urlParams.get("time") || pending?.time || "14:30"
	const screenName = urlParams.get("screen") || pending?.screenName || "Phòng chiếu 1"
	const formatName = urlParams.get("format") || pending?.formatName || "2D Phụ Đề"
	const seatsParam = urlParams.get("seats") || pending?.seatsString || "D05, D06"
	const concessionsParam = urlParams.get("concessions") || pending?.concessionsString || "1x Beta Combo Đôi"
	let initialVoucher = urlParams.get("voucher") || pending?.voucherCode || ""
	let rawTotal = pending ? (pending.seatsTotal || 0) + (pending.concessionsTotal || 0) : (+urlParams.get("total") || 255000)
	const concessionsTotal = Number(pending?.concessionsTotal) || 0
	const serverHold = await apiHoldSeats({
		holdId,
		cinemaId,
		movieId,
		date: dateStr,
		time: timeSlot,
		seats: seatsParam.split(",").map(seat => seat.trim()).filter(Boolean),
	})
	if (!serverHold.success) {
		showToast(serverHold.message || "Các ghế này không còn khả dụng. Vui lòng chọn ghế khác.", "error", 7000)
		window.location.replace(`/booking.html?movieId=${encodeURIComponent(movieId)}&cinemaId=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}`)
		return
	}
	pending.holdExpiresAt = serverHold.expiresAt

	// If rawTotal wasn't split, deduce fallback
	if (rawTotal <= 0) rawTotal = 255000

	const allMovies = [
		...(moviesData.items?.nowshowing || []),
		...(moviesData.items?.special || []),
		...(moviesData.items?.upcoming || []),
	]
	const currentMovie = allMovies.find(m => m.id === movieId) || allMovies[0]
	const currentCinema = cinemasData.find(c => c.id === cinemaId) || cinemasData[0]

	// Checkout state
	const checkoutState = {
		movie: currentMovie,
		cinema: currentCinema,
		date: dateStr,
		time: timeSlot,
		screen: screenName,
		format: formatName,
		seats: seatsParam,
		concessions: concessionsParam,
		rawTotal: rawTotal,
		voucherCode: initialVoucher,
		discountAmount: 0,
		finalTotal: rawTotal,
		paymentMethod: "momo",
	}

	// Calculate initial voucher discount if present
	if (initialVoucher) {
		const vRes = await validateVoucherForCheckout(initialVoucher, checkoutState.rawTotal, concessionsTotal, dateStr)
		if (vRes.success) {
			checkoutState.discountAmount = vRes.discountAmount
			checkoutState.finalTotal = Math.max(0, checkoutState.rawTotal - checkoutState.discountAmount)
		} else {
			checkoutState.voucherCode = ""
		}
	}

	// 2. Auth verification & prefill contact data
	function checkUserAuth() {
		const currentUser = getCurrentUser()
		const nameInput = document.getElementById("cust-fullname")
		const phoneInput = document.getElementById("cust-phone")
		const emailInput = document.getElementById("cust-email")
		const authNotice = document.getElementById("checkout-auth-notice")

		if (currentUser) {
			if (nameInput) nameInput.value = currentUser.name || nameInput.value || ""
			if (phoneInput) phoneInput.value = currentUser.phone || phoneInput.value || ""
			if (emailInput) emailInput.value = currentUser.email || emailInput.value || ""
			if (authNotice) authNotice.style.display = "none"
		} else {
			if (authNotice) authNotice.style.display = "flex"
		}
		return currentUser
	}

	const initialUser = checkUserAuth()
	if (!initialUser) {
		showToast("Vui lòng đăng nhập tài khoản để tiếp tục đặt vé!", "warning", 5000)
		openAuthModal("login")
	}

	document.getElementById("btn-checkout-login-prompt")?.addEventListener("click", () => {
		openAuthModal("login")
	})

	window.addEventListener("beta_auth_changed", () => {
		checkUserAuth()
	})

	// 2.1 Stepper Navigation (Allow returning to Seat selection or Concessions)
	let isPaymentCompleted = false
	let isNavigatingInternally = false

	const stepNav1 = document.getElementById("step-nav-1")
	const stepNav2 = document.getElementById("step-nav-2")
	if (stepNav1) {
		stepNav1.style.cursor = "pointer"
		stepNav1.addEventListener("click", () => {
			isNavigatingInternally = true
			window.location.href = `/booking.html?movieId=${encodeURIComponent(movieId)}&cinemaId=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}&screen=${encodeURIComponent(screenName)}&format=${encodeURIComponent(formatName)}&step=1`
		})
	}
	if (stepNav2) {
		stepNav2.style.cursor = "pointer"
		stepNav2.addEventListener("click", () => {
			isNavigatingInternally = true
			window.location.href = `/booking.html?movieId=${encodeURIComponent(movieId)}&cinemaId=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}&screen=${encodeURIComponent(screenName)}&format=${encodeURIComponent(formatName)}&step=2`
		})
	}

	// 2.2 Protect Checkout Session: Prompt beforeunload and handle leaving
	window.addEventListener("beforeunload", e => {
		if (isPaymentCompleted || isNavigatingInternally) return
		const msg = getSavedLang() === "en"
			? "You have an ongoing checkout session. Are you sure you want to leave?"
			: "⚠️ Bạn có đơn vé đang chờ thanh toán. Bạn có chắc chắn muốn rời khỏi trang không?"
		e.preventDefault()
		e.returnValue = msg
		return msg
	})

	document.addEventListener(
		"click",
		e => {
			if (isPaymentCompleted || isNavigatingInternally) return
			const anchor = e.target.closest("a")
			if (!anchor) return
			const href = anchor.getAttribute("href")
			if (!href || href === "#" || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank") return

			if (href.includes("booking.html")) {
				isNavigatingInternally = true
				return
			}

			const confirmMsg = getSavedLang() === "en"
				? "Are you sure you want to leave checkout? Your held seats will be released."
				: "⚠️ Bạn có chắc chắn muốn rời khỏi trang thanh toán? Ghế đang giữ của bạn sẽ được hoàn lại để nhường cho khách khác."
			if (!window.confirm(confirmMsg)) {
				e.preventDefault()
				e.stopPropagation()
				return
			}

			if (pending?.holdId) {
				releaseSeatHold(pending.holdId)
			}
			clearPendingBooking()
		},
		true,
	)

	// 3. Render Order Review in Sidebar
	renderSidebarDetails()
	initVoucherSection()
	translateDom(getSavedLang())

	function renderSidebarDetails() {
		const sPoster = document.getElementById("co-poster-img")
		const sTitle = document.getElementById("co-movie-title")
		const sCinema = document.getElementById("co-cinema-name")
		const sTime = document.getElementById("co-showtime-text")
		const sFormat = document.getElementById("co-format-tag")
		const sSeats = document.getElementById("co-seats-text")
		const sConcessions = document.getElementById("co-concessions-text")
		const sTotal = document.getElementById("co-total-amount")
		const discountRow = document.getElementById("co-discount-row")
		const discountVal = document.getElementById("co-discount-val")

		if (sPoster) sPoster.src = currentMovie.poster
		if (sTitle) sTitle.textContent = currentMovie.title
		if (sCinema) sCinema.textContent = currentCinema.name
		if (sTime) sTime.textContent = `${timeSlot} - ${formatDateVN(dateStr)}`
		if (sFormat) sFormat.textContent = `${screenName} (${formatName})`
		if (sSeats) sSeats.textContent = seatsParam
		if (sConcessions) sConcessions.textContent = concessionsParam || "Không chọn"

		if (checkoutState.discountAmount > 0) {
			if (discountRow) discountRow.style.display = "flex"
			if (discountVal) discountVal.textContent = `-${formatCurrency(checkoutState.discountAmount)}`
		} else if (discountRow) {
			discountRow.style.display = "none"
		}

		if (sTotal) sTotal.textContent = formatCurrency(checkoutState.finalTotal)
	}

	// 4. Voucher on Checkout Page
	function initVoucherSection() {
		const vInput = document.getElementById("co-coupon-input")
		const vBtn = document.getElementById("btn-co-apply-coupon")
		const vMsg = document.getElementById("co-coupon-msg")

		if (vInput && checkoutState.voucherCode) {
			vInput.value = checkoutState.voucherCode
			if (vMsg) {
				vMsg.style.display = "block"
				vMsg.style.color = "#10b981"
				vMsg.textContent = `Đã áp dụng mã ${checkoutState.voucherCode} (-${formatCurrency(checkoutState.discountAmount)})`
			}
		}

		vBtn?.addEventListener("click", async () => {
			const code = vInput?.value.trim().toUpperCase() || ""
			if (!code) {
				checkoutState.voucherCode = ""
				checkoutState.discountAmount = 0
				checkoutState.finalTotal = checkoutState.rawTotal
				if (vMsg) {
					vMsg.style.display = "none"
					vMsg.textContent = ""
				}
				renderSidebarDetails()
				return
			}

			vBtn.disabled = true
			const vRes = await validateVoucherForCheckout(code, checkoutState.rawTotal, concessionsTotal, dateStr)
			vBtn.disabled = false
			if (vRes.success) {
				checkoutState.voucherCode = code
				checkoutState.discountAmount = vRes.discountAmount
				checkoutState.finalTotal = Math.max(0, checkoutState.rawTotal - checkoutState.discountAmount)
				if (vMsg) {
					vMsg.style.display = "block"
					vMsg.style.color = "#10b981"
					vMsg.textContent = vRes.message
				}
				showToast(vRes.message, "success")
			} else {
				checkoutState.voucherCode = ""
				checkoutState.discountAmount = 0
				checkoutState.finalTotal = checkoutState.rawTotal
				if (vMsg) {
					vMsg.style.display = "block"
					vMsg.style.color = "#ef4444"
					vMsg.textContent = vRes.message
				}
				showToast(vRes.message, "warning")
			}
			renderSidebarDetails()
		})
	}

	// 5. Payment Method Selection
	document.querySelectorAll(".payment-option-card").forEach(card => {
		card.addEventListener("click", () => {
			document.querySelectorAll(".payment-option-card").forEach(c => c.classList.remove("active"))
			card.classList.add("active")
			checkoutState.paymentMethod = card.dataset.method || "momo"
		})
	})

	// 6. Hold Countdown Timer (10:00 minutes)
	let remainingSeconds = pending?.holdExpiresAt
		? Math.max(10, Math.floor((pending.holdExpiresAt - Date.now()) / 1000))
		: 600

	const timerDisplay = document.getElementById("hold-timer-digits")
	const timerInterval = setInterval(() => {
		remainingSeconds--
		if (remainingSeconds <= 0) {
			clearInterval(timerInterval)
			if (timerDisplay) timerDisplay.textContent = "00:00"
			if (pending?.holdId) {
				releaseSeatHold(pending.holdId)
			}
			showToast("Thời gian giữ vé đã hết! Vui lòng thực hiện đặt vé lại.", "warning", 8000)
			document.getElementById("btn-submit-payment")?.setAttribute("disabled", "true")
			clearPendingBooking()
			return
		}
		const m = String(Math.floor(remainingSeconds / 60)).padStart(2, "0")
		const s = String(remainingSeconds % 60).padStart(2, "0")
		if (timerDisplay) timerDisplay.textContent = `${m}:${s}`
	}, 1000)

	// 7. Interactive QR Code Payment Confirmation Process
	const payForm = document.getElementById("form-checkout-payment")
	const checkoutLayout = document.getElementById("checkout-main-grid")
	const eticketSuccessView = document.getElementById("eticket-success-view")
	const qrModal = document.getElementById("payment-qr-modal")
	const qrModalClose = document.getElementById("qr-modal-close")
	const qrCancelBtn = document.getElementById("btn-cancel-qr-modal")
	const qrConfirmPaidBtn = document.getElementById("btn-confirm-qr-paid")
	const qrVerifyOverlay = document.getElementById("qr-verifying-overlay")
	const btnCopyTransfer = document.getElementById("btn-copy-transfer-msg")
	let qrTimerInterval = null

	const methodNames = {
		momo: "Ví Điện Tử MoMo",
		zalopay: "Ví Điện Tử ZaloPay",
		vnpay: "Cổng VNPAY-QR",
		visa: "Thẻ Quốc Tế 3D Secure",
		atm: "VietQR / ATM Nội Địa",
	}

	function closeQRModal() {
		if (qrTimerInterval) clearInterval(qrTimerInterval)
		if (qrModal) {
			qrModal.classList.remove("active")
			document.body.style.overflow = ""
		}
		if (qrVerifyOverlay) qrVerifyOverlay.style.display = "none"
		const submitBtn = document.getElementById("btn-submit-payment")
		if (submitBtn) submitBtn.disabled = false
	}

	qrModalClose?.addEventListener("click", closeQRModal)
	qrCancelBtn?.addEventListener("click", closeQRModal)
	window.addEventListener("beta_auth_expired", closeQRModal)
	qrModal?.addEventListener("click", e => {
		if (e.target === qrModal && (!qrVerifyOverlay || qrVerifyOverlay.style.display === "none")) {
			closeQRModal()
		}
	})

	// Copy transfer content button
	btnCopyTransfer?.addEventListener("click", () => {
		const transferCode = document.getElementById("qr-modal-transfer-msg")?.textContent || ""
		if (transferCode && navigator.clipboard) {
			navigator.clipboard.writeText(transferCode).then(() => {
				showToast("Đã sao chép nội dung chuyển khoản!", "info", 2000)
			}).catch(() => {})
		}
	})

	function triggerPaymentProcess(e) {
		if (e && typeof e.preventDefault === "function") {
			e.preventDefault()
		}

		// Validate user authentication - must be logged in to book ticket
		const currentUser = getCurrentUser()
		if (!currentUser) {
			showToast("Vui lòng đăng nhập tài khoản để hoàn tất đặt vé!", "warning", 5000)
			openAuthModal("login")
			const submitBtn = document.getElementById("btn-submit-payment")
			if (submitBtn) submitBtn.disabled = false
			return
		}

		// Validate terms agreement
		const termsCheck = document.getElementById("agree-terms-check")
		if (!termsCheck?.checked) {
			showToast("Vui lòng đồng ý với điều khoản sử dụng của rạp trước khi thanh toán.", "warning")
			document.getElementById("agree-terms-check")?.focus()
			return
		}

		// Validate customer contact form
		const fullName = document.getElementById("cust-fullname")?.value.trim() || currentUser.name || "Khách Hàng"
		const phone = document.getElementById("cust-phone")?.value.trim() || currentUser.phone || ""
		const email = document.getElementById("cust-email")?.value.trim() || currentUser.email || ""

		if (!fullName || fullName.length < 2) {
			showToast("Vui lòng nhập họ và tên người nhận vé hợp lệ.", "warning")
			document.getElementById("cust-fullname")?.focus()
			return
		}

		const cleanPhone = phone.replace(/[\s.-]/g, "")
		if (!cleanPhone || !/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
			showToast("Số điện thoại nhận vé không hợp lệ (VD: 0912345678).", "warning")
			document.getElementById("cust-phone")?.focus()
			return
		}

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			showToast("Địa chỉ Email nhận vé không hợp lệ.", "warning")
			document.getElementById("cust-email")?.focus()
			return
		}

		// Kiểm tra lại tính khả dụng của ghế trước khi thanh toán
		const seatList = seatsParam.split(",").map(s => s.trim()).filter(Boolean)
		const availCheck = checkSeatsAvailability(currentCinema.id, currentMovie.id, dateStr, timeSlot, seatList, pending?.holdId)
		if (!availCheck.allAvailable) {
			showToast(`⚠️ Rất tiếc, ghế [${availCheck.unavailableSeats.join(", ")}] đã không còn khả dụng hoặc đã hết thời gian giữ vé! Vui lòng chọn lại.`, "error", 4500)
			setTimeout(() => {
				window.location.href = `/booking.html?movieId=${encodeURIComponent(currentMovie.id)}&cinemaId=${encodeURIComponent(currentCinema.id)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeSlot)}`
			}, 1800)
			return
		}

		// Disable submit button during transaction
		const submitBtn = document.getElementById("btn-submit-payment")
		if (submitBtn) submitBtn.disabled = true

		// Generate random unique booking code
		const randomNum = Math.floor(100000 + Math.random() * 900000)
		const bookingCode = `BT-${randomNum}`
		const transferContent = `BETA ${bookingCode.replace("-", "")}`
		const methodNameText = methodNames[checkoutState.paymentMethod] || "Cổng thanh toán QR"

		// 1. Populate and Render Payment QR Code
		const badgeEl = document.getElementById("qr-modal-method-badge")
		const titleEl = document.getElementById("qr-modal-title")
		const descEl = document.getElementById("qr-modal-desc")
		const amountEl = document.getElementById("qr-modal-amount")
		const bookingCodeEl = document.getElementById("qr-modal-booking-code")
		const transferMsgEl = document.getElementById("qr-modal-transfer-msg")
		const qrRenderBox = document.getElementById("qr-payment-render-box")

		if (badgeEl) badgeEl.textContent = checkoutState.paymentMethod.toUpperCase()
		if (titleEl) titleEl.textContent = `Quét Mã QR ${methodNameText}`
		if (descEl) descEl.textContent = `Đây là mã QR mô phỏng, chưa kết nối ${methodNameText} và không thể dùng để chuyển tiền. Gửi yêu cầu chỉ tạo đơn chờ thanh toán.`
		if (amountEl) amountEl.textContent = formatCurrency(checkoutState.finalTotal)
		if (bookingCodeEl) bookingCodeEl.textContent = bookingCode
		if (transferMsgEl) transferMsgEl.textContent = transferContent

		// Create standard dynamic payment QR data (compact and fast to scan)
		const paymentQrData = `BETAPAY|${bookingCode}|${checkoutState.finalTotal}|${transferContent}`

		if (qrRenderBox) {
			qrRenderBox.innerHTML = generateQRCodeSVG(paymentQrData, {
				size: 200,
				darkColor: "#11111b",
				lightColor: "#ffffff",
				includeLogo: true,
			})
		}

		// 2. Start QR Payment Countdown Timer (5 mins)
		let qrSeconds = 300
		const qrTimerDisplay = document.getElementById("qr-modal-timer")
		if (qrTimerInterval) clearInterval(qrTimerInterval)
		if (qrTimerDisplay) qrTimerDisplay.textContent = "05:00"

		qrTimerInterval = setInterval(() => {
			qrSeconds--
			if (qrSeconds <= 0) {
				clearInterval(qrTimerInterval)
				showToast("Mã QR thanh toán đã hết hạn! Vui lòng thực hiện lại.", "warning", 6000)
				closeQRModal()
				return
			}
			const m = String(Math.floor(qrSeconds / 60)).padStart(2, "0")
			const s = String(qrSeconds % 60).padStart(2, "0")
			if (qrTimerDisplay) qrTimerDisplay.textContent = `${m}:${s}`
		}, 1000)

		// 3. Open QR Modal
		if (qrModal) {
			qrModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		// 4. Handle "TÔI ĐÃ QUÉT MÃ VÀ THANH TOÁN" Confirmation Action
		if (qrConfirmPaidBtn) {
			qrConfirmPaidBtn.disabled = false
			qrConfirmPaidBtn.onclick = async () => {
				qrConfirmPaidBtn.disabled = true
				if (qrVerifyOverlay) qrVerifyOverlay.style.display = "flex"

				if (qrTimerInterval) clearInterval(qrTimerInterval)
				clearInterval(timerInterval)

				// Save as pending. A customer click cannot prove that a provider received money.
				const newTicket = {
					id: bookingCode,
					userId: currentUser?.id || null,
					userEmail: currentUser?.email || email,
					movieId: currentMovie.id,
					movieTitle: currentMovie.title,
					moviePoster: currentMovie.poster,
					cinemaId: currentCinema.id,
					cinemaName: currentCinema.name,
					screenName,
					formatName,
					date: dateStr,
					time: timeSlot,
					seats: seatsParam,
					concessions: concessionsParam,
					total: checkoutState.finalTotal,
					voucherCode: checkoutState.voucherCode || null,
					discountAmount: checkoutState.discountAmount || 0,
					paymentMethod: checkoutState.paymentMethod,
					customerName: fullName,
					customerPhone: cleanPhone,
					customerEmail: email,
					rawTotal: checkoutState.rawTotal,
					concessionsTotal,
					bookingDate: new Date().toISOString(),
					holdId,
					bookingStatus: "pending",
					paymentStatus: "pending",
				}

				const savedTicket = await saveBookingTicket(newTicket)
				if (savedTicket.saveError) {
					showToast(savedTicket.saveError, "error", 7000)
					if (qrVerifyOverlay) qrVerifyOverlay.style.display = "none"
					qrConfirmPaidBtn.disabled = false
					return
				}
				isPaymentCompleted = true
				clearPendingBooking()
				updateHeaderAccountUI()

				// Close QR Modal
				closeQRModal()

				// 10. SWITCH TO E-TICKET SUCCESS VIEW WITH SCANNABLE QR CODE
				if (checkoutLayout) checkoutLayout.style.display = "none"
				if (eticketSuccessView) {
					eticketSuccessView.style.display = "block"
					renderETicketContent(savedTicket)
					window.scrollTo({ top: 0, behavior: "smooth" })
				}

				showToast(
					`Đã ghi nhận đơn ${bookingCode} ở trạng thái chờ xác nhận thanh toán. Vé chưa được xác nhận thanh toán.`,
					"info",
					7000
				)
			}
		}

		// 5. Handle Demo Instant Pay (Simulation of bank IPN callback)
		const demoInstantBtn = document.getElementById("btn-demo-instant-pay")
		if (demoInstantBtn) {
			demoInstantBtn.disabled = false
			demoInstantBtn.onclick = async () => {
				demoInstantBtn.disabled = true
				if (qrVerifyOverlay) qrVerifyOverlay.style.display = "flex"

				if (qrTimerInterval) clearInterval(qrTimerInterval)
				clearInterval(timerInterval)

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
					seats: seatsParam,
					concessions: concessionsParam,
					rawTotal: checkoutState.rawTotal,
					concessionsTotal,
					total: checkoutState.finalTotal,
					voucherCode: checkoutState.voucherCode || null,
					discountAmount: checkoutState.discountAmount || 0,
					paymentMethod: checkoutState.paymentMethod,
					customerName: fullName,
					customerPhone: cleanPhone,
					customerEmail: email,
					bookingDate: new Date().toISOString(),
					holdId,
					bookingStatus: "pending",
					paymentStatus: "pending",
				}

				const savedTicket = await saveBookingTicket(newTicket)
				if (savedTicket.saveError) {
					showToast(savedTicket.saveError, "error", 7000)
					if (qrVerifyOverlay) qrVerifyOverlay.style.display = "none"
					demoInstantBtn.disabled = false
					return
				}

				// Call instant webhook confirmation
				await demoConfirmPayment(savedTicket.id)
				savedTicket.paymentStatus = "paid"
				savedTicket.status = "paid"
				savedTicket.bookingStatus = "confirmed"

				isPaymentCompleted = true
				clearPendingBooking()
				updateHeaderAccountUI()
				closeQRModal()

				if (checkoutLayout) checkoutLayout.style.display = "none"
				if (eticketSuccessView) {
					eticketSuccessView.style.display = "block"
					renderETicketContent(savedTicket)
					window.scrollTo({ top: 0, behavior: "smooth" })
				}

				showToast("🎉 Mô phỏng thanh toán thành công! Vé đã được xác nhận thanh toán và cộng điểm tích lũy.", "success", 7000)
			}
		}
	}

	payForm?.addEventListener("submit", triggerPaymentProcess)
	document.getElementById("btn-submit-payment")?.addEventListener("click", triggerPaymentProcess)

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

		const isPaid = ticket.paymentStatus === "paid" || ticket.status === "paid"
		const bannerBadge = document.getElementById("et-success-badge")
		const bannerTitle = document.getElementById("et-top-title")
		const bannerDesc = document.getElementById("et-top-desc")
		const statusPill = document.getElementById("et-status-pill-banner")
		const statusPillText = document.getElementById("et-status-pill-text")
		const qrHint = document.querySelector(".qr-hint")

		if (isPaid) {
			if (bannerBadge) {
				bannerBadge.textContent = "✓"
				bannerBadge.style.background = "#a6e3a1"
				bannerBadge.style.color = "#11111b"
			}
			if (bannerTitle) bannerTitle.textContent = "THANH TOÁN THÀNH CÔNG!"
			if (bannerDesc) bannerDesc.textContent = "Vé điện tử đã được xác nhận thanh toán. Bạn có thể xuất trình mã vé tại rạp để vào xem phim."
			if (statusPill) {
				statusPill.style.background = "rgba(166, 227, 161, 0.15)"
				statusPill.style.color = "#a6e3a1"
				statusPill.style.borderColor = "rgba(166, 227, 161, 0.3)"
			}
			if (statusPillText) statusPillText.textContent = "✅ ĐÃ THANH TOÁN (VÉ HỢP LỆ VÀO RẠP)"
			if (qrHint) qrHint.textContent = "Xuất trình mã QR này tại quầy soát vé hoặc Kiosk tự động để in vé vào rạp."
		} else {
			if (bannerBadge) {
				bannerBadge.textContent = "⏳"
				bannerBadge.style.background = "#fab387"
				bannerBadge.style.color = "#11111b"
			}
			if (bannerTitle) bannerTitle.textContent = "ĐÃ TIẾP NHẬN ĐƠN ĐẶT VÉ"
			if (bannerDesc) bannerDesc.textContent = "Đơn đang chờ xác nhận thanh toán từ ngân hàng hoặc quản trị viên rạp. Vui lòng kiểm tra trạng thái vé."
			if (statusPill) {
				statusPill.style.background = "rgba(250, 179, 135, 0.15)"
				statusPill.style.color = "#fab387"
				statusPill.style.borderColor = "rgba(250, 179, 135, 0.3)"
			}
			if (statusPillText) statusPillText.textContent = "⏳ ĐANG CHỜ DUYỆT THANH TOÁN"
			if (qrHint) qrHint.textContent = "Mã tham chiếu đơn hàng. Vé sẽ có hiệu lực vào rạp ngay sau khi thanh toán được duyệt."
		}

		if (codeEl) codeEl.textContent = ticket.id
		if (movieEl) movieEl.textContent = ticket.movieTitle
		if (cinemaEl) cinemaEl.textContent = ticket.cinemaName
		if (screenEl) screenEl.textContent = `${ticket.screenName} (${ticket.formatName})`
		if (timeEl) timeEl.textContent = `${ticket.time} - ${formatDateVN(ticket.date)}`
		if (seatsEl) seatsEl.textContent = ticket.seats
		if (combosEl) combosEl.textContent = ticket.concessions || "Không kèm bắp nước"
		if (totalEl) totalEl.textContent = formatCurrency(ticket.total)
		if (barcodeNum) barcodeNum.textContent = `${ticket.id} - KIOSK VERIFY`

		// Generate Real Scannable Vector QR Code using qrcode.js
		if (qrCodeBox) {
			const qrData = `BETATICKET|${ticket.id}|${ticket.time} ${ticket.date}|${ticket.seats}`
			qrCodeBox.innerHTML = generateQRCodeSVG(qrData, {
				size: 180,
				darkColor: "#11111b",
				lightColor: "#cdd6f4",
				includeLogo: true,
			})
		}

		// Download / Print ticket handler
		document.getElementById("btn-download-ticket")?.addEventListener("click", () => {
			window.print()
		})

		translateDom(getSavedLang())
	}

	// Listen for global language switch events
	window.addEventListener("betaLangChange", () => {
		translateDom(getSavedLang())
	})
})
