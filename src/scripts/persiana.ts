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
	// La web usa scroll-behavior: smooth. Safari en iOS no reconoce
	// behavior: "instant" y animaba cada corrección, así que la página daba
	// tirones. Durante la compensación se desactiva el scroll suave en <html>
	// y se corrige con scrollTo sin opciones de comportamiento.
	let anchorRuns = 0;
	const keepInPlace = (strip: HTMLElement) => {
		const head = strip.querySelector<HTMLElement>("[data-strip-head]");
		if (!head) return;
		const html = document.documentElement;
		if (anchorRuns++ === 0) html.style.scrollBehavior = "auto";
		let last = head.getBoundingClientRect().top;
		const end = performance.now() + LOCK_MS + 100;
		const step = () => {
			const now = head.getBoundingClientRect().top;
			const diff = now - last;
			if (Math.abs(diff) >= 0.5) window.scrollTo(0, window.scrollY + diff);
			last = head.getBoundingClientRect().top;
			if (performance.now() < end) {
				requestAnimationFrame(step);
			} else if (--anchorRuns === 0) {
				html.style.scrollBehavior = "";
			}
		};
		requestAnimationFrame(step);
	};

	// Pantallas táctiles: nada de corrección continua (en iOS la barra de Safari
	// aparece y desaparece al hacer scroll y la corrección la perseguía, la
	// página brincaba). Al terminar de abrirse la franja, si su contenido no se
	// ve entero, un único scroll suave deja su título bajo la cabecera fija.
	const reveal = (strip: HTMLElement) => {
		window.setTimeout(() => {
			const head = strip.querySelector<HTMLElement>("[data-strip-head]");
			const body = strip.querySelector<HTMLElement>(".strip-body");
			if (!head || !body || strip.dataset.active !== "true") return;
			const header = document.querySelector<HTMLElement>("body > header, header.site-header, header");
			const offset = (header?.getBoundingClientRect().bottom ?? 0) + 12;
			const top = head.getBoundingClientRect().top;
			const bottom = body.getBoundingClientRect().bottom;
			const viewH = window.visualViewport?.height ?? window.innerHeight;
			if (top < offset || bottom > viewH - 12) {
				window.scrollTo({ top: window.scrollY + top - offset, behavior: "smooth" });
			}
		}, LOCK_MS);
	};

	const setState = (target: HTMLElement) => {
		strips.forEach((strip) => {
			const on = strip === target;
			strip.dataset.active = on ? "true" : "false";
			strip.querySelector("[data-strip-head]")?.setAttribute("aria-expanded", String(on));
			const body = strip.querySelector<HTMLElement>(".strip-body");
			if (body) body.inert = !on;
		});
	};

	const activate = (target: HTMLElement) => {
		if (target.dataset.active === "true") return;

		// Ratón: compensación continua mientras dura la animación.
		if (canHover.matches) {
			if (anchor) keepInPlace(target);
			setState(target);
			return;
		}

		// Táctil: la franja que estaba abierta se cierra al instante (sin
		// animación) y se corrige el scroll una sola vez, de forma exacta, para
		// que el título tocado no se mueva. Luego solo se anima la que se abre.
		const head = target.querySelector<HTMLElement>("[data-strip-head]");
		const before = head?.getBoundingClientRect().top ?? 0;
		const previous = strips.find((s) => s.dataset.active === "true");
		if (previous) previous.dataset.instant = "";
		setState(target);
		const after = head?.getBoundingClientRect().top ?? 0; // fuerza el layout
		if (Math.abs(after - before) >= 0.5) {
			const html = document.documentElement;
			html.style.scrollBehavior = "auto";
			window.scrollTo(0, window.scrollY + (after - before));
			html.style.scrollBehavior = "";
		}
		requestAnimationFrame(() => {
			if (previous) delete previous.dataset.instant;
		});
		reveal(target);
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
