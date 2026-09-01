const RATE_LIMIT_MAP_MAX = 10_000;

export interface RateLimitOptions {
	max: number;
	windowMs: number;
}

export const createRateLimiter = ({ max, windowMs }: RateLimitOptions) => {
	const entries = new Map<string, number[]>();

	return (key: string) => {
		const now = Date.now();
		const windowStart = now - windowMs;
		const recent = (entries.get(key) ?? []).filter(
			(time) => time > windowStart,
		);

		recent.push(now);

		if (entries.size >= RATE_LIMIT_MAP_MAX && !entries.has(key)) {
			for (const [entryKey, times] of entries) {
				if (!times.some((time) => time > windowStart)) {
					entries.delete(entryKey);
				}
			}
		}

		entries.set(key, recent);

		return recent.length > max;
	};
};

export const getClientIp = (request: Request) => {
	const realIp = request.headers.get("x-real-ip")?.trim();
	if (realIp) {
		return realIp;
	}

	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const candidates = forwarded
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);

		if (candidates.length > 0) {
			return candidates[candidates.length - 1];
		}
	}

	return "unknown";
};
