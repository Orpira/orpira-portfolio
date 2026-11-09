// Plantilla HTML común de las páginas del agente (se inserta en los nodos Code).
const esc = (v) =>
	String(v ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const pagina = (titulo, contenido) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(titulo)} · OrPiRa</title>
<style>
:root{--ink:#1c1917;--soft:#57534e;--paper:#f6f3ee;--line:#e2ddd5;--accent:#f26b1d}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
main{max-width:44rem;margin:0 auto;padding:1.5rem 1rem 3rem}h1{font-size:1.6rem;margin:.2rem 0 .4rem}
.meta,.asunto{color:var(--soft);font-size:.9rem}.msg{border:1px solid var(--line);border-radius:12px;padding:.6rem .8rem;margin:.6rem 0;background:#fff}
.msg.out{background:#fdf1e9}.msg span{font-size:.75rem;color:var(--soft);text-transform:uppercase;letter-spacing:.05em}
.msg p{margin:.2rem 0 0;white-space:pre-wrap}details{margin:1rem 0}summary{cursor:pointer;font-weight:600}
.brief{border:1px solid var(--ink);border-radius:12px;padding:.8rem 1rem;background:#fff;margin:1rem 0}.brief h2{font-size:1.05rem;margin:0 0 .5rem}
dt{font-size:.75rem;color:var(--soft);text-transform:uppercase;letter-spacing:.05em;margin-top:.5rem}dd{margin:0}
label{display:block;font-weight:600;margin-top:1rem}textarea{width:100%;font:inherit;padding:.7rem;border:1px solid var(--line);border-radius:12px;background:#fff}
.acciones{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.8rem}button{font:inherit;padding:.7rem 1.2rem;border-radius:999px;border:1px solid var(--ink);background:#fff;cursor:pointer}
button.principal{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
</style></head><body><main><p class="meta">OrPiRa · asistente de contacto</p><h1>${esc(titulo)}</h1>${contenido}</main></body></html>`;
