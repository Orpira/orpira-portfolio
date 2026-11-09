// Nodo «Extraer respuesta» (Code · una vez para todos los elementos).
// Entrada: emails nuevos de iCloud cuyo asunto contiene «OrPiRa #».
// Salida: { tag, email, subject, body } solo de los que llevan la etiqueta.

const ETIQUETA = /\[OrPiRa #([0-9a-f]{6})\]/i;

const remitente = (from) => {
	if (from && typeof from === "object") {
		return String(from.value?.[0]?.address ?? from.text ?? "");
	}
	const s = String(from ?? "");
	return (s.match(/<([^>]+)>/) ?? [])[1] ?? s;
};

const htmlATexto = (html) =>
	String(html)
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

// Corta el texto citado del mensaje anterior: «El … escribió:», «On … wrote:»,
// «-----Mensaje original-----», cabeceras «De:/From:» y líneas que empiezan por «>».
const quitarCitas = (texto) => {
	const lineas = String(texto).replace(/\r\n/g, "\n").split("\n");
	const propias = [];
	for (const linea of lineas) {
		const l = linea.trim();
		if (/(escribió|wrote)\s*:\s*$/i.test(l)) break;
		if (/^-{2,}\s*(mensaje original|original message|forwarded message)/i.test(l)) break;
		if (/^(de|from)\s*:\s.+@/i.test(l)) break;
		if (l.startsWith(">")) continue;
		propias.push(linea);
	}
	return propias.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 5000);
};

const salida = [];
for (const item of $input.all()) {
	const j = item.json;
	const subject = String(j.subject ?? "");
	const tag = (subject.match(ETIQUETA) ?? [])[1];
	const email = remitente(j.from).trim().toLowerCase();
	if (!tag || !email.includes("@")) continue;

	const crudo = j.textPlain ?? j.text ?? (j.textHtml || j.html ? htmlATexto(j.textHtml ?? j.html) : "");
	const body = quitarCitas(crudo) || "(respuesta vacía)";

	salida.push({ json: { tag: tag.toLowerCase(), email, subject: subject.slice(0, 300), body } });
}
return salida;
