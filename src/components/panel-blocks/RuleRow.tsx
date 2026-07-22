/**
 * RuleRow — EINE wiederverwendbare „Klartext-Regel-Zeile" (SET-4 Fundament).
 *
 * Ein Satz mit EINEM anklickbaren Wert, z.B. „Kontakt gilt als inaktiv nach [14] Tagen". Der Wert ist ein
 * Chip; Klick (nur mit Recht) öffnet einen kleinen shadcn-Popover mit Zahlen-Eingabe + Min/Max-Hinweis.
 * Validierung ist doppelt: hier (UX, Bereich [min,max]) UND serverseitig in `update_settings` (083).
 * Prop-driven, tokens-only; das Schreiben macht der Aufrufer über `onSave` (→ `updateSettings`).
 *
 * Nur EIN Wert je Zeile (der häufige Fall). Mehr-Wert-Sätze komponieren mehrere RuleRows oder bekommen
 * bei Bedarf eine eigene Variante — bewusst schlank gehalten (Fundament).
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function RuleRow({
  icon, before, after, value, unit, min, max, step = 1,
  canEdit = true, valueLabel, placeholder = "—", recommended, why, onSave,
}: {
  /** Dezentes graues Icon links (schlichtes Lucide-Icon, kein farbiger Kreis). */
  icon?: ReactNode;
  /** Satz-Teil VOR dem Wert. */
  before: string;
  /** Satz-Teil NACH dem Wert (z.B. „Tagen"). */
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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState(false);

  const shown = value == null ? placeholder : valueLabel ? valueLabel(value) : `${value}${unit ? ` ${unit}` : ""}`;
  const rangeHint = `${min}–${max}${unit ? ` ${unit}` : ""}`;

  const openWith = (o: boolean) => {
    setOpen(o);
    if (o) { setDraft(value != null ? String(value) : ""); setErr(false); }
  };
  const commit = async () => {
    const n = Number(draft);
    if (draft.trim() === "" || Number.isNaN(n) || n < min || n > max) { setErr(true); return; }
    setErr(false);
    setOpen(false);
    await onSave(n);
  };

  const canReset = canEdit && recommended != null && value !== recommended;

  return (
    <div className="group/rule flex items-baseline gap-1.5 flex-wrap py-2 text-[13px] text-text-body">
      {icon && <span className="text-text-muted self-center shrink-0">{icon}</span>}
      <span>{before}</span>
      {canEdit ? (
        <Popover open={open} onOpenChange={openWith}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center rounded-[7px] bg-app-bg border border-transparent px-2 py-0.5 text-[13px] font-medium text-[var(--sherloq-primary)] hover:bg-app-surface hover:border-border transition-colors cursor-pointer"
            >
              {shown}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" portal={false} className="w-52 p-3">
            <input
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              step={step}
              value={draft}
              autoFocus
              aria-label={`${before} ${after ?? ""}`.trim()}
              onChange={(e) => { setDraft(e.target.value); setErr(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") void commit(); if (e.key === "Escape") setOpen(false); }}
              className="w-full rounded-[8px] bg-app-bg border border-border px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-sherloq-primary"
            />
            <div className={`typo-subline mt-1 ${err ? "text-signal-urgent" : "text-text-muted"}`}>{rangeHint}</div>
            <div className="flex justify-end gap-2 mt-2.5">
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" size="sm" onClick={() => void commit()}>
                {t("common.save")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <span className="inline-flex items-center rounded-[7px] bg-app-bg px-2 py-0.5 text-[13px] font-medium text-text-primary">
          {shown}
        </span>
      )}
      {after && <span>{after}</span>}

      {/* Reset-pro-Regel + „Warum?" — dezent, erst bei Hover/Fokus sichtbar. */}
      {(canReset || why) && (
        <span className="self-center inline-flex items-center gap-0.5 opacity-0 group-hover/rule:opacity-100 focus-within:opacity-100 transition-opacity">
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
