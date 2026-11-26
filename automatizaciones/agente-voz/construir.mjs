#!/usr/bin/env node
/**
 * Monta el workflow de n8n y la configuración del asistente de Vapi.
 *
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SITE_URL=https://www.orpira.es \
 *   VAPI_ASSISTANT_ID=... \
 *   VAPI_PHONE_NUMBER_ID=... \
 *   VAPI_CREDENTIAL_ID=... \
 *   node automatizaciones/agente-voz/construir.mjs
 *
 * VAPI_ASSISTANT_ID y VAPI_PHONE_NUMBER_ID pueden quedar vacíos la primera
 * vez: el workflow no llama a nadie hasta que estén rellenos.
 *
 * Genera en dist/ (ignorado por git):
 *  - agente-voz.workflow.json  → importar en n8n
 *  - asistente-vapi.json       → crear/actualizar el asistente en Vapi
 * No lleva secretos: las claves van en las credenciales de n8n y de Vapi.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const leer = (f) => readFileSync(join(aqui, f), "utf8");

const cfg = {
	supabase: process.env.SUPABASE_URL,
	site: process.env.SITE_URL,
	assistantId: process.env.VAPI_ASSISTANT_ID ?? "",
	phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID ?? "",
	credentialId: process.env.VAPI_CREDENTIAL_ID ?? "",
	modelo: process.env.MODELO ?? "claude-sonnet-5-5",
};
const faltan = Object.entries({ SUPABASE_URL: cfg.supabase, SITE_URL: cfg.site })
	.filter(([, v]) => !v)
	.map(([k]) => k);
if (faltan.length) {
	console.error(`Faltan variables: ${faltan.join(", ")}`);
	process.exit(1);
}
cfg.supabase = cfg.supabase.replace(/\/+$/, "");
cfg.site = cfg.site.replace(/\/+$/, "");

// --- Workflow de n8n ----------------------------------------------------------

let n = 0;
const id = () => `7a0e5c1d-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const rpc = (name, position, nombre, cuerpo) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.httpRequest",
	typeVersion: 4.4,
	position,
	parameters: {
		method: "POST",
		url: `${cfg.supabase}/rest/v1/rpc/${nombre}`,
		authentication: "genericCredentialType",
		genericAuthType: "httpHeaderAuth",
		sendBody: true,
		specifyBody: "json",
		jsonBody: `={{ JSON.stringify(${cuerpo}) }}`,
		options: { timeout: 12000 },
	},
});
const code = (name, position, jsCode) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.code",
	typeVersion: 2,
	position,
	parameters: { jsCode },
});

const nodos = [
	{
		id: id(),
		name: "Cada cinco minutos",
		type: "n8n-nodes-base.scheduleTrigger",
		typeVersion: 1.2,
		position: [0, 0],
		parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 5 }] } },
	},
	code(
		"Configuración",
		[220, 0],
		[
			"// Vacíos = el flujo no llama a nadie. Rellénalos al tener el número importado en Vapi.",
			`const assistantId = ${JSON.stringify(cfg.assistantId)};`,
			`const phoneNumberId = ${JSON.stringify(cfg.phoneNumberId)};`,
			"if (!assistantId || !phoneNumberId) return [];",
			"return [{ json: { assistantId, phoneNumberId } }];",
		].join("\n"),
	),
	rpc("Reservar llamada", [440, 0], "reserve_next_voice_call", "{}"),
	code(
		"Verificar reserva",
		[660, 0],
		[
			"const reserved = $input.all().flatMap(({ json }) => Array.isArray(json) ? json : [json]);",
			"if (reserved.length !== 1) return [];",
			"const [call] = reserved;",
			"if (!call.voice_call_id || !/^\\+[1-9]\\d{7,14}$/.test(call.phone ?? '')) return [];",
			"const { assistantId, phoneNumberId } = $('Configuración').first().json;",
			"const nombre = String(call.name ?? '').trim().split(/\\s+/)[0] || '';",
			"return [{ json: {",
			"  voice_call_id: call.voice_call_id,",
			"  body: {",
			"    assistantId,",
			"    phoneNumberId,",
			"    customer: { number: call.phone, name: String(call.name ?? '').slice(0, 40) },",
			"    assistantOverrides: { variableValues: { nombre, mensaje: String(call.message ?? '').slice(0, 2000), intento: call.attempt } },",
			"    metadata: { voiceCallId: call.voice_call_id, contactId: call.contact_id, attempt: call.attempt },",
			"  },",
			"} }];",
		].join("\n"),
	),
	{
		id: id(),
		name: "Lanzar llamada en Vapi",
		type: "n8n-nodes-base.httpRequest",
		typeVersion: 4.4,
		position: [880, 0],
		onError: "continueErrorOutput",
		retryOnFail: false,
		parameters: {
			method: "POST",
			url: "https://api.vapi.ai/call",
			authentication: "genericCredentialType",
			genericAuthType: "httpHeaderAuth",
			sendBody: true,
			specifyBody: "json",
			jsonBody: "={{ JSON.stringify($json.body) }}",
			options: { timeout: 15000 },
		},
	},
	rpc(
		"Registrar lanzamiento",
		[1120, -80],
		"register_voice_call_dispatch",
		"{ p_voice_call_id: $('Verificar reserva').item.json.voice_call_id, p_provider: 'vapi', p_provider_call_id: $json.id ?? null, p_error: $json.id ? null : 'Vapi no devolvió id de llamada' }",
	),
	rpc(
		"Registrar fallo",
		[1120, 120],
		"register_voice_call_dispatch",
		"{ p_voice_call_id: $('Verificar reserva').item.json.voice_call_id, p_provider: 'vapi', p_provider_call_id: null, p_error: String($json.error?.message ?? $json.message ?? 'Error al lanzar la llamada').slice(0, 500) }",
	),
];

const flecha = (to) => ({ node: to, type: "main", index: 0 });
const workflow = {
	name: "OrPiRa - Agente de voz saliente",
	nodes: nodos,
	connections: {
		"Cada cinco minutos": { main: [[flecha("Configuración")]] },
		Configuración: { main: [[flecha("Reservar llamada")]] },
		"Reservar llamada": { main: [[flecha("Verificar reserva")]] },
		"Verificar reserva": { main: [[flecha("Lanzar llamada en Vapi")]] },
		"Lanzar llamada en Vapi": { main: [[flecha("Registrar lanzamiento")], [flecha("Registrar fallo")]] },
	},
	active: false,
	settings: {
		executionOrder: "v1",
		// Las ejecuciones llevan teléfonos y mensajes: no se guardan.
		saveDataErrorExecution: "none",
		saveDataSuccessExecution: "none",
		saveManualExecutions: false,
		timezone: "Europe/Madrid",
	},
};

// --- Asistente de Vapi --------------------------------------------------------

const servidor = (ruta) => ({
	url: `${cfg.site}${ruta}`,
	...(cfg.credentialId ? { credentialId: cfg.credentialId } : {}),
});

const asistente = {
	name: "OrPiRa · Asistente de voz",
	firstMessage:
		"Hola, ¿hablo con {{nombre}}? Soy el asistente de inteligencia artificial de Orlando, de OrPiRa. " +
		"Te llamo porque escribiste en su web y pediste que te llamáramos. La llamada se graba para que Orlando la revise. " +
		"¿Tienes un par de minutos?",
	firstMessageMode: "assistant-speaks-first",
	model: {
		provider: "anthropic",
		model: cfg.modelo,
		temperature: 0.4,
		messages: [{ role: "system", content: leer("prompt-voz.md").trim() }],
		tools: [
			{
				type: "function",
				function: {
					name: "no_llamar",
					description: "Registra que la persona no quiere que la vuelvan a llamar. Úsala en cuanto lo pida.",
					parameters: { type: "object", properties: {} },
				},
				server: servidor("/api/voice/tools"),
			},
			{ type: "endCall" },
		],
	},
	transcriber: { provider: "deepgram", model: "nova-3", language: "es" },
	maxDurationSeconds: 420,
	silenceTimeoutSeconds: 20,
	serverMessages: ["end-of-call-report"],
	server: servidor("/api/webhooks/voice"),
	analysisPlan: {
		summaryPlan: {
			enabled: true,
			messages: [
				{
					role: "system",
					content:
						"Resume en español, en 3 a 6 frases y en texto plano, qué quiere la persona, para quién, " +
						"qué es imprescindible, plazos y cuándo prefiere hablar con Orlando. Si algo no se dijo, no lo inventes. " +
						"Si pidió que no la vuelvan a llamar o no podía hablar, dilo al principio.",
				},
				{ role: "user", content: "Transcripción:\n\n{{transcript}}" },
			],
		},
		structuredDataPlan: {
			enabled: true,
			schema: {
				type: "object",
				properties: {
					tipo: { type: "string", enum: ["proyecto", "empleo", "colaboracion", "otro"] },
					en_una_frase: { type: "string" },
					usuarios: { type: "string" },
					imprescindibles: { type: "array", items: { type: "string" } },
					plazos: { type: "string" },
					llamada: { type: "string", description: "Cuándo y por dónde prefiere hablar con Orlando" },
					preguntas_para_la_llamada: { type: "array", items: { type: "string" } },
				},
			},
		},
	},
};

mkdirSync(join(aqui, "dist"), { recursive: true });
writeFileSync(join(aqui, "dist/agente-voz.workflow.json"), `${JSON.stringify(workflow, null, 2)}\n`);
writeFileSync(join(aqui, "dist/asistente-vapi.json"), `${JSON.stringify(asistente, null, 2)}\n`);
console.log("Listo:\n  dist/agente-voz.workflow.json\n  dist/asistente-vapi.json");
if (!cfg.assistantId || !cfg.phoneNumberId) {
	console.log("Aviso: sin VAPI_ASSISTANT_ID o VAPI_PHONE_NUMBER_ID el flujo no llamará a nadie.");
}
if (!cfg.credentialId) {
	console.log("Aviso: sin VAPI_CREDENTIAL_ID, asigna la credencial del Server URL a mano en Vapi.");
}
