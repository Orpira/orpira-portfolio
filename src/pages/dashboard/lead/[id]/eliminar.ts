import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id || !uuid.test(id)) return new Response(null, { status: 404 });

  const back = (result: string) => redirect(`/dashboard/lead/${id}?eliminar=${result}#eliminar-prospecto`, 303);
  const form = await request.formData().catch(() => null);
  if (form?.get("confirm") !== id) return back("confirm");

  const { data, error } = await supabaseAdmin.rpc("delete_crm_prospect", { p_contact_id: id });
  if (error) {
    console.error("Error al eliminar un prospecto del CRM", error.code);
    return back("error");
  }

  if (data === "deleted" || data === "missing") {
    return redirect(`/dashboard/leads?eliminar=${data}`, 303);
  }

  return back(data === "won" || data === "sending" ? data : "error");
};
