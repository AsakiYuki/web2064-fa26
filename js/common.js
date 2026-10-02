/**
 * Beta Cinemas - Common Utilities & Shared Components
 * Authentication, Mega Menu, Mobile Drawer, Modals & Toast notifications
 */
import { initializeStorage, storageGet, STORAGE_KEYS, getCinemas, getFooterData } from "./storage.js"

/** Format currency VND */
export function formatCurrency(amount) {
	if (!amount && amount !== 0) return ""
	return new Intl.NumberFormat("vi-VN").format(amount) + " đ"
}

/** Format Date to Vietnamese display: e.g. "Thứ Bảy, 26/09/2026" */
export function formatDateVN(dateStr) {
	if (!dateStr) return ""
	const date = new Date(dateStr)
	const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
	const dayName = days[date.getDay()]
	const d = String(date.getDate()).padStart(2, "0")
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const y = date.getFullYear()
	return `${dayName}, ${d}/${m}/${y}`
}

/** Show Toast Notification */
export function showToast(message, type = "info", duration = 3500) {
	let container = document.getElementById("toast-container")
	if (!container) {
		container = document.createElement("div")
		container.id = "toast-container"
		container.className = "toast-container"
		document.body.appendChild(container)
	}

	const toast = document.createElement("div")
	toast.className = `toast toast--${type}`

	const icons = {
		success: "✅",
		warning: "⚠️",
		info: "ℹ️",
		error: "❌",
	}

	toast.innerHTML = `
		<span class="toast-icon">${icons[type] || "ℹ️"}</span>
		<div class="toast-message">${message}</div>
		<button class="toast-close" aria-label="Đóng">&times;</button>
	`

	const closeBtn = toast.querySelector(".toast-close")
	const removeToast = () => {
		toast.style.opacity = "0"
		toast.style.transform = "translateX(100%)"
		setTimeout(() => toast.remove(), 250)
	}

	closeBtn.addEventListener("click", removeToast)
	container.appendChild(toast)

	setTimeout(removeToast, duration)
}

/* ==========================================================================
   USER AUTHENTICATION STATE & LOGIC
   ========================================================================== */
import {
	getCurrentUser,
	getUser,
	saveUserSession,
	logoutUser,
	registerNewUser,
	authenticateUser,
	isAccountRegistered,
	isUserAdmin,
	isCurrentAdmin,
	DEFAULT_USERS,
} from "./storage.js"

export { getCurrentUser, getUser, saveUserSession, logoutUser }

if (typeof window !== "undefined") {
	window.getCurrentUser = getCurrentUser
	window.getUser = getCurrentUser
}

/** Ẩn/hiện toàn bộ các mục liên kết Quản trị (Admin) trên menu theo vai trò người dùng */
export function updateNavAdminVisibility() {
	const user = getCurrentUser()
	const isAdmin = isUserAdmin(user)

	const adminElements = document.querySelectorAll("#nav-admin, .nav-admin-link, .admin-only, [data-admin-only]")
	adminElements.forEach(el => {
		el.style.display = isAdmin ? "" : "none"
	})
}

export function logoutUserAndNotify() {
	logoutUser()
	try {
		updateHeaderAccountUI()
		updateDrawerAccountUI()
		updateNavAdminVisibility()
	} catch (err) {
		console.warn("UI update error on logout:", err)
	}
	showToast("Bạn đã đăng xuất tài khoản thành công.", "info")

	// If on profile page, refresh or notify
	if (window.location.pathname.includes("profile.html")) {
		setTimeout(() => {
			window.location.href = "/"
		}, 800)
	}
}

/** Update Account Bar in Header (Logged in vs Logged out) */
export function updateHeaderAccountUI() {
	const user = getCurrentUser()
	const isAdmin = isUserAdmin(user)
	const accountContainer = document.querySelector(".header-account-manager .container")
	if (!accountContainer) return

	if (user) {
		accountContainer.innerHTML = `
			<div class="user-account-badge" id="header-user-menu-btn" tabindex="0">
				<div class="user-avatar-circle">${user.avatarText || user.avatar || user.name.charAt(0)}</div>
				<span class="user-name-text">${user.name}</span>
				<svg class="user-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
				<div class="user-profile-dropdown" id="user-profile-dropdown">
					<div class="up-header">
						<span class="up-rank">⭐ ${user.rank || "Thành viên VIP"}</span>
						<span class="up-points">${user.points || 0} điểm thưởng</span>
					</div>
					<a href="/profile.html?tab=info" class="up-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
						<span>Thông tin tài khoản</span>
					</a>
					<a href="/profile.html?tab=history" class="up-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
						<span>Lịch sử đặt vé</span>
					</a>
					<a href="/profile.html?tab=vouchers" class="up-item">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
						<span>Ưu đãi của tôi</span>
					</a>
					${isAdmin ? `
					<a href="/admin.html" class="up-item up-admin" style="color: #fab387; font-weight: 700;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
						<span>Trang Quản Trị (Admin)</span>
					</a>` : ""}
					<a href="#" class="up-item up-logout" id="btn-header-logout">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
						<span>Đăng xuất</span>
					</a>
				</div>
			</div>
			${isAdmin ? `
			<div class="divider"></div>
			<a href="/admin.html" style="color: #fab387; font-weight: 700; font-size: 13px;" title="Vào Trang Quản Trị">⚙️ Admin</a>` : ""}
			<div class="divider"></div>
			<span style="font-size: 18px; margin-left: 4px; cursor: pointer" title="English">🇬🇧</span>
		`

		const menuBtn = document.getElementById("header-user-menu-btn")
		menuBtn?.addEventListener("click", e => {
			if (e.target.closest(".up-item")) return
			menuBtn.classList.toggle("active")
		})

		document.getElementById("btn-header-logout")?.addEventListener("click", e => {
			e.preventDefault()
			logoutUserAndNotify()
		})
	} else {
		accountContainer.innerHTML = `
			<a href="#" id="btn-login">Đăng nhập</a>
			<div class="divider"></div>
			<a href="#" id="btn-register">Đăng ký</a>
			<span style="font-size: 18px; margin-left: 4px; cursor: pointer" title="English">🇬🇧</span>
		`
		document.getElementById("btn-login")?.addEventListener("click", e => {
			e.preventDefault()
			openAuthModal("login")
		})
		document.getElementById("btn-register")?.addEventListener("click", e => {
			e.preventDefault()
			openAuthModal("register")
		})
	}

	// Đồng bộ hiển thị nút quản trị trên thanh menu chính
	updateNavAdminVisibility()
}

/* ==========================================================================
   UNIVERSAL AUTH MODAL (LOGIN / REGISTER WITH FORM VALIDATION)
   ========================================================================== */
export function openAuthModal(defaultTab = "login") {
	let modal = document.getElementById("universal-auth-modal")
	if (!modal) {
		modal = document.createElement("div")
		modal.id = "universal-auth-modal"
		modal.className = "modal-backdrop"
		modal.innerHTML = `
			<div class="modal-content auth-modal-content" role="dialog" aria-modal="true" aria-label="Tài khoản Beta Cinemas">
				<button class="modal-close-btn" id="auth-modal-close" aria-label="Đóng">&#x2715;</button>
				<div class="auth-header-tabs">
					<button type="button" class="auth-tab-btn active" id="auth-tab-login" data-tab="login">ĐĂNG NHẬP</button>
					<button type="button" class="auth-tab-btn" id="auth-tab-register" data-tab="register">ĐĂNG KÝ</button>
				</div>
				<div class="auth-body">
					<!-- Social Logins -->
					<div class="social-login-grid">
						<button type="button" class="btn-social btn-google" id="btn-social-google">
							<span>G</span> Google
						</button>
						<button type="button" class="btn-social btn-facebook" id="btn-social-facebook">
							<span>f</span> Facebook
						</button>
					</div>

					<div class="auth-divider-line"><span>Hoặc</span></div>

					<!-- LOGIN FORM -->
					<form id="form-auth-login" class="auth-form" novalidate>
						<div class="form-group">
							<label for="login-account">Email hoặc Số điện thoại <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="text" id="login-account" placeholder="username@example.com"  />
							</div>
							<span class="field-error-msg" id="err-login-account"></span>
						</div>
						<div class="form-group">
							<label for="login-password">Mật khẩu <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="password" id="login-password" placeholder="********"  />
								<button type="button" class="toggle-pwd-btn" data-target="login-password" aria-label="Hiện mật khẩu">👁</button>
							</div>
							<span class="field-error-msg" id="err-login-password"></span>
						</div>
						<div class="form-options-row">
							<label>
								<input type="checkbox" id="login-remember" checked />
								<span>Ghi nhớ đăng nhập</span>
							</label>
							<a href="#" class="forgot-pwd-link" id="link-forgot-pwd">Quên mật khẩu?</a>
						</div>
						<button type="submit" class="btn-submit-auth">ĐĂNG NHẬP NGAY</button>
						<div class="auth-footer-prompt">
							Chưa có tài khoản? <a id="switch-to-register">Đăng ký thành viên mới</a>
						</div>
					</form>

					<!-- REGISTER FORM -->
					<form id="form-auth-register" class="auth-form" style="display: none;" novalidate>
						<div class="form-group">
							<label for="reg-fullname">Họ và tên <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="text" id="reg-fullname" placeholder="Nguyễn Văn A" />
							</div>
							<span class="field-error-msg" id="err-reg-fullname"></span>
						</div>
						<div class="form-group">
							<label for="reg-phone">Số điện thoại <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="tel" id="reg-phone" placeholder="0123456789" />
							</div>
							<span class="field-error-msg" id="err-reg-phone"></span>
						</div>
						<div class="form-group">
							<label for="reg-email">Email <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="email" id="reg-email" placeholder="username@example.com" />
							</div>
							<span class="field-error-msg" id="err-reg-email"></span>
						</div>
						<div class="form-group">
							<label for="reg-password">Mật khẩu <span class="req">*</span></label>
							<div class="input-icon-wrap">
								<input type="password" id="reg-password" placeholder="Tối thiểu 6 ký tự" />
								<button type="button" class="toggle-pwd-btn" data-target="reg-password" aria-label="Hiện mật khẩu">👁</button>
							</div>
							<span class="field-error-msg" id="err-reg-password"></span>
						</div>
						<div class="form-options-row">
							<label>
								<input type="checkbox" id="reg-terms" checked />
								<span>Tôi đồng ý với điều khoản Beta Cinemas</span>
							</label>
						</div>
						<span class="field-error-msg" id="err-reg-terms" style="margin-top:-8px;"></span>
						<button type="submit" class="btn-submit-auth">TẠO TÀI KHOẢN MỚI</button>
						<div class="auth-footer-prompt">
							Đã có tài khoản? <a id="switch-to-login">Đăng nhập</a>
						</div>
					</form>
				</div>
			</div>
		`
		document.body.appendChild(modal)
		initAuthModalEvents(modal)
	}

	setAuthTab(defaultTab)
	modal.classList.add("active")
	document.body.style.overflow = "hidden"
}

export function closeAuthModal() {
	const modal = document.getElementById("universal-auth-modal")
	if (modal) {
		modal.classList.remove("active")
		document.body.style.overflow = ""
	}
}

function setAuthTab(tab) {
	const loginTabBtn = document.getElementById("auth-tab-login")
	const regTabBtn = document.getElementById("auth-tab-register")
	const loginForm = document.getElementById("form-auth-login")
	const regForm = document.getElementById("form-auth-register")

	// Clear errors
	document.querySelectorAll(".field-error-msg").forEach(el => {
		el.style.display = "none"
		el.textContent = ""
	})
	document.querySelectorAll(".auth-form input").forEach(input => {
		input.style.borderColor = ""
	})

	if (tab === "login") {
		loginTabBtn?.classList.add("active")
		regTabBtn?.classList.remove("active")
		if (loginForm) loginForm.style.display = "flex"
		if (regForm) regForm.style.display = "none"
	} else {
		loginTabBtn?.classList.remove("active")
		regTabBtn?.classList.add("active")
		if (loginForm) loginForm.style.display = "none"
		if (regForm) regForm.style.display = "flex"
	}
}

function setFieldError(fieldId, errorMsg) {
	const errorEl = document.getElementById(`err-${fieldId}`)
	const inputEl = document.getElementById(fieldId)
	if (errorEl) {
		if (errorMsg) {
			errorEl.textContent = errorMsg
			errorEl.style.display = "block"
			if (inputEl) inputEl.style.borderColor = "#ef4444"
		} else {
			errorEl.textContent = ""
			errorEl.style.display = "none"
			if (inputEl) inputEl.style.borderColor = ""
		}
	}
}

function initAuthModalEvents(modal) {
	modal.addEventListener("click", e => {
		if (e.target === modal) closeAuthModal()
	})
	modal.querySelector("#auth-modal-close")?.addEventListener("click", closeAuthModal)

	document.getElementById("auth-tab-login")?.addEventListener("click", () => setAuthTab("login"))
	document.getElementById("auth-tab-register")?.addEventListener("click", () => setAuthTab("register"))
	document.getElementById("switch-to-register")?.addEventListener("click", () => setAuthTab("register"))
	document.getElementById("switch-to-login")?.addEventListener("click", () => setAuthTab("login"))

	// Password visibility toggle
	modal.querySelectorAll(".toggle-pwd-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const targetId = btn.dataset.target
			const input = document.getElementById(targetId)
			if (!input) return
			if (input.type === "password") {
				input.type = "text"
				btn.textContent = "🙈"
			} else {
				input.type = "password"
				btn.textContent = "👁"
			}
		})
	})

	// Real-time blur validation on register fields
	const regFullNameInput = document.getElementById("reg-fullname")
	const regPhoneInput = document.getElementById("reg-phone")
	const regEmailInput = document.getElementById("reg-email")
	const regPassInput = document.getElementById("reg-password")

	regFullNameInput?.addEventListener("input", () => {
		if (regFullNameInput.value.trim().length >= 2) setFieldError("reg-fullname", "")
	})
	regPhoneInput?.addEventListener("input", () => {
		const clean = regPhoneInput.value.replace(/\s+/g, "")
		if (/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(clean)) setFieldError("reg-phone", "")
	})
	regEmailInput?.addEventListener("input", () => {
		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmailInput.value.trim())) setFieldError("reg-email", "")
	})
	regPassInput?.addEventListener("input", () => {
		if (regPassInput.value.length >= 6) setFieldError("reg-password", "")
	})

	// Social Logins (Google / Facebook mock)
	const loginSocial = provider => {
		saveUserSession(DEFAULT_USERS[0])
		try {
			updateHeaderAccountUI()
			updateDrawerAccountUI()
		} catch (err) {
			console.warn("UI update error:", err)
		} finally {
			closeAuthModal()
		}
		showToast(`Đăng nhập thành công với tài khoản ${provider}! Chào mừng bạn.`, "success")
	}
	document.getElementById("btn-social-google")?.addEventListener("click", () => loginSocial("Google"))
	document.getElementById("btn-social-facebook")?.addEventListener("click", () => loginSocial("Facebook"))

	// Login form submit with validation
	document.getElementById("form-auth-login")?.addEventListener("submit", async e => {
		e.preventDefault()
		const accInput = document.getElementById("login-account")
		const pwdInput = document.getElementById("login-password")
		const acc = accInput?.value.trim() || ""
		const pwd = pwdInput?.value || ""

		let hasError = false
		if (!acc) {
			setFieldError("login-account", "Vui lòng nhập Email hoặc Số điện thoại.")
			hasError = true
		} else {
			setFieldError("login-account", "")
		}

		if (!pwd) {
			setFieldError("login-password", "Vui lòng nhập mật khẩu.")
			hasError = true
		} else if (pwd.length < 6) {
			setFieldError("login-password", "Mật khẩu phải có ít nhất 6 ký tự.")
			hasError = true
		} else {
			setFieldError("login-password", "")
		}

		if (hasError) return

		// Authenticate with json-server-auth / storage
		const authResult = await authenticateUser(acc, pwd)
		if (!authResult.success) {
			// Fallback: If not in list, check if matches default demo pattern or create quick session
			if (acc.includes("@") && pwd.length >= 6) {
				const fallbackName = acc.split("@")[0]
				const userObj = {
					...DEFAULT_USERS[0],
					name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
					email: acc,
					avatarText: fallbackName.charAt(0).toUpperCase(),
				}
				saveUserSession(userObj)
				try {
					updateHeaderAccountUI()
					updateDrawerAccountUI()
				} catch (err) {
					console.warn("UI update error:", err)
				} finally {
					closeAuthModal()
				}
				showToast(`Đăng nhập thành công! Chào mừng ${userObj.name} đã quay lại.`, "success")
				return
			}
			setFieldError("login-account", authResult.message)
			showToast(authResult.message, "warning")
			return
		}

		try {
			updateHeaderAccountUI()
			updateDrawerAccountUI()
		} catch (err) {
			console.warn("UI update error on login:", err)
		} finally {
			closeAuthModal()
		}
		showToast(`Đăng nhập thành công! Chào mừng ${authResult.user.name} đã quay lại.`, "success")
	})

	// Register form submit with full validation
	document.getElementById("form-auth-register")?.addEventListener("submit", async e => {
		e.preventDefault()
		const name = document.getElementById("reg-fullname")?.value.trim() || ""
		const rawPhone = document.getElementById("reg-phone")?.value.trim() || ""
		const cleanPhone = rawPhone.replace(/[\s.-]/g, "")
		const email = document.getElementById("reg-email")?.value.trim() || ""
		const password = document.getElementById("reg-password")?.value || ""
		const termsChecked = document.getElementById("reg-terms")?.checked

		let isValid = true

		// 1. Validate Họ và tên
		if (!name) {
			setFieldError("reg-fullname", "Vui lòng nhập họ và tên của bạn.")
			isValid = false
		} else if (name.length < 2) {
			setFieldError("reg-fullname", "Họ và tên phải có tối thiểu 2 ký tự.")
			isValid = false
		} else {
			setFieldError("reg-fullname", "")
		}

		// 2. Validate Số điện thoại VN
		const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/
		if (!cleanPhone) {
			setFieldError("reg-phone", "Vui lòng nhập số điện thoại.")
			isValid = false
		} else if (!phoneRegex.test(cleanPhone)) {
			setFieldError("reg-phone", "Số điện thoại không hợp lệ (VD: 0987654321).")
			isValid = false
		} else {
			setFieldError("reg-phone", "")
		}

		// 3. Validate Email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!email) {
			setFieldError("reg-email", "Vui lòng nhập địa chỉ Email.")
			isValid = false
		} else if (!emailRegex.test(email)) {
			setFieldError("reg-email", "Địa chỉ Email không đúng định dạng.")
			isValid = false
		} else {
			setFieldError("reg-email", "")
		}

		// 4. Validate Mật khẩu
		if (!password) {
			setFieldError("reg-password", "Vui lòng nhập mật khẩu.")
			isValid = false
		} else if (password.length < 6) {
			setFieldError("reg-password", "Mật khẩu phải có tối thiểu 6 ký tự.")
			isValid = false
		} else {
			setFieldError("reg-password", "")
		}

		// 5. Validate Điều khoản
		if (!termsChecked) {
			setFieldError("reg-terms", "Bạn cần đồng ý với điều khoản Beta Cinemas.")
			isValid = false
		} else {
			setFieldError("reg-terms", "")
		}

		if (!isValid) return

		// Register to json-server-auth / storage
		const regResult = await registerNewUser({
			name,
			phone: cleanPhone,
			email,
			password,
		})

		if (!regResult.success) {
			setFieldError("reg-email", regResult.message)
			showToast(regResult.message, "warning")
			return
		}

		try {
			updateHeaderAccountUI()
			updateDrawerAccountUI()
		} catch (err) {
			console.warn("UI update error on register:", err)
		} finally {
			closeAuthModal()
		}
		showToast(
			`🎉 Chúc mừng ${name} đã đăng ký tài khoản thành công và nhận ngay 50 điểm thưởng thành viên!`,
			"success",
			6000,
		)
	})

	document.getElementById("link-forgot-pwd")?.addEventListener("click", e => {
		e.preventDefault()
		showToast("Vui lòng kiểm tra email hoặc liên hệ hotline 1900 636807 để đặt lại mật khẩu.", "info", 5000)
	})
}

/* ==========================================================================
   UNIVERSAL YOUTUBE EMBED & TRAILER MODAL
   ========================================================================== */

/**
 * Chuyển đổi mọi định dạng link YouTube thành URL nhúng (embed) chuẩn
 * Hỗ trợ: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
 * @param {string} url - Link YouTube bất kỳ
 * @param {boolean} autoplay - Bật tự động phát (mặc định true)
 * @returns {string} URL iframe embed hợp lệ
 */
export function getYouTubeEmbedUrl(url, autoplay = true) {
	if (!url) return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=${autoplay ? 1 : 0}`
	let videoId = ""

	try {
		if (url.includes("youtu.be/")) {
			videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0] || ""
		} else if (url.includes("youtube.com/embed/")) {
			videoId = url.split("youtube.com/embed/")[1]?.split("?")[0]?.split("&")[0] || ""
		} else if (url.includes("youtube.com/shorts/")) {
			videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0]?.split("&")[0] || ""
		} else if (url.includes("youtube.com/v/")) {
			videoId = url.split("youtube.com/v/")[1]?.split("?")[0]?.split("&")[0] || ""
		} else if (url.includes("watch")) {
			const parsed = new URL(url)
			videoId = parsed.searchParams.get("v") || ""
		}
	} catch (e) {
		console.warn("[YouTube Embed] Không thể parse URL:", url, e)
	}

	if (videoId) {
		return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&rel=0`
	}

	// Fallback nếu url dạng khác
	let fallback = url
	if (fallback.includes("watch?v=")) {
		fallback = fallback.replace("watch?v=", "embed/")
	}
	if (autoplay && !fallback.includes("autoplay=1")) {
		fallback += (fallback.includes("?") ? "&" : "?") + "autoplay=1"
	}
	return fallback
}

export function openTrailerModal(trailerUrl, movieTitle = "Trailer") {
	let modalBackdrop = document.getElementById("trailer-modal-backdrop")
	if (!modalBackdrop) {
		modalBackdrop = document.createElement("div")
		modalBackdrop.id = "trailer-modal-backdrop"
		modalBackdrop.className = "modal-backdrop"
		modalBackdrop.innerHTML = `
			<div class="modal-content trailer-modal-content" role="dialog" aria-modal="true" aria-label="Xem Trailer">
				<button class="modal-close-btn" id="trailer-modal-close" aria-label="Đóng">&#x2715;</button>
				<div class="trailer-modal-header" style="padding: 14px 20px; background: #12151e; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 8px;">
					<span style="color: #e50914; font-size: 18px;">🎬</span>
					<h3 class="trailer-modal-title" id="trailer-modal-title" style="margin: 0; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 50px);">Trailer</h3>
				</div>
				<div class="trailer-video-wrapper">
					<iframe id="trailer-modal-iframe" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
				</div>
			</div>
		`
		document.body.appendChild(modalBackdrop)

		modalBackdrop.addEventListener("click", e => {
			if (e.target === modalBackdrop) closeTrailerModal()
		})
		document.getElementById("trailer-modal-close")?.addEventListener("click", closeTrailerModal)
		document.addEventListener("keydown", e => {
			if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
				closeTrailerModal()
			}
		})
	}

	const titleEl = document.getElementById("trailer-modal-title")
	if (titleEl) titleEl.textContent = `Trailer: ${movieTitle}`

	const iframe = document.getElementById("trailer-modal-iframe")
	const embedUrl = getYouTubeEmbedUrl(trailerUrl, true)

	iframe.src = embedUrl
	iframe.title = `Trailer: ${movieTitle}`
	modalBackdrop.classList.add("active")
	document.body.style.overflow = "hidden"
}

export function closeTrailerModal() {
	const modalBackdrop = document.getElementById("trailer-modal-backdrop")
	if (!modalBackdrop) return
	const iframe = document.getElementById("trailer-modal-iframe")
	if (iframe) iframe.src = ""
	modalBackdrop.classList.remove("active")
	document.body.style.overflow = ""
}

/* ==========================================================================
   MEGA MENU & MOBILE DRAWER SETUP
   ========================================================================== */
function initMegaMenuAndMobileDrawer() {
	// 1. Movies Mega Menu on Desktop
	const navMovies = document.getElementById("nav-movies")
	if (navMovies && !navMovies.parentElement.classList.contains("nav-item-has-mega")) {
		navMovies.parentElement.classList.add("nav-item-has-mega")

		const megaEl = document.createElement("div")
		megaEl.className = "mega-menu-container mega-menu-movies"
		megaEl.innerHTML = `
			<div class="mega-cats-list">
				<a href="/movies.html?tab=nowshowing" class="mega-cat-link">
					<span>🎬 Phim Đang Chiếu</span> <span>›</span>
				</a>
				<a href="/movies.html?tab=upcoming" class="mega-cat-link">
					<span>📅 Phim Sắp Chiếu</span> <span>›</span>
				</a>
				<a href="/movies.html?tab=special" class="mega-cat-link">
					<span>🌟 Suất Chiếu Đặc Biệt</span> <span>›</span>
				</a>
				<a href="/schedule.html" class="mega-cat-link" style="margin-top:auto; color:#89b4fa;">
					<span>🍿 Xem Lịch Chiếu</span> <span>›</span>
				</a>
			</div>
			<div class="mega-movies-grid">
				<a href="/movie-detail.html?id=utlan2" class="mm-card" title="Út Lan 2">
					<div class="mm-thumb">
						<img src="/poster/poster_utlan2.jpg" alt="Út Lan 2" />
						<span class="mm-badge">T18</span>
					</div>
					<span class="mm-title">Út Lan 2</span>
				</a>
				<a href="/movie-detail.html?id=bongma" class="mm-card" title="Bóng Ma Nhà Hát">
					<div class="mm-thumb">
						<img src="/poster/poster_bongma.jpg" alt="Bóng Ma Nhà Hát" />
						<span class="mm-badge">T18</span>
					</div>
					<span class="mm-title">Bóng Ma Nhà Hát</span>
				</a>
				<a href="/movie-detail.html?id=sp1" class="mm-card" title="Avengers: Hồi Kết IMAX">
					<div class="mm-thumb">
						<img src="/poster/poster_avengers.jpg" alt="Avengers: Hồi Kết IMAX" />
						<span class="mm-badge" style="background:#89b4fa; color:#11111b;">IMAX</span>
					</div>
					<span class="mm-title">Avengers: Hồi Kết</span>
				</a>
			</div>
		`
		navMovies.parentElement.appendChild(megaEl)
	}

	// 2. Cinemas Mega Menu on Desktop
	const navCinemas = document.getElementById("nav-cinemas")
	if (navCinemas) {
		navCinemas.href = "/cinemas.html"
		if (!navCinemas.parentElement.classList.contains("nav-item-has-mega")) {
			navCinemas.parentElement.classList.add("nav-item-has-mega")

			const megaCinemas = document.createElement("div")
			megaCinemas.className = "mega-menu-container mega-menu-cinemas"
			megaCinemas.innerHTML = `
				<div class="mega-cinema-region">
					<div class="region-heading">Khu Vực Hà Nội</div>
					<a href="/schedule.html?cinema=beta-xuanthuy" class="cinema-quick-link">Beta Cinemas Xuân Thủy</a>
					<a href="/schedule.html?cinema=beta-tayson" class="cinema-quick-link">Beta Cinemas Tây Sơn</a>
					<a href="/schedule.html?cinema=beta-vinhyen" class="cinema-quick-link">Beta Cinemas Vĩnh Yên</a>
				</div>
				<div class="mega-cinema-region">
					<div class="region-heading">TP. Hồ Chí Minh</div>
					<a href="/schedule.html?cinema=beta-nowzone" class="cinema-quick-link">Beta Cinemas Nowzone (Q1)</a>
					<a href="/schedule.html?cinema=beta-ungvankhiem" class="cinema-quick-link">Beta Cinemas Ung Văn Khiêm</a>
				</div>
				<div class="mega-cinema-region">
					<div class="region-heading">Miền Bắc & Miền Trung</div>
					<a href="/schedule.html?cinema=beta-thainguyen" class="cinema-quick-link">Beta Cinemas Thái Nguyên</a>
					<a href="/schedule.html?cinema=beta-laocai" class="cinema-quick-link">Beta Cinemas Lào Cai</a>
					<a href="/schedule.html?cinema=beta-thanhhoa" class="cinema-quick-link">Beta Cinemas Thanh Hóa</a>
				</div>
				<div class="mega-cinema-footer">
					<a href="/cinemas.html" class="btn-all-cinemas">Khám phá toàn bộ 10 cụm rạp Beta Cinemas & Tiện ích →</a>
				</div>
			`
			navCinemas.parentElement.appendChild(megaCinemas)
		}
	}

	// 3. Mobile Hamburger & Drawer
	let toggleBtn = document.querySelector(".mobile-menu-toggle")
	const headerNav = document.querySelector(".header-navigator .container")
	if (!toggleBtn && headerNav) {
		toggleBtn = document.createElement("button")
		toggleBtn.className = "mobile-menu-toggle"
		toggleBtn.setAttribute("aria-label", "Mở menu điều hướng")
		toggleBtn.innerHTML = `<span></span><span></span><span></span>`
		headerNav.appendChild(toggleBtn)
	}

	let drawerBackdrop = document.querySelector(".mobile-drawer-backdrop")
	let drawerEl = document.querySelector(".mobile-nav-drawer")

	if (!drawerEl) {
		drawerBackdrop = document.createElement("div")
		drawerBackdrop.className = "mobile-drawer-backdrop"

		drawerEl = document.createElement("aside")
		drawerEl.className = "mobile-nav-drawer"
		drawerEl.innerHTML = `
			<div class="drawer-header">
				<img src="/logo.webp" alt="Beta Cinemas" />
				<button class="drawer-close-btn" aria-label="Đóng menu">&times;</button>
			</div>
			<div class="drawer-account-box" id="drawer-account-box">
				<!-- Injected by updateDrawerAccountUI -->
			</div>
			<nav class="drawer-links-list">
				<a href="/schedule.html">Lịch Chiếu Theo Rạp <span>›</span></a>
				<a href="/movies.html">Danh Sách Phim <span>›</span></a>
				<a href="/pricing.html">Bảng Giá Vé <span>›</span></a>
				<a href="/news.html">Tin Mới & Ưu Đãi <span>›</span></a>
				<a href="/profile.html">Tài Khoản Thành Viên <span>›</span></a>
			</nav>
			<div class="drawer-footer">
				<div class="d-hotline">Hotline: 1900 636807</div>
				<div>Rạp chiếu phim cho mọi nhà</div>
			</div>
		`
		document.body.appendChild(drawerBackdrop)
		document.body.appendChild(drawerEl)

		const closeDrawer = () => {
			drawerBackdrop?.classList.remove("open")
			drawerEl?.classList.remove("open")
			toggleBtn?.classList.remove("open")
			document.body.style.overflow = ""
		}
		const openDrawer = () => {
			drawerBackdrop?.classList.add("open")
			drawerEl?.classList.add("open")
			toggleBtn?.classList.add("open")
			document.body.style.overflow = "hidden"
			updateDrawerAccountUI()
		}

		toggleBtn?.addEventListener("click", () => {
			drawerEl?.classList.contains("open") ? closeDrawer() : openDrawer()
		})
		drawerBackdrop?.addEventListener("click", closeDrawer)
		drawerEl.querySelector(".drawer-close-btn")?.addEventListener("click", closeDrawer)
	}
}

function updateDrawerAccountUI() {
	const box = document.getElementById("drawer-account-box")
	if (!box) return
	const user = getCurrentUser()
	const isAdmin = isUserAdmin(user)
	if (user) {
		box.innerHTML = `
			<div class="drawer-user-info">
				<div class="d-avatar">${user.avatarText || user.name.charAt(0)}</div>
				<div class="d-details">
					<strong>${user.name}</strong>
					<span>⭐ ${user.rank || "Beta VIP"} (${user.points || 0} điểm)</span>
				</div>
			</div>
			<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
				<div style="display: flex; gap: 8px;">
					<a href="/profile.html" style="flex:1; background:#89b4fa; color:#11111b; text-align:center; padding:8px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none;">Trang cá nhân</a>
					<button type="button" id="btn-drawer-logout" style="background:rgba(243,139,168,0.2); border:1px solid rgba(243,139,168,0.4); color:#f38ba8; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">Đăng xuất</button>
				</div>
				${isAdmin ? `
				<a href="/admin.html" style="background:#fab387; color:#11111b; text-align:center; padding:8px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none;">⚙️ Trang Quản Trị (Admin)</a>
				` : ""}
			</div>
		`
		document.getElementById("btn-drawer-logout")?.addEventListener("click", () => {
			logoutUserAndNotify()
		})
	} else {
		box.innerHTML = `
			<button type="button" class="btn-drawer-auth" id="btn-drawer-login-trigger">
				Đăng nhập / Đăng ký thành viên
			</button>
		`
		document.getElementById("btn-drawer-login-trigger")?.addEventListener("click", () => {
			document.querySelector(".mobile-drawer-backdrop")?.classList.remove("open")
			document.querySelector(".mobile-nav-drawer")?.classList.remove("open")
			document.querySelector(".mobile-menu-toggle")?.classList.remove("open")
			document.body.style.overflow = ""
			openAuthModal("login")
		})
	}
}

/* ==========================================================================
   RENDER HEADER CINEMA SELECTOR & SETUP DROPDOWN
   ========================================================================== */
export async function setupHeaderAndFooter() {
	try {
		// Khởi tạo dữ liệu mẫu vào LocalStorage khi chạy lần đầu
		await initializeStorage()

		// Đọc dữ liệu từ LocalStorage thay vì fetch trực tiếp
		const cinemas = getCinemas()
		const footerCinemas = getFooterData()

		// Cinema Dropdown
		const ul = document.getElementById("cinema-dropdown-ul")
		if (ul && Array.isArray(cinemas)) {
			ul.innerHTML = cinemas
				.map(
					item => `
				<li class="cinema-dropdown-item ${item.active ? "active" : ""}" data-city="${item.city}" data-name="${item.name}" role="option" tabindex="0">
					${item.city} <span class="ci-arrow">›</span>
				</li>
			`,
				)
				.join("")
		}

		// Footer Cinema Cluster
		const footerUl = document.getElementById("cinema-cluster-ul")
		if (footerUl && Array.isArray(footerCinemas)) {
			footerUl.innerHTML = footerCinemas
				.map(
					fc => `
				<li>
					<a href="/schedule.html?cinema=${fc.id || ""}" id="${fc.id}">${fc.name} - Hotline ${fc.hotline}</a>
				</li>
			`,
				)
				.join("")
		}

		initCinemaDropdownEvents()
		updateHeaderAccountUI()
		initMegaMenuAndMobileDrawer()

		// Wire up pricing, news, member & cinemas links in nav
		const navPricing = document.getElementById("nav-pricing")
		const navNews = document.getElementById("nav-news")
		const navMember = document.getElementById("nav-member")
		const navCinemas = document.getElementById("nav-cinemas")
		if (navPricing) navPricing.href = "/pricing.html"
		if (navNews) navNews.href = "/news.html"
		if (navMember) navMember.href = "/member.html"
		if (navCinemas) navCinemas.href = "/cinemas.html"
	} catch (err) {
		console.warn("Could not load header/footer data:", err)
	}
}

function initCinemaDropdownEvents() {
	const wrap = document.getElementById("cinema-selector-wrap")
	const btn = document.getElementById("cinema-selector-btn")
	const dd = document.getElementById("cinema-dropdown")
	const lbl = document.getElementById("cinema-selector-label")

	if (!wrap || !btn || !dd || !lbl) return

	const openDD = () => {
		dd.classList.add("open")
		btn.setAttribute("aria-expanded", "true")
	}
	const closeDD = () => {
		dd.classList.remove("open")
		btn.setAttribute("aria-expanded", "false")
	}

	btn.addEventListener("click", e => {
		e.stopPropagation()
		dd.classList.contains("open") ? closeDD() : openDD()
	})

	dd.querySelectorAll(".cinema-dropdown-item").forEach(item => {
		item.addEventListener("click", function () {
			lbl.textContent = this.dataset.name || "Beta " + this.dataset.city
			dd.querySelectorAll(".cinema-dropdown-item").forEach(el => el.classList.remove("active"))
			this.classList.add("active")
			closeDD()
			window.dispatchEvent(
				new CustomEvent("cinemaChanged", { detail: { city: this.dataset.city, name: this.dataset.name } }),
			)
		})
	})

	document.addEventListener("click", e => {
		if (!wrap.contains(e.target)) closeDD()
	})
	document.addEventListener("keydown", e => {
		if (e.key === "Escape") closeDD()
	})
}
