export const stages = [
  { id: "new", label: "Nuevo", color: "#64748b" },
  { id: "qualified", label: "Cualificado", color: "#2563eb" },
  { id: "proposal", label: "Propuesta", color: "#a16207" },
  { id: "won", label: "Ganado", color: "#047857" },
  { id: "lost", label: "Perdido", color: "#b91c1c" },
] as const;

export const stageLabel = (status: string | null) =>
  stages.find((stage) => stage.id === status)?.label ?? status ?? "Sin etapa";

export const stageFeedback: Record<string, string> = {
  saved: "Etapa actualizada.",
  invalid: "Elegí una etapa válida.",
  conflict: "El contacto cambió mientras lo editabas. Revisá su etapa y volvé a intentar.",
  error: "No se pudo cambiar la etapa.",
};
