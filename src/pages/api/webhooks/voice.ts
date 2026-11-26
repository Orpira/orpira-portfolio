// Server URL del asistente de voz (Vapi). Recibe el informe de fin de llamada
// y lo guarda en el CRM. Si el asistente usa esta misma URL para las
// herramientas, también las atiende.
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { readVoiceEvent } from "../../../lib/voice-provider";
import { handleToolCalls } from "../../../lib/voice-tools";
import { notifyTelegram } from "../../../lib/telegram";

export const prerender = false;

const outcomes: Record<string, string> = {
	recorded: "✅ Llamada completada",
	retry: "📵 No contestó, se reintentará",
	no_answer: "📵 No contestó tras todos los intentos",
};

export const POST: APIRoute = async ({ request, url }) => {
	const event = await readVoiceEvent(request);
	if (event instanceof Response) return event;
	if (event.type === "tools") return handleToolCalls(event.calls);
	if (event.type !== "report") return new Response(null, { status: 204 });

	const { report } = event;
	if (!report.voiceCallId && !report.providerCallId) return new Response(null, { status: 400 });

	const { data: status, error } = await supabaseAdmin.rpc("record_voice_call", {
		p_voice_call_id: report.voiceCallId,
		p_provider_call_id: report.providerCallId,
		p_attempt: report.attempt,
		p_answered: report.answered,
		p_ended_reason: report.endedReason,
		p_duration_seconds: report.durationSeconds,
		p_summary: report.summary,
		p_transcript: report.transcript,
		p_brief: report.brief,
	});
	if (error) {
		console.error("No se pudo guardar la llamada", error.code);
		return new Response(null, { status: 503 });
	}

	const title = outcomes[String(status)];
	if (title) {
		const query = supabaseAdmin.from("voice_calls").select("contact_id, contacts(name)");
		const { data: saved } = await (report.voiceCallId
			? query.eq("id", report.voiceCallId)
			: query.eq("provider_call_id", report.providerCallId!)).maybeSingle();
		const contact = saved?.contacts as { name?: string } | null | undefined;
		const lines = [
			`${title}: ${contact?.name ?? "contacto"}`,
			status === "recorded" && report.summary ? `\n${report.summary.slice(0, 1500)}` : "",
			saved?.contact_id ? `\n${url.origin}/dashboard/lead/${saved.contact_id}` : "",
		];
		await notifyTelegram(lines.join(""));
	}

	return Response.json({ status }, { headers: { "Cache-Control": "no-store" } });
};
