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
					bg: "#090b10",
					card: "#121826",
					text: "#f8f5ef",
					muted: "#bcc6db",
					accent: "#ff9b53",
					accentSoft: "#ffd9c2",
				},
			},
			fontFamily: {
				sans: ["Manrope", "sans-serif"],
				serif: ["Cormorant Garamond", "serif"],
				display: ["Syne", "sans-serif"],
				mono: ["JetBrains Mono", "monospace"],
			},
		},
	},
	plugins: [typography, forms],
};
