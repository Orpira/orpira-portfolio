export const prerender = false;

import type { APIRoute } from "astro";
import { checkAllDemos } from "../../lib/demo-status";

// La CDN de Vercel guarda la respuesta 60 s: como mucho una comprobación por minuto,
// aunque entren muchas visitas a la vez.
export const GET: APIRoute = async () => {
	const { status, codes } = await checkAllDemos();
	return new Response(JSON.stringify({ status, codes, checkedAt: new Date().toISOString() }), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
		},
	});
};
