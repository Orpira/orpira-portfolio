export const prerender = false;

import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter, getClientIp } from "../../lib/rate-limit";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const contactWebhookUrl = import.meta.env.CONTACT_WEBHOOK_URL;

if (!supabaseUrl) {
	throw new Error("PUBLIC_SUPABASE_URL no configurada");
}

if (!serviceKey) {
	throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
}

const supabase = createClient(supabaseUrl, serviceKey);

const MAX_BODY_BYTES = 16 * 1024;
const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const isRateLimited = createRateLimiter({
	max: RATE_LIMIT_MAX,
	windowMs: RATE_LIMIT_WINDOW_MS,
});

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
			"Cache-Control": "no-store",
		},
	});

const isTruthyHoneypot = (value: unknown) =>
	value === true || value === "true" || value === "on" || value === "1";

export const POST: APIRoute = async ({ request }) => {
	const correlationId = randomUUID();

	try {
		const contentType = request.headers.get("content-type") ?? "";
		if (!contentType.includes("application/json")) {
			return jsonResponse(
				{ success: false, error: "Formato no soportado." },
				415,
			);
		}

		const contentLength = Number(request.headers.get("content-length") ?? "0");
		if (contentLength > MAX_BODY_BYTES) {
			return jsonResponse(
				{ success: false, error: "Contenido demasiado grande." },
				413,
			);
		}

		const rawBody = await request.text();
		if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
			return jsonResponse(
				{ success: false, error: "Contenido demasiado grande." },
				413,
			);
		}

		let payload: unknown;
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return jsonResponse({ success: false, error: "Cuerpo invalido." }, 400);
		}

		if (typeof payload !== "object" || payload === null) {
			return jsonResponse({ success: false, error: "Cuerpo invalido." }, 400);
		}

		const data = payload as Record<string, unknown>;

		if (isTruthyHoneypot(data.botcheck)) {
			return jsonResponse({ success: true });
		}

			if (isRateLimited(getClientIp(request))) {
			return jsonResponse(
				{
					success: false,
					error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde.",
				},
				429,
			);
		}

		const name = typeof data.name === "string" ? data.name.trim() : "";
		const email =
			typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
		const message = typeof data.message === "string" ? data.message.trim() : "";

		if (data.consent !== true) {
			return jsonResponse(
				{
					success: false,
					error: "Debes aceptar la politica de privacidad.",
				},
				400,
			);
		}

		if (name.length < NAME_MIN || name.length > NAME_MAX) {
			return jsonResponse(
				{
					success: false,
					error: `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`,
				},
				400,
			);
		}

		if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
			return jsonResponse(
				{ success: false, error: "El email no es valido." },
				400,
			);
		}

		if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
			return jsonResponse(
				{
					success: false,
					error: `El mensaje debe tener entre ${MESSAGE_MIN} y ${MESSAGE_MAX} caracteres.`,
				},
				400,
			);
		}

		const { error } = await supabase.from("contacts").insert({
			name,
			email,
			message,
			source: "portfolio",
			status: "new",
		});

		if (error) {
			console.error(
				JSON.stringify({
					correlationId,
					scope: "contact-insert",
					code: error.code ?? "unknown",
				}),
			);
			return jsonResponse(
				{
					success: false,
					error: "No se pudo procesar la solicitud.",
					correlationId,
				},
				500,
			);
		}

		if (contactWebhookUrl) {
			try {
				const response = await fetch(contactWebhookUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ name, email, message }),
					signal: AbortSignal.timeout(5000),
				});

				if (!response.ok) {
					console.error(
						JSON.stringify({
							correlationId,
							scope: "contact-webhook",
							status: response.status,
						}),
					);
				}
			} catch {
				console.error(
					JSON.stringify({
						correlationId,
						scope: "contact-webhook",
						failed: true,
					}),
				);
			}
		}

		return jsonResponse({ success: true });
	} catch {
		console.error(
			JSON.stringify({ correlationId, scope: "contact-unhandled" }),
		);

		return jsonResponse(
			{
				success: false,
				error: "Error interno.",
				correlationId,
			},
			500,
		);
	}
};
