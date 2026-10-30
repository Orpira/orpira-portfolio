import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

const siteUrl = "https://orpira.es";

export default defineConfig({
	site: siteUrl,

	output: "server",

	adapter: vercel(),

	base: "/",

	// Casos movidos a /casos/ en la fase 2D (301 permanentes).
	redirects: {
		"/projects/private-balance": { status: 301, destination: "/casos/private-balance" },
		"/projects/finance-app": { status: 301, destination: "/casos/private-balance" },
		// Páginas de proyecto antiguas sin caso propio (fase 2E).
		"/projects/control-horario": { status: 301, destination: "/#casos" },
		"/projects/dashboard-evaluacion": { status: 301, destination: "/#casos" },
		// EcoTogo se retiró del portfolio y su lugar lo ocupa WebWiz.
		"/casos/ecotogo": { status: 301, destination: "/casos/webwiz" },
	},
});
