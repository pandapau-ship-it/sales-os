/**
 * StatusBadge — generisches Status-Badge (z.B. „E-Mail verifiziert").
 * Design (Pflicht): kein Border · leichter Hintergrund (Signal-Token) · Icon ODER Dot + Text ·
 * rounded-full · nur index.css-Tokens (Dark-Mode automatisch). Read-only.
 */
import type { ComponentType } from "react";

type Tone = "success" | "warn" | "urgent" | "info" | "teal" | "muted";

const TONE: Record<Tone, { bg: string; text: string }> = {
  success: { bg: "var(--signal-success-bg)", text: "var(--signal-success-text)" },
  warn:    { bg: "var(--signal-warn-bg)",    text: "var(--signal-warn-text)" },
  urgent:  { bg: "var(--signal-urgent-bg)",  text: "var(--signal-urgent-text)" },
  info:    { bg: "var(--signal-info-bg)",    text: "var(--signal-info-text)" },
  teal:    { bg: "var(--signal-teal-bg)",    text: "var(--signal-teal-text)" },
  muted:   { bg: "color-mix(in srgb, var(--text-muted) 12%, transparent)", text: "var(--text-muted)" },
};

export default function StatusBadge({
  label, tone = "muted", icon: Icon,
}: { label: string; tone?: Tone; icon?: ComponentType<{ className?: string }> }) {
  const c = TONE[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium w-fit" style={{ background: c.bg, color: c.text }}>
      {Icon ? <Icon className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />}
      {label}
    </span>
  );
}
