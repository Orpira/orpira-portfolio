import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "crm_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const getSessionSecret = () => {
	const secret = import.meta.env.ADMIN_SESSION_SECRET;

	if (!secret || secret.length < 32) {
		throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres");
	}

	return secret;
};

const sign = (value: string) =>
	createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

export const createAdminSession = () => {
	const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE;
	const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;

	return `${payload}.${sign(payload)}`;
};

export const verifyAdminSession = (token?: string) => {
	if (!token) return false;

	const parts = token.split(".");
	if (parts.length !== 3) return false;

	const [expiresAt, nonce, signature] = parts;
	if (!/^\d+$/.test(expiresAt) || !nonce || !signature) return false;
	if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

	const expected = Buffer.from(sign(`${expiresAt}.${nonce}`));
	const received = Buffer.from(signature);

	return expected.length === received.length && timingSafeEqual(expected, received);
};
