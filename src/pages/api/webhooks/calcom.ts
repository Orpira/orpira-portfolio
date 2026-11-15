import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const maxBytes = 64 * 1024;
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function meetingUrl(values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string" || value.length > 2048) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !url.username && !url.password) return url.href;
    } catch {
      continue;
    }
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });
  const signature = request.headers.get("x-cal-signature-256");
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return new Response(null, { status: 401 });

  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    chunks.push(value);
  }

  const body = Buffer.concat(chunks);
  const expected = createHmac("sha256", secret).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return new Response(null, { status: 401 });

  let event: Record<string, unknown>;
  try {
    event = object(JSON.parse(body.toString("utf8")));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (event.triggerEvent !== "BOOKING_CREATED") return new Response(null, { status: 204 });
  const payload = object(event.payload);
  const firstAttendee = object(Array.isArray(payload.attendees) ? payload.attendees[0] : null);
  const email = firstAttendee.email;
  const uid = payload.uid;
  const start = payload.startTime;
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof uid !== "string" || !/^[\w-]{1,128}$/.test(uid) ||
    typeof start !== "string" || !/T.*(?:Z|[+-]\d\d:\d\d)$/i.test(start) || !Number.isFinite(Date.parse(start))) {
    return new Response(null, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("record_crm_booking", {
    p_uid: uid,
    p_email: email.trim().toLowerCase(),
    p_start_at: new Date(start).toISOString(),
    p_meeting_url: meetingUrl([payload.videoCallUrl, object(payload.metadata).videoCallUrl, payload.location]),
  });
  if (error) {
    console.error("No se pudo guardar la reserva de Cal.com", error.code);
    return new Response(null, { status: 503 });
  }
  return Response.json({ status: data }, { headers: { "Cache-Control": "no-store" } });
};
