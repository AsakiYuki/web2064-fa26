/**
 * Beta Cinemas - Schedule Page Logic (Lịch Chiếu Theo Rạp)
 */
import { setupHeaderAndFooter } from "./common.js"
import { ShowtimePicker } from "./showtimes-picker.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	const showtimePicker = new ShowtimePicker({
		containerId: "schedule-page-container",
		movieId: null, // Shows all movies!
	})
	await showtimePicker.init()
})
