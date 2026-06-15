import type { APIRoute } from "astro";

export const GET: APIRoute = async ({
  cookies,
  redirect
}) => {

  cookies.delete(
    "crm_auth",
    {
      path: "/"
    }
  );

  return redirect(
    "/dashboard"
  );
};