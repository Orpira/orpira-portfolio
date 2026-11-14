import { defineMiddleware } from "astro:middleware";
import {
	createCrmAuthClient,
	hasCrmAuthCookies,
	isCrmAdmin,
} from "./lib/crm-auth";

// Mantener sincronizado con vercel.json: las páginas prerenderizadas
// (portada, privacidad, proyectos) no pasan por este middleware en producción.
const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"font-src 'self' data:",
		"img-src 'self' data:",
		"connect-src 'self'",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"object-src 'none'",
		"form-action 'self'",
		"upgrade-insecure-requests",
	].join("; "),
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Opener-Policy": "same-origin",
};

const withSecurityHeaders = (response: Response) => {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(name, value);
	}

	return response;
};

const normalizePathname = (value: string) => {
	try {
		return decodeURIComponent(value).toLowerCase().replace(/\/+$/, "") || "/";
	} catch {
		return value.toLowerCase();
	}
};

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = normalizePathname(context.url.pathname);
	const isDashboardRoute =
		pathname === "/dashboard" || pathname.startsWith("/dashboard/");

	const isAuthAction = ["/dashboard/login", "/dashboard/logout"].includes(pathname) &&
		context.request.method === "POST";
	const isSignInPage = pathname === "/dashboard" &&
		["GET", "HEAD"].includes(context.request.method);

	let canAccess = true;
	if (isDashboardRoute && !isAuthAction && !isSignInPage) {
		canAccess = false;
		if (hasCrmAuthCookies(context.request)) {
			const { data, error } = await createCrmAuthClient(context.cookies, context.request).auth.getUser();
			canAccess = !error && !!data.user && isCrmAdmin(data.user);
		}
	}

	const response = canAccess ? await next() : context.redirect("/dashboard", 303);

	if (isDashboardRoute) {
		response.headers.set("Cache-Control", "private, no-store");
		response.headers.append("Vary", "Cookie");
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return withSecurityHeaders(response);
});
