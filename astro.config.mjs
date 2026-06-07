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
});
