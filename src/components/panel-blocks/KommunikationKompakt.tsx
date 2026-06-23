/**
 * KommunikationKompakt — kompakter „Letzter Kontakt"-Block für den Übersicht-Tab: zeigt die
 * 3 neuesten protokollierten Touchpoints (echte `communications`-Rows via communicationToView).
 * Pro Zeile: kanal-getöntes Icon · Kanal-Label · Richtung · relative Zeit. „Alle anzeigen →"
 * springt in den vollen Kommunikations-Tab. Keine Einträge → der Aufrufer rendert den Block
 * gar nicht (Honesty: leerer Block wird ausgeblendet, kein „—").
 */
import { Mail, Phone, Calendar, type LucideIcon } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import type { CommunicationView, CommunicationChannel } from "@/lib/hunterMappers";

const CHANNEL: Record<CommunicationChannel, { label: string; accent: string }> = {
  email:    { label: "E-Mail",   accent: "var(--channel-email)" },
  linkedin: { label: "LinkedIn", accent: "var(--channel-linkedin)" },
  call:     { label: "Anruf",    accent: "var(--channel-call)" },
  meeting:  { label: "Meeting",  accent: "var(--sherloq-primary)" },
};
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
  // Zukunft (geplanter Touchpoint) → „Ausstehend" + exaktes Datum/Uhrzeit.
  // Ist der Zeitpunkt erreicht (diff >= 0), greift automatisch die relative Anzeige.
  if (diff < 0) {
    return `Ausstehend · ${new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  }
  const min = Math.round(diff / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.round(h / 24);
  if (d === 1) return "gestern";
  if (d < 30) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

// Erste Zeile der Notiz, auf 60 Zeichen gekürzt (+ „…"). Leer → null (kein Block).
function noteSnippet(note?: string): string | null {
  const first = (note ?? "").split("\n")[0].trim();
  if (!first) return null;
  return first.length > 60 ? `${first.slice(0, 60)}…` : first;
}

export default function KommunikationKompakt({
  items,
  onShowAll,
}: {
  items: CommunicationView[];
  onShowAll?: () => void;
}) {
  if (items.length === 0) return null; // Honesty: leerer Block wird nicht gerendert
  const top = items.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="typo-section-label text-text-muted">Letzter Kontakt</span>
        {onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer"
          >
            Alle anzeigen →
          </button>
        )}
      </div>

      <div className="bg-app-surface rounded-[12px] p-2 border border-[var(--border-card)] divide-y divide-[var(--border-subtle)]">
        {top.map((item) => {
          const meta = CHANNEL[item.channel];
          return (
            <div key={item.id} className="flex items-start gap-3 px-2 py-2.5">
              <span
                className="shrink-0 mt-0.5 w-8 h-8 rounded-[10px] inline-flex items-center justify-center bg-app-bg border border-border"
                style={{ color: meta.accent }}
              >
                <ChannelGlyph channel={item.channel} className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[12px] text-text-body">
                  <span className="font-bold text-text-primary">{meta.label}</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-muted">{item.direction === "outbound" ? "Ausgehend" : "Eingehend"}</span>
                </div>
                {/* Notiz-Vorschau (erste Zeile, gekürzt) — nur wenn vorhanden (Honesty). */}
                {noteSnippet(item.note) && (
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{noteSnippet(item.note)}</p>
                )}
              </div>
              <span className="shrink-0 mt-0.5 text-[11px] font-medium text-text-muted">{relTime(item.occurredAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
