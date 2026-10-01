/**
 * Beta Cinemas - User Profile & Booking History Logic
 */
import { setupHeaderAndFooter, formatCurrency, formatDateVN, showToast, getCurrentUser, saveUserSession } from "./common.js"
import { getBookingHistory, updateUserInDatabase, VOUCHER_LIST } from "./storage.js"
import { generateQRCodeSVG } from "./qrcode.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	// 1. Load User Session from LocalStorage
	let user = getCurrentUser()
	if (!user) {
		user = {
			name: "Nguyễn Hoàng Nam",
			email: "nam.nguyen@example.com",
			phone: "0987 654 321",
			points: 850,
			rank: "Thành viên Beta VIP",
			avatarText: "N",
		}
		saveUserSession(user)
	} else {
		// Merge any missing fields with defaults
		user = { ...DEFAULT_PROFILE, ...user }
	}

	renderUserInfo(user)

	// 2. Setup Profile Navigation Tabs
	const urlParams = new URLSearchParams(window.location.search)
	const initialTab = urlParams.get("tab") || "history"

	const tabBtns = document.querySelectorAll(".p-tab-btn")
	const panels = {
		history: document.getElementById("panel-history"),
		info: document.getElementById("panel-info"),
		vouchers: document.getElementById("panel-vouchers"),
		security: document.getElementById("panel-security"),
	}

	function activateTab(target) {
		tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === target))
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
	}

	tabBtns.forEach(btn => {
		btn.addEventListener("click", () => activateTab(btn.dataset.tab))
	})

	activateTab(initialTab)

	// 3. Render Booking History
	renderBookingHistory()

	// Booking History Status Filter Buttons
	const filterBtns = document.querySelectorAll("#history-status-filters .btn-filter-status")
	filterBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			filterBtns.forEach(b => {
				b.classList.remove("active")
				b.style.background = "#1e293b"
				b.style.color = "#94a3b8"
			})
			btn.classList.add("active")
			btn.style.background = "#015198"
			btn.style.color = "#fff"

			currentHistoryFilter = btn.dataset.status
			renderBookingHistory()
		})
	})

	// Booking History Search Input
	const searchInput = document.getElementById("history-search-input")
	searchInput?.addEventListener("input", e => {
		currentSearchKeyword = e.target.value.trim().toLowerCase()
		renderBookingHistory()
	})

	// 4. Setup Avatar Color Presets and Live Preview
	const avatarPreview = document.getElementById("pf-avatar-preview")
	const avatarInput = document.getElementById("pf-avatar-input")
	const colorBtns = document.querySelectorAll(".color-preset-btn")

	const colorGradients = {
		gold: "linear-gradient(135deg, #f5a623 0%, #d97706 100%)",
		blue: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
		purple: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
		emerald: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
	}

	colorBtns.forEach(cbtn => {
		cbtn.addEventListener("click", () => {
			colorBtns.forEach(b => (b.style.borderColor = "transparent"))
			cbtn.style.borderColor = "#fff"
			const chosenColor = cbtn.dataset.color || "gold"
			user.avatarColor = chosenColor
			if (avatarPreview) {
				avatarPreview.style.background = colorGradients[chosenColor] || colorGradients.gold
			}
			const heroAvatar = document.getElementById("user-avatar-circle")
			if (heroAvatar) {
				heroAvatar.style.background = colorGradients[chosenColor] || colorGradients.gold
			}
		})
	})

	avatarInput?.addEventListener("input", e => {
		const val = e.target.value.toUpperCase()
		if (avatarPreview) avatarPreview.textContent = val || "N"
	})

	// 5. Bắt sự kiện người dùng bấm Lưu và Ghi vào LocalStorage
	const infoForm = document.getElementById("form-profile-info")
	infoForm?.addEventListener("submit", e => {
		e.preventDefault()
		// Lấy giá trị từ người dùng gõ vào
		const name = document.getElementById("pf-name")?.value.trim()
		const email = document.getElementById("pf-email")?.value.trim()
		const phone = document.getElementById("pf-phone")?.value.trim()
		const birthday = document.getElementById("pf-birthday")?.value
		const gender = document.getElementById("pf-gender")?.value
		const favCinema = document.getElementById("pf-fav-cinema")?.value

		if (!email || !email.includes("@")) {
			showToast("Vui lòng nhập địa chỉ email hợp lệ.", "warning")
			return
		}

		if (!phone || phone.length < 9) {
			showToast("Vui lòng nhập số điện thoại hợp lệ.", "warning")
			return
		}

		// Cập nhật  thông tin vào OBJECT user
		user.name = name
		user.email = email
		user.phone = phone
		user.birthday = birthday
		user.gender = gender
		user.cinemaFavorite = favCinema
		user.avatarText = name.charAt(0).toUpperCase()
		user.avatar = user.avatarText

		saveUserSession(user)
		updateUserInDatabase(user)
		renderUserInfo(user)
		// Báo thành công
		showToast("✅ Đã cập nhật và lưu thông tin cá nhân vào LocalStorage thành công!", "success")
	})

	// Reset profile button
	document.getElementById("btn-reset-profile")?.addEventListener("click", () => {
		if (confirm("Bạn có chắc chắn muốn đặt lại thông tin cá nhân về mặc định?")) {
			user = { ...DEFAULT_PROFILE }
			saveUserSession(user)
			renderUserInfo(user)
			showToast("Đã khôi phục thông tin cá nhân về mặc định.", "info")
		}
	})

	// 6. Voucher Copy Buttons
	document.querySelectorAll(".btn-use-voucher").forEach(btn => {
		btn.addEventListener("click", () => {
			const code = btn.dataset.code
			if (code) {
				navigator.clipboard?.writeText(code)
				showToast(`Đã sao chép mã ưu đãi ${code}! Dùng mã này khi đặt vé để nhận giảm giá.`, "success")
			}
		})
	})

	// 7. Change Password Form
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

		user.password = newPass
		saveUserSession(user)
		updateUserInDatabase(user)

		passForm.reset()
		showToast("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.", "success")
	})

	// 8. Modal E-Ticket Close
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

		if (avatarEl) avatarEl.textContent = u.avatarText || u.avatar || u.name?.charAt(0).toUpperCase() || "B"
		if (nameEl) nameEl.textContent = u.name
		if (emailEl) emailEl.textContent = u.email
		if (phoneEl) phoneEl.textContent = u.phone
		if (pointsEl) pointsEl.textContent = `${u.points || 850} Điểm`
		if (rankEl) rankEl.textContent = u.rank || "Thành viên Beta VIP"

		// Pre-fill form fields
		const pfAvatarPreview = document.getElementById("pf-avatar-preview")
		const pfAvatarInput = document.getElementById("pf-avatar-input")
		const pfName = document.getElementById("pf-name")
		const pfEmail = document.getElementById("pf-email")
		const pfPhone = document.getElementById("pf-phone")
		const pfBirthday = document.getElementById("pf-birthday")
		const pfGender = document.getElementById("pf-gender")
		const pfFav = document.getElementById("pf-fav-cinema")

		if (pfName) pfName.value = u.name || ""
		if (pfEmail) pfEmail.value = u.email || ""
		if (pfPhone) pfPhone.value = u.phone || ""
		if (pfBirthday && u.birthday) pfBirthday.value = u.birthday
		if (pfGender && u.gender) pfGender.value = u.gender
		if (pfFav && u.cinemaFavorite) pfFav.value = u.cinemaFavorite
	}

	function renderBookingHistory() {
		const container = document.getElementById("history-cards-container")
		const badge = document.getElementById("history-count-badge")
		if (!container) return

		const history = getBookingHistory()

		if (badge) badge.textContent = history.length

		if (history.length === 0) {
			container.innerHTML = `
				<div style="text-align: center; padding: 48px 20px; color: #94a3b8;">
					<span style="font-size: 48px; display: block; margin-bottom: 12px;">🎟️</span>
					<h3 style="color: #fff; font-size: 18px; margin: 0 0 8px;">Bạn Chưa Có Lịch Sử Đặt Vé</h3>
					<p style="font-size: 14px; margin: 0 0 20px;">Hãy chọn phim yêu thích và trải nghiệm rạp Beta Cinemas ngay hôm nay!</p>
					<a href="/movies.html" style="background: #015198; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Xem Danh Sách Phim</a>
				</div>
			`
			return
		}

		container.innerHTML = history
			.map((t, idx) => {
				const isPaid = t.status === "paid"
				const isCancelled = t.status === "cancelled"
				let statusText = "Đã Thanh Toán"
				let statusClass = "status-paid"
				let statusBadgeStyle = "background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4);"

				if (t.status === "done") {
					statusText = "Đã Sử Dụng"
					statusClass = "status-done"
					statusBadgeStyle = "background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.4);"
				} else if (isCancelled) {
					statusText = "Đã Hủy"
					statusClass = "status-cancelled"
					statusBadgeStyle = "background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);"
				}

				return `
					<div class="history-ticket-card" id="ticket-card-${t.id}">
						<div class="ht-poster">
							<img src="${t.moviePoster || "/poster/poster_utlan2.jpg"}" alt="${t.movieTitle}" onerror="this.src='/poster/poster_utlan2.jpg'" />
						</div>
						<div class="ht-details">
							<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
								<span class="ht-status-badge ${statusClass}" style="padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${statusBadgeStyle}">● ${statusText}</span>
								<span style="font-size: 12px; color: #64748b;">${t.paymentMethod ? `Thanh toán qua ${t.paymentMethod.toUpperCase()}` : ""}</span>
							</div>
							<h3 class="ht-title" style="margin: 0 0 8px; font-size: 17px; font-weight: 800; color: #fff;">${t.movieTitle}</h3>
							<div class="ht-meta-row" style="display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: #cbd5e1;">
								<span>🏛️ <strong>${t.cinemaName}</strong></span>
								<span>📽️ ${t.screenName || "Phòng 1"} (${t.formatName || "2D"})</span>
								<span>📅 <strong>${t.time}</strong> - ${formatDateVN(t.date)}</span>
							</div>
							<div class="ht-meta-row" style="margin-top: 6px; display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: #cbd5e1;">
								<span>💺 Ghế: <strong style="color:#10b981;">${t.seats}</strong></span>
								<span>🍿 ${t.concessions || "Không kèm bắp"}</span>
								<span>💳 <strong style="color:#fbbf24;">${formatCurrency(t.total)}</strong></span>
							</div>
							<div class="ht-code" style="margin-top: 8px; font-family: monospace; font-size: 12px; color: #94a3b8;">Mã Vé: <span style="color:#38bdf8; font-weight:700;">${t.id}</span></div>
						</div>
						<div class="ht-actions" style="display: flex; flex-direction: column; gap: 8px; min-width: 140px;">
							<button type="button" class="btn-view-eticket" data-ticket-id="${t.id}" style="background: #015198; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
								🎟️ Xem Vé Điện Tử
							</button>
							${
								isPaid
									? `
								<button type="button" class="btn-cancel-ticket" data-ticket-id="${t.id}" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
									✕ Hủy Vé
								</button>
							`
									: ""
							}
							<a href="/booking.html?movieId=${t.movieId || "utlan2"}" class="btn-rebook" style="text-align: center; background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; text-decoration: none;">
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
				const targetTicket = userTickets.find(t => t.id === ticketId)
				if (targetTicket) openProfileTicketModal(targetTicket)
			})
		})

		// Attach cancel ticket clicks
		container.querySelectorAll(".btn-cancel-ticket").forEach(btn => {
			btn.addEventListener("click", () => {
				const ticketId = btn.dataset.ticketId
				if (confirm(`Bạn có chắc chắn muốn hủy vé ${ticketId}? Tiền vé sẽ được hoàn về phương thức thanh toán ban đầu.`)) {
					cancelBookingTicket(ticketId)
					showToast(`Đã hủy vé ${ticketId} thành công.`, "info")
					renderBookingHistory()
				}
			})
		})
	}

	function openProfileTicketModal(t) {
		const modal = document.getElementById("profile-ticket-modal")
		const body = document.getElementById("profile-ticket-modal-body")
		if (!modal || !body) return

		const qrSvg = generateQRCodeSVG(
			JSON.stringify({
				ticket: t.id,
				movie: t.movieTitle,
				cinema: t.cinemaName,
				time: `${t.time} ${t.date}`,
				seats: t.seats,
				status: "VALID_PAID",
			}),
			{
				size: 160,
				darkColor: "#015198",
				lightColor: "#ffffff",
				includeLogo: true,
			}
		)

		body.innerHTML = `
			<div class="eticket-success-page-wrap" style="margin: 0; box-shadow: none; max-width: 100%;">
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
							${qrSvg}
						</div>
						<div class="qr-hint">Xuất trình mã QR này tại quầy hoặc máy in vé tự động</div>
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
							<span class="et-lbl">Tổng Tiền Đã Thanh Toán</span>
							<span class="et-val val-gold">${formatCurrency(t.total)}</span>
						</div>
					</div>
					<div class="et-barcode-wrap">
						<div class="barcode-strip"></div>
						<div class="barcode-number">${t.id} - KIOSK READY</div>
					</div>
				</div>
				<div class="eticket-bottom-actions">
					<button type="button" class="btn-et-action btn-save-ticket" id="btn-print-profile-ticket">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7 10 12 15 17 10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
						In Vé / Lưu Vé
					</button>
				</div>
			</div>
		`

		modal.classList.add("active")
		document.body.style.overflow = "hidden"

		document.getElementById("btn-print-profile-ticket")?.addEventListener("click", () => {
			window.print()
		})
	}
})
