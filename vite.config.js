import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
	appType: 'mpa', // Multi-page Application: disable default SPA fallback to index.html
	plugins: [
		{
			name: 'vite-plugin-404-fallback',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					const rawUrl = req.url || '/'
					const pathname = rawUrl.split('?')[0]

					// Bypass Vite internal endpoints and static assets
					if (
						pathname.startsWith('/@') ||
						pathname.startsWith('/__vite') ||
						pathname.startsWith('/node_modules') ||
						pathname.startsWith('/style') ||
						pathname.startsWith('/js') ||
						pathname.startsWith('/data') ||
						pathname.startsWith('/poster') ||
						pathname.startsWith('/promo') ||
						pathname.endsWith('.ico') ||
						pathname.endsWith('.webp') ||
						pathname.endsWith('.jpg') ||
						pathname.endsWith('.jpeg') ||
						pathname.endsWith('.png') ||
						pathname.endsWith('.svg') ||
						pathname.endsWith('.js') ||
						pathname.endsWith('.scss') ||
						pathname.endsWith('.css') ||
						pathname.endsWith('.json')
					) {
						return next()
					}

					// Known pages map (supporting both clean URLs and .html extensions)
					const pageMap = {
						'/': '/index.html',
						'/index': '/index.html',
						'/index.html': '/index.html',
						'/movies': '/movies.html',
						'/movies.html': '/movies.html',
						'/movie-detail': '/movie-detail.html',
						'/movie-detail.html': '/movie-detail.html',
						'/schedule': '/schedule.html',
						'/schedule.html': '/schedule.html',
						'/booking': '/booking.html',
						'/booking.html': '/booking.html',
						'/checkout': '/checkout.html',
						'/checkout.html': '/checkout.html',
						'/profile': '/profile.html',
						'/profile.html': '/profile.html',
						'/pricing': '/pricing.html',
						'/pricing.html': '/pricing.html',
						'/404': '/404.html',
						'/404.html': '/404.html',
						'/error': '/error.html',
						'/error.html': '/error.html',
					}

					if (pageMap[pathname]) {
						if (pageMap[pathname] !== pathname) {
							req.url = pageMap[pathname] + (rawUrl.includes('?') ? '?' + rawUrl.split('?')[1] : '')
						}
						return next()
					}

					// Route does NOT exist -> automatically redirect to 404 page!
					res.writeHead(302, { Location: `/404.html?from=${encodeURIComponent(rawUrl)}` })
					res.end()
				})
			},
			configurePreviewServer(server) {
				server.middlewares.use((req, res, next) => {
					const rawUrl = req.url || '/'
					const pathname = rawUrl.split('?')[0]

					if (
						pathname.startsWith('/assets') ||
						pathname.startsWith('/data') ||
						pathname.startsWith('/poster') ||
						pathname.startsWith('/promo') ||
						pathname.endsWith('.ico') ||
						pathname.endsWith('.webp') ||
						pathname.endsWith('.jpg') ||
						pathname.endsWith('.jpeg') ||
						pathname.endsWith('.png') ||
						pathname.endsWith('.svg') ||
						pathname.endsWith('.js') ||
						pathname.endsWith('.css') ||
						pathname.endsWith('.json')
					) {
						return next()
					}

					const validPages = [
						'/',
						'/index.html',
						'/movies.html',
						'/movie-detail.html',
						'/schedule.html',
						'/booking.html',
						'/checkout.html',
						'/profile.html',
						'/pricing.html',
						'/404.html',
						'/error.html',
					]

					if (validPages.includes(pathname)) {
						return next()
					}

					res.writeHead(302, { Location: `/404.html?from=${encodeURIComponent(rawUrl)}` })
					res.end()
				})
			},
		},
	],
	build: {
		rollupOptions: {
			input: {
				main: resolve(import.meta.dirname, 'index.html'),
				movies: resolve(import.meta.dirname, 'movies.html'),
				movieDetail: resolve(import.meta.dirname, 'movie-detail.html'),
				schedule: resolve(import.meta.dirname, 'schedule.html'),
				booking: resolve(import.meta.dirname, 'booking.html'),
				checkout: resolve(import.meta.dirname, 'checkout.html'),
				profile: resolve(import.meta.dirname, 'profile.html'),
				pricing: resolve(import.meta.dirname, 'pricing.html'),
				notFound: resolve(import.meta.dirname, '404.html'),
				error: resolve(import.meta.dirname, 'error.html'),
			},
		},
	},
})
