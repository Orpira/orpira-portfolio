/**
 * Persiana: un grupo de franjas donde solo una está abierta.
 * Marcado: [data-persiana] > [data-strip] > [data-strip-head] + .strip-body.
 * - Clic, foco o flechas abren una franja.
 * - Con data-hover en [data-persiana], también al pasar el ratón (solo con
 *   puntero fino y a partir de 768 px). data-hover="head" escucha solo la
 *   cabecera de cada franja, útil en persianas horizontales.
 * - Los paneles cerrados son `inert` para que sus enlaces no reciban foco.
 */
const canHover = window.matchMedia("(hover: hover) and (min-width: 768px)");

document.querySelectorAll<HTMLElement>("[data-persiana]").forEach((root) => {
	if (root.dataset.ready) return;
	root.dataset.ready = "true";
	const strips = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-strip]"));
	const HOVER_DELAY = 140;
	const LOCK_MS = 550;
	let hoverTimer = 0;
	let lockedUntil = 0;

	// data-anchor: mientras las filas cambian de altura, se compensa el scroll
	// para que la cabecera elegida no se mueva de debajo del puntero.
	const anchor = root.dataset.anchor !== undefined;
	const keepInPlace = (strip: HTMLElement) => {
		const head = strip.querySelector<HTMLElement>("[data-strip-head]");
		if (!head) return;
		let last = head.getBoundingClientRect().top;
		const end = performance.now() + LOCK_MS + 100;
		const step = () => {
			const now = head.getBoundingClientRect().top;
			if (now !== last) window.scrollBy({ top: now - last, behavior: "instant" });
			last = head.getBoundingClientRect().top;
			if (performance.now() < end) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	};

	const activate = (target: HTMLElement) => {
		if (anchor) keepInPlace(target);
		strips.forEach((strip) => {
			const on = strip === target;
			strip.dataset.active = on ? "true" : "false";
			strip.querySelector("[data-strip-head]")?.setAttribute("aria-expanded", String(on));
			const body = strip.querySelector<HTMLElement>(".strip-body");
			if (body) body.inert = !on;
		});
	};

	strips.forEach((strip) => {
		const head = strip.querySelector<HTMLButtonElement>("[data-strip-head]");
		head?.addEventListener("click", () => activate(strip));
		head?.addEventListener("focus", () => activate(strip));
		if (root.dataset.hover !== undefined) {
			// Espera breve antes de abrir y bloqueo durante la animación: así, si
			// la fila abierta cambia de altura, el puntero no abre otra en cadena.
			const target = root.dataset.hover === "head" ? head : strip;
			target?.addEventListener("mouseenter", () => {
				if (!canHover.matches) return;
				window.clearTimeout(hoverTimer);
				hoverTimer = window.setTimeout(() => {
					if (Date.now() < lockedUntil || strip.dataset.active === "true") return;
					activate(strip);
					lockedUntil = Date.now() + LOCK_MS;
				}, HOVER_DELAY);
			});
			target?.addEventListener("mouseleave", () => window.clearTimeout(hoverTimer));
		}
	});

	root.addEventListener("keydown", (e) => {
		if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
		if (!(e.target as HTMLElement).matches("[data-strip-head]")) return;
		const current = strips.findIndex((s) => s.dataset.active === "true");
		const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
		const next = strips[(current + step + strips.length) % strips.length];
		next.querySelector<HTMLButtonElement>("[data-strip-head]")?.focus();
		e.preventDefault();
	});
});
