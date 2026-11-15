import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id || !uuid.test(id)) return new Response(null, { status: 404 });

  const form = await request.formData().catch(() => null);
  const body = form?.get("body");
  const back = (result: string) => redirect(`/dashboard/lead/${id}?nota=${result}#notas`, 303);
  if (typeof body !== "string" || !body.trim() || body.length > 4000) return back("invalid");

  const { error } = await supabaseAdmin.from("crm_contact_notes")
    .insert({ contact_id: id, body: body.trim() });

  if (error) {
    console.error("Error al guardar la nota del CRM", error.code);
    return back("error");
  }
  return back("saved");
};
