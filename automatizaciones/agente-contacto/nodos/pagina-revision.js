// Nodo «Página de revisión» (Code · una vez por elemento).
// Entrada: lead_ver_borrador (o vacío si el enlace ya se usó).
// La página solo muestra: enviar o descartar es un POST desde el formulario,
// así la vista previa de enlaces de WhatsApp no puede aprobar nada.
__PLANTILLA__
const N8N = __N8N_URL__;
const token = String($("Revisar: abrir enlace").item.json.query?.t ?? "");
const b = $json;

if (b.found !== true) {
	return { json: { html: pagina("Enlace caducado", "<p>Este borrador ya se envió o se descartó.</p>") } };
}

const historial = (b.history ?? [])
	.map(
		(m) =>
			`<div class="msg ${m.direction === "in" ? "in" : "out"}"><span>${m.direction === "in" ? esc(b.name) : "Asistente"}</span><p>${esc(m.body)}</p></div>`,
	)
	.join("");

let resumen = "";
if (b.is_final && b.brief) {
	const r = b.brief;
	const fila = (k, v) => (v ? `<dt>${k}</dt><dd>${esc(Array.isArray(v) ? v.join(" · ") : v)}</dd>` : "");
	resumen = `<section class="brief"><h2>Resumen para la llamada</h2><dl>
${fila("Tipo", r.tipo)}${fila("En una frase", r.en_una_frase)}${fila("Problema", r.problema)}${fila("Usuarios", r.usuarios)}
${fila("Hoy lo resuelve con", r.situacion_actual)}${fila("Imprescindible", r.imprescindibles)}${fila("Plazos", r.plazos)}
${fila("Llamada", r.llamada)}${fila("Notas", r.notas)}${fila("Preguntas para la llamada", r.preguntas_para_la_llamada)}
</dl></section>`;
}

const cuerpo = `
<p class="meta">${esc(b.name)} · ${esc(b.email)} · #${esc(b.tag)}</p>
${resumen}
<details ${b.history?.length > 1 ? "" : "open"}><summary>Conversación</summary>${historial}</details>
<form method="post" action="${esc(N8N)}/webhook/orpira-decidir">
	<input type="hidden" name="t" value="${esc(token)}">
	<label for="cuerpo">${b.is_final ? "Mensaje de cierre" : "Respuesta del asistente"} <small>(puedes editarla)</small></label>
	<p class="asunto">Asunto: ${esc(b.subject)}</p>
	<textarea id="cuerpo" name="cuerpo" rows="16">${esc(b.body)}</textarea>
	<div class="acciones">
		<button name="accion" value="enviar" class="principal">Enviar email</button>
		<button name="accion" value="descartar">Descartar (no enviar)</button>
	</div>
</form>`;

return { json: { html: pagina(b.is_final ? "Cierre y resumen" : "Revisar borrador", cuerpo) } };
