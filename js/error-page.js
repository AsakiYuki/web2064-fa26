/**
 * Beta Cinemas - 404 & Error Page Logic
 */
import { setupHeaderAndFooter } from "./common.js"

document.addEventListener("DOMContentLoaded", async () => {
	await setupHeaderAndFooter()

	const urlParams = new URLSearchParams(window.location.search)
	const fromPath = urlParams.get("from")
	const missingUrlEl = document.getElementById("missing-url-code")

	if (missingUrlEl && fromPath) {
		missingUrlEl.textContent = fromPath
		missingUrlEl.style.display = "inline-block"
	}
})
