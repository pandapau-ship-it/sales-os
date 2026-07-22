/**
 * HeatThresholdTile — EINE farbige Heat-Stufen-Kachel der Regeln-Seite (SET-4a, Gruppe 1).
 *
 * Struktur (Referenz-Vorlage): oben ein getöntes Stufen-Label (links) + Lucide-Icon & Status-Wort
 * (rechts, in der Heat-Farbe) · darunter „Gilt als … bis" · darunter der editierbare Tage-`ValueChip`.
 * Die letzte Stufe („Gone") ist abgeleitet → `readOnlyText` statt Chip.
 *
 * FARB-BEDEUTUNG (bewusste Ausnahme): die Heat-Farben tragen echte Bedeutung und kommen AUSSCHLIESSLICH
 * aus unseren Tokens (`HEAT_STATUS[key].color` → `--color-*`), nie als Hex. Hintergrund = dieselbe Farbe,
 * sehr hell getönt (`color-mix`), dark-mode automatisch. Prop-driven, tokens-only, i18n.
 */
import { type ReactNode } from "react";
import ValueChip from "./ValueChip";

export default function HeatThresholdTile({
  color, label, statusWord, icon, caption,
  value, unit, min, max, step, canEdit, onSave, readOnlyText, ariaLabel,
}: {
  /** Heat-Farb-Token (z.B. `HEAT_STATUS.engaged.color`). */
  color: string;
  /** Getöntes Stufen-Label (z.B. „ENGAGED"). */
  label: string;
  /** Status-Wort rechts (z.B. „Hochaktiv"). */
  statusWord: string;
  /** Lucide-Icon (wird in der Heat-Farbe eingefärbt). */
  icon: ReactNode;
  /** Zeile „Gilt als … bis". */
  caption: string;
  value?: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  canEdit?: boolean;
  onSave?: (v: number) => void | Promise<void>;
  /** Abgeleitete Stufe (Gone) → statischer Text statt Chip. */
  readOnlyText?: string;
  ariaLabel?: string;
}) {
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

  return (
    <div
      className="flex-1 min-w-0 rounded-[12px] border p-4"
      style={{ borderColor: tint(28), background: tint(6) }}
    >
      {/* Kopf: getöntes Label (links) + Icon & Status-Wort in Heat-Farbe (rechts) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className="rounded-[7px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: tint(14), color }}
        >
          {label}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color }}>
          <span className="shrink-0">{icon}</span>
          {statusWord}
        </span>
      </div>

      <p className="typo-subline text-text-muted mb-2">{caption}</p>

      {readOnlyText ? (
        <span className="inline-flex items-center gap-1 rounded-[7px] bg-app-bg border border-border px-2.5 py-0.5 text-[13px] font-semibold text-text-body">
          {readOnlyText}
        </span>
      ) : (
        value != null && onSave && (
          <ValueChip
            value={value} unit={unit} min={min ?? 1} max={max ?? 365} step={step}
            canEdit={canEdit} ariaLabel={ariaLabel} onSave={onSave}
          />
        )
      )}
    </div>
  );
}
