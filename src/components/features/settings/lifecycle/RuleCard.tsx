/**
 * RuleCard — eine Regel-Zeile der Übersicht (L-3c): Datenart-Chip · Name · Klartext-Satz · „zuletzt gefeuert" ·
 * Aktiv-Schalter · Bearbeiten/Löschen (hover). Prop-driven; Schreibvorgänge laufen über die Overview.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import { cn } from "@/lib/utils";
import { useNowMs } from "@/hooks/useNowMs";
import type { LifecycleRuleView } from "@/lib/db";
import { ENTITY_META } from "@/lib/lifecycle/config";
import { summarizeRule, lastFiredText } from "@/lib/lifecycle/summary";

export interface RuleCardProps {
  rule: LifecycleRuleView;
  actionLabel: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RuleCard({ rule, actionLabel, onToggle, onEdit, onDelete }: RuleCardProps) {
  const { t } = useTranslation();
  const nowMs = useNowMs();
  const meta = ENTITY_META[rule.anchorEntity];
  const Icon = meta.icon;
  const p = rule.action.params ?? {};
  const payload = (p.title ?? p.tag ?? p.message ?? null) as string | null;
  const summary = summarizeRule(rule.anchorEntity, rule.conditions, actionLabel, payload, t);

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-[12px] border border-[var(--border-card)] bg-app-surface p-4 shadow-[var(--shadow-card)] transition-all sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        !rule.isActive && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-[8px] p-2" style={{ background: `var(${meta.colorVar}-bg)` }}>
          <Icon className="h-4 w-4" style={{ color: `var(${meta.colorVar}-text)` }} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="typo-card-title truncate text-text-primary">{rule.name}</h3>
            <span className="typo-chip shrink-0 rounded-[7px] px-2 py-0.5 text-text-muted" style={{ background: `var(${meta.colorVar}-bg)`, color: `var(${meta.colorVar}-text)` }}>
              {t(meta.labelKey)}
            </span>
          </div>
          <p className="typo-subline truncate text-text-body">{summary}</p>
          <p className="typo-subline text-text-muted">{lastFiredText(rule.lastFiredAt, rule.firedForCount, t, nowMs)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-2">
          <Switch checked={rule.isActive} onCheckedChange={onToggle} aria-label={rule.isActive ? t("lifecycle.ui.active") : t("lifecycle.ui.inactive")} />
          <span className="typo-subline w-12 text-text-muted">{rule.isActive ? t("lifecycle.ui.active") : t("lifecycle.ui.inactive")}</span>
        </label>
        <div className={cn(HOVER_ACTIONS, "flex gap-1")}>
          <button type="button" onClick={onEdit} aria-label={t("lifecycle.ui.edit")} data-tip={t("lifecycle.ui.edit")}
            className="rounded-[6px] p-2 text-text-muted hover:bg-sherloq-primary/10 hover:text-sherloq-primary">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label={t("common.delete")} data-tip={t("common.delete")}
            className="rounded-[6px] p-2 text-text-muted hover:bg-signal-urgent/10 hover:text-signal-urgent">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
