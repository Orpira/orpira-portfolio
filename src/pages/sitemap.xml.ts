/**
 * sitemap.xml generado en el build: páginas públicas + cada caso de la colección.
 * Fuera a propósito: /estilo (noindex), /dashboard (privado) y /api.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const base = site ?? new URL("https://orpira.es");
	const cases = (await getCollection("cases")).sort((a, b) => a.data.order - b.data.order);

	const pages = [
		{ path: "/", priority: "1.0", changefreq: "monthly" },
		...cases.map((c) => ({ path: `/casos/${c.id}`, priority: "0.8", changefreq: "monthly" })),
		{ path: "/privacidad", priority: "0.2", changefreq: "yearly" },
	];

	const urls = pages
		.map(
			(p) =>
				`  <url>\n    <loc>${new URL(p.path, base).toString()}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
		)
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};
