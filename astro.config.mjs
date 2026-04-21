import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";



// Variables eliminadas por no ser usadas
const siteUrl = process.env.SITE_URL || "https://orpira.es";

export default defineConfig({
  integrations: [tailwind(), react()],
  site: siteUrl,
  base: "/",
});
