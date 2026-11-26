# Agente de voz saliente de orpira.es

Cuando alguien escribe en el formulario del portfolio, **deja su teléfono y marca la casilla de llamada**:

1. `/api/contact` guarda el contacto con el teléfono (E.164) y la fecha del consentimiento, y **encola una llamada**.
2. n8n revisa la cola cada 5 minutos y, **solo de lunes a viernes de 9:30 a 20:00** (hora de Madrid), lanza la llamada en Vapi. Una llamada a la vez.
3. El asistente (Claude en Vapi) se presenta como IA de Orlando, avisa de que la llamada se graba y hace como máximo 3 preguntas sobre el mensaje del formulario. Nunca habla de precios ni plazos.
4. Al colgar, Vapi envía el informe a `/api/webhooks/voice`. El CRM guarda el resumen, la transcripción y los datos estructurados, añade una nota al lead, lo pasa de «Por revisar» a «Por avanzar» y te avisa por Telegram.
5. Si no contesta (o salta el buzón), se reintenta 3 horas después, hasta 3 intentos en total.
6. Si la persona dice que no quiere que la llamen, el asistente usa la herramienta `no_llamar`: queda marcado y no se le vuelve a llamar.

**Un solo canal por lead.** Con teléfono y consentimiento, el contacto queda fuera de la respuesta automática por email. Sin teléfono o sin la casilla, todo sigue como antes (agente de email). Los correos manuales desde el CRM siguen funcionando siempre.

```
Formulario ──► /api/contact ──► Supabase (contacts + voice_calls: queued)
                                      │
                 n8n cada 5 min ──► reserve_next_voice_call ──► Vapi POST /call ──► llamada
                                                                                      │
  CRM (nota, etapa, ficha) ◄── record_voice_call ◄── /api/webhooks/voice ◄── informe final
                                                     /api/voice/tools   ◄── no_llamar
```

## Archivos

| Archivo | Qué es |
| --- | --- |
| `14-crm-voice.sql` | Columnas de teléfono y consentimiento en `contacts`, tabla `voice_calls` y sus funciones. Solo `service_role`. |
| `prompt-voz.md` | Instrucciones del asistente de voz. Cámbialas aquí y vuelve a generar. |
| `construir.mjs` | Genera `dist/agente-voz.workflow.json` (n8n) y `dist/asistente-vapi.json` (Vapi). |
| `src/lib/voice-provider.ts` | Lo único específico de Vapi: autenticación y lectura de sus mensajes. |
| `src/pages/api/webhooks/voice.ts` | Informe de fin de llamada → CRM + Telegram. |
| `src/pages/api/voice/tools.ts` | Herramientas durante la llamada (`no_llamar`). |

## Puesta en marcha

Hazlo en este orden. Hasta el paso 6 no se llama a nadie.

### 1. Supabase

En el editor SQL del proyecto, ejecuta `14-crm-voice.sql` completo.

### 2. Número de teléfono

Compra un número geográfico español (944, Bizkaia) en Twilio a tu nombre como particular, con su *Regulatory Bundle* aprobado, y activa las llamadas a España en *Voice Geographic Permissions*. Después, en Vapi: *Phone Numbers → Create Phone Number → Import Twilio*, con el número en formato `+34944…`, el Account SID y el Auth Token. Copia el **ID del número** en Vapi.

Los números gratuitos de Vapi solo reciben llamadas, así que no sirven para esto. Mientras se aprueba el 944, puedes probar con un número de EE. UU. de Twilio (no pide documentación) llamando solo a tu móvil, activando España en los permisos geográficos.

### 3. Secretos

Genera un secreto largo: `openssl rand -hex 32`.

- **Vapi** → *Integrations → Server Configuration → Add Custom Credential*, tipo **Bearer Token**, con ese secreto. Copia el **ID de la credencial**.
- **Vercel** → *Settings → Environment Variables* (Production):
  - `VAPI_WEBHOOK_SECRET` = el mismo secreto
  - `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` = los de tu bot de avisos (opcionales)
  - `VOICE_CALLS_ENABLED` = `true` (muestra el teléfono y la casilla en el formulario). Hace falta volver a desplegar.

### 4. Asistente en Vapi

Desde la raíz del repo:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co \
SITE_URL=https://www.orpira.es \
VAPI_CREDENTIAL_ID=cred_... \
node automatizaciones/agente-voz/construir.mjs
```

Crea el asistente con `dist/asistente-vapi.json`:

```bash
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" -H "Content-Type: application/json" \
  --data @automatizaciones/agente-voz/dist/asistente-vapi.json
```

Si la API rechaza algún campo, crea el asistente en el panel y copia a mano: primer mensaje, prompt de sistema (`prompt-voz.md`), modelo Claude de Anthropic, transcriptor Deepgram en español, la herramienta `no_llamar` con su URL, `end-of-call-report` en *Server Messages*, la URL del servidor y el resumen/datos estructurados de *Analysis*. Elige en el panel una **voz en español de España**.

Copia el **ID del asistente**.

### 5. n8n

Vuelve a generar con los tres ID:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co \
SITE_URL=https://www.orpira.es \
VAPI_CREDENTIAL_ID=cred_... \
VAPI_ASSISTANT_ID=... \
VAPI_PHONE_NUMBER_ID=... \
node automatizaciones/agente-voz/construir.mjs
```

*Workflows → Import from file* → `dist/agente-voz.workflow.json`. Credenciales:

| Nodos | Tipo | Datos |
| --- | --- | --- |
| Reservar llamada, Registrar lanzamiento, Registrar fallo | **Header Auth** | Nombre `apikey`, valor: clave `service_role` (la misma que en los otros flujos) |
| Lanzar llamada en Vapi | **Header Auth** | Nombre `Authorization`, valor: `Bearer TU_API_KEY_PRIVADA_DE_VAPI` |

### 6. Probar y activar

1. Envía el formulario con **tu propio móvil** y la casilla marcada, en horario permitido.
2. Activa el flujo en n8n. En menos de 5 minutos debería sonar.
3. Comprueba en la ficha del lead: bloque **Llamadas** con resumen y transcripción, nota interna y etapa «Por avanzar». Te llega el Telegram.
4. Prueba también: colgar sin contestar (debe quedar para reintento) y decir «no me llames más» (la ficha lo muestra y no vuelve a llamar).

Para pararlo todo: desactiva el flujo en n8n. Para ocultar la opción en la web: `VOICE_CALLS_ENABLED=false` y redespliega.

## Antes de usarlo con leads reales

- **Normativa.** Desde el 17 de octubre de 2026 las llamadas comerciales en España deben salir de números 400, y desde junio de 2025 se bloquean las llamadas que entran del extranjero con número español. Aquí se llama solo a quien lo pide en el formulario, desde un fijo 944 a tu nombre, pero conviene confirmarlo con un asesor.
- **Privacidad.** `privacidad.astro` ya explica la llamada, la grabación y los proveedores (Vapi y Twilio, en EE. UU.). Revisa el texto.
- **Costes.** Vapi cobra por minuto, más el operador y el modelo. Con 7 minutos máximos por llamada y 3 intentos, el gasto por lead está acotado. Pon un límite de gasto en Vapi y deja la recarga automática de Twilio desactivada.
