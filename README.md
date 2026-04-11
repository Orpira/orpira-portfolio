# Portfolio Orlando Pineda Raad

Portfolio personal desarrollado con Astro y Tailwind CSS, desplegado en Vercel y compatible con GitHub Pages.

## 🚀 Tecnologías

- **Astro** - Framework para sitios web estáticos
- **Tailwind CSS** - Framework de CSS utilitario
- **TypeScript** - Superset de JavaScript con tipado estático
- **Vercel** - Hosting y despliegue continuo
- **Next.js** - Stack en expansión para landing principal y laboratorio

## 🌐 Arquitectura de Marca y Dominio

Estructura objetivo recomendada para Orpira:

- `orpira.es` → landing principal + portfolio (este repositorio Astro)
- `portfolio.orpira.es` → alias opcional del mismo proyecto
- `lab.orpira.es` → experimentos y pruebas (ideal para Next.js)
- `api.orpira.es` → backend y demos API

Esta estrategia permite escalar a muchos proyectos con subdominios sin romper el dominio principal.

## 🛠️ Desarrollo Local

### Prerequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/orpira/portfolio-orpira.git
cd portfolio-orpira

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en `http://localhost:4321`

## 📜 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye el sitio para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run astro` - CLI de Astro

## 🚀 Despliegue

### Opción recomendada para este repositorio: Vercel + `orpira.es`

1. Importa el repositorio en Vercel.
2. En el proyecto, ve a **Settings → Domains**.
3. Añade los dominios:
   - `orpira.es`
   - `www.orpira.es`
   - `portfolio.orpira.es` (opcional como alias)
4. En tu proveedor DNS, configura los registros que te indique Vercel.
   - Para raíz (`@`), normalmente un `A` hacia `76.76.21.21`.
   - Para `www`, `portfolio`, `lab`, `api`: normalmente `CNAME` hacia `cname.vercel-dns.com`.
5. Marca `orpira.es` como dominio principal de este proyecto.
6. Re-despliega el proyecto en Vercel para validar certificados SSL y dominio.

Notas:

- Este proyecto detecta automáticamente Vercel (`VERCEL=1`) y usa `base: /`.
- Puedes sobrescribir la URL canónica con `SITE_URL` en variables de entorno de Vercel.

## 🧭 Escalado a muchos proyectos

Para añadir más proyectos, repite este patrón:

1. Crea un nuevo proyecto en Vercel.
2. Asigna un subdominio nuevo (`proyecto-x.orpira.es`).
3. Crea el `CNAME` correspondiente hacia `cname.vercel-dns.com`.
4. Valida SSL en Vercel y publica.

Convención sugerida:

- `app-<nombre>.orpira.es` para productos
- `lab-<nombre>.orpira.es` para experimentos
- `api-<nombre>.orpira.es` para servicios

## ➕ Incorporación de Next.js (inicio)

Siguiente paso recomendado para tu stack:

1. Mantener `orpira.es` en este repositorio Astro como landing+portfolio.
2. Usar Next.js en `lab.orpira.es` para prototipos, pruebas y nuevas iniciativas.
3. Escalar con nuevos subdominios Next.js cuando surjan nuevos productos.

Comando de arranque sugerido para un nuevo proyecto Next.js:

```bash
npx create-next-app@latest orpira-landing --ts --eslint --app
```

### Opción alternativa: GitHub Pages

Si despliegas en GitHub Pages, la base usada será `/orpira-portfolio`.

## 📁 Estructura del Proyecto

```text
/
├── public/          # Archivos estáticos (imágenes, iconos)
├── src/
│   ├── components/  # Componentes reutilizables
│   ├── layouts/     # Layouts de página
│   ├── pages/       # Páginas del sitio
│   └── styles/      # Estilos globales
├── astro.config.mjs # Configuración de Astro
└── tailwind.config.js # Configuración de Tailwind
```

## 🎨 Características

- ✅ Diseño responsive
- ✅ Modo oscuro/claro
- ✅ Navegación suave
- ✅ Optimizado para SEO
- ✅ Menú hamburguesa móvil
- ✅ Habilidades organizadas por categorías
- ✅ Proyectos destacados
- ✅ Información de contacto

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.
