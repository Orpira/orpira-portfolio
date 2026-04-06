import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
	integrations: [tailwind(), react()],
	site: "https://orpira.github.io",
	base: isVercel ? "/" : "/orpira-portfolio",
});
