export type ProjectLayoutSize =
	| "feature"
	| "tall"
	| "wide"
	| "compact"
	| "base";

export interface BrandProject {
	id: string;
	title: string;
	summary: string;
	domain: string;
	stack: string[];
	href?: string;
	year: string;
	status:
		| "En Desarrollo"
		| "En línea"
		| "Case Study"
		| "Core"
		| "Escalando"
		| "Roadmap";
	cta: string;
	secondaryCta?: string;
	secondaryHref?: string;
	external?: boolean;
	comingSoon?: boolean;
	isCurrent?: boolean;
	layout: ProjectLayoutSize;
	accent: string;
}

export const brandProjects: BrandProject[] = [
	{
		id: "finance-app",
		title: "Private Balance",
		summary:
			"Aplicación privada de gestión financiera personal para registrar ingresos, egresos, ganancias y actividad mensual desde una interfaz segura, responsive y orientada a móvil.",
		domain: "Finance App / PWA / Android Preview",
		stack: [
			"React",
			"TypeScript",
			"Vite",
			"Tailwind CSS",
			"IndexedDB",
			"PWA",
			"Capacitor",
			"Vercel",
		],
		href: "https://private-balance.orpira.es/",
		year: "2026",
		status: "En línea",
		cta: "Abrir demo PWA",
		secondaryCta: "Ver versión Android",
		secondaryHref: "/projects/finance-app#android-preview",
		external: true,
		layout: "feature",
		accent: "rgba(72, 215, 178, 0.25)",
	},
	{
		id: "webwiz-quiz",
		title: "WebWiz Quiz",
		summary:
			"Plataforma de retos interactivos para evaluar conocimientos HTML, CSS y JavaScript con feedback en tiempo real.",
		domain: "https://webwiz.orpira.es/",
		stack: ["React", "Supabase", "Vercel"],
		href: "https://webwiz.orpira.es/",
		year: "2025",
		status: "En línea",
		cta: "Abrir demo",
		external: true,
		layout: "tall",
		accent: "rgba(82, 163, 255, 0.34)",
	},
	{
		id: "test-interactivo-prl",
		title: "Test Interactivo PRL",
		summary:
			"Plataforma web interactiva para formacion y evaluacion en Prevencion de Riesgos Laborales, con tests individuales, multijugador local y salas en red.",
		domain: "test-interactivo-prl.vercel.app",
		stack: ["React", "Vite", "Tailwind CSS", "Express", "Socket.IO", "Vercel"],
		href: "https://test-interactivo-prl-vooe.vercel.app/",
		year: "2026",
		status: "En línea",
		cta: "Abrir demo",
		external: true,
		layout: "wide",
		accent: "rgba(34, 197, 94, 0.24)",
	},
	/* {
		id: "dashboard-evaluacion",
		title: "Dashboard de Evaluación",
		summary:
			"Experiencia completa para crear, medir y visualizar progreso de aprendizaje en entornos gamificados.",
		domain: "orpira.es/projects/dashboard-evaluacion",
		stack: ["React", "Vite", "Tailwind", "Supabase"],
		href: "/projects/dashboard-evaluacion",
		year: "2024",
		status: "Case Study",
		cta: "Ver detalles",
		layout: "wide",
		accent: "rgba(253, 186, 116, 0.24)",
	}, */
	{
		id: "orpira-portfolio",
		title: "Orpira Portfolio",
		summary:
			"Este mismo sitio que estás navegando: landing + portfolio de marca personal para posicionar servicios, casos y nuevos lanzamientos.",
		domain: "Proyecto actual · orpira.es",
		stack: ["Astro", "Tailwind", "Vercel", "SEO"],
		href: "#top",
		year: "2026",
		status: "En línea",
		cta: "Proyecto actual",
		isCurrent: true,
		layout: "compact",
		accent: "rgba(255, 118, 118, 0.28)",
	},
	/* {
		id: "lab-orpira",
		title: "Lab Orpira",
		summary:
			"Laboratorio de prototipos con Next.js para validar ideas de producto y nuevas experiencias de interfaz.",
		domain: "lab.orpira.es",
		stack: ["Next.js", "TypeScript", "Experimentos"],
		href: "https://lab.orpira.es",
		year: "2026",
		status: "Escalando",
		cta: "Explorar",
		external: true,
		layout: "compact",
		accent: "rgba(72, 215, 178, 0.25)",
	}, */
	/* {
		id: "api-demos",
		title: "API Demos",
		summary:
			"Backends y demos técnicas para integraciones, autenticación y automatizaciones de negocio.",
		domain: "api.orpira.es",
		stack: ["Node", "PostgreSQL", "Serverless"],
		href: "https://api.orpira.es",
		year: "2026",
		status: "Roadmap",
		cta: "Proximamente",
		comingSoon: true,
		external: true,
		layout: "base",
		accent: "rgba(146, 159, 186, 0.24)",
	}, */
];

export const brandProjectStats = {
	total: brandProjects.length,
	live: brandProjects.filter((project) => !project.comingSoon).length,
	roadmap: brandProjects.filter((project) => project.comingSoon).length,
	external: brandProjects.filter((project) => project.external).length,
};
