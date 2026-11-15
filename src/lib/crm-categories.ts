export const categories = {
  client: "Cliente potencial",
  recruiter: "Oferta laboral o selección",
  collaboration: "Colaboración",
  networking: "Networking",
  other: "Otro",
} as const;

export function isContactCategory(value: unknown): value is keyof typeof categories {
  return typeof value === "string" && Object.hasOwn(categories, value);
}
