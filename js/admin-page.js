/**
 * Beta Cinemas - Admin Dashboard & Management Portal Logic
 * Quản lý Phim, Lịch & Suất Chiếu, Combo Bắp Nước, Đơn Vé trong LocalStorage
 */
import {
	initializeStorage,
	getMoviesData,
	getCinemas,
	getShowtimes,
	getConcessions,
	getBookingHistory,
	getCinemaById,
	addCinemaScreen,
	updateCinemaScreen,
	deleteCinemaScreen,
	getScreenSeatLayout,
	saveScreenSeatLayout,
	updateScreenSeatStatus,
	toggleRowSeatStatus,
	updateSeatAttributes,
	addMovie,
	updateMovie,
	deleteMovie,
	addShowtimeSlot,
	updateShowtimeSlot,
	deleteShowtimeSlot,
	deleteMovieSchedule,
	addConcessionItem,
	updateConcessionItem,
	deleteConcessionItem,
	cancelBookingTicket,
	updateBookingStatus,
	confirmBookingOrder,
	confirmTicketPayment,
	resetStorageSection,
	STORAGE_KEYS,
	storageSet,
	getCurrentUser,
	saveUserSession,
	logoutUser,
	isUserAdmin,
	isCurrentAdmin,
	authenticateUser,
} from "./storage.js"
import { formatCurrency, formatDateVN, showToast, translateDom, getSavedLang, bindLangToggleEvents, bindThemeToggleEvents } from "./common.js"
import { generateQRCodeSVG } from "./qrcode.js"

document.addEventListener("DOMContentLoaded", async () => {
	// Khởi tạo LocalStorage nếu chưa có
	await initializeStorage()

	/* ==========================================================================
	   0. ADMIN ACCESS CONTROL & AUTH GATE
	   ========================================================================== */
	const authGate = document.getElementById("admin-auth-gate")
	const adminLayout = document.getElementById("admin-layout")
	const roleAlert = document.getElementById("auth-gate-role-alert")
	const roleAlertText = document.getElementById("auth-gate-role-alert-text")
	const loginForm = document.getElementById("form-admin-login")
	const accountInput = document.getElementById("admin-login-account")
	const passwordInput = document.getElementById("admin-login-password")
	const loginError = document.getElementById("admin-login-error")
	const btnTogglePwd = document.getElementById("btn-toggle-admin-pwd")

	let isDashboardReady = false

	function checkAdminAccess() {
		const currentUser = getCurrentUser()
		const isAdmin = isUserAdmin(currentUser)
		if (isAdmin) {
			if (authGate) authGate.style.display = "none"
			if (adminLayout) adminLayout.style.display = "flex"

			const userObj = currentUser || { name: "Ban Quản Trị Hệ Thống", rank: "Super Admin Online", avatarText: "AD" }
			const nameEl = document.getElementById("sidebar-admin-name")
			const roleEl = document.getElementById("sidebar-admin-role")
			const avatarEl = document.getElementById("sidebar-admin-avatar")
			if (nameEl) nameEl.textContent = userObj.name || "Ban Quản Trị Hệ Thống"
			if (roleEl) roleEl.textContent = userObj.rank || "Super Admin Online"
			if (avatarEl) avatarEl.textContent = userObj.avatarText || "AD"

			if (!isDashboardReady) {
				initDashboard()
			}
			bindLangToggleEvents()
			bindThemeToggleEvents()
			translateDom(getSavedLang())
			return true
		} else {
			if (adminLayout) adminLayout.style.display = "none"
			if (authGate) authGate.style.display = "flex"

			if (currentUser) {
				if (roleAlert && roleAlertText) {
					roleAlert.style.display = "flex"
					roleAlertText.innerHTML = `Bạn đang đăng nhập bằng tài khoản <strong>${currentUser.name || currentUser.email}</strong> (không có quyền Quản trị viên). Vui lòng đăng nhập tài khoản <strong>admin</strong>.`
				}
			} else {
				if (roleAlert) roleAlert.style.display = "none"
			}
			return false
		}
	}

	btnTogglePwd?.addEventListener("click", () => {
		if (!passwordInput) return
		const isPwd = passwordInput.type === "password"
		passwordInput.type = isPwd ? "text" : "password"
		btnTogglePwd.textContent = isPwd ? "🙈" : "👁️"
	})

	loginForm?.addEventListener("submit", async e => {
		e.preventDefault()
		const account = (accountInput?.value || "").trim()
		const password = passwordInput?.value || ""

		if (loginError) loginError.style.display = "none"

		if (!account || !password) {
			if (loginError) {
				loginError.textContent = "Vui lòng nhập tài khoản và mật khẩu quản trị!"
				loginError.style.display = "block"
			}
			return
		}

		const res = await authenticateUser(account, password)
		if (!res.success) {
			if (loginError) {
				loginError.textContent = res.message || "Tài khoản hoặc mật khẩu không chính xác! Yêu cầu tài khoản: admin, mật khẩu: 12345678"
				loginError.style.display = "block"
			}
			return
		}

		if (!isUserAdmin(res.user)) {
			if (loginError) {
				loginError.textContent = "Tài khoản này không có quyền Quản trị viên! Vui lòng đăng nhập tài khoản admin."
				loginError.style.display = "block"
			}
			return
		}

		showToast("Đăng nhập Quản trị viên thành công!", "success")
		if (passwordInput) passwordInput.value = ""
		if (loginError) loginError.style.display = "none"

		checkAdminAccess()
	})

	function handleAdminLogout() {
		logoutUser()
		showToast("Đã đăng xuất khỏi tài khoản Quản trị viên!", "info")
		checkAdminAccess()
	}

	document.getElementById("btn-admin-logout")?.addEventListener("click", handleAdminLogout)
	document.getElementById("btn-sidebar-logout")?.addEventListener("click", handleAdminLogout)

	function initDashboard() {
		isDashboardReady = true

		/* ==========================================================================
		   1. NAVIGATION & TAB SWITCHING
		   ========================================================================== */
		const navBtns = document.querySelectorAll(".admin-nav-item")
		const panels = {
			overview: document.getElementById("tab-panel-overview"),
			movies: document.getElementById("tab-panel-movies"),
			showtimes: document.getElementById("tab-panel-showtimes"),
			concessions: document.getElementById("tab-panel-concessions"),
			bookings: document.getElementById("tab-panel-bookings"),
			screens: document.getElementById("tab-panel-screens"),
			seats: document.getElementById("tab-panel-seats"),
		}

		const topbarTitle = document.getElementById("topbar-title")
		const topbarSub = document.getElementById("topbar-sub")

		const tabTitles = {
			overview: { title: "Tổng Quan Dashboard", sub: "Thống kê hoạt động toàn hệ thống Beta Cinemas" },
			movies: { title: "Quản Lý Danh Sách Phim", sub: "Thêm mới, cập nhật thông tin và xóa phim trong LocalStorage" },
			showtimes: { title: "Quản Lý Lịch & Suất Chiếu", sub: "Cấu hình phòng chiếu, khung giờ và giá vé theo từng cụm rạp" },
			concessions: { title: "Quản Lý Combo Bắp Nước", sub: "Cập nhật menu bắp nước, định giá bán và khuyến mãi" },
			bookings: { title: "Quản Lý Đơn Đặt Vé", sub: "Danh sách vé điện tử đã đặt của khách hàng trên hệ thống" },
			screens: { title: "Quản Lý Phòng Chiếu Rạp", sub: "Quản lý hệ thống phòng chiếu, định dạng phim và sức chứa các rạp" },
			seats: { title: "Quản Lý Sơ Đồ Ghế Phòng Chiếu", sub: "Cấu hình trực quan sơ đồ chỗ ngồi, hạng ghế và bảo trì tạm khóa ghế" },
		}

		function switchTab(tabId) {
			navBtns.forEach(btn => {
				if (btn.dataset.tab === tabId) {
					btn.classList.add("active")
				} else {
					btn.classList.remove("active")
				}
			})

			Object.entries(panels).forEach(([id, panel]) => {
				if (!panel) return
				if (id === tabId) {
					panel.classList.add("active")
				} else {
					panel.classList.remove("active")
				}
			})

			if (tabTitles[tabId]) {
				if (topbarTitle) topbarTitle.textContent = tabTitles[tabId].title
				if (topbarSub) topbarSub.textContent = tabTitles[tabId].sub
			}

			// Close sidebar on mobile
			document.getElementById("admin-sidebar")?.classList.remove("active")

			// Refresh data corresponding to tab
			if (tabId === "overview") renderOverviewDashboard()
			if (tabId === "movies") renderMoviesTable()
			if (tabId === "showtimes") renderShowtimesSection()
			if (tabId === "concessions") renderConcessionsSection()
			if (tabId === "bookings") renderAdminBookingsTable()
			if (tabId === "screens") renderScreensSection()
			if (tabId === "seats") renderSeatsSection()

			translateDom(getSavedLang())
		}

		navBtns.forEach(btn => {
			btn.addEventListener("click", () => switchTab(btn.dataset.tab))
		})

		// Check URL param ?tab=
		const urlParams = new URLSearchParams(window.location.search)
		const initialTab = urlParams.get("tab") || "overview"
		switchTab(initialTab)

		// Mobile Sidebar Toggle
		const toggleSidebarBtn = document.getElementById("btn-toggle-sidebar")
		const sidebar = document.getElementById("admin-sidebar")
		toggleSidebarBtn?.addEventListener("click", () => {
			sidebar?.classList.toggle("active")
		})

		// Dashboard Quick Nav Buttons
		document.getElementById("btn-goto-all-movies")?.addEventListener("click", () => switchTab("movies"))
		document.getElementById("btn-goto-all-bookings")?.addEventListener("click", () => switchTab("bookings"))
		document.getElementById("btn-view-booking-history")?.addEventListener("click", () => switchTab("bookings"))
		document.getElementById("btn-quick-add-movie")?.addEventListener("click", () => {
			switchTab("movies")
			openMovieModal()
		})
		document.getElementById("btn-quick-add-showtime")?.addEventListener("click", () => {
			switchTab("showtimes")
			openShowtimeModal()
		})
		document.getElementById("btn-quick-add-concession")?.addEventListener("click", () => {
			switchTab("concessions")
			openConcessionModal()
		})

		// Global Reset Data
		document.getElementById("btn-global-reset")?.addEventListener("click", async () => {
			if (confirm("⚠️ CẢNH BÁO: Bạn có muốn khôi phục toàn bộ dữ liệu mẫu (Phim, Suất Chiếu, Bắp Nước) về ban đầu từ JSON không?")) {
				await initializeStorage(true)
				showToast("Đã khôi phục toàn bộ cơ sở dữ liệu mẫu thành công!", "success")
				updateAllBadges()
				renderOverviewDashboard()
			}
		})

		/* ==========================================================================
		   2. TAB 1: OVERVIEW DASHBOARD LOGIC
		   ========================================================================== */
		function renderOverviewDashboard() {
			updateAllBadges()

			const moviesData = getMoviesData()
			const showtimesData = getShowtimes()
			const concessionsData = getConcessions()
			const bookings = getBookingHistory()

			// 1. KPI Movies
			let totalMovies = 0
			let nowShowingCount = 0
			if (moviesData?.items) {
				const ns = moviesData.items.nowshowing || []
				const uc = moviesData.items.upcoming || []
				const sp = moviesData.items.special || []
				totalMovies = ns.length + uc.length + sp.length
				nowShowingCount = ns.length
			}
			const kpiMovies = document.getElementById("kpi-movies-total")
			const kpiNs = document.getElementById("kpi-movies-nowshowing")
			if (kpiMovies) kpiMovies.textContent = totalMovies
			if (kpiNs) kpiNs.textContent = `${nowShowingCount} đang chiếu`

			// 2. KPI Showtimes
			let totalSlots = 0
			if (Array.isArray(showtimesData)) {
				showtimesData.forEach(entry => {
					entry.schedules?.forEach(sc => {
						totalSlots += sc.slots?.length || 0
					})
				})
			}
			const kpiShowtimes = document.getElementById("kpi-showtimes-total")
			if (kpiShowtimes) kpiShowtimes.textContent = totalSlots

			// 3. KPI Concessions
			const concessionsCount = concessionsData?.items?.length || 0
			const kpiConcessions = document.getElementById("kpi-concessions-total")
			if (kpiConcessions) kpiConcessions.textContent = concessionsCount

			// 4. KPI Revenue & Tickets Sold
			let totalRevenue = 0
			let paidOrdersCount = 0
			let totalSeatsSold = 0
			const movieSalesMap = {} // movieId -> { title, revenue, seatsCount, poster }

			bookings.forEach(b => {
				const isPaid = b.status === "paid" || b.status === "done" || b.paymentStatus === "paid"
				const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
				if (isPaid && !isCancelled) {
					const ticketTotal = Number(b.total) || 0
					totalRevenue += ticketTotal
					paidOrdersCount++

					// Đếm số ghế thực tế
					const seatCount = b.seats ? b.seats.split(",").map(s => s.trim()).filter(Boolean).length : 1
					totalSeatsSold += seatCount

					// Thống kê doanh số theo từng phim
					const mKey = b.movieTitle || b.movieId || "Khác"
					if (!movieSalesMap[mKey]) {
						movieSalesMap[mKey] = {
							title: b.movieTitle || "Phim",
							revenue: 0,
							seatsCount: 0,
							poster: b.moviePoster || "/poster/poster_utlan2.jpg",
						}
					}
					movieSalesMap[mKey].revenue += ticketTotal
					movieSalesMap[mKey].seatsCount += seatCount
				}
			})

			const kpiRev = document.getElementById("kpi-revenue-total")
			const kpiPaid = document.getElementById("kpi-paid-count")
			const kpiTickets = document.getElementById("kpi-tickets-count")
			const kpiTotalOrders = document.getElementById("kpi-total-orders")
			const kpiScreens = document.getElementById("kpi-screens-total")
			const kpiCinemas = document.getElementById("kpi-cinemas-count")

			if (kpiRev) kpiRev.textContent = formatCurrency(totalRevenue)
			if (kpiPaid) kpiPaid.textContent = `${paidOrdersCount} đơn hợp lệ`
			if (kpiTickets) kpiTickets.textContent = `${totalSeatsSold} vé`
			if (kpiTotalOrders) kpiTotalOrders.textContent = `${paidOrdersCount} đơn hàng`

			const cinemasList = getCinemas()
			let totalScreensCount = 0
			cinemasList.forEach(c => {
				totalScreensCount += c.screens?.length || 0
			})
			if (kpiScreens) kpiScreens.textContent = totalScreensCount
			if (kpiCinemas) kpiCinemas.textContent = `${cinemasList.length} cụm rạp`

			// Render Progress bars phân bổ doanh thu theo phim
			const revenueBarsContainer = document.getElementById("stats-movies-revenue-bars")
			if (revenueBarsContainer) {
				const moviesArr = Object.values(movieSalesMap).sort((a, b) => b.revenue - a.revenue)
				if (moviesArr.length === 0) {
					revenueBarsContainer.innerHTML = `<div style="color:#a6adc8; font-size:13px; text-align:center; padding: 16px;">Chưa có dữ liệu giao dịch vé nào</div>`
				} else {
					revenueBarsContainer.innerHTML = moviesArr
						.map(m => {
							const percent = totalRevenue > 0 ? Math.round((m.revenue / totalRevenue) * 100) : 0
							return `
							<div class="movie-rev-bar-item" style="display:flex; flex-direction:column; gap:6px;">
								<div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; flex-wrap: wrap; gap: 8px;">
									<div style="display:flex; align-items:center; gap:8px;">
										<img src="${m.poster}" alt="${m.title}" style="width:24px; height:32px; border-radius:4px; object-fit:cover;" onerror="this.src='/poster/poster_utlan2.jpg'" />
										<strong style="color:#cdd6f4;">${m.title}</strong>
										<span style="color:#a6adc8; font-size:12px;">(${m.seatsCount} vé đã bán)</span>
									</div>
									<div style="display:flex; align-items:center; gap:12px;">
										<span style="color:#fab387; font-weight:800;">${formatCurrency(m.revenue)}</span>
										<span style="color:#89b4fa; font-weight:700; min-width:40px; text-align:right;">${percent}%</span>
									</div>
								</div>
								<div style="background:#181825; height:8px; border-radius:4px; overflow:hidden;">
									<div style="width:${Math.max(4, percent)}%; height:100%; background:linear-gradient(90deg, #89b4fa, #b4befe); border-radius:4px; transition:width 0.4s;"></div>
								</div>
							</div>
						`
						})
						.join("")
				}
			}

			// 5. Recent 5 Bookings
			const recentTbody = document.getElementById("dashboard-recent-bookings-tbody")
			if (recentTbody) {
				const recent5 = bookings.slice(0, 5)
				if (recent5.length === 0) {
					recentTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #a6adc8; padding: 24px;">Chưa có đơn đặt vé nào</td></tr>`
				} else {
					recentTbody.innerHTML = recent5
						.map(b => {
							const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
							const isDone = b.status === "done"
							const isPaid = !isCancelled && (b.paymentStatus === "paid" || b.status === "paid")
							const isConfirmed = !isCancelled && !isPaid && !isDone && (b.bookingStatus === "confirmed" || b.status === "confirmed")
							const isPending = !isCancelled && !isPaid && !isDone && !isConfirmed

							let badgeClass = "badge-age"
							let badgeText = "🔴 Đã hủy"
							if (isDone) {
								badgeClass = "badge-upcoming"
								badgeText = "🔵 Đã soát vé"
							} else if (isPaid) {
								badgeClass = "badge-nowshowing"
								badgeText = "🟢 Đã nhận tiền"
							} else if (isConfirmed) {
								badgeClass = "badge-age"
								badgeText = "🟡 Chờ thanh toán"
							} else if (isPending) {
								badgeClass = "badge-age"
								badgeText = "⏳ Chờ xác nhận"
							}

							return `
							<tr>
								<td><strong style="color: #89b4fa; font-family: monospace;">${b.id}</strong></td>
								<td>
									<div class="cell-title">${b.customerName || b.userName || "Khách vãng lai"}</div>
									<div class="cell-sub">${b.customerPhone || b.userPhone || b.customerEmail || b.userEmail || "N/A"}</div>
								</td>
								<td>
									<div class="cell-title">${b.movieTitle}</div>
									<div class="cell-sub">${b.cinemaName} • ${b.time}</div>
								</td>
								<td style="color: #fab387; font-weight: 700;">${formatCurrency(b.total)}</td>
								<td><span class="admin-badge ${badgeClass}">${badgeText}</span></td>
							</tr>
						`
						})
						.join("")
				}
			}

			// 6. Top Movies
			const topMoviesContainer = document.getElementById("dashboard-top-movies-list")
			if (topMoviesContainer && moviesData?.items?.nowshowing) {
				const top4 = moviesData.items.nowshowing.slice(0, 4)
				topMoviesContainer.innerHTML = top4
					.map(
						m => `
					<div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #313244; border-radius: 8px; border: 1px solid rgba(88, 91, 112, 0.4);">
						<img src="${m.poster}" alt="${m.title}" style="width: 40px; height: 56px; border-radius: 4px; object-fit: cover;" onerror="this.src='/poster/poster_utlan2.jpg'" />
						<div style="flex: 1; min-width: 0;">
							<div style="font-weight: 700; color: #cdd6f4; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
							<div style="font-size: 12px; color: #a6adc8;">${m.genre} • ${m.duration}</div>
						</div>
						<div style="color: #fab387; font-weight: 800; font-size: 13px;">★ ${m.ratingScore || 9.0}</div>
					</div>
				`
					)
					.join("")
			}
		}

		function updateAllBadges() {
			const moviesData = getMoviesData()
			const showtimesData = getShowtimes()
			const concessionsData = getConcessions()
			const bookings = getBookingHistory()

			let totalMovies = 0
			if (moviesData?.items) {
				totalMovies =
					(moviesData.items.nowshowing?.length || 0) +
					(moviesData.items.upcoming?.length || 0) +
					(moviesData.items.special?.length || 0)
			}
			let totalSlots = 0
			if (Array.isArray(showtimesData)) {
				showtimesData.forEach(entry => {
					entry.schedules?.forEach(sc => {
						totalSlots += sc.slots?.length || 0
					})
				})
			}

			const badgeMv = document.getElementById("badge-movie-count")
			const badgeSt = document.getElementById("badge-showtimes-count")
			const badgeCc = document.getElementById("badge-concessions-count")
			const badgeBk = document.getElementById("badge-bookings-count")
			const badgeSc = document.getElementById("badge-screens-count")
			const badgeSe = document.getElementById("badge-seats-count")

			const cinemas = getCinemas()
			let screensCount = 0
			cinemas.forEach(c => {
				screensCount += c.screens?.length || 0
			})

			if (badgeMv) badgeMv.textContent = totalMovies
			if (badgeSt) badgeSt.textContent = totalSlots
			if (badgeCc) badgeCc.textContent = concessionsData?.items?.length || 0
			if (badgeBk) badgeBk.textContent = bookings.length
			if (badgeSc) badgeSc.textContent = screensCount
			if (badgeSe) badgeSe.textContent = screensCount
		}

		/* ==========================================================================
		   3. TAB 2: QUẢN LÝ PHIM (REQUIREMENT 4)
		   Thêm, Sửa, Xóa vào LocalStorage
		   ========================================================================== */
		let currentMovieTabFilter = "all"
		let currentMovieSearch = ""

		const movieTableTbody = document.getElementById("movies-table-tbody")
		const movieCountText = document.getElementById("movies-count-text")
		const filterMoviesTabSelect = document.getElementById("filter-movies-tab")
		const searchMoviesInput = document.getElementById("search-movies-input")

		filterMoviesTabSelect?.addEventListener("change", e => {
			currentMovieTabFilter = e.target.value
			renderMoviesTable()
		})

		searchMoviesInput?.addEventListener("input", e => {
			currentMovieSearch = e.target.value.trim().toLowerCase()
			renderMoviesTable()
		})

		// Button Reset Movies
		document.getElementById("btn-reset-movies-data")?.addEventListener("click", async () => {
			if (confirm("Khôi phục danh sách phim về dữ liệu gốc? Các phim đã thêm sẽ bị mất.")) {
				await resetStorageSection(STORAGE_KEYS.MOVIES)
				showToast("Đã khôi phục dữ liệu phim về mặc định!", "info")
				renderMoviesTable()
				updateAllBadges()
			}
		})

		function renderMoviesTable() {
			const data = getMoviesData()
			if (!data || !data.items || !movieTableTbody) return

			let allMovies = []
			const tabs = ["nowshowing", "upcoming", "special"]

			tabs.forEach(t => {
				const list = data.items[t] || []
				list.forEach(m => {
					allMovies.push({ ...m, _tab: t })
				})
			})

			// Filter Tab
			let filtered = allMovies
			if (currentMovieTabFilter !== "all") {
				filtered = filtered.filter(m => m._tab === currentMovieTabFilter)
			}

			// Filter Search
			if (currentMovieSearch) {
				filtered = filtered.filter(
					m =>
						(m.title && m.title.toLowerCase().includes(currentMovieSearch)) ||
						(m.originalTitle && m.originalTitle.toLowerCase().includes(currentMovieSearch)) ||
						(m.director && m.director.toLowerCase().includes(currentMovieSearch)) ||
						(m.genre && m.genre.toLowerCase().includes(currentMovieSearch))
				)
			}

			if (movieCountText) movieCountText.textContent = `Hiển thị ${filtered.length} / ${allMovies.length} phim`

			if (filtered.length === 0) {
				movieTableTbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #a6adc8; padding: 32px;">Không có phim nào phù hợp</td></tr>`
				return
			}

			movieTableTbody.innerHTML = filtered
				.map(m => {
					const tabBadgeMap = {
						nowshowing: { label: "Đang Chiếu", class: "badge-nowshowing" },
						upcoming: { label: "Sắp Chiếu", class: "badge-upcoming" },
						special: { label: "Suất Đặc Biệt", class: "badge-special" },
					}
					const tabInfo = tabBadgeMap[m._tab] || { label: m._tab, class: "badge-nowshowing" }

					return `
					<tr id="movie-row-${m.id}">
						<td>
							<img src="${m.poster}" alt="${m.title}" class="table-thumb" onerror="this.src='/poster/poster_utlan2.jpg'" />
						</td>
						<td>
							<div class="cell-title">${m.title}</div>
							<div class="cell-sub">${m.originalTitle || "N/A"}</div>
						</td>
						<td><span class="admin-badge ${tabInfo.class}">${tabInfo.label}</span></td>
						<td>${m.genre || "N/A"}</td>
						<td>${m.duration || "N/A"}</td>
						<td><span class="admin-badge badge-age">${m.badge || "T18"}</span></td>
						<td>${m.director || "Chưa rõ"}</td>
						<td style="color: #fab387; font-weight: 800;">★ ${m.ratingScore || 9.0}</td>
						<td style="text-align: center;">
							<div class="row-actions" style="justify-content: center; gap: 6px;">
								<button type="button" class="btn-action-icon btn-edit-movie" data-id="${m.id}" title="Chỉnh sửa phim">✏️</button>
								<button type="button" class="btn-action-icon btn-delete-movie" data-id="${m.id}" data-title="${m.title}" title="Xóa phim khỏi hệ thống" style="color: #f38ba8;">🗑️</button>
							</div>
						</td>
					</tr>
				`
				})
				.join("")

			// Attach Edit clicks
			movieTableTbody.querySelectorAll(".btn-edit-movie").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const target = allMovies.find(m => m.id === id)
					if (target) openMovieModal(target)
				})
			})

			// Attach Delete clicks
			movieTableTbody.querySelectorAll(".btn-delete-movie").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const title = btn.dataset.title
					if (confirm(`Bạn có chắc chắn muốn xóa phim "${title}" khỏi hệ thống không?`)) {
						deleteMovie(id)
						showToast(`Đã xóa phim "${title}" khỏi LocalStorage thành công!`, "info")
						renderMoviesTable()
						updateAllBadges()
					}
				})
			})
		}

		// Movie Modal Handlers
		const movieModal = document.getElementById("modal-movie")
		const movieModalClose = document.getElementById("modal-movie-close")
		const movieModalCancel = document.getElementById("btn-cancel-movie")
		const movieForm = document.getElementById("form-admin-movie")
		const moviePosterPreset = document.getElementById("movie-poster-preset")
		const moviePosterInput = document.getElementById("movie-poster")

		moviePosterPreset?.addEventListener("change", e => {
			if (e.target.value !== "custom") {
				if (moviePosterInput) moviePosterInput.value = e.target.value
			}
		})

		document.getElementById("btn-open-add-movie-modal")?.addEventListener("click", () => openMovieModal())
		movieModalClose?.addEventListener("click", closeMovieModal)
		movieModalCancel?.addEventListener("click", closeMovieModal)

		function openMovieModal(movieToEdit = null) {
			if (!movieModal) return
			const titleEl = document.getElementById("modal-movie-title")
			const idInput = document.getElementById("movie-id")
			const titleInput = document.getElementById("movie-title")
			const origTitleInput = document.getElementById("movie-orig-title")
			const tabSelect = document.getElementById("movie-tab")
			const genreInput = document.getElementById("movie-genre")
			const durationInput = document.getElementById("movie-duration")
			const badgeSelect = document.getElementById("movie-badge")
			const releaseInput = document.getElementById("movie-release-date")
			const directorInput = document.getElementById("movie-director")
			const ratingInput = document.getElementById("movie-rating")
			const formatSelect = document.getElementById("movie-format")
			const posterInput = document.getElementById("movie-poster")
			const synopsisInput = document.getElementById("movie-synopsis")

			if (movieToEdit) {
				if (titleEl) titleEl.textContent = `Chỉnh Sửa Phim: ${movieToEdit.title}`
				if (idInput) idInput.value = movieToEdit.id
				if (titleInput) titleInput.value = movieToEdit.title || ""
				if (origTitleInput) origTitleInput.value = movieToEdit.originalTitle || ""
				if (tabSelect) tabSelect.value = movieToEdit._tab || "nowshowing"
				if (genreInput) genreInput.value = movieToEdit.genre || ""
				if (durationInput) durationInput.value = movieToEdit.duration || ""
				if (badgeSelect) badgeSelect.value = movieToEdit.badge || "T18"
				if (releaseInput) releaseInput.value = movieToEdit.releaseDate || ""
				if (directorInput) directorInput.value = movieToEdit.director || ""
				if (ratingInput) ratingInput.value = movieToEdit.ratingScore || 9.0
				if (formatSelect) formatSelect.value = movieToEdit.format || "2D Digital"
				if (posterInput) posterInput.value = movieToEdit.poster || "/poster/poster_utlan2.jpg"
				if (synopsisInput) synopsisInput.value = movieToEdit.synopsis || ""
			} else {
				if (titleEl) titleEl.textContent = "Thêm Phim Mới Vào Hệ Thống"
				movieForm?.reset()
				if (idInput) idInput.value = ""
				if (posterInput) posterInput.value = "/poster/poster_utlan2.jpg"
				if (ratingInput) ratingInput.value = "9.0"
			}

			movieModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		function closeMovieModal() {
			movieModal?.classList.remove("active")
			document.body.style.overflow = ""
		}

		// Movie Form Submit (Add or Edit in LocalStorage)
		movieForm?.addEventListener("submit", e => {
			e.preventDefault()

			const id = document.getElementById("movie-id")?.value
			const title = document.getElementById("movie-title")?.value.trim()
			const originalTitle = document.getElementById("movie-orig-title")?.value.trim()
			const tab = document.getElementById("movie-tab")?.value || "nowshowing"
			const genre = document.getElementById("movie-genre")?.value.trim()
			const duration = document.getElementById("movie-duration")?.value.trim()
			const badge = document.getElementById("movie-badge")?.value
			const releaseDate = document.getElementById("movie-release-date")?.value.trim()
			const director = document.getElementById("movie-director")?.value.trim()
			const ratingScore = parseFloat(document.getElementById("movie-rating")?.value) || 9.0
			const format = document.getElementById("movie-format")?.value
			const poster = document.getElementById("movie-poster")?.value.trim()
			const synopsis = document.getElementById("movie-synopsis")?.value.trim()

			if (!title) {
				showToast("Vui lòng nhập tên phim!", "warning")
				return
			}

			const moviePayload = {
				title,
				originalTitle: originalTitle || title,
				genre,
				genreIds: [genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")],
				duration,
				badge,
				badgeClass: `mc-badge--${badge.toLowerCase()}`,
				releaseDate: releaseDate || "26.09.2026",
				director: director || "Chưa rõ",
				cast: ["Đang cập nhật"],
				ratingScore,
				format,
				poster: poster || "/poster/poster_utlan2.jpg",
				banner: poster || "/poster/poster_utlan2.jpg",
				synopsis: synopsis || `Phim ${title} - khởi chiếu tại Beta Cinemas.`,
				hot: true,
				buyText: "MUA VÉ",
			}

			if (id) {
				// Update
				updateMovie(id, moviePayload, tab)
				showToast(`✅ Đã cập nhật phim "${title}" vào LocalStorage thành công!`, "success")
			} else {
				// Add New
				moviePayload.id = "mv_" + Date.now().toString(36)
				addMovie(moviePayload, tab)
				showToast(`✅ Đã thêm phim mới "${title}" vào LocalStorage thành công!`, "success")
			}

			closeMovieModal()
			renderMoviesTable()
			updateAllBadges()
		})

		/* ==========================================================================
		   4. TAB 3: QUẢN LÝ LỊCH & SUẤT CHIẾU (REQUIREMENT 5)
		   Thêm, Sửa, Xóa suất chiếu vào LocalStorage
		   ========================================================================== */
		const cinemaSelect = document.getElementById("st-cinema-select")
		const dateFilter = document.getElementById("st-date-filter")
		const showtimesContainer = document.getElementById("showtimes-content-container")

		// Pre-fill cinemas dropdown
		const cinemasList = getCinemas()
		if (cinemaSelect) {
			cinemaSelect.innerHTML = cinemasList
				.map(c => `<option value="${c.id}">${c.name}</option>`)
				.join("")
		}
		if (dateFilter && !dateFilter.value) {
			const today = new Date()
			dateFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
		}

		cinemaSelect?.addEventListener("change", renderShowtimesSection)
		dateFilter?.addEventListener("change", renderShowtimesSection)

		// Reset Showtimes Data
		document.getElementById("btn-reset-showtimes-data")?.addEventListener("click", async () => {
			if (confirm("Khôi phục toàn bộ lịch chiếu về dữ liệu JSON mẫu ban đầu?")) {
				await resetStorageSection(STORAGE_KEYS.SHOWTIMES)
				showToast("Đã khôi phục dữ liệu suất chiếu gốc!", "info")
				renderShowtimesSection()
				updateAllBadges()
			}
		})

		function renderShowtimesSection() {
			if (!showtimesContainer) return
			const selectedCinema = cinemaSelect?.value || "beta-thainguyen"
			const allShowtimes = getShowtimes() || []
			const startDate = dateFilter?.value || ""
			const cinemaEntries = allShowtimes
				.filter(st => st.cinemaId === selectedCinema && st.schedules?.length && (!startDate || st.date >= startDate))
				.sort((a, b) => a.date.localeCompare(b.date))

			if (!cinemaEntries.length) {
				showtimesContainer.innerHTML = `
				<div style="text-align: center; padding: 48px 20px; background: #181825; border-radius: 12px; border: 1px dashed rgba(88, 91, 112, 0.4);">
					<div style="font-size: 40px; margin-bottom: 12px;">📅</div>
					<h3 style="color: #cdd6f4; font-size: 17px; margin-bottom: 6px;">Không có lịch chiếu từ ngày ${startDate ? formatDateVN(startDate) : "đã chọn"}</h3>
					<p style="color: #a6adc8; font-size: 13px; margin-bottom: 20px;">Chọn ngày trong quá khứ để tra lịch cũ, hoặc thêm suất chiếu mới.</p>
					<button type="button" class="btn-admin-primary" id="btn-empty-add-showtime">
						➕ Thêm Suất Chiếu Ngay
					</button>
				</div>
			`
				document.getElementById("btn-empty-add-showtime")?.addEventListener("click", openShowtimeModal)
				return
			}

			showtimesContainer.innerHTML = cinemaEntries.map(dayCinemaEntry => `
				<div class="showtime-day-group">
					<h3 class="showtime-day-heading">📅 ${formatDateVN(dayCinemaEntry.date)}</h3>
					${dayCinemaEntry.schedules.map(sc => {
					return `
					<div class="movie-showtime-block" id="schedule-block-${sc.movieId}-${dayCinemaEntry.date}">
						<div class="ms-head">
							<div class="ms-movie-title">
								<span>🎬</span>
								<span>${sc.movieTitle}</span>
								<span class="ms-format-tag">${sc.screenName || "Phòng 1"} • ${sc.format || "2D"}</span>
							</div>
							<div style="display: flex; gap: 8px;">
								<button type="button" class="btn-admin-secondary btn-add-slot-for-movie" data-date="${dayCinemaEntry.date}" data-movie-id="${sc.movieId}" data-movie-title="${sc.movieTitle}" data-screen="${sc.screenName}" data-format="${sc.format}" style="font-size: 12px; padding: 5px 10px;">
									➕ Thêm Giờ Chiếu
								</button>
								<button type="button" class="btn-admin-danger btn-del-movie-schedule" data-date="${dayCinemaEntry.date}" data-movie-id="${sc.movieId}" data-movie-title="${sc.movieTitle}" style="font-size: 12px; padding: 5px 10px; background: rgba(243, 139, 168, 0.15); color: #f38ba8; border: 1px solid rgba(243, 139, 168, 0.3); border-radius: 6px; cursor: pointer;" title="Xóa toàn bộ lịch chiếu phim này trong ngày">
									🗑️ Xóa Lịch Phim
								</button>
							</div>
						</div>
						<div class="slots-chips-grid">
							${(sc.slots || [])
							.map(
								s => `
								<div class="slot-chip">
									<div class="slot-time">${s.time}</div>
									<div class="slot-meta">
										<span class="slot-price">${formatCurrency(s.price)}</span>
										<span>Còn ${s.availableSeats} ghế</span>
									</div>
									<div class="slot-chip-actions">
										<button type="button" class="btn-edit-slot" data-date="${dayCinemaEntry.date}" data-movie-id="${sc.movieId}" data-time="${s.time}" data-price="${s.price}" data-seats="${s.availableSeats}" title="Sửa giờ hoặc giá vé">✏️</button>
										<button type="button" class="btn-del-slot" data-date="${dayCinemaEntry.date}" data-movie-id="${sc.movieId}" data-time="${s.time}" title="Xóa suất chiếu này">✕</button>
									</div>
								</div>
							`
							)
							.join("")}
						</div>
					</div>
				`
				}).join("")}
				</div>
			`)
				.join("")

			// Attach Add Slot for Movie buttons
			showtimesContainer.querySelectorAll(".btn-add-slot-for-movie").forEach(btn => {
				btn.addEventListener("click", () => {
					openShowtimeModal({
						cinemaId: selectedCinema,
						date: btn.dataset.date,
						movieId: btn.dataset.movieId,
						screenName: btn.dataset.screen,
						format: btn.dataset.format,
					})
				})
			})

			// Attach Delete entire Movie schedule
			showtimesContainer.querySelectorAll(".btn-del-movie-schedule").forEach(btn => {
				btn.addEventListener("click", async () => {
					const mId = btn.dataset.movieId
					const mTitle = btn.dataset.movieTitle
					const date = btn.dataset.date
					if (confirm(`Bạn có chắc muốn xóa tất cả suất chiếu của phim "${mTitle}" trong ngày này không?`)) {
						const result = await deleteMovieSchedule(selectedCinema, date, mId)
						if (!result.success) {
							showToast(result.message || "Không thể xóa lịch chiếu.", "error")
							return
						}
						showToast(`Đã xóa toàn bộ lịch chiếu phim "${mTitle}" trong ngày.`, "info")
						renderShowtimesSection()
						updateAllBadges()
					}
				})
			})

			// Attach Edit Slot clicks
			showtimesContainer.querySelectorAll(".btn-edit-slot").forEach(btn => {
				btn.addEventListener("click", () => {
					const mId = btn.dataset.movieId
					const date = btn.dataset.date
					const time = btn.dataset.time
					const price = btn.dataset.price
					const seats = btn.dataset.seats
					openShowtimeModal({
						isEdit: true,
						cinemaId: selectedCinema,
						date,
						movieId: mId,
						oldTime: time,
						time,
						price,
						seats,
					})
				})
			})

			// Attach Delete Slot clicks
			showtimesContainer.querySelectorAll(".btn-del-slot").forEach(btn => {
				btn.addEventListener("click", async () => {
					const mId = btn.dataset.movieId
					const time = btn.dataset.time
					const date = btn.dataset.date
					if (confirm(`Xóa suất chiếu lúc ${time}?`)) {
						const result = await deleteShowtimeSlot(selectedCinema, date, mId, time)
						if (!result.success) {
							showToast(result.message || "Không thể xóa suất chiếu.", "error")
							return
						}
						showToast(`Đã xóa suất chiếu lúc ${time}.`, "info")
						renderShowtimesSection()
						updateAllBadges()
					}
				})
			})
		}

		// Showtime Modal
		const showtimeModal = document.getElementById("modal-showtime")
		const showtimeModalClose = document.getElementById("modal-showtime-close")
		const showtimeModalCancel = document.getElementById("btn-cancel-showtime")
		const showtimeForm = document.getElementById("form-admin-showtime")

		document.getElementById("btn-open-add-showtime-modal")?.addEventListener("click", () => openShowtimeModal())
		showtimeModalClose?.addEventListener("click", closeShowtimeModal)
		showtimeModalCancel?.addEventListener("click", closeShowtimeModal)

		function openShowtimeModal(options = {}) {
			if (!showtimeModal) return
			const now = new Date()
			const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

			const titleEl = document.getElementById("modal-showtime-title")
			const cinemaSelectEl = document.getElementById("st-form-cinema")
			const dateInputEl = document.getElementById("st-form-date")
			const movieSelectEl = document.getElementById("st-form-movie")
			const screenSelectEl = document.getElementById("st-form-screen")
			const formatSelectEl = document.getElementById("st-form-format")
			const timeInputEl = document.getElementById("st-form-time")
			const priceInputEl = document.getElementById("st-form-price")
			const seatsInputEl = document.getElementById("st-form-seats")
			const isEditInput = document.getElementById("st-is-edit")
			const oldTimeInput = document.getElementById("st-old-time")

			// Populate cinemas
			if (cinemaSelectEl) {
				cinemaSelectEl.innerHTML = cinemasList
					.map(c => `<option value="${c.id}">${c.name}</option>`)
					.join("")
				cinemaSelectEl.value = options.cinemaId || cinemaSelect?.value || "beta-thainguyen"
			}

			// Populate movies from LocalStorage
			const moviesData = getMoviesData()
			const activeMovies = [
				...(moviesData?.items?.nowshowing || []),
				...(moviesData?.items?.special || []),
				...(moviesData?.items?.upcoming || []),
			]

			if (movieSelectEl) {
				movieSelectEl.innerHTML = activeMovies
					.map(m => `<option value="${m.id}">${m.title} (${m.duration || "100 phút"})</option>`)
					.join("")
				if (options.movieId) movieSelectEl.value = options.movieId
			}

			if (dateInputEl) dateInputEl.value = options.date || today
			if (screenSelectEl && options.screenName) screenSelectEl.value = options.screenName
			if (formatSelectEl && options.format) formatSelectEl.value = options.format

			if (options.isEdit) {
				if (titleEl) titleEl.textContent = "Chỉnh Sửa Suất Chiếu"
				if (isEditInput) isEditInput.value = "true"
				if (oldTimeInput) oldTimeInput.value = options.oldTime || options.time || ""
				if (timeInputEl) timeInputEl.value = options.time || "14:30"
				if (priceInputEl) priceInputEl.value = options.price || 75000
				if (seatsInputEl) seatsInputEl.value = options.seats || 60
			} else {
				if (titleEl) titleEl.textContent = "Thêm Suất Chiếu Mới"
				if (isEditInput) isEditInput.value = "false"
				if (oldTimeInput) oldTimeInput.value = ""
				if (timeInputEl) timeInputEl.value = options.time || "14:30"
				if (priceInputEl) priceInputEl.value = "75000"
				if (seatsInputEl) seatsInputEl.value = "60"
			}

			showtimeModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		function closeShowtimeModal() {
			showtimeModal?.classList.remove("active")
			document.body.style.overflow = ""
		}

		// Showtime Form Submit
		showtimeForm?.addEventListener("submit", async e => {
			e.preventDefault()

			const isEdit = document.getElementById("st-is-edit")?.value === "true"
			const oldTime = document.getElementById("st-old-time")?.value
			const cinemaId = document.getElementById("st-form-cinema")?.value
			const date = document.getElementById("st-form-date")?.value
			const movieId = document.getElementById("st-form-movie")?.value
			const screenName = document.getElementById("st-form-screen")?.value
			const format = document.getElementById("st-form-format")?.value
			const time = document.getElementById("st-form-time")?.value
			const price = Number(document.getElementById("st-form-price")?.value) || 75000
			const availableSeats = Number(document.getElementById("st-form-seats")?.value) || 60

			// Find movie title
			const moviesData = getMoviesData()
			const allMovies = [
				...(moviesData?.items?.nowshowing || []),
				...(moviesData?.items?.special || []),
				...(moviesData?.items?.upcoming || []),
			]
			const targetMovie = allMovies.find(m => m.id === movieId)
			const movieTitle = targetMovie ? targetMovie.title : "Phim Mới"

			if (isEdit && oldTime) {
				const result = await updateShowtimeSlot({
					cinemaId,
					date,
					movieId,
					oldTime,
					time,
					price,
					availableSeats,
					screenName,
					format,
				})
				if (!result.success) {
					showToast(result.message || "Không thể cập nhật suất chiếu.", "error")
					return
				}
				showToast(`✅ Đã cập nhật suất chiếu ${time} cho phim "${movieTitle}"!`, "success")
			} else {
				const result = await addShowtimeSlot({
					cinemaId,
					date,
					movieId,
					movieTitle,
					screenId: screenName,
					screenName,
					format,
					time,
					price,
					availableSeats,
				})
				if (!result.success) {
					showToast(result.message || "Không thể lưu suất chiếu. Vui lòng thử lại.", "error")
					return
				}
				showToast(`✅ Đã thêm suất chiếu mới ${time} cho phim "${movieTitle}"!`, "success")
			}

			closeShowtimeModal()
			// Sync select values with current inputs
			if (cinemaSelect) cinemaSelect.value = cinemaId
			if (dateFilter && date < dateFilter.value) dateFilter.value = date
			renderShowtimesSection()
			updateAllBadges()
		})

		/* ==========================================================================
		   5. TAB 4: QUẢN LÝ COMBO BẮP NƯỚC (REQUIREMENT 6)
		   Thêm, Sửa Giá Bán, Xóa vào LocalStorage
		   ========================================================================== */
		let currentConcessionCategory = "all"
		let currentConcessionSearch = ""

		const concessionGrid = document.getElementById("admin-concessions-grid")
		const concessionCountText = document.getElementById("concessions-count-text")
		const filterConcessionCatSelect = document.getElementById("filter-concessions-category")
		const searchConcessionsInput = document.getElementById("search-concessions-input")

		filterConcessionCatSelect?.addEventListener("change", e => {
			currentConcessionCategory = e.target.value
			renderConcessionsSection()
		})

		searchConcessionsInput?.addEventListener("input", e => {
			currentConcessionSearch = e.target.value.trim().toLowerCase()
			renderConcessionsSection()
		})

		// Reset Concessions Data
		document.getElementById("btn-reset-concessions-data")?.addEventListener("click", async () => {
			if (confirm("Khôi phục danh mục combo bắp nước về dữ liệu gốc?")) {
				await resetStorageSection(STORAGE_KEYS.CONCESSIONS)
				showToast("Đã khôi phục danh mục bắp nước về mặc định!", "info")
				renderConcessionsSection()
				updateAllBadges()
			}
		})

		function renderConcessionsSection() {
			if (!concessionGrid) return
			const concessionsData = getConcessions()
			const items = concessionsData?.items || []

			let filtered = items
			if (currentConcessionCategory !== "all") {
				filtered = filtered.filter(it => it.categoryId === currentConcessionCategory)
			}

			if (currentConcessionSearch) {
				filtered = filtered.filter(
					it =>
						(it.name && it.name.toLowerCase().includes(currentConcessionSearch)) ||
						(it.description && it.description.toLowerCase().includes(currentConcessionSearch))
				)
			}

			if (concessionCountText) concessionCountText.textContent = `Hiển thị ${filtered.length} / ${items.length} món`

			if (filtered.length === 0) {
				concessionGrid.innerHTML = `
				<div style="grid-column: 1 / -1; text-align: center; color: #a6adc8; padding: 40px; background: #313244; border-radius: 12px;">
					Không có sản phẩm nào trong danh mục này.
				</div>
			`
				return
			}

			const categoryNames = {
				combos: "Combo Bắp Nước",
				popcorn: "Bắp Rang Bơ",
				beverages: "Nước Uống",
				snacks: "Đồ Ăn Kèm",
			}

			concessionGrid.innerHTML = filtered
				.map(it => {
					const catLabel = categoryNames[it.categoryId] || it.categoryId
					return `
					<div class="admin-concession-card" id="concession-card-${it.id}">
						<div class="cc-img-wrap">
							<img src="${it.image || "/promo/promo_deal.jpg"}" alt="${it.name}" onerror="this.src='/promo/promo_deal.jpg'" />
						</div>
						<div class="cc-info">
							<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
								<span style="font-size: 11px; color: #89b4fa; font-weight: 700;">${catLabel}</span>
								${it.badge ? `<span style="font-size: 10px; background: rgba(243, 139, 168, 0.2); color: #f38ba8; padding: 1px 6px; border-radius: 4px; font-weight: 800;">${it.badge}</span>` : ""}
							</div>
							<h4 class="cc-name">${it.name}</h4>
							<p class="cc-desc">${it.description || "Món ăn ngon miệng tại rạp Beta"}</p>
							<div class="cc-price-row">
								<span class="cc-price">${formatCurrency(it.price)}</span>
								${it.originalPrice ? `<span class="cc-orig-price">${formatCurrency(it.originalPrice)}</span>` : ""}
							</div>
						</div>
						<div class="cc-card-actions" style="display: flex; gap: 6px;">
							<button type="button" class="btn-action-icon btn-edit-concession" data-id="${it.id}" title="Sửa thông tin và giá bán">✏️</button>
							<button type="button" class="btn-action-icon btn-del-concession" data-id="${it.id}" data-name="${it.name}" title="Xóa món này khỏi menu" style="color: #f38ba8;">🗑️</button>
						</div>
					</div>
				`
				})
				.join("")

			// Attach Edit clicks
			concessionGrid.querySelectorAll(".btn-edit-concession").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const target = items.find(it => it.id === id)
					if (target) openConcessionModal(target)
				})
			})

			// Attach Delete clicks
			concessionGrid.querySelectorAll(".btn-del-concession").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const name = btn.dataset.name
					if (confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi menu bắp nước không?`)) {
						deleteConcessionItem(id)
						showToast(`Đã xóa "${name}" khỏi LocalStorage.`, "info")
						renderConcessionsSection()
						updateAllBadges()
					}
				})
			})
		}

		// Concession Modal
		const concessionModal = document.getElementById("modal-concession")
		const concessionModalClose = document.getElementById("modal-concession-close")
		const concessionModalCancel = document.getElementById("btn-cancel-concession")
		const concessionForm = document.getElementById("form-admin-concession")
		const ccImagePreset = document.getElementById("cc-image-preset")
		const ccImageInput = document.getElementById("cc-image")

		ccImagePreset?.addEventListener("change", e => {
			if (ccImageInput) ccImageInput.value = e.target.value
		})

		document.getElementById("btn-open-add-concession-modal")?.addEventListener("click", () => openConcessionModal())
		concessionModalClose?.addEventListener("click", closeConcessionModal)
		concessionModalCancel?.addEventListener("click", closeConcessionModal)

		function openConcessionModal(itemToEdit = null) {
			if (!concessionModal) return

			const titleEl = document.getElementById("modal-concession-title")
			const idInput = document.getElementById("cc-id")
			const nameInput = document.getElementById("cc-name")
			const catSelect = document.getElementById("cc-category")
			const badgeInput = document.getElementById("cc-badge")
			const priceInput = document.getElementById("cc-price")
			const origPriceInput = document.getElementById("cc-orig-price")
			const imageInput = document.getElementById("cc-image")
			const descInput = document.getElementById("cc-description")

			if (itemToEdit) {
				if (titleEl) titleEl.textContent = `Chỉnh Sửa Giá & Thông Tin: ${itemToEdit.name}`
				if (idInput) idInput.value = itemToEdit.id
				if (nameInput) nameInput.value = itemToEdit.name || ""
				if (catSelect) catSelect.value = itemToEdit.categoryId || "combos"
				if (badgeInput) badgeInput.value = itemToEdit.badge || ""
				if (priceInput) priceInput.value = itemToEdit.price || 0
				if (origPriceInput) origPriceInput.value = itemToEdit.originalPrice || ""
				if (imageInput) imageInput.value = itemToEdit.image || "/promo/promo_deal.jpg"
				if (descInput) descInput.value = itemToEdit.description || ""
			} else {
				if (titleEl) titleEl.textContent = "Thêm Combo / Bắp Nước Mới"
				concessionForm?.reset()
				if (idInput) idInput.value = ""
				if (priceInput) priceInput.value = "75000"
				if (imageInput) imageInput.value = "/promo/promo_deal.jpg"
			}

			concessionModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		function closeConcessionModal() {
			concessionModal?.classList.remove("active")
			document.body.style.overflow = ""
		}

		// Concession Form Submit
		concessionForm?.addEventListener("submit", e => {
			e.preventDefault()

			const id = document.getElementById("cc-id")?.value
			const name = document.getElementById("cc-name")?.value.trim()
			const categoryId = document.getElementById("cc-category")?.value
			const badge = document.getElementById("cc-badge")?.value.trim()
			const price = Number(document.getElementById("cc-price")?.value) || 0
			const origPriceVal = document.getElementById("cc-orig-price")?.value
			const originalPrice = origPriceVal ? Number(origPriceVal) : null
			const image = document.getElementById("cc-image")?.value.trim()
			const description = document.getElementById("cc-description")?.value.trim()

			if (!name) {
				showToast("Vui lòng nhập tên combo!", "warning")
				return
			}

			const payload = {
				name,
				categoryId,
				badge: badge || undefined,
				price,
				originalPrice,
				image: image || "/promo/promo_deal.jpg",
				description: description || "",
			}

			if (id) {
				// Update
				updateConcessionItem(id, payload)
				showToast(`✅ Đã cập nhật giá bán & thông tin "${name}" thành công!`, "success")
			} else {
				// Add
				payload.id = "cbo_" + Date.now().toString(36)
				addConcessionItem(payload)
				showToast(`✅ Đã thêm mới "${name}" với giá ${formatCurrency(price)}!`, "success")
			}

			closeConcessionModal()
			renderConcessionsSection()
			updateAllBadges()
		})

		/* ==========================================================================
		   6. TAB 5: QUẢN LÝ ĐƠN VÉ HỆ THỐNG
		   ========================================================================== */
		let currentBookingStatusFilter = "all"
		let currentBookingSearch = ""

		const bookingsTableTbody = document.getElementById("admin-bookings-table-tbody")
		const bookingsCountText = document.getElementById("bookings-count-text")
		const searchBookingsInput = document.getElementById("search-admin-bookings-input")
		const bookingFilterPills = document.querySelectorAll(".btn-filter-bk")

		// Filter pill buttons (Tất Cả, Chờ Xem / Đã Thanh Toán, Đã Soát Vé / Đã Xem, Đã Hủy)
		bookingFilterPills.forEach(pill => {
			pill.addEventListener("click", () => {
				bookingFilterPills.forEach(p => {
					p.classList.remove("active")
					p.style.background = "#313244"
					p.style.color = "#a6adc8"
					p.style.border = "1px solid rgba(88, 91, 112, 0.4)"
				})
				pill.classList.add("active")
				pill.style.background = "#89b4fa"
				pill.style.color = "#11111b"
				pill.style.border = "none"

				currentBookingStatusFilter = pill.dataset.status || "all"
				renderAdminBookingsTable()
			})
		})

		searchBookingsInput?.addEventListener("input", e => {
			currentBookingSearch = e.target.value.trim().toLowerCase()
			renderAdminBookingsTable()
		})

		function renderAdminBookingsTable() {
			if (!bookingsTableTbody) return
			const bookings = getBookingHistory()

			// Update counter badges on filter pills
			const cntAll = bookings.length
			const cntPending = bookings.filter(b => {
				const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
				const isDone = b.status === "done"
				const isPaid = !isCancelled && (b.paymentStatus === "paid" || b.status === "paid")
				const isConfirmed = !isCancelled && !isPaid && !isDone && (b.bookingStatus === "confirmed" || b.status === "confirmed")
				return !isCancelled && !isPaid && !isDone && !isConfirmed
			}).length
			const cntConfirmed = bookings.filter(b => {
				const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
				const isDone = b.status === "done"
				const isPaid = !isCancelled && (b.paymentStatus === "paid" || b.status === "paid")
				return !isCancelled && !isPaid && !isDone && (b.bookingStatus === "confirmed" || b.status === "confirmed")
			}).length
			const cntPaid = bookings.filter(b => {
				const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
				const isDone = b.status === "done"
				return !isCancelled && !isDone && (b.paymentStatus === "paid" || b.status === "paid")
			}).length
			const cntDone = bookings.filter(b => b.status === "done").length
			const cntCancelled = bookings.filter(b => b.status === "cancelled" || b.bookingStatus === "cancelled").length

			const elAll = document.getElementById("cnt-bk-all")
			const elPending = document.getElementById("cnt-bk-pending")
			const elConfirmed = document.getElementById("cnt-bk-confirmed")
			const elPaid = document.getElementById("cnt-bk-paid")
			const elDone = document.getElementById("cnt-bk-done")
			const elCancelled = document.getElementById("cnt-bk-cancelled")

			if (elAll) elAll.textContent = cntAll
			if (elPending) elPending.textContent = cntPending
			if (elConfirmed) elConfirmed.textContent = cntConfirmed
			if (elPaid) elPaid.textContent = cntPaid
			if (elDone) elDone.textContent = cntDone
			if (elCancelled) elCancelled.textContent = cntCancelled

			let filtered = bookings

			if (currentBookingStatusFilter !== "all") {
				filtered = filtered.filter(b => {
					const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
					const isDone = b.status === "done"
					const isPaid = !isCancelled && (b.paymentStatus === "paid" || b.status === "paid")
					const isConfirmed = !isCancelled && !isPaid && !isDone && (b.bookingStatus === "confirmed" || b.status === "confirmed")
					const isPending = !isCancelled && !isPaid && !isDone && !isConfirmed

					if (currentBookingStatusFilter === "pending") return isPending
					if (currentBookingStatusFilter === "confirmed") return isConfirmed
					if (currentBookingStatusFilter === "paid") return isPaid
					if (currentBookingStatusFilter === "done") return isDone
					if (currentBookingStatusFilter === "cancelled") return isCancelled

					return b.status === currentBookingStatusFilter
				})
			}

			if (currentBookingSearch) {
				filtered = filtered.filter(
					b =>
						(b.id && b.id.toLowerCase().includes(currentBookingSearch)) ||
						(b.userName && b.userName.toLowerCase().includes(currentBookingSearch)) ||
						(b.userPhone && b.userPhone.toLowerCase().includes(currentBookingSearch)) ||
						(b.userEmail && b.userEmail.toLowerCase().includes(currentBookingSearch)) ||
						(b.movieTitle && b.movieTitle.toLowerCase().includes(currentBookingSearch)) ||
						(b.cinemaName && b.cinemaName.toLowerCase().includes(currentBookingSearch)) ||
						(b.seats && b.seats.toLowerCase().includes(currentBookingSearch))
				)
			}

			if (bookingsCountText) bookingsCountText.textContent = `Hiển thị ${filtered.length} / ${bookings.length} đơn đặt vé`

			if (filtered.length === 0) {
				bookingsTableTbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #a6adc8; padding: 36px;">Không tìm thấy đơn đặt vé nào phù hợp</td></tr>`
				return
			}

			bookingsTableTbody.innerHTML = filtered
				.map(b => {
					const isCancelled = b.status === "cancelled" || b.bookingStatus === "cancelled"
					const isDone = b.status === "done"
					const isPaid = !isCancelled && (b.paymentStatus === "paid" || b.status === "paid")
					const isConfirmed = !isCancelled && !isPaid && !isDone && (b.bookingStatus === "confirmed" || b.status === "confirmed")
					const isPending = !isCancelled && !isPaid && !isDone && !isConfirmed
					const methodText = (b.paymentMethod || "QR").toUpperCase()

					// Cột 1. Xác nhận đặt vé
					let colStep1 = ""
					if (isCancelled) {
						colStep1 = `<span style="color: #f38ba8; font-size: 12px; font-weight: 700;">Đơn Đã Hủy</span>`
					} else if (isPending) {
						colStep1 = `<button type="button" class="btn-action-order-confirm" data-id="${b.id}" style="background: rgba(250, 179, 135, 0.15); color: #fab387; border: 1px solid rgba(250, 179, 135, 0.4); border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer;">⏳ Xác Nhận Đơn</button>`
					} else {
						colStep1 = `<span style="color: #a6e3a1; font-size: 12px; font-weight: 700;">✓ Đã Xác Nhận</span>`
					}

					// Cột 2. Xác nhận thanh toán
					let colStep2 = ""
					if (isCancelled) {
						colStep2 = `<span style="color: #f38ba8; font-weight: 700; font-size: 12px;">🔴 Đã Hủy Vé</span>`
					} else if (isPending) {
						colStep2 = `<span style="color: #6c7086; font-size: 11px;">Chờ duyệt bước 1</span>`
					} else if (isConfirmed) {
						colStep2 = `<button type="button" class="btn-action-payment-confirm" data-id="${b.id}" style="background: rgba(137, 180, 250, 0.15); color: #89b4fa; border: 1px solid rgba(137, 180, 250, 0.4); border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer;">💳 Xác Nhận Thu Tiền</button>`
					} else if (isPaid) {
						colStep2 = `<span style="color: #a6e3a1; font-weight: 700; font-size: 12px;">🟢 ĐÃ NHẬN TIỀN</span>`
					} else if (isDone) {
						colStep2 = `<span style="color: #89b4fa; font-weight: 700; font-size: 12px;">🔵 Đã Soát Vé</span>`
					} else {
						colStep2 = `<span style="color: #f38ba8; font-weight: 700; font-size: 12px;">🔴 Đã Hủy Vé</span>`
					}

					return `
					<tr>
						<td><strong style="color: #89b4fa; font-family: monospace; font-size: 13px;">${b.id}</strong></td>
						<td>
							<div class="cell-title" style="font-weight: 700;">${b.customerName || b.userName || "Khách Hàng"}</div>
							<div class="cell-sub" style="color: #89b4fa;">📞 ${b.customerPhone || b.userPhone || "Chưa có SĐT"}</div>
							<div class="cell-sub" style="color: #a6adc8;">✉️ ${b.customerEmail || b.userEmail || "Khách vãng lai"}</div>
						</td>
						<td>
							<div class="cell-title">${b.movieTitle}</div>
							<div class="cell-sub">📍 ${b.cinemaName}</div>
						</td>
						<td>
							<div><strong style="color: #cdd6f4;">${b.time}</strong></div>
							<div class="cell-sub">🗓️ ${formatDateVN(b.date)}</div>
						</td>
						<td>
							<div style="color: #a6e3a1; font-weight: 700;">🎟️ ${b.seats || "N/A"}</div>
							<div class="cell-sub">🍿 ${b.concessions || "Không kèm combo"}</div>
						</td>
						<td>
							<div style="color: #fab387; font-weight: 800; font-size: 14px;">${formatCurrency(b.total)}</div>
							<span style="display: inline-block; font-size: 10px; font-weight: 800; background: rgba(137, 180, 250, 0.15); color: #89b4fa; border: 1px solid rgba(137, 180, 250, 0.3); border-radius: 4px; padding: 2px 5px; margin-top: 2px;">${methodText}</span>
						</td>
						<td>${colStep1}</td>
						<td>${colStep2}</td>
						<td style="text-align: center;">
							<div class="row-actions" style="justify-content: center; gap: 6px;">
								<button type="button" class="btn-action-icon btn-view-admin-ticket" data-id="${b.id}" title="Xem chi tiết vé điện tử & Mã QR">🎟️</button>
								${!isDone && isPaid && !isCancelled
							? `<button type="button" class="btn-action-icon btn-checkin-ticket" data-id="${b.id}" style="color: #a6e3a1;" title="Soát vé nhanh (Xác nhận khách đã vào rạp)">✓</button>`
							: ""
						}
								${isPending && !isCancelled ? `<button type="button" class="btn-action-icon btn-cancel-admin-ticket" data-id="${b.id}" style="color: #fab387;" title="Hủy đơn đang chờ xử lý">✕</button>` : ""}
							</div>
						</td>
					</tr>
				`
				})
				.join("")

			// 1. Confirm order step 1
			bookingsTableTbody.querySelectorAll(".btn-action-order-confirm").forEach(btn => {
				btn.addEventListener("click", async () => {
					const id = btn.dataset.id
					await confirmBookingOrder(id)
					showToast(`✅ Đã xác nhận đơn đặt vé ${id}! Chuyển sang bước chờ thanh toán.`, "success")
					renderAdminBookingsTable()
					renderOverviewDashboard()
					updateAllBadges()
				})
			})

			// 2. Confirm payment step 2
			bookingsTableTbody.querySelectorAll(".btn-action-payment-confirm").forEach(btn => {
				btn.addEventListener("click", async () => {
					const id = btn.dataset.id
					const result = await confirmTicketPayment(id)
					if (!result) {
						showToast("Không thể xác nhận thanh toán. Đơn có thể đã hết hạn hoặc dữ liệu máy chủ bị lỗi.", "error")
						return
					}
					showToast(`💰 Đã xác nhận thu tiền cho đơn vé ${id}! Vé đã sẵn sàng cho khách xem phim.`, "success")
					renderAdminBookingsTable()
					renderOverviewDashboard()
					updateAllBadges()
				})
			})

			// 2. View ticket modal
			bookingsTableTbody.querySelectorAll(".btn-view-admin-ticket").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					const target = bookings.find(b => b.id === id)
					if (target) openAdminTicketModal(target)
				})
			})

			// 3. Quick Check-in
			bookingsTableTbody.querySelectorAll(".btn-checkin-ticket").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					updateBookingStatus(id, "done")
					showToast(`✅ Đã xác nhận soát vé thành công cho mã ${id}!`, "success")
					renderAdminBookingsTable()
					renderOverviewDashboard()
					updateAllBadges()
				})
			})

			// 4. Quick Cancel
			bookingsTableTbody.querySelectorAll(".btn-cancel-admin-ticket").forEach(btn => {
				btn.addEventListener("click", async () => {
					const id = btn.dataset.id
					if (confirm(`Bạn có chắc chắn muốn hủy đơn vé ${id} này không?`)) {
						const result = await cancelBookingTicket(id)
						if (!result.success) {
							showToast(result.message || "Không thể hủy đơn vé này.", "error")
							return
						}
						showToast(`Đã chuyển trạng thái đơn vé ${id} sang "Đã hủy".`, "info")
						renderAdminBookingsTable()
						renderOverviewDashboard()
						updateAllBadges()
					}
				})
			})

		}

		// Modal View Ticket for Admin
		const adminTicketModal = document.getElementById("modal-admin-ticket")
		const adminTicketClose = document.getElementById("modal-admin-ticket-close")
		adminTicketClose?.addEventListener("click", () => {
			adminTicketModal?.classList.remove("active")
			document.body.style.overflow = ""
		})
		adminTicketModal?.addEventListener("click", e => {
			if (e.target === adminTicketModal) {
				adminTicketModal.classList.remove("active")
				document.body.style.overflow = ""
			}
		})

		function openAdminTicketModal(t) {
			const body = document.getElementById("modal-admin-ticket-body")
			if (!adminTicketModal || !body) return

			const isCancelled = t.status === "cancelled" || t.bookingStatus === "cancelled"
			const isDone = t.status === "done"
			const isPaid = !isCancelled && (t.paymentStatus === "paid" || t.status === "paid")
			const isConfirmed = !isCancelled && !isPaid && !isDone && (t.bookingStatus === "confirmed" || t.status === "confirmed")
			const isPending = !isCancelled && !isPaid && !isDone && !isConfirmed

			const qrStatus = isCancelled ? "CANCELLED" : isDone ? "USED" : isPaid ? "VALID_PAID" : isConfirmed ? "CONFIRMED_UNPAID" : "PENDING"
			const qrSvg = generateQRCodeSVG(
				JSON.stringify({
					ticketId: t.id,
					movie: t.movieTitle,
					cinema: t.cinemaName,
					time: `${t.time} ${t.date}`,
					seats: t.seats,
					status: qrStatus,
				}),
				{
					size: 160,
					darkColor: "#11111b",
					lightColor: "#cdd6f4",
					includeLogo: true,
				}
			)

			const pMethod = (t.paymentMethod || "QR").toUpperCase()

			let bannerBg = "#10b981"
			let badgeIcon = "✓"
			let statusTitle = "ĐÃ NHẬN TIỀN - VÉ HỢP LỆ"
			let statusSub = `Mã vé: ${t.id} • Thanh toán qua: <strong>${pMethod}</strong> • Beta Admin Verify`
			let statusBadgeText = `🟢 ĐÃ NHẬN TIỀN (${pMethod})`
			let hintText = "Vé đã thanh toán thành công - Xuất trình mã này tại Kiosk/Quầy soát vé"

			if (isCancelled) {
				bannerBg = "#f38ba8"
				badgeIcon = "✕"
				statusTitle = "ĐÃ HỦY VÉ - KHÔNG HỢP LỆ"
				statusSub = `Mã vé: ${t.id} • Đơn vé đã bị hủy khỏi hệ thống`
				statusBadgeText = "🔴 ĐÃ HỦY VÉ"
				hintText = "Vé này đã bị hủy, ghế ngồi đã được giải phóng trở lại rạp."
			} else if (isDone) {
				bannerBg = "#89b4fa"
				badgeIcon = "✓"
				statusTitle = "ĐÃ SOÁT VÉ - VÉ ĐÃ SỬ DỤNG"
				statusSub = `Mã vé: ${t.id} • Khách hàng đã vào phòng chiếu xem phim`
				statusBadgeText = "🔵 ĐÃ SOÁT VÉ"
				hintText = "Vé đã được nhân viên rạp soát và check-in thành công."
			} else if (isConfirmed) {
				bannerBg = "#fab387"
				badgeIcon = "⏳"
				statusTitle = "ĐÃ XÁC NHẬN - CHỜ THU TIỀN"
				statusSub = `Mã vé: ${t.id} • Đã duyệt đơn bước 1, chờ thu tiền qua ${pMethod}`
				statusBadgeText = `🟡 CHỜ THU TIỀN (${pMethod})`
				hintText = "Đơn vé đã được xác nhận. Vui lòng nhấn 'Xác Nhận Thu Tiền' khi khách thanh toán."
			} else if (isPending) {
				bannerBg = "#f9e2af"
				badgeIcon = "⏳"
				statusTitle = "CHỜ DUYỆT ĐƠN BƯỚC 1"
				statusSub = `Mã vé: ${t.id} • Đơn vé mới tạo, đang chờ kiểm tra`
				statusBadgeText = "⏳ CHỜ XÁC NHẬN ĐƠN"
				hintText = "Đơn vé đang chờ duyệt, nhấn 'Xác Nhận Đơn' tại danh sách vé."
			}

			body.innerHTML = `
			<div class="eticket-success-page-wrap" style="margin: 0; box-shadow: none; max-width: 100%;">
				<div class="eticket-top-banner" style="background: ${bannerBg};">
					<div class="et-success-badge" style="color: ${bannerBg};">${badgeIcon}</div>
					<h2 style="color:#11111b; font-size: 20px; font-weight:900; margin:0 0 4px; text-transform:uppercase;">${statusTitle}</h2>
					<p style="font-size: 13px; color: rgba(17,17,27,0.85); margin:0;">${statusSub}</p>
				</div>
				<div class="eticket-ticket-pass">
					<div class="et-code-banner">
						<div class="code-label">MÃ QUÉT TẠI RẠP (KIOSK)</div>
						<div class="code-value">${t.id}</div>
					</div>
					<div class="et-qr-container">
						<div class="qr-code-box" style="padding: 12px; background: #cdd6f4; border-radius: 8px;">
							${qrSvg}
						</div>
						<div class="qr-hint">${hintText}</div>
					</div>
					<div class="et-info-grid">
						<div class="et-info-item" style="grid-column: 1 / -1;">
							<span class="et-lbl">Khách hàng</span>
							<span class="et-val val-gold">${t.customerName || t.userName || "Khách Hàng"} (${t.customerPhone || t.userPhone || "N/A"}) - ${t.customerEmail || t.userEmail || "N/A"}</span>
						</div>
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
							<div style="display:flex; justify-content: space-between; align-items: center;">
								<div>
									<span class="et-lbl">${isCancelled ? "Tổng Tiền Đơn Hủy" : "Tổng Tiền"}</span>
									<div class="et-val val-gold" style="font-size: 18px;">${formatCurrency(t.total)}</div>
								</div>
								<div style="text-align: right;">
									<span class="et-lbl">Trạng thái</span>
									<div style="color: ${bannerBg}; font-weight: 800; font-size: 13px;">${statusBadgeText}</div>
								</div>
							</div>
						</div>
					</div>
					<div class="et-barcode-wrap">
						<div class="barcode-strip"></div>
						<div class="barcode-number">${t.id} - ${qrStatus} - BETA ADMIN</div>
					</div>
				</div>
			</div>
		`

			adminTicketModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		/* ==========================================================================
		   7. TAB 6: QUẢN LÝ PHÒNG CHIẾU RẠP (SCREENS MANAGEMENT)
		   ========================================================================== */
		let currentScreenCinemaFilter = "all"
		let currentScreenTypeFilter = "all"
		let currentScreenSearch = ""

		const screensTableTbody = document.getElementById("admin-screens-table-tbody")
		const screensCountText = document.getElementById("screens-count-text")
		const filterScreensCinema = document.getElementById("filter-screens-cinema")
		const filterScreensType = document.getElementById("filter-screens-type")
		const searchScreensInput = document.getElementById("search-screens-input")
		const btnOpenAddScreen = document.getElementById("btn-open-add-screen-modal")

		const screenModal = document.getElementById("modal-screen")
		const screenModalClose = document.getElementById("modal-screen-close")
		const screenModalCancel = document.getElementById("btn-cancel-screen")
		const screenForm = document.getElementById("form-admin-screen")

		function populateScreensCinemaDropdowns() {
			const cinemas = getCinemas()
			if (filterScreensCinema) {
				const currentVal = filterScreensCinema.value || "all"
				filterScreensCinema.innerHTML = `
					<option value="all">Tất cả cụm rạp</option>
					${cinemas.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
				`
				filterScreensCinema.value = currentVal
			}

			const scCinemaSelect = document.getElementById("sc-cinema-id")
			if (scCinemaSelect) {
				scCinemaSelect.innerHTML = cinemas
					.map(c => `<option value="${c.id}">${c.name} (${c.city})</option>`)
					.join("")
			}
		}

		filterScreensCinema?.addEventListener("change", e => {
			currentScreenCinemaFilter = e.target.value
			renderScreensSection()
		})

		filterScreensType?.addEventListener("change", e => {
			currentScreenTypeFilter = e.target.value
			renderScreensSection()
		})

		searchScreensInput?.addEventListener("input", e => {
			currentScreenSearch = e.target.value.trim().toLowerCase()
			renderScreensSection()
		})

		function openScreenModal(isEdit = false, screenData = null, cinemaId = null) {
			populateScreensCinemaDropdowns()
			const titleEl = document.getElementById("modal-screen-title")
			const isEditInput = document.getElementById("sc-is-edit")
			const cinemaSelect = document.getElementById("sc-cinema-id")
			const idInput = document.getElementById("sc-id")
			const nameInput = document.getElementById("sc-name")
			const typeSelect = document.getElementById("sc-type")
			const seatsInput = document.getElementById("sc-total-seats")
			const soundSelect = document.getElementById("sc-sound")
			const statusSelect = document.getElementById("sc-status")

			if (isEdit && screenData) {
				if (titleEl) titleEl.textContent = `Chỉnh Sửa Phòng Chiếu: ${screenData.name}`
				if (isEditInput) isEditInput.value = "true"
				if (cinemaSelect) {
					cinemaSelect.value = cinemaId || ""
					cinemaSelect.disabled = true
				}
				if (idInput) {
					idInput.value = screenData.screenId || ""
					idInput.readOnly = true
				}
				if (nameInput) nameInput.value = screenData.name || ""
				if (typeSelect) typeSelect.value = screenData.type || "2D"
				if (seatsInput) seatsInput.value = screenData.totalSeats || 120
				if (soundSelect) soundSelect.value = screenData.soundSystem || "Dolby 7.1"
				if (statusSelect) statusSelect.value = screenData.status || "active"
			} else {
				if (titleEl) titleEl.textContent = "Thêm Phòng Chiếu Mới"
				if (isEditInput) isEditInput.value = "false"
				if (cinemaSelect) cinemaSelect.disabled = false
				screenForm?.reset()
				if (idInput) idInput.readOnly = false
				if (seatsInput) seatsInput.value = 120
			}

			screenModal?.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		function closeScreenModal() {
			screenModal?.classList.remove("active")
			document.body.style.overflow = ""
		}

		btnOpenAddScreen?.addEventListener("click", () => openScreenModal(false))
		screenModalClose?.addEventListener("click", closeScreenModal)
		screenModalCancel?.addEventListener("click", closeScreenModal)

		screenForm?.addEventListener("submit", async e => {
			e.preventDefault()
			const isEdit = document.getElementById("sc-is-edit")?.value === "true"
			const cinemaId = document.getElementById("sc-cinema-id")?.value
			const screenId = document.getElementById("sc-id")?.value.trim()
			const name = document.getElementById("sc-name")?.value.trim()
			const type = document.getElementById("sc-type")?.value
			const totalSeats = Number(document.getElementById("sc-total-seats")?.value) || 120
			const soundSystem = document.getElementById("sc-sound")?.value
			const status = document.getElementById("sc-status")?.value

			if (!cinemaId || !screenId || !name) {
				showToast("Vui lòng điền đầy đủ thông tin phòng chiếu!", "warning")
				return
			}

			if (isEdit) {
				await updateCinemaScreen(cinemaId, screenId, {
					name,
					type,
					totalSeats,
					soundSystem,
					status,
				})
				showToast(`✅ Đã cập nhật phòng chiếu "${name}" thành công!`, "success")
			} else {
				const result = await addCinemaScreen(cinemaId, {
					screenId,
					name,
					type,
					totalSeats,
					soundSystem,
					status,
				})
				if (!result.success) {
					showToast(result.error || "Không thể thêm phòng chiếu!", "error")
					return
				}
				showToast(`✅ Đã thêm phòng chiếu "${name}" vào cụm rạp thành công!`, "success")
			}

			closeScreenModal()
			renderScreensSection()
			updateAllBadges()
			renderOverviewDashboard()
		})

		function renderScreensSection() {
			populateScreensCinemaDropdowns()
			const cinemas = getCinemas()
			if (!screensTableTbody) return

			let allScreens = []
			cinemas.forEach(cinema => {
				if (Array.isArray(cinema.screens)) {
					cinema.screens.forEach(s => {
						allScreens.push({
							...s,
							cinemaId: cinema.id,
							cinemaName: cinema.name,
							cinemaCity: cinema.city,
						})
					})
				}
			})

			// Filter
			let filtered = allScreens
			if (currentScreenCinemaFilter !== "all") {
				filtered = filtered.filter(s => s.cinemaId === currentScreenCinemaFilter)
			}
			if (currentScreenTypeFilter !== "all") {
				filtered = filtered.filter(s => s.type?.toLowerCase().includes(currentScreenTypeFilter.toLowerCase()))
			}
			if (currentScreenSearch) {
				filtered = filtered.filter(
					s =>
						s.name?.toLowerCase().includes(currentScreenSearch) ||
						s.screenId?.toLowerCase().includes(currentScreenSearch) ||
						s.cinemaName?.toLowerCase().includes(currentScreenSearch),
				)
			}

			// KPI Updates
			const kpiTotal = document.getElementById("kpi-screen-total-count")
			const kpiActive = document.getElementById("kpi-screen-active-count")
			const kpiPremium = document.getElementById("kpi-screen-premium-count")
			const kpiSeats = document.getElementById("kpi-screen-seats-sum")

			if (kpiTotal) kpiTotal.textContent = allScreens.length
			if (kpiActive) kpiActive.textContent = allScreens.filter(s => s.status !== "closed").length
			if (kpiPremium) {
				kpiPremium.textContent = allScreens.filter(s =>
					["imax", "3d", "4dx", "screenx"].some(k => s.type?.toLowerCase().includes(k)),
				).length
			}
			if (kpiSeats) {
				const sumSeats = allScreens.reduce((acc, s) => acc + (Number(s.totalSeats) || 0), 0)
				kpiSeats.textContent = sumSeats.toLocaleString("vi-VN")
			}
			if (screensCountText) {
				screensCountText.textContent = `Hiển thị ${filtered.length} / ${allScreens.length} phòng chiếu`
			}

			if (filtered.length === 0) {
				screensTableTbody.innerHTML = `
					<tr>
						<td colspan="8" style="text-align: center; padding: 40px; color: #a6adc8;">
							<div style="font-size: 32px; margin-bottom: 8px;">🎦</div>
							Không tìm thấy phòng chiếu nào phù hợp với bộ lọc hiện tại.
						</td>
					</tr>
				`
				return
			}

			screensTableTbody.innerHTML = filtered
				.map(s => {
					let typeClass = "type-2d"
					const lowerType = (s.type || "").toLowerCase()
					if (lowerType.includes("imax")) typeClass = "type-imax"
					else if (lowerType.includes("4dx")) typeClass = "type-4dx"
					else if (lowerType.includes("screenx")) typeClass = "type-screenx"
					else if (lowerType.includes("3d")) typeClass = "type-3d"

					let statusHtml = '<span class="badge-screen-status status-active">🟢 Hoạt Động</span>'
					if (s.status === "maintenance") {
						statusHtml = '<span class="badge-screen-status status-maintenance">🟡 Bảo Trì</span>'
					} else if (s.status === "closed") {
						statusHtml = '<span class="badge-screen-status status-closed">🔴 Tạm Đóng</span>'
					}

					return `
						<tr>
							<td><code style="color: #89b4fa; font-weight: 700; background: rgba(137, 180, 250, 0.12); padding: 3px 8px; border-radius: 4px;">${s.screenId}</code></td>
							<td>
								<div class="cell-title">${s.name}</div>
								<div class="cell-sub">${s.cinemaCity}</div>
							</td>
							<td>
								<div style="font-weight: 600; color: #cdd6f4; font-size: 13px;">${s.cinemaName}</div>
							</td>
							<td>
								<span class="badge-screen-type ${typeClass}">${s.type || "2D"}</span>
							</td>
							<td>
								<b style="color: #fab387; font-size: 14px;">${s.totalSeats || 120}</b> ghế
							</td>
							<td>
								<span style="font-size: 12px; color: #a6adc8;">${s.soundSystem || "Dolby 7.1"}</span>
							</td>
							<td>${statusHtml}</td>
							<td style="text-align: center;">
								<div class="row-actions" style="justify-content: center; gap: 6px;">
									<button type="button" class="btn-action-edit btn-edit-screen"
										data-cinema-id="${s.cinemaId}" data-screen-id="${s.screenId}"
										title="Chỉnh sửa thông tin phòng">✏️ Sửa</button>
									<button type="button" class="btn-action-edit btn-view-screen-seats"
										data-cinema-id="${s.cinemaId}" data-screen-id="${s.screenId}"
										style="background: rgba(137, 220, 235, 0.15); color: #89dceb; border-color: rgba(137, 220, 235, 0.3);"
										title="Cấu hình sơ đồ ghế phòng chiếu này">📐 Sơ Đồ Ghế</button>
									<button type="button" class="btn-action-delete btn-delete-screen"
										data-cinema-id="${s.cinemaId}" data-screen-id="${s.screenId}" data-screen-name="${s.name}"
										title="Xóa phòng chiếu">🗑️</button>
								</div>
							</td>
						</tr>
					`
				})
				.join("")

			// Edit screen button click
			screensTableTbody.querySelectorAll(".btn-edit-screen").forEach(btn => {
				btn.addEventListener("click", () => {
					const cId = btn.dataset.cinemaId
					const sId = btn.dataset.screenId
					const cinema = getCinemaById(cId)
					const scr = cinema?.screens?.find(x => x.screenId === sId)
					if (scr) openScreenModal(true, scr, cId)
				})
			})

			// View seats button click -> Switch to Seats Tab
			screensTableTbody.querySelectorAll(".btn-view-screen-seats").forEach(btn => {
				btn.addEventListener("click", () => {
					const cId = btn.dataset.cinemaId
					const sId = btn.dataset.screenId
					switchTab("seats")
					initSeatSectionTarget(cId, sId)
				})
			})

			// Delete screen button click
			screensTableTbody.querySelectorAll(".btn-delete-screen").forEach(btn => {
				btn.addEventListener("click", async () => {
					const cId = btn.dataset.cinemaId
					const sId = btn.dataset.screenId
					const sName = btn.dataset.screenName
					if (confirm(`Bạn có chắc chắn muốn xóa phòng chiếu "${sName}" (${sId}) khỏi hệ thống không?`)) {
						await deleteCinemaScreen(cId, sId)
						showToast(`Đã xóa phòng chiếu "${sName}" thành công!`, "info")
						renderScreensSection()
						updateAllBadges()
						renderOverviewDashboard()
					}
				})
			})
		}

		/* ==========================================================================
		   8. TAB 7: QUẢN LÝ GHẾ & SƠ ĐỒ PHÒNG CHIẾU (SEAT MANAGEMENT)
		   ========================================================================== */
		let selectedSeatCinemaId = "beta-thainguyen"
		let selectedSeatScreenId = ""
		let currentSeatLayout = []
		let seatClickMode = "toggle" // 'toggle' | 'edit'

		const seatFilterCinema = document.getElementById("seat-filter-cinema")
		const seatFilterScreen = document.getElementById("seat-filter-screen")
		const btnSeatToggleMode = document.getElementById("btn-seat-toggle-mode")
		const seatModeLabel = document.getElementById("seat-mode-label")
		const btnSeatSaveLayout = document.getElementById("btn-seat-save-layout")
		const btnSeatResetLayout = document.getElementById("btn-seat-reset-layout")
		const adminSeatGrid = document.getElementById("admin-seat-grid")

		const modalSeatEdit = document.getElementById("modal-seat-edit")
		const modalSeatEditClose = document.getElementById("modal-seat-edit-close")
		const btnCancelSeatEdit = document.getElementById("btn-cancel-seat-edit")
		const formAdminSeatEdit = document.getElementById("form-admin-seat-edit")

		function populateSeatCinemaAndScreenSelectors() {
			const cinemas = getCinemas()
			if (cinemas.length === 0) return

			if (!cinemas.some(c => c.id === selectedSeatCinemaId)) {
				selectedSeatCinemaId = cinemas[0].id
			}

			if (seatFilterCinema) {
				seatFilterCinema.innerHTML = cinemas
					.map(c => `<option value="${c.id}" ${c.id === selectedSeatCinemaId ? "selected" : ""}>${c.name}</option>`)
					.join("")
			}

			populateSeatScreensForCinema(selectedSeatCinemaId)
		}

		function populateSeatScreensForCinema(cinemaId) {
			const cinema = getCinemaById(cinemaId)
			const screens = cinema?.screens || []

			if (!screens.some(s => s.screenId === selectedSeatScreenId)) {
				selectedSeatScreenId = screens[0]?.screenId || ""
			}

			if (seatFilterScreen) {
				if (screens.length === 0) {
					seatFilterScreen.innerHTML = `<option value="">Chưa có phòng chiếu</option>`
					selectedSeatScreenId = ""
				} else {
					seatFilterScreen.innerHTML = screens
						.map(
							s =>
								`<option value="${s.screenId}" ${s.screenId === selectedSeatScreenId ? "selected" : ""}>${s.name} (${s.type})</option>`,
						)
						.join("")
				}
			}
		}

		function initSeatSectionTarget(cinemaId, screenId) {
			selectedSeatCinemaId = cinemaId
			selectedSeatScreenId = screenId
			populateSeatCinemaAndScreenSelectors()
			renderSeatsSection()
		}

		seatFilterCinema?.addEventListener("change", e => {
			selectedSeatCinemaId = e.target.value
			populateSeatScreensForCinema(selectedSeatCinemaId)
			renderSeatsSection()
		})

		seatFilterScreen?.addEventListener("change", e => {
			selectedSeatScreenId = e.target.value
			renderSeatsSection()
		})

		btnSeatToggleMode?.addEventListener("click", () => {
			if (seatClickMode === "toggle") {
				seatClickMode = "edit"
				if (seatModeLabel) {
					seatModeLabel.textContent = "Nhấp Sửa Chi Tiết (Modal)"
					seatModeLabel.style.color = "#a6e3a1"
				}
				showToast("Đã chuyển chế độ: Nhấp vào ghế để mở cửa sổ chỉnh sửa loại ghế & trạng thái.", "info")
			} else {
				seatClickMode = "toggle"
				if (seatModeLabel) {
					seatModeLabel.textContent = "Nhấp Đổi Trạng Thái"
					seatModeLabel.style.color = "#89b4fa"
				}
				showToast("Đã chuyển chế độ: Nhấp vào ghế để nhanh chóng Bật/Tắt khóa bảo trì.", "info")
			}
		})

		btnSeatSaveLayout?.addEventListener("click", () => {
			if (!selectedSeatCinemaId || !selectedSeatScreenId) return
			saveScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId, currentSeatLayout)
			showToast("✅ Đã lưu cấu hình sơ đồ ghế phòng chiếu thành công!", "success")
		})

		btnSeatResetLayout?.addEventListener("click", () => {
			if (!selectedSeatCinemaId || !selectedSeatScreenId) return
			if (confirm("Bạn có chắc chắn muốn khôi phục sơ đồ ghế của phòng này về mặc định ban đầu không?")) {
				localStorage.removeItem(`beta_screen_layout_${selectedSeatCinemaId}_${selectedSeatScreenId}`)
				currentSeatLayout = getScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId)
				renderSeatGrid()
				showToast("🔄 Đã khôi phục sơ đồ ghế về mặc định!", "info")
			}
		})

		function openSeatEditModal(seat) {
			const labelEl = document.getElementById("se-seat-label")
			const idInput = document.getElementById("se-seat-id")
			const typeSelect = document.getElementById("se-seat-type")
			const statusSelect = document.getElementById("se-seat-status")

			if (labelEl) labelEl.textContent = `${seat.id} (${seat.row}-${seat.col})`
			if (idInput) idInput.value = seat.id
			if (typeSelect) typeSelect.value = seat.type || "standard"
			if (statusSelect) statusSelect.value = seat.status || "available"

			modalSeatEdit?.classList.add("active")
			document.body.style.overflow = "hidden"
		}

		function closeSeatEditModal() {
			modalSeatEdit?.classList.remove("active")
			document.body.style.overflow = ""
		}

		modalSeatEditClose?.addEventListener("click", closeSeatEditModal)
		btnCancelSeatEdit?.addEventListener("click", closeSeatEditModal)

		formAdminSeatEdit?.addEventListener("submit", e => {
			e.preventDefault()
			const seatId = document.getElementById("se-seat-id")?.value
			const newType = document.getElementById("se-seat-type")?.value
			const newStatus = document.getElementById("se-seat-status")?.value

			if (!seatId) return

			for (const rowBlock of currentSeatLayout) {
				const seat = rowBlock.seats.find(s => s.id === seatId)
				if (seat) {
					seat.type = newType
					seat.status = newStatus
					break
				}
			}

			saveScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId, currentSeatLayout)
			closeSeatEditModal()
			renderSeatGrid()
			showToast(`✅ Đã cập nhật ghế ${seatId} thành công!`, "success")
		})

		function renderSeatsSection() {
			populateSeatCinemaAndScreenSelectors()
			if (!selectedSeatCinemaId || !selectedSeatScreenId) {
				if (adminSeatGrid) {
					adminSeatGrid.innerHTML = `
						<div style="padding: 40px; color: #a6adc8; text-align: center;">
							Vui lòng chọn cụm rạp và phòng chiếu hợp lệ để xem sơ đồ ghế.
						</div>
					`
				}
				return
			}

			const cinema = getCinemaById(selectedSeatCinemaId)
			const screen = cinema?.screens?.find(s => s.screenId === selectedSeatScreenId)

			const titleEl = document.getElementById("seat-screen-title")
			const metaEl = document.getElementById("seat-screen-meta")

			if (titleEl && screen) {
				titleEl.textContent = `Sơ Đồ Ghế: ${screen.name} (${screen.screenId})`
			}
			if (metaEl && screen && cinema) {
				metaEl.textContent = `Cụm rạp: ${cinema.name} | Định dạng: ${screen.type} | Âm thanh: ${screen.soundSystem || "Dolby 7.1"} | Tổng số ghế: ${screen.totalSeats || 120}`
			}

			currentSeatLayout = getScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId)
			renderSeatGrid()
		}

		function renderSeatGrid() {
			if (!adminSeatGrid) return

			let countStandard = 0
			let countVip = 0
			let countSweetbox = 0
			let countMaintenance = 0

			currentSeatLayout.forEach(rowBlock => {
				rowBlock.seats.forEach(s => {
					if (s.status === "maintenance") {
						countMaintenance++
					} else if (s.type === "vip") {
						countVip++
					} else if (s.type === "sweetbox") {
						countSweetbox++
					} else {
						countStandard++
					}
				})
			})

			const elStd = document.getElementById("seat-cnt-standard")
			const elVip = document.getElementById("seat-cnt-vip")
			const elSwb = document.getElementById("seat-cnt-sweetbox")
			const elMnt = document.getElementById("seat-cnt-maintenance")

			if (elStd) elStd.textContent = countStandard
			if (elVip) elVip.textContent = countVip
			if (elSwb) elSwb.textContent = countSweetbox
			if (elMnt) elMnt.textContent = countMaintenance

			adminSeatGrid.innerHTML = currentSeatLayout
				.map(rowBlock => {
					const seatsHtml = rowBlock.seats
						.map(seat => {
							const isMaint = seat.status === "maintenance"
							const maintClass = isMaint ? "seat-maintenance" : ""
							const typeClass = `seat-${seat.type}`
							const displayLabel = seat.type === "sweetbox" ? seat.id.replace(seat.row, "") : seat.id

							return `
								<div class="admin-seat-unit ${typeClass} ${maintClass}"
									data-seat-id="${seat.id}"
									data-row="${seat.row}"
									data-type="${seat.type}"
									data-status="${seat.status}"
									title="${seat.id} (${seat.type.toUpperCase()}) - ${isMaint ? "Đang Bảo Trì / Khóa" : "Hoạt Động"}">
									${displayLabel}
								</div>
							`
						})
						.join("")

					return `
						<div class="admin-seat-row">
							<button type="button" class="seat-row-toggle-btn"
								data-row="${rowBlock.row}"
								title="Nhấp để Bật / Tắt bảo trì toàn bộ hàng ghế ${rowBlock.row}">
								${rowBlock.row}
							</button>
							<div style="display: flex; gap: 6px; align-items: center;">
								${seatsHtml}
							</div>
							<button type="button" class="seat-row-toggle-btn"
								data-row="${rowBlock.row}"
								title="Nhấp để Bật / Tắt bảo trì toàn bộ hàng ghế ${rowBlock.row}">
								${rowBlock.row}
							</button>
						</div>
					`
				})
				.join("")

			// Attach row toggle handlers
			adminSeatGrid.querySelectorAll(".seat-row-toggle-btn").forEach(btn => {
				btn.addEventListener("click", () => {
					const rowLetter = btn.dataset.row
					const rowBlock = currentSeatLayout.find(r => r.row === rowLetter)
					if (!rowBlock) return

					const allCurrentlyMaintenance = rowBlock.seats.every(s => s.status === "maintenance")
					const nextStatus = allCurrentlyMaintenance ? "available" : "maintenance"

					rowBlock.seats.forEach(s => {
						s.status = nextStatus
					})

					saveScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId, currentSeatLayout)
					renderSeatGrid()
					showToast(
						`Hàng ${rowLetter}: Đã chuyển toàn bộ ghế sang ${nextStatus === "maintenance" ? "BẢO TRÌ / KHÓA" : "HOẠT ĐỘNG"}!`,
						"info",
					)
				})
			})

			// Attach seat unit click and dblclick handlers
			adminSeatGrid.querySelectorAll(".admin-seat-unit").forEach(unit => {
				unit.addEventListener("click", () => {
					const seatId = unit.dataset.seatId
					let targetSeat = null
					for (const rowBlock of currentSeatLayout) {
						targetSeat = rowBlock.seats.find(s => s.id === seatId)
						if (targetSeat) break
					}
					if (!targetSeat) return

					if (seatClickMode === "edit") {
						openSeatEditModal(targetSeat)
					} else {
						// Toggle maintenance status
						targetSeat.status = targetSeat.status === "maintenance" ? "available" : "maintenance"
						saveScreenSeatLayout(selectedSeatCinemaId, selectedSeatScreenId, currentSeatLayout)
						renderSeatGrid()
						showToast(
							`Ghế ${seatId}: ${targetSeat.status === "maintenance" ? "🔴 Đã chuyển sang Bảo trì / Khóa" : "🟢 Đã mở bán hoạt động"}`,
							"info",
						)
					}
				})

				unit.addEventListener("dblclick", () => {
					const seatId = unit.dataset.seatId
					let targetSeat = null
					for (const rowBlock of currentSeatLayout) {
						targetSeat = rowBlock.seats.find(s => s.id === seatId)
						if (targetSeat) break
					}
					if (targetSeat) openSeatEditModal(targetSeat)
				})
			})
		}
	} // Kết thúc initDashboard

	// Kiểm tra quyền truy cập ngay khi load trang
	checkAdminAccess()

	// Lắng nghe sự kiện chuyển đổi ngôn ngữ toàn trang
	window.addEventListener("betaLangChange", () => {
		translateDom(getSavedLang())
	})
})

