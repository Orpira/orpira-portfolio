import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id || !uuid.test(id)) return new Response(null, { status: 404 });

  const back = (result: string) => redirect(`/dashboard/lead/${id}?reply=${result}#respuesta`, 303);
  const form = await request.formData().catch(() => null);
  const replyId = form?.get("replyId") || null;
  const action = form?.get("action");
  const subject = form?.get("subject");
  const body = form?.get("body");
  const recipient = form?.get("recipient");
  if (
    (action !== "save" && action !== "send") ||
    (replyId !== null && (typeof replyId !== "string" || !uuid.test(replyId))) ||
    typeof subject !== "string" || !subject.trim() || subject.length > 200 ||
    typeof body !== "string" || !body.trim() || body.length > 10000 ||
    (action === "send" && (typeof recipient !== "string" || !recipient))
  ) return back("invalid");

  const fields = {
    p_contact_id: id,
    p_reply_id: replyId,
    p_subject: subject.trim(),
    p_body: body.replace(/\r\n?/g, "\n"),
  };
  const { data, error } = action === "send"
    ? await supabaseAdmin.rpc("queue_crm_reply", { ...fields, p_recipient: recipient })
    : await supabaseAdmin.rpc("save_crm_reply", fields);

  if (error) {
    console.error("Error al guardar la respuesta comercial", error.code);
    return back("error");
  }
  if (!data) return back("conflict");
  return back(action === "send" ? "requested" : "saved");
};
