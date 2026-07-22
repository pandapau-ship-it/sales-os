/**
 * ValueChip — EIN geteilter, hervorgehobener „anklickbarer Wert" (SET-4a).
 *
 * Die editierbare Wert-Kachel der Regeln-Seite: eine Box mit der Zahl (+ optionaler Einheit), klar als
 * anklickbar/editierbar erkennbar und ÜBER ALLE GRUPPEN einheitlich. Klick (nur mit Recht) öffnet einen
 * kleinen shadcn-Popover mit Zahlen-Eingabe + Min/Max-Hinweis; Fokus-Look = eine saubere Rahmenlinie
 * (Kontakte-Standard, KEIN Ring). Validierung doppelt: hier (UX-Bereich [min,max]) UND serverseitig in
 * `update_settings`. Das Schreiben macht der Aufrufer über `onSave` (→ `updateSettings`, EIN Weg).
 *
 * Extrahiert aus `RuleRow` (Single Source des Chips) — genutzt von `RuleRow` UND `HeatThresholdTile`,
 * damit die Hervorhebung/Interaktion überall identisch ist. Tokens-only, i18n, dark-mode automatisch.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/** Akzent-Ton des Werts (trägt echte Bedeutung: neutral / Risiko / Chance). */
export type ChipTone = "primary" | "urgent" | "success";

const ACCENT: Record<ChipTone, string> = {
  primary: "var(--sherloq-primary)",
  urgent: "var(--signal-urgent-text)",
  success: "var(--signal-success-text)",
};

export default function ValueChip({
  value, unit, min, max, step = 1, canEdit = true, valueLabel, placeholder = "—",
  ariaLabel, tone = "primary", align = "start", onSave,
}: {
  value: number | null;
  /** Einheit hinter der Zahl (z.B. „Tage", „%") — dezent, nie im Akzent. */
  unit?: string;
  min: number;
  max: number;
  step?: number;
  canEdit?: boolean;
  /** Optionale eigene Wert-Darstellung (z.B. Zahl → Label). */
  valueLabel?: (v: number) => string;
  placeholder?: string;
  ariaLabel?: string;
  tone?: ChipTone;
  align?: "start" | "center" | "end";
  onSave: (v: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState(false);

  const accent = ACCENT[tone];
  const rangeHint = `${min}–${max}${unit ? ` ${unit}` : ""}`;

  // Zahl im Akzent, Einheit dezent — außer eine eigene valueLabel-Darstellung ist gesetzt.
  const inner =
    value == null ? (
      <span className="text-text-muted">{placeholder}</span>
    ) : valueLabel ? (
      <span style={{ color: accent }}>{valueLabel(value)}</span>
    ) : (
      <>
        <span style={{ color: accent }}>{value}</span>
        {unit && (
          <>
            {" "}
            <span className="text-text-muted font-normal">{unit}</span>
          </>
        )}
      </>
    );

  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-1 rounded-[7px] bg-app-bg border border-border px-2.5 py-0.5 text-[13px] font-semibold">
        {inner}
      </span>
    );
  }

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

  return (
    <Popover open={open} onOpenChange={openWith}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex items-center gap-1 rounded-[7px] bg-app-bg border border-border px-2.5 py-0.5 text-[13px] font-semibold hover:bg-app-surface transition-colors cursor-pointer"
          style={{ borderColor: open ? accent : undefined }}
        >
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} portal={false} className="w-52 p-3">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          autoFocus
          aria-label={ariaLabel}
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
  );
}
