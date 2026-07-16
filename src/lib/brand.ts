/**
 * Marken-Zuordnung für Kanäle/Touchpoints — reine Logik, bewusst getrennt von
 * `shared/BrandLogo.tsx`: Fast Refresh tauscht nur Module, die ausschließlich
 * Komponenten exportieren (react-refresh/only-export-components).
 */

export type BrandName = "gmail" | "outlook" | "teams" | "google-meet" | "linkedin";

/**
 * Mappt einen Kanal-/Touchpoint-Typ auf das passende Marken-Logo — oder `null`,
 * wenn es keinen Marken-Anbieter gibt (Telefon, Slack, WhatsApp, Dokument …).
 * Mail → Outlook · Meeting/Video → Teams · LinkedIn → LinkedIn. Für Varianz
 * (Outlook/Gmail bzw. Teams/Google Meet) kann der Aufrufer `variant` setzen.
 */
export function brandForChannel(type: string, variant = false): BrandName | null {
  switch (type.toUpperCase()) {
    case "EMAIL":
    case "MAIL":
      return variant ? "gmail" : "outlook";
    case "MEETING":
    case "VIDEO":
    case "CALL_VIDEO":
    case "TEAMS":
      return variant ? "google-meet" : "teams";
    case "LINKEDIN":
      return "linkedin";
    default:
      return null;
  }
}
