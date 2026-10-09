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
	deleteBookingTicket,
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
		const isPreview = new URLSearchParams(window.location.search).has("preview")

		if (isAdmin || isPreview) {
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
		}

		const topbarTitle = document.getElementById("topbar-title")
		const topbarSub = document.getElementById("topbar-sub")

		const tabTitles = {
			overview: { title: "Tổng Quan Dashboard", sub: "Thống kê hoạt động toàn hệ thống Beta Cinemas" },
			movies: { title: "Quản Lý Danh Sách Phim", sub: "Thêm mới, cập nhật thông tin và xóa phim trong LocalStorage" },
			showtimes: { title: "Quản Lý Lịch & Suất Chiếu", sub: "Cấu hình phòng chiếu, khung giờ và giá vé theo từng cụm rạp" },
			concessions: { title: "Quản Lý Combo Bắp Nước", sub: "Cập nhật menu bắp nước, định giá bán và khuyến mãi" },
			bookings: { title: "Quản Lý Đơn Đặt Vé", sub: "Danh sách vé điện tử đã đặt của khách hàng trên hệ thống" },
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
				if (b.status === "paid" || b.status === "done") {
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

			if (kpiRev) kpiRev.textContent = formatCurrency(totalRevenue)
			if (kpiPaid) kpiPaid.textContent = `${paidOrdersCount} đơn hợp lệ`
			if (kpiTickets) kpiTickets.textContent = `${totalSeatsSold} vé`
			if (kpiTotalOrders) kpiTotalOrders.textContent = `${paidOrdersCount} đơn hàng`

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
							const isPaid = b.status === "paid" || b.paymentStatus === "paid"
							const isDone = b.status === "done"
							const badgeClass = isPaid ? "badge-nowshowing" : isDone ? "badge-upcoming" : "badge-age"
							const badgeText = isPaid ? "🟢 Đã nhận tiền" : isDone ? "🔵 Đã xem" : "🔴 Đã hủy"

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

			if (badgeMv) badgeMv.textContent = totalMovies
			if (badgeSt) badgeSt.textContent = totalSlots
			if (badgeCc) badgeCc.textContent = concessionsData?.items?.length || 0
			if (badgeBk) badgeBk.textContent = bookings.length
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
							<div class="row-actions" style="justify-content: center;">
								<button type="button" class="btn-action-icon btn-edit-movie" data-id="${m.id}" title="Chỉnh sửa phim">✏️</button>
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
		const dateInput = document.getElementById("st-date-input")
		const showtimesContainer = document.getElementById("showtimes-content-container")

		// Pre-fill cinemas dropdown
		const cinemasList = getCinemas()
		if (cinemaSelect) {
			cinemaSelect.innerHTML = cinemasList
				.map(c => `<option value="${c.id}">${c.name}</option>`)
				.join("")
		}

		// Pre-fill date input (default 2026-09-26 or today)
		if (dateInput) {
			dateInput.value = "2026-09-26"
		}

		cinemaSelect?.addEventListener("change", renderShowtimesSection)
		dateInput?.addEventListener("change", renderShowtimesSection)

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
			const selectedDate = dateInput?.value || "2026-09-26"

			const allShowtimes = getShowtimes() || []
			const dayCinemaEntry = allShowtimes.find(st => st.date === selectedDate && st.cinemaId === selectedCinema)

			if (!dayCinemaEntry || !dayCinemaEntry.schedules || dayCinemaEntry.schedules.length === 0) {
				showtimesContainer.innerHTML = `
				<div style="text-align: center; padding: 48px 20px; background: #181825; border-radius: 12px; border: 1px dashed rgba(88, 91, 112, 0.4);">
					<div style="font-size: 40px; margin-bottom: 12px;">📅</div>
					<h3 style="color: #cdd6f4; font-size: 17px; margin-bottom: 6px;">Chưa có lịch chiếu nào cho ngày ${formatDateVN(selectedDate)}</h3>
					<p style="color: #a6adc8; font-size: 13px; margin-bottom: 20px;">Hãy tạo suất chiếu đầu tiên cho rạp này để khán giả có thể đặt vé.</p>
					<button type="button" class="btn-admin-primary" id="btn-empty-add-showtime">
						➕ Thêm Suất Chiếu Ngay
					</button>
				</div>
			`
				document.getElementById("btn-empty-add-showtime")?.addEventListener("click", openShowtimeModal)
				return
			}

			showtimesContainer.innerHTML = dayCinemaEntry.schedules
				.map(sc => {
					return `
					<div class="movie-showtime-block" id="schedule-block-${sc.movieId}">
						<div class="ms-head">
							<div class="ms-movie-title">
								<span>🎬</span>
								<span>${sc.movieTitle}</span>
								<span class="ms-format-tag">${sc.screenName || "Phòng 1"} • ${sc.format || "2D"}</span>
							</div>
							<div style="display: flex; gap: 8px;">
								<button type="button" class="btn-admin-secondary btn-add-slot-for-movie" data-movie-id="${sc.movieId}" data-movie-title="${sc.movieTitle}" data-screen="${sc.screenName}" data-format="${sc.format}" style="font-size: 12px; padding: 5px 10px;">
									➕ Thêm Giờ Chiếu
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
										<button type="button" class="btn-edit-slot" data-movie-id="${sc.movieId}" data-time="${s.time}" data-price="${s.price}" data-seats="${s.availableSeats}" title="Sửa giờ hoặc giá vé">✏️</button>
										<button type="button" class="btn-del-slot" data-movie-id="${sc.movieId}" data-time="${s.time}" title="Xóa suất chiếu này">✕</button>
									</div>
								</div>
							`
							)
							.join("")}
						</div>
					</div>
				`
				})
				.join("")

			// Attach Add Slot for Movie buttons
			showtimesContainer.querySelectorAll(".btn-add-slot-for-movie").forEach(btn => {
				btn.addEventListener("click", () => {
					openShowtimeModal({
						cinemaId: selectedCinema,
						date: selectedDate,
						movieId: btn.dataset.movieId,
						screenName: btn.dataset.screen,
						format: btn.dataset.format,
					})
				})
			})

			// Attach Delete entire Movie schedule
			showtimesContainer.querySelectorAll(".btn-del-movie-schedule").forEach(btn => {
				btn.addEventListener("click", () => {
					const mId = btn.dataset.movieId
					const mTitle = btn.dataset.movieTitle
					if (confirm(`Bạn có chắc muốn xóa tất cả suất chiếu của phim "${mTitle}" trong ngày này không?`)) {
						deleteMovieSchedule(selectedCinema, selectedDate, mId)
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
					const time = btn.dataset.time
					const price = btn.dataset.price
					const seats = btn.dataset.seats
					openShowtimeModal({
						isEdit: true,
						cinemaId: selectedCinema,
						date: selectedDate,
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
				btn.addEventListener("click", () => {
					const mId = btn.dataset.movieId
					const time = btn.dataset.time
					if (confirm(`Xóa suất chiếu lúc ${time}?`)) {
						deleteShowtimeSlot(selectedCinema, selectedDate, mId, time)
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

			if (dateInputEl) dateInputEl.value = options.date || dateInput?.value || "2026-09-26"
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
		showtimeForm?.addEventListener("submit", e => {
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
				updateShowtimeSlot({
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
				showToast(`✅ Đã cập nhật suất chiếu ${time} cho phim "${movieTitle}"!`, "success")
			} else {
				addShowtimeSlot({
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
				showToast(`✅ Đã thêm suất chiếu mới ${time} cho phim "${movieTitle}"!`, "success")
			}

			closeShowtimeModal()
			// Sync select values with current inputs
			if (cinemaSelect) cinemaSelect.value = cinemaId
			if (dateInput) dateInput.value = date
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
						<div class="cc-card-actions">
							<button type="button" class="btn-action-icon btn-edit-concession" data-id="${it.id}" title="Sửa thông tin và giá bán">✏️</button>
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
			const cntPending = bookings.filter(b => b.status === "pending").length
			const cntConfirmed = bookings.filter(b => b.status === "confirmed").length
			const cntPaid = bookings.filter(b => b.status === "paid" || b.paymentStatus === "paid").length
			const cntDone = bookings.filter(b => b.status === "done").length
			const cntCancelled = bookings.filter(b => b.status === "cancelled").length

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
        // Chờ xác nhận đặt vé
        if (currentBookingStatusFilter === "pending") {
            return b.bookingStatus === "pending"
        }

        // Đã xác nhận đặt vé
        if (currentBookingStatusFilter === "confirmed") {
            return b.bookingStatus === "confirmed"
        }

        // Đã xác nhận thanh toán
        if (currentBookingStatusFilter === "paid") {
            return b.paymentStatus === "paid"
        }

        // Các trạng thái cũ khác
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
					const isPending = b.bookingStatus === "pending"
					const isConfirmed = b.bookingStatus === "confirmed"
					const isPaid = b.paymentStatus === "paid"
					const isDone = b.status === "done"
					const isCancelled = b.status === "cancelled"
					const methodText = (b.paymentMethod || "QR").toUpperCase()

					// Cột 1. Xác nhận đặt vé
					let colStep1 = ""
					if (isPending) {
						colStep1 = `<button type="button" class="btn-action-order-confirm" data-id="${b.id}" style="background: rgba(250, 179, 135, 0.15); color: #fab387; border: 1px solid rgba(250, 179, 135, 0.4); border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer;">⏳ Xác Nhận Đơn</button>`
					} else if (isCancelled) {
						colStep1 = `<span style="color: #f38ba8; font-size: 12px; font-weight: 700;">Đơn Đã Hủy</span>`
					} else {
						colStep1 = `<span style="color: #a6e3a1; font-size: 12px; font-weight: 700;">✓ Đã Xác Nhận</span>`
					}

					// Cột 2. Xác nhận thanh toán
					let colStep2 = ""
					if (isPending) {
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
								${!isDone && isPaid
							? `<button type="button" class="btn-action-icon btn-checkin-ticket" data-id="${b.id}" style="color: #a6e3a1;" title="Soát vé nhanh (Xác nhận khách đã vào rạp)">✓</button>`
							: ""
						}
								${!isCancelled
							? `<button type="button" class="btn-action-icon btn-cancel-admin-ticket" data-id="${b.id}" style="color: #fab387;" title="Hủy vé">✕</button>`
							: ""
						}
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
					await confirmTicketPayment(id)
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
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					if (confirm(`Bạn có chắc chắn muốn hủy đơn vé ${id} này không?`)) {
						cancelBookingTicket(id)
						showToast(`Đã chuyển trạng thái đơn vé ${id} sang "Đã hủy".`, "info")
						renderAdminBookingsTable()
						renderOverviewDashboard()
						updateAllBadges()
					}
				})
			})

			// 5. Permanent Delete
			bookingsTableTbody.querySelectorAll(".btn-delete-admin-ticket").forEach(btn => {
				btn.addEventListener("click", () => {
					const id = btn.dataset.id
					if (confirm(`⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn vé ${id} khỏi hệ thống không? Dữ liệu này sẽ mất hoàn toàn khỏi LocalStorage.`)) {
						deleteBookingTicket(id)
						showToast(`Đã xóa vĩnh viễn đơn vé ${id}.`, "info")
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

			const qrSvg = generateQRCodeSVG(`BETATICKET|${t.id}|${t.time} ${t.date}|${t.seats}`, {
				size: 160,
				darkColor: "#11111b",
				lightColor: "#cdd6f4",
				includeLogo: true,
			})

			const pMethod = (t.paymentMethod || "QR").toUpperCase()

			body.innerHTML = `
			<div class="eticket-success-page-wrap" style="margin: 0; box-shadow: none; max-width: 100%;">
				<div class="eticket-top-banner" style="background: #10b981;">
					<div class="et-success-badge" style="color: #10b981;">✓</div>
					<h2 style="color:#11111b; font-size: 20px; font-weight:900; margin:0 0 4px; text-transform:uppercase;">ĐÃ NHẬN TIỀN - VÉ HỢP LỆ</h2>
					<p style="font-size: 13px; color: rgba(17,17,27,0.85); margin:0;">Mã vé: ${t.id} • Thanh toán qua: <strong>${pMethod}</strong> • Beta Admin Verify</p>
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
						<div class="qr-hint">Vé đã thanh toán thành công - Xuất trình mã này tại Kiosk/Quầy soát vé</div>
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
									<span class="et-lbl">Tổng Tiền Đã Thu</span>
									<div class="et-val val-gold" style="font-size: 18px;">${formatCurrency(t.total)}</div>
								</div>
								<div style="text-align: right;">
									<span class="et-lbl">Trạng thái</span>
									<div style="color: #10b981; font-weight: 800; font-size: 13px;">🟢 ĐÃ NHẬN TIỀN (${pMethod})</div>
								</div>
							</div>
						</div>
					</div>
					<div class="et-barcode-wrap">
						<div class="barcode-strip"></div>
						<div class="barcode-number">${t.id} - VERIFIED & RECEIVED BY BETA ADMIN</div>
					</div>
				</div>
			</div>
		`

			adminTicketModal.classList.add("active")
			document.body.style.overflow = "hidden"
		}
	} // Kết thúc initDashboard

	// Kiểm tra quyền truy cập ngay khi load trang
	checkAdminAccess()

	// Lắng nghe sự kiện chuyển đổi ngôn ngữ toàn trang
	window.addEventListener("betaLangChange", () => {
		translateDom(getSavedLang())
	})
})

