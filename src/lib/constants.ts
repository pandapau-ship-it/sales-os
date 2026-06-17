/**
 * Zentrale Heat-Status-Definition — kanonische Labels, Farben (als CSS-Tokens) &
 * Zeitfenster. Quelle der Wahrheit für ALLE Heat-Badges in der App.
 * Farben kommen aus src/index.css (--color-*). Niemals Hex/Hardcoding in Components.
 */
import type { HeatStatus } from "@/types";
import {
  Eye, ThumbsUp, MessageSquare, Briefcase, TrendingUp, Banknote, Cpu, Zap,
  type LucideIcon,
} from "lucide-react";

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

/**
 * Signal-Typ → Metadaten: Kanal-Label-i18n-Key + Icon (Lucide). Statisch.
 * Text-Templates liegen in i18n (`hunter.signals.types.*`), Window-Werte in
 * `settings.signal_windows`. Keine Farben hier — Badge nutzt bestehende Tokens.
 * Quelle für den (künftig datengetriebenen) Signals-Tab.
 */
export const SIGNAL_TYPE_META: Record<string, { channelLabelKey: string; icon: LucideIcon }> = {
  linkedin_profile_view:   { channelLabelKey: "hunter.signals.channel.linkedin", icon: Eye },
  linkedin_post_liked:     { channelLabelKey: "hunter.signals.channel.linkedin", icon: ThumbsUp },
  linkedin_post_commented: { channelLabelKey: "hunter.signals.channel.linkedin", icon: MessageSquare },
  job_change:              { channelLabelKey: "hunter.signals.channel.other",    icon: Briefcase },
  company_growth:          { channelLabelKey: "hunter.signals.channel.other",    icon: TrendingUp },
  funding_round:           { channelLabelKey: "hunter.signals.channel.other",    icon: Banknote },
  tech_change:             { channelLabelKey: "hunter.signals.channel.other",    icon: Cpu },
  custom:                  { channelLabelKey: "hunter.signals.channel.other",    icon: Zap },
};

/** Meta für einen signal_type inkl. Fallback auf `custom` bei unbekanntem Typ. */
export const signalMetaFor = (signalType: string | undefined) =>
  SIGNAL_TYPE_META[signalType ?? "custom"] ?? SIGNAL_TYPE_META.custom;
