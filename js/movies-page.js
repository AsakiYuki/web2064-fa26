/**
 * Beta Cinemas - Movies List Page Logic
 */
import { setupHeaderAndFooter, openTrailerModal, showToast } from "./common.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let moviesData = null
	let genresList = []

	try {
		const [moviesRes, genresRes] = await Promise.all([
			fetch("/data/movies.json").then(r => r.json()),
			fetch("/data/genres.json").then(r => r.json()),
		])
		moviesData = moviesRes
		genresList = genresRes
	} catch (err) {
		console.error("Failed to fetch movies or genres:", err)
		return
	}

	let currentTab = "nowshowing"
	let searchQuery = ""
	let selectedGenre = "all"
	let selectedAge = "all"
	let selectedSort = "default"

	// Check if URL has tab param: e.g. ?tab=upcoming
	const urlParams = new URLSearchParams(window.location.search)
	if (urlParams.get("tab") && ["nowshowing", "upcoming", "special"].includes(urlParams.get("tab"))) {
		currentTab = urlParams.get("tab")
	}

	const searchInput = document.getElementById("movies-search-input")
	const clearSearchBtn = document.getElementById("clear-search-btn")
	const ageSelect = document.getElementById("age-filter-select")
	const sortSelect = document.getElementById("sort-select")
	const resetBtn = document.getElementById("reset-filters-btn")
	const genrePillsWrap = document.getElementById("genre-pills-bar")
	const gridContainer = document.getElementById("movies-grid-container")
	const tabButtons = document.querySelectorAll(".movies-nav-tabs .tab-btn")

	// Render Genre Pills
	if (genrePillsWrap && Array.isArray(genresList)) {
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

	// Update Tab Counts
	const countNow = moviesData.items.nowshowing?.length || 0
	const countUp = moviesData.items.upcoming?.length || 0
	const countSp = moviesData.items.special?.length || 0

	const cNowEl = document.getElementById("count-nowshowing")
	const cUpEl = document.getElementById("count-upcoming")
	const cSpEl = document.getElementById("count-special")
	if (cNowEl) cNowEl.textContent = countNow
	if (cUpEl) cUpEl.textContent = countUp
	if (cSpEl) cSpEl.textContent = countSp

	// Tab switcher
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

	// Search input event
	if (searchInput) {
		searchInput.addEventListener("input", e => {
			searchQuery = e.target.value.trim().toLowerCase()
			if (clearSearchBtn) {
				clearSearchBtn.classList.toggle("visible", searchQuery.length > 0)
			}
			renderFilteredMovies()
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

	// Age filter
	if (ageSelect) {
		ageSelect.addEventListener("change", e => {
			selectedAge = e.target.value
			renderFilteredMovies()
		})
	}

	// Sort select
	if (sortSelect) {
		sortSelect.addEventListener("change", e => {
			selectedSort = e.target.value
			renderFilteredMovies()
		})
	}

	// Reset filters
	if (resetBtn) {
		resetBtn.addEventListener("click", () => {
			if (searchInput) searchInput.value = ""
			searchQuery = ""
			if (clearSearchBtn) clearSearchBtn.classList.remove("visible")
			selectedGenre = "all"
			if (genrePillsWrap) {
				genrePillsWrap.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"))
				genrePillsWrap.querySelector('[data-genre="all"]')?.classList.add("active")
			}
			selectedAge = "all"
			if (ageSelect) ageSelect.value = "all"
			selectedSort = "default"
			if (sortSelect) sortSelect.value = "default"
			renderFilteredMovies()
		})
	}

	function renderFilteredMovies() {
		if (!gridContainer || !moviesData) return

		let list = [...(moviesData.items[currentTab] || [])]

		// Đây là phần tìm kiếm đã được chỉnh sửa
		if (searchQuery) {
			list = list.filter(
				m =>
					(m.title && m.title.toLowerCase().includes(searchQuery)) ||
					(m.originalTitle && m.originalTitle.toLowerCase().includes(searchQuery)) ||
					(m.director && m.director.toLowerCase().includes(searchQuery)) ||
					(m.cast && m.cast.some(c => c.toLowerCase().includes(searchQuery))),
			)
		}

		// Filter by genre
		if (selectedGenre !== "all") {
			list = list.filter(
				m =>
					(m.genreIds && m.genreIds.includes(selectedGenre)) ||
					(m.genre && m.genre.toLowerCase().includes(selectedGenre.replace("-", " "))),
			)
		}

		// Filter by age
		if (selectedAge !== "all") {
			list = list.filter(m => m.badge && m.badge.toLowerCase() === selectedAge.toLowerCase())
		}

		// Sort
		if (selectedSort === "rating-desc") {
			list.sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0))
		} else if (selectedSort === "date-desc") {
			list.sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))
		} else if (selectedSort === "title-asc") {
			list.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
		}

		if (!list.length) {
			gridContainer.innerHTML = `
				<div class="movies-empty-state" style="grid-column: 1 / -1;">
					<div class="empty-icon">🔍</div>
					<h3>Không tìm thấy phim phù hợp</h3>
					<p>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc thể loại / độ tuổi bạn nhé.</p>
					<button type="button" id="btn-empty-reset">Đặt lại bộ lọc</button>
				</div>
			`
			document.getElementById("btn-empty-reset")?.addEventListener("click", () => {
				resetBtn?.click()
			})
			return
		}

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

	renderFilteredMovies()
})
