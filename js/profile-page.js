/**
 * Beta Cinemas - User Profile & Booking History Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast, getCurrentUser, saveUserSession } from "./common.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	// 1. Load User Session
	let user = getCurrentUser()
	if (!user) {
		user = {
			name: "Nguyễn Văn An",
			email: "nguyen.an@gmail.com",
			phone: "0912 345 678",
			points: 850,
			rank: "BETA VIP MEMBER",
			avatar: "N",
		}
		saveUserSession(user)
	}

	renderUserInfo(user)

	// 2. Setup Profile Navigation Tabs
	const tabBtns = document.querySelectorAll(".p-tab-btn")
	const panels = {
		history: document.getElementById("panel-history"),
		info: document.getElementById("panel-info"),
		vouchers: document.getElementById("panel-vouchers"),
		security: document.getElementById("panel-security"),
	}

	tabBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			tabBtns.forEach(b => b.classList.remove("active"))
			btn.classList.add("active")

			const target = btn.dataset.tab
			Object.entries(panels).forEach(([key, panel]) => {
				if (!panel) return
				if (key === target) {
					panel.style.display = "block"
					panel.classList.add("active")
				} else {
					panel.style.display = "none"
					panel.classList.remove("active")
				}
			})
		})
	})

	// 3. Render Booking History
	renderBookingHistory()

	// 4. Personal Info Form Submit
	const infoForm = document.getElementById("form-profile-info")
	infoForm?.addEventListener("submit", e => {
		e.preventDefault()
		const name = document.getElementById("pf-name")?.value.trim()
		const email = document.getElementById("pf-email")?.value.trim()
		const phone = document.getElementById("pf-phone")?.value.trim()

		if (!name || !email || !phone) {
			showToast("Vui lòng điền đầy đủ họ tên, email và số điện thoại.", "warning")
			return
		}

		user.name = name
		user.email = email
		user.phone = phone
		user.avatar = name.charAt(0).toUpperCase()
		saveUserSession(user)
		renderUserInfo(user)

		showToast("Cập nhật thông tin tài khoản thành công!", "success")
	})

	// 5. Voucher Copy Buttons
	document.querySelectorAll(".btn-use-voucher").forEach(btn => {
		btn.addEventListener("click", () => {
			const code = btn.dataset.code
			if (code) {
				navigator.clipboard?.writeText(code)
				showToast(`Đã sao chép mã ưu đãi ${code}! Dùng mã này khi đặt vé để nhận giảm giá.`, "success")
			}
		})
	})

	// 6. Change Password Form
	const passForm = document.getElementById("form-change-password")
	passForm?.addEventListener("submit", e => {
		e.preventDefault()
		const oldPass = document.getElementById("old-pass")?.value
		const newPass = document.getElementById("new-pass")?.value
		const confirmPass = document.getElementById("confirm-pass")?.value

		if (newPass.length < 6) {
			showToast("Mật khẩu mới phải có ít nhất 6 ký tự.", "warning")
			return
		}

		if (newPass !== confirmPass) {
			showToast("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!", "warning")
			return
		}

		passForm.reset()
		showToast("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.", "success")
	})

	// 7. Modal E-Ticket Close
	const modal = document.getElementById("profile-ticket-modal")
	const modalClose = document.getElementById("profile-ticket-modal-close")
	modalClose?.addEventListener("click", () => {
		modal?.classList.remove("active")
		document.body.style.overflow = ""
	})
	modal?.addEventListener("click", e => {
		if (e.target === modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	})

	/* ==========================================================================
	   HELPER FUNCTIONS
	   ========================================================================== */
	function renderUserInfo(u) {
		const avatarEl = document.getElementById("user-avatar-circle")
		const nameEl = document.getElementById("user-display-name")
		const emailEl = document.getElementById("user-display-email")
		const phoneEl = document.getElementById("user-display-phone")
		const pointsEl = document.getElementById("user-points-val")
		const rankEl = document.getElementById("user-display-rank")

		if (avatarEl) avatarEl.textContent = u.avatar || u.name?.charAt(0).toUpperCase() || "B"
		if (nameEl) nameEl.textContent = u.name
		if (emailEl) emailEl.textContent = u.email
		if (phoneEl) phoneEl.textContent = u.phone
		if (pointsEl) pointsEl.textContent = `${u.points || 850} Điểm`
		if (rankEl) rankEl.textContent = u.rank || "BETA VIP MEMBER"

		// Pre-fill form fields
		const pfName = document.getElementById("pf-name")
		const pfEmail = document.getElementById("pf-email")
		const pfPhone = document.getElementById("pf-phone")
		if (pfName && !pfName.value) pfName.value = u.name || ""
		if (pfEmail && !pfEmail.value) pfEmail.value = u.email || ""
		if (pfPhone && !pfPhone.value) pfPhone.value = u.phone || ""
	}

	function renderBookingHistory() {
		const container = document.getElementById("history-cards-container")
		const badge = document.getElementById("history-count-badge")
		if (!container) return

		let history = []
		try {
			history = JSON.parse(localStorage.getItem("beta_booking_history") || "[]")
		} catch (e) {
			history = []
		}

		// Fallback sample tickets if clean state
		if (history.length === 0) {
			history = [
				{
					id: "BT842915",
					movieId: "utlan2",
					movieTitle: "Út Lan 2: Vùng Đất Mất Tích",
					moviePoster: "/poster/poster_utlan2.jpg",
					cinemaName: "Beta Thái Nguyên",
					screenName: "Phòng chiếu 1",
					formatName: "2D Phụ Đề",
					date: "2026-09-26",
					time: "14:30",
					seats: "D05, D06",
					concessions: "1x Beta Combo Đôi",
					total: 255000,
					paymentMethod: "momo",
					status: "paid",
				},
				{
					id: "BT718320",
					movieId: "bongma",
					movieTitle: "Bóng Ma Nhà Hát",
					moviePoster: "/poster/poster_bongma.jpg",
					cinemaName: "Beta Thanh Xuân (Hà Nội)",
					screenName: "Phòng chiếu VIP 2",
					formatName: "2D Lồng Tiếng",
					date: "2026-09-20",
					time: "20:00",
					seats: "F07, F08",
					concessions: "Không kèm bắp nước",
					total: 160000,
					paymentMethod: "vnpay",
					status: "done",
				},
			]
			localStorage.setItem("beta_booking_history", JSON.stringify(history))
		}

		if (badge) badge.textContent = history.length

		container.innerHTML = history
			.map((t, idx) => {
				const isPaid = t.status === "paid"
				const statusText = isPaid ? "Đã Thanh Toán" : "Đã Sử Dụng"
				const statusClass = isPaid ? "status-paid" : "status-done"

				return `
					<div class="history-ticket-card" data-ticket-index="${idx}">
						<div class="ht-poster">
							<img src="${t.moviePoster || "/poster/poster_utlan2.jpg"}" alt="${t.movieTitle}" onerror="this.src='/poster/poster_utlan2.jpg'" />
						</div>
						<div class="ht-details">
							<span class="ht-status-badge ${statusClass}">● ${statusText}</span>
							<h3 class="ht-title">${t.movieTitle}</h3>
							<div class="ht-meta-row">
								<span>🏛️ <strong>${t.cinemaName}</strong></span>
								<span>📽️ ${t.screenName || "Phòng 1"} (${t.formatName || "2D"})</span>
								<span>📅 <strong>${t.time}</strong> - ${formatDateVN(t.date)}</span>
							</div>
							<div class="ht-meta-row" style="margin-top: 4px;">
								<span>💺 Ghế: <strong style="color:#10b981;">${t.seats}</strong></span>
								<span>🍿 ${t.concessions || "Không kèm bắp"}</span>
								<span>💳 <strong style="color:#fbbf24;">${formatCurrency(t.total)}</strong></span>
							</div>
							<div class="ht-code">Mã Vé: ${t.id}</div>
						</div>
						<div class="ht-actions">
							<button type="button" class="btn-view-eticket" data-ticket-id="${t.id}">
								Xem Vé Điện Tử
							</button>
							<a href="/booking.html?movieId=${t.movieId || 'utlan2'}" class="btn-rebook">
								Đặt Lại Suất Chiếu
							</a>
						</div>
					</div>
				`
			})
			.join("")

		// Attach view e-ticket clicks
		container.querySelectorAll(".btn-view-eticket").forEach(btn => {
			btn.addEventListener("click", () => {
				const ticketId = btn.dataset.ticketId
				const targetTicket = history.find(t => t.id === ticketId)
				if (targetTicket) openProfileTicketModal(targetTicket)
			})
		})
	}

	function openProfileTicketModal(t) {
		const modal = document.getElementById("profile-ticket-modal")
		const body = document.getElementById("profile-ticket-modal-body")
		if (!modal || !body) return

		body.innerHTML = `
			<div class="eticket-success-page-wrap" style="margin: 0; box-shadow: none;">
				<div class="eticket-top-banner">
					<div class="et-success-badge">✓</div>
					<h2 style="color:#fff; font-size: 20px; font-weight:900; margin:0 0 4px; text-transform:uppercase;">VÉ XEM PHIM ĐIỆN TỬ</h2>
					<p style="font-size: 13px; color: rgba(255,255,255,0.9); margin:0;">Mã vé: ${t.id} • Beta Cinemas</p>
				</div>
				<div class="eticket-ticket-pass">
					<div class="et-code-banner">
						<div class="code-label">MÃ QUÉT TẠI RẠP (KIOSK)</div>
						<div class="code-value">${t.id}</div>
					</div>
					<div class="et-qr-container">
						<div class="qr-code-box">
							<svg viewBox="0 0 200 200" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
								<rect width="200" height="200" fill="#ffffff" rx="10" />
								<rect x="15" y="15" width="45" height="45" fill="#015198" rx="6" />
								<rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="3" />
								<rect x="29" y="29" width="17" height="17" fill="#015198" rx="2" />
								<rect x="140" y="15" width="45" height="45" fill="#015198" rx="6" />
								<rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="3" />
								<rect x="154" y="29" width="17" height="17" fill="#015198" rx="2" />
								<rect x="15" y="140" width="45" height="45" fill="#015198" rx="6" />
								<rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="3" />
								<rect x="29" y="154" width="17" height="17" fill="#015198" rx="2" />
								<rect x="70" y="20" width="12" height="12" fill="#1e293b" />
								<rect x="90" y="20" width="12" height="24" fill="#1e293b" />
								<rect x="110" y="20" width="18" height="12" fill="#1e293b" />
								<rect x="70" y="44" width="24" height="12" fill="#1e293b" />
								<rect x="20" y="70" width="12" height="24" fill="#1e293b" />
								<rect x="40" y="80" width="20" height="12" fill="#1e293b" />
								<rect x="70" y="70" width="14" height="14" fill="#1e293b" />
								<rect x="140" y="70" width="20" height="12" fill="#1e293b" />
								<circle cx="100" cy="100" r="22" fill="#015198" />
								<circle cx="100" cy="100" r="18" fill="#ffffff" />
								<text x="100" y="105" font-family="'Inter', sans-serif" font-size="13" font-weight="900" fill="#015198" text-anchor="middle">β</text>
								<rect x="70" y="130" width="18" height="14" fill="#1e293b" />
								<rect x="100" y="135" width="24" height="12" fill="#1e293b" />
								<rect x="135" y="130" width="14" height="24" fill="#1e293b" />
								<rect x="70" y="160" width="24" height="24" fill="#1e293b" />
								<rect x="110" y="165" width="18" height="18" fill="#1e293b" />
								<rect x="145" y="165" width="40" height="18" fill="#1e293b" />
							</svg>
						</div>
						<div class="qr-hint">Xuất trình mã này cho nhân viên soát vé</div>
					</div>
					<div class="et-info-grid">
						<div class="et-info-item" style="grid-column: 1 / -1;">
							<span class="et-lbl">Phim</span>
							<span class="et-val val-gold">${t.movieTitle}</span>
						</div>
						<div class="et-info-item">
							<span class="et-lbl">Rạp</span>
							<span class="et-val">${t.cinemaName}</span>
						</div>
						<div class="et-info-item">
							<span class="et-lbl">Phòng / Định dạng</span>
							<span class="et-val">${t.screenName || "Phòng 1"} (${t.formatName || "2D"})</span>
						</div>
						<div class="et-info-item">
							<span class="et-lbl">Thời Gian</span>
							<span class="et-val">${t.time} - ${formatDateVN(t.date)}</span>
						</div>
						<div class="et-info-item">
							<span class="et-lbl">Ghế Ngồi</span>
							<span class="et-val val-green">${t.seats}</span>
						</div>
						<div class="et-info-item" style="grid-column: 1 / -1;">
							<span class="et-lbl">Bắp Nước</span>
							<span class="et-val">${t.concessions || "Không kèm bắp"}</span>
						</div>
						<div class="et-info-item" style="grid-column: 1 / -1; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px;">
							<span class="et-lbl">Tổng Tiền</span>
							<span class="et-val val-gold">${formatCurrency(t.total)}</span>
						</div>
					</div>
					<div class="et-barcode-wrap">
						<div class="barcode-strip"></div>
						<div class="barcode-number">${t.id} - KIOSK READY</div>
					</div>
				</div>
			</div>
		`

		modal.classList.add("active")
		document.body.style.overflow = "hidden"
	}
})
