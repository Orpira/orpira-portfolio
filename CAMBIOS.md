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

## Formulario de contacto (reemplaza ofuscación Base64)

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se **revirtió la ofuscación Base64** implementada anteriormente y en su lugar se adoptó un enfoque más seguro: un **formulario de contacto** que envía mensajes a través de [Web3Forms](https://web3forms.com/). Con este enfoque, el email del destinatario **nunca aparece en el código fuente** — está configurado únicamente en el panel de Web3Forms.

---

### Archivos modificados

| Archivo                               | Cambio realizado                                                           |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/ContactSection.astro` | Se reemplazó email/teléfono por formulario de contacto                     |
| `src/components/Footer.astro`         | Se eliminó el enlace `mailto:`, icono de email ahora apunta a `#contact`   |
| `src/layouts/Layout.astro`            | Se revirtió la ofuscación del botón WhatsApp (vuelve a su estado original) |

---

### Detalle de las modificaciones

#### 1. `src/components/ContactSection.astro` — Formulario de contacto

**Antes (ofuscación Base64):**

```html
<p>Puedes escribirme a <a id="contact-email" href="#">...</a></p>
<p>📱 <span id="contact-phone"></span></p>
<script>
	/* decodificación con atob() */
</script>
```

**Después (formulario):**

```html
<form id="contact-form" novalidate>
	<input type="hidden" name="access_key" value="{WEB3FORMS_KEY}" />
	<input type="text" name="name" required placeholder="Tu nombre" />
	<input type="email" name="email" required placeholder="tu@email.com" />
	<textarea
		name="message"
		required
		placeholder="Cuéntame sobre tu proyecto..."
	></textarea>
	<button type="submit">Enviar mensaje</button>
</form>
```

**Características del formulario:**

- Campos: nombre, email del remitente, mensaje
- Validación HTML5 nativa + `checkValidity()`
- Honeypot anti-spam (`botcheck` hidden checkbox)
- Envío vía `fetch()` a la API de Web3Forms
- Estados visuales: enviando (botón deshabilitado), éxito (verde), error (rojo)
- Estilizado con Tailwind CSS, compatible con modo claro/oscuro
- El enlace de descarga de CV se mantiene debajo del formulario

---

#### 2. `src/components/Footer.astro` — Icono de email redirige al formulario

**Antes:**

```html
<a id="footer-email" href="#">
	<Email />
</a>
<script>
	/* inyección de mailto: con atob() */
</script>
```

**Después:**

```html
<a href="#contact" title="Formulario de contacto">
	<Email />
</a>
```

- El icono de email ahora navega al formulario de contacto (`#contact`) en lugar de abrir un `mailto:`.
- Se eliminó el `<script>` de ofuscación.
- LinkedIn y GitHub permanecen sin cambios.

---

#### 3. `src/layouts/Layout.astro` — WhatsApp restaurado

- Se revirtió el botón flotante de WhatsApp a su estado original con la URL directa `https://wa.me/34643684541`.
- Se eliminó el script de ofuscación Base64.

> **Nota:** El número de WhatsApp permanece visible en el código fuente. Si se desea ocultar también, se puede eliminar el botón flotante y agregar WhatsApp como campo adicional en Web3Forms.

---

### Configuración necesaria (Web3Forms)

Para que el formulario funcione, sigue estos pasos:

1. Ve a [web3forms.com](https://web3forms.com/)
2. Introduce tu email (`orpira@icloud.com`) para recibir la Access Key
3. Revisa tu correo y copia la Access Key
4. En `src/components/ContactSection.astro`, reemplaza:
   ```js
   const WEB3FORMS_KEY = "TU_ACCESS_KEY_AQUI";
   ```
   por tu Access Key real.

> **Importante:** La Access Key es segura de exponer en el frontend. Web3Forms la usa para saber a qué email enviar, pero el email en sí **nunca aparece en tu código**.

---

### Nivel de protección

| Protege contra                    | ¿Sí/No?                                 |
| --------------------------------- | --------------------------------------- |
| Email visible en código fuente    | ✅ Sí (el email solo está en Web3Forms) |
| Teléfono visible en código fuente | ✅ Sí (eliminado del HTML)              |
| Bots/scrapers de email            | ✅ Sí                                   |
| Spam en el formulario             | ✅ Parcial (honeypot anti-bot incluido) |
| WhatsApp visible en código fuente | ❌ No (se mantiene como enlace directo) |
