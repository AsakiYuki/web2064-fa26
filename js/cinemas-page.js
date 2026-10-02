/**
 * Beta Cinemas - Dedicated Cinemas Hub Page Logic
 * Handles interactive cinema explorer, search, region filtering,
 * modal details preview, and default cinema setting.
 */

import { setupHeaderAndFooter, showToast } from "./common.js"
import { apiGetCinemas } from "./api.js"
import { getCinemas, getCurrentCinemaId, setCurrentCinemaId } from "./storage.js"

let allCinemas = []
let activeRegion = "all"
let searchQuery = ""

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()
	await loadCinemasData()
	setupURLParams()
	setupSearchAndFilters()
	setupModalEvents()
	updateCurrentCinemaBanner()
	renderCinemas()

	// Listen for global cinema switch events
	window.addEventListener("cinemaChanged", e => {
		updateCurrentCinemaBanner()
		renderCinemas()
	})
})

/**
 * Fetch and load cinemas data from API or localStorage
 */
async function loadCinemasData() {
	try {
		const apiData = await apiGetCinemas().catch(() => null)
		if (Array.isArray(apiData) && apiData.length > 0) {
			allCinemas = apiData
		} else {
			allCinemas = getCinemas()
		}

		if (!allCinemas || allCinemas.length === 0) {
			const res = await fetch("/data/cinemas.json")
			allCinemas = await res.json()
		}
	} catch (err) {
		console.warn("Failed to load cinemas data:", err)
		allCinemas = getCinemas()
	}
}

/**
 * Check if URL contains ?cinema=id or ?region=region
 */
function setupURLParams() {
	const params = new URLSearchParams(window.location.search)
	const regionParam = params.get("region")
	const cinemaIdParam = params.get("cinema") || params.get("id")

	if (regionParam) {
		activeRegion = regionParam
		document.querySelectorAll(".region-pill").forEach(pill => {
			if (pill.dataset.region.toLowerCase() === regionParam.toLowerCase()) {
				pill.classList.add("active")
			} else {
				pill.classList.remove("active")
			}
		})
	}

	if (cinemaIdParam) {
		const targetCinema = allCinemas.find(c => c.id === cinemaIdParam)
		if (targetCinema) {
			setTimeout(() => {
				openCinemaModal(targetCinema)
			}, 300)
		}
	}
}

/**
 * Update the banner indicating the currently selected cinema
 */
function updateCurrentCinemaBanner() {
	const currentId = getCurrentCinemaId()
	const cinema = allCinemas.find(c => c.id === currentId) || allCinemas[0]

	const nameEl = document.getElementById("current-cinema-name")
	const linkScheduleEl = document.getElementById("btn-banner-schedule")

	if (cinema && nameEl) {
		nameEl.textContent = cinema.name
	}
	if (cinema && linkScheduleEl) {
		linkScheduleEl.href = `/schedule.html?cinema=${cinema.id}`
	}
}

/**
 * Setup search input and region filter pills
 */
function setupSearchAndFilters() {
	const searchInput = document.getElementById("cinema-search-input")
	const btnClear = document.getElementById("btn-clear-search")
	const regionFilters = document.getElementById("region-filters")

	if (searchInput) {
		searchInput.addEventListener("input", e => {
			searchQuery = e.target.value.trim().toLowerCase()
			if (btnClear) {
				btnClear.classList.toggle("show", searchQuery.length > 0)
			}
			renderCinemas()
		})
	}

	if (btnClear && searchInput) {
		btnClear.addEventListener("click", () => {
			searchInput.value = ""
			searchQuery = ""
			btnClear.classList.remove("show")
			searchInput.focus()
			renderCinemas()
		})
	}

	if (regionFilters) {
		regionFilters.addEventListener("click", e => {
			const pill = e.target.closest(".region-pill")
			if (!pill) return

			regionFilters.querySelectorAll(".region-pill").forEach(p => p.classList.remove("active"))
			pill.classList.add("active")

			activeRegion = pill.dataset.region
			renderCinemas()
		})
	}
}

/**
 * Filter and render cinemas grid
 */
function renderCinemas() {
	const grid = document.getElementById("cinemas-grid")
	const countLabel = document.getElementById("cinemas-count-label")
	if (!grid) return

	const currentCinemaId = getCurrentCinemaId()

	const filtered = allCinemas.filter(c => {
		// Region filter
		const regionMatch = activeRegion === "all" || (c.region && c.region.toLowerCase() === activeRegion.toLowerCase())

		// Search query filter
		const q = searchQuery.toLowerCase()
		const searchMatch =
			!q ||
			c.name.toLowerCase().includes(q) ||
			(c.city && c.city.toLowerCase().includes(q)) ||
			(c.address && c.address.toLowerCase().includes(q)) ||
			(c.region && c.region.toLowerCase().includes(q))

		return regionMatch && searchMatch
	})

	if (countLabel) {
		countLabel.textContent = `(${filtered.length} rạp)`
	}

	if (filtered.length === 0) {
		grid.innerHTML = `
			<div class="cinemas-empty">
				<div class="empty-icon">🔍</div>
				<h3>Không tìm thấy cụm rạp phù hợp</h3>
				<p>Rất tiếc, không có rạp nào khớp với từ khóa "<strong>${escapeHtml(searchQuery)}</strong>" hoặc khu vực đã chọn.</p>
				<button type="button" class="btn-reset-filters" id="btn-reset-filters">Đặt lại bộ lọc tìm kiếm</button>
			</div>
		`
		const btnReset = document.getElementById("btn-reset-filters")
		if (btnReset) {
			btnReset.addEventListener("click", () => {
				const searchInput = document.getElementById("cinema-search-input")
				if (searchInput) searchInput.value = ""
				searchQuery = ""
				activeRegion = "all"
				document.querySelectorAll(".region-pill").forEach(p => {
					p.classList.toggle("active", p.dataset.region === "all")
				})
				renderCinemas()
			})
		}
		return
	}

	grid.innerHTML = filtered
		.map(cinema => {
			const isCurrent = cinema.id === currentCinemaId
			const totalScreens = Array.isArray(cinema.screens) ? cinema.screens.length : 0
			const totalSeats = Array.isArray(cinema.screens)
				? cinema.screens.reduce((acc, s) => acc + (s.totalSeats || 0), 0)
				: 0
			const image = cinema.image || "/promo/promo_nowzone.jpg"
			const region = cinema.region || cinema.city || "Việt Nam"
			const openingHours = cinema.openingHours || "08:00 - 23:30"
			const features = Array.isArray(cinema.features)
				? cinema.features
				: Array.isArray(cinema.facilities)
					? cinema.facilities.slice(0, 4)
					: ["Phòng 2D/3D", "Bắp nước"]

			return `
			<article class="cinema-card ${isCurrent ? "is-active-cinema" : ""}" data-id="${cinema.id}">
				<div class="card-active-flag">
					<span>✓</span> Đang Chọn
				</div>

				<div class="cinema-card-media">
					<img src="${image}" alt="${escapeHtml(cinema.name)}" loading="lazy" />
					<div class="card-gradient-overlay"></div>
					<span class="card-region-tag">${escapeHtml(region)}</span>
					<span class="card-screens-count">
						🎬 ${totalScreens} Phòng (${totalSeats} ghế)
					</span>
				</div>

				<div class="cinema-card-body">
					<h3 class="cinema-card-name" title="${escapeHtml(cinema.name)}">${escapeHtml(cinema.name)}</h3>

					<div class="cinema-card-meta">
						<div class="meta-row">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
								<circle cx="12" cy="10" r="3"></circle>
							</svg>
							<span class="meta-val">
								${escapeHtml(cinema.address || "Đang cập nhật địa chỉ")}
								<button type="button" class="btn-copy-address" data-address="${escapeHtml(cinema.address || "")}" title="Sao chép địa chỉ">📋 Sao chép</button>
							</span>
						</div>

						<div class="meta-row">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
							</svg>
							<span class="meta-val">
								Hotline: <a href="tel:${cinema.phone || "1900636807"}" class="phone-link">${cinema.phone || "1900 636807"}</a>
							</span>
						</div>

						<div class="meta-row">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							<span class="meta-val">Giờ mở cửa: ${escapeHtml(openingHours)}</span>
						</div>
					</div>

					<div class="cinema-features-list">
						${features.map(f => `<span class="feature-tag">✨ ${escapeHtml(f)}</span>`).join("")}
					</div>

					<div class="cinema-card-actions">
						<div class="action-row-primary">
							<a href="/schedule.html?cinema=${cinema.id}" class="btn-cinema-schedule">
								<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
								Xem Lịch Chiếu
							</a>
							<button type="button" class="btn-cinema-detail" data-id="${cinema.id}">
								Chi Tiết
							</button>
						</div>

						<div class="action-row-secondary">
							<button type="button" class="btn-set-default ${isCurrent ? "is-selected" : ""}" data-id="${cinema.id}">
								${isCurrent ? "✓ Rạp của bạn" : "⭐ Đặt làm rạp của tôi"}
							</button>

							<a href="${cinema.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(cinema.name)}`}" target="_blank" rel="noopener noreferrer" class="link-directions">
								📍 Chỉ đường
							</a>
						</div>
					</div>
				</div>
			</article>
			`
		})
		.join("")

	bindCardEvents()
}

/**
 * Bind card click events
 */
function bindCardEvents() {
	// 1. Copy Address button
	document.querySelectorAll(".btn-copy-address").forEach(btn => {
		btn.addEventListener("click", e => {
			e.stopPropagation()
			const addr = btn.dataset.address
			if (addr && navigator.clipboard) {
				navigator.clipboard.writeText(addr).then(() => {
					showToast("Đã sao chép địa chỉ rạp vào bộ nhớ tạm!", "info")
				})
			}
		})
	})

	// 2. Open Detail Modal button
	document.querySelectorAll(".btn-cinema-detail").forEach(btn => {
		btn.addEventListener("click", () => {
			const id = btn.dataset.id
			const cinema = allCinemas.find(c => c.id === id)
			if (cinema) {
				openCinemaModal(cinema)
			}
		})
	})

	// 3. Set as Default Cinema button
	document.querySelectorAll(".btn-set-default").forEach(btn => {
		btn.addEventListener("click", () => {
			const id = btn.dataset.id
			const cinema = allCinemas.find(c => c.id === id)
			if (cinema) {
				setCurrentCinemaId(id)
				updateCurrentCinemaBanner()
				renderCinemas()
				showToast(`Đã đặt "${cinema.name}" làm rạp mặc định của bạn!`, "success")
			}
		})
	})
}

/**
 * Open cinema details modal
 */
function openCinemaModal(cinema) {
	const overlay = document.getElementById("cinema-detail-modal-overlay")
	if (!overlay) return

	const imgEl = document.getElementById("modal-cinema-img")
	const regionEl = document.getElementById("modal-cinema-region")
	const nameEl = document.getElementById("modal-cinema-name")
	const addrEl = document.getElementById("modal-cinema-address")
	const phoneEl = document.getElementById("modal-cinema-phone")
	const hoursEl = document.getElementById("modal-cinema-hours")
	const descEl = document.getElementById("modal-cinema-desc")
	const screensGrid = document.getElementById("modal-screens-grid")
	const facilitiesList = document.getElementById("modal-facilities-list")
	const btnMap = document.getElementById("modal-btn-map")
	const btnSchedule = document.getElementById("modal-btn-schedule")

	if (imgEl) imgEl.src = cinema.image || "/promo/promo_nowzone.jpg"
	if (regionEl) regionEl.textContent = cinema.region || cinema.city || "Hệ Thống Rạp Beta"
	if (nameEl) nameEl.textContent = cinema.name
	if (addrEl) addrEl.textContent = cinema.address || "Đang cập nhật"
	if (phoneEl) {
		phoneEl.textContent = cinema.phone || "1900 636807"
		phoneEl.href = `tel:${cinema.phone || "1900636807"}`
	}
	if (hoursEl) hoursEl.textContent = cinema.openingHours || "08:00 - 23:30"
	if (descEl) descEl.textContent = cinema.description || "Cụm rạp tiêu chuẩn quốc tế thuộc hệ thống Beta Cinemas với không gian hiện đại và dịch vụ vượt trội."

	if (btnMap) {
		btnMap.href = cinema.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(cinema.name)}`
	}
	if (btnSchedule) {
		btnSchedule.href = `/schedule.html?cinema=${cinema.id}`
	}

	// Render screens
	if (screensGrid) {
		const screens = Array.isArray(cinema.screens) ? cinema.screens : []
		if (screens.length > 0) {
			screensGrid.innerHTML = screens
				.map(
					s => `
				<div class="modal-screen-card">
					<div class="screen-name">${escapeHtml(s.name || s.screenId)}</div>
					<span class="screen-type">${escapeHtml(s.type || "2D")}</span>
					<div class="screen-seats">${s.totalSeats || 100} ghế</div>
				</div>
			`,
				)
				.join("")
		} else {
			screensGrid.innerHTML = `<p style="color: #94a3b8; font-size: 13px;">Hệ thống 4 phòng chiếu kỹ thuật số tiêu chuẩn quốc tế.</p>`
		}
	}

	// Render amenities
	if (facilitiesList) {
		const facilities = Array.isArray(cinema.facilities) ? cinema.facilities : []
		facilitiesList.innerHTML = facilities
			.map(f => `<span class="feature-tag">✔ ${escapeHtml(f)}</span>`)
			.join("")
	}

	overlay.classList.add("active")
	document.body.style.overflow = "hidden"
}

/**
 * Setup modal close events
 */
function setupModalEvents() {
	const overlay = document.getElementById("cinema-detail-modal-overlay")
	const btnClose = document.getElementById("btn-close-modal")

	const closeModal = () => {
		if (overlay) overlay.classList.remove("active")
		document.body.style.overflow = ""
	}

	if (btnClose) btnClose.addEventListener("click", closeModal)

	if (overlay) {
		overlay.addEventListener("click", e => {
			if (e.target === overlay) closeModal()
		})
	}

	document.addEventListener("keydown", e => {
		if (e.key === "Escape" && overlay && overlay.classList.contains("active")) {
			closeModal()
		}
	})
}

/**
 * Safe HTML string escaping
 */
function escapeHtml(str) {
	if (!str) return ""
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}
