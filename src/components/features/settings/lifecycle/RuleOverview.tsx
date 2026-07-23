/**
 * RuleOverview — Übersicht der Lifecycle-Regeln (L-3c): Liste mit Aktiv-Schalter, „zuletzt gefeuert",
 * Klartext, Limit-Anzeige, Vorlagen-Galerie, Löschen-Dialog. Server-State über TanStack Query; EIN
 * Schreibweg (upsert/deleteLifecycleRule). `automation.manage`-Gate auf Seiten-Ebene. Tokens-only, i18n.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Loader2, AlertCircle, Settings2, Lock } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import RuleCard from "./RuleCard";
import { cn } from "@/lib/utils";
import { DEMO_ORGANIZATION_ID } from "@/lib/org";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import {
  getLifecycleRules, getActionTypes, getLifecycleRuleLimit,
  upsertLifecycleRule, deleteLifecycleRule, type LifecycleRuleView,
} from "@/lib/db";
import { TEMPLATES, type RuleTemplate } from "@/lib/lifecycle/templates";
import RuleEditor, { type EditorInit } from "./RuleEditor";

export interface RuleOverviewProps {
  /** Org-Scope der Regeln. Default = Demo-Org (bis Auth die Session-Org liefert, TODO [D21]). */
  org?: string;
  onNew?: () => void;
  onEdit?: (rule: LifecycleRuleView) => void;
  onTemplate?: (tpl: RuleTemplate) => void;
}

const BOX = "rounded-[12px] border border-[var(--border-card)] bg-app-surface";

export default function RuleOverview({ org = DEMO_ORGANIZATION_ID, onNew, onEdit, onTemplate }: RuleOverviewProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { has, loading: permLoading } = useEffectivePermissions();
  const canManage = has("automation.manage");
  const [delTarget, setDelTarget] = useState<LifecycleRuleView | null>(null);
  const [editing, setEditing] = useState<EditorInit | null>(null);

  const rulesQ = useQuery({ queryKey: ["lifecycle-rules", org], queryFn: () => getLifecycleRules(org), staleTime: 30_000, retry: false, enabled: canManage });
  const limitQ = useQuery({ queryKey: ["lifecycle-rule-limit", org], queryFn: () => getLifecycleRuleLimit(org), staleTime: 60_000, retry: false, enabled: canManage });
  const actionsQ = useQuery({ queryKey: ["action-types"], queryFn: getActionTypes, staleTime: 5 * 60_000, retry: false, enabled: canManage });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["lifecycle-rules", org] });
    void qc.invalidateQueries({ queryKey: ["lifecycle-rule-limit", org] });
  };
  const toggleM = useMutation({
    mutationFn: (r: LifecycleRuleView) => upsertLifecycleRule(r.id, { is_active: !r.isActive }, r.updatedAt),
    onSettled: invalidate,
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteLifecycleRule(id),
    onSettled: () => { setDelTarget(null); invalidate(); },
  });

  const actionLabel = (type: string) => {
    const a = actionsQ.data?.find((x) => x.key === type);
    return a ? t(a.labelKey) : type;
  };

  // Editor öffnen: interner Standard (In-Place-Seite) — Props sind optionale Overrides (Testbarkeit/Einbettung).
  const handleNew = () => (onNew ? onNew() : setEditing({ mode: "new" }));
  const handleEdit = (r: LifecycleRuleView) => (onEdit ? onEdit(r) : setEditing({ mode: "edit", rule: r }));
  const handleTemplate = (tpl: RuleTemplate) => (onTemplate ? onTemplate(tpl) : setEditing({ mode: "template", tpl }));

  // ── Permission-Gate (Seiten-Ebene) ─────────────────────────────────────────
  if (!permLoading && !canManage) {
    return (
      <div className={cn(BOX, "mx-auto max-w-md p-8 text-center")}>
        <Lock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <h3 className="typo-card-title text-text-primary">{t("lifecycle.ui.noPermission.title")}</h3>
        <p className="typo-subline mt-2 text-text-muted">{t("lifecycle.ui.noPermission.body")}</p>
      </div>
    );
  }

  // Editor als In-Place-Seite (kein Sheet) — ersetzt die Liste, bis geschlossen/gespeichert wird.
  if (editing) {
    return (
      <RuleEditor
        orgId={org}
        init={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); invalidate(); }}
      />
    );
  }

  const rules = rulesQ.data ?? [];
  const limit = limitQ.data?.limit ?? -1;
  const used = limitQ.data?.used ?? rules.length;
  const atLimit = limit >= 0 && used >= limit;

  const AiButton = (
    <button type="button" disabled aria-disabled title={t("lifecycle.ui.aiComingSoon")}
      className="inline-flex cursor-not-allowed items-center gap-2 rounded-[10px] border border-dashed border-border bg-app-bg px-4 py-2 text-[13px] font-medium text-text-muted">
      <Sparkles className="h-4 w-4" /> {t("lifecycle.ui.withAi")}
      <span className="typo-chip rounded-[6px] bg-app-surface px-1.5 py-0.5">{t("lifecycle.ui.aiComingSoon")}</span>
    </button>
  );
  const NewButton = (
    <button type="button" onClick={handleNew} disabled={atLimit}
      className="inline-flex items-center gap-2 rounded-[10px] bg-sherloq-primary px-4 py-2 text-[13px] font-semibold text-on-accent shadow-[var(--shadow-card)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
      <Plus className="h-4 w-4" /> {t("lifecycle.ui.newRule")}
    </button>
  );
  const Templates = (
    <div>
      <h3 className="typo-section-label mb-3 flex items-center gap-1.5 text-text-muted"><Sparkles className="h-3.5 w-3.5" /> {t("lifecycle.ui.templatesHeading")}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <button key={tpl.id} type="button" onClick={() => handleTemplate(tpl)}
            className={cn(BOX, "group p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-sherloq-primary")}>
            <div className="typo-card-title text-text-primary group-hover:text-sherloq-primary">{t(tpl.titleKey)}</div>
            <div className="typo-subline mt-1 text-text-muted">{t(tpl.descKey)}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="typo-card-title text-text-primary" style={{ fontSize: 20 }}>{t("lifecycle.ui.title")}</h2>
          <p className="typo-subline mt-1 text-text-muted">{t("lifecycle.ui.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {limit >= 0 && (
            <span className={cn("typo-chip rounded-[7px] border border-border px-2.5 py-1", atLimit ? "text-signal-urgent" : "text-text-muted")}>
              {t("lifecycle.ui.limit", { used, limit })}
            </span>
          )}
          {AiButton}
          {NewButton}
        </div>
      </div>

      {atLimit && (
        <div className="flex items-start gap-2 rounded-[10px] border border-signal-urgent/30 bg-signal-urgent/10 p-3 text-[13px] text-signal-urgent">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {t("lifecycle.ui.limitReached", { used, limit })}
        </div>
      )}

      {/* Inhalt: Laden / Fehler / Leer / Liste */}
      {rulesQ.isLoading || permLoading ? (
        <div className={cn(BOX, "flex items-center gap-2 p-8 text-[13px] text-text-muted")}>
          <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
        </div>
      ) : rulesQ.isError ? (
        <div className={cn(BOX, "flex items-center gap-2 p-8 text-[13px] text-signal-urgent")}>
          <AlertCircle className="h-4 w-4" /> {t("lifecycle.ui.loadError")}
        </div>
      ) : rules.length === 0 ? (
        <div className="space-y-10 py-6">
          <div className="mx-auto max-w-lg space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-app-bg"><Settings2 className="h-7 w-7 text-sherloq-primary" /></div>
            <h3 className="typo-card-title text-text-primary" style={{ fontSize: 18 }}>{t("lifecycle.ui.emptyTitle")}</h3>
            <p className="typo-subline text-text-muted">{t("lifecycle.ui.emptyBody")}</p>
            <div className="flex justify-center gap-2">{NewButton}{AiButton}</div>
          </div>
          {Templates}
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <RuleCard key={r.id} rule={r} actionLabel={actionLabel(r.action.type)}
              onToggle={() => toggleM.mutate(r)} onEdit={() => handleEdit(r)} onDelete={() => setDelTarget(r)} />
          ))}
        </div>
      )}

      {/* Löschen-Bestätigung */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lifecycle.ui.deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("lifecycle.ui.deleteConfirm.body", { name: delTarget?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("lifecycle.ui.deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => delTarget && deleteM.mutate(delTarget.id)} className="bg-signal-urgent text-on-accent hover:opacity-90">
              {t("lifecycle.ui.deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
