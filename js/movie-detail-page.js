/**
 * Beta Cinemas - Movie Detail Page Logic
 * Render trang chi tiết phim động dựa trên tham số ID / Slug trên URL từ LocalStorage
 * Tích hợp xem trailer video YouTube qua modal & inline player
 */
import { setupHeaderAndFooter, openTrailerModal, getYouTubeEmbedUrl, showToast, translateDom, getSavedLang } from "./common.js"
import { ShowtimePicker } from "./showtimes-picker.js"
import { initializeStorage, getMovieById, getMovieBySlug, getMoviesData } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	// Khởi tạo Header, Footer và nạp dữ liệu LocalStorage nếu chạy lần đầu
	await setupHeaderAndFooter()
	await initializeStorage()

	// Đọc query param ?id=... hoặc ?slug=...
	const urlParams = new URLSearchParams(window.location.search)
	const queryId = urlParams.get("id")
	const querySlug = urlParams.get("slug")

	let currentMovie = null

	if (queryId) {
		currentMovie = getMovieById(queryId)
	} else if (querySlug) {
		currentMovie = getMovieBySlug(querySlug)
	}

	// Nếu có truyền id hoặc slug nhưng không tìm thấy phim trong database -> Tự động chuyển đến trang 404
	if (!currentMovie && (queryId || querySlug)) {
		window.location.href = `/404.html?from=${encodeURIComponent(window.location.pathname + window.location.search)}`
		return
	}

	// Nếu không truyền query param nào, mặc định lấy phim đầu tiên
	if (!currentMovie) {
		const moviesData = getMoviesData()
		const allMovies = [
			...(moviesData?.items?.nowshowing || []),
			...(moviesData?.items?.special || []),
			...(moviesData?.items?.upcoming || []),
		]
		currentMovie = allMovies[0] || null
	}

	// Trường hợp không có dữ liệu phim nào trong hệ thống
	if (!currentMovie) {
		renderNotFoundState(queryId || querySlug)
		return
	}

	// Render toàn bộ thông tin chi tiết phim
	renderMovieDetails(currentMovie)

	// Khởi tạo ShowtimePicker cho phim này
	const showtimePicker = new ShowtimePicker({
		containerId: "movie-showtimes-container",
		movieId: currentMovie.id,
	})
	await showtimePicker.init()

	// Nếu URL có hash #showtimes, cuộn mượt xuống phần lịch chiếu
	if (window.location.hash === "#showtimes") {
		setTimeout(() => {
			document.getElementById("movie-showtimes-container")?.scrollIntoView({ behavior: "smooth" })
		}, 350)
	}

	// Lắng nghe sự kiện chuyển đổi ngôn ngữ
	window.addEventListener("betaLangChange", () => {
		if (currentMovie) {
			renderMovieDetails(currentMovie)
		}
		translateDom(getSavedLang())
	})
})

/**
 * Hiển thị giao diện khi không tìm thấy phim
 * @param {string} idOrSlug
 */
function renderNotFoundState(idOrSlug) {
	document.title = "Không tìm thấy phim | Beta Cinemas"
	const mainEl = document.querySelector(".movie-detail-page")
	if (mainEl) {
		mainEl.innerHTML = `
			<div class="container" style="padding: 100px 20px; text-align: center;">
				<div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
				<h1 style="color: #fff; font-size: 28px; margin-bottom: 12px;">Không tìm thấy thông tin phim</h1>
				<p style="color: #8b92a5; max-width: 500px; margin: 0 auto 30px;">
					Rất tiếc, mã phim <strong>"${idOrSlug || "yêu cầu"}"</strong> không tồn tại hoặc đã ngừng chiếu tại hệ thống rạp.
				</p>
				<a href="/movies.html" style="display: inline-block; background: #e50914; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
					Khám phá danh sách phim đang chiếu
				</a>
			</div>
		`
	}
}

/**
 * Render đầy đủ thông tin chi tiết phim động vào DOM
 * @param {Object} movie - Đối tượng phim
 */
function renderMovieDetails(movie) {
	// Cập nhật tiêu đề trang
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
			posterBadge.style.display = ""
		} else {
			posterBadge.style.display = "none"
		}
	}

	// Nút phát trailer trên poster
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
		titleEn.style.display = movie.originalTitle ? "" : "none"
	}

	// Rating Score
	const ratingScoreEl = document.getElementById("detail-rating-score")
	if (ratingScoreEl) {
		ratingScoreEl.textContent = movie.ratingScore ? movie.ratingScore.toFixed(1) : "9.0"
	}

	// Pills (Thời lượng, thể loại, định dạng, ngôn ngữ, phụ đề)
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
		trailerIframe.src = getYouTubeEmbedUrl(movie.trailerUrl, false)
		trailerIframe.title = `Trailer: ${movie.title}`
	}

	// 8. Cast List
	const castGrid = document.getElementById("detail-cast-grid")
	if (castGrid && Array.isArray(movie.cast)) {
		const castMembers = [
			{ name: movie.director || "Đạo diễn", role: "Đạo diễn", isDirector: true },
			...movie.cast.map(c => ({ name: c, role: "Diễn viên chính" })),
		]

		castGrid.innerHTML = castMembers
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
		advisoryBadge.className = `advisory-badge badge-${badge.toLowerCase()}`

		if (badge === "T18") {
			advisoryText.textContent =
				"Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+). Khán giả vui lòng xuất trình CCCD hoặc giấy tờ tùy thân có hình ảnh xác minh độ tuổi tại quầy soát vé."
		} else if (badge === "T16") {
			advisoryText.textContent =
				"Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+). Khán giả dưới 16 tuổi không được phép vào rạp theo quy định của Cục Điện ảnh."
		} else if (badge === "T13") {
			advisoryText.textContent =
				"Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+). Vui lòng mang giấy tờ tùy thân khi xem phim."
		} else if (badge === "K") {
			advisoryText.textContent =
				"Phim được phổ biến đến người xem dưới 13 tuổi với điều kiện có cha mẹ hoặc người bảo hộ đi cùng."
		} else {
			advisoryText.textContent =
				"Phim được phép phổ biến rộng rãi đến người xem ở mọi lứa tuổi (P). Thích hợp cho cả gia đình cùng thưởng thức."
		}
	}

	translateDom(getSavedLang())
}
