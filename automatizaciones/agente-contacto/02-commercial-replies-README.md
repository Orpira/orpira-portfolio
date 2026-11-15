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
- Tras aplicar `05-crm-reply-editor.sql` y `07-crm-manual-queue.sql`, el CRM
  puede guardar y poner en cola un correo. El flujo programado reserva primero
  las solicitudes manuales. El CRM valida la dirección contra el contacto
  guardado y conserva la hora de solicitud, la reserva y el resultado SMTP.

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

## Reservas con Cal.com Cloud

1. En Cal.com, instala la integración Apple Calendar. Conecta iCloud con tu
   cuenta de Apple y una contraseña específica de aplicación dedicada. Selecciona
   el calendario de conflictos y el calendario donde se guardarán las reuniones.
2. Crea un evento individual y verifica en Cal.com que una franja ocupada no
   se ofrezca y que puedas reservar una franja libre. Selecciona una ubicación
   que entregue un enlace HTTPS, si la reunión será por vídeo.
3. Aplica `10-crm-calcom.sql` antes del despliegue. Configura el secreto
   `CALCOM_WEBHOOK_SECRET` en Vercel y en el webhook del evento en Cal.com.
   Usa el payload predeterminado, `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED` y la URL
   `https://www.orpira.es/api/webhooks/calcom`.
4. Prueba con un contacto de tu propiedad y comprueba en su ficha la reserva,
   la hora y el enlace. La reserva se identifica por el UID de Cal.com y se
   vincula por el correo del primer asistente. Si hay varios contactos del mismo
   correo, se prioriza el registro abierto más reciente.
5. Una vez verificado, en Supabase asigna la URL pública del evento a la fila
   única de `crm_booking_settings`. Ejemplo, sustituye usuario y evento:

   ```sql
   insert into public.crm_booking_settings(singleton, booking_url)
   values (true, 'https://cal.com/usuario/evento')
   on conflict (singleton) do update set booking_url = excluded.booking_url;
   ```

   Un valor nulo desactiva el enlace en los siguientes correos automáticos.
   La firma y los párrafos se aplican al reservar la entrega. La contraseña de
   Apple se configura solo en Cal.com y se conserva el SMTP existente de n8n.
