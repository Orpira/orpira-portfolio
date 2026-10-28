import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

const siteUrl = "https://orpira.es";

export default defineConfig({
	site: siteUrl,

	output: "server",

	adapter: vercel(),

	integrations: [
		react(),
	],

	base: "/",

	// Casos movidos a /casos/ en la fase 2D (301 permanentes).
	redirects: {
		"/projects/private-balance": { status: 301, destination: "/casos/private-balance" },
		"/projects/finance-app": { status: 301, destination: "/casos/private-balance" },
	},
});
