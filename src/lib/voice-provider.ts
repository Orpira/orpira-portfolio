// Única capa específica de Vapi. El resto del CRM trabaja con los tipos
// neutros de abajo, así que cambiar de proveedor (Retell, LiveKit…) solo
// exige reescribir este archivo.
import { createHash, timingSafeEqual } from "node:crypto";

export type VoiceCallReport = {
	voiceCallId: string | null;
	providerCallId: string | null;
	attempt: number | null;
	answered: boolean;
	endedReason: string | null;
	durationSeconds: number | null;
	summary: string | null;
	transcript: string | null;
	brief: Record<string, unknown> | null;
};

export type VoiceToolCall = {
	id: string;
	name: string;
	args: Record<string, unknown>;
	voiceCallId: string | null;
};

export type VoiceEvent =
	| { type: "report"; report: VoiceCallReport }
	| { type: "tools"; calls: VoiceToolCall[] }
	| { type: "other" };

export const VOICE_PROVIDER = "vapi";

const MAX_BYTES = 256 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVIDER_ID = /^[\w-]{1,128}$/;

// Motivos de fin con los que la persona no llegó a hablar con el asistente.
const NOT_ANSWERED = [
	"customer-did-not-answer",
	"customer-busy",
	"voicemail",
	"failed-to-connect",
	"call.start.error",
	"twilio-failed",
	"vonage-failed",
	"telnyx-failed",
];

const object = (value: unknown): Record<string, unknown> =>
	value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const text = (value: unknown, max: number) =>
	typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const sameSecret = (received: string, expected: string) => {
	// Se comparan resúmenes de igual longitud para no filtrar la longitud del secreto.
	const a = createHash("sha256").update(received).digest();
	const b = createHash("sha256").update(expected).digest();
	return timingSafeEqual(a, b);
};

/**
 * Autentica y lee una petición del Server URL de Vapi. Vapi envía el secreto
 * de la credencial "Bearer Token" en Authorization o, con la credencial
 * heredada, en X-Vapi-Secret. Devuelve una Response de error o el evento.
 */
export async function readVoiceEvent(request: Request): Promise<Response | VoiceEvent> {
	const secret = import.meta.env.VAPI_WEBHOOK_SECRET;
	if (!secret) return new Response(null, { status: 503 });

	const auth = request.headers.get("authorization");
	const token = auth?.startsWith("Bearer ") ? auth.slice(7) : request.headers.get("x-vapi-secret");
	if (!token || !sameSecret(token, secret)) return new Response(null, { status: 401 });

	const reader = request.body?.getReader();
	if (!reader) return new Response(null, { status: 400 });
	const chunks: Uint8Array[] = [];
	let bytes = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		bytes += value.byteLength;
		if (bytes > MAX_BYTES) {
			await reader.cancel();
			return new Response(null, { status: 413 });
		}
		chunks.push(value);
	}

	let body: Record<string, unknown>;
	try {
		body = object(JSON.parse(Buffer.concat(chunks).toString("utf8")));
	} catch {
		return new Response(null, { status: 400 });
	}

	const message = object(body.message);
	const call = object(message.call);
	const metadata = object(call.metadata);
	const voiceCallId = typeof metadata.voiceCallId === "string" && UUID.test(metadata.voiceCallId)
		? metadata.voiceCallId
		: null;
	const providerCallId = typeof call.id === "string" && PROVIDER_ID.test(call.id) ? call.id : null;
	const attempt = Number.isInteger(metadata.attempt) && Number(metadata.attempt) > 0 ? Number(metadata.attempt) : null;

	if (message.type === "end-of-call-report") {
		const analysis = object(message.analysis);
		const artifact = object(message.artifact);
		const endedReason = text(message.endedReason, 120);
		const transcript = text(artifact.transcript, 60000) ?? text(message.transcript, 60000);
		const rawDuration = Number(message.durationSeconds);
		const durationSeconds = Number.isFinite(rawDuration) && rawDuration >= 0 ? Math.round(rawDuration) : null;
		const reason = endedReason?.toLowerCase() ?? "";
		const answered = Boolean(transcript) && !NOT_ANSWERED.some((value) => reason.includes(value));
		const structured = object(analysis.structuredData);
		return {
			type: "report",
			report: {
				voiceCallId,
				providerCallId,
				attempt,
				answered,
				endedReason,
				durationSeconds,
				summary: text(analysis.summary, 4000) ?? text(message.summary, 4000),
				transcript,
				brief: Object.keys(structured).length ? structured : null,
			},
		};
	}

	if (message.type === "tool-calls") {
		const list = Array.isArray(message.toolCallList) ? message.toolCallList : [];
		const calls = list.slice(0, 5).map((item) => {
			const entry = object(item);
			const fn = object(entry.function);
			let args = object(fn.arguments);
			if (typeof fn.arguments === "string") {
				try {
					args = object(JSON.parse(fn.arguments));
				} catch {
					args = {};
				}
			}
			return {
				id: typeof entry.id === "string" ? entry.id.slice(0, 128) : "",
				name: typeof fn.name === "string" ? fn.name.slice(0, 64) : "",
				args,
				voiceCallId,
			};
		}).filter((entry) => entry.id && entry.name);
		return { type: "tools", calls };
	}

	return { type: "other" };
}

/** Respuesta que Vapi espera a un mensaje tool-calls. */
export const toolResults = (results: { call: VoiceToolCall; result: string }[]) =>
	Response.json(
		{ results: results.map(({ call, result }) => ({ name: call.name, toolCallId: call.id, result })) },
		{ headers: { "Cache-Control": "no-store" } },
	);
