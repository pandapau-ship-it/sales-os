/**
 * StageBadge — zentrales Stage-Badge (nur Text).
 * Design (Pflicht): kein Border · leichter grauer Hintergrund (Token 10% Opacity) ·
 * Text font-medium · rounded-full · nur index.css-Tokens.
 */
export default function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium text-text-body w-fit truncate max-w-full"
      style={{ background: "color-mix(in srgb, var(--text-muted) 12%, transparent)" }}
    >
      {stage}
    </span>
  );
}
