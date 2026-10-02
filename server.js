import jsonServer from 'json-server'
import auth from 'json-server-auth'
import fs from 'fs'
import path from 'path'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

const PORT = process.env.PORT || 3000

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

// Custom endpoint to reset DB to seed state (used by Admin portal reset button)
server.post('/reset-db', (req, res) => {
	try {
		const seedPath = path.resolve('db.seed.json')
		const targetPath = path.resolve('db.json')
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

// Register json-server-auth middleware (handles /register, /login, JWT tokens)
server.use(auth)

// Use json-server router for all resource CRUD (/movies, /showtimes, /concessions, /bookings, /cinemas, etc.)
server.use(router)

server.listen(PORT, () => {
	console.log(`🚀 [JSON-Server + Auth] Running on http://localhost:${PORT}`)
	console.log(`   - Auth Endpoints: POST /register, POST /login`)
	console.log(`   - CRUD Endpoints: /movies, /showtimes, /concessions, /bookings, /cinemas, /users`)
})
