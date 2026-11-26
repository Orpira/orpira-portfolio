/**
 * Estado de las demos del portfolio, comprobado desde el servidor.
 * Cada comprobación toca la base de datos real cuando la demo la tiene,
 * así que también cuenta como actividad para los proyectos de Supabase Free.
 *
 * Resultado por demo: true (responde), false (no responde a tiempo o da error)
 * o null (sin configurar: el portfolio no toca su botón).
 */

type Check =
	| { kind: "http"; url: string }
	| { kind: "supabase"; urlEnv: string; keyEnv: string; table: string };

export const DEMO_CHECKS: Record<string, Check> = {
	inout: { kind: "http", url: "https://inout.orpira.es/api/salud" },
	"las-delicias": { kind: "http", url: "https://api-delicias.orpira.es/health" },
	wms: { kind: "http", url: "https://wms.orpira.es/api/salud" },
	"prl-master": { kind: "http", url: "https://api-prl.orpira.es/health" },
	"private-balance": { kind: "http", url: "https://private-balance.orpira.es/" },
	webwiz: { kind: "supabase", urlEnv: "WEBWIZ_SUPABASE_URL", keyEnv: "WEBWIZ_SUPABASE_ANON_KEY", table: "questions" },
	juegos: { kind: "supabase", urlEnv: "JUEGOS_SUPABASE_URL", keyEnv: "JUEGOS_SUPABASE_ANON_KEY", table: "rooms" },
};

const TIMEOUT_MS = 4000;

function env(name: string): string | undefined {
	return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}

type Result = { up: boolean | null; code?: number | string };

async function probe(url: string, headers: Record<string, string> = {}): Promise<Result> {
	try {
		const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "follow" });
		return { up: res.ok, code: res.status };
	} catch (e) {
		return { up: false, code: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "network" };
	}
}

export async function checkDemo(check: Check): Promise<Result> {
	if (check.kind === "http") return probe(check.url);
	// Limpia lo que se suele colar al copiar: comillas, espacios, barra final o /rest/v1.
	const base = env(check.urlEnv)?.trim().replace(/^["']|["']$/g, "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
	const key = env(check.keyEnv)?.trim().replace(/^["']|["']$/g, "");
	if (!base || !key) return { up: null };
	// Consulta real de una fila: si el proyecto está en pausa, Supabase responde con error.
	// La clave va solo en `apikey`: así vale tanto la anon (JWT) como la publishable (sb_publishable_…),
	// que Supabase rechaza en la cabecera Authorization.
	return probe(`${base}/rest/v1/${check.table}?select=*&limit=1`, { apikey: key });
}

export async function checkAllDemos(): Promise<{ status: Record<string, boolean | null>; codes: Record<string, number | string> }> {
	const entries = await Promise.all(
		Object.entries(DEMO_CHECKS).map(async ([slug, check]) => [slug, await checkDemo(check)] as const),
	);
	const status: Record<string, boolean | null> = {};
	const codes: Record<string, number | string> = {};
	for (const [slug, r] of entries) {
		status[slug] = r.up;
		// Solo el código HTTP de las que fallan: ayuda a diagnosticar sin exponer nada sensible.
		if (r.up === false && r.code !== undefined) codes[slug] = r.code;
	}
	return { status, codes };
}
