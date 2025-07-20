import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
	integrations: [tailwind()],
	site: "https://orpira.github.io",
	base: "/portfolio-orpira",
});
