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

async function ok(url: string, headers: Record<string, string> = {}): Promise<boolean> {
	try {
		const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "follow" });
		return res.ok;
	} catch {
		return false;
	}
}

export async function checkDemo(check: Check): Promise<boolean | null> {
	if (check.kind === "http") return ok(check.url);
	const base = env(check.urlEnv)?.replace(/\/+$/, "");
	const key = env(check.keyEnv);
	if (!base || !key) return null;
	// Consulta real de una fila: si el proyecto está en pausa, Supabase responde con error.
	return ok(`${base}/rest/v1/${check.table}?select=*&limit=1`, { apikey: key, Authorization: `Bearer ${key}` });
}

export async function checkAllDemos(): Promise<Record<string, boolean | null>> {
	const entries = await Promise.all(
		Object.entries(DEMO_CHECKS).map(async ([slug, check]) => [slug, await checkDemo(check)] as const),
	);
	return Object.fromEntries(entries);
}
