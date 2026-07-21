/**
 * permissions.ts — Rechte-Katalog & Rollen-Matrix (Single Source, SET-1).
 *
 * SPIEGEL-PRINZIP (wie credits.ts / alertTemplates.ts ↔ SQL): die LAUFZEIT-Durchsetzung liegt
 * serverseitig in den Postgres-Funktionen (Migr. 070/071: has_permission / grant_permission /
 * soft_delete_* / set_user_role; Tabellen permission_catalog + role_permissions). Diese Datei
 * spiegelt Katalog + Matrix für UI-Anzeige/-Gating, [AUTO]-Tests und das spätere AI-Chat-Tool.
 * Ändert sich Katalog/Matrix, MUSS der DB-Seed (070) gleich mitgezogen werden.
 *
 * WICHTIG: Die UI-Prüfung (has()) blendet nur aus — die echte Sicherheit ist der Server-Guard.
 */

// KATALOG-UMFANG: NUR heute-existierende Features (wächst mit den Modulen). Noch offene Rechte
// (campaigns.manage · templates.manage · integrations.manage · billing.* · trash.purge · export.all ·
//  audit.view · branding.manage · lists.share) kommen MIT ihrem Modul → Registry in PROGRESS.md.
// Spiegel des DB-Seeds (Migr. 070/073/083) — gemeinsam pflegen.
// `settings.manage` kam mit SET-2 (Migr. 073); rules.edit/pipeline.manage/automation.manage mit SET-4 (Migr. 083).
export const PERMISSIONS = [
  "team.invite",
  "records.delete",
  "records.merge",
  "settings.manage",
  // SET-4 (Migr. 083): eigene Rechte je Bereich statt eines pauschalen settings.manage.
  "rules.edit",
  "pipeline.manage",
  "automation.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "team.invite": "Team einladen/deaktivieren",
  "records.delete": "Kontakte/Companies/Deals löschen",
  "records.merge": "Duplikate zusammenführen",
  "settings.manage": "Workspace-Einstellungen ändern",
  "rules.edit": "Regeln & Schwellenwerte ändern",
  "pipeline.manage": "Pipeline-Stufen verwalten",
  "automation.manage": "Automation-Standards ändern",
};

export type Role = "owner" | "admin" | "member" | "viewer";
export const ROLES: readonly Role[] = ["owner", "admin", "member", "viewer"];

/**
 * Rollen-Matrix (Spiegel role_permissions-Seed, 070). v1: alle drei Rechte sind Admin-Ebene →
 * owner = alles; admin = alles außer billing.* (v1: keine billing-Rechte → alle drei);
 * member/viewer = keine erhöhten Rechte (Basis-CRUD ohne Katalog-Recht). Neue Rolle/Recht = hier
 * + DB-Seed (070) ergänzen. `billing.`-Filter bleibt vorbereitet für künftige billing-Rechte.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => !p.startsWith("billing.")),
  member: [],
  viewer: [],
};

/** Elevated = Owner/Admin (ersetzt verstreute `role === "owner"`-Vergleiche, z.B. MfaBanner). */
export function isElevatedRole(role: string): boolean {
  return role === "owner" || role === "admin";
}

export interface PermissionOverride {
  permission: string;
  effect: "grant" | "deny";
}

/**
 * Effektive Rechte berechnen — Spiegel von has_permission/effective_permissions (SQL):
 * deny > grant > Rolle. Reine Funktion für UI-Gating + Tests; der Server erzwingt erneut.
 */
export function effectivePermissions(role: string, overrides: readonly PermissionOverride[] = []): Set<string> {
  const base = new Set<string>(ROLE_PERMISSIONS[(role as Role)] ?? []);
  for (const o of overrides) if (o.effect === "grant") base.add(o.permission);
  for (const o of overrides) if (o.effect === "deny") base.delete(o.permission); // deny gewinnt
  return base;
}

export function hasPermission(
  role: string,
  permission: string,
  overrides: readonly PermissionOverride[] = [],
): boolean {
  return effectivePermissions(role, overrides).has(permission);
}
