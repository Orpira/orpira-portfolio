# Guia de Dominios Vercel para la marca Orpira

## Objetivo

Usar `orpira.es` como plataforma de marca y desplegar multiples proyectos sin conflicto de dominio.

Arquitectura inicial:

- `orpira.es` -> landing principal + portfolio (este repositorio Astro)
- `portfolio.orpira.es` -> alias opcional del mismo proyecto
- `lab.orpira.es` -> experimentos
- `api.orpira.es` -> backend y demos

## 1) Configuracion DNS base

Registros minimos recomendados:

1. `A` para raiz
   - Host: `@`
   - Valor: `76.76.21.21`
2. `CNAME` para `www`
   - Host: `www`
   - Valor: `cname.vercel-dns.com`
3. `CNAME` para `portfolio`
   - Host: `portfolio`
   - Valor: `cname.vercel-dns.com`
4. `CNAME` para `lab`
   - Host: `lab`
   - Valor: `cname.vercel-dns.com`
5. `CNAME` para `api`
   - Host: `api`
   - Valor: `cname.vercel-dns.com`

Opcional para escalado rapido:

6. `CNAME` comodin
   - Host: `*`
   - Valor: `cname.vercel-dns.com`

Nota: si usas comodin `*`, los subdominios nuevos pueden resolverse sin crear un CNAME por cada uno, pero igualmente debes asociarlos en el proyecto de Vercel correspondiente.

## 2) Configuracion de proyectos en Vercel

### Proyecto 1: Landing principal

- Dominio principal: `orpira.es`
- Dominio secundario: `www.orpira.es`
- Dominio alias opcional: `portfolio.orpira.es`
- Framework actual: Astro (este repositorio)

### Proyecto 2: Portfolio

- Integrado en el Proyecto 1 (misma aplicacion)

### Proyecto 3: Lab

- Dominio principal: `lab.orpira.es`
- Framework recomendado: Next.js

### Proyecto 4: API / demos

- Dominio principal: `api.orpira.es`
- Framework libre (Next.js, Node, Fastify, Nest o serverless)

## 3) Flujo repetible para nuevos proyectos

1. Crear/importar repositorio en Vercel.
2. Definir subdominio con patron claro, por ejemplo:
   - `app-erp.orpira.es`
   - `app-crm.orpira.es`
   - `lab-rag.orpira.es`
   - `api-auth.orpira.es`
3. Agregar dominio en Settings -> Domains.
4. Confirmar DNS (CNAME especifico o comodin).
5. Verificar estado `Valid Configuration` y SSL emitido.
6. Marcar dominio principal del proyecto y desplegar.

## 4) Arranque recomendado con Next.js

Para laboratorio o nuevas iniciativas:

```bash
npx create-next-app@latest orpira-landing --ts --eslint --app
```

Recomendaciones de stack para posicionamiento de marca:

- Metadata API de Next.js para SEO tecnico
- Open Graph por pagina
- Sitemap y robots
- Analitica (Vercel Analytics / Plausible / GA4)
- Blog tecnico para autoridad de marca

## 5) Checklist de validacion final

1. El dominio aparece en verde en Vercel.
2. HTTPS activo sin advertencias.
3. Redireccion `www` -> `orpira.es` (si asi lo defines).
4. Canonical correcto por proyecto.
5. Cada subdominio apunta al proyecto correcto.
