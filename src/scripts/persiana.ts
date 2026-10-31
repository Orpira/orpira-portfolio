/**
 * Persiana: un grupo de franjas donde solo una está abierta.
 * Marcado: [data-persiana] > [data-strip] > [data-strip-head] + .strip-body.
 * - Clic, foco o flechas abren una franja.
 * - Con data-hover en [data-persiana], también al pasar el ratón
 *   (solo con puntero fino y a partir de 768 px).
 * - Los paneles cerrados son `inert` para que sus enlaces no reciban foco.
 */
const canHover = window.matchMedia("(hover: hover) and (min-width: 768px)");

document.querySelectorAll<HTMLElement>("[data-persiana]").forEach((root) => {
	if (root.dataset.ready) return;
	root.dataset.ready = "true";
	const strips = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-strip]"));

	const activate = (target: HTMLElement) => {
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
			strip.addEventListener("mouseenter", () => {
				if (canHover.matches) activate(strip);
			});
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
