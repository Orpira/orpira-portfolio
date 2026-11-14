import type { APIRoute } from "astro";
import { clearCrmAuthCookies, createCrmAuthClient } from "../../lib/crm-auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { error } = await createCrmAuthClient(cookies, request).auth.signOut({ scope: "local" });
  clearCrmAuthCookies(cookies, request);
  if (error) {
    console.error("No se pudo revocar la sesión del CRM", error.code);
  }
  return redirect("/dashboard", 303);
};
