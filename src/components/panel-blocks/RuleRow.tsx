/**
 * RuleRow — EINE wiederverwendbare „Klartext-Regel-Zeile" (SET-4 Fundament).
 *
 * Ein Satz mit EINEM anklickbaren Wert, z.B. „Kontakt gilt als inaktiv nach [14] Tagen". Der Wert ist ein
 * `ValueChip` (Single Source des editierbaren Chips) — Klick (nur mit Recht) öffnet den Zahl-Popover.
 * `valueFirst` stellt den Chip an den ZEILENANFANG (linksbündige Werte-Spalte, z.B. „[24] Stunden gilt …").
 * Validierung ist doppelt: im ValueChip (UX-Bereich) UND serverseitig in `update_settings`.
 * Prop-driven, tokens-only; das Schreiben macht der Aufrufer über `onSave` (→ `updateSettings`).
 *
 * Nur EIN Wert je Zeile (der häufige Fall). Mehr-Wert-Sätze komponieren mehrere RuleRows.
 */
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import ValueChip, { type ChipTone } from "./ValueChip";

export default function RuleRow({
  icon, before, after, value, unit, min, max, step = 1,
  canEdit = true, valueLabel, placeholder = "—", valueFirst = false,
  tone = "primary", recommended, why, onSave,
}: {
  /** Dezentes graues Icon links (schlichtes Lucide-Icon, kein farbiger Kreis). */
  icon?: ReactNode;
  /** Satz-Teil VOR dem Wert (bei `valueFirst` = Satz NACH dem Chip). */
  before: string;
  /** Satz-Teil NACH dem Wert (z.B. „Tagen"). Bei `valueFirst` ungenutzt. */
  after?: string;
  value: number | null;
  /** Einheit hinter dem Wert (z.B. „Tage", „%"). */
  unit?: string;
  min: number;
  max: number;
  step?: number;
  canEdit?: boolean;
  /** Optionale eigene Wert-Darstellung (z.B. Zahl → Label). */
  valueLabel?: (v: number) => string;
  /** Anzeige, wenn kein Wert gesetzt ist. */
  placeholder?: string;
  /** Chip an den Zeilenanfang stellen (linksbündige Werte-Spalte). */
  valueFirst?: boolean;
  /** Akzent-Ton des Chips (neutral / Risiko / Chance). */
  tone?: ChipTone;
  /**
   * Empfohlener Default. Weicht `value` davon ab, erscheint (nur bei Hover/Fokus + Recht) ein
   * „Auf Empfehlung zurücksetzen"-Knopf, der `onSave(recommended)` aufruft.
   */
  recommended?: number;
  /** Optionaler „Warum?"-Slot (z.B. `<WhyPopover .../>`), hover-gated rechts. */
  why?: ReactNode;
  onSave: (v: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const canReset = canEdit && recommended != null && value !== recommended;

  const chip = (
    <ValueChip
      value={value} unit={unit} min={min} max={max} step={step} canEdit={canEdit}
      valueLabel={valueLabel} placeholder={placeholder} tone={tone}
      ariaLabel={`${before} ${after ?? ""}`.trim()} onSave={onSave}
    />
  );

  return (
    <div className="group/rule flex items-center gap-1.5 flex-wrap py-2 text-[13px] text-text-body">
      {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      {valueFirst ? (
        <>
          {chip}
          <span>{before}</span>
        </>
      ) : (
        <>
          <span>{before}</span>
          {chip}
          {after && <span>{after}</span>}
        </>
      )}

      {/* Reset-pro-Regel + „Warum?" — dezent, erst bei Hover/Fokus sichtbar. */}
      {(canReset || why) && (
        <span className="inline-flex items-center gap-0.5 opacity-0 group-hover/rule:opacity-100 focus-within:opacity-100 transition-opacity">
          {canReset && (
            <button
              type="button"
              onClick={() => void onSave(recommended as number)}
              aria-label={t("settings.rules.reset", { value: recommended })}
              data-tip={t("settings.rules.reset", { value: recommended })}
              className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {why}
        </span>
      )}
    </div>
  );
}
