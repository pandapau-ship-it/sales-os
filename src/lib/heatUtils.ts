/**
 * Shared heat status color utility.
 * Single source of truth for all Heat badge styles — used by
 * ScreenHunting, ScreenFarming, CustomerDrawer, and any future component.
 *
 * Labels & Dot-Farbe kommen aus HEAT_STATUS (src/lib/constants.ts).
 * bg/text/border referenzieren CSS-Tokens aus index.css — niemals hier hardcoden.
 */
import { HEAT_STATUS, HEAT_KEY_BY_STATUS, type HeatStatusKey } from "@/lib/constants";
import type { HeatStatus } from "@/types";

export interface HeatColorResult {
  bg: string; // Tailwind bg class
  text: string; // Tailwind text class
  border: string; // Tailwind border class
  dot: string; // CSS color value für den Dot-Kreis (style={{ background }})
  label: string; // kanonisches Label aus HEAT_STATUS
}

// Pro Heat-Key abgestimmte bg/text/border-Klassen (Farbe = HEAT_STATUS[key].color).
const STYLE: Record<HeatStatusKey, { bg: string; text: string; border: string }> = {
  engaged: { bg: "bg-[var(--signal-success-bg)]", text: "text-[var(--color-success)]",      border: "border-[var(--color-success)]/15" },
  warm:    { bg: "bg-[var(--signal-warn-bg)]",    text: "text-[var(--color-warning-soft)]", border: "border-[var(--color-warning-soft)]/20" },
  cooling: { bg: "bg-[var(--signal-warm-bg)]",    text: "text-[var(--color-warning)]",      border: "border-[var(--color-warning)]/20" },
  cold:    { bg: "bg-[var(--signal-info-bg)]",    text: "text-[var(--color-info)]",         border: "border-[var(--color-info)]/15" },
  gone:    { bg: "bg-app-bg",                     text: "text-[var(--color-muted)]",        border: "border-border" },
};

export function getHeatColor(status: string): HeatColorResult {
  const key = HEAT_KEY_BY_STATUS[status as HeatStatus] ?? "gone";
  return { ...STYLE[key], dot: HEAT_STATUS[key].color, label: HEAT_STATUS[key].label };
}
