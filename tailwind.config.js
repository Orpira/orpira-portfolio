/** @type {import('tailwindcss').Config} */

import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

export default {
	darkMode: "class",
	content: ["./src/**/*.{astro,html,js,ts,jsx,tsx}", "./public/**/*.svg"],
	theme: {
		extend: {
			colors: {
				brand: {
					bg: "#0D1117", // Fondo elegante (GitHub-like)
					card: "#161B22", // Paneles
					text: "#E6EAF2",
					muted: "#8B97A8",
					accent: "#F59E0B",
				},
			},
			fontFamily: {
				sans: ["Inter", "sans-serif"],
				serif: ["Merriweather", "serif"],
			},
		},
	},
	plugins: [typography, forms],
};
