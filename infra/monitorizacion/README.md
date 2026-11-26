# Monitorización de las demos

Tres piezas, de la más visible a la más interna:

1. **Portfolio** (`/api/demo-status` + `DemoGuard`): antes de mandar a alguien a una demo, comprueba que responde. Si no, el botón lleva al vídeo de demostración del caso. Ya está en el código; solo necesita las variables de WebWiz y Juegos en Vercel (ver abajo).
2. **Uptime Kuma**: vigila cada demo y su base de datos cada pocos minutos y avisa por Telegram si algo cae. Sus lecturas a Supabase cuentan como actividad, así que también evitan la pausa por inactividad.
3. **Guardián de Supabase** (`supabase-guardian.mjs`): si aun así un proyecto se pausa, lo reanuda con la Management API y avisa por Telegram. Uptime Kuma detecta la caída, pero no puede reanudar el proyecto.

## 1. Variables en Vercel (portfolio)

En el proyecto del portfolio, *Settings → Environment Variables* (Production):

| Variable | Valor |
| --- | --- |
| `WEBWIZ_SUPABASE_URL` | URL del proyecto de WebWiz (`https://<ref>.supabase.co`) |
| `WEBWIZ_SUPABASE_ANON_KEY` | anon key de WebWiz (la misma que ya usa su frontend) |
| `JUEGOS_SUPABASE_URL` | URL del proyecto de la suite de juegos |
| `JUEGOS_SUPABASE_ANON_KEY` | anon key de la suite de juegos |

Sin ellas, los botones de WebWiz y Juegos se quedan como están (no se comprueban). Las demás demos no necesitan nada.

## 2. Uptime Kuma en OrPiRa-Cloud

```bash
sudo mkdir -p /opt/monitorizacion && cd /opt/monitorizacion
# copiar aquí docker-compose.yml, supabase-guardian.mjs y .env (ver punto 3)
docker compose up -d
```

En Nginx Proxy Manager, nuevo *Proxy Host*:

- Dominio: `estado.orpira.es` (crea antes el registro DNS A hacia el servidor)
- Destino: `http://uptime-kuma:3001`, con **Websockets Support** activado
- SSL: Let's Encrypt, *Force SSL*

Al entrar por primera vez, Uptime Kuma pide crear el usuario administrador.

### Aviso por Telegram

*Settings → Notifications → Setup Notification → Telegram*: el token del bot y el chat ID que ya usa el CRM. Márcalo como notificación por defecto para todos los monitores.

### Monitores

Todos de tipo **HTTP(s)**, con «Reintentos» en 2 para no avisar por un fallo puntual.

| Monitor | URL | Intervalo |
| --- | --- | --- |
| Portfolio | `https://orpira.es/` | 5 min |
| Inout (API + BD) | `https://inout.orpira.es/api/salud` | 5 min |
| Las Delicias (API + BD) | `https://api-delicias.orpira.es/health` | 5 min |
| Las Delicias (web) | `https://lasdelicias.orpira.es/` | 5 min |
| WMS (app + BD) | `https://wms.orpira.es/api/salud` | 5 min |
| PRL Master (web) | `https://prl.orpira.es/` | 5 min |
| PRL Master (API de salas) | `https://api-prl.orpira.es/health` | 5 min |
| Private Balance | `https://private-balance.orpira.es/` | 5 min |
| WebWiz (web) | `https://webwiz.orpira.es/` | 5 min |
| Juegos (web) | `https://suite-juegos.orpira.es/juegos` | 5 min |
| WebWiz (Supabase) | `https://<ref>.supabase.co/rest/v1/questions?select=*&limit=1` | 30 min |
| Juegos (Supabase) | `https://<ref>.supabase.co/rest/v1/rooms?select=*&limit=1` | 30 min |

En los dos de Supabase, en *Headers* (JSON):

```json
{ "apikey": "<anon key>", "Authorization": "Bearer <anon key>" }
```

Cada lectura es una consulta real a la base de datos: con una cada 30 minutos, los proyectos nunca llegan a la semana de inactividad.

Opcional: en *Status Pages* puedes crear una página pública con estos monitores.

## 3. Guardián de Supabase

Necesita Node 18 o superior en el servidor. Crea `/opt/monitorizacion/.env`:

```bash
# Token personal: supabase.com → Account → Access Tokens. Solo en el servidor.
SUPABASE_PAT=sbp_...
# ref:tabla:anonKey de cada proyecto, separados por comas
PROYECTOS=<ref-webwiz>:questions:<anon-webwiz>,<ref-juegos>:rooms:<anon-juegos>
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Pruébalo a mano (`node supabase-guardian.mjs`) y después prográmalo cada 12 horas (`crontab -e`):

```cron
0 */12 * * * cd /opt/monitorizacion && node supabase-guardian.mjs >> guardian.log 2>&1
```

Comprueba en la primera ejecución que el estado que devuelve la API para un proyecto activo es `ACTIVE_HEALTHY` (lo muestra el log). El script reanuda los que devuelvan `INACTIVE` o `PAUSED`.
