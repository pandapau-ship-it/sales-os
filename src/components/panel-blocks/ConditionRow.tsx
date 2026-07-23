/**
 * ConditionRow — EINE Bedingungs-Zeile des Regel-Builders (L-3b): [Feld ▾][Operator ▾][Wert] + Entfernen.
 * Generisch: Felder/Operatoren/Wert-Typ kommen aus `lib/lifecycle/config` (→ FILTER_SCHEMA, Single Source).
 * Wert-Eingabe passt sich dem Feldtyp an (Text/Zahl/Datum/Auswahl/Ja-Nein/Liste). Tokens-only, i18n.
 */
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import { cn } from "@/lib/utils";
import type { FilterEntity, FilterRule, FilterOperator, FilterValue } from "@/lib/filter/types";
import type { FieldType } from "@/lib/filter/schema";
import { operatorAllowed } from "@/lib/filter/schema";
import {
  getFields, getOperators, operatorNeedsValue, operatorTakesList,
  fieldLabelKey, operatorLabelKey, enumValueLabelKey, boolValueLabelKey,
} from "@/lib/lifecycle/config";

export interface ConditionRowProps {
  entity: FilterEntity;
  rule: FilterRule;
  /** true = erste Zeile (kein UND/ODER-Präfix davor). */
  isFirst: boolean;
  /** Innerhalb-Gruppe-Verknüpfung (UND/ODER), als Präfix ab Zeile 2. */
  groupLogic: "AND" | "OR";
  onChange: (patch: Partial<FilterRule>) => void;
  onRemove: () => void;
}

const FIELD_TRIGGER = "h-9 w-44 text-[13px]";
const OP_TRIGGER = "h-9 w-40 text-[13px]";
const VALUE_INPUT =
  "h-9 flex-1 min-w-[140px] rounded-[8px] border border-border bg-app-bg px-3 text-[13px] text-text-primary " +
  "placeholder:text-text-muted focus:outline-none focus:border-sherloq-primary";

/** Rohwert → typgerechter Wert (Zahl/Boolean/Liste), damit validateFilter/compile passt. */
function coerce(type: FieldType, op: FilterOperator, raw: string): FilterValue {
  if (operatorTakesList(op)) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return type === "number" ? parts.map(Number) : parts;
  }
  if (type === "number") return raw === "" ? "" : Number(raw);
  if (type === "boolean") return raw === "true";
  return raw;
}

export default function ConditionRow({ entity, rule, isFirst, groupLogic, onChange, onRemove }: ConditionRowProps) {
  const { t } = useTranslation();
  const fields = getFields(entity);
  const fieldDef = fields.find((f) => f.name === rule.field) ?? null;
  const ops = fieldDef ? getOperators(fieldDef.type) : [];
  const invalidOp = !!rule.field && !!rule.operator && (!fieldDef || !operatorAllowed(fieldDef.type, rule.operator));
  const showValue = !!rule.operator && operatorNeedsValue(rule.operator);

  // Feldwechsel: passt der aktuelle Operator nicht zum neuen Typ → Operator + Wert zurücksetzen.
  const onFieldChange = (name: string) => {
    const nd = fields.find((f) => f.name === name);
    const keep = nd && rule.operator && operatorAllowed(nd.type, rule.operator);
    onChange(keep ? { field: name } : { field: name, operator: "" as FilterOperator, value: undefined });
  };

  const valueStr = rule.value === undefined || rule.value === null ? "" : Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value);

  return (
    <div className="group/row flex flex-wrap items-center gap-2">
      <span className="w-10 shrink-0 text-right text-[11px] font-bold uppercase text-text-muted">
        {isFirst ? "" : t(`lifecycle.ui.sentence.${groupLogic === "AND" ? "and" : "or"}`)}
      </span>

      {/* Feld */}
      <Select value={rule.field || undefined} onValueChange={onFieldChange}>
        <SelectTrigger className={FIELD_TRIGGER}><SelectValue placeholder={t("lifecycle.ui.fieldPlaceholder")} /></SelectTrigger>
        <SelectContent>
          {fields.map((f) => <SelectItem key={f.name} value={f.name}>{t(fieldLabelKey(f.name))}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select value={rule.operator || undefined} onValueChange={(op) => onChange({ operator: op as FilterOperator, value: undefined })} disabled={!fieldDef}>
        <SelectTrigger className={cn(OP_TRIGGER, invalidOp && "border-signal-urgent text-signal-urgent")}>
          <SelectValue placeholder={t("lifecycle.ui.operatorPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {ops.map((op) => <SelectItem key={op} value={op}>{t(operatorLabelKey(op))}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Wert (typ-adaptiv) */}
      {showValue && fieldDef && (
        fieldDef.type === "enum" ? (
          <Select value={valueStr || undefined} onValueChange={(v) => onChange({ value: v })}>
            <SelectTrigger className="h-9 min-w-[140px] flex-1 text-[13px]"><SelectValue placeholder={t("lifecycle.ui.valuePlaceholder")} /></SelectTrigger>
            <SelectContent>
              {(fieldDef.enumValues ?? []).map((v) => <SelectItem key={v} value={v}>{t(enumValueLabelKey(fieldDef.name, v))}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : fieldDef.type === "boolean" ? (
          <Select value={valueStr || undefined} onValueChange={(v) => onChange({ value: v === "true" })}>
            <SelectTrigger className="h-9 min-w-[120px] text-[13px]"><SelectValue placeholder={t("lifecycle.ui.valuePlaceholder")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t(boolValueLabelKey(true))}</SelectItem>
              <SelectItem value="false">{t(boolValueLabelKey(false))}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <input
            type={fieldDef.type === "number" && !operatorTakesList(rule.operator) ? "number" : fieldDef.type === "date" ? "date" : "text"}
            value={valueStr}
            onChange={(e) => onChange({ value: coerce(fieldDef.type, rule.operator, e.target.value) })}
            placeholder={operatorTakesList(rule.operator) ? t("lifecycle.ui.listPlaceholder") : t("lifecycle.ui.valuePlaceholder")}
            className={VALUE_INPUT}
          />
        )
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={t("common.delete")}
        data-tip={t("common.delete")}
        className={cn(HOVER_ACTIONS, "ml-auto shrink-0 rounded-[8px] p-2 text-text-muted hover:bg-signal-urgent/10 hover:text-signal-urgent")}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {invalidOp && <div className="w-full pl-12 text-[11px] font-medium text-signal-urgent">{t("lifecycle.ui.invalidOperator")}</div>}
    </div>
  );
}
