/**
 * WeightEditor — Gewichte-Editor für additive Score-Signale (Churn/Upsell, SET-4a).
 *
 * Je messbarem Signal EINE Zeile: An/Aus (`Switch`) + Gewicht (`Slider` 0–max) + Zahl.
 *
 * EHRLICHE Darstellung (bewusste Entscheidung): Der Score wird auf 0–100 NORMALISIERT
 * (`earned/available*100` in score-churn-risk/score-upsell) — die Roh-Gewicht-Summe wird NIE
 * mit der Schwelle verglichen. Deshalb zeigen wir die Gewichte als RELATIVE WICHTIGKEIT
 * (Anteils-Balken je aktivem Signal), NICHT als „Fortschritt bis Schwelle" und ohne „über 100".
 * Die Warn-Schwelle + (read-only) Level-Bänder rendert der Aufrufer SEPARAT (RuleRow + StatusBadge).
 *
 * Nicht messbare / externe Signale werden ausgegraut mit ehrlichem Grund gelistet
 * („noch nicht gemessen" bzw. „Integration nötig") — nicht editierbar, zählen nicht mit.
 *
 * Prop-driven, tokens-only. Schreiben über `onWeightChange`/`onActiveToggle` (→ `updateSettings`).
 */
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

/** Messbares, editierbares Signal (Key = settings-Signal-Key, z.B. „last_contact"). */
export interface EditableSignal {
  key: string;
  label: string;
  weight: number;
  active: boolean;
}
/** Nicht editierbares Signal: entweder ohne Datenbasis oder externe Integration nötig. */
export interface InactiveSignal {
  label: string;
  reason: "not_measured" | "integration";
}

/** Slider-Obergrenze (UI-Wahl; der RPC erlaubt bis 1000 als Guardrail). */
export const WEIGHT_MAX = 50;

export default function WeightEditor({
  signals, inactiveSignals = [], canEdit = true, max = WEIGHT_MAX,
  onWeightChange, onActiveToggle,
}: {
  signals: EditableSignal[];
  inactiveSignals?: InactiveSignal[];
  canEdit?: boolean;
  max?: number;
  onWeightChange: (key: string, weight: number) => void;
  onActiveToggle: (key: string, active: boolean) => void;
}) {
  const { t } = useTranslation();
  const activeSignals = signals.filter((s) => s.active);
  const total = activeSignals.reduce((a, s) => a + s.weight, 0);

  return (
    <div className="space-y-3">
      {/* Signal-Zeilen: Switch + Label + Slider + Gewicht-Zahl */}
      <div className="space-y-1.5">
        {signals.map((s) => (
          <div
            key={s.key}
            className={`flex items-center gap-3 rounded-[10px] border border-border px-3 py-2 transition-colors ${
              s.active ? "bg-app-surface" : "bg-app-bg opacity-60"
            }`}
          >
            <Switch
              checked={s.active}
              disabled={!canEdit}
              onCheckedChange={(v) => onActiveToggle(s.key, v)}
              aria-label={s.label}
            />
            <span
              className={`typo-subline flex-1 min-w-0 truncate ${
                s.active ? "text-text-body" : "text-text-muted line-through"
              }`}
            >
              {s.label}
            </span>
            <Slider
              className="w-24 shrink-0"
              min={0}
              max={max}
              step={1}
              value={[s.weight]}
              disabled={!canEdit || !s.active}
              onValueChange={(v) => onWeightChange(s.key, v[0])}
              aria-label={t("settings.rules.weightFor", { signal: s.label })}
            />
            <span
              className={`w-8 text-right typo-chip tabular-nums shrink-0 ${
                s.active ? "text-[var(--sherloq-primary)]" : "text-text-muted"
              }`}
            >
              {s.weight}
            </span>
          </div>
        ))}
      </div>

      {/* Ehrliche „relative Wichtigkeit": Anteils-Balken (Segment je aktivem Signal) + Hinweis. */}
      <div className="rounded-[10px] bg-app-bg border border-border px-3 py-2.5">
        <div className="flex h-2 rounded-full overflow-hidden bg-border">
          {activeSignals.length > 0 && total > 0
            ? activeSignals.map((s, i) => (
                <div
                  key={s.key}
                  className="h-full"
                  style={{
                    width: `${(s.weight / total) * 100}%`,
                    background: "var(--sherloq-primary)",
                    opacity: i % 2 === 0 ? 1 : 0.6,
                  }}
                  title={`${s.label}: ${Math.round((s.weight / total) * 100)}%`}
                />
              ))
            : null}
        </div>
        <p className="typo-subline text-text-muted mt-2">{t("settings.rules.weightHint")}</p>
      </div>

      {/* Nicht editierbare Signale — ausgegraut, ehrlicher Grund, nicht in der Wertung. */}
      {inactiveSignals.length > 0 && (
        <div className="space-y-1.5">
          {inactiveSignals.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[10px] bg-app-bg border border-border px-3 py-2 opacity-60 select-none cursor-not-allowed"
            >
              <span className="typo-subline text-text-muted inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                {s.label}
              </span>
              <span className="typo-chip text-text-muted shrink-0">
                {s.reason === "integration"
                  ? t("settings.rules.integrationNeeded")
                  : t("settings.rules.notMeasured")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
