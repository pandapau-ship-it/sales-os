/**
 * Zentrale Heat-Status-Definition — kanonische Labels, Farben (als CSS-Tokens) &
 * Zeitfenster. Quelle der Wahrheit für ALLE Heat-Badges in der App.
 * Farben kommen aus src/index.css (--color-*). Niemals Hex/Hardcoding in Components.
 */
import type { HeatStatus } from "@/types";

export const HEAT_STATUS = {
  engaged: { label: "Engaged", color: "var(--color-success)", days: "0–3" },
  warm: { label: "Warm", color: "var(--color-warning-soft)", days: "4–7" },
  cooling: { label: "Cooling", color: "var(--color-warning)", days: "8–14" },
  cold: { label: "Cold", color: "var(--color-info)", days: "15–30" },
  gone: { label: "Gone", color: "var(--color-muted)", days: "31+" },
} as const;

export type HeatStatusKey = keyof typeof HEAT_STATUS;

/** Bridge: bestehendes Daten-Enum (HOT/WARM/LUKEWARM/COLD/DEAD) → neue Keys. */
export const HEAT_KEY_BY_STATUS: Record<HeatStatus, HeatStatusKey> = {
  HOT: "engaged",
  WARM: "warm",
  LUKEWARM: "cooling",
  COLD: "cold",
  DEAD: "gone",
};

/** Heat-Definition (Label · Farbe · Zeitfenster) für einen Daten-Status. */
export const heatFor = (status: HeatStatus | string) =>
  HEAT_STATUS[HEAT_KEY_BY_STATUS[status as HeatStatus] ?? "gone"];
