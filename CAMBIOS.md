# Registro de Modificaciones — Portfolio OrPiRa

**Fecha:** 28 de marzo de 2026

---

## Archivo modificado

**`src/components/HeroSection.astro`**

---

## Resumen de cambios

Se rediseñó la sección Hero del portfolio para incorporar la marca **OrPiRa** con un estilo visual moderno tipo **hacking/tech**, incluyendo un banner de código binario animado que se desplaza horizontalmente.

---

## Detalle de las modificaciones

### 1. Variable de código binario (frontmatter)

```js
const binaryOrpira = "01001111 01110010 01010000 01101001 01010010 01100001";
```

Se añadió la representación binaria ASCII de las letras **O-r-P-i-R-a** para usarla en el banner animado. Cada grupo de 8 bits corresponde a un carácter:

| Binario  | Carácter |
| -------- | -------- |
| 01001111 | O        |
| 01110010 | r        |
| 01010000 | P        |
| 01101001 | i        |
| 01010010 | R        |
| 01100001 | a        |

---

### 2. Marca `<OrPiRa/>` destacada

Se insertó un nuevo bloque HTML entre la foto de perfil y el nombre:

```html
<div class="brand-container mb-6">
	<h2 class="brand-glitch" data-text="OrPiRa">
		<span class="brand-bracket">&lt;</span>OrPiRa<span class="brand-bracket"
			>/&gt;</span
		>
	</h2>
	...
</div>
```

**Explicación:**

- El texto `OrPiRa` se muestra envuelto en brackets `< />` simulando una etiqueta de código, reforzando la estética tech.
- El atributo `data-text="OrPiRa"` alimenta los pseudo-elementos `::before` y `::after` para generar el efecto glitch.

---

### 3. Banner binario con desplazamiento infinito

```html
<div class="binary-banner-wrapper" aria-hidden="true">
	<div class="binary-banner">
		<span class="binary-stream">...</span>
		<span class="binary-stream">...</span>
	</div>
</div>
```

**Explicación:**

- Se duplica el contenido binario en dos `<span>` idénticos para lograr un **scroll infinito sin cortes** (cuando el primero sale de pantalla, el segundo ya ocupa su lugar).
- El wrapper tiene `aria-hidden="true"` para que los lectores de pantalla lo ignoren (es puramente decorativo).
- Se usa `mask-image` con degradado para que los extremos del banner se desvanezcan suavemente.

---

### 4. Estilos CSS añadidos (scoped)

Todos los estilos están dentro de un bloque `<style>` con scope al componente, sin afectar al resto del sitio.

#### 4.1 Texto principal `.brand-glitch`

| Propiedad     | Valor                                        | Propósito                               |
| ------------- | -------------------------------------------- | --------------------------------------- |
| `font-family` | `'Courier New', 'Fira Code', monospace`      | Tipografía de terminal                  |
| `font-size`   | `3.5rem` (móvil) / `5rem` (desktop)          | Tamaño grande y responsivo              |
| `color`       | `#00ff41`                                    | Verde terminal clásico ("Matrix green") |
| `text-shadow` | Triple resplandor verde con distintos radios | Efecto neón/glow                        |
| `animation`   | `glitchFlicker 4s infinite`                  | Parpadeo sutil periódico                |

#### 4.2 Brackets decorativos `.brand-bracket`

- Color ámbar (`#F59E0B`) coincidiendo con el accent del tema.
- Opacidad reducida (`0.7`) para no competir con el texto principal.

#### 4.3 Efecto glitch (pseudo-elementos)

Se generan dos capas superpuestas al texto:

| Capa       | Color            | Animación                                       | Zona visible         |
| ---------- | ---------------- | ----------------------------------------------- | -------------------- |
| `::before` | `#ff004d` (rojo) | `glitchLeft` — desplazamiento lateral izquierdo | Parte superior (35%) |
| `::after`  | `#00d4ff` (cian) | `glitchRight` — desplazamiento lateral derecho  | Parte inferior (40%) |

Ambas capas se activan brevemente (~2% del ciclo) creando un **aberración cromática** intermitente típica de interfaces hacking.

#### 4.4 Banner binario animado

| Clase                    | Función                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `.binary-banner-wrapper` | Contenedor con overflow oculto, ancho máximo 600px, y fade en bordes |
| `.binary-banner`         | Flex container que se desplaza con `binaryScroll`                    |
| `.binary-stream`         | Texto monospace verde con opacidad 0.5                               |

La animación `binaryScroll` mueve el contenedor al `-50%` (la mitad exacta), y al tener dos copias del texto, se genera un **loop infinito sin salto visual**.

---

### 5. Animaciones definidas

| Keyframe        | Duración              | Descripción                                            |
| --------------- | --------------------- | ------------------------------------------------------ |
| `binaryScroll`  | 12s, lineal, infinito | Desplazamiento horizontal del banner binario           |
| `glitchFlicker` | 4s, infinito          | Parpadeo sutil del texto principal (93%-95% del ciclo) |
| `glitchLeft`    | 3s, infinito          | Desplazamiento de la capa roja (90%-92% del ciclo)     |
| `glitchRight`   | 2.5s, infinito        | Desplazamiento de la capa cian (85%-87% del ciclo)     |

Las tres animaciones de glitch usan **ciclos desfasados** para que los efectos no coincidan, generando una sensación más orgánica.

---

### 6. Accesibilidad

- **`aria-hidden="true"`** en el banner binario: evita que lectores de pantalla lean secuencias de números sin sentido.
- **`@media (prefers-reduced-motion: reduce)`**: desactiva todas las animaciones (scroll binario, glitch y flicker) para usuarios que prefieren movimiento reducido en su sistema operativo.

---

## Archivos sin cambios (sesión HeroSection)

Los siguientes archivos **no fueron modificados** en la sesión anterior:

- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- `tailwind.config.js`
- Resto de componentes y páginas

---

---

## Ofuscación de datos de contacto

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se ofuscaron los datos personales sensibles (número de teléfono, email) en todo el portfolio para que **no aparezcan como texto plano en "Ver código fuente"** del navegador. Los datos se codificaron en Base64 y se decodifican en tiempo de ejecución con JavaScript (`atob()`), protegiendo contra bots y scrapers que rastrean HTML estático.

---

### Archivos modificados

| Archivo                               | Dato ofuscado                                              |
| ------------------------------------- | ---------------------------------------------------------- |
| `src/layouts/Layout.astro`            | Enlace de WhatsApp (`wa.me/34643684541`)                   |
| `src/components/ContactSection.astro` | Email (`orpira@icloud.com`) y teléfono (`+34 643 684 541`) |
| `src/components/Footer.astro`         | Email (`mailto:orpira@icloud.com`)                         |

---

### Detalle de las modificaciones

#### 1. `src/layouts/Layout.astro` — Botón flotante de WhatsApp

**Antes:**

```html
<a href="https://wa.me/34643684541" target="_blank" ...></a>
```

**Después:**

```html
<a id="wa-float-btn" href="#" target="_blank" ...></a>
```

```js
const _w = document.getElementById("wa-float-btn") as HTMLAnchorElement | null;
if (_w) _w.href = atob("aHR0cHM6Ly93YS5tZS8zNDY0MzY4NDU0MQ==");
```

- Se eliminó la URL del atributo `href` en el HTML estático y se reemplazó por `#`.
- Se asignó el `id="wa-float-btn"` al enlace.
- Un bloque `<script>` decodifica la URL en Base64 y la asigna al `href` en runtime.

---

#### 2. `src/components/ContactSection.astro` — Email y teléfono

**Antes:**

```html
<a href="mailto:orpira@icloud.com">orpira@icloud.com</a>
<p>📱 +34 643 684 541</p>
```

**Después:**

```html
<a id="contact-email" href="#" class="underline"></a>
<span id="contact-phone"></span>
```

```js
const _ce = document.getElementById("contact-email") as HTMLAnchorElement | null;
if (_ce) {
    const _e = atob("b3JwaXJhQGljbG91ZC5jb20=");
    _ce.href = "mailto:" + _e;
    _ce.textContent = _e;
}
const _cp = document.getElementById("contact-phone");
if (_cp) _cp.textContent = atob("KzM0IDY0MyA2ODQgNTQx");
```

- El email y teléfono se eliminaron del HTML y se insertan mediante JavaScript.
- Ambos valores usan `atob()` para decodificar desde Base64.

---

#### 3. `src/components/Footer.astro` — Enlace de email

**Antes:**

```html
<a href="mailto:orpira@icloud.com" ...></a>
```

**Después:**

```html
<a id="footer-email" href="#" ...></a>
```

```js
const _fe = document.getElementById("footer-email") as HTMLAnchorElement | null;
if (_fe) _fe.href = "mailto:" + atob("b3JwaXJhQGljbG91ZC5jb20=");
```

- Mismo patrón: `href="#"` en HTML, URL real inyectada con JS.

---

### Valores Base64 utilizados

| Valor original              | Base64                                 |
| --------------------------- | -------------------------------------- |
| `https://wa.me/34643684541` | `aHR0cHM6Ly93YS5tZS8zNDY0MzY4NDU0MQ==` |
| `orpira@icloud.com`         | `b3JwaXJhQGljbG91ZC5jb20=`             |
| `+34 643 684 541`           | `KzM0IDY0MyA2ODQgNTQx`                 |

---

### Nivel de protección

| Protege contra                            | ¿Sí/No?                                       |
| ----------------------------------------- | --------------------------------------------- |
| Bots/scrapers que leen HTML estático      | ✅ Sí                                         |
| "Ver código fuente" del navegador         | ✅ Sí (los datos no aparecen en texto plano)  |
| DevTools / Inspector del navegador        | ❌ No (el DOM renderizado contiene los datos) |
| Usuarios determinados que conozcan Base64 | ❌ No                                         |

> **Nota:** Esta técnica es una capa de ofuscación, no cifrado. Para máxima protección, se recomienda usar formularios de contacto server-side.
