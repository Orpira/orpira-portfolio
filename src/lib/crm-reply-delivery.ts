export function getCrmReplyDelivery() {
  const url = import.meta.env.CRM_REPLY_WEBHOOK_URL;
  const secret = import.meta.env.CRM_REPLY_WEBHOOK_SECRET;
  if (import.meta.env.CRM_REPLY_SEND_ENABLED !== "true" || !url || !secret) return null;

  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return null;
    return { endpoint, secret };
  } catch {
    return null;
  }
}
