import { defineMiddleware } from "astro:middleware";
import {
	ADMIN_SESSION_COOKIE,
	verifyAdminSession,
} from "./lib/admin-session";

const PUBLIC_DASHBOARD_PATHS = new Set(["/dashboard", "/dashboard/login"]);

const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' data: https://fonts.gstatic.com",
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
		return decodeURIComponent(value).toLowerCase();
	} catch {
		return value.toLowerCase();
	}
};

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = normalizePathname(context.url.pathname);
	const isDashboardRoute =
		pathname === "/dashboard" || pathname.startsWith("/dashboard/");

	if (
		isDashboardRoute &&
		!PUBLIC_DASHBOARD_PATHS.has(pathname) &&
		!verifyAdminSession(context.cookies.get(ADMIN_SESSION_COOKIE)?.value)
	) {
		const response = context.redirect("/dashboard", 303);
		response.headers.set("Cache-Control", "private, no-store");
		return withSecurityHeaders(response);
	}

	const response = await next();

	if (isDashboardRoute) {
		response.headers.set("Cache-Control", "private, no-store");
		response.headers.append("Vary", "Cookie");
	}

	return withSecurityHeaders(response);
});
