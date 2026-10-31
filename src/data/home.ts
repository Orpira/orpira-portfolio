/**
 * Contenido de la portada (fase 2C).
 *
 * Regla de las cifras: `null` = dato PENDIENTE que debe aportar Orlando.
 * - En vistas previas y en local se muestra una marca «Pendiente».
 * - En producción (VERCEL_ENV=production) el elemento se oculta entero,
 *   para que nunca se publique un hueco ni una cifra inventada.
 */

export const isProduction = process.env.VERCEL_ENV === "production";

/** Devuelve solo los elementos publicables en producción. */
export const publishable = <T extends { value: string | null }>(items: T[]) =>
	isProduction ? items.filter((item) => item.value !== null) : items;

export const seo = {
	title: "OrPiRa · Apps web a medida para empresas | Bilbao",
	description:
		"Orlando Pineda Raad diseña y desarrolla apps web a medida, de la idea al despliegue: herramientas internas, producto digital e IA aplicada. Bilbao, España.",
};

export const hero = {
	eyebrow: "Apps web a medida · Bilbao",
	titleStart: "Apps web a medida,",
	titleAccent: "de la idea al despliegue.",
	lead: "Herramientas internas, producto digital e IA aplicada para empresas, hechas por un ingeniero informático que ha dado soporte y formación a quienes las usan.",
	primaryCta: { label: "Cuéntame tu proyecto", href: "#contacto" },
	secondaryCta: { label: "Ver casos", href: "#casos" },
};

export interface Stat {
	value: string | null;
	label: string;
	/** Qué dato falta, para quien rellene el pendiente. */
	pendingHint?: string;
}

export const stats: Stat[] = [
	{ value: "15+", label: "años gestionando un departamento de TI" },
	{ value: "3", label: "apps propias en producción" },
	{
		value: null,
		label: "personas formadas con PRL Master",
		pendingHint: "Usuarios o empresas que han usado PRL Master",
	},
];

// Los casos destacados viven en src/content/cases (colección "cases").

export interface Service {
	title: string;
	summary: string;
	includes: string[];
	example: string;
	format: string | null;
	pendingHint?: string;
}

export const services: Service[] = [
	{
		title: "Herramientas internas a medida",
		summary:
			"Sustituyo hojas de cálculo, papeles y documentos sueltos por una app que tu equipo usa a diario y que se adapta a cómo trabajáis.",
		includes: [
			"Procesos manuales convertidos en una app web",
			"Usuarios, permisos y datos en un solo sitio",
			"Informes y seguimiento sin copiar y pegar",
			"Formación a tu equipo para que la adopte",
		],
		example: "PRL Master",
		format: null,
		pendingHint: "Formato y plazo típico de una herramienta interna",
	},
	{
		title: "De la idea a producto en producción",
		summary:
			"Un MVP web o PWA con autenticación, base de datos y despliegue, listo para usuarios reales y no solo para una demo.",
		includes: [
			"Descubrimiento y alcance cerrado por escrito",
			"Web, PWA o app Android desde el mismo código",
			"Supabase o PostgreSQL, desplegado en Vercel",
			"Documentación y traspaso",
		],
		example: "WebWiz Quiz · Dominó 3D",
		format: null,
		pendingHint: "Formato y plazo típico de un MVP",
	},
	{
		title: "IA aplicada a procesos internos",
		summary:
			"Integro la API de Claude donde ahorra horas: clasificar mensajes, redactar informes o resumir documentos.",
		includes: [
			"Diagnóstico de tareas repetitivas que se pueden automatizar",
			"Integración con WhatsApp, documentos o tu base de datos",
			"Control de costes y de privacidad de los datos",
			"Revisión humana donde el resultado importa",
		],
		example: "WebWiz Quiz",
		format: null,
		pendingHint: "Formato (auditoría, piloto, integración) y plazo",
	},
];

export interface Step {
	title: string;
	detail: string;
}

export const steps: Step[] = [
	{
		title: "Diagnóstico",
		detail: "Una llamada para entender qué problema hay, quién lo sufre y cómo sabremos que está resuelto.",
	},
	{
		title: "Propuesta",
		detail: "Alcance, plazo y precio cerrados por escrito. Sin sorpresas a mitad de proyecto.",
	},
	{
		title: "Construcción con entregas semanales",
		detail: "Ves la aplicación funcionando desde la primera semana, no al final.",
	},
	{
		title: "Despliegue y traspaso",
		detail: "En producción, documentada y con un periodo de soporte incluido.",
	},
];

export const supportDays: Stat = {
	value: null,
	label: "días de soporte incluidos tras el despliegue",
	pendingHint: "Días de soporte que incluyes",
};

export const about = {
	title: "IT, producto y formación <em class='t-accent'>en la misma persona.</em>",
	paragraphs: [
		"Soy Orlando Pineda Raad, ingeniero informático. He pasado más de 15 años gestionando el departamento de TI de una empresa de logística: soporte técnico avanzado y formación a usuarios internos y externos. Los últimos años los he dedicado a construir el software que me habría gustado tener.",
		"PRL Master nació así: en el curso de PRL de 30 horas de Meatze, convertí el examen en Word en la app de tests que usamos los compañeros del curso.",
		"Por eso hablo el idioma de quien usa la herramienta y el de quien la programa. Me gusta trabajar paso a paso y no doy un proyecto por terminado hasta verlo desplegado y funcionando.",
		"Trabajo desde Bilbao, también en remoto.",
	],
	stack: ["React", "Next.js", "Astro", "Node.js", "Supabase", "PostgreSQL", "Vercel", "Claude API"],
};

export interface LabProject {
	title: string;
	summary: string;
	tags: string[];
	href: string | null;
	pendingHint?: string;
	status: "live" | "building";
	statusLabel: string;
}

export const labProjects: LabProject[] = [
	{
		title: "Suite de juegos multijugador",
		summary:
			"Stop/Basta y Categorías rápidas para jugar en línea con amigos: salas, votaciones y ranking top 5, sobre un núcleo común al que se irán sumando más juegos.",
		tags: ["Next.js", "TypeScript", "Supabase"],
		href: null,
		pendingHint: "URL pública de la suite de juegos",
		status: "building",
		statusLabel: "En desarrollo",
	},
	{
		title: "Dominó 3D",
		summary: "Dominó latino en una mesa 3D, con salas online, liga y app Android.",
		tags: ["Three.js", "Juego"],
		href: "https://domino-3d.orpira.es/",
		status: "live",
		statusLabel: "En producción",
	},
	{
		title: "WebWiz Quiz",
		summary: "Retos de desarrollo web con corrección inmediata para practicar y evaluar conocimientos.",
		tags: ["React", "Supabase"],
		href: "https://webwiz.orpira.es/",
		status: "live",
		statusLabel: "En producción",
	},
];

export const contact = {
	title: "¿Tienes un proceso que debería ser <em class='t-accent'>una app?</em>",
	intro:
		"Escríbeme dos líneas sobre el problema. Te respondo con una primera valoración, sin compromiso.",
	responseTime: null as string | null,
	responseTimePendingHint: "Plazo de respuesta que te comprometes a cumplir (p. ej. 24 h laborables)",
	needs: ["Herramienta interna", "Producto digital / MVP", "IA aplicada", "Otro"],
	whatsapp: "https://wa.me/34643684541",
	linkedin: "https://www.linkedin.com/in/orlando-pineda-raad-273402257",
	github: "https://github.com/Orpira",
};
