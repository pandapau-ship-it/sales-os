/**
 * HeatBadge — zentrales Heat-Status-Badge. Quelle: HEAT_STATUS (lib/constants.ts).
 * Design (Pflicht): kein Border · Hintergrund = Farbe 10% Opacity · Dot 8px volle Farbe ·
 * Text gleiche Farbe wie Dot, font-medium · rounded-full · nur index.css-Tokens.
 * Akzeptiert die neuen Keys (engaged…) ODER das Daten-Enum (HOT/WARM/…).
 */
import { HEAT_STATUS, HEAT_KEY_BY_STATUS, type HeatStatusKey } from "@/lib/constants";
import type { HeatStatus } from "@/types";

function resolve(status: HeatStatusKey | HeatStatus) {
  const key = status in HEAT_STATUS
    ? (status as HeatStatusKey)
    : (HEAT_KEY_BY_STATUS[status as HeatStatus] ?? "gone");
  return HEAT_STATUS[key];
}

export default function HeatBadge({ status }: { status: HeatStatusKey | HeatStatus }) {
  const heat = resolve(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium w-fit"
      style={{ background: `color-mix(in srgb, ${heat.color} 10%, transparent)`, color: heat.color }}
    >
      <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: heat.color }} />
      {heat.label}
    </span>
  );
}
