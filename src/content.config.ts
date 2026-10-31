/**
 * Colección de casos de estudio (fase 2D).
 *
 * Un archivo YAML por caso en src/content/cases/. La plantilla es fija:
 * problema → decisiones → capturas → arquitectura → stack → resultado → siguiente paso.
 *
 * Regla de pendientes (igual que en la portada): `null` = dato que falta.
 * Se marca en vistas previas y se oculta en producción.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pendingText = z.string().nullable();

const cases = defineCollection({
	loader: glob({ pattern: "**/*.yaml", base: "./src/content/cases" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			/** Orden en la portada y en la navegación entre casos. */
			order: z.number(),
			/** Una frase de resultado. Es la entradilla del caso y el texto de la fila en la portada. */
			headline: z.string(),
			/** Versión corta para la portada (fila del índice). */
			summary: z.string(),
			seoDescription: z.string().max(170),
			/** Frase corta para la imagen Open Graph (scripts/generate-og.mjs). */
			ogLine: z.string().max(80).optional(),
			role: z.string(),
			platform: z.string(),
			status: z.enum(["live", "building"]),
			statusLabel: z.string(),
			tags: z.array(z.string()),
			links: z
				.array(z.object({ label: z.string(), href: z.url() }))
				.default([]),
			cover: image().optional(),
			coverAlt: z.string().optional(),

			problem: z.object({
				title: z.string(),
				paragraphs: z.array(z.string()),
				/** Partes del problema que aún faltan (quién lo sufría, qué costaba...). */
				pending: z.array(z.string()).default([]),
			}),

			/** Comparación antes/después para quien no es técnico. */
			beforeAfter: z
				.array(z.object({ before: z.string(), after: z.string() }))
				.default([]),

			principles: z
				.array(z.object({ title: z.string(), text: z.string() }))
				.default([]),

			decisions: z
				.array(
					z.object({
						title: z.string(),
						context: z.string(),
						decision: z.string(),
						why: z.string(),
					}),
				)
				.min(1),

			gallery: z
				.array(
					z.object({
						src: image(),
						alt: z.string(),
						caption: z.string(),
						/** "portrait" para capturas de móvil. */
						shape: z.enum(["landscape", "portrait"]).default("landscape"),
					}),
				)
				.default([]),
			galleryPending: pendingText.default(null),

			architecture: z.object({
				summary: z.string(),
				layers: z.array(
					z.object({
						label: z.string(),
						items: z.array(z.string()),
						note: z.string().optional(),
					}),
				),
			}),

			stack: z.array(
				z.object({
					layer: z.string(),
					tech: z.array(z.string()),
					why: z.string(),
				}),
			),

			results: z.array(
				z.object({
					value: z.string().nullable(),
					label: z.string(),
					pendingHint: z.string().optional(),
				}),
			),
			learned: z.array(z.string()).default([]),
			next: z.string(),
		}),
});

export const collections = { cases };
