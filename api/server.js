import jsonServer from 'json-server'
import auth from 'json-server-auth'
import fs from 'fs'
import path from 'path'

const server = jsonServer.create()

// Path to db.json
const dbPath = path.resolve(process.cwd(), 'db.json')
const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

// Bind router db to server
server.db = router.db

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Custom middleware: Support login via phone number in addition to email
server.use((req, res, next) => {
	if (req.method === 'POST' && req.path === '/login') {
		const { email, account, phone } = req.body || {}
		const identifier = (email || account || phone || '').trim().toLowerCase()
		if (identifier && !identifier.includes('@')) {
			const cleanPhone = identifier.replace(/[\s.-]/g, '')
			const user = server.db
				.get('users')
				.find(u => u.phone && u.phone.replace(/[\s.-]/g, '') === cleanPhone)
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
