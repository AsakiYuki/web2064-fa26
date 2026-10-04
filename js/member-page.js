/**
 * Beta Cinemas - Membership & Rewards Page Logic
 * Quản lý Thẻ hội viên điện tử, Điểm thưởng, Đổi quà tặng, Tính toán quyền lợi và Lịch sử điểm
 */

import {
	setupHeaderAndFooter,
	formatCurrency,
	formatDateVN,
	showToast,
	getCurrentUser,
	openAuthModal,
	translateDom,
	getSavedLang,
} from "./common.js"

import {
	initializeStorage,
	getMemberRewards,
	redeemMemberReward,
	getUserPointsHistory,
} from "./storage.js"

// State variables
let activeCategory = "all"
let pendingRedeemReward = null

document.addEventListener("DOMContentLoaded", async () => {
	// Initialize core components & header
	setupHeaderAndFooter()
	await initializeStorage()

	// Setup UI and event listeners
	setupMemberHeroUI()
	setupCardFlip()
	renderRewardsStore()
	setupStoreFilters()
	setupCalculator()
	setupFAQAccordion()
	setupModals()

	// Listen for auth state changes (login / register / logout)
	window.addEventListener("beta_auth_changed", () => {
		setupMemberHeroUI()
		renderRewardsStore()
	})

	// Listen for global language switch events
	window.addEventListener("betaLangChange", () => {
		setupMemberHeroUI()
		renderRewardsStore()
	})
})

/* ==========================================================================
   1. HERO & DIGITAL MEMBER CARD UI
   ========================================================================== */
function setupMemberHeroUI() {
	const user = getCurrentUser()

	const cardEl = document.getElementById("member-card")
	const cardFront = document.getElementById("card-front-face")
	const rankLabel = document.getElementById("card-rank-label")
	const cardRankPill = document.getElementById("card-rank-pill")
	const holderName = document.getElementById("card-holder-name")
	const cardNumberDisplay = document.getElementById("card-number-display")
	const barcodeNum = document.getElementById("card-barcode-num")
	const barcodeSvg = document.getElementById("card-barcode-svg")

	const welcomeTag = document.getElementById("welcome-rank-text")
	const welcomeHeading = document.getElementById("welcome-user-heading")
	const welcomeSub = document.getElementById("welcome-user-sub")

	const statPointsVal = document.getElementById("stat-points-val")
	const statPointsCash = document.getElementById("stat-points-cash")
	const statRankVal = document.getElementById("stat-rank-val")
	const statSpendVal = document.getElementById("stat-spend-val")

	const progFillBar = document.getElementById("prog-fill-bar")
	const progCurrLabel = document.getElementById("prog-curr-label")
	const progNextLabel = document.getElementById("prog-next-label")
	const progDescText = document.getElementById("prog-desc-text")

	const guestCallout = document.getElementById("guest-callout-box")
	const storeBalance = document.getElementById("store-current-points")

	if (user) {
		const points = Number(user.points) || 0
		const rawRank = (user.rank || "Thành viên Beta VIP").toUpperCase()

		// Determine card tier
		let tierClass = "tier-vip"
		let tierName = "BETA VIP"
		let ratePercent = 7

		if (rawRank.includes("DIAMOND") || rawRank.includes("VVIP") || points >= 1000) {
			tierClass = "tier-diamond"
			tierName = "BETA DIAMOND"
			ratePercent = 10
		} else if (rawRank.includes("MỚI") || rawRank.includes("STANDARD") || points < 200) {
			tierClass = "tier-standard"
			tierName = "BETA STANDARD"
			ratePercent = 5
		}

		// Update Card Front
		if (cardFront) {
			cardFront.className = `card-face card-front ${tierClass}`
		}
		if (rankLabel) rankLabel.textContent = tierName
		if (holderName) holderName.textContent = user.name || "THÀNH VIÊN BETA"

		// Dynamic Card Number based on user ID / phone
		const userCode = user.phone ? user.phone.slice(-4) : String(user.id || 1001).padStart(4, "0")
		const formattedCardNum = `BC-2026-8492-${userCode}`
		if (cardNumberDisplay) cardNumberDisplay.textContent = formattedCardNum
		if (barcodeNum) barcodeNum.textContent = `89345${userCode}2026`

		// Generate SVG Barcode
		renderBarcodeSVG(barcodeSvg, `89345${userCode}2026`)

		// Update Details Column
		if (welcomeTag) welcomeTag.textContent = `Đặc Quyền Thành Viên ${tierName}`
		if (welcomeHeading) welcomeHeading.textContent = `Xin Chào, ${user.name || "Quý Hội Viên"}!`
		if (welcomeSub) {
			welcomeSub.textContent = `Hạng thẻ của bạn đang được áp dụng tỷ lệ tích lũy ${ratePercent}% cho tất cả các giao dịch vé và bắp nước tại mọi cụm rạp Beta toàn quốc.`
		}

		if (statPointsVal) statPointsVal.textContent = points.toLocaleString("vi-VN")
		if (statPointsCash) statPointsCash.textContent = `≈ ${formatCurrency(points * 1000)} giá trị quy đổi`
		if (statRankVal) statRankVal.textContent = tierName
		if (statSpendVal) statSpendVal.textContent = formatCurrency(Math.max(points * 5000, 1500000))

		if (storeBalance) storeBalance.textContent = `${points.toLocaleString("vi-VN")} Điểm`

		// Progress bar calculations
		if (tierName === "BETA STANDARD") {
			const target = 200
			const pct = Math.min(Math.round((points / target) * 100), 100)
			if (progFillBar) progFillBar.style.width = `${pct}%`
			if (progCurrLabel) progCurrLabel.textContent = `Hạng Standard (${points}/200 điểm)`
			if (progNextLabel) progNextLabel.textContent = `Cần thêm ${Math.max(target - points, 0)} điểm để lên VIP 👑`
			if (progDescText) progDescText.textContent = `Tích lũy thêm điểm để nâng tỷ lệ tích lũy lên 7% và nhận quà sinh nhật 2 vé 2D + 1 combo.`
		} else if (tierName === "BETA VIP") {
			const target = 1000
			const pct = Math.min(Math.round(((points) / target) * 100), 100)
			if (progFillBar) progFillBar.style.width = `${Math.max(pct, 40)}%`
			if (progCurrLabel) progCurrLabel.textContent = `Hạng VIP (${points}/1.000 điểm)`
			if (progNextLabel) progNextLabel.textContent = `Cần thêm ${Math.max(target - points, 0)} điểm để lên DIAMOND 💎`
			if (progDescText) progDescText.textContent = `Lên hạng Diamond để được nhân đôi điểm vào ngày hội thành viên (15 hàng tháng) và vé mời Premiere.`
		} else {
			if (progFillBar) progFillBar.style.width = `100%`
			if (progCurrLabel) progCurrLabel.textContent = `Hạng Cao Cấp Nhất: DIAMOND 💎`
			if (progNextLabel) progNextLabel.textContent = `Đặc Quyền VVIP Tối Đa`
			if (progDescText) progDescText.textContent = `Bạn đang sở hữu hạng thành viên cao nhất với tỷ lệ tích lũy tối đa 10% và miễn phí nâng hạng ghế!`
		}

		if (guestCallout) guestCallout.style.display = "none"
	} else {
		// Guest State
		if (cardFront) cardFront.className = "card-face card-front tier-vip"
		if (rankLabel) rankLabel.textContent = "BETA MEMBER"
		if (holderName) holderName.textContent = "KHÁCH HÀNG THÂN THIẾT"
		if (cardNumberDisplay) cardNumberDisplay.textContent = "BC-2026-••••-••••"
		if (barcodeNum) barcodeNum.textContent = "8934500002026"
		renderBarcodeSVG(barcodeSvg, "8934500002026")

		if (welcomeTag) welcomeTag.textContent = "Chương Trình Khách Hàng Thân Thiết"
		if (welcomeHeading) welcomeHeading.textContent = "Đăng Ký Thành Viên Beta Cinemas"
		if (welcomeSub) {
			welcomeSub.textContent = "Tích lũy từ 5% đến 10% cho mọi chi tiêu xem phim & bắp nước. Đổi vé xem phim miễn phí vào ngày hội thành viên hàng tháng."
		}

		if (statPointsVal) statPointsVal.textContent = "0"
		if (statPointsCash) statPointsCash.textContent = "Đăng ký nhận ngay 50 điểm"
		if (statRankVal) statRankVal.textContent = "CHUẨN BỊ GIA NHẬP"
		if (statSpendVal) statSpendVal.textContent = "0đ"

		if (progFillBar) progFillBar.style.width = "10%"
		if (progCurrLabel) progCurrLabel.textContent = "Chưa kích hoạt thẻ"
		if (progNextLabel) progNextLabel.textContent = "Đăng ký miễn phí trong 30s"
		if (progDescText) progDescText.textContent = "Tạo tài khoản ngay hôm nay để nhận 50 điểm thưởng chào mừng và kích hoạt thẻ số của bạn."

		if (guestCallout) guestCallout.style.display = "flex"
		if (storeBalance) storeBalance.textContent = "0 Điểm (Chưa đăng nhập)"

		// Wire up guest register button
		const btnGuestReg = document.getElementById("btn-guest-register")
		if (btnGuestReg) {
			btnGuestReg.onclick = () => openAuthModal("register")
		}
	}
}

/* ==========================================================================
   2. 3D CARD FLIP INTERACTION
   ========================================================================== */
function setupCardFlip() {
	const card = document.getElementById("member-card")
	const flipBtn = document.getElementById("btn-flip-card")
	const flipText = document.getElementById("flip-btn-text")

	if (!card) return

	const toggleFlip = () => {
		card.classList.toggle("is-flipped")
		const isFlipped = card.classList.contains("is-flipped")
		if (flipText) {
			flipText.textContent = isFlipped ? "Lật Thẻ Xem Mặt Trước" : "Lật Thẻ Xem Mã Vạch Quẹt Quầy"
		}
	}

	card.addEventListener("click", toggleFlip)
	if (flipBtn) {
		flipBtn.addEventListener("click", e => {
			e.stopPropagation()
			toggleFlip()
		})
	}
}

/**
 * Generate crisp SVG Barcode lines
 */
function renderBarcodeSVG(svgEl, codeString) {
	if (!svgEl) return

	let lines = ""
	let x = 10
	// Simple procedural Code128-like barcode visualization
	for (let i = 0; i < codeString.length; i++) {
		const charCode = codeString.charCodeAt(i)
		const width1 = (charCode % 3) + 1.5
		const gap = (charCode % 2) + 1.2
		const width2 = ((charCode * 2) % 3) + 1

		lines += `<rect x="${x}" y="0" width="${width1}" height="48" fill="#1a1a2e" />`
		x += width1 + gap
		lines += `<rect x="${x}" y="0" width="${width2}" height="48" fill="#1a1a2e" />`
		x += width2 + gap + 1
	}

	svgEl.innerHTML = lines
}

/* ==========================================================================
   3. REWARD POINTS STORE (GIAN HÀNG ĐỔI ĐIỂM)
   ========================================================================== */
function renderRewardsStore() {
	const container = document.getElementById("rewards-cards-container")
	if (!container) return

	const rewards = getMemberRewards()
	const user = getCurrentUser()
	const userPoints = user ? Number(user.points) || 0 : 0

	// Filter by category
	const filtered = activeCategory === "all"
		? rewards
		: rewards.filter(r => r.category === activeCategory)

	if (filtered.length === 0) {
		container.innerHTML = `
			<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
				Không có phần thưởng nào trong danh mục này.
			</div>
		`
		return
	}

	container.innerHTML = filtered.map(reward => {
		const canAfford = user && userPoints >= reward.points
		const btnText = !user ? "Đăng nhập để đổi" : canAfford ? "Đổi Ngay" : "Chưa đủ điểm"
		const btnClass = !user ? "btn-redeem" : canAfford ? "btn-redeem" : "btn-redeem disabled"

		return `
			<div class="reward-card" data-id="${reward.id}">
				<div class="rc-thumb">
					<img src="${reward.image || '/promo/promo_deal.jpg'}" alt="${reward.title}" loading="lazy" />
					<span class="rc-badge">${reward.badge || "ƯU ĐÃI"}</span>
					<div class="rc-icon-tag">${reward.icon || "🎁"}</div>
				</div>
				<div class="rc-body">
					<div>
						<h3 class="rc-title">${reward.title}</h3>
						<p class="rc-desc">${reward.description}</p>
					</div>
					<div class="rc-footer">
						<div class="rc-points">
							<span class="val">${reward.points}</span>
							<span class="unit">Điểm</span>
						</div>
						<button type="button" class="${btnClass}" data-action="redeem" data-id="${reward.id}">
							${btnText}
						</button>
					</div>
				</div>
			</div>
		`
	}).join("")

	// Attach click listeners to redeem buttons
	container.querySelectorAll("button[data-action='redeem']").forEach(btn => {
		btn.addEventListener("click", e => {
			const rewardId = e.currentTarget.getAttribute("data-id")
			handleRedeemClick(rewardId)
		})
	})

	translateDom(getSavedLang())
}

function setupStoreFilters() {
	const pills = document.querySelectorAll(".store-filter-pills .sf-pill")
	pills.forEach(pill => {
		pill.addEventListener("click", () => {
			pills.forEach(p => p.classList.remove("active"))
			pill.classList.add("active")
			activeCategory = pill.getAttribute("data-category")
			renderRewardsStore()
		})
	})
}

function handleRedeemClick(rewardId) {
	const user = getCurrentUser()
	if (!user) {
		openAuthModal("login")
		return
	}

	const rewards = getMemberRewards()
	const reward = rewards.find(r => r.id === rewardId)
	if (!reward) return

	const userPoints = Number(user.points) || 0
	if (userPoints < reward.points) {
		showToast(
			`Bạn hiện có ${userPoints} điểm, còn thiếu ${reward.points - userPoints} điểm để đổi "${reward.title}"!`,
			"warning"
		)
		return
	}

	// Open Confirmation Modal
	pendingRedeemReward = reward
	const modal = document.getElementById("modal-redeem-confirm")
	if (!modal) return

	document.getElementById("confirm-reward-icon").textContent = reward.icon || "🎁"
	document.getElementById("confirm-reward-title").textContent = reward.title
	document.getElementById("confirm-reward-desc").textContent = reward.description
	document.getElementById("confirm-user-current-pts").textContent = `${userPoints} Điểm`
	document.getElementById("confirm-reward-cost-pts").textContent = `-${reward.points} Điểm`
	document.getElementById("confirm-user-remain-pts").textContent = `${userPoints - reward.points} Điểm`

	modal.style.display = "flex"
}

/* ==========================================================================
   4. POINTS & SAVINGS CALCULATOR
   ========================================================================== */
function setupCalculator() {
	const slider = document.getElementById("calc-slider")
	const spendDisplay = document.getElementById("calc-spend-display")
	const tierBadge = document.getElementById("calc-tier-badge")
	const tierName = document.getElementById("calc-tier-name")
	const pointsYear = document.getElementById("calc-points-year")
	const savingsYear = document.getElementById("calc-savings-year")
	const benefitsList = document.getElementById("calc-benefits-list")
	const presetBtns = document.querySelectorAll(".preset-buttons button")

	if (!slider) return

	const updateCalc = val => {
		const spendMonth = Number(val)
		const spendYear = spendMonth * 12
		if (spendDisplay) spendDisplay.textContent = `${spendMonth.toLocaleString("vi-VN")} VNĐ`

		let tier = "tier-standard"
		let name = "BETA STANDARD"
		let rate = 0.05
		let benefits = [
			"Tỷ lệ tích lũy: <strong>5%</strong> giá trị đơn vé và bắp nước",
			"Tặng 01 vé xem phim 2D miễn phí dịp sinh nhật",
			"Áp dụng giá vé ưu đãi Happy Tuesday 50.000đ",
		]

		if (spendYear >= 5000000) {
			tier = "tier-diamond"
			name = "BETA DIAMOND (VVIP)"
			rate = 0.10
			benefits = [
				"Tỷ lệ tích lũy tối đa: <strong>10%</strong> giá trị đơn vé và bắp nước",
				"Nhân đôi điểm (x2) vào ngày hội thành viên (15 hàng tháng)",
				"Miễn phí nâng hạng ghế VIP & Sweetbox cho mọi suất chiếu",
				"Vé mời tham dự họp báo & Premiere phim bom tấn",
			]
		} else if (spendYear >= 2000000) {
			tier = "tier-vip"
			name = "BETA VIP"
			rate = 0.07
			benefits = [
				"Tỷ lệ tích lũy: <strong>7%</strong> giá trị đơn vé và bắp nước",
				"Tặng 02 vé xem phim 2D + 01 bắp ngọt dịp sinh nhật",
				"Ưu tiên check-in tại quầy vé riêng (Priority Line)",
				"Tặng mã voucher giảm giá độc quyền mỗi quý",
			]
		}

		const pts = Math.round((spendYear * rate) / 1000)
		const savings = pts * 1000

		if (tierBadge) tierBadge.className = `result-tier-badge ${tier}`
		if (tierName) tierName.textContent = `Hạng Dự Kiến: ${name}`
		if (pointsYear) pointsYear.textContent = `${pts.toLocaleString("vi-VN")} Điểm`
		if (savingsYear) savingsYear.textContent = `${formatCurrency(savings)}`

		if (benefitsList) {
			benefitsList.innerHTML = benefits.map(b => `<li>${b}</li>`).join("")
		}
	}

	slider.addEventListener("input", e => {
		presetBtns.forEach(btn => btn.classList.remove("active"))
		updateCalc(e.target.value)
	})

	presetBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			presetBtns.forEach(b => b.classList.remove("active"))
			btn.classList.add("active")
			const val = btn.getAttribute("data-val")
			slider.value = val
			updateCalc(val)
		})
	})

	// Initial calculation
	updateCalc(slider.value)
}

/* ==========================================================================
   5. FAQ ACCORDION
   ========================================================================== */
function setupFAQAccordion() {
	const faqQuestions = document.querySelectorAll(".faq-question")
	faqQuestions.forEach(btn => {
		btn.addEventListener("click", () => {
			const item = btn.closest(".faq-item")
			if (!item) return

			const isOpen = item.classList.contains("open")
			// Close all other items
			document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"))
			if (!isOpen) {
				item.classList.add("open")
			}
		})
	})
}

/* ==========================================================================
   6. MODALS SETUP (POINTS HISTORY & REDEEM EXECUTION)
   ========================================================================== */
function setupModals() {
	// Points History Modal
	const modalHistory = document.getElementById("modal-points-history")
	const btnViewHistory = document.getElementById("btn-view-history")
	const btnCloseHistory = document.getElementById("btn-close-history-modal")
	const btnDismissHistory = document.getElementById("btn-dismiss-history-modal")
	const historyTbody = document.getElementById("points-history-tbody")

	if (btnViewHistory && modalHistory) {
		btnViewHistory.addEventListener("click", () => {
			const user = getCurrentUser()
			if (!user) {
				openAuthModal("login")
				return
			}

			const historyList = getUserPointsHistory(user)
			if (historyTbody) {
				if (historyList.length === 0) {
					historyTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color:#94a3b8;">Chưa có lịch sử điểm nào.</td></tr>`
				} else {
					historyTbody.innerHTML = historyList.map(item => {
						const isPlus = item.points > 0
						const ptsClass = isPlus ? "pt-plus" : "pt-minus"
						const ptsPrefix = isPlus ? "+" : ""
						const dateFormatted = item.date ? formatDateVN(item.date) : "Gần đây"

						return `
							<tr>
								<td style="color:#a6adc8; font-size:12px;">${dateFormatted}</td>
								<td style="font-weight:600; color:#cdd6f4;">${item.title || "Giao dịch tích điểm"}</td>
								<td class="${ptsClass}" style="text-align:right;">${ptsPrefix}${item.points} Điểm</td>
							</tr>
						`
					}).join("")
				}
			}

			modalHistory.style.display = "flex"
		})

		const hideHistory = () => { modalHistory.style.display = "none" }
		if (btnCloseHistory) btnCloseHistory.onclick = hideHistory
		if (btnDismissHistory) btnDismissHistory.onclick = hideHistory
		modalHistory.addEventListener("click", e => {
			if (e.target === modalHistory) hideHistory()
		})
	}

	// Redeem Confirm Modal
	const modalRedeem = document.getElementById("modal-redeem-confirm")
	const btnCancelRedeem = document.getElementById("btn-cancel-redeem")
	const btnCloseRedeem = document.getElementById("btn-close-redeem-modal")
	const btnExecuteRedeem = document.getElementById("btn-execute-redeem")

	if (modalRedeem) {
		const hideRedeem = () => {
			modalRedeem.style.display = "none"
			pendingRedeemReward = null
		}
		if (btnCancelRedeem) btnCancelRedeem.onclick = hideRedeem
		if (btnCloseRedeem) btnCloseRedeem.onclick = hideRedeem
		modalRedeem.addEventListener("click", e => {
			if (e.target === modalRedeem) hideRedeem()
		})

		if (btnExecuteRedeem) {
			btnExecuteRedeem.addEventListener("click", async () => {
				if (!pendingRedeemReward) return

				btnExecuteRedeem.disabled = true
				btnExecuteRedeem.textContent = "Đang xử lý..."

				try {
					const res = await redeemMemberReward(pendingRedeemReward.id)
					if (res.success) {
						hideRedeem()
						showToast(
							`🎉 ${res.message} Mã của bạn là: "${res.voucher.code}"`,
							"success"
						)
						// Update UI immediately
						setupMemberHeroUI()
						renderRewardsStore()
					} else {
						showToast(res.message || "Đổi quà không thành công!", "error")
					}
				} catch (err) {
					console.error("Redeem error:", err)
					showToast("Đã có lỗi xảy ra khi đổi quà.", "error")
				} finally {
					btnExecuteRedeem.disabled = false
					btnExecuteRedeem.textContent = "Xác Nhận Đổi"
				}
			})
		}
	}
}
