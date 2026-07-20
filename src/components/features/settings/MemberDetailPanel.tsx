/**
 * MemberDetailPanel — Personen-Detail (Settings → Team & Rechte, SET-3).
 *
 * Einzelrechte werden ZWINGEND über `PERMISSIONS.map()` gerendert (datengetrieben): ein neues Recht im
 * Katalog erscheint hier automatisch, ohne UI-Änderung. Aus der ROLLE stammende Rechte sind sichtbar,
 * aber nicht einzeln abwählbar (v1 ist rein additiv) — nur echte Einzel-Grants sind schaltbar.
 * Schreiben über grant_permission/revoke_permission (Server prüft erneut). Danach invalidateQueries →
 * die eigene Ansicht aktualisiert sich ohne Reload. Unten die personen-gescopte Historie (audit_log).
 */
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, History } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import {
  getEffectivePermissions, grantPermission, revokePermission, getMemberAuditLog,
} from "@/lib/db";
import { PERMISSIONS, PERMISSION_LABELS, ROLE_PERMISSIONS, type Role, type Permission } from "@/lib/permissions";
import { Avatar, InfoPanel, SettingsCard, StatusBadge } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import { Switch } from "@/components/ui/switch";

interface Member {
  id: string; full_name: string | null; email: string; role: string; status: string;
}

export default function MemberDetailPanel({ member, onClose }: { member: Member; onClose: () => void }) {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { toast } = useToast();
  const qc = useQueryClient();

  const permsQuery = useQuery({
    queryKey: ["effectivePermissions", member.id],
    queryFn: () => getEffectivePermissions(member.id),
    staleTime: 60_000,
  });
  const effective = new Set(permsQuery.data ?? []);

  const historyQuery = useQuery({
    queryKey: ["memberAudit", organizationId, member.id],
    queryFn: () => getMemberAuditLog(organizationId, member.id),
    staleTime: 60_000,
  });
  const history = (historyQuery.data ?? []) as Record<string, unknown>[];

  const toggle = useMutation({
    mutationFn: ({ permission, on }: { permission: Permission; on: boolean }) =>
      on ? grantPermission(member.id, permission) : revokePermission(member.id, permission),
    onSuccess: () => {
      // Ohne Reload: eigene + fremde Rechte-Ansicht + Historie neu ziehen.
      void qc.invalidateQueries({ queryKey: ["effectivePermissions"] });
      void qc.invalidateQueries({ queryKey: ["memberAudit", organizationId, member.id] });
      toast(t("settings.members.rightsSaved"));
    },
    onError: (e) => toast(e instanceof Error ? e.message : t("login.errorGeneric")),
  });

  const roleDefaults = new Set<string>(ROLE_PERMISSIONS[member.role as Role] ?? []);
  const roleLabel = t(`settings.team.role${member.role.charAt(0).toUpperCase()}${member.role.slice(1)}`, member.role);

  return (
    <InfoPanel open onClose={onClose}>
      <div className="flex flex-col h-full overflow-y-auto p-6">
        {/* Kopf */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={member.full_name || member.email} size={48} />
          <div className="min-w-0">
            <h2 className="typo-page-title text-text-primary truncate">{member.full_name || member.email}</h2>
            <p className="typo-subline text-text-muted truncate">{member.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="typo-chip px-2.5 py-1 rounded-[7px] bg-app-bg text-text-body">{roleLabel}</span>
            <StatusBadge
              tone={member.status === "deactivated" ? "muted" : "success"}
              label={t(member.status === "deactivated" ? "settings.members.status.deactivated" : "settings.members.status.active")}
            />
          </div>
        </div>

        {/* Einzelrechte — datengetrieben aus dem Katalog */}
        <SettingsCard title={t("settings.members.rightsTitle")} description={t("settings.members.rightsDesc")}>
          <div className="border border-border rounded-[12px] overflow-hidden divide-y divide-[var(--border-card)]">
            {PERMISSIONS.map((p) => {
              const fromRole = roleDefaults.has(p);
              return (
                <div key={p} className="flex items-center justify-between gap-3 p-3 bg-app-surface">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary">
                      {t(`permissions.${p}`, PERMISSION_LABELS[p])}
                    </div>
                    <div className="typo-subline text-text-muted">
                      {fromRole ? t("settings.members.fromRole", { role: roleLabel }) : t("settings.members.individual")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {fromRole && <ShieldCheck className="w-4 h-4 text-text-muted" />}
                    <Switch
                      checked={effective.has(p)}
                      disabled={fromRole || toggle.isPending}
                      aria-label={t(`permissions.${p}`, PERMISSION_LABELS[p])}
                      onCheckedChange={(on) => toggle.mutate({ permission: p, on })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="typo-subline text-text-muted">{t("settings.members.rightsHint")}</p>
        </SettingsCard>

        {/* Personen-Historie */}
        <SettingsCard title={t("settings.members.historyTitle")} description={t("settings.members.historyDesc")}>
          {history.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-[12px] border border-dashed border-border text-text-muted">
              <History className="w-5 h-5 shrink-0" />
              <span className="text-[13px]">{t("settings.members.historyEmpty")}</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => {
                const who = (h.user as { full_name?: string } | null)?.full_name;
                return (
                  <li key={String(h.id)} className="flex items-baseline gap-2 text-[13px]">
                    <span className="text-text-primary font-medium">
                      {t(`settings.members.audit.${String(h.action)}`, String(h.action))}
                    </span>
                    <span className="typo-subline text-text-muted">
                      {who ? `· ${who}` : ""} · {new Date(String(h.created_at)).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SettingsCard>
      </div>
    </InfoPanel>
  );
}
