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
		| "Produccion"
		| "Live"
		| "Case Study"
		| "Core"
		| "Escalando"
		| "Roadmap";
	cta: string;
	external?: boolean;
	comingSoon?: boolean;
	layout: ProjectLayoutSize;
	accent: string;
}

export const brandProjects: BrandProject[] = [
	{
		id: "control-horario",
		title: "Control Horario Laboral",
		summary:
			"Producto interno para control horario, trazabilidad y reportes de RRHH, con foco en reducir errores operativos.",
		domain: "orpira.es/projects/control-horario",
		stack: ["Laravel", "SQLite", "Tailwind"],
		href: "/projects/control-horario",
		year: "2024",
		status: "Produccion",
		cta: "Ver caso",
		layout: "feature",
		accent: "rgba(255, 155, 83, 0.3)",
	},
	{
		id: "webwiz-quiz",
		title: "WebWiz Quiz",
		summary:
			"Plataforma de retos interactivos para practicar HTML, CSS y JavaScript con feedback en tiempo real.",
		domain: "test-interactivo.vercel.app",
		stack: ["React", "Supabase", "Vercel"],
		href: "https://test-interactivo.vercel.app/",
		year: "2025",
		status: "Live",
		cta: "Abrir demo",
		external: true,
		layout: "tall",
		accent: "rgba(82, 163, 255, 0.34)",
	},
	{
		id: "dashboard-evaluacion",
		title: "Dashboard de Evaluacion",
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
	},
	{
		id: "orpira-platform",
		title: "Orpira Platform",
		summary:
			"Landing + portfolio de marca personal, construido para posicionar servicios, casos y nuevos lanzamientos.",
		domain: "orpira.es",
		stack: ["Astro", "Tailwind", "Vercel", "SEO"],
		href: "https://orpira.es",
		year: "2026",
		status: "Core",
		cta: "Visitar",
		external: true,
		layout: "compact",
		accent: "rgba(255, 118, 118, 0.28)",
	},
	{
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
	},
	{
		id: "api-demos",
		title: "API Demos",
		summary:
			"Backends y demos tecnicas para integraciones, autenticacion y automatizaciones de negocio.",
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
	},
];

export const brandProjectStats = {
	total: brandProjects.length,
	live: brandProjects.filter((project) => !project.comingSoon).length,
	roadmap: brandProjects.filter((project) => project.comingSoon).length,
	external: brandProjects.filter((project) => project.external).length,
};
