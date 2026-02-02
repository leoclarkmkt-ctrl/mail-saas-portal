export function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
