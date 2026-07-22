/**
 * settingsNav — Struktur + Rollen-Sichtbarkeit der Settings-Navigation. REINE DATEN, kein UI.
 *
 * Vollständige Informationsarchitektur nach `docs/settings_bauplan_v1.md` Abschnitt 1. Die Hülle wird
 * EINMAL vollständig gebaut; künftige Slices schalten ihre Seite nur über `built: true` frei — keine
 * strukturelle Änderung mehr nötig.
 *
 * Sichtbarkeit baut DIREKT auf dem SET-1-Rechte-Katalog auf (kein eigenes System):
 *   - 'self'      → jede eingeloggte Person (eigene Daten)
 *   - 'elevated'  → Owner/Admin (kein spezifisches Katalog-Recht vorhanden → isElevatedRole)
 *   - Permission  → aus dem Katalog (z.B. 'settings.manage', 'team.invite')
 * Sichtbarkeit ist NUR Anzeige — der Server-Guard (SET-1) schützt real.
 *
 * `built: false` → die Nav zeigt den Eintrag AUSGEGRAUT mit „Folgt"-Hinweis (nicht klickbar), damit die
 * Struktur vollständig sichtbar ist, ohne leere Seiten vorzutäuschen (Honesty).
 *
 * „Mein Unternehmen" (Bauplan 8.B [SET-KB-1] + 8.E) ist eine EIGENE Gruppe — der Inhalt ist AI-Kontext
 * (Positionierung · Tonalität · Produktwissen), nicht Org-Verwaltung. „Unternehmensprofil" lebt dort,
 * NICHT unter ORGANISATION (dort stünde es doppelt). „Branding" ist ein eigener Punkt statt in
 * „Allgemein" versteckt (löst den Bauplan-Widerspruch Abschnitt 1 ↔ 8.A zugunsten von 8.A).
 *
 * PERSÖNLICH ist bewusst KEINE Nav-Gruppe (Struktur-Korrektur 19.07.2026): Zugang läuft über das
 * Avatar-Dropdown; die Settings-Nav zeigt unten nur EINEN dezenten Verweis auf /app/profil.
 * Die drei Seiten bleiben hier als Registry-Einträge (Gruppe 'personal') geführt — die Shell
 * rendert diese Gruppe nicht.
 */
import type { Permission } from "./permissions";

export type SettingsVisibility = "self" | "elevated" | Permission;

export type SettingsGroup =
  | "organisation" | "unternehmen" | "arbeitsweise" | "ai" | "verbindungen" | "system"
  | "personal"; // Registry-only — NICHT in der Haupt-Nav (Zugang via Avatar)

export interface SettingsPage {
  key: string;                    // Routen-/i18n-Schlüssel
  group: SettingsGroup;
  visibility: SettingsVisibility;
  built: boolean;                 // false → ausgegraut + „Folgt", nicht klickbar
  route?: string;                 // gesetzt = eigene Route (sonst innerhalb der Settings-Shell)
}

/** Gruppen-Reihenfolge der Haupt-Navigation (ohne 'personal'). */
export const SETTINGS_GROUP_ORDER: readonly Exclude<SettingsGroup, "personal">[] = [
  "organisation", "unternehmen", "arbeitsweise", "ai", "verbindungen", "system",
] as const;

/** Kanonische Settings-Seiten (Reihenfolge = Anzeige-Reihenfolge je Gruppe). */
export const SETTINGS_PAGES: readonly SettingsPage[] = [
  // ORGANISATION
  { key: "allgemein",         group: "organisation", visibility: "settings.manage", built: false }, // Backend SET-2, UI folgt
  { key: "branding",          group: "organisation", visibility: "settings.manage", built: false }, // SET-2 (Logo/Farben — eigener Punkt, Bauplan 8.A)
  { key: "team",              group: "organisation", visibility: "team.invite",     built: true  }, // SET-3 (dieser Slice)
  { key: "abo-credits",       group: "organisation", visibility: "elevated",        built: false }, // Abo-Serie
  { key: "papierkorb",        group: "organisation", visibility: "elevated",        built: false }, // C5 / SET-3-Folge
  // MEIN UNTERNEHMEN — „Was die AI über euch weiß" (Bauplan 8.B [SET-KB-1] + 8.E)
  { key: "unternehmensprofil", group: "unternehmen", visibility: "settings.manage", built: true  }, // Slice 3a GEBAUT (Migr. 080), org-weit
  { key: "personal-voice",    group: "unternehmen",  visibility: "self",            built: true  }, // Slice 2/3 GEBAUT (Migr. 078/079), pro User
  { key: "product-pricing",   group: "unternehmen",  visibility: "settings.manage", built: true  }, // Slice 1/3 GEBAUT (Migr. 077)
  // ARBEITSWEISE
  { key: "regeln",            group: "arbeitsweise", visibility: "settings.manage", built: true  }, // SET-4a (GEBAUT)
  { key: "automation",        group: "arbeitsweise", visibility: "settings.manage", built: false }, // SET-4
  { key: "pipeline",          group: "arbeitsweise", visibility: "settings.manage", built: false }, // SET-4
  { key: "mein-tag",          group: "arbeitsweise", visibility: "settings.manage", built: false }, // SET-4
  // AI
  { key: "modelle",           group: "ai",           visibility: "settings.manage", built: false }, // SET-5
  { key: "ai-sdr",            group: "ai",           visibility: "settings.manage", built: false }, // mit AI-SDR-Slices
  { key: "datennutzung",      group: "ai",           visibility: "settings.manage", built: false }, // SET-5
  { key: "chat",              group: "ai",           visibility: "settings.manage", built: false }, // mit AI-Chat
  // VERBINDUNGEN
  { key: "integrationen",     group: "verbindungen", visibility: "settings.manage", built: false }, // SET-6 / Integrationen
  { key: "mitteilungen",      group: "verbindungen", visibility: "settings.manage", built: false }, // N-S2-Matrix
  // SYSTEM (nur Owner/Admin)
  { key: "status",            group: "system",       visibility: "elevated",        built: false }, // B4
  { key: "audit-log",         group: "system",       visibility: "elevated",        built: false }, // SET-6
  // PERSÖNLICH — Registry-only, Zugang via Avatar-Dropdown (nicht in der Haupt-Nav)
  { key: "mein-profil",       group: "personal",     visibility: "self",            built: true, route: "/app/profil" },
  { key: "ansicht",           group: "personal",     visibility: "self",            built: true, route: "/app/profil" },
  { key: "sicherheit",        group: "personal",     visibility: "self",            built: true, route: "/app/profil" },
] as const;

/** Darf jemand mit diesen Rechten die Seite sehen? (reine Anzeige-Prüfung) */
export function canSeeSettingsPage(
  page: SettingsPage,
  ctx: { isElevated: boolean; has: (p: string) => boolean },
): boolean {
  if (page.visibility === "self") return true;
  if (page.visibility === "elevated") return ctx.isElevated;
  return ctx.has(page.visibility);
}

/** Sichtbare Seiten einer Nav-Gruppe (ohne 'personal' — die steht nicht in der Haupt-Nav). */
export function visibleSettingsPages(
  group: Exclude<SettingsGroup, "personal">,
  ctx: { isElevated: boolean; has: (p: string) => boolean },
): SettingsPage[] {
  return SETTINGS_PAGES.filter((p) => p.group === group && canSeeSettingsPage(p, ctx));
}
