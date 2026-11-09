#!/usr/bin/env node
/**
 * Monta el workflow de n8n del agente de contacto con tus datos.
 *
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   N8N_URL=https://n8n.orpira.es \
 *   WHATSAPP=+34600000000 \
 *   REMITENTE=orpira@icloud.com \
 *   node automatizaciones/agente-contacto/construir.mjs
 *
 * Genera dist/agente-contacto.workflow.json (ignorado por git) para importarlo
 * en n8n. No lleva secretos: las claves van en las credenciales de n8n.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const leer = (f) => readFileSync(join(aqui, f), "utf8");

const cfg = {
	supabase: process.env.SUPABASE_URL,
	n8n: process.env.N8N_URL,
	whatsapp: process.env.WHATSAPP,
	remitente: process.env.REMITENTE,
	modelo: process.env.MODELO ?? "claude-sonnet-5-5",
};
const faltan = Object.entries({ SUPABASE_URL: cfg.supabase, N8N_URL: cfg.n8n, WHATSAPP: cfg.whatsapp, REMITENTE: cfg.remitente })
	.filter(([, v]) => !v)
	.map(([k]) => k);
if (faltan.length) {
	console.error(`Faltan variables: ${faltan.join(", ")}`);
	process.exit(1);
}
cfg.supabase = cfg.supabase.replace(/\/+$/, "");
cfg.n8n = cfg.n8n.replace(/\/+$/, "");

// --- Código de los nodos ----------------------------------------------------

const plantilla = leer("nodos/plantilla.js");
const codigo = (archivo, extra = {}) => {
	let src = leer(`nodos/${archivo}`)
		.replace("__PLANTILLA__", () => plantilla)
		.replace("__PROMPT_SISTEMA__", () => JSON.stringify(leer("prompt-sistema.md").trim()))
		.replace("__MODELO__", () => JSON.stringify(cfg.modelo))
		.replace("__N8N_URL__", () => JSON.stringify(cfg.n8n));
	for (const [k, v] of Object.entries(extra)) src = src.replace(k, () => JSON.stringify(v));
	return src;
};

// --- Fábricas de nodos ------------------------------------------------------

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

const code = (name, pos, archivo, { todos = false, extra } = {}) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.code",
	typeVersion: 2,
	position: pos,
	parameters: { ...(todos ? {} : { mode: "runOnceForEachItem" }), jsCode: codigo(archivo, extra) },
});

const rpc = (name, pos, funcion, cuerpo) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.httpRequest",
	typeVersion: 4.2,
	position: pos,
	parameters: {
		method: "POST",
		url: `${cfg.supabase}/rest/v1/rpc/${funcion}`,
		authentication: "predefinedCredentialType",
		nodeCredentialType: "supabaseApi",
		sendBody: true,
		specifyBody: "json",
		jsonBody: `={{ JSON.stringify(${cuerpo}) }}`,
		options: {},
	},
});

const whatsapp = (name, pos, texto) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.httpRequest",
	typeVersion: 4.2,
	position: pos,
	onError: "continueRegularOutput",
	parameters: {
		url: "https://api.callmebot.com/whatsapp.php",
		authentication: "genericCredentialType",
		genericAuthType: "httpQueryAuth",
		sendQuery: true,
		queryParameters: {
			parameters: [
				{ name: "phone", value: cfg.whatsapp },
				{ name: "text", value: `={{ ${texto} }}` },
			],
		},
		options: { response: { response: { responseFormat: "text" } } },
	},
});

const webhook = (name, pos, path, method, extra = {}) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.webhook",
	typeVersion: 2,
	position: pos,
	webhookId: id(),
	parameters: { httpMethod: method, path, options: {}, ...extra },
});

const responder = (name, pos) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.respondToWebhook",
	typeVersion: 1.1,
	position: pos,
	parameters: {
		respondWith: "text",
		responseBody: "={{ $json.html }}",
		options: {
			responseHeaders: {
				entries: [
					{ name: "Content-Type", value: "text/html; charset=utf-8" },
					{ name: "Cache-Control", value: "no-store" },
					{ name: "X-Robots-Tag", value: "noindex" },
				],
			},
		},
	},
});

const si = (name, pos, expresion) => ({
	id: id(),
	name,
	type: "n8n-nodes-base.if",
	typeVersion: 2,
	position: pos,
	parameters: {
		conditions: {
			options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
			conditions: [
				{
					id: id(),
					leftValue: `={{ ${expresion} }}`,
					rightValue: "",
					operator: { type: "boolean", operation: "true", singleValue: true },
				},
			],
			combinator: "and",
		},
		options: {},
	},
});

// --- Nodos ------------------------------------------------------------------

const nodos = [
	// A · Formulario de orpira.es
	webhook("Contacto: formulario", [0, 0], "orpira-contacto", "POST", { authentication: "headerAuth" }),
	code("Normalizar contacto", [220, 0], "normalizar-contacto.js"),
	rpc("Crear lead", [440, 0], "lead_crear", "{ p_name: $json.name, p_email: $json.email, p_message: $json.message }"),
	whatsapp("WhatsApp: nuevo contacto", [660, -140], "$('Normalizar contacto').item.json.aviso"),

	// B · Respuestas del contacto por email (iCloud)
	{
		id: id(),
		name: "Respuestas: iCloud",
		type: "n8n-nodes-base.emailReadImap",
		typeVersion: 2.1,
		position: [0, 300],
		parameters: {
			mailbox: "INBOX",
			postProcessAction: "nothing",
			format: "simple",
			// Solo correos nuevos (por UID) con la etiqueta en el asunto, leídos o no:
			// si abres la respuesta antes que n8n, no se pierde.
			options: { customEmailConfig: '[["SUBJECT", "OrPiRa #"]]', trackLastMessageId: true },
		},
	},
	code("Extraer respuesta", [220, 300], "extraer-respuesta.js", { todos: true }),
	rpc("Registrar respuesta", [440, 300], "lead_registrar_respuesta", "{ p_tag: $json.tag, p_email: $json.email, p_subject: $json.subject, p_body: $json.body }"),
	si("¿Es un lead esperando?", [660, 300], "$json.found === true"),
	whatsapp("WhatsApp: respuesta recibida", [880, 440], "'💬 ' + $json.name + ' ha respondido. El asistente prepara el siguiente borrador.'"),

	// R · Redactar con Claude (común a A y B)
	rpc("Historial", [880, 150], "lead_historial", "{ p_lead_id: $json.lead_id }"),
	code("Preparar petición a Claude", [1100, 150], "preparar-claude.js"),
	{
		id: id(),
		name: "Claude: redactar",
		type: "n8n-nodes-base.httpRequest",
		typeVersion: 4.2,
		position: [1320, 150],
		retryOnFail: true,
		maxTries: 3,
		waitBetweenTries: 5000,
		parameters: {
			method: "POST",
			url: "https://api.anthropic.com/v1/messages",
			authentication: "predefinedCredentialType",
			nodeCredentialType: "anthropicApi",
			sendHeaders: true,
			headerParameters: { parameters: [{ name: "anthropic-version", value: "2023-06-01" }] },
			sendBody: true,
			specifyBody: "json",
			jsonBody: "={{ JSON.stringify($json.request) }}",
			options: { timeout: 90000 },
		},
	},
	code("Interpretar respuesta", [1540, 150], "interpretar-respuesta.js"),
	rpc("Guardar borrador", [1760, 150], "lead_guardar_borrador", "$json.rpc"),
	code("Mensaje de WhatsApp", [1980, 150], "mensaje-borrador.js"),
	whatsapp("WhatsApp: borrador listo", [2200, 150], "$json.texto"),

	// C · Página de revisión (GET: solo muestra)
	webhook("Revisar: abrir enlace", [0, 700], "orpira-revisar", "GET", { responseMode: "responseNode" }),
	rpc("Ver borrador", [220, 700], "lead_ver_borrador", "{ p_token: String($json.query.t ?? '') }"),
	code("Página de revisión", [440, 700], "pagina-revision.js"),
	responder("Responder: revisión", [660, 700]),

	// D · Decisión (POST desde la página)
	webhook("Decidir: formulario", [0, 960], "orpira-decidir", "POST", { responseMode: "responseNode" }),
	rpc("Decidir borrador", [220, 960], "lead_decidir", "{ p_token: String($json.body.t ?? ''), p_accion: $json.body.accion === 'enviar' ? 'enviar' : 'descartar', p_body: String($json.body.cuerpo ?? '') }"),
	si("¿Enviar?", [440, 960], "$json.found === true && $json.accion === 'enviar'"),
	{
		id: id(),
		name: "Enviar email (iCloud)",
		type: "n8n-nodes-base.emailSend",
		typeVersion: 2.1,
		position: [660, 860],
		onError: "continueErrorOutput",
		parameters: {
			fromEmail: `Asistente de Orlando · OrPiRa <${cfg.remitente}>`,
			toEmail: "={{ $json.email }}",
			subject: "={{ $json.subject }}",
			emailFormat: "text",
			text: "={{ $json.body }}",
			options: { appendAttribution: false, replyTo: cfg.remitente },
		},
	},
	rpc("Confirmar envío", [880, 800], "lead_confirmar_envio", "{ p_message_id: $('Decidir borrador').item.json.message_id }"),
	code("Página: enviado", [1100, 800], "pagina-resultado.js", { extra: { __RESULTADO__: "enviado" } }),
	code("Página: error de envío", [880, 960], "pagina-resultado.js", { extra: { __RESULTADO__: "error" } }),
	code("Página: descartado", [660, 1100], "pagina-resultado.js", { extra: { __RESULTADO__: "descartado" } }),
	responder("Responder: decisión", [1320, 960]),
];

// --- Conexiones -------------------------------------------------------------

const conexiones = {};
const unir = (de, a, salida = 0) => {
	conexiones[de] ??= { main: [] };
	while (conexiones[de].main.length <= salida) conexiones[de].main.push([]);
	conexiones[de].main[salida].push({ node: a, type: "main", index: 0 });
};

unir("Contacto: formulario", "Normalizar contacto");
unir("Normalizar contacto", "Crear lead");
unir("Crear lead", "WhatsApp: nuevo contacto");
unir("Crear lead", "Historial");

unir("Respuestas: iCloud", "Extraer respuesta");
unir("Extraer respuesta", "Registrar respuesta");
unir("Registrar respuesta", "¿Es un lead esperando?");
unir("¿Es un lead esperando?", "Historial", 0);
unir("¿Es un lead esperando?", "WhatsApp: respuesta recibida", 0);

unir("Historial", "Preparar petición a Claude");
unir("Preparar petición a Claude", "Claude: redactar");
unir("Claude: redactar", "Interpretar respuesta");
unir("Interpretar respuesta", "Guardar borrador");
unir("Guardar borrador", "Mensaje de WhatsApp");
unir("Mensaje de WhatsApp", "WhatsApp: borrador listo");

unir("Revisar: abrir enlace", "Ver borrador");
unir("Ver borrador", "Página de revisión");
unir("Página de revisión", "Responder: revisión");

unir("Decidir: formulario", "Decidir borrador");
unir("Decidir borrador", "¿Enviar?");
unir("¿Enviar?", "Enviar email (iCloud)", 0);
unir("¿Enviar?", "Página: descartado", 1);
unir("Enviar email (iCloud)", "Confirmar envío", 0);
unir("Enviar email (iCloud)", "Página: error de envío", 1);
unir("Confirmar envío", "Página: enviado");
unir("Página: enviado", "Responder: decisión");
unir("Página: error de envío", "Responder: decisión");
unir("Página: descartado", "Responder: decisión");

const workflow = {
	name: "OrPiRa · Agente de contacto",
	nodes: nodos,
	connections: conexiones,
	active: false,
	settings: { executionOrder: "v1", saveDataSuccessExecution: "none" },
	pinData: {},
};

const salida = join(aqui, "dist", "agente-contacto.workflow.json");
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(workflow, null, 2));
console.log(`Workflow listo: ${salida}`);
