/**
 * Cinta: fila de tarjetas que avanza sola, en bucle.
 * Marcado: [data-cinta] > [data-cinta-viewport] > [data-cinta-track] > li.
 * - Se detiene al pasar el ratón, al enfocar una tarjeta, al arrastrar, fuera
 *   de pantalla y con la pestaña oculta. El botón de pausa la detiene del todo.
 * - Se arrastra con el dedo o el ratón; las flechas avanzan una tarjeta.
 * - Las copias que cierran el bucle son `inert` y aria-hidden.
 * - Con "reducir movimiento" no hay copias ni avance: scroll nativo con ajuste.
 */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll<HTMLElement>("[data-cinta]").forEach((root) => {
	if (root.dataset.ready) return;
	root.dataset.ready = "true";

	const viewport = root.querySelector<HTMLElement>("[data-cinta-viewport]")!;
	const track = root.querySelector<HTMLElement>("[data-cinta-track]")!;
	const prev = root.querySelector<HTMLButtonElement>("[data-cinta-prev]")!;
	const next = root.querySelector<HTMLButtonElement>("[data-cinta-next]")!;
	const toggle = root.querySelector<HTMLButtonElement>("[data-cinta-toggle]")!;
	const originals = Array.from(track.children) as HTMLElement[];
	const container = root.closest("section")?.querySelector<HTMLElement>(".container-site");

	const SPEED = 26; // px por segundo
	const RESUME_MS = 2500;
	const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
	const step = () => originals[0].offsetWidth + gap();

	// Alinea la primera tarjeta con el margen del contenido.
	const lead = () => {
		if (!container) return 0;
		const cs = getComputedStyle(container);
		return container.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
	};

	// Halo que sigue al puntero en cada tarjeta.
	root.addEventListener("pointermove", (e) => {
		const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
		if (!card) return;
		const r = card.getBoundingClientRect();
		card.style.setProperty("--mx", `${e.clientX - r.left}px`);
		card.style.setProperty("--my", `${e.clientY - r.top}px`);
	});

	if (reduceMotion.matches) {
		root.classList.add("is-static");
		const pad = () => {
			const l = `${lead()}px`;
			track.style.paddingInline = `${l}`;
			viewport.style.scrollPaddingInline = l;
		};
		pad();
		window.addEventListener("resize", pad, { passive: true });
		prev.addEventListener("click", () => viewport.scrollBy({ left: -step(), behavior: "smooth" }));
		next.addEventListener("click", () => viewport.scrollBy({ left: step(), behavior: "smooth" }));
		return;
	}

	let setW = 0;
	let pos = 0;
	let target: number | null = null;
	let hover = false;
	let focus = false;
	let visible = false;
	let userPaused = false;
	let resumeAt = 0;
	let last = 0;
	let raf = 0;

	const layout = () => {
		track.querySelectorAll("[data-clone]").forEach((n) => n.remove());
		track.style.paddingLeft = `${lead()}px`;
		setW = originals.reduce((w, el) => w + el.offsetWidth + gap(), 0);
		const copies = Math.ceil(viewport.clientWidth / Math.max(setW, 1)) + 1;
		for (let c = 0; c < copies; c++) {
			originals.forEach((el) => {
				const clone = el.cloneNode(true) as HTMLElement;
				clone.dataset.clone = "";
				clone.setAttribute("aria-hidden", "true");
				clone.inert = true;
				track.append(clone);
			});
		}
		pos = wrap(pos);
		paint();
	};

	const wrap = (v: number) => (setW ? ((v % setW) + setW) % setW : 0);
	const paint = () => {
		track.style.transform = `translate3d(${-pos}px,0,0)`;
	};
	const running = (now: number) =>
		!userPaused && !hover && !focus && !dragging && visible && !document.hidden && now >= resumeAt;

	const tick = (now: number) => {
		const dt = Math.min(now - (last || now), 50) / 1000;
		last = now;
		if (target !== null) {
			const delta = target - pos;
			pos += delta * Math.min(1, dt * 9);
			if (Math.abs(delta) < 0.5) {
				pos = target;
				target = null;
			}
		} else if (running(now)) {
			pos += SPEED * dt;
		}
		const wrapped = wrap(pos);
		if (target !== null) target += wrapped - pos;
		pos = wrapped;
		paint();
		raf = visible ? requestAnimationFrame(tick) : 0;
	};
	const start = () => {
		if (!raf) {
			last = 0;
			raf = requestAnimationFrame(tick);
		}
	};

	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) start();
	}).observe(viewport);

	const hold = () => {
		resumeAt = performance.now() + RESUME_MS;
	};
	const go = (dir: number) => {
		hold();
		target = (target ?? pos) + dir * step();
		start();
	};
	prev.addEventListener("click", () => go(-1));
	next.addEventListener("click", () => go(1));

	toggle.addEventListener("click", () => {
		userPaused = !userPaused;
		toggle.setAttribute("aria-pressed", String(userPaused));
		toggle.setAttribute("aria-label", userPaused ? "Reanudar el movimiento" : "Pausar el movimiento");
		toggle.querySelector<HTMLElement>("[data-icon-pause]")!.hidden = userPaused;
		toggle.querySelector<HTMLElement>("[data-icon-play]")!.hidden = !userPaused;
	});

	viewport.addEventListener("pointerenter", (e) => {
		if (e.pointerType === "mouse") hover = true;
	});
	viewport.addEventListener("pointerleave", () => {
		hover = false;
	});

	// Al enfocar una tarjeta con el teclado, se lleva a la vista.
	track.addEventListener("focusin", (e) => {
		focus = true;
		const item = (e.target as HTMLElement).closest<HTMLElement>(".cinta-item");
		if (item) {
			target = item.offsetLeft - lead();
			start();
		}
	});
	track.addEventListener("focusout", () => {
		focus = false;
		hold();
	});

	// Arrastre con dedo o ratón.
	let dragging = false;
	let pointerId = -1;
	let startX = 0;
	let startPos = 0;
	let moved = false;
	viewport.addEventListener("pointerdown", (e) => {
		if (e.button !== 0) return;
		pointerId = e.pointerId;
		startX = e.clientX;
		startPos = pos;
		moved = false;
		target = null;
	});
	viewport.addEventListener("pointermove", (e) => {
		if (e.pointerId !== pointerId) return;
		const dx = e.clientX - startX;
		if (!dragging && Math.abs(dx) > 6) {
			dragging = true;
			moved = true;
			viewport.classList.add("is-dragging");
			viewport.setPointerCapture(pointerId);
		}
		if (dragging) {
			pos = startPos - dx;
			start();
		}
	});
	const end = (e: PointerEvent) => {
		if (e.pointerId !== pointerId) return;
		pointerId = -1;
		if (dragging) {
			dragging = false;
			viewport.classList.remove("is-dragging");
			hold();
		}
	};
	viewport.addEventListener("pointerup", end);
	viewport.addEventListener("pointercancel", end);
	// Un arrastre no debe abrir el enlace de la tarjeta.
	viewport.addEventListener(
		"click",
		(e) => {
			if (moved) {
				e.preventDefault();
				e.stopPropagation();
				moved = false;
			}
		},
		true,
	);

	let resizeTimer = 0;
	window.addEventListener(
		"resize",
		() => {
			clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(layout, 150);
		},
		{ passive: true },
	);
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden && visible) start();
	});

	layout();
	document.fonts?.ready.then(layout);
});
