/**
 * Beta Cinemas - Ticket Pricing & Promotions Logic
 */
import { setupHeaderAndFooter, formatCurrency, showToast } from "./common.js"
import { getTicketPricing, getPromotions } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let pricingData = getTicketPricing()
	let promotionsData = getPromotions()

	try {
		if (!pricingData?.formats || !promotionsData.length) {
			const [prRes, promoRes] = await Promise.all([
				fetch("/data/ticket_pricing.json").then(r => r.json()),
				fetch("/data/promotions.json").then(r => r.json()),
			])
			pricingData = prRes
			promotionsData = promoRes
		}
	} catch (err) {
		console.error("Failed to load pricing or promotions data:", err)
		return
	}

	/* ==========================================================================
	   1. TICKET PRICING TABLE MATRIX
	   ========================================================================== */
	let currentFormat = "2d"

	function renderPricingTable(formatId) {
		const tbody = document.getElementById("pricing-table-tbody")
		if (!tbody || !pricingData?.formats) return

		const fmtObj = pricingData.formats.find(f => f.id === formatId) || pricingData.formats[0]
		const rates = fmtObj.rates

		const rows = [
			{
				name: "Ghế Thường (Standard)",
				weekday: rates.weekday?.standard || 65000,
				weekend: rates.weekend?.standard || 75000,
				tuesday: rates.happy_tuesday?.standard || 50000,
			},
			{
				name: "Ghế VIP (Vị trí trung tâm)",
				weekday: rates.weekday?.vip || 70000,
				weekend: rates.weekend?.vip || 80000,
				tuesday: rates.happy_tuesday?.vip || 55000,
			},
			{
				name: "Ghế Đôi (Sweetbox 2 người)",
				weekday: rates.weekday?.sweetbox || 155000,
				weekend: rates.weekend?.sweetbox || 175000,
				tuesday: rates.happy_tuesday?.sweetbox || 125000,
			},
		]

		tbody.innerHTML = rows
			.map(
				row => `
			<tr>
				<td><strong>${row.name}</strong></td>
				<td class="price-highlight">${formatCurrency(row.weekday)}</td>
				<td class="price-highlight" style="color: #0284c7;">${formatCurrency(row.weekend)}</td>
				<td class="price-tuesday">${formatCurrency(row.tuesday)}</td>
			</tr>
		`
			)
			.join("")
	}

	renderPricingTable(currentFormat)

	// Format Switch Buttons
	const formatBtns = document.querySelectorAll(".fmt-tab-btn")
	formatBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			formatBtns.forEach(b => {
				b.classList.remove("active")
				b.setAttribute("aria-selected", "false")
			})
			btn.classList.add("active")
			btn.setAttribute("aria-selected", "true")

			currentFormat = btn.dataset.format
			renderPricingTable(currentFormat)
		})
	})

	/* ==========================================================================
	   2. PROMOTIONS & NEWS FILTERING
	   ========================================================================== */
	const promoContainer = document.getElementById("promotions-grid-container")
	const filterPills = document.querySelectorAll(".promo-pill")
	let currentCategory = "all"

	function renderPromotions(category = "all") {
		if (!promoContainer) return

		const filtered = category === "all" ? promotionsData : promotionsData.filter(p => p.category === category)

		if (filtered.length === 0) {
			promoContainer.innerHTML = `
				<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
					Không có bài viết khuyến mãi nào trong danh mục này.
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
		})
	})

	/* ==========================================================================
	   3. PROMOTION DETAIL MODAL
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
			<div style="position: relative; max-height: 240px; overflow: hidden; background: #000;">
				<img src="${p.image}" alt="${p.title}" style="width: 100%; height: 240px; object-fit: cover; opacity: 0.9;" />
				<span style="position: absolute; bottom: 16px; left: 20px; background: #015198; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px;">
					${p.categoryLabel || "ƯU ĐÃI"}
				</span>
			</div>
			<div style="padding: 24px;">
				<h2 style="font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 10px; line-height: 1.35;">${p.title}</h2>
				<div style="font-size: 13px; color: #64748b; margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
					<span>📅 ${p.date}</span>
					<span>•</span>
					<span style="color: #ef4444; font-weight: 700;">${p.discount}</span>
				</div>
				<div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
					<p>${p.content || p.summary}</p>
				</div>
				${
					p.code
						? `
					<div style="background: #f8fafc; border: 1.5px dashed #015198; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
						<div>
							<div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Mã khuyến mãi áp dụng khi đặt vé:</div>
							<div style="font-size: 18px; font-weight: 900; color: #015198; letter-spacing: 1px;">${p.code}</div>
						</div>
						<button type="button" id="btn-copy-modal-code" style="background: #015198; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;">
							Sao Chép Mã
						</button>
					</div>
				`
						: ""
				}
				<div style="display: flex; gap: 12px; justify-content: flex-end;">
					<button type="button" id="btn-close-modal-action" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
						Đóng
					</button>
					<a href="/movies.html" style="background: #015198; color: #fff; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 6px;">
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
	}

	function closePromoModal() {
		if (modal) {
			modal.classList.remove("active")
			document.body.style.overflow = ""
		}
	}
})
