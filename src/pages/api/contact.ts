export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const contactWebhookUrl = import.meta.env.CONTACT_WEBHOOK_URL;

if (!supabaseUrl) {
	throw new Error("PUBLIC_SUPABASE_URL no configurada");
}

if (!serviceKey) {
	throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
}

const supabase = createClient(
	supabaseUrl,
	serviceKey,
);

export const POST: APIRoute = async ({ request }) => {
	try {
		const { name, email, message } =
			await request.json();

		const { error } = await supabase
			.from("contacts")
			.insert({
				name,
				email,
				message,
				source: "portfolio",
				status: "new",
			});

		if (error) {
			throw error;
		}

		if (contactWebhookUrl) {
			try {
				await fetch(contactWebhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					email,
					message,
				}),
				});
			} catch (webhookError) {
				console.error(webhookError);
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
			}),
			{
				status: 200,
			},
		);
	} catch (error: any) {
		console.error(error);

		return new Response(
			JSON.stringify({
				success: false,
				error:
					error?.message ??
					"Error interno",
			}),
			{
				status: 500,
			},
		);
	}
};
