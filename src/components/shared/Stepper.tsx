/**
 * Stepper — horizontaler Wizard-Fortschritt (wiederverwendbar, nicht import-spezifisch).
 *
 * Verhalten: die Verbindungslinie „wächst" animiert zum aktuellen Punkt (width-Transition), und der
 * gerade erreichte Kreis macht einen kurzen „Pop". Beim Zurückgehen läuft dieselbe Transition
 * spiegelverkehrt (die Linie zieht sich zurück, der neue Zielpunkt poppt). Reine CSS-Animation
 * (Klassen in index.css: `.stepper-fill`, `.stepper-dot-active`, `@keyframes stepper-pop`,
 * respektiert `prefers-reduced-motion`). Kein zusätzlicher State — der Pop wird über einen
 * React-`key`-Remount ausgelöst, sobald ein Punkt aktiv wird.
 *
 * Props: `steps` (Label je Schritt) · `current` (1-basiert). Werte/Farben kommen aus CSS-Tokens.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stepper({ steps, current }: { steps: readonly { label: string }[]; current: number }) {
  const pct = steps.length > 1 ? ((current - 1) / (steps.length - 1)) * 100 : 0;
  return (
    <div className="max-w-3xl mx-auto flex items-center justify-between relative px-4">
      {/* Spur + wachsende Füllung */}
      <div className="absolute left-0 top-4 w-full h-0.5 bg-border -z-10" />
      <div className="stepper-fill absolute left-0 top-4 h-0.5 bg-[var(--sherloq-primary)] -z-10" style={{ width: `${pct}%` }} />

      {steps.map((step, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={num} className="flex flex-col items-center gap-2 bg-app-bg px-2">
            {/* key wechselt beim Aktiv-Werden → Remount → Pop-Animation läuft erneut. */}
            <div
              key={active ? "active" : "idle"}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2",
                active && "stepper-dot-active border-[var(--sherloq-primary)] bg-[var(--sherloq-primary)] text-on-accent",
                done && "border-[var(--sherloq-primary)] bg-[var(--sherloq-primary)] text-on-accent",
                !active && !done && "border-border-strong bg-app-surface text-text-muted",
              )}
            >
              {done ? <Check className="w-4 h-4" /> : num}
            </div>
            <span className={cn(
              "typo-field-label",
              active ? "text-[var(--sherloq-primary)]" : done ? "text-text-body" : "text-text-muted",
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
