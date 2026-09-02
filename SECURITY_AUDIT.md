# Auditoria de seguridad de OrPiRa Portfolio

Fecha: 26 de agosto de 2026  
Objetivo: `https://orpira.es` y repositorio `OrPiRa-portfolio`  
Tipo: revision defensiva de caja blanca y comprobacion pasiva del despliegue

## Resumen ejecutivo

La postura de seguridad actual se clasifica como **critica**. No se encontro evidencia de que el sitio ya haya sido comprometido, pero existen controles insuficientes que permiten comprometer la confidencialidad e integridad sin tecnicas avanzadas.

Los riesgos principales son:

| ID | Severidad | Hallazgo | Estado observado |
| --- | --- | --- | --- |
| SEC-01 | Critica | Paginas del CRM exponen datos sin autenticacion | Confirmado en codigo y produccion |
| SEC-02 | Critica | La cookie administrativa es falsificable | Confirmado en codigo |
| SEC-03 | Critica | API financiera permite escritura y borrado global anonimos | Confirmado en codigo; no explotado en produccion |
| SEC-04 | Alta | Formulario y webhook expuestos a spam y agotamiento | Confirmado en codigo |
| SEC-05 | Alta | Login sin proteccion contra fuerza bruta ni MFA | Confirmado en codigo |
| SEC-06 | Alta | 20 alertas de dependencias, incluida 1 critica | Confirmado con `npm audit` |
| SEC-07 | Alta | Paginas con datos personales permiten cache compartida | Confirmado en produccion |
| SEC-08 | Alta | RLS y permisos de `contacts` no estan versionados | No verificable desde el repositorio |
| SEC-09 | Media | Faltan CSP y cabeceras defensivas | Confirmado en produccion |
| SEC-10 | Media | Validacion y limites insuficientes en contacto | Confirmado en codigo |
| SEC-11 | Media | Errores internos de base de datos llegan al cliente | Confirmado en codigo |
| SEC-12 | Media | Gestion de datos personales sin controles documentados | Confirmado en el repositorio |
| SEC-13 | Media | Riesgo de versionar secretos por patrones de despliegue | Confirmado en configuracion |
| SEC-14 | Baja | Logout mediante GET | Confirmado en codigo |
| SEC-15 | Baja | `security.txt`, `robots.txt` y sitemap ausentes | Confirmado en produccion |

Prioridad inmediata: cerrar el acceso al CRM, reemplazar la sesion falsificable y deshabilitar el borrado global de la demo financiera antes del siguiente despliegue normal.

## Estado de remediacion

El 26 de agosto de 2026 se implementaron en el repositorio las correcciones de
los hallazgos criticos:

| ID | Correccion implementada | Estado |
| --- | --- | --- |
| SEC-01 | Middleware central para todas las rutas privadas del CRM | Pendiente de despliegue |
| SEC-02 | Cookie HMAC con expiracion, nonce y secreto independiente | Pendiente de configurar `ADMIN_SESSION_SECRET` y desplegar |
| SEC-03 | Endpoint privilegiado eliminado; demo aislada en `localStorage` | Pendiente de despliegue y ejecucion del SQL de revocacion |
| SEC-06 | Astro actualizado; `tar` y `path-to-regexp` corregidos mediante overrides | Cero alertas criticas y altas; queda 1 baja (`esbuild`, solo dev en Windows) |
| SEC-09 | CSP, anti-clickjacking, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y COOP en middleware | Pendiente de despliegue; CSP usa `'unsafe-inline'` hasta migrar a nonces |
| SEC-10 | Validacion estricta, limite de cuerpo, honeypot funcional y rate limit por instancia en `/api/contact` | Pendiente de despliegue; rate limit distribuido requiere almacen compartido |
| SEC-11 | Errores genericos con identificador de correlacion; webhook con timeout y verificacion de estado | Pendiente de despliegue |
| SEC-12 | Pagina `/privacidad`, consentimiento en el formulario y minimizacion de columnas del CRM | Pendiente de despliegue; revisar DPA de proveedores |
| SEC-13 | `.gitignore` cubre `.env*` y archivos de clave (`*.pem`, `*.key`, `*.p12`, `*.pfx`) | Mitigado; secret scanning en CI pendiente |

Las pruebas locales confirman redireccion `303` para rutas privadas anonimas y
cookies antiguas, acceso `200` con una sesion firmada valida, cabeceras
`private, no-store` y respuesta `404` para `/api/finance-demo`. Produccion sigue
siendo vulnerable hasta desplegar estos cambios y aplicar
`supabase/finance_movements.sql`.

## Segunda auditoria (26 de agosto de 2026)

Re-auditoria completa tras implementar las correcciones criticas, altas y
medias. Mismo metodo: revision de caja blanca del codigo, comprobacion pasiva
de produccion y auditoria de dependencias.

### Verificacion de correcciones anteriores

| ID | Resultado |
| --- | --- |
| SEC-01 | OK. Middleware cubre `/dashboard/**`; sin rutas privilegiadas fuera de ese arbol |
| SEC-02 | OK. HMAC-SHA256 con nonce y expiracion, fail-closed, comparacion en tiempo constante |
| SEC-03 | OK. Sin endpoints de escritura; demo 100% `localStorage`; sinks `innerHTML` escapados |
| SEC-06 | OK. Astro 7.2.7, overrides efectivos; `npm audit`: 1 baja unica (`esbuild`, dev/Windows) |
| SEC-09 | OK. Cabeceras presentes en todas las respuestas SSR (verificado) |
| SEC-10 | OK. Validacion, limite 16 KB, honeypot y rate limit verificados con peticiones reales |
| SEC-11 | OK. Errores genericos con `correlationId`; logs estructurados sin PII |
| SEC-12 | OK. Politica publicada, consentimiento exigido, minimizacion de columnas |
| SEC-13 | OK. Sin secretos en codigo, historial ni artefactos |

### Estado de produccion

Produccion NO ha cambiado: sigue en el estado vulnerable de la primera
auditoria porque las correcciones no se han desplegado. Verificacion pasiva:

- `/dashboard` y `/dashboard/clientes` responden `200` anonimos (critico).
- Sin CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` ni COOP.
- `/dashboard/clientes` sigue enviando `Cache-Control: public`.
- `/api/contact` y `/api/finance-demo` responden `404` (superficie reducida).
- `/privacidad` responde `404` (pendiente de desplegar).
- TLS, redirecciones y HSTS correctos; certificado valido hasta 2026-11-06.

### Hallazgos nuevos de la re-auditoria

| ID | Severidad | Descripcion | Estado |
| --- | --- | --- | --- |
| N-1 | Media-Alta | IP tomada del primer valor de `X-Forwarded-For`, controlado por el cliente: evadia el rate limit | Corregido: `x-real-ip` o ultimo valor de XFF |
| N-2 | Media | `ADMIN_PASSWORD` vacia permitia login sin contrasena | Corregido: fail-closed, minimo 12 caracteres |
| N-3 | Media | Login sin proteccion contra fuerza bruta (SEC-05 residual) | Mitigado: rate limit 5 intentos/15 min por IP; MFA pendiente |
| N-4 | Media | Autorizacion sobre `pathname` sin normalizar (variantes codificadas) | Corregido: normalizacion + guardas de sesion en cada pagina del CRM |
| N-5 | Baja | Comparacion de contrasena no constante en tiempo | Corregido: `timingSafeEqual` sobre SHA-256 |
| N-6 | Baja | Error crudo de Supabase en logs del CRM | Corregido: log estructurado con codigo |
| N-7 | Media-Baja | El consentimiento RGPD no se enviaba ni registraba | Corregido en codigo: exigido por el servidor y enviado por el cliente; persistencia opcional via `supabase/contacts_consent.sql` |
| N-8 | Baja | `git add .` en scripts de despliegue | Pendiente: mitigado por `.gitignore`; usar adds selectivos |
| N-9 | Baja | `request.text()` bufferiza el cuerpo antes de medir | Pendiente: aceptable con el limite de Vercel |
| N-10 | Baja | Workflow `.github/workflows/deploy.yml` publica a GitHub Pages en paralelo (Node 20, sin env): version rota y duplicada | Pendiente de decision: eliminar o alinear |
| N-11 | Info | 16 archivos modificados y 6 nuevos sin commit: produccion sigue expuesta | Pendiente: commit, despliegue y SQL |
| N-12 | Info | Mensaje obsoleto "Demo conectada a Supabase" | Corregido |

### Pruebas ejecutadas en la re-auditoria

- Build con 0 errores; `npm audit`: 0 criticas, 0 altas, 0 moderadas, 1 baja.
- Login: 5 intentos fallidos -> sexto bloqueado (`error=2`); contrasena corta
  impide el arranque; sesion valida da `200` en leads y clientes.
- Ruta `/Dashboard/clientes` con mayusculas: sin bypass (cookie no aplicable y
  middleware redirige).
- Contacto: `400` sin consentimiento, `400` con email o mensaje invalido,
  `413` con cuerpo grande, `429` al superar 8/min, `500` generico con
  `correlationId` si la base de datos no responde, honeypot devuelve exito sin
  insertar.
- Cabeceras de seguridad presentes en `/`, `/dashboard` y respuestas de API.

### Riesgo global tras la re-auditoria

- Codigo del repositorio: **Bajo-Medio** (antes Critico). Pendientes de mejora:
  MFA para el admin, rate limit distribuido, CSP con nonces y persistencia del
  consentimiento.
- Produccion `orpira.es`: sigue **Critico** hasta desplegar. La correccion esta
  en el repositorio, no en el sitio.

## Alcance y metodologia

Se revisaron rutas Astro, endpoints API, acceso a Supabase, autenticacion, cookies, validacion, renderizado, configuracion de despliegue, dependencias, historial Git y tratamiento de datos.

Sobre produccion solo se realizaron solicitudes puntuales `GET`, `HEAD` y `OPTIONS`, inspeccion TLS/DNS y lectura de cabeceras y recursos publicos. No se enviaron formularios, credenciales o cookies fabricadas; tampoco se ejecutaron operaciones `POST`, `DELETE`, fuerza bruta, enumeracion agresiva ni explotacion.

Por estas limitaciones, el informe no certifica ausencia de vulnerabilidades ni demuestra que no haya ocurrido una intrusion. Para determinar compromiso historico deben revisarse logs de Vercel, Supabase y del proveedor del webhook.

## Hallazgos detallados

### SEC-01: acceso anonimo a datos personales del CRM

**Severidad:** Critica  
**Impacto:** confidencialidad de nombres, correos, mensajes y clasificacion comercial.

`src/pages/dashboard/clientes.astro:5-11` consulta `contacts` con `supabaseAdmin` sin comprobar sesion. La pagina muestra nombre y correo en `src/pages/dashboard/clientes.astro:72-91`. `src/pages/dashboard/lead/[id].astro:5-11` tambien consulta un lead sin autenticar y muestra correo y mensaje en las lineas 48-100.

La comprobacion pasiva confirma que `https://www.orpira.es/dashboard/clientes` responde `200` a un visitante anonimo y envia:

```http
HTTP/2 200
content-type: text/html
cache-control: public, max-age=0, must-revalidate
```

No se descargo el cuerpo para evitar tratar datos personales durante la auditoria.

**Correccion:** proteger centralmente todas las rutas `/dashboard/**` mediante middleware y una sesion verificable. Mantener comprobaciones explicitas en loaders sensibles como defensa adicional. Hasta desplegar la solucion, retirar o bloquear en Vercel `/dashboard/clientes` y `/dashboard/lead/*`.

**Respuesta operativa:** revisar accesos historicos a esas rutas y evaluar una posible brecha de datos conforme al RGPD. La exposicion tecnica no prueba que terceros hayan accedido.

### SEC-02: autenticacion administrativa falsificable

**Severidad:** Critica  
**Impacto:** acceso administrativo sin conocer la contrasena.

`src/pages/dashboard/login.ts:20-29` guarda el valor estatico `true` en `crm_auth`. `src/pages/dashboard/leads.astro:6-15` acepta ese mismo valor como unica prueba de autenticacion. Los atributos `HttpOnly`, `Secure` y `SameSite=Strict` son correctos, pero no aportan integridad al valor.

**Correccion:** usar Supabase Auth o un proveedor de identidad con MFA y rol administrativo. Como alternativa minima, emitir identificadores aleatorios de sesion guardados en servidor, con expiracion, rotacion y revocacion. No derivar la autorizacion de un booleano controlado por el cliente. Invalidar la cookie actual al desplegar.

### SEC-03: operaciones financieras publicas con privilegios de servicio

**Severidad:** Critica  
**Impacto:** destruccion de datos, insercion masiva, abuso de cuota y contenido persistente.

`src/pages/api/finance-demo.ts:49-103` permite insertar sin identidad. `src/pages/api/finance-demo.ts:126-145` permite borrar un registro o toda la tabla con `all: true`. Ambas operaciones usan `SUPABASE_SERVICE_ROLE_KEY`, que evita RLS. La interfaz publica invoca el borrado global en `src/pages/projects/finance-app.astro:402-423`.

No se ejecuto `POST` ni `DELETE` contra produccion. Un `GET` pasivo devuelve `404`, lo cual no demuestra que los metodos destructivos esten deshabilitados.

**Correccion:** eliminar de inmediato el borrado global publico. Aislar los datos por una sesion anonima firmada y permitir que cada sesion modifique solo sus filas. Aplicar RLS o una RPC de privilegios minimos, caducidad automatica, cuota y rate limiting distribuido. Reservar cualquier operacion global para administradores autenticados.

### SEC-04: abuso del formulario y webhook

**Severidad:** Alta  
**Impacto:** spam, costes, agotamiento de funciones y contaminacion del CRM.

`src/pages/api/contact.ts:23-58` inserta y llama al webhook sin CAPTCHA, rate limiting, cuota o deduplicacion. El honeypot de `src/components/ContactSection.astro:26-29` no se envia al servidor en las lineas 119-132, por lo que no tiene efecto.

**Correccion:** validar Turnstile o hCaptcha en servidor, limitar por IP y huella con un almacen compartido, limitar globalmente, deduplicar y aplicar un honeypot real solo como medida complementaria. Definir timeout del webhook y controlar `response.ok`.

### SEC-05: login expuesto a fuerza bruta

**Severidad:** Alta  
**Impacto:** toma de la cuenta administrativa si la contrasena es reutilizada, debil o filtrada.

`src/pages/dashboard/login.ts:3-38` no implementa rate limiting, retraso progresivo, bloqueo temporal, alertas o MFA. La respuesta permite distinguir exito y fallo mediante la redireccion.

**Correccion:** MFA mediante proveedor de identidad. Anadir rate limiting distribuido por IP y cuenta, backoff, alertas y registro de intentos sin almacenar la contrasena.

### SEC-06: dependencias vulnerables y cadena de suministro innecesaria

**Severidad:** Alta  
**Impacto:** SSRF/XSS/DoS segun el componente y su uso; aumento innecesario de superficie de suministro.

`npm audit` informa 20 paquetes vulnerables: 1 critico, 14 altos, 4 moderados y 1 bajo. Entre los avisos relevantes aparecen:

| Componente | Riesgo destacado |
| --- | --- |
| `astro@6.4.4` | SSRF por cabecera Host y varios XSS |
| `@astrojs/vercel@10.0.8` | override de ruta ISR no autenticado |
| `tar` transitivo | DoS critico al procesar archivos preparados |
| `path-to-regexp` transitivo | ReDoS |
| `sharp` transitivo | vulnerabilidades heredadas de libvips |
| `postcss` transitivo | lectura de source maps por path traversal |
| `fix@0.0.6` | arrastra versiones antiguas de `underscore` |

No todas las alertas son explotables por las rutas actuales. La de Astro es especialmente pertinente al tratarse de una aplicacion SSR.

Los paquetes directos `audit` y `fix` no se importan desde `src` y deben eliminarse. `fix` introduce dependencias antiguas vulnerables.

**Correccion:** eliminar `audit` y `fix`, actualizar Astro y `@astrojs/vercel` a versiones corregidas compatibles, regenerar el lockfile y repetir compilacion, pruebas y auditoria. No aplicar ciegamente cambios mayores en produccion.

### SEC-07: cache publica de contenido sensible

**Severidad:** Alta  
**Impacto:** almacenamiento de datos personales en caches compartidas.

`/dashboard/clientes` envia `Cache-Control: public, max-age=0, must-revalidate` y no envia `Vary: Cookie`.

**Correccion:** enviar `Cache-Control: private, no-store` y `Vary: Cookie` en login, redirecciones y todas las rutas CRM.

### SEC-08: RLS de contactos no verificable

**Severidad:** Alta  
**Impacto:** lectura o modificacion directa de contactos mediante la API publica de Supabase si RLS o grants estan mal configurados.

El repositorio contiene `supabase/finance_movements.sql`, pero ninguna migracion para `contacts`. Las consultas internas usan `service_role`, por lo que el funcionamiento de la app no valida las politicas anonimas.

**Correccion:** versionar tabla, constraints, grants y politicas de `contacts`; habilitar y forzar RLS; revocar acceso de `anon` y `authenticated` salvo operaciones estrictamente necesarias. Probar desde CI que un cliente anonimo no puede seleccionar, actualizar ni borrar contactos.

### SEC-09: cabeceras defensivas ausentes

**Severidad:** Media  
**Impacto:** clickjacking y mayor impacto de una futura inyeccion de contenido.

No se observaron `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ni `Cross-Origin-Opener-Policy`.

**Correccion inicial:** definir `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y deshabilitar camara, microfono y geolocalizacion. La CSP completa debe permitir explicitamente Google Fonts y gestionar los scripts inline mediante nonce o hash antes de activarse.

HSTS si esta presente con `max-age=63072000`. Solo debe anadirse `includeSubDomains; preload` tras comprobar todos los subdominios.

### SEC-10: validacion insuficiente en contacto

**Severidad:** Media  
**Impacto:** payloads excesivos, datos invalidos, fallos y crecimiento no controlado.

`src/pages/api/contact.ts:23-36` no valida tipos, formato de correo, longitudes ni propiedades. Tampoco limita `Content-Length` antes de analizar JSON.

**Correccion:** esquema estricto en servidor, normalizacion, longitudes maximas, correo valido, rechazo de campos desconocidos y limite de cuerpo. Repetir invariantes mediante constraints SQL.

### SEC-11: divulgacion de errores internos

**Severidad:** Media  
**Impacto:** revelacion de nombres de tablas, columnas y constraints.

`src/pages/api/contact.ts:68-80` y `src/pages/api/finance-demo.ts:113-122,154-163` devuelven `error.message` al cliente.

**Correccion:** devolver mensajes genericos y un identificador de correlacion. Registrar eventos estructurados y redactados, sin payloads, correos, tokens ni respuestas completas del webhook.

### SEC-12: privacidad y retencion no documentadas

**Severidad:** Media  
**Impacto:** mayor efecto de una brecha y riesgo de incumplimiento RGPD.

El formulario recoge nombre, correo y mensaje y puede transferirlos a un webhook, pero no se encontro aviso de privacidad, finalidad, base juridica, plazo de conservacion, destinatarios o procedimiento de derechos.

**Correccion:** publicar aviso de privacidad, minimizar columnas, fijar retencion y borrado/anonimizacion, documentar proveedores y regiones, y revisar acuerdos de tratamiento.

### SEC-13: riesgo de inclusion accidental de secretos

**Severidad:** Media  
**Impacto:** publicacion de claves administrativas o webhooks.

`.gitignore:16-18` solo excluye `.env` y `.env.production`, no variantes habituales como `.env.local`. `deploy.sh:13-17` y el script `deploy-quick` ejecutan `git add .`.

No se encontraron archivos de secretos versionados ni valores de `service_role`, contrasena administrativa o webhook en el historial analizado. La clave anon de Supabase es publica por diseno y solo es segura con RLS correcto.

**Correccion:** ignorar `.env*` y permitir solo `!.env.example`; retirar `git add .` de scripts; activar secret scanning en pre-commit, CI y repositorio remoto.

### SEC-14: logout mediante GET

**Severidad:** Baja  
**Impacto:** cierre de sesion inducido desde otro sitio.

`src/pages/dashboard/logout.ts` elimina la cookie mediante `GET`.

**Correccion:** usar `POST`, comprobar `Origin` y un token CSRF, y revocar la sesion del lado servidor.

### SEC-15: archivos publicos de descubrimiento ausentes

**Severidad:** Baja  
**Impacto:** dificulta la notificacion responsable; `robots.txt` y sitemap afectan principalmente a SEO.

`/robots.txt`, `/sitemap.xml`, `/.well-known/security.txt` y `/security.txt` responden `404`.

**Correccion:** publicar `/.well-known/security.txt` con contacto, vencimiento, idiomas y politica. Anadir robots y sitemap segun necesidades SEO.

## Controles correctos observados

- HTTPS se fuerza y el trafico termina en el host `www`.
- TLS 1.0 y 1.1 estan rechazados; TLS 1.2 y 1.3 funcionan.
- El certificado observado es valido para `orpira.es` y `*.orpira.es`.
- HSTS esta activo durante dos anos.
- No se observaron permisos CORS abiertos en HTML o APIs; `Access-Control-Allow-Origin: *` se limita a assets publicos.
- No se encontraron source maps publicos para el CSS enlazado.
- Los errores 404 no muestran stack traces ni variables de entorno.
- La cookie actual usa `HttpOnly`, `Secure` y `SameSite=Strict`, aunque su valor no es seguro.
- El renderizado Astro escapa los datos del CRM por defecto.
- La demo financiera aplica `escapeHtml` antes de insertar datos remotos mediante `innerHTML`.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo se referencia del lado servidor en el codigo revisado.
- La tabla financiera habilita RLS y solo declara lectura para `anon`; el problema de escritura procede del endpoint privilegiado.

## Infraestructura y TLS

El dominio usa DNS de Vercel. Se observaron registros CAA para Let's Encrypt, Sectigo y Google Trust Services. No se observo un registro DS, por lo que DNSSEC no parece estar publicado. Tampoco se observo AAAA durante la prueba; esto no es una vulnerabilidad por si mismo.

Redirecciones observadas:

```text
http://orpira.es/      -> 308 https://orpira.es/
https://orpira.es/     -> 307 https://www.orpira.es/
http://www.orpira.es/  -> 308 https://www.orpira.es/
https://www.orpira.es/ -> 200
```

La configuracion `site` y canonical usa `https://orpira.es`, mientras produccion termina en `https://www.orpira.es`. Conviene alinearlos; es un problema de consistencia/SEO, no una vulnerabilidad directa.

## Plan de remediacion

### Inmediato: 0 a 24 horas

1. Bloquear temporalmente `/dashboard/clientes` y `/dashboard/lead/*`.
2. Deshabilitar `DELETE` global y, si no puede aislarse por sesion, toda escritura de `/api/finance-demo`.
3. Sustituir `crm_auth=true` por sesiones verificables e invalidar la cookie anterior.
4. Aplicar `private, no-store` a todo el CRM.
5. Revisar logs de acceso a rutas CRM y operaciones financieras; conservar evidencia.
6. Evaluar con asesoramiento adecuado si la exposicion constituye una brecha RGPD notificable.

### Corto plazo: 1 a 7 dias

1. Migrar el administrador a autenticacion con MFA.
2. Versionar y probar RLS de `contacts`.
3. Anadir validacion, limites, CAPTCHA y rate limiting distribuido a contacto.
4. Actualizar dependencias y retirar `audit` y `fix`.
5. Anadir CSP y cabeceras defensivas, probandolas primero en modo `Report-Only`.
6. Corregir errores expuestos, webhook sin timeout y logs sensibles.

### Medio plazo: 7 a 30 dias

1. Integrar pruebas de autorizacion, RLS, CSRF, validacion, payloads grandes y abuso.
2. Integrar `npm audit`, secret scanning y comprobacion de cabeceras en CI.
3. Definir retencion, privacidad, backups, restauracion y respuesta a incidentes.
4. Publicar `security.txt` y establecer un canal de reporte.
5. Considerar WAF/rate limiting en el borde y alertas sobre patrones anormales.

## Pruebas de cierre requeridas

La auditoria debe repetirse despues de corregir. Como minimo, la validacion de cierre debe demostrar:

- Toda ruta `/dashboard/**` rechaza solicitudes sin sesion, con sesion falsa, expirada o revocada.
- No existe una operacion publica que borre datos globales.
- Cada usuario o sesion demo solo puede modificar sus propios datos.
- `anon` no puede leer, actualizar ni borrar `contacts` directamente en Supabase.
- Login y APIs aplican limites efectivos desde varias instancias.
- Payloads invalidos o grandes reciben `400`, `413` o `429` sin revelar errores internos.
- Las paginas CRM envian `private, no-store` y no pueden incluirse en iframes.
- La CSP no rompe la web y bloquea origenes no autorizados.
- `npm audit` no mantiene vulnerabilidades criticas o altas aplicables al runtime.
- Los bundles, repositorio e historial no contienen secretos administrativos.

## Conclusion

El sitio publico, TLS y la exposicion de assets presentan una base razonable. El principal riesgo no esta en la pagina de portfolio, sino en las funciones SSR anadidas: CRM, sesion administrativa, contacto y demo financiera. Mientras SEC-01, SEC-02 y SEC-03 permanezcan abiertos, debe asumirse que la confidencialidad del CRM y la integridad de la demo no estan protegidas adecuadamente.
