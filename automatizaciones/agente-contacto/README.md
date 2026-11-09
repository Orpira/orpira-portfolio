# Agente de contacto de orpira.es

Cuando alguien escribe en el formulario del portfolio:

1. Te llega un **WhatsApp** con el nombre, el email y el mensaje (CallMeBot).
2. Un asistente con **Claude** redacta un email para el contacto: se presenta como tu asistente y le hace hasta 3 preguntas sobre lo que quiere construir.
3. Te llega otro WhatsApp con un **enlace para revisar el borrador**. Lo puedes editar y después **enviarlo** desde tu iCloud o **descartarlo**. No sale nada sin tu aprobación.
4. Cuando el contacto responde a ese email, n8n lo detecta por la etiqueta del asunto (`[OrPiRa #a1b2c3]`) y vuelve al paso 3 con la nueva respuesta.
5. Cuando el asistente tiene lo esencial (o tras 3 mensajes suyos), redacta un **cierre** («Orlando te escribirá para la llamada») y un **resumen para la llamada**: qué quiere, para quién, cómo lo resuelve hoy, qué es imprescindible, plazos y preguntas que conviene hacerle.

El asistente nunca habla de precios ni compromete fechas. Si el borrador menciona precio o presupuesto, el WhatsApp te avisa. El spam se marca como descartado y no recibe respuesta.

```
Formulario ──► n8n ──► Supabase (leads) ──► Claude ──► borrador ──► WhatsApp con enlace
                ▲                                                        │
                │                                          tú: Enviar / Editar / Descartar
                │                                                        ▼
        IMAP iCloud ◄──────────── respuesta del contacto ◄──── email desde iCloud
```

## Archivos

| Archivo | Qué es |
| --- | --- |
| `01-esquema.sql` | Tablas `leads` y `lead_messages` y sus funciones. Solo las puede usar la clave `service_role`. |
| `prompt-sistema.md` | Instrucciones del asistente. Cámbialas aquí y vuelve a generar el workflow. |
| `nodos/*.js` | Código de los nodos Code de n8n. |
| `construir.mjs` | Monta `dist/agente-contacto.workflow.json` con tus datos. |

## Puesta en marcha

### 1. Supabase

En el editor SQL del proyecto del portfolio, ejecuta `01-esquema.sql` completo.

### 2. CallMeBot (WhatsApp)

Sigue las instrucciones de [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/): envías un mensaje desde tu WhatsApp a su número y te devuelven tu `apikey`.

### 3. iCloud

En [account.apple.com](https://account.apple.com) → *Inicio de sesión y seguridad* → *Contraseñas de apps*, crea una contraseña para n8n. Es la que usan las dos credenciales de correo (nunca tu contraseña de Apple).

### 4. Generar el workflow

Desde la raíz del repo:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co \
N8N_URL=https://TU-N8N \
WHATSAPP=+34XXXXXXXXX \
REMITENTE=orpira@icloud.com \
node automatizaciones/agente-contacto/construir.mjs
```

`N8N_URL` es la dirección pública de tu n8n, sin barra final. Los enlaces de revisión apuntan ahí.

### 5. Importar en n8n y crear las credenciales

*Workflows → Import from file* → `automatizaciones/agente-contacto/dist/agente-contacto.workflow.json`.

Abre cada nodo marcado en rojo y elige o crea su credencial:

| Nodos | Tipo de credencial | Datos |
| --- | --- | --- |
| Crear lead, Registrar respuesta, Historial, Guardar borrador, Ver borrador, Decidir borrador, Confirmar envío | **Supabase API** | Host del proyecto y clave `service_role` |
| Claude: redactar | **Anthropic** | Tu API key de Claude |
| WhatsApp: … (3 nodos) | **Query Auth** | Nombre `apikey`, valor: la apikey de CallMeBot |
| Contacto: formulario | **Header Auth** | Nombre `X-Webhook-Secret`, valor: un secreto largo (`openssl rand -hex 32`) |
| Enviar email (iCloud) | **SMTP** | `smtp.mail.me.com`, puerto 587, SSL/TLS desactivado (usa STARTTLS), usuario `orpira@icloud.com`, contraseña de app |
| Respuestas: iCloud | **IMAP** | `imap.mail.me.com`, puerto 993, SSL/TLS activado, mismo usuario y contraseña de app |

Activa el workflow.

### 6. Vercel

En el proyecto del portfolio → *Settings → Environment Variables* (Production):

- `CONTACT_WEBHOOK_URL` = `https://TU-N8N/webhook/orpira-contacto`
- `CONTACT_WEBHOOK_SECRET` = el mismo secreto de la credencial Header Auth

Vuelve a desplegar.

### 7. Probar

Envía el formulario con un email tuyo distinto del de iCloud. En unos segundos deberían llegarte los dos WhatsApp. Abre el enlace, envía el borrador y respóndelo desde ese email: tiene que llegarte un borrador nuevo.

## Notas

- **Privacidad.** El workflow no guarda en n8n las ejecuciones que terminan bien, para no duplicar datos personales. Si necesitas depurar, actívalo en *Workflow settings → Save successful executions*. La política de privacidad del portfolio explica el uso de IA, Anthropic e iCloud.
- **Enlaces de revisión.** Son de un solo uso. Al abrirlos solo se ve el borrador: enviar o descartar exige pulsar un botón, así que la vista previa de enlaces de WhatsApp no puede aprobar nada.
- **Respuestas.** Solo se aceptan si llevan la etiqueta en el asunto y llegan desde el mismo email que escribió en el formulario.
- **Pasar a automático.** Cuando te fíes del asistente, se puede añadir un atajo que envíe directamente los borradores sin avisos (los de tipo `preguntar`) y te deje revisar solo los cierres.
