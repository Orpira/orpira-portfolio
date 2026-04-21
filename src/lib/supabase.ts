import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase (valores públicos, seguros para el frontend)
// Reemplaza con tus credenciales de https://supabase.com
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL para crear la tabla en Supabase (ejecutar en SQL Editor):
 *
 * CREATE TABLE messages (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   email TEXT NOT NULL,
 *   message TEXT NOT NULL,
 *   status TEXT DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'leído', 'respondido', 'archivado')),
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Habilitar Row Level Security
 * ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
 *
 * -- Política: cualquiera puede insertar (formulario público)
 * CREATE POLICY "Permitir insertar mensajes" ON messages
 *   FOR INSERT WITH CHECK (true);
 *
 * -- Política: solo autenticados pueden leer
 * CREATE POLICY "Solo autenticados leen" ON messages
 *   FOR SELECT USING (auth.role() = 'authenticated');
 *
 * -- Política: solo autenticados pueden actualizar el estado
 * CREATE POLICY "Solo autenticados actualizan" ON messages
 *   FOR UPDATE USING (auth.role() = 'authenticated');
 */
