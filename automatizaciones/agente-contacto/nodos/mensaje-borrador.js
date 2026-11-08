// Nodo «Mensaje de WhatsApp» (Code · una vez por elemento).
// Entrada: lead_guardar_borrador → { token }. Aviso con el enlace de revisión.
const d = $("Interpretar respuesta").item.json;
const N8N = __N8N_URL__;

let texto;
if (d.accion === "descartar") {
	texto = `🗑️ OrPiRa · Marcado como spam (no se envía nada)\n${d.name} <${d.email}>\n${d.resumen?.en_una_frase ?? ""}`;
} else {
	const cabecera = d.accion === "cerrar" ? "✅ Resumen listo" : "✍️ Borrador listo";
	texto = `${cabecera} · ${d.name}\n`;
	if (d.accion === "cerrar" && d.resumen?.en_una_frase) texto += `${d.resumen.en_una_frase}\n`;
	if (d.avisos.length) texto += `⚠️ Revisa: ${d.avisos.join(" · ")}\n`;
	texto += `\nRevisar y enviar:\n${N8N}/webhook/orpira-revisar?t=${$json.token}`;
}

return { json: { texto: texto.slice(0, 900) } };
