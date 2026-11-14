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
