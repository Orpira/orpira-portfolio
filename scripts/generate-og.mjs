/**
 * Genera las imágenes Open Graph (1200×630) en public/og/:
 *   - portada.jpg
 *   - <slug>.jpg por cada caso de src/content/cases/*.yaml
 *
 * Uso (solo hace falta al cambiar textos de un caso o añadir uno):
 *   npm i -D playwright && npx playwright install chromium   # una vez
 *   npm run og
 *
 * Las imágenes resultantes se versionan en git: el build no depende de este script.
 */
import { chromium } from "playwright";
import { readFile, readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/og");
const casesDir = path.join(root, "src/content/cases");

const font = (pkg, file) =>
	readFile(path.join(root, "node_modules", pkg, "files", file)).then((b) => b.toString("base64"));

const [serif, serifItalic, sans, mono, cube] = await Promise.all([
	font("@fontsource/instrument-serif", "instrument-serif-latin-400-normal.woff2"),
	font("@fontsource/instrument-serif", "instrument-serif-latin-400-italic.woff2"),
	font("@fontsource-variable/geist", "geist-latin-wght-normal.woff2"),
	font("@fontsource-variable/geist-mono", "geist-mono-latin-wght-normal.woff2"),
	readFile(path.join(root, "public/brand/opr-cubo-192.webp")).then((b) => b.toString("base64")),
]);

const escape = (s) =>
	String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const template = ({ kicker, title, accent, footer }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(data:font/woff2;base64,${serif}) format("woff2");font-style:normal}
@font-face{font-family:S;src:url(data:font/woff2;base64,${serifItalic}) format("woff2");font-style:italic}
@font-face{font-family:G;src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:100 900}
@font-face{font-family:M;src:url(data:font/woff2;base64,${mono}) format("woff2");font-weight:100 900}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:#F6F3EE;color:#14161A;font-family:G;padding:64px 72px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:14px}
.top img{width:44px;height:44px}
.brand{font-family:S;font-style:italic;font-size:34px}
.kicker{margin-left:auto;font-family:M;font-size:19px;color:#5C6270}
h1{font-family:S;font-weight:400;font-size:${title.length > 24 ? 92 : 112}px;line-height:.98;letter-spacing:-.02em;margin-top:auto;max-width:20ch;text-wrap:balance}
.accent{display:block;font-style:italic;color:#AE3D0C;font-size:.58em;line-height:1.1;margin-top:18px;max-width:26ch;text-wrap:balance}
.foot{margin-top:44px;padding-top:22px;border-top:1px solid #D9D3C9;display:flex;justify-content:space-between;font-family:M;font-size:19px;color:#5C6270}
.dot{display:inline-block;width:12px;height:12px;border-radius:3px;background:#F26B1D;margin-right:10px;vertical-align:-1px}
</style></head><body>
<div class="top"><img src="data:image/webp;base64,${cube}" alt=""><span class="brand">OrPiRa</span><span class="kicker">${escape(kicker)}</span></div>
<h1>${escape(title)}${accent ? `<span class="accent">${escape(accent)}</span>` : ""}</h1>
<div class="foot"><span><span class="dot"></span>orpira.es</span><span>${escape(footer)}</span></div>
</body></html>`;

// Recorta la entradilla para que quepa en dos o tres líneas.
const short = (text, max = 92) => {
	const clean = text.replace(/\s+/g, " ").trim();
	if (clean.length <= max) return clean;
	const cut = clean.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

const pages = [
	{
		file: "portada.jpg",
		kicker: "Bilbao · España",
		title: "Software que la gente usa.",
		accent: "Producto digital y tecnología para formación corporativa.",
		footer: "Orlando Pineda Raad",
	},
];

for (const name of (await readdir(casesDir)).filter((f) => f.endsWith(".yaml"))) {
	const data = parse(await readFile(path.join(casesDir, name), "utf8"));
	pages.push({
		file: `${name.replace(/\.yaml$/, "")}.jpg`,
		kicker: "Caso de estudio",
		title: data.title,
		accent: data.ogLine ?? short(data.headline),
		footer: data.tags.slice(0, 4).join(" · "),
	});
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const p of pages) {
	await page.setContent(template(p), { waitUntil: "load" });
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({ path: path.join(outDir, p.file), type: "jpeg", quality: 88 });
	console.log(`og/${p.file}`);
}

await browser.close();
