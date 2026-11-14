import type { APIRoute } from "astro";
import { createCrmAuthClient, isCrmAdmin } from "../../lib/crm-auth";
import { createRateLimiter, getClientIp } from "../../lib/rate-limit";

const isRateLimited = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
});

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (isRateLimited(getClientIp(request))) {
    return redirect("/dashboard?error=2", 303);
  }

  const form = await request.formData().catch(() => null);
  const email = form?.get("email");
  const password = form?.get("password");
  if (
    typeof email !== "string" || !email.trim() || email.length > 254 ||
    typeof password !== "string" || !password || password.length > 1024
  ) {
    return redirect("/dashboard?error=1", 303);
  }

  const { auth } = createCrmAuthClient(cookies, request);
  const { data, error } = await auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) return redirect("/dashboard?error=1", 303);

  if (!isCrmAdmin(data.user)) {
    await auth.signOut({ scope: "local" });
    return redirect("/dashboard?error=1", 303);
  }

  return redirect("/dashboard/leads", 303);
};
