export const stages = [
  { id: "new", label: "Por revisar", color: "#64748b" },
  { id: "qualified", label: "Por avanzar", color: "#2563eb" },
  { id: "meeting_scheduled", label: "Cita confirmada", color: "#0f766e" },
  { id: "proposal", label: "Propuesta enviada", color: "#a16207" },
  { id: "won", label: "Aceptó la propuesta", color: "#047857" },
  { id: "lost", label: "Cerrado sin acuerdo", color: "#b91c1c" },
] as const;

export const stageLabel = (status: string | null) =>
  stages.find((stage) => stage.id === status)?.label ?? status ?? "Sin etapa";

export const stageFeedback: Record<string, string> = {
  saved: "Etapa actualizada.",
  invalid: "Elegí una etapa válida.",
  conflict: "El contacto cambió mientras lo editabas. Revisá su etapa y volvé a intentar.",
  error: "No se pudo cambiar la etapa.",
};
