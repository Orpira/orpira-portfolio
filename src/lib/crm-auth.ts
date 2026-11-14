import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";

const cookieName = "crm_supabase_auth";
const cookieOptions = {
  path: "/dashboard",
  httpOnly: true,
  sameSite: "strict" as const,
  secure: import.meta.env.PROD,
};

const adminIds = new Set(
  (import.meta.env.CRM_ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()),
);

export const isCrmAdmin = (user: { id: string; is_anonymous?: boolean }) =>
  !user.is_anonymous && adminIds.has(user.id);

const isAuthCookie = (name: string) =>
  name === cookieName || name.startsWith(cookieName + ".");

const readAuthCookieNames = (request: Request) =>
  (request.headers.get("cookie") ?? "")
    .split(";")
    .map((entry) => entry.split("=", 1)[0].trim())
    .filter(isAuthCookie);

export const createCrmAuthClient = (cookies: AstroCookies, request: Request) => {
  const names = new Set(readAuthCookieNames(request));

  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: { name: cookieName, ...cookieOptions },
      cookies: {
        getAll: () => Array.from(names, (name) => ({
          name,
          value: cookies.get(name)?.value ?? "",
        })),
        setAll: (values) => {
          for (const { name, value, options } of values) {
            names.add(name);
            cookies.set(name, value, { ...options, ...cookieOptions });
          }
        },
      },
    },
  );
};

export const hasCrmAuthCookies = (request: Request) =>
  readAuthCookieNames(request).length > 0;

export const clearCrmAuthCookies = (cookies: AstroCookies, request: Request) => {
  for (const name of readAuthCookieNames(request)) {
    cookies.delete(name, cookieOptions);
  }
};
