import type { APIRoute } from "astro";
import { isContactCategory } from "../../../../lib/crm-categories";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id || !uuid.test(id)) return new Response(null, { status: 404 });

  const back = (result: string) => redirect(`/dashboard/lead/${id}?seguimiento=${result}#seguimiento`, 303);
  const form = await request.formData().catch(() => null);
  const date = form?.get("date");
  const category = form?.get("category");
  const action = form?.get("action");

  if (
    typeof date !== "string" || (date && !/^20\d{2}-\d{2}-\d{2}$/.test(date)) ||
    (category !== "" && !isContactCategory(category)) ||
    (action !== "save" && action !== "contacted")
  ) return back("invalid");

  const { data, error } = await supabaseAdmin.from("contacts")
    .update({
      next_follow_up_on: date || null,
      contact_category: category || null,
      ...(action === "contacted" && { last_contacted_at: new Date().toISOString() }),
    })
    .eq("id", id).select("id").maybeSingle();

  if (error || !data) return back("error");
  return back("saved");
};
