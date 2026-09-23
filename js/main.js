/**
 * Beta Cinemas - Homepage Dynamic Rendering & Interactivity
 * Modular data loading via domain-specific JSON files.
 */

document.addEventListener("DOMContentLoaded", async () => {
	try {
		const [cinemas, moviesData, banners, footerCinemas] = await Promise.all([
			fetch("/data/cinemas.json").then(r => r.json()),
			fetch("/data/movies.json").then(r => r.json()),
			fetch("/data/banners.json").then(r => r.json()),
			fetch("/data/footer.json").then(r => r.json()),
		])

		renderCinemaSelector(cinemas)
		renderHeroSlider(banners.heroSlides)
		renderSideBanners(banners.sideBanners)
		renderMovieTabs(moviesData.tabs)
		renderMovieGrids(moviesData.items)
		renderFooterCinemas(footerCinemas)

		initCinemaDropdownEvents()
		initHeroSliderEvents()
		initMovieTabEvents()
		initBackToTopEvent()
	} catch (err) {
		console.error("Failed to load homepage data:", err)
	}
})

/* ==========================================================================
   RENDER FUNCTIONS
   ========================================================================== */

/** Render Header Cinema Selector */
function renderCinemaSelector(cinemas) {
	const ul = document.getElementById("cinema-dropdown-ul")
	if (!ul || !Array.isArray(cinemas)) return

	ul.innerHTML = cinemas
		.map(
			item => `
		<li class="cinema-dropdown-item ${item.active ? "active" : ""}" data-city="${item.city}" role="option" tabindex="0">
			${item.city} <span class="ci-arrow">›</span>
		</li>
	`,
		)
		.join("")
}

/** Render Hero Slider */
function renderHeroSlider(slides) {
	const track = document.getElementById("hero-track")
	const dotsWrap = document.getElementById("hero-dots")
	if (!track || !dotsWrap || !Array.isArray(slides)) return

	track.innerHTML = slides
		.map(
			(slide, idx) => `
		<div class="hero-slide ${idx === 0 ? "active" : ""}">
			<img src="${slide.image}" alt="${slide.title}" class="hero-img" style="${slide.imageStyle || ""}" />
			<div class="hero-gradient"></div>
		</div>
	`,
		)
		.join("")

	dotsWrap.innerHTML = slides
		.map(
			(_, idx) => `
		<button class="hero-dot ${idx === 0 ? "active" : ""}" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>
	`,
		)
		.join("")
}

/** Render Side Banners */
function renderSideBanners(sideBanners) {
	if (!sideBanners) return

	const createBannerHTML = banner => `
		<div class="side-banner-card">
			<div class="sb-logo">
				<img src="${banner.logo}" alt="Beta Cinemas" />
			</div>
			<div class="sb-badge">${banner.badge}</div>
			<div class="sb-discount">${banner.discount}</div>
			<div class="sb-sub">${banner.sub}</div>
			<img src="${banner.image}" alt="Combo ưu đãi" class="sb-img" />
			<div class="sb-price-old">${banner.priceOld}</div>
			<div class="sb-price-new">${banner.priceNew}</div>
			<button class="sb-cta" id="${banner.ctaId}">${banner.ctaText}</button>
		</div>
	`

	const leftWrap = document.getElementById("side-left-card")
	const rightWrap = document.getElementById("side-right-card")

	if (leftWrap && sideBanners.left) leftWrap.innerHTML = createBannerHTML(sideBanners.left)
	if (rightWrap && sideBanners.right) rightWrap.innerHTML = createBannerHTML(sideBanners.right)
}

/** Render Movie Tabs */
function renderMovieTabs(tabs) {
	const tabsWrap = document.getElementById("movie-tabs")
	if (!tabsWrap || !Array.isArray(tabs)) return

	tabsWrap.innerHTML = tabs
		.map(
			tab => `
		<button class="movie-tab ${tab.active ? "active" : ""}" id="tab-${tab.id}" role="tab" data-tab="${tab.id}">
			${tab.label}
		</button>
	`,
		)
		.join("")
}

/** Render Movie Cards in Grids */
function renderMovieGrids(movies) {
	if (!movies) return

	// Now Showing
	const nowshowingGrid = document.getElementById("tab-content-nowshowing")
	if (nowshowingGrid && Array.isArray(movies.nowshowing)) {
		nowshowingGrid.innerHTML = movies.nowshowing
			.map(
				m => `
			<div class="mc" id="mc-${m.id}">
				<a href="#" class="mc-poster-wrap">
					<img src="${m.poster}" alt="${m.title}" class="mc-poster" style="${m.posterStyle || ""}" />
					${m.badge ? `<span class="mc-badge ${m.badgeClass || ""}">${m.badge}</span>` : ""}
					${m.hot ? `<span class="mc-hot">HOT</span>` : ""}
					<div class="mc-play-btn">
						<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
					</div>
				</a>
				<div class="mc-body">
					<h3 class="mc-title">${m.title}</h3>
					<p class="mc-meta"><span class="mc-label">Thể loại:</span> ${m.genre}</p>
					<p class="mc-meta"><span class="mc-label">Thời lượng:</span> ${m.duration}</p>
					<button class="mc-btn" id="${m.buyId}">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 010 4H5a2 2 0 010-4zM5 13h14a2 2 0 010 4H5a2 2 0 010-4z" />
						</svg>
						${m.buyText || "MUA VÉ"}
					</button>
				</div>
			</div>
		`,
			)
			.join("")
	}

	// Upcoming
	const upcomingGrid = document.getElementById("tab-content-upcoming")
	if (upcomingGrid && Array.isArray(movies.upcoming)) {
		upcomingGrid.innerHTML = movies.upcoming
			.map(
				m => `
			<div class="mc" id="mc-${m.id}">
				<a href="#" class="mc-poster-wrap">
					<img src="${m.poster}" alt="${m.title}" class="mc-poster" style="${m.posterStyle || ""}" />
					${m.badge ? `<span class="mc-badge ${m.badgeClass || ""}">${m.badge}</span>` : ""}
					<div class="mc-play-btn">
						<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
					</div>
				</a>
				<div class="mc-body">
					<h3 class="mc-title">${m.title}</h3>
					<p class="mc-meta"><span class="mc-label">Khởi chiếu:</span> ${m.releaseDate}</p>
					<button class="mc-btn ${m.outline ? "mc-btn--outline" : ""}" id="${m.buyId}">
						${m.buyText || "Nhắc Tôi"}
					</button>
				</div>
			</div>
		`,
			)
			.join("")
	}

	// Special
	const specialGrid = document.getElementById("tab-content-special")
	if (specialGrid && Array.isArray(movies.special)) {
		specialGrid.innerHTML = movies.special
			.map(
				m => `
			<div class="mc" id="mc-${m.id}">
				<a href="#" class="mc-poster-wrap">
					<img src="${m.poster}" alt="${m.title}" class="mc-poster" style="${m.posterStyle || ""}" ${
					m.fallbackPoster ? `onerror="this.src='${m.fallbackPoster}'"` : ""
				} />
					${m.badge ? `<span class="mc-badge ${m.badgeClass || ""}">${m.badge}</span>` : ""}
					${m.specialTag ? `<span class="mc-special-tag">${m.specialTag}</span>` : ""}
					<div class="mc-play-btn">
						<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
					</div>
				</a>
				<div class="mc-body">
					<h3 class="mc-title">${m.title}</h3>
					<p class="mc-meta"><span class="mc-label">Định dạng:</span> ${m.format}</p>
					<button class="mc-btn" id="${m.buyId}">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 010 4H5a2 2 0 010-4zM5 13h14a2 2 0 010 4H5a2 2 0 010-4z" />
						</svg>
						${m.buyText || "MUA VÉ"}
					</button>
				</div>
			</div>
		`,
			)
			.join("")
	}
}

/** Render Footer Cinema Cluster List */
function renderFooterCinemas(footerCinemas) {
	const ul = document.getElementById("cinema-cluster-ul")
	if (!ul || !Array.isArray(footerCinemas)) return

	ul.innerHTML = footerCinemas
		.map(
			fc => `
		<li>
			<a href="#" id="${fc.id}">${fc.name} - Hotline ${fc.hotline}</a>
		</li>
	`,
		)
		.join("")
}

/* ==========================================================================
   EVENT HANDLERS & INTERACTIVITY
   ========================================================================== */

/** Cinema Dropdown Selector Logic */
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
			lbl.textContent = "Beta " + this.dataset.city
			dd.querySelectorAll(".cinema-dropdown-item").forEach(el => el.classList.remove("active"))
			this.classList.add("active")
			closeDD()
		})
		item.addEventListener("keydown", e => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault()
				item.click()
			}
			if (e.key === "Escape") closeDD()
			if (e.key === "ArrowDown") {
				e.preventDefault()
				;(item.nextElementSibling || item).focus()
			}
			if (e.key === "ArrowUp") {
				e.preventDefault()
				;(item.previousElementSibling || item).focus()
			}
		})
	})

	document.addEventListener("click", e => {
		if (!wrap.contains(e.target)) closeDD()
	})
	document.addEventListener("keydown", e => {
		if (e.key === "Escape") closeDD()
	})
}

/** Hero Slider Controls */
function initHeroSliderEvents() {
	const slides = document.querySelectorAll(".hero-slide")
	const dots = document.querySelectorAll(".hero-dot")
	const prevBtn = document.getElementById("hero-prev")
	const nextBtn = document.getElementById("hero-next")

	if (!slides.length) return

	let current = 0
	let autoTimer

	function goTo(idx) {
		slides[current]?.classList.remove("active")
		dots[current]?.classList.remove("active")
		current = (idx + slides.length) % slides.length
		slides[current]?.classList.add("active")
		dots[current]?.classList.add("active")
	}

	function startAuto() {
		autoTimer = setInterval(() => goTo(current + 1), 4500)
	}

	function resetAuto() {
		clearInterval(autoTimer)
		startAuto()
	}

	if (prevBtn) {
		prevBtn.addEventListener("click", () => {
			goTo(current - 1)
			resetAuto()
		})
	}
	if (nextBtn) {
		nextBtn.addEventListener("click", () => {
			goTo(current + 1)
			resetAuto()
		})
	}

	dots.forEach(dot =>
		dot.addEventListener("click", () => {
			goTo(+dot.dataset.idx)
			resetAuto()
		}),
	)

	startAuto()
}

/** Movie Tabs Switching */
function initMovieTabEvents() {
	const tabBtns = document.querySelectorAll(".movie-tab")
	tabBtns.forEach(btn => {
		btn.addEventListener("click", function () {
			tabBtns.forEach(b => b.classList.remove("active"))
			this.classList.add("active")
			document.querySelectorAll('[id^="tab-content-"]').forEach(c => c.classList.add("hidden"))
			const target = document.getElementById("tab-content-" + this.dataset.tab)
			if (target) target.classList.remove("hidden")
		})
	})
}

/** Back To Top Button */
function initBackToTopEvent() {
	const btt = document.getElementById("back-to-top")
	if (!btt) return

	window.addEventListener("scroll", () => {
		btt.classList.toggle("visible", window.scrollY > 400)
	})
	btt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }))
}
