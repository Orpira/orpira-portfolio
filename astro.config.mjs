import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";


const isVercel = process.env.VERCEL === "1";
const isProd = process.env.NODE_ENV === "production";
const siteUrl =
  process.env.SITE_URL ||
  (isVercel ? "https://orpira.es" : "https://orpira.github.io");

export default defineConfig({
  integrations: [tailwind(), react()],
  site: siteUrl,
  base: isProd || isVercel ? "/orpira-portfolio" : "/",
});
