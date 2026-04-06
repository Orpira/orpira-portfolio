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

---

---

## Efecto shimmer en divisores de sección

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se añadió un **efecto de destello plateado animado** en las líneas divisorias entre secciones del portfolio, reemplazando los simples bordes estáticos por una animación sutil y elegante.

---

### Archivos modificados

| Archivo                                | Cambio realizado                                                         |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `src/styles/global.css`                | Clase `.section-divider` con pseudo-elementos y animación `shimmerSlide` |
| `src/components/ServicesSection.astro` | Reemplazado `border-t border-zinc-800` por `section-divider`             |
| `src/components/ProjectsSection.astro` | Reemplazado `border-t border-zinc-800` por `section-divider`             |
| `src/components/SkillsSection.astro`   | Reemplazado `border-t border-zinc-800` por `section-divider`             |

---

### Detalle técnico

#### Clase `.section-divider` en `global.css`

```css
.section-divider {
	position: relative;
	overflow: hidden;
}

.section-divider::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: rgba(161, 161, 170, 0.3); /* zinc sutil */
}

.section-divider::after {
	content: "";
	position: absolute;
	top: 0;
	width: 80px;
	height: 1px;
	background: linear-gradient(
		90deg,
		transparent,
		#c0c0c0,
		#e8e8e8,
		transparent
	);
	animation: shimmerSlide 6s ease-in-out infinite;
}
```

#### Animación `shimmerSlide`

```css
@keyframes shimmerSlide {
	0% {
		right: -80px;
	}
	100% {
		right: calc(100% + 80px);
	}
}
```

- **Dirección:** derecha a izquierda
- **Color:** plateado (`#c0c0c0` → `#e8e8e8`)
- **Velocidad:** 6 segundos por ciclo
- **Accesibilidad:** Se desactiva con `@media (prefers-reduced-motion: reduce)`

---

### Evolución del efecto

1. **Versión inicial:** verde Matrix (`#00ff41`), 4s, izquierda a derecha
2. **Primera iteración:** se cambió a derecha a izquierda, verde mantenido
3. **Versión final:** color plateado, velocidad reducida a 6s, dirección derecha a izquierda

---

---

## Estilos de botones adaptados al tema claro/oscuro

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se actualizaron los estilos del **botón de envío** del formulario de contacto y del **enlace de descarga de CV** para que se adapten al tema seleccionado (claro/oscuro), usando fondo negro con texto blanco en tema claro y fondo blanco con texto negro en tema oscuro.

---

### Archivo modificado

| Archivo                               | Cambio realizado                                 |
| ------------------------------------- | ------------------------------------------------ |
| `src/components/ContactSection.astro` | Clases del botón submit y enlace CV actualizadas |

---

### Detalle

**Botón de envío:**

```html
<button
	class="... bg-black text-white dark:bg-white dark:text-black ..."
></button>
```

**Enlace de descarga de CV:**

```html
<a class="... bg-black text-white dark:bg-white dark:text-black ..."></a>
```

Ambos elementos mantienen hover con opacidad reducida y transiciones suaves.

---

---

## Botón flotante de scroll-to-top

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se añadió un **botón flotante con flecha hacia arriba** que aparece cuando el usuario hace scroll más allá de 300px, permitiendo volver al inicio de la página con un desplazamiento suave.

---

### Archivo modificado

| Archivo                    | Cambio realizado                                       |
| -------------------------- | ------------------------------------------------------ |
| `src/layouts/Layout.astro` | Botón `#scroll-top-btn` con listener de scroll y click |

---

### Detalle técnico

```html
<button
	id="scroll-top-btn"
	class="fixed bottom-6 left-6 z-50 hidden ..."
	aria-label="Ir arriba"
>
	↑
</button>
```

**Comportamiento JavaScript:**

- Se muestra (`classList.remove("hidden")`) cuando `window.scrollY > 300`
- Se oculta (`classList.add("hidden")`) cuando `window.scrollY <= 300`
- Al hacer clic: `window.scrollTo({ top: 0, behavior: "smooth" })`

**Estilos:**

- Posición fija en esquina inferior izquierda
- Adaptado a tema claro/oscuro (fondo negro/blanco)
- Sombra, bordes redondeados, transición de opacidad

---

---

## Auto-respuesta de Web3Forms

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se configuraron **campos ocultos** en el formulario de contacto para que Web3Forms envíe automáticamente un correo de confirmación al remitente después de enviar un mensaje.

---

### Archivo modificado

| Archivo                               | Cambio realizado                                       |
| ------------------------------------- | ------------------------------------------------------ |
| `src/components/ContactSection.astro` | Campos hidden para autoresponse añadidos al formulario |

---

### Campos añadidos

```html
<input
	type="hidden"
	name="autoresponse"
	value="¡Gracias por contactarme! He recibido tu mensaje y te responderé lo antes posible. — Orlando (OrPiRa)"
/>
<input
	type="hidden"
	name="autoresponse_subject"
	value="Gracias por contactar a OrPiRa"
/>
<input type="hidden" name="autoresponse_from" value="OrPiRa Portfolio" />
```

**Funcionamiento:**

- Cuando un visitante envía el formulario, Web3Forms le envía automáticamente un email de confirmación
- El asunto del email es "Gracias por contactar a OrPiRa"
- El remitente aparece como "OrPiRa Portfolio"
- El cuerpo incluye un mensaje de agradecimiento personalizado

---

---

## Integración con Supabase + Dashboard CRM

**Fecha:** 28 de marzo de 2026

---

### Resumen

Se integró **Supabase** como backend para almacenar los mensajes del formulario de contacto en una base de datos PostgreSQL, y se creó un **panel de administración (CRM)** privado para gestionar los mensajes recibidos.

---

### Archivos creados/modificados

| Archivo                               | Cambio realizado                                                           |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/supabase.ts`                 | **Nuevo** — Configuración del cliente Supabase con esquema SQL documentado |
| `src/components/ContactSection.astro` | Dual-submit: envío en paralelo a Web3Forms + Supabase                      |
| `src/pages/dashboard.astro`           | **Nuevo** — Panel CRM completo con autenticación                           |
| `package.json`                        | Dependencia `@supabase/supabase-js` añadida                                |

---

### 1. Configuración Supabase (`src/lib/supabase.ts`)

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "TU_SUPABASE_URL";
const supabaseAnonKey = "TU_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Esquema SQL para crear la tabla:**

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo', 'leído', 'respondido', 'archivado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política de inserción pública (para el formulario)
CREATE POLICY "Permitir inserción pública"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Política de lectura para usuarios autenticados
CREATE POLICY "Solo usuarios autenticados leen"
  ON messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de actualización para usuarios autenticados
CREATE POLICY "Solo usuarios autenticados actualizan"
  ON messages FOR UPDATE
  USING (auth.role() = 'authenticated');
```

---

### 2. Dual-submit en `ContactSection.astro`

El formulario ahora envía los datos **en paralelo** a dos destinos:

```js
const [web3Result, supaResult] = await Promise.all([
	web3Promise, // Web3Forms (notificación por email)
	supaPromise, // Supabase (almacenamiento en BD)
]);
```

- **Web3Forms:** envía el email de notificación al propietario + auto-respuesta al visitante
- **Supabase:** inserta el mensaje en la tabla `messages` con estado `nuevo`
- Si Supabase falla, se muestra un warning en consola pero el formulario sigue funcionando (Web3Forms es el canal principal)

---

### 3. Dashboard CRM (`src/pages/dashboard.astro`)

Página completa de administración accesible en `/dashboard` con las siguientes funcionalidades:

#### Autenticación

- Login con email/password mediante `supabase.auth.signInWithPassword()`
- Verificación de sesión existente al cargar con `supabase.auth.getSession()`
- Botón de cerrar sesión con `supabase.auth.signOut()`

#### Panel de estadísticas

- **Total** de mensajes
- **Nuevos** (🟢) — sin leer
- **Leídos** (🔵) — revisados
- **Respondidos** (✅) — con respuesta enviada

#### Tabla de mensajes

- Columnas: Estado, Nombre, Email, Mensaje (truncado), Fecha, Acciones
- Filtro por estado (Todos / Nuevo / Leído / Respondido / Archivado)
- Clic en fila o botón "Ver" abre modal de detalle
- Responsiva: columnas Email y Mensaje se ocultan en móvil

#### Modal de detalle

- Muestra nombre, email, fecha completa y mensaje íntegro
- Botones de acción: Marcar leído, Respondido, Archivar
- Cierre con botón ✕ o clic fuera del modal

#### Seguridad

- `escapeHtml()` para prevenir XSS al renderizar datos de usuarios
- Las políticas RLS de Supabase protegen la lectura/actualización (solo autenticados)
- La inserción es pública (necesaria para el formulario del portfolio)

---

### Configuración necesaria (Supabase)

1. Crear cuenta en [supabase.com](https://supabase.com/)
2. Crear un proyecto nuevo
3. En SQL Editor, ejecutar el esquema SQL documentado arriba
4. En Authentication → Users, crear un usuario administrador
5. Copiar la **URL del proyecto** y la **anon key** desde Settings → API
6. Reemplazar en `src/lib/supabase.ts` y `src/pages/dashboard.astro`:
   ```
   TU_SUPABASE_URL → https://xxxxx.supabase.co
   TU_SUPABASE_ANON_KEY → eyJhbGciOiJI...
   ```

---

### Arquitectura del flujo

```
Visitante envía formulario
        ↓
  ┌─────┴─────┐
  ↓            ↓
Web3Forms    Supabase
(email)      (BD PostgreSQL)
  ↓            ↓
Notificación  Dashboard CRM
+ Auto-resp   /dashboard
```
