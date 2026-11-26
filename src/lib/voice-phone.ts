// Teléfono y consentimiento para la llamada del asistente de voz.

/** Versión del texto de consentimiento que se muestra en el formulario. */
export const CALL_CONSENT_POLICY_VERSION = "2026-11-llamada-v1";

/**
 * La función se activa con VOICE_CALLS_ENABLED=true en Vercel (tras aplicar
 * 14-crm-voice.sql). Solo se lee en el servidor y al compilar: la portada es
 * estática, así que cambiarla exige volver a desplegar. Se acepta también el
 * nombre anterior, PUBLIC_VOICE_CALLS_ENABLED.
 */
const flag =
	import.meta.env.VOICE_CALLS_ENABLED ??
	process.env.VOICE_CALLS_ENABLED ??
	import.meta.env.PUBLIC_VOICE_CALLS_ENABLED ??
	process.env.PUBLIC_VOICE_CALLS_ENABLED;
export const voiceCallsEnabled = flag?.trim().toLowerCase() === "true";

const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Normaliza un teléfono a E.164. Acepta espacios, guiones, puntos y
 * paréntesis, el prefijo 00 y números españoles de 9 cifras sin prefijo.
 * Devuelve null si no es un número válido.
 */
export function normalizePhone(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const raw = value.trim();
	if (!raw || raw.length > 32) return null;
	let phone = raw.replace(/[\s().-]/g, "");
	if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
	if (/^[6789]\d{8}$/.test(phone)) phone = `+34${phone}`;
	return E164.test(phone) ? phone : null;
}
