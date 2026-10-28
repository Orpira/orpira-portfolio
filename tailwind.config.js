/** @type {import('tailwindcss').Config} */

import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

export default {
	darkMode: "class",
	content: ["./src/**/*.{astro,html,js,ts,jsx,tsx}", "./public/**/*.svg"],
	theme: {
		extend: {
			colors: {
				// Sistema "Editorial técnico" (src/styles/site.css)
				paper: "rgb(var(--paper) / <alpha-value>)",
				surface: "rgb(var(--surface) / <alpha-value>)",
				ink: {
					DEFAULT: "rgb(var(--ink) / <alpha-value>)",
					soft: "rgb(var(--ink-soft) / <alpha-value>)",
					muted: "rgb(var(--ink-muted) / <alpha-value>)",
				},
				line: "rgb(var(--line) / <alpha-value>)",
				accent: {
					DEFAULT: "rgb(var(--accent) / <alpha-value>)",
					ink: "rgb(var(--accent-ink) / <alpha-value>)",
					on: "rgb(var(--on-accent) / <alpha-value>)",
				},
			},
			fontFamily: {
				heading: ["var(--font-heading)"],
				body: ["var(--font-body)"],
				data: ["var(--font-data)"],
			},
			borderRadius: {
				"ds-sm": "var(--radius-sm)",
				"ds-md": "var(--radius-md)",
				"ds-lg": "var(--radius-lg)",
			},
		},
	},
	plugins: [typography, forms],
};
