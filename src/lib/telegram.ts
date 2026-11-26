// Aviso a Orlando por Telegram. Si faltan las variables, no hace nada.
export async function notifyTelegram(text: string) {
	const token = import.meta.env.TELEGRAM_BOT_TOKEN;
	const chatId = import.meta.env.TELEGRAM_CHAT_ID;
	if (!token || !chatId) return;
	try {
		const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
			signal: AbortSignal.timeout(4000),
		});
		if (!response.ok) console.error("Telegram respondió", response.status);
	} catch {
		console.error("No se pudo avisar por Telegram");
	}
}
