/**
 * VollKommunikationZeitstrahl — „Zeitstrahl"-Karte der Vollansicht (Kommunikation-Tab),
 * inkl. Filter-Pills. Extrahiert aus features/hunter/ScreenVollansicht.tsx (1:1).
 */
import { Mail, Phone, Square } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

const comms = [
  {
    title: "LinkedIn Nachricht", badge: "Inbound", date: "28. Mai 2026 · vor 2h",
    content: "Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard aufbaut! Würde gern mehr über eure Sherloq-Integration erfahren und ob das auch für unser Team passen könnte.",
    sentiment: "Positiv", actions: ["Antworten mit AI", "Vollständig lesen"], actionPrimary: 0,
    iconBg: "bg-[var(--signal-info-bg)]", iconColor: "text-[var(--signal-info-text)]", Icon: LinkedinIcon,
  },
  {
    title: "Discovery Call & Demo", badge: "Meeting", badgeColor: "bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]",
    date: "23. Mai 2026 · vor 5 Tagen",
    content: "Starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen. Max möchte ROI-Dokument sehen. Nächster Schritt: Proposal bis Ende Mai.",
    sentiment: "Positiv", actions: ["Transkript", "AI-Zusammenfassung"], actionPrimary: -1,
    iconBg: "bg-[var(--app-bg)] border border-[var(--border-strong)]", iconColor: "text-[var(--text-body)]", Icon: Square,
  },
  {
    title: "Angebot: ROI-Dokument", badge: "Outbound", badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
    date: "20. Mai 2026 · vor 8 Tagen",
    content: "Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise. Ich freue mich auf Ihr Feedback und stehe für Rückfragen gerne zur Verfügung.",
    sentiment: "Neutral", sentimentColor: "bg-app-bg text-text-muted", actions: ["Email lesen", "Antworten"], actionPrimary: 1,
    iconBg: "bg-[var(--signal-info-text)]", iconColor: "text-on-accent", Icon: Mail,
  },
  {
    title: "Telefon Call — Erstgespräch", badge: "Outbound", badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
    date: "16. Mai 2026 · vor 12 Tagen",
    content: "Interesse an Analytics-Modul. Fragt nach Enterprise-Konditionen. Sehr offenes Gespräch, gutes Bauchgefühl.",
    sentiment: "Positiv", actions: ["Notizen lesen"], actionPrimary: -1,
    iconBg: "bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]", iconColor: "text-[var(--signal-warn-text)]", Icon: Phone,
  },
  {
    title: "Erste Kontaktaufnahme", badge: "Outbound", badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
    date: "7. Mai 2026 · vor 21 Tagen",
    content: "Hallo Herr Krause, ich habe Ihren Beitrag über Sales Intelligence gelesen und wollte mich kurz vorstellen...",
    sentiment: "Neutral", sentimentColor: "bg-app-bg text-text-muted", actions: [] as string[], actionPrimary: -1,
    iconBg: "bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]", iconColor: "", Icon: Mail,
  },
];

export default function VollKommunikationZeitstrahl() {
  return (
    <div className="bg-app-surface rounded-[12px] p-6 shadow-sm border border-[var(--border)]">
      <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
        <Square className="w-4 h-4 text-[var(--icon-muted)]" /> ZEITSTRAHL
      </h2>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-[var(--border)] pb-6">
        <button className="px-4 py-1.5 rounded-full border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] font-semibold text-[14px]">Alle</button>
        {[
          { icon: <Square className="w-3.5 h-3.5" />, label: "Email" },
          { icon: <span className="font-bold text-[12px]">in</span>, label: "LinkedIn" },
          { icon: <Square className="w-3.5 h-3.5" />, label: "Phone" },
          { icon: <Square className="w-3.5 h-3.5" />, label: "Teams" },
          { icon: <Square className="w-3.5 h-3.5" />, label: "Meeting" },
        ].map((btn, i) => (
          <button key={i} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-[var(--text-body)] font-semibold text-[14px] hover:bg-[var(--app-bg)]">
            <div className="text-[var(--text-muted)] flex items-center justify-center">{btn.icon}</div>
            {btn.label}
          </button>
        ))}
      </div>

      <div className="relative pl-6 border-l-2 border-[var(--border)] flex flex-col gap-10 pb-4 ml-6">
        {comms.map((comm, idx) => (
          <div key={idx} className="relative">
            <div className={`absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl flex items-center justify-center ${comm.iconBg} ${comm.iconColor} shadow-sm z-10`}>
              <comm.Icon className="w-5 h-5 fill-current" />
            </div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--text-primary)] text-[16px]">{comm.title}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${comm.badgeColor || "bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]"}`}>{comm.badge}</span>
              </div>
              <span className="text-[13px] font-medium text-[var(--text-muted)]">{comm.date}</span>
            </div>
            <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%] leading-relaxed">{comm.content}</p>
            <div className="flex items-center gap-4">
              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${comm.sentimentColor || "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]"}`}>{comm.sentiment}</span>
              {comm.actions.length > 0 && (
                <div className="flex items-center gap-2">
                  {comm.actions.map((act, i) => (
                    <button key={i} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${i === comm.actionPrimary ? "bg-[var(--sherloq-primary)] text-on-accent border-[var(--sherloq-primary)] hover:opacity-90" : "bg-app-surface text-[var(--text-primary)] border-[var(--border-strong)] hover:bg-[var(--app-bg)]"}`}>
                      {i === comm.actionPrimary ? <Square className="w-3.5 h-3.5 opacity-80" /> : <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
