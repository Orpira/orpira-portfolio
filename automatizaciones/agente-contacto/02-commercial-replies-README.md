# Agente comercial: despliegue seguro (sin envíos reales)

Esta fase añade persistencia de borradores a `public.contacts`, sin modificar la rama Telegram ni activar SMTP.

## Estado
- Migración: `02-commercial-replies.sql`, pendiente de ejecutar en Supabase.
- Workflow n8n: la exportación preparada se mantiene **inactiva** y debe importarse como copia, no reemplazar el workflow activo.
- **No hay envíos de correo implementados ni autorizados.**

## Antes de ejecutar
1. Verificar que `public.contacts.processing_status` toma el valor `completed` tras `complete_contact_ai`. Si no, adaptar la condición de la función antes de aplicarla.
2. Ejecutar el SQL con una cuenta administradora en Supabase.
3. Reasociar las credenciales existentes en n8n; no almacenar secretos en JSON.
4. Probar `create_commercial_reply_draft` únicamente con un contacto de prueba ya clasificado. Repetir la llamada y comprobar que no genera duplicados.
5. Implementar un estado transaccional de envío por contacto, persistencia de resultados SMTP, bloqueo de reintentos ambiguos y la vista de comunicaciones del CRM.
6. Solicitar aprobación expresa antes de habilitar SMTP o activar envío automático.

**Criterio de aceptación:** una clasificación genera un único borrador, nunca un envío; el CRM podrá mostrar estados reales solo cuando esté implementada la lectura del historial.

## Editor del CRM y conexión con n8n

- En el flujo de captación, el paso que completa la clasificación debe llamar a
  `complete_contact_ai_with_draft` con los mismos argumentos de
  `complete_contact_ai` y el texto generado en `p_body`. La función guarda
  clasificación y borrador juntos. Conserva la rama de notificaciones existente.
- La ficha consulta `commercial_replies` por el ID del lead. Si todavía no hay
  borrador, se puede redactar y guardar uno desde el CRM.
- Tras aplicar `05-crm-reply-editor.sql`, el editor puede guardar borradores.
  El flujo de entrega es independiente de la captación. Importa
  `entrega-comercial-manual.workflow.json` y asigna las credenciales de Supabase,
  iCloud y autenticación por cabecera `X-Webhook-Secret`.
- Configura `CRM_REPLY_WEBHOOK_URL` con la URL HTTPS de producción de ese
  webhook y `CRM_REPLY_WEBHOOK_SECRET` con el mismo valor de la credencial
  de cabecera. Mantén `CRM_REPLY_SEND_ENABLED=false` y el bloqueo interno
  del workflow hasta contar con autorización expresa para habilitar la entrega.
- Una solicitud manual aprueba la versión visible de la respuesta. Supabase
  reserva una sola entrega por lead. Si el resultado SMTP queda incierto, la ficha
  conserva el estado para revisión y bloquea nuevos envíos de esa respuesta.

## Respuesta automática

Importa `entrega-comercial-automatica.workflow.json` como un flujo separado.
Vincula las credenciales de Supabase y SMTP iCloud y aplica
`06-automatic-reply-reservation.sql` antes de publicarlo. En
**Bloqueo de envío**, indica en `enabledSince` la fecha y hora ISO 8601 de la
activación. El valor vacío detiene los envíos. Esta modalidad funciona desde
n8n y no requiere un webhook de Vercel.

Cada cinco minutos se reserva hasta un borrador de un contacto nuevo del
portfolio. Los borradores ya aprobados manualmente, los contactos anteriores
a la activación y los dominios de ejemplo quedan fuera. La reserva es atómica
y limita a un intento por destinatario en 24 horas. Un resultado incierto puede
revisarse en el CRM antes de cualquier seguimiento. Para detener la tarea,
despublica el flujo en n8n.
