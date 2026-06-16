/**
 * KommunikationVerlauf — voller Kommunikations-Tab (820px-Panel + Vollansicht):
 * VERTIKALER Zeitstrahl, durchgehend grün verbunden (var(--accent-teal), wie die
 * CommunicationChain), jede Station direkt aufgeklappt. Jede Karte hat eine
 * medium-spezifische Optik (E-Mail-Frame · LinkedIn-Bubble · Call-Log · Meeting-Karte
 * · Notiz). Datengetrieben über `KommunikationItem` + Default-Mock — so kann das
 * System die Touchpoints später 1:1 einspielen, ohne Layout-Änderung.
 * (≠ KommunikationPreview = kompakte Übersicht-Vorschau.)
 */
import { Phone, FileText, ArrowUpRight, ArrowDownLeft, Clock, Users } from "lucide-react";
import BrandLogo, { brandForChannel } from "@/components/shared/BrandLogo";

type CommChannel = "email" | "linkedin" | "call" | "meeting" | "note";
type Sentiment = "positiv" | "neutral" | "negativ";

export interface KommunikationItem {
  channel: CommChannel;
  /** Marken-Varianz: Mail Outlook↔Gmail, Meeting Teams↔Google Meet. */
  variant?: boolean;
  /** out = von uns gesendet · in = empfangen. */
  direction: "in" | "out";
  title: string;
  time: string;
  sentiment?: Sentiment;
  body: string;
  // E-Mail
  from?: string;
  to?: string;
  subject?: string;
  // Call / Meeting
  duration?: string;
  participants?: string[];
}

// Markante Optik je Kanal (Label + Akzentfarbe). Tokens-only → Dark-Mode-/Audit-sicher.
const CHANNEL: Record<CommChannel, { label: string; accent: string }> = {
  email:    { label: "E-Mail",     accent: "var(--brand-outlook)" },
  linkedin: { label: "LinkedIn",   accent: "var(--channel-linkedin)" },
  call:     { label: "Telefonat",  accent: "var(--channel-call)" },
  meeting:  { label: "Video-Call", accent: "var(--channel-teams)" },
  note:     { label: "Notiz",      accent: "var(--text-muted)" },
};

const SENTIMENT: Record<Sentiment, { label: string; cls: string }> = {
  positiv: { label: "Positiv", cls: "text-[var(--signal-success-text)] bg-[var(--signal-success-bg)]" },
  neutral: { label: "Neutral", cls: "text-text-muted bg-app-bg" },
  negativ: { label: "Kritisch", cls: "text-[var(--signal-urgent-text)] bg-[var(--signal-urgent-bg)]" },
};

const DEFAULT_ITEMS: KommunikationItem[] = [
  {
    channel: "meeting", variant: false, direction: "in", title: "Discovery Call & Demo",
    time: "vor 5 Tagen", sentiment: "positiv", duration: "42 Min",
    participants: ["Max Brand", "Du", "Lena Vogt"],
    body: "Kunde zeigte starkes Interesse an Feature Y. Budget-Freeze bis Q3 offen angesprochen, fragte aktiv nach ROI-Zahlen. Nächster Schritt: ROI-Dokument nachreichen.",
  },
  {
    channel: "email", variant: false, direction: "out", title: "Angebot gesendet: ROI-Dokument",
    time: "vor 8 Tagen", sentiment: "neutral",
    from: "du@sherloq.io", to: "max.brand@payguard.io", subject: "Ihr ROI-Szenario für 8 BDRs",
    body: "Hallo Herr Brand, anbei wie besprochen das ROI-Szenario für Ihr 8-köpfiges BDR-Team. Die Amortisation liegt bei ~4 Monaten. Lassen Sie uns nächste Woche kurz die Zahlen durchgehen.",
  },
  {
    channel: "call", direction: "out", title: "Rückruf — kurze Abstimmung",
    time: "vor 10 Tagen", sentiment: "neutral", duration: "6 Min",
    body: "Kurz telefoniert: Termin für die Demo bestätigt, Teilnehmerkreis geklärt. Max bringt seine Team-Lead mit.",
  },
  {
    channel: "linkedin", direction: "in", title: "LinkedIn Nachricht",
    time: "vor 12 Tagen", sentiment: "positiv",
    body: "Hi, danke für die Vernetzung! Ich verfolge eure Updates schon eine Weile. Lass uns bald mal kurz quatschen — klingt nach einem starken Fit.",
  },
];

// Node-Visual je Kanal: Marken-Logo-Kachel (Mail/LinkedIn/Meeting) bzw. getönte
// Icon-Kachel (Call/Notiz). Immer 44×44 mit 12px-Radius → sitzt sauber auf der Linie.
function CommNode({ item }: { item: KommunikationItem }) {
  const brand = brandForChannel(
    item.channel === "meeting" ? "MEETING" : item.channel === "email" ? "EMAIL" : item.channel.toUpperCase(),
    item.variant,
  );
  if (brand) {
    return <BrandLogo name={brand} tile className="w-11 h-11 rounded-[12px] shadow-sm" />;
  }
  const Icon = item.channel === "call" ? Phone : FileText;
  return (
    <span
      className="w-11 h-11 rounded-[12px] shadow-sm inline-flex items-center justify-center bg-app-surface border border-border"
      style={{ color: CHANNEL[item.channel].accent }}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
    </span>
  );
}

// Medium-spezifischer Karten-Body. Jede Optik so, wie das Medium aussieht.
function CommBody({ item }: { item: KommunikationItem }) {
  if (item.channel === "email") {
    return (
      <div className="mt-2.5 rounded-[10px] border border-border bg-app-surface overflow-hidden">
        <div className="px-3.5 py-2.5 bg-app-bg border-b border-border space-y-0.5">
          <div className="flex gap-2 text-[11px]">
            <span className="text-text-muted w-8 shrink-0">Von</span>
            <span className="font-semibold text-text-body truncate">{item.from}</span>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="text-text-muted w-8 shrink-0">An</span>
            <span className="font-semibold text-text-body truncate">{item.to}</span>
          </div>
          {item.subject && (
            <div className="flex gap-2 text-[11px] pt-0.5">
              <span className="text-text-muted w-8 shrink-0">Betreff</span>
              <span className="font-bold text-text-primary truncate">{item.subject}</span>
            </div>
          )}
        </div>
        <p className="px-3.5 py-3 text-[12px] text-text-body leading-relaxed">{item.body}</p>
      </div>
    );
  }

  if (item.channel === "linkedin") {
    const out = item.direction === "out";
    return (
      <div className={`mt-2.5 flex ${out ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[88%] px-3.5 py-2.5 text-[12px] leading-relaxed ${
            out
              ? "rounded-[14px] rounded-br-[4px] bg-[var(--channel-linkedin)]/10 text-text-body"
              : "rounded-[14px] rounded-bl-[4px] bg-app-bg border border-border text-text-body"
          }`}
        >
          {item.body}
        </div>
      </div>
    );
  }

  if (item.channel === "call") {
    return (
      <div className="mt-2.5 rounded-[10px] border border-border bg-app-bg px-3.5 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--channel-call)]">
            <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
            {item.direction === "out" ? "Ausgehend" : "Eingehend"}
          </span>
          {item.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="w-3.5 h-3.5" /> {item.duration}
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-body leading-relaxed">{item.body}</p>
      </div>
    );
  }

  if (item.channel === "meeting") {
    return (
      <div className="mt-2.5 rounded-[10px] border border-border bg-app-bg px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          {item.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="w-3.5 h-3.5" /> {item.duration}
            </span>
          )}
          {item.participants && item.participants.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Users className="w-3.5 h-3.5" /> {item.participants.join(" · ")}
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-body leading-relaxed">{item.body}</p>
      </div>
    );
  }

  // note
  return (
    <p className="mt-2.5 rounded-[10px] border border-border bg-app-bg px-3.5 py-3 text-[12px] text-text-body leading-relaxed italic">
      {item.body}
    </p>
  );
}

export default function KommunikationVerlauf({ items = DEFAULT_ITEMS }: { items?: KommunikationItem[] }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <span className="block px-1 text-[10px] font-extrabold text-text-muted uppercase tracking-widest">
        Kommunikationsverlauf
      </span>

      <ol className="relative">
        {items.map((item, idx) => {
          const meta = CHANNEL[item.channel];
          const out = item.direction === "out";
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Durchgehende grüne Zeitstrahl-Linie (Node → nächster Node) */}
              {!isLast && (
                <span className="absolute left-[21px] top-[40px] bottom-0 w-[2px] bg-[var(--accent-teal)]" aria-hidden="true" />
              )}

              {/* Node */}
              <div className="relative z-10 shrink-0">
                <CommNode item={item} />
              </div>

              {/* Karte */}
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-[14px] font-bold text-text-primary leading-tight truncate">{item.title}</h4>
                    <span
                      className="hidden sm:inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold uppercase tracking-wide"
                      style={{ color: meta.accent, background: `color-mix(in srgb, ${meta.accent} 12%, transparent)` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-text-muted shrink-0">{item.time}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                    {out ? <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> : <ArrowDownLeft className="w-3 h-3" strokeWidth={2.5} />}
                    {out ? "Gesendet" : "Empfangen"}
                  </span>
                  {item.sentiment && (
                    <span className={`px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold uppercase tracking-wide ${SENTIMENT[item.sentiment].cls}`}>
                      {SENTIMENT[item.sentiment].label}
                    </span>
                  )}
                </div>

                <CommBody item={item} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
