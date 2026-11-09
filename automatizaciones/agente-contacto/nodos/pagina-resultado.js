// Nodos «Página: …» (Code · una vez por elemento). El resultado lo fija construir.mjs:
// "enviado" | "descartado" | "error".
__PLANTILLA__
const RESULTADO = __RESULTADO__;
const d = $("Decidir borrador").item.json;

const textos = {
	enviado: ["Email enviado", `<p>Se ha enviado a ${esc(d.email)}.</p>${d.is_final ? "<p>La conversación queda cerrada: te toca escribirle para la llamada.</p>" : "<p>Cuando responda, te llegará otro borrador por WhatsApp.</p>"}`],
	descartado:
		d.found === true
			? ["Descartado", "<p>No se ha enviado nada y la conversación queda cerrada. Puedes escribirle tú directamente.</p>"]
			: ["Enlace caducado", "<p>Este borrador ya se envió o se descartó.</p>"],
	error: ["No se pudo enviar", "<p>El email no salió (revisa la credencial SMTP de iCloud en n8n). El borrador queda aprobado pero sin enviar.</p>"],
};

const [titulo, cuerpo] = textos[RESULTADO];
return { json: { html: pagina(titulo, cuerpo) } };
