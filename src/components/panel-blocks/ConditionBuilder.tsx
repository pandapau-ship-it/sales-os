/**
 * ConditionBuilder — generischer WENN-Bedingungs-Baum des Regel-Builders (L-3b).
 * Modelliert direkt unsere Option-B-Form ({logic, groups:[{entity, where:FilterGroup}]}); Manipulation über
 * `lib/lifecycle/conditions` (rein, getestet). Innerhalb-Gruppe UND/ODER schaltbar, Zwischen-Gruppen EIN
 * globaler Schalter (Option-B-Grenze — sichtbar erklärt, kein gemischtes je Paar). Tokens-only, i18n.
 * Nicht regelbuilder-spezifisch gebunden: value/onChange-prop-driven → auch für dynamische Listen nutzbar.
 */
import { useTranslation } from "react-i18next";
import { Plus, X, Info } from "lucide-react";
import ConditionRow from "./ConditionRow";
import { cn } from "@/lib/utils";
import type { FilterEntity, FilterRule } from "@/lib/filter/types";
import { ENTITY_ORDER, ENTITY_META } from "@/lib/lifecycle/config";
import {
  addGroup, removeGroup, addRule, removeRule, updateRule, setGroupLogic, setBetweenLogic,
  rulesOf, logicOf, type BuilderConditions, type Logic,
} from "@/lib/lifecycle/conditions";

export interface ConditionBuilderProps {
  anchor: FilterEntity;
  value: BuilderConditions;
  onChange: (c: BuilderConditions) => void;
}

/** Segmentierter UND/ODER-Umschalter (klein, tokens-only). */
function LogicToggle({ value, onChange, label }: { value: Logic; onChange: (l: Logic) => void; label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-[11px] text-text-muted">{label}</span>}
      <div className="inline-flex rounded-full border border-border bg-app-surface p-0.5">
        {(["AND", "OR"] as Logic[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
              value === l ? "bg-sherloq-primary text-on-accent" : "text-text-muted hover:text-text-body",
            )}
          >
            {t(`lifecycle.ui.sentence.${l === "AND" ? "and" : "or"}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConditionBuilder({ anchor, value, onChange }: ConditionBuilderProps) {
  const { t } = useTranslation();

  if (value.groups.length === 0) {
    return (
      <div className="rounded-[12px] border-2 border-dashed border-border bg-app-bg/50 p-8 text-center">
        <p className="mb-4 text-[13px] text-text-muted">{t("lifecycle.ui.noConditions")}</p>
        <button
          type="button"
          onClick={() => onChange(addGroup(value, anchor))}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-app-surface px-4 py-2 text-[13px] font-medium text-text-body shadow-[var(--shadow-card)] transition-colors hover:border-sherloq-primary hover:text-sherloq-primary"
        >
          <Plus className="h-4 w-4" /> {t("lifecycle.ui.addFirstCondition")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {value.groups.map((group, gIdx) => {
        const meta = ENTITY_META[group.entity];
        const Icon = meta.icon;
        const rules = rulesOf(group);
        const gLogic = logicOf(group);
        return (
          <div key={gIdx}>
            {gIdx > 0 && (
              <div className="relative z-10 -my-2 flex justify-center">
                <LogicToggle value={value.logic} onChange={(l) => onChange(setBetweenLogic(value, l))} />
              </div>
            )}

            <div className="overflow-hidden rounded-[12px] border border-[var(--border-card)] bg-app-surface">
              {/* Gruppen-Header: Datenart (Entity-Tint) + Innerhalb-Logik + Entfernen */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: `var(${meta.colorVar}-bg)` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: `var(${meta.colorVar}-text)` }} />
                  <span className="typo-card-title text-text-primary">{t(meta.labelKey)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {rules.length > 1 && (
                    <LogicToggle value={gLogic} onChange={(l) => onChange(setGroupLogic(value, gIdx, l))} label={t("lifecycle.ui.matchLabel")} />
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(removeGroup(value, gIdx))}
                    aria-label={t("common.remove")}
                    data-tip={t("common.remove")}
                    className="rounded-[6px] p-1 text-text-muted hover:bg-app-surface hover:text-signal-urgent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bedingungs-Zeilen */}
              <div className="space-y-3 p-4">
                {rules.map((rule: FilterRule, rIdx) => (
                  <ConditionRow
                    key={rIdx}
                    entity={group.entity}
                    rule={rule}
                    isFirst={rIdx === 0}
                    groupLogic={gLogic}
                    onChange={(patch) => onChange(updateRule(value, gIdx, rIdx, patch))}
                    onRemove={() => onChange(removeRule(value, gIdx, rIdx))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => onChange(addRule(value, gIdx))}
                  className="flex items-center gap-1.5 rounded-[6px] p-1 text-[12px] font-semibold text-sherloq-primary hover:bg-sherloq-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" /> {t("lifecycle.ui.addCondition")}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Zusätzliche Datenart verknüpfen + Option-B-Hinweis */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-text-muted">{t("lifecycle.ui.linkEntity")}</span>
          {ENTITY_ORDER.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(addGroup(value, e))}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-app-surface px-3 py-1.5 text-[12px] font-medium text-text-body shadow-[var(--shadow-card)] transition-colors hover:border-sherloq-primary hover:text-sherloq-primary"
            >
              <Plus className="h-3 w-3" /> {t(ENTITY_META[e].labelKey)}
            </button>
          ))}
        </div>
        {value.groups.length > 1 && (
          <p className="flex items-start gap-1.5 text-[11px] text-text-muted">
            <Info className="mt-0.5 h-3 w-3 shrink-0" /> {t("lifecycle.ui.crossEntityHint")}
          </p>
        )}
      </div>
    </div>
  );
}
