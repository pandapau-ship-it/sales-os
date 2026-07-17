/**
 * LeadSourceBadge — Herkunft eines Kontakts (contacts.lead_source) als Badge (K-3 Kontakte-Liste).
 * Muster wie StatusBadge: leichter Tint + Lucide-Icon (kein Emoji), Border nur /15. Tokens-only.
 * Unbekannte/leere Quelle → null (Honesty, keine Badge).
 */
import { Download, Sparkles, RefreshCw, PenLine, Webhook, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type SourceCfg = { icon: LucideIcon; tone: string };

// tone = CSS-Token-Farbe (text + border via /15 + bg /8). Quelle: contacts.lead_source.
// Label kommt aus i18n (kontakte.leadSource.*) — nie hartkodiert.
const SOURCE: Record<string, SourceCfg> = {
  sherloq: { icon: Sparkles, tone: "var(--sherloq-primary)" },
  csv_upload: { icon: Download, tone: "var(--color-info)" },
  crm_sync: { icon: RefreshCw, tone: "var(--color-info)" },
  manual: { icon: PenLine, tone: "var(--text-muted)" },
  webhook_api: { icon: Webhook, tone: "var(--text-muted)" },
};

export default function LeadSourceBadge({ source }: { source?: string | null }) {
  const { t } = useTranslation();
  const cfg = source ? SOURCE[source] : undefined;
  if (!cfg || !source) return null;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11px] font-medium border w-fit"
      style={{ color: cfg.tone, borderColor: `color-mix(in srgb, ${cfg.tone} 15%, transparent)`, background: `color-mix(in srgb, ${cfg.tone} 8%, transparent)` }}
    >
      <Icon className="w-3 h-3" />
      {t(`kontakte.leadSource.${source}`)}
    </span>
  );
}
