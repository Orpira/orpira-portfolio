// Nodo «Normalizar contacto» (Code · una vez por elemento).
// Entrada: webhook del formulario de orpira.es → body = { name, email, message }.
// El portfolio ya valida; aquí se repite por si alguien llama al webhook a mano.
const b = $json.body ?? {};
const limpia = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const name = limpia(b.name, 100);
const email = limpia(b.email, 254).toLowerCase();
const message = limpia(b.message, 5000);

if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) {
	throw new Error("Contacto con datos no válidos");
}

const aviso = `📩 Nuevo contacto en orpira.es\n${name} <${email}>\n\n${message.slice(0, 500)}${message.length > 500 ? "…" : ""}\n\nEl asistente está preparando la respuesta.`;

return { json: { name, email, message, aviso } };
