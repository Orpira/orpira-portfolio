import type { APIRoute } from "astro";

export const POST: APIRoute = async ({
  request,
  cookies,
  redirect
}) => {

  const form =
    await request.formData();

  const password =
    form.get("password");

  if (
    password ===
    import.meta.env.ADMIN_PASSWORD
  ) {

    cookies.set(
      "crm_auth",
      "true",
      {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true
      }
    );

    return redirect(
      "/dashboard/leads"
    );
  }

  return redirect(
    "/dashboard?error=1"
  );
};