/** Coerce LLM / stored list entries that may be strings or { title, summary, ... } objects. */
export function coerceTextListItem(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";

  const obj = item as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  const claim = typeof obj.claim === "string" ? obj.claim.trim() : "";
  const action = typeof obj.action === "string" ? obj.action.trim() : "";
  const recommendation =
    typeof obj.recommendation === "string" ? obj.recommendation.trim() : "";

  if (title && summary) return `${title}: ${summary}`;
  return title || summary || text || claim || action || recommendation || "";
}

export function normalizeTextList(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const next = value.map(coerceTextListItem).filter(Boolean);
  return next.length ? next : fallback;
}
