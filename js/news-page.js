/**
 * Beta Cinemas - News & Promotions Logic (news.html)
 */
import { setupHeaderAndFooter, showToast, translateDom, getSavedLang } from "./common.js"
import { getPromotions } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let promotionsData = getPromotions()

	try {
		if (!promotionsData || !promotionsData.length) {
			promotionsData = await fetch("/data/promotions.json").then(r => r.json())
		}
	} catch (err) {
		console.error("Failed to load promotions data:", err)
		return
	}

	const promoContainer = document.getElementById("promotions-grid-container")
	const filterPills = document.querySelectorAll(".promo-pill")
	const urlParams = new URLSearchParams(window.location.search)
	let currentCategory = urlParams.get("category") || "all"

	// Set active pill if category in URL
	if (currentCategory !== "all") {
		filterPills.forEach(p => {
			if (p.dataset.category === currentCategory) {
				filterPills.forEach(pill => pill.classList.remove("active"))
				p.classList.add("active")
			}
		})
	}

	function renderPromotions(category = "all") {
		if (!promoContainer) return

		const filtered = category === "all" ? promotionsData : promotionsData.filter(p => p.category === category)

		if (filtered.length === 0) {
			promoContainer.innerHTML = `
				<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #a6adc8; background: #313244; border-radius: 12px; border: 1px dashed rgba(88, 91, 112, 0.4);">
					<div style="font-size: 32px; margin-bottom: 12px;">🎟️</div>
					<div style="font-size: 16px; font-weight: 700; color: #cdd6f4; margin-bottom: 6px;">Không có bài viết khuyến mãi nào trong danh mục này</div>
					<p style="font-size: 13px; color: #a6adc8; margin: 0;">Vui lòng chọn danh mục khác hoặc quay lại sau nhé!</p>
				</div>
			`
			return
		}

		promoContainer.innerHTML = filtered
			.map(
				p => `
			<article class="promo-card" data-promo-id="${p.id}">
				<div class="promo-thumb">
					<img src="${p.image}" alt="${p.title}" loading="lazy" />
					<span class="promo-badge">${p.badge || "ƯU ĐÃI"}</span>
				</div>
				<div class="promo-body">
					<h3 class="promo-title">${p.title}</h3>
					<p class="promo-desc">${p.summary}</p>
					<div class="promo-validity">
						<span>⏱</span>
						<span>${p.date}</span>
					</div>
					<button type="button" class="btn-view-promo" data-promo-id="${p.id}">
						Xem Chi Tiết & Nhận Ưu Đãi
					</button>
				</div>
			</article>
		`
			)
			.join("")

		// Attach clicks for promo details
		promoContainer.querySelectorAll(".btn-view-promo").forEach(btn => {
			btn.addEventListener("click", () => {
				const promoId = btn.dataset.promoId
				const promoItem = promotionsData.find(p => p.id === promoId)
				if (promoItem) openPromoModal(promoItem)
			})
		})
	}

	renderPromotions(currentCategory)

	filterPills.forEach(pill => {
		pill.addEventListener("click", () => {
			filterPills.forEach(p => p.classList.remove("active"))
			pill.classList.add("active")
			currentCategory = pill.dataset.category
			renderPromotions(currentCategory)
		translateDom(getSavedLang())
		})
	})

	/* ==========================================================================
	   PROMOTION DETAIL MODAL
	   ========================================================================== */
	const modal = document.getElementById("promo-detail-modal")
	const modalClose = document.getElementById("promo-modal-close")
	const modalBody = document.getElementById("promo-modal-body")

	modalClose?.addEventListener("click", closePromoModal)
	modal?.addEventListener("click", e => {
		if (e.target === modal) closePromoModal()
	})

	function openPromoModal(p) {
		if (!modal || !modalBody) return

		modalBody.innerHTML = `
			<div style="position: relative; max-height: 240px; overflow: hidden; background: #11111b;">
				<img src="${p.image}" alt="${p.title}" style="width: 100%; height: 240px; object-fit: cover; opacity: 0.9;" />
				<span style="position: absolute; bottom: 16px; left: 20px; background: #89b4fa; color: #11111b; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px;">
					${p.categoryLabel || "ƯU ĐÃI"}
				</span>
			</div>
			<div style="padding: 24px;">
				<h2 style="font-size: 20px; font-weight: 800; color: #cdd6f4; margin: 0 0 10px; line-height: 1.35;">${p.title}</h2>
				<div style="font-size: 13px; color: #a6adc8; margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
					<span>📅 ${p.date}</span>
					<span>•</span>
					<span style="color: #f38ba8; font-weight: 700;">${p.discount}</span>
				</div>
				<div style="font-size: 14px; line-height: 1.6; color: #bac2de; margin-bottom: 24px;">
					<p>${p.content || p.summary}</p>
				</div>
				${
					p.code
						? `
					<div style="background: #313244; border: 1.5px dashed #89b4fa; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
						<div>
							<div style="font-size: 11px; font-weight: 700; color: #a6adc8; text-transform: uppercase;">Mã khuyến mãi áp dụng khi đặt vé:</div>
							<div style="font-size: 18px; font-weight: 900; color: #89b4fa; letter-spacing: 1px;">${p.code}</div>
						</div>
						<button type="button" id="btn-copy-modal-code" style="background: #89b4fa; color: #11111b; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;">
							Sao Chép Mã
						</button>
					</div>
				`
						: ""
				}
				<div style="display: flex; gap: 12px; justify-content: flex-end;">
					<button type="button" id="btn-close-modal-action" style="background: #45475a; border: 1px solid rgba(88, 91, 112, 0.4); color: #cdd6f4; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
						Đóng
					</button>
					<a href="/movies.html" style="background: #89b4fa; color: #11111b; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 6px;">
						Đặt Vé Ngay
					</a>
				</div>
			</div>
		`

		modalBody.querySelector("#btn-close-modal-action")?.addEventListener("click", closePromoModal)
		modalBody.querySelector("#btn-copy-modal-code")?.addEventListener("click", () => {
			navigator.clipboard?.writeText(p.code)
			showToast(`Đã sao chép mã ưu đãi ${p.code}!`, "success")
		})

		modal.classList.add("active")
		document.body.style.overflow = "hidden"
		translateDom(getSavedLang())
	}

	function closePromoModal() {
		if (modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	}

	// Check if URL has ?id=promo_xxx to open immediately
	const targetPromoId = urlParams.get("id")
	if (targetPromoId) {
		const targetPromo = promotionsData.find(p => p.id === targetPromoId)
		if (targetPromo) {
			openPromoModal(targetPromo)
		}
	}
	// Listen for global language switch events
	window.addEventListener("betaLangChange", () => {
		renderPromotions(currentCategory)
	})
})
