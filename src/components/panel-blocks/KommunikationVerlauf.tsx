/**
 * KommunikationVerlauf — Kommunikations-Tab (820px-Panel + Vollansicht): vertikaler, grün
 * verbundener Zeitstrahl der manuell protokollierten Touchpoints dieses Kontakts (echte
 * `communications`-Rows via getContactCommunications → communicationToView). Jeder Eintrag:
 * kanal-spezifische Node-Optik (Icon + Farb-Ton), Kanal-Label, Richtungs-Badge
 * (Ausgehend/Eingehend), relative Zeit, optionale Notiz. Keine Einträge → ehrlich leerer
 * Zustand mit CTA „Ersten Kontakt protokollieren" — KEIN Mock.
 * (≠ AktivitaetsVerlauf = System-/CRUD-Audit. Automatische Touchpoints via Nango/P7 später.)
 */
import { Mail, Phone, Calendar, ArrowUpRight, ArrowDownLeft, MessageSquarePlus, Plus, type LucideIcon } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import type { CommunicationView, CommunicationChannel } from "@/lib/hunterMappers";

// Markante Optik je Kanal (Label · Akzentfarbe). Tokens-only → Dark-Mode-/Audit-sicher.
const CHANNEL: Record<CommunicationChannel, { label: string; accent: string }> = {
  email:    { label: "E-Mail",   accent: "var(--channel-email)" },
  linkedin: { label: "LinkedIn", accent: "var(--channel-linkedin)" },
  call:     { label: "Anruf",    accent: "var(--channel-call)" },
  meeting:  { label: "Meeting",  accent: "var(--sherloq-primary)" },
};
// LinkedIn ist eine Brand-Glyphe (kein lucide-Icon) → eigener Render-Pfad.
const LUCIDE: Partial<Record<CommunicationChannel, LucideIcon>> = { email: Mail, call: Phone, meeting: Calendar };
function ChannelGlyph({ channel, className }: { channel: CommunicationChannel; className?: string }) {
  if (channel === "linkedin") return <LinkedinIcon className={className} />;
  const Icon = LUCIDE[channel] ?? Mail;
  return <Icon className={className} strokeWidth={2} />;
}

// „vor X" aus einem ISO-Timestamp — rein relativ, keine erfundenen Werte.
function relTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.round(h / 24);
  if (d === 1) return "gestern";
  if (d < 30) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function KommunikationVerlauf({
  items = [],
  onLog,
}: {
  items?: CommunicationView[];
  onLog?: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <span className="typo-section-label text-text-muted">Kommunikationsverlauf</span>
        {items.length > 0 && onLog && (
          <button
            type="button"
            onClick={onLog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] text-[11px] font-bold hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Protokollieren
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-app-surface rounded-[12px] p-8 border border-border shadow-sm text-center">
          <MessageSquarePlus className="w-6 h-6 mx-auto text-text-muted mb-2" />
          <p className="text-[12px] text-text-muted mb-4">Noch keine Kommunikation protokolliert.</p>
          {onLog && (
            <button
              type="button"
              onClick={onLog}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[12px] font-bold hover:bg-[var(--sherloq-primary-hover)] transition-colors cursor-pointer"
            >
              Ersten Kontakt protokollieren →
            </button>
          )}
        </div>
      ) : (
        <ol className="relative">
          {items.map((item, idx) => {
            const meta = CHANNEL[item.channel];
            const out = item.direction === "outbound";
            const isLast = idx === items.length - 1;
            return (
              <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Durchgehende grüne Zeitstrahl-Linie (Node → nächster Node) */}
                {!isLast && (
                  <span className="absolute left-[21px] top-[40px] bottom-0 w-[2px] bg-[var(--accent-teal)]" aria-hidden="true" />
                )}

                {/* Node — kanal-getönte Icon-Kachel */}
                <span
                  className="relative z-10 shrink-0 w-11 h-11 rounded-[12px] shadow-sm inline-flex items-center justify-center bg-app-surface border border-border"
                  style={{ color: meta.accent }}
                >
                  <ChannelGlyph channel={item.channel} className="w-5 h-5" />
                </span>

                {/* Karte */}
                <div className="flex-1 min-w-0 pb-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold uppercase tracking-wide"
                        style={{ color: meta.accent, background: `color-mix(in srgb, ${meta.accent} 12%, transparent)` }}
                      >
                        {meta.label}
                      </span>
                      {/* Manuell-Badge: gilt aktuell für alle communications-Einträge (Nango/Auto kommt später). */}
                      <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold uppercase tracking-wide text-text-muted bg-app-bg">
                        Manuell
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                        {out ? <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> : <ArrowDownLeft className="w-3 h-3" strokeWidth={2.5} />}
                        {out ? "Ausgehend" : "Eingehend"}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-text-muted shrink-0">{relTime(item.occurredAt)}</span>
                  </div>

                  {item.note && (
                    <p className="mt-2 rounded-[10px] border border-border bg-app-surface px-3.5 py-3 text-[12px] text-text-body leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
