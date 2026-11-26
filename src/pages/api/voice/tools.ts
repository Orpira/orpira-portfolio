// URL de las herramientas del asistente de voz (Vapi, mensajes tool-calls).
import type { APIRoute } from "astro";
import { readVoiceEvent } from "../../../lib/voice-provider";
import { handleToolCalls } from "../../../lib/voice-tools";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const event = await readVoiceEvent(request);
	if (event instanceof Response) return event;
	if (event.type !== "tools") return new Response(null, { status: 204 });
	return handleToolCalls(event.calls);
};
