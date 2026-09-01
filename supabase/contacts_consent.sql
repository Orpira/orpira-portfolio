-- Registro de consentimiento RGPD para el formulario de contacto.
-- Ejecutar en Supabase para poder persistir la prueba de consentimiento.
-- El endpoint /api/contact exige consent=true antes de insertar; la
-- persistencia de estos campos quedara activa al anadirlos al insert.

alter table public.contacts
	add column if not exists consent_accepted_at timestamptz;

alter table public.contacts
	add column if not exists consent_policy_version text;
