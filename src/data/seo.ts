/**
 * Datos estructurados (JSON-LD) de schema.org.
 * Portada: Person + ProfessionalService + WebSite. Casos: Article + BreadcrumbList.
 * Solo datos públicos y verificables; sin teléfono ni email.
 */
export const SITE_URL = "https://orpira.es";

const personId = `${SITE_URL}/#persona`;
const websiteId = `${SITE_URL}/#web`;

const sameAs = [
	"https://www.linkedin.com/in/orlando-pineda-raad-273402257",
	"https://github.com/Orpira",
];

export const person = {
	"@type": "Person",
	"@id": personId,
	name: "Orlando Pineda Raad",
	alternateName: "OrPiRa",
	url: SITE_URL,
	image: `${SITE_URL}/og/portada.jpg`,
	jobTitle: "Desarrollador de producto Full Stack",
	description:
		"Apps web, PWA y Android, tiempo real, 3D e IA aplicada, de la idea al despliegue.",
	address: {
		"@type": "PostalAddress",
		addressLocality: "Bilbao",
		addressRegion: "Bizkaia",
		addressCountry: "ES",
	},
	knowsAbout: [
		"Desarrollo web Full Stack",
		"Herramientas internas a medida",
		"Integración de IA en procesos",
		"React",
		"Astro",
		"Next.js",
		"Node.js",
		"PostgreSQL",
		"Supabase",
	],
	sameAs,
};

export const homeJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": websiteId,
			url: SITE_URL,
			name: "OrPiRa",
			inLanguage: "es-ES",
			publisher: { "@id": personId },
		},
		person,
	],
};

interface CaseLd {
	slug: string;
	title: string;
	description: string;
	headline: string;
	tags: string[];
	platform: string;
	demoUrl?: string;
}

export const caseJsonLd = (c: CaseLd) => {
	const url = `${SITE_URL}/casos/${c.slug}`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Article",
				"@id": `${url}#articulo`,
				headline: `${c.title}: ${c.headline}`.slice(0, 110),
				description: c.description,
				url,
				mainEntityOfPage: url,
				image: `${SITE_URL}/og/${c.slug}.jpg`,
				inLanguage: "es-ES",
				author: { "@type": "Person", "@id": personId, name: "Orlando Pineda Raad", url: SITE_URL },
				publisher: { "@type": "Person", "@id": personId, name: "Orlando Pineda Raad" },
				keywords: c.tags.join(", "),
				about: {
					"@type": "SoftwareApplication",
					name: c.title,
					applicationCategory: "WebApplication",
					operatingSystem: c.platform,
					...(c.demoUrl ? { url: c.demoUrl } : {}),
				},
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{ "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
					{ "@type": "ListItem", position: 2, name: "Proyectos", item: `${SITE_URL}/#casos` },
					{ "@type": "ListItem", position: 3, name: c.title, item: url },
				],
			},
		],
	};
};
