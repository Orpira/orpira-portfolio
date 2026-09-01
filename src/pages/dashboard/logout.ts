import type { APIRoute } from "astro";
import { ADMIN_SESSION_COOKIE } from "../../lib/admin-session";

export const POST: APIRoute = async ({
  cookies,
  redirect
}) => {

  cookies.delete(
    ADMIN_SESSION_COOKIE,
    {
      path: "/dashboard"
    }
  );

  return redirect("/dashboard", 303);
};
