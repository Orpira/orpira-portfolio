export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

type FinanceMovementType = "income" | "expense";

interface FinanceMovementPayload {
	type?: unknown;
	description?: unknown;
	amount?: unknown;
	category?: unknown;
}

interface DeleteFinanceMovementPayload {
	id?: unknown;
	all?: unknown;
}

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
	throw new Error("PUBLIC_SUPABASE_URL no configurada");
}

if (!serviceKey) {
	throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
}

const supabase = createClient(supabaseUrl, serviceKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
		},
	});

const isMovementType = (value: unknown): value is FinanceMovementType =>
	value === "income" || value === "expense";

export const POST: APIRoute = async ({ request }) => {
	try {
		const payload = (await request.json()) as FinanceMovementPayload;
		const type = payload.type;
		const description =
			typeof payload.description === "string"
				? payload.description.trim()
				: "";
		const category =
			typeof payload.category === "string" ? payload.category.trim() : "";
		const amount =
			typeof payload.amount === "number"
				? payload.amount
				: Number(payload.amount);

		if (!isMovementType(type)) {
			return jsonResponse(
				{
					success: false,
					error: "Tipo de movimiento no valido.",
				},
				400,
			);
		}

		if (!description) {
			return jsonResponse(
				{
					success: false,
					error: "La descripcion es obligatoria.",
				},
				400,
			);
		}

		if (!Number.isFinite(amount) || amount <= 0) {
			return jsonResponse(
				{
					success: false,
					error: "El importe debe ser mayor que 0.",
				},
				400,
			);
		}

		const { data, error } = await supabase
			.from("finance_movements")
			.insert({
				type,
				description: description.slice(0, 120),
				amount: Number(amount.toFixed(2)),
				category: category ? category.slice(0, 80) : "Demo",
			})
			.select("id, type, description, amount, category, created_at")
			.single();

		if (error) {
			throw error;
		}

		return jsonResponse({
			success: true,
			movement: data,
		});
	} catch (error: any) {
		console.error(error);

		return jsonResponse(
			{
				success: false,
				error: error?.message ?? "Error interno",
			},
			500,
		);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const payload = (await request.json().catch(() => ({}))) as DeleteFinanceMovementPayload;
		const id = typeof payload.id === "string" ? payload.id.trim() : "";
		const deleteAll = payload.all === true;

		if (!id && !deleteAll) {
			return jsonResponse(
				{
					success: false,
					error: "Indica el movimiento a borrar o confirma el borrado completo.",
				},
				400,
			);
		}

		const query = supabase.from("finance_movements").delete();
		const { error } = deleteAll
			? await query.neq("id", "00000000-0000-0000-0000-000000000000")
			: await query.eq("id", id);

		if (error) {
			throw error;
		}

		return jsonResponse({
			success: true,
		});
	} catch (error: any) {
		console.error(error);

		return jsonResponse(
			{
				success: false,
				error: error?.message ?? "Error interno",
			},
			500,
		);
	}
};
