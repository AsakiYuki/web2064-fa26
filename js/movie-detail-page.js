/**
 * Beta Cinemas - Movie Detail Page Logic
 */
import { setupHeaderAndFooter, openTrailerModal } from "./common.js"
import { ShowtimePicker } from "./showtimes-picker.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let moviesData = null
	try {
		moviesData = await fetch("/data/movies.json").then(r => r.json())
	} catch (err) {
		console.error("Failed to load movies data:", err)
		return
	}

	// Find movie by URL query param (?id=... or ?slug=...)
	const urlParams = new URLSearchParams(window.location.search)
	const queryId = urlParams.get("id")
	const querySlug = urlParams.get("slug")

	const allMovies = [
		...(moviesData.items.nowshowing || []),
		...(moviesData.items.special || []),
		...(moviesData.items.upcoming || []),
	]

	let currentMovie = null
	if (queryId) {
		currentMovie = allMovies.find(m => m.id === queryId)
	} else if (querySlug) {
		currentMovie = allMovies.find(m => m.slug === querySlug)
	}

	// Default to first now showing movie if not found
	if (!currentMovie) {
		currentMovie = allMovies[0]
	}

	renderMovieDetails(currentMovie)

	// Initialize the ShowtimePicker specifically for this movie!
	const showtimePicker = new ShowtimePicker({
		containerId: "movie-showtimes-container",
		movieId: currentMovie.id,
	})
	await showtimePicker.init()

	// If page was loaded with #showtimes anchor, smooth scroll down
	if (window.location.hash === "#showtimes") {
		setTimeout(() => {
			document.getElementById("movie-showtimes-container")?.scrollIntoView({ behavior: "smooth" })
		}, 300)
	}
})

function renderMovieDetails(movie) {
	// Set document title
	document.title = `${movie.title} - Lịch Chiếu & Đặt Vé | Beta Cinemas`

	// 1. Breadcrumb
	const bcMovieName = document.getElementById("bc-movie-name")
	if (bcMovieName) bcMovieName.textContent = movie.title

	// 2. Backdrop Image
	const backdropEl = document.getElementById("hero-backdrop-img")
	if (backdropEl) {
		backdropEl.style.backgroundImage = `url('${movie.banner || movie.poster}')`
	}

	// 3. Poster & Badges
	const posterImg = document.getElementById("detail-poster-img")
	if (posterImg) {
		posterImg.src = movie.poster
		posterImg.alt = movie.title
		if (movie.posterStyle) posterImg.style = movie.posterStyle
	}

	const posterBadge = document.getElementById("detail-poster-badge")
	if (posterBadge) {
		if (movie.badge) {
			posterBadge.textContent = movie.badge
			posterBadge.className = `poster-badge badge-${(movie.badge || "").toLowerCase()}`
		} else {
			posterBadge.style.display = "none"
		}
	}

	// Play trailer on poster
	const playPosterBtn = document.getElementById("btn-play-trailer-poster")
	if (playPosterBtn) {
		playPosterBtn.addEventListener("click", () => {
			openTrailerModal(movie.trailerUrl, movie.title)
		})
	}

	// 4. Movie Titles & Meta
	const titleVn = document.getElementById("movie-title-vn")
	if (titleVn) titleVn.textContent = movie.title

	const titleEn = document.getElementById("movie-title-en")
	if (titleEn) {
		titleEn.textContent = movie.originalTitle || ""
		if (!movie.originalTitle) titleEn.style.display = "none"
	}

	// Rating Score
	const ratingScoreEl = document.getElementById("detail-rating-score")
	if (ratingScoreEl) {
		ratingScoreEl.textContent = movie.ratingScore ? movie.ratingScore.toFixed(1) : "9.0"
	}

	// Pills
	const pillsWrap = document.getElementById("detail-pills-row")
	if (pillsWrap) {
		pillsWrap.innerHTML = `
			<span class="detail-pill">⏱️ ${movie.duration || "105 phút"}</span>
			<span class="detail-pill">🎭 ${movie.genre || "Điện ảnh"}</span>
			<span class="detail-pill pill-format">🎬 ${movie.format || "2D Digital"}</span>
			<span class="detail-pill">🗣️ ${movie.language || "Tiếng Việt"}</span>
			${movie.subtitle ? `<span class="detail-pill">📝 ${movie.subtitle}</span>` : ""}
		`
	}

	// Meta Table
	const metaDirector = document.getElementById("meta-director")
	if (metaDirector) metaDirector.textContent = movie.director || "Đang cập nhật"

	const metaCast = document.getElementById("meta-cast")
	if (metaCast) {
		metaCast.textContent = Array.isArray(movie.cast) ? movie.cast.join(", ") : (movie.cast || "Đang cập nhật")
	}

	const metaRelease = document.getElementById("meta-release")
	if (metaRelease) metaRelease.textContent = movie.releaseDate || "Đang chiếu"

	const metaCountry = document.getElementById("meta-country")
	if (metaCountry) metaCountry.textContent = movie.country || "Việt Nam"

	// 5. CTA Buttons
	const btnBookNow = document.getElementById("btn-book-now")
	if (btnBookNow) {
		btnBookNow.addEventListener("click", () => {
			document.getElementById("movie-showtimes-container")?.scrollIntoView({ behavior: "smooth" })
		})
	}

	const btnWatchTrailerHero = document.getElementById("btn-watch-trailer-hero")
	if (btnWatchTrailerHero) {
		btnWatchTrailerHero.addEventListener("click", () => {
			openTrailerModal(movie.trailerUrl, movie.title)
		})
	}

	// 6. Synopsis
	const synopsisText = document.getElementById("detail-synopsis-text")
	if (synopsisText) {
		synopsisText.textContent =
			movie.synopsis ||
			"Bộ phim mang lại những trải nghiệm điện ảnh chân thực, kịch tính và đầy cảm xúc cho người xem tại hệ thống rạp Beta Cinemas trên toàn quốc."
	}

	// 7. Inline Trailer Embed
	const trailerIframe = document.getElementById("detail-trailer-iframe")
	if (trailerIframe) {
		let embedUrl = movie.trailerUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"
		if (embedUrl.includes("watch?v=")) {
			embedUrl = embedUrl.replace("watch?v=", "embed/")
		}
		trailerIframe.src = embedUrl
		trailerIframe.title = `Trailer: ${movie.title}`
	}

	// 8. Cast List
	const castGrid = document.getElementById("detail-cast-grid")
	if (castGrid && Array.isArray(movie.cast)) {
		castGrid.innerHTML = [
			{ name: movie.director || "Đạo diễn", role: "Đạo diễn", isDirector: true },
			...movie.cast.map(c => ({ name: c, role: "Diễn viên chính" })),
		]
			.map(
				person => `
			<div class="cast-card">
				<div class="cast-avatar">${person.name.charAt(0)}</div>
				<div>
					<div class="cast-name">${person.name}</div>
					<div class="cast-role">${person.role}</div>
				</div>
			</div>
		`,
			)
			.join("")
	}

	// 9. Age advisory notice
	const advisoryText = document.getElementById("advisory-text")
	const advisoryBadge = document.getElementById("advisory-badge")
	if (advisoryText && advisoryBadge) {
		const badge = movie.badge || "P"
		advisoryBadge.textContent = badge
		if (badge === "T18") {
			advisoryText.textContent =
				"Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+). Khán giả vui lòng xuất trình CCCD hoặc giấy tờ tùy thân có hình ảnh xác minh độ tuổi tại quầy soát vé."
		} else if (badge === "T16") {
			advisoryText.textContent = "Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+)."
		} else if (badge === "T13") {
			advisoryText.textContent = "Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+)."
		} else if (badge === "K") {
			advisoryText.textContent = "Phim được phổ biến đến người xem dưới 13 tuổi có người bảo hộ đi kèm."
		} else {
			advisoryText.textContent = "Phim được phép phổ biến rộng rãi đến người xem ở mọi lứa tuổi (P)."
		}
	}
}
