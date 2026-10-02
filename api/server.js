import jsonServer from 'json-server'
import auth from 'json-server-auth'
import fs from 'fs'
import path from 'path'

const server = jsonServer.create()

// On Vercel, the filesystem outside /tmp is read-only. Copy db.json to /tmp/db.json to allow writes
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION)
let dbPath = path.resolve(process.cwd(), 'db.json')

if (isVercel) {
	const tmpDbPath = path.join('/tmp', 'db.json')
	if (!fs.existsSync(tmpDbPath)) {
		const seedPath = fs.existsSync(path.resolve(process.cwd(), 'db.seed.json'))
			? path.resolve(process.cwd(), 'db.seed.json')
			: path.resolve(process.cwd(), 'db.json')
		fs.copyFileSync(seedPath, tmpDbPath)
	}
	dbPath = tmpDbPath
}

const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

// Bind router db to server
server.db = router.db

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Normalize /api prefix if present
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

// Custom endpoint to reset DB to seed state
server.post('/reset-db', (req, res) => {
	try {
		const seedPath = path.resolve(process.cwd(), 'db.seed.json')
		if (fs.existsSync(seedPath)) {
			const seedData = fs.readFileSync(seedPath, 'utf8')
			try {
				fs.writeFileSync(dbPath, seedData, 'utf8')
			} catch (_) { }
			const freshData = JSON.parse(seedData)
			server.db.setState(freshData)
			return res.status(200).json({ success: true, message: 'Database reset to seed data successfully!' })
		}
		return res.status(404).json({ success: false, message: 'db.seed.json not found' })
	} catch (err) {
		return res.status(500).json({ success: false, error: err.message })
	}
})

// json-server-auth
server.use(auth)

// json-server router
server.use(router)

export default server
