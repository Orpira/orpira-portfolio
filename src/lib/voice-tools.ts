// Herramientas del asistente de voz durante la llamada. Deben responder en
// menos de 2 segundos: solo hacen una escritura rápida en Supabase.
import { supabaseAdmin } from "./supabase-admin";
import { toolResults, type VoiceToolCall } from "./voice-provider";

async function run(call: VoiceToolCall): Promise<string> {
	if (call.name === "no_llamar") {
		if (!call.voiceCallId) return "No he podido registrarlo. Orlando lo anotará a mano.";
		const { data, error } = await supabaseAdmin.rpc("mark_voice_do_not_call", {
			p_voice_call_id: call.voiceCallId,
		});
		if (error || !data) {
			console.error("No se pudo registrar 'no llamar'", error?.code ?? "missing");
			return "No he podido registrarlo. Orlando lo anotará a mano.";
		}
		return "Registrado: no volveremos a llamar a este número.";
	}
	return "Herramienta no disponible.";
}

export async function handleToolCalls(calls: VoiceToolCall[]) {
	const results = await Promise.all(calls.map(async (call) => ({ call, result: await run(call) })));
	return toolResults(results);
}
