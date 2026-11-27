#!/usr/bin/env node
// Guardián de las demos en Supabase Free.
// 1) Si un proyecto está pausado, lo reanuda con la Management API (POST /v1/projects/{ref}/restore)
//    y espera a que vuelva a estar activo.
// 2) Si está activo, lee una fila de una tabla pública: consulta real a la base de datos,
//    así el proyecto no cuenta como inactivo. No hace falta crear nada en Supabase.
// 3) Avisa por Telegram de cada reanudación o fallo.
//
// Uso: node supabase-guardian.mjs           (Node 18+; sin dependencias)
// Cron en OrPiRa-Cloud, cada 12 h:  0 */12 * * * cd /opt/monitorizacion && node supabase-guardian.mjs >> guardian.log 2>&1
//
// Variables (.env o entorno):
//   SUPABASE_PAT          Token personal (Account → Access Tokens). Solo en el servidor, nunca en un frontend.
//   SUPABASE_PAT_<ref>    (opcional) Token propio para un proyecto concreto, p. ej. cuando los
//                         proyectos están en organizaciones distintas. Tiene prioridad sobre SUPABASE_PAT.
//   PROYECTOS             Lista "ref:tabla:anonKey" separada por comas.
//                         Ej: abcd1234:questions:eyJ...,efgh5678:rooms:eyJ...
//   TELEGRAM_BOT_TOKEN    (opcional) Token del bot que ya usa el CRM
//   TELEGRAM_CHAT_ID      (opcional) Tu chat
//   ESPERA_MAX_MIN        (opcional) Minutos máximos esperando a que un proyecto reanudado arranque (por defecto 10)

import { readFileSync, existsSync } from "node:fs";

if (existsSync(new URL("./.env", import.meta.url))) {
  for (const linea of readFileSync(new URL("./.env", import.meta.url), "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PAT = process.env.SUPABASE_PAT;
const PROYECTOS = (process.env.PROYECTOS || "").split(",").map((p) => p.trim()).filter(Boolean)
  .map((p) => { const [ref, tabla, anon] = p.split(":"); return { ref, tabla, anon }; });
const ESPERA_MAX = (+process.env.ESPERA_MAX_MIN || 10) * 60_000;
const API = "https://api.supabase.com/v1";

const tokenDe = (ref) => process.env[`SUPABASE_PAT_${ref}`] || PAT;
if (!PROYECTOS.length || PROYECTOS.some((p) => !tokenDe(p.ref))) {
  console.error("Faltan PROYECTOS o un token (SUPABASE_PAT o SUPABASE_PAT_<ref>) para algún proyecto"); process.exit(1);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const hora = () => new Date().toISOString();

async function telegram(texto) {
  const { TELEGRAM_BOT_TOKEN: t, TELEGRAM_CHAT_ID: c } = process.env;
  if (!t || !c) return;
  try {
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c, text: texto }),
    });
  } catch { /* un aviso fallido no debe parar el guardián */ }
}

async function api(ref, ruta, metodo = "GET") {
  const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: `Bearer ${tokenDe(ref)}` } });
  const cuerpo = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status} ${cuerpo.slice(0, 200)}`);
  return cuerpo ? JSON.parse(cuerpo) : {};
}

async function estado(ref) { return (await api(ref, `/projects/${ref}`)).status; }

async function keepalive({ ref, tabla, anon }) {
  // Lee una fila de una tabla pública: cuenta como actividad real de la base de datos.
  const r = await fetch(`https://${ref}.supabase.co/rest/v1/${tabla}?select=*&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  if (!r.ok) throw new Error(`keepalive ${ref}/${tabla} → ${r.status}`);
}

async function vigilar(p) {
  let st = await estado(p.ref);
  console.log(`${hora()} ${p.ref}: ${st}`);

  if (st === "INACTIVE" || st === "PAUSED") {
    await telegram(`⏸️ Supabase ${p.ref} estaba en pausa. Reanudando…`);
    await api(p.ref, `/projects/${p.ref}/restore`, "POST");
    const inicio = Date.now();
    do { await dormir(20_000); st = await estado(p.ref); console.log(`${hora()} ${p.ref}: ${st}`); }
    while (st !== "ACTIVE_HEALTHY" && Date.now() - inicio < ESPERA_MAX);
    if (st !== "ACTIVE_HEALTHY") throw new Error(`no volvió a ACTIVE_HEALTHY en ${ESPERA_MAX / 60000} min (estado: ${st})`);
    await telegram(`✅ Supabase ${p.ref} reanudado y activo.`);
  }

  if (st === "ACTIVE_HEALTHY") { await keepalive(p); console.log(`${hora()} ${p.ref}: keepalive ok`); }
}

let fallos = 0;
for (const p of PROYECTOS) {
  try { await vigilar(p); }
  catch (e) { fallos++; console.error(`${hora()} ${p.ref}: ${e.message}`); await telegram(`⚠️ Guardián Supabase ${p.ref}: ${e.message}`); }
}
process.exit(fallos ? 1 : 0);
