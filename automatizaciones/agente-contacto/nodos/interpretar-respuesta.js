// Nodo «Interpretar respuesta» (Code · una vez por elemento).
// Entrada: respuesta de la API de Claude. Valida el JSON y prepara el borrador.
const lead = $("Preparar petición a Claude").item.json.lead;

const texto = ($json.content ?? [])
	.filter((c) => c.type === "text")
	.map((c) => c.text)
	.join("");
const ini = texto.indexOf("{");
const fin = texto.lastIndexOf("}");
if (ini < 0 || fin < ini) throw new Error("Claude no devolvió JSON");

let r;
try {
	r = JSON.parse(texto.slice(ini, fin + 1));
} catch {
	throw new Error("Claude devolvió un JSON no válido");
}

const ACCIONES = ["preguntar", "cerrar", "descartar"];
if (!ACCIONES.includes(r.accion)) throw new Error(`Acción desconocida: ${r.accion}`);
const accion = r.accion;

const cuerpo = String(r.cuerpo ?? "").trim().slice(0, 6000);
if (accion !== "descartar" && cuerpo.length < 20) throw new Error("Borrador vacío o demasiado corto");

const resumen =
	accion === "preguntar"
		? null
		: r.resumen && typeof r.resumen === "object"
			? r.resumen
			: { tipo: "otro", en_una_frase: "Sin resumen", notas: "Claude no devolvió el resumen." };

// Avisos para la revisión: lo que el agente no debería hacer.
const avisos = [];
if (/(€|\beuros?\b|\bprecios?\b|\bpresupuestos?\b|\btarifas?\b|\bcoste\b)/i.test(cuerpo)) {
	avisos.push("menciona precio o presupuesto");
}
if (accion === "preguntar" && lead.agent_turns >= 3) avisos.push("sigue preguntando tras 3 mensajes");

// El asunto lo fija el workflow: la etiqueta es la que enlaza las respuestas.
const asunto = `${lead.agent_turns > 0 ? "Re: " : ""}Tu mensaje en orpira.es [OrPiRa #${lead.tag}]`;

return {
	json: {
		...lead,
		accion,
		asunto,
		cuerpo,
		resumen,
		avisos,
		rpc: {
			p_lead_id: lead.lead_id,
			p_accion: accion,
			p_subject: asunto,
			p_body: cuerpo || "(descartado)",
			p_brief: resumen,
		},
	},
};
