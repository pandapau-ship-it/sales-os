/**
 * tableSearch — reine, schnelle Substring-Suche für die geteilte DataTable (Kontakte + Companies).
 *
 * Bewusst KEINE semantische/„smarte" Suche: das bleibt dem späteren AI-Chat (RAG über Notizen/
 * Verläufe) vorbehalten — zwei Suchsysteme für dasselbe wären eine Dopplung. Hier nur:
 * case-insensitiver Teilstring-Match über die vom Screen bestimmten Felder. Kein AI-Call, 0 Token.
 */

/** Setzt die durchsuchbaren Felder eines Datensatzes zu EINEM Text zusammen (leere weg). */
export function buildSearchText(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** true, wenn `query` (getrimmt, case-insensitiv) als Teilstring in `text` vorkommt. Leere Query → alles matcht. */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}
