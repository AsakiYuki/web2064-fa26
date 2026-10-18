import jsonServer from 'json-server'
import auth from 'json-server-auth'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION)
const dbPath = isVercel ? path.join('/tmp', 'db.json') : path.resolve('db.json')
if (isVercel && !fs.existsSync(dbPath)) {
	fs.copyFileSync(path.resolve('db.seed.json'), dbPath)
}
const server = jsonServer.create()
const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

const PORT = process.env.PORT || 3000
const JWT_SECRET = 'json-server-auth-123456'

const VOUCHER_RULES = {
	BETA10: { type: 'percent', value: 10, minOrder: 0, maxDiscount: 100000 },
	BETA20: { type: 'percent', value: 20, minOrder: 100000, maxDiscount: 150000 },
	BETA50: { type: 'fixed', value: 50000, minOrder: 0, minConcessions: 100000, maxDiscount: 50000 },
	FREEPOP: { type: 'fixed', value: 30000, minOrder: 0, minConcessions: 50000, maxDiscount: 30000 },
	HAPPYTUE: { type: 'fixed', value: 20000, minOrder: 50000, weekday: 2, maxDiscount: 20000 },
	'BETA-U22': { type: 'fixed', value: 20000, minOrder: 50000, maxDiscount: 20000 },
}

function resolveRequestUser(req, res, required = false) {
	const header = req.headers.authorization || ''
	if (!header) {
		if (required) res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' })
		return null
	}
	const [scheme, token] = header.split(' ')
	try {
		if (scheme !== 'Bearer' || !token) throw new Error('Invalid token')
		const claims = jwt.verify(token, JWT_SECRET)
		const user = server.db.get('users').find(u => String(u.id) === String(claims.sub)).value()
		if (!user) throw new Error('User not found')
		return user
	} catch {
		res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
		return null
	}
}

function calculateServerVoucher(code, user, { rawTotal, concessionsTotal = 0, showDate } = {}) {
	const cleanCode = String(code || '').trim().toUpperCase()
	const amount = Number(rawTotal)
	const concessionAmount = Number(concessionsTotal) || 0
	if (!cleanCode || !Number.isFinite(amount) || amount <= 0) {
		return { success: false, message: 'Mã voucher hoặc tổng đơn hàng không hợp lệ.' }
	}

	const ownedMatches = (user?.vouchers || []).filter(v => String(v.code || '').toUpperCase() === cleanCode)
	const owned = ownedMatches.find(v => v.status === 'active' && new Date(v.expiresAt).getTime() > Date.now()) || ownedMatches[0]
	const rewardRequiresOwnership = (server.db.get('member_rewards').value() || []).some(
		reward => String(reward.code || '').toUpperCase() === cleanCode,
	)
	if (rewardRequiresOwnership && !owned) {
		return { success: false, message: 'Voucher này cần được đổi bằng điểm trước khi sử dụng.' }
	}
	if (owned) {
		if (owned.status !== 'active') return { success: false, message: 'Voucher này đã được sử dụng hoặc không còn hiệu lực.' }
		const expiresAt = owned.expiresAt ? new Date(owned.expiresAt).getTime() : NaN
		if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
			return { success: false, message: 'Voucher này đã hết hạn.' }
		}
	}

	const rule = VOUCHER_RULES[cleanCode]
	if (!rule) return { success: false, message: 'Voucher này không áp dụng thanh toán trực tuyến.' }
	if (amount < (rule.minOrder || 0)) {
		return { success: false, message: `Đơn hàng cần đạt tối thiểu ${rule.minOrder.toLocaleString('vi-VN')}đ.` }
	}
	if (concessionAmount < (rule.minConcessions || 0)) {
		return { success: false, message: `Cần có combo bắp nước từ ${rule.minConcessions.toLocaleString('vi-VN')}đ để dùng mã này.` }
	}
	if (rule.weekday !== undefined) {
		const day = new Date(`${showDate}T00:00:00Z`).getUTCDay()
		if (!showDate || Number.isNaN(day) || day !== rule.weekday) {
			return { success: false, message: 'Mã này chỉ áp dụng cho suất chiếu vào Thứ Ba.' }
		}
	}
	let discountAmount = rule.type === 'percent' ? Math.round(amount * rule.value / 100) : rule.value
	if (rule.maxDiscount) discountAmount = Math.min(discountAmount, rule.maxDiscount)
	discountAmount = Math.min(discountAmount, amount)
	return { success: true, code: cleanCode, discountAmount, ownedVoucher: owned || null }
}

function persistState(nextState) {
	server.db.setState(nextState)
	server.db.write()
}

function userWithoutPassword(user) {
	if (!user) return null
	const { password, ...safeUser } = user
	return safeUser
}

// Bind the router db to the server
server.db = router.db

// Set default middlewares (logger, static, cors, no-cache)
server.use(middlewares)
server.use(jsonServer.bodyParser)

// Normalize /api prefix if present (allows calling http://localhost:3000/api/... directly)
server.use((req, res, next) => {
	if (req.url.startsWith('/api/')) {
		req.url = req.url.replace(/^\/api/, '')
	} else if (req.url === '/api') {
		req.url = '/'
	}
	next()
})

// Custom middleware: Support login via phone number, username, or admin account in addition to email
server.use((req, res, next) => {
	if (req.method === 'POST' && req.path === '/login') {
		const { email, account, username, phone } = req.body || {}
		const identifier = (email || account || username || phone || '').trim().toLowerCase()
		if (identifier) {
			const cleanPhone = identifier.replace(/[\s.-]/g, '')
			const user = server.db
				.get('users')
				.find(u =>
					(u.email && u.email.toLowerCase() === identifier) ||
					(u.username && u.username.toLowerCase() === identifier) ||
					(identifier === 'admin' && (u.role === 'admin' || u.username === 'admin' || (u.email && u.email.toLowerCase().startsWith('admin')))) ||
					(u.phone && u.phone.replace(/[\s.-]/g, '') === cleanPhone)
				)
				.value()
			if (user && user.email) {
				req.body.email = user.email
			}
		}
	}
	next()
})

// Do not permit password resets based only on a public account identifier.
server.post('/reset-password', (_req, res) => {
	return res.status(501).json({ success: false, message: 'Đặt lại mật khẩu cần xác minh email hoặc số điện thoại. Vui lòng liên hệ hỗ trợ tài khoản.' })
})

// Custom endpoint: Change password with old password verification
server.post('/change-password', (req, res) => {
	const caller = resolveRequestUser(req, res, true)
	if (!caller) return
	const { oldPassword, newPassword } = req.body || {}
	if (!oldPassword || !newPassword) {
		return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới' })
	}
	if (newPassword.length < 6) {
		return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
	}
	if (oldPassword === newPassword) {
		return res.status(400).json({ success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ' })
	}

	const user = server.db
		.get('users')
		.find(u => String(u.id) === String(caller.id))
		.value()

	if (!user) {
		return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng trên hệ thống' })
	}

	let isOldValid = false
	if (user.password) {
		if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
			isOldValid = bcrypt.compareSync(oldPassword, user.password)
		} else {
			isOldValid = (user.password === oldPassword)
		}
	}

	if (!isOldValid) {
		return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác! Vui lòng kiểm tra lại.' })
	}

	const hashedPassword = bcrypt.hashSync(newPassword, 10)
	server.db.get('users').find({ id: user.id }).assign({ password: hashedPassword }).write()
	return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công trên hệ thống!' })
})

// Redeem a reward and write its points transaction in one server-side operation.
server.post('/member/redeem', (req, res) => {
	const user = resolveRequestUser(req, res, true)
	if (!user) return
	const { rewardId, requestId } = req.body || {}
	if (!requestId || String(requestId).length > 100) {
		return res.status(400).json({ success: false, message: 'Thiếu mã giao dịch đổi quà.' })
	}
	const state = JSON.parse(JSON.stringify(server.db.getState()))
	state.points_transactions = Array.isArray(state.points_transactions) ? state.points_transactions : []
	const prior = state.points_transactions.find(tx => tx.requestId === requestId)
	if (prior) {
		if (String(prior.userId) !== String(user.id)) return res.status(409).json({ success: false, message: 'Mã giao dịch đã được sử dụng.' })
		if (String(prior.rewardId) !== String(rewardId)) return res.status(409).json({ success: false, message: 'Mã giao dịch đã gắn với phần thưởng khác.' })
		const priorUser = state.users.find(u => String(u.id) === String(user.id))
		const priorReward = (state.member_rewards || []).find(item => String(item.id) === String(prior.rewardId))
		const priorVoucher = (priorUser?.vouchers || []).find(item => item.id === prior.voucherId)
		return res.json({ success: true, transaction: prior, reward: priorReward, voucher: priorVoucher, user: userWithoutPassword(priorUser) })
	}
	const reward = (state.member_rewards || []).find(item => String(item.id) === String(rewardId))
	if (!reward) return res.status(404).json({ success: false, message: 'Phần thưởng không tồn tại.' })
	const points = Number(reward.points)
	const target = state.users.find(u => String(u.id) === String(user.id))
	if (!Number.isFinite(points) || points <= 0) return res.status(400).json({ success: false, message: 'Số điểm đổi quà không hợp lệ.' })
	if ((Number(target.points) || 0) < points) {
		return res.status(409).json({ success: false, code: 'INSUFFICIENT_POINTS', message: 'Số dư điểm hiện tại không đủ để đổi quà.' })
	}

	const now = new Date()
	const expiryDays = Math.max(1, Number(reward.expiryDays) || 30)
	const expiresAt = new Date(now.getTime() + expiryDays * 86400000).toISOString()
	const voucher = {
		id: `V-${requestId}`,
		code: reward.code,
		name: reward.title,
		points,
		category: reward.category,
		discount: reward.description,
		status: 'active',
		redeemedAt: now.toISOString(),
		expiresAt,
	}
	target.points = (Number(target.points) || 0) - points
	target.vouchers = [...(target.vouchers || []), voucher]
	target.pointsHistory = [...(target.pointsHistory || [])]
	target.pointsHistory.unshift({
		id: `PT-${requestId}`,
		requestId,
		title: `Đổi quà: ${reward.title}`,
		points: -points,
		date: now.toISOString(),
		code: reward.code,
		type: 'redeem',
	})
	const transaction = {
		requestId,
		userId: target.id,
		rewardId: reward.id,
		points: -points,
		voucherId: voucher.id,
		createdAt: now.toISOString(),
		remainingPoints: target.points,
	}
	state.points_transactions.push(transaction)
	persistState(state)
	return res.status(201).json({ success: true, transaction, voucher, user: userWithoutPassword(target) })
})

server.post('/vouchers/validate', (req, res) => {
	const user = resolveRequestUser(req, res, false)
	if (req.headers.authorization && !user) return
	const result = calculateServerVoucher(req.body?.code, user, req.body || {})
	return res.status(result.success ? 200 : 400).json(result)
})

// Commit the ticket, consume a member voucher, and award points atomically.
server.post('/checkout/complete', (req, res) => {
	const user = resolveRequestUser(req, res, false)
	if (req.headers.authorization && !user) return
	const ticket = req.body?.ticket
	const context = req.body?.voucherContext || {}
	if (!ticket?.id) return res.status(400).json({ success: false, message: 'Thiếu mã đặt vé.' })

	const state = JSON.parse(JSON.stringify(server.db.getState()))
	state.bookings = Array.isArray(state.bookings) ? state.bookings : []
	state.voucher_uses = Array.isArray(state.voucher_uses) ? state.voucher_uses : []
	const priorBooking = state.bookings.find(item => String(item.id) === String(ticket.id))
	if (priorBooking) return res.json({ success: true, ticket: priorBooking, user: user ? userWithoutPassword(state.users.find(u => String(u.id) === String(user.id))) : null, duplicate: true })

	let committedTicket = { ...ticket }
	if (ticket.voucherCode) {
		const targetUser = user ? state.users.find(u => String(u.id) === String(user.id)) : null
		const validation = calculateServerVoucher(ticket.voucherCode, targetUser, context)
		if (!validation.success) return res.status(409).json(validation)
		committedTicket.discountAmount = validation.discountAmount
		committedTicket.total = Math.max(0, Number(context.rawTotal) - validation.discountAmount)
		if (validation.ownedVoucher) {
			validation.ownedVoucher.status = 'used'
			validation.ownedVoucher.usedAt = new Date().toISOString()
			validation.ownedVoucher.bookingId = ticket.id
			state.voucher_uses.push({ userId: targetUser.id, voucherId: validation.ownedVoucher.id, code: validation.code, bookingId: ticket.id, usedAt: validation.ownedVoucher.usedAt })
		}
	}

	state.bookings.unshift(committedTicket)
	let updatedUser = null
	if (user) {
		updatedUser = state.users.find(u => String(u.id) === String(user.id))
		const earnedPoints = Math.max(0, Math.round((Number(committedTicket.total) || 0) / 1000))
		if (earnedPoints > 0) {
			updatedUser.points = (Number(updatedUser.points) || 0) + earnedPoints
			updatedUser.pointsHistory = [...(updatedUser.pointsHistory || [])]
			updatedUser.pointsHistory.unshift({
				id: `PE-${ticket.id}`,
				title: `Tích điểm đặt vé #${ticket.id}`,
				points: earnedPoints,
				date: new Date().toISOString(),
				type: 'earn',
			})
		}
	}
	persistState(state)
	return res.status(201).json({ success: true, ticket: committedTicket, user: updatedUser ? userWithoutPassword(updatedUser) : null })
})

// Custom endpoint to reset DB to seed state (used by Admin portal reset button)
server.post('/reset-db', (req, res) => {
	const caller = resolveRequestUser(req, res, true)
	if (!caller) return
	if (caller.role !== 'admin') return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được thực hiện thao tác này.' })
	try {
		const seedPath = path.resolve('db.seed.json')
		const targetPath = dbPath
		if (fs.existsSync(seedPath)) {
			const seedData = fs.readFileSync(seedPath, 'utf8')
			fs.writeFileSync(targetPath, seedData, 'utf8')
			// Reload router db in memory
			const freshData = JSON.parse(seedData)
			server.db.setState(freshData)
			return res.status(200).json({ success: true, message: 'Database reset to seed data successfully!' })
		}
		return res.status(404).json({ success: false, message: 'db.seed.json not found' })
	} catch (err) {
		return res.status(500).json({ success: false, error: err.message })
	}
})

// Protect every generic resource mutation on the server. User profile writes are
// handled by a separate authenticated endpoint so clients cannot set roles/points.
server.use((req, res, next) => {
	const method = req.method.toUpperCase()
	if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next()
	if (['/login', '/register'].includes(req.path)) return next()
	const caller = resolveRequestUser(req, res, true)
	if (!caller) return
	if (req.path === '/users' || req.path.startsWith('/users/')) {
		const targetId = req.path.split('/')[2]
		if (caller.role !== 'admin' && !(method === 'PATCH' && String(caller.id) === String(targetId))) {
			return res.status(403).json({ message: 'Không có quyền cập nhật tài khoản này.' })
		}
		if (caller.role !== 'admin' && Object.keys(req.body || {}).some(key => !['name', 'email', 'phone', 'birthday', 'gender', 'city', 'cinemaFavorite', 'avatarText', 'avatar'].includes(key))) {
			return res.status(403).json({ message: 'Không có quyền thay đổi trường dữ liệu này.' })
		}
		return next()
	}
	if (caller.role !== 'admin') return res.status(403).json({ message: 'Chỉ quản trị viên mới được thay đổi dữ liệu.' })
	return next()
})

// Explicit route for member_rewards
server.get('/member_rewards', (req, res) => {
	try {
		const rewards = server.db.get('member_rewards').value()
		if (Array.isArray(rewards) && rewards.length > 0) {
			return res.json(rewards)
		}
		const fallbackPath = path.resolve('public/data/member_rewards.json')
		if (fs.existsSync(fallbackPath)) {
			return res.json(JSON.parse(fs.readFileSync(fallbackPath, 'utf8')))
		}
		res.json([])
	} catch {
		res.json([])
	}
})

// Register json-server-auth middleware (handles /register, /login, JWT tokens)
server.use(auth)

// Use json-server router for all resource CRUD (/movies, /showtimes, /concessions, /bookings, /cinemas, etc.)
server.use(router)

if (!isVercel) server.listen(PORT, () => {
	console.log(`🚀 [JSON-Server + Auth] Running on http://localhost:${PORT}`)
	console.log(`   - Auth Endpoints: POST /register, POST /login`)
	console.log(`   - CRUD Endpoints: /movies, /showtimes, /concessions, /bookings, /cinemas, /users`)
})

export default server
