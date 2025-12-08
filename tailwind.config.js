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
					bg: "#0B0F1A", // Fondo principal
					card: "#111827", // Tarjetas oscuras
					text: "#E6EAF2", // Texto claro
					muted: "#94A3B8", // Texto secundario
					accent: "#F59E0B", // Acento profesional (ámbar)
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
