/**
 * Beta Cinemas - Movies List Page Logic
 * Render danh sách phim từ LocalStorage, tìm kiếm & bộ lọc nâng cao
 */
import { setupHeaderAndFooter, openTrailerModal, showToast } from "./common.js"
import { getMoviesData, getGenres, filterMovies } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	// Đọc dữ liệu phim & thể loại từ LocalStorage
	const moviesData = getMoviesData()
	const genresList = getGenres()

	if (!moviesData || !moviesData.items) {
		console.error("Không thể tải dữ liệu phim từ LocalStorage")
		return
	}

	// ===== STATE =====
	let currentTab = "nowshowing"
	let searchQuery = ""
	let selectedGenre = "all"
	let selectedAge = "all"
	let selectedFormat = "all"
	let selectedSort = "default"

	// Check URL params: ?tab=upcoming, ?search=keyword
	const urlParams = new URLSearchParams(window.location.search)
	if (urlParams.get("tab") && ["nowshowing", "upcoming", "special"].includes(urlParams.get("tab"))) {
		currentTab = urlParams.get("tab")
	}
	if (urlParams.get("search")) {
		searchQuery = urlParams.get("search").trim().toLowerCase()
	}
	if (urlParams.get("genre")) {
		selectedGenre = urlParams.get("genre")
	}

	// ===== DOM ELEMENTS =====
	const searchInput = document.getElementById("movies-search-input")
	const clearSearchBtn = document.getElementById("clear-search-btn")
	const ageSelect = document.getElementById("age-filter-select")
	const formatSelect = document.getElementById("format-filter-select")
	const sortSelect = document.getElementById("sort-select")
	const resetBtn = document.getElementById("reset-filters-btn")
	const genrePillsWrap = document.getElementById("genre-pills-bar")
	const gridContainer = document.getElementById("movies-grid-container")
	const tabButtons = document.querySelectorAll(".movies-nav-tabs .tab-btn")

	// ===== PRE-FILL SEARCH từ URL =====
	if (searchQuery && searchInput) {
		searchInput.value = searchQuery
		if (clearSearchBtn) clearSearchBtn.classList.add("visible")
	}

	// ===== RENDER GENRE PILLS =====
	function renderGenrePills() {
		if (!genrePillsWrap || !Array.isArray(genresList)) return

		genrePillsWrap.innerHTML = `
			<span class="genre-pills-label">Thể loại:</span>
			<button type="button" class="genre-pill ${selectedGenre === "all" ? "active" : ""}" data-genre="all">Tất cả</button>
			${genresList
				.map(
					g => `
				<button type="button" class="genre-pill ${selectedGenre === g.slug ? "active" : ""}" data-genre="${g.slug}">${g.name}</button>
			`,
				)
				.join("")}
		`

		genrePillsWrap.querySelectorAll(".genre-pill").forEach(pill => {
			pill.addEventListener("click", () => {
				genrePillsWrap.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"))
				pill.classList.add("active")
				selectedGenre = pill.dataset.genre
				renderFilteredMovies()
			})
		})
	}

	renderGenrePills()

	// ===== UPDATE TAB COUNTS =====
	function updateTabCounts() {
		const countNow = moviesData.items.nowshowing?.length || 0
		const countUp = moviesData.items.upcoming?.length || 0
		const countSp = moviesData.items.special?.length || 0

		const cNowEl = document.getElementById("count-nowshowing")
		const cUpEl = document.getElementById("count-upcoming")
		const cSpEl = document.getElementById("count-special")
		if (cNowEl) cNowEl.textContent = countNow
		if (cUpEl) cUpEl.textContent = countUp
		if (cSpEl) cSpEl.textContent = countSp
	}

	updateTabCounts()

	// ===== TAB SWITCHER =====
	tabButtons.forEach(btn => {
		if (btn.dataset.tab === currentTab) btn.classList.add("active")
		else btn.classList.remove("active")

		btn.addEventListener("click", () => {
			tabButtons.forEach(b => b.classList.remove("active"))
			btn.classList.add("active")
			currentTab = btn.dataset.tab
			renderFilteredMovies()
		})
	})

	// ===== SEARCH INPUT =====
	if (searchInput) {
		let searchDebounceTimer = null
		searchInput.addEventListener("input", e => {
			clearTimeout(searchDebounceTimer)
			searchDebounceTimer = setTimeout(() => {
				searchQuery = e.target.value.trim().toLowerCase()
				if (clearSearchBtn) {
					clearSearchBtn.classList.toggle("visible", searchQuery.length > 0)
				}
				renderFilteredMovies()
			}, 250) // Debounce 250ms để tối ưu
		})
	}

	if (clearSearchBtn) {
		clearSearchBtn.addEventListener("click", () => {
			searchInput.value = ""
			searchQuery = ""
			clearSearchBtn.classList.remove("visible")
			renderFilteredMovies()
			searchInput.focus()
		})
	}

	// ===== AGE FILTER =====
	if (ageSelect) {
		ageSelect.addEventListener("change", e => {
			selectedAge = e.target.value
			renderFilteredMovies()
		})
	}

	// ===== FORMAT FILTER (2D / 3D / IMAX) =====
	if (formatSelect) {
		formatSelect.addEventListener("change", e => {
			selectedFormat = e.target.value
			renderFilteredMovies()
		})
	}

	// ===== SORT SELECT =====
	if (sortSelect) {
		sortSelect.addEventListener("change", e => {
			selectedSort = e.target.value
			renderFilteredMovies()
		})
	}

	// ===== RESET ALL FILTERS =====
	if (resetBtn) {
		resetBtn.addEventListener("click", () => {
			if (searchInput) searchInput.value = ""
			searchQuery = ""
			if (clearSearchBtn) clearSearchBtn.classList.remove("visible")

			selectedGenre = "all"
			renderGenrePills() // Re-render pills to reset active state

			selectedAge = "all"
			if (ageSelect) ageSelect.value = "all"

			selectedFormat = "all"
			if (formatSelect) formatSelect.value = "all"

			selectedSort = "default"
			if (sortSelect) sortSelect.value = "default"

			renderFilteredMovies()
			showToast("Đã đặt lại tất cả bộ lọc.", "info", 2000)
		})
	}

	// ===== MAIN RENDER FUNCTION =====
	function renderFilteredMovies() {
		if (!gridContainer || !moviesData) return

		// Sử dụng filterMovies từ storage module
		const list = filterMovies({
			tab: currentTab,
			genre: selectedGenre,
			age: selectedAge,
			format: selectedFormat,
			query: searchQuery,
			sort: selectedSort !== "default" ? selectedSort : undefined,
		})

		// Hiển thị kết quả tìm kiếm count
		updateResultsCount(list.length)

		// Empty state
		if (!list.length) {
			gridContainer.innerHTML = `
				<div class="movies-empty-state" style="grid-column: 1 / -1;">
					<div class="empty-icon">🔍</div>
					<h3>Không tìm thấy phim phù hợp</h3>
					<p>${searchQuery
						? `Không có kết quả cho "<strong>${escapeHtml(searchQuery)}</strong>". `
						: ""
					}Thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc thể loại / độ tuổi bạn nhé.</p>
					<button type="button" id="btn-empty-reset">Đặt lại bộ lọc</button>
				</div>
			`
			document.getElementById("btn-empty-reset")?.addEventListener("click", () => {
				resetBtn?.click()
			})
			return
		}

		// Render movie cards
		gridContainer.innerHTML = list
			.map(m => {
				const isUpcoming = currentTab === "upcoming"
				const isSpecial = currentTab === "special"

				return `
				<article class="movie-card" id="card-${m.id}">
					<div class="movie-poster-wrap">
						<a href="/movie-detail.html?id=${m.id}" aria-label="Xem chi tiết ${m.title}">
							<img src="${m.poster}" alt="${m.title}" style="${m.posterStyle || ""}" loading="lazy" />
						</a>

						${m.badge ? `<span class="badge-age badge-${(m.badge || "").toLowerCase()}">${m.badge}</span>` : ""}
						${m.ratingScore ? `<span class="badge-rating">⭐ ${m.ratingScore}</span>` : ""}
						${m.hot && !isSpecial ? `<span class="badge-hot-ribbon">HOT</span>` : ""}
						${m.specialTag || isSpecial ? `<span class="badge-format-tag">${m.specialTag || "IMAX"}</span>` : ""}

						<button type="button" class="quick-play-btn" data-trailer="${m.trailerUrl || ""}" data-title="${m.title}" title="Xem trailer nhanh">
							<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
						</button>

						<div class="movie-poster-overlay">
							<p class="overlay-synopsis">${m.synopsis || "Nhấn để xem thông tin chi tiết và lịch chiếu tại rạp."}</p>
						</div>
					</div>

					<div class="movie-card-info">
						<h2 class="movie-card-title">
							<a href="/movie-detail.html?id=${m.id}">${m.title}</a>
						</h2>
						${m.originalTitle ? `<div class="movie-card-origin-title">${m.originalTitle}</div>` : ""}

						<p class="movie-meta-item">
							<span class="meta-label">Thể loại:</span>
							<span>${m.genre || "Đang cập nhật"}</span>
						</p>

						${
							isUpcoming
								? `
							<p class="movie-meta-item">
								<span class="meta-label">Khởi chiếu:</span>
								<span style="color:#d97706; font-weight:700;">${m.releaseDate}</span>
							</p>
						`
								: `
							<p class="movie-meta-item">
								<span class="meta-label">Thời lượng:</span>
								<span>${m.duration || "105 phút"}</span>
							</p>
						`
						}

						<div class="movie-card-actions">
							${
								isUpcoming
									? `
								<button type="button" class="btn-buy-ticket btn-remind" data-remind-title="${m.title}">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
										<path d="M13.73 21a2 2 0 01-3.46 0"></path>
									</svg>
									Nhắc Tôi
								</button>
							`
									: `
								<a href="/movie-detail.html?id=${m.id}#showtimes" class="btn-buy-ticket">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 010 4H5a2 2 0 010-4zM5 13h14a2 2 0 010 4H5a2 2 0 010-4z" />
									</svg>
									MUA VÉ
								</a>
							`
							}
							<a href="/movie-detail.html?id=${m.id}" class="btn-details">
								Chi Tiết
							</a>
						</div>
					</div>
				</article>
			`
			})
			.join("")

		// Attach quick play trailer buttons
		gridContainer.querySelectorAll(".quick-play-btn").forEach(btn => {
			btn.addEventListener("click", e => {
				e.stopPropagation()
				const trailer = btn.dataset.trailer
				const title = btn.dataset.title
				openTrailerModal(trailer, title)
			})
		})

		// Attach "Nhắc tôi" buttons
		gridContainer.querySelectorAll(".btn-remind").forEach(btn => {
			btn.addEventListener("click", () => {
				const title = btn.dataset.remindTitle
				showToast(`🔔 Đã đăng ký nhận thông báo khi có lịch chiếu cho phim "${title}"!`, "success")
			})
		})
	}

	// ===== HELPER: Update result count =====
	function updateResultsCount(count) {
		let countEl = document.getElementById("movies-results-count")
		if (!countEl) {
			countEl = document.createElement("div")
			countEl.id = "movies-results-count"
			countEl.className = "movies-results-count"
			const filterBar = document.querySelector(".movies-filter-bar")
			if (filterBar) filterBar.appendChild(countEl)
		}

		// Chỉ hiển thị khi có filter active
		const hasFilters = searchQuery || selectedGenre !== "all" || selectedAge !== "all" || selectedFormat !== "all"
		if (hasFilters) {
			countEl.textContent = `Tìm thấy ${count} phim phù hợp`
			countEl.style.display = "block"
		} else {
			countEl.style.display = "none"
		}
	}

	// ===== HELPER: Escape HTML =====
	function escapeHtml(text) {
		const div = document.createElement("div")
		div.textContent = text
		return div.innerHTML
	}

	// ===== INITIAL RENDER =====
	renderFilteredMovies()
})
