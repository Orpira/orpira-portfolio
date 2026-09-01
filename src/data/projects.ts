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
	featured?: boolean;
	role?: string;
	layout: ProjectLayoutSize;
	accent: string;
}

export const brandProjects: BrandProject[] = [
	{
		id: "finance-app",
		title: "Private Balance",
		summary:
			"Gestión financiera privada para profesionales que necesitan controlar ingresos, gastos, temporadas y rentabilidad desde una experiencia local y orientada a su forma de trabajo.",
		domain: "https://private-balance.orpira.es",
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
		href: "/projects/private-balance",
		year: "2026",
		status: "En línea",
		cta: "Ver Case Study",
		secondaryCta: "Abrir demo PWA",
		secondaryHref: "https://private-balance.orpira.es/",
		featured: true,
		role: "Producto · Arquitectura · Full Stack · UX",
		layout: "feature",
		accent: "rgba(72, 215, 178, 0.25)",
	},
	{
		id: "test-interactivo-prl",
		title: "Test Interactivo PRL",
		summary:
			"Plataforma interactiva de formación y evaluación en Prevención de Riesgos Laborales, diseñada para convertir contenidos formativos en experiencias de aprendizaje y evaluación.",
		domain: "https://prl.orpira.es/",
		stack: ["React", "Vite", "Tailwind CSS", "Express", "Socket.IO", "Vercel"],
		href: "https://prl.orpira.es/",
		year: "2026",
		status: "En línea",
		cta: "Abrir demo",
		external: true,
		role: "Full Stack · Arquitectura · Experiencia interactiva",
		layout: "wide",
		accent: "rgba(34, 197, 94, 0.24)",
	},
	{
		id: "webwiz-quiz",
		title: "WebWiz Quiz",
		summary:
			"Experiencia interactiva para practicar y evaluar conocimientos de desarrollo web mediante retos con feedback inmediato.",
		domain: "https://webwiz.orpira.es/",
		stack: ["React", "Supabase", "Vercel"],
		href: "https://webwiz.orpira.es/",
		year: "2025",
		status: "En línea",
		cta: "Abrir demo",
		external: true,
		role: "Desarrollo Full Stack · UX interactiva",
		layout: "tall",
		accent: "rgba(82, 163, 255, 0.34)",
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
			"Diseñado y desarrollado como parte de la identidad digital OrPiRa, combinando rendimiento, accesibilidad, responsive, SEO y una experiencia visual propia.",
		domain: "https://Proyecto actual·orpira.es",
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
