import type { APIRoute } from "astro";
import { stages } from "../../../../lib/crm-pipeline";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id || !uuid.test(id)) return new Response(null, { status: 404 });

  const form = await request.formData().catch(() => null);
  const from = form?.get("from");
  const to = form?.get("to");
  const destination = form?.get("return") === "lead" ? `/dashboard/lead/${id}` : "/dashboard/embudo";
  const back = (result: string) => redirect(`${destination}?etapa=${result}`, 303);

  if (typeof from !== "string" || typeof to !== "string" || !stages.some((stage) => stage.id === to)) {
    return back("invalid");
  }

  const { data, error } = await supabaseAdmin.rpc("move_crm_contact_stage", {
    p_contact_id: id,
    p_from: from === "" ? null : from,
    p_to: to,
  });

  if (error) {
    console.error("Error al mover la etapa del CRM", error.code);
    return back("error");
  }
  return back(data ? "saved" : "conflict");
};
