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

export const PERMISSIONS = [
  "rules.edit",
  "campaigns.manage",
  "templates.manage",
  "pipeline.manage",
  "integrations.manage",
  "team.invite",
  "billing.approve_credits",
  "billing.manage",
  "trash.purge",
  "export.all",
  "records.delete",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "rules.edit": "Regeln/Actions/Schwellen ändern",
  "campaigns.manage": "Campaigns verwalten",
  "templates.manage": "Templates verwalten",
  "pipeline.manage": "Pipeline-Stages konfigurieren",
  "integrations.manage": "Integrationen verbinden",
  "team.invite": "Team einladen/deaktivieren",
  "billing.approve_credits": "Credit-Käufe freigeben",
  "billing.manage": "Billing/Plan verwalten",
  "trash.purge": "Endgültig löschen",
  "export.all": "Gesamt-Daten exportieren",
  "records.delete": "Kontakte/Companies/Deals löschen",
};

export type Role = "owner" | "admin" | "member" | "viewer";
export const ROLES: readonly Role[] = ["owner", "admin", "member", "viewer"];

/**
 * Rollen-Matrix (Spiegel role_permissions-Seed, 070). owner = alles; admin = alles außer billing.*;
 * member = nur Export; viewer = nichts. Neue Rolle/Recht = hier + DB-Seed ergänzen (Daten).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => !p.startsWith("billing.")),
  member: ["export.all"],
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
