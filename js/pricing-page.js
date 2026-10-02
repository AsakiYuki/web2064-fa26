/**
 * Beta Cinemas - Ticket Pricing Logic (pricing.html)
 */
import { setupHeaderAndFooter, formatCurrency } from "./common.js"
import { getTicketPricing } from "./storage.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	let pricingData = getTicketPricing()

	try {
		if (!pricingData?.formats) {
			pricingData = await fetch("/data/ticket_pricing.json").then(r => r.json())
		}
	} catch (err) {
		console.error("Failed to load ticket pricing data:", err)
		return
	}

	/* ==========================================================================
	   TICKET PRICING TABLE MATRIX
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
})
