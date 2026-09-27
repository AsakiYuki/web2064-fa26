import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				movies: resolve(__dirname, 'movies.html'),
				movieDetail: resolve(__dirname, 'movie-detail.html'),
				schedule: resolve(__dirname, 'schedule.html'),
				booking: resolve(__dirname, 'booking.html'),
				checkout: resolve(__dirname, 'checkout.html'),
				profile: resolve(__dirname, 'profile.html'),
				pricing: resolve(__dirname, 'pricing.html'),
				notFound: resolve(__dirname, '404.html'),
				error: resolve(__dirname, 'error.html'),
			},
		},
	},
})
