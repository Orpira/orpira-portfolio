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
	title: "OrPiRa · Orlando Pineda Raad, apps web de la idea al despliegue | Bilbao",
	description:
		"Portfolio de Orlando Pineda Raad: apps web, PWA y Android, tiempo real, 3D e IA aplicada. Proyectos propios en producción, de la idea al despliegue. Bilbao.",
};

export const hero = {
	eyebrow: "Apps web a medida · Bilbao",
	titleStart: "Apps web a medida,",
	titleAccent: "de la idea al despliegue.",
	lead: "Herramientas internas, producto digital e IA aplicada, pensadas para quienes las van a usar cada día. Estos son algunos de los proyectos que he construido.",
	primaryCta: { label: "Ver proyectos", href: "#casos" },
	secondaryCta: { label: "Sobre mí", href: "#sobre-mi" },
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
	{ value: "1", label: "base de código: web, PWA y Android" },
];

// Los casos destacados viven en src/content/cases (colección "cases").

export interface Capability {
	title: string;
	summary: string;
	tech: string[];
	/** Proyectos que lo demuestran: título y enlace al caso. */
	proof: { label: string; href: string }[];
}

const P = {
	prl: { label: "PRL Master", href: "/casos/prl-master" },
	webwiz: { label: "WebWiz Quiz", href: "/casos/webwiz" },
	balance: { label: "Private Balance", href: "/casos/private-balance" },
	domino: { label: "Dominó 3D", href: "/casos/domino-3d" },
};

export const capabilities: Capability[] = [
	{
		title: "Apps web y PWA",
		summary: "Aplicaciones que se instalan desde el navegador, funcionan sin conexión y guardan los datos donde tienen que estar.",
		tech: ["React", "TypeScript", "IndexedDB", "PWA"],
		proof: [P.balance, P.webwiz],
	},
	{
		title: "Android desde el mismo código",
		summary: "La misma base de la web convertida en app Android, sin mantener dos proyectos distintos.",
		tech: ["Capacitor"],
		proof: [P.balance, P.webwiz, P.domino],
	},
	{
		title: "Tiempo real y multijugador",
		summary: "Salas con código, turnos y rankings en directo, con un servidor que decide y reconexión automática.",
		tech: ["Node.js", "Express", "Socket.IO"],
		proof: [P.domino],
	},
	{
		title: "IA aplicada",
		summary: "La API de Claude integrada donde aporta: corregir respuestas abiertas o revisar código, con el coste y los fallos acotados.",
		tech: ["Claude API"],
		proof: [P.webwiz],
	},
	{
		title: "3D en el navegador",
		summary: "Escenas 3D interactivas que van fluidas también en el móvil.",
		tech: ["Three.js"],
		proof: [P.domino],
	},
	{
		title: "Datos y despliegue",
		summary: "Autenticación, base de datos y puesta en producción, de la primera versión a una app que usa gente real.",
		tech: ["Supabase", "PostgreSQL", "Vercel"],
		proof: [P.webwiz, P.prl],
	},
];

export interface Step {
	title: string;
	detail: string;
}

export const steps: Step[] = [
	{
		title: "Entender el problema",
		detail: "Antes de escribir código: quién lo va a usar, qué le cuesta hoy y cómo sabré que funciona.",
	},
	{
		title: "Dividir en fases",
		detail: "Una primera versión pequeña que ya sirve, y el resto por partes que se pueden probar.",
	},
	{
		title: "Construir y desplegar pronto",
		detail: "Cada fase llega a producción. Prefiero ver la app funcionando a tenerla perfecta en local.",
	},
	{
		title: "Mejorar con el uso real",
		detail: "Lo que hace la gente con la app decide la siguiente fase, no una lista de ideas.",
	},
];

export const about = {
	title: "IT, producto y formación <em class='t-accent'>en la misma persona.</em>",
	paragraphs: [
		"Soy Orlando Pineda Raad. He pasado más de 15 años gestionando el departamento de TI de una empresa de logística: soporte técnico avanzado y formación a usuarios internos y externos. Los últimos años los he dedicado a construir el software que me habría gustado tener.",
		"PRL Master nació así: en el curso de PRL de 30 horas, convertí el examen en Word en la app de tests que usamos los compañeros del curso.",
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
	title: "¿Te interesa algo de <em class='t-accent'>lo que has visto?</em>",
	intro:
		"Escríbeme si quieres comentar un proyecto, una idea o cualquier cosa de las que hay aquí.",
	whatsapp: "https://wa.me/34643684541",
	linkedin: "https://www.linkedin.com/in/orlando-pineda-raad-273402257",
	github: "https://github.com/Orpira",
};
