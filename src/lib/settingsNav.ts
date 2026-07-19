/**
 * settingsNav — Rollen-Sichtbarkeit der Settings-Navigation (SET-2 Area 5). REINE DATEN, kein UI.
 *
 * Baut DIREKT auf dem SET-1-Rechte-Katalog auf (kein eigenes Sichtbarkeits-System). Die künftige
 * Settings-Shell liest diese Struktur + `useEffectivePermissions`/`useCurrentOrg`, um Gruppen/Seiten
 * ein- oder auszublenden. Sichtbarkeit ist NUR Anzeige — der Server-Guard (SET-1) schützt real.
 *
 * `visibility`:
 *   - 'self'      → jede eingeloggte Person (eigene Daten: Mein Profil, Ansicht, Sicherheit)
 *   - 'elevated'  → Owner/Admin (SYSTEM-Bereich; noch kein spezifisches Katalog-Recht → isElevatedRole)
 *   - Permission  → aus dem SET-1-Katalog (z.B. 'settings.manage', 'team.invite')
 */
import type { Permission } from "./permissions";

export type SettingsVisibility = "self" | "elevated" | Permission;

export interface SettingsPage {
  key: string;          // Routen-/i18n-Schlüssel
  group: "workspace" | "personal" | "system";
  visibility: SettingsVisibility;
  built: boolean;       // schon gebaut? (sonst „Folgt" in der Shell — kein leerer Platzhalter)
}

/**
 * Kanonische Settings-Seiten. Reihenfolge = Anzeige-Reihenfolge je Gruppe. `built:false` = die Seite
 * kommt mit ihrem Slice; bis dahin zeigt die Shell sie als „Folgt" (Ehrlichkeit), nicht als Screen.
 */
export const SETTINGS_PAGES: readonly SettingsPage[] = [
  // WORKSPACE
  { key: "allgemein",    group: "workspace", visibility: "settings.manage", built: true },  // SET-2 (dieses Backend)
  { key: "team",         group: "workspace", visibility: "team.invite",     built: true },  // SET-1/TeamSettings vorhanden
  // PERSÖNLICH
  { key: "mein-profil",  group: "personal",  visibility: "self",            built: true },  // SET-2-Backend (RPC vorhanden)
  { key: "ansicht",      group: "personal",  visibility: "self",            built: true },  // SET-2-Backend (user_preferences)
  { key: "sicherheit",   group: "personal",  visibility: "self",            built: true },  // SET-2-Backend (lib/auth)
  // SYSTEM (nur Owner/Admin)
  { key: "status",       group: "system",    visibility: "elevated",        built: false }, // B4 (Betrieb)
  { key: "audit-log",    group: "system",    visibility: "elevated",        built: false }, // SET-6
] as const;

/** Reine Prüf-Hilfe für die künftige Shell: darf jemand mit diesen Rechten die Seite sehen? */
export function canSeeSettingsPage(
  page: SettingsPage,
  ctx: { isElevated: boolean; has: (p: string) => boolean },
): boolean {
  if (page.visibility === "self") return true;
  if (page.visibility === "elevated") return ctx.isElevated;
  return ctx.has(page.visibility);
}
