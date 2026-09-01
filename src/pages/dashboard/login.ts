import type { APIRoute } from "astro";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
} from "../../lib/admin-session";
import { createRateLimiter, getClientIp } from "../../lib/rate-limit";

const adminPassword = import.meta.env.ADMIN_PASSWORD;

if (!adminPassword || adminPassword.length < 12) {
  throw new Error(
    "ADMIN_PASSWORD debe estar configurada con al menos 12 caracteres"
  );
}

const isRateLimited = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
});

const constantTimeEquals = (left: string, right: string) => {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
};

export const POST: APIRoute = async ({
  request,
  cookies,
  redirect
}) => {

  const form =
    await request.formData();

  const password =
    form.get("password");

  if (isRateLimited(getClientIp(request))) {
    return redirect("/dashboard?error=2", 303);
  }

  if (
    typeof password === "string" &&
    password.length <= 1024 &&
    constantTimeEquals(password, adminPassword)
  ) {

    cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSession(),
      {
        path: "/dashboard",
        httpOnly: true,
        sameSite: "strict",
        secure: import.meta.env.PROD,
        maxAge: ADMIN_SESSION_MAX_AGE
      }
    );

    return redirect("/dashboard/leads", 303);
  }

  return redirect("/dashboard?error=1", 303);
};
