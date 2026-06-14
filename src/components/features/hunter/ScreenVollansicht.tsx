import { useState } from "react";
import {
  Check,
  ChevronRight,
  Edit2,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Square,
  TriangleAlert,
  Globe,
  X,
  Sparkles
} from "lucide-react";
import { ICPDonut } from "@/components/shared/ICPDonut";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import HeatBadge from "@/components/panel-blocks/HeatBadge";
import StageBadge from "@/components/panel-blocks/StageBadge";

export default function ScreenVollansicht() {
  const [activeTab, setActiveTab] = useState<
    | "Uebersicht"
    | "Kommunikation"
    | "Sequenz"
    | "Tasks"
    | "Deal"
    | "Usage"
    | "Notizen"
  >("Uebersicht");

  return (
    <div className="w-full h-full flex flex-col bg-[var(--app-bg)] animate-fade-in font-sans">
      {/* Profil Header (Mock) */}
      <div className="pt-6 px-8 max-w-[1400px] w-full mx-auto">
        <div className="flex justify-between">
          <div className="flex flex-col gap-6">
            {/* Top row: Avatar + Name + Tag */}
            <div className="flex items-start gap-4">
              <div className="w-[72px] h-[72px] rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center text-[26px] font-bold relative shrink-0 font-sans tracking-tight">
                DB
                <div className="absolute bottom-0 right-0 w-[20px] h-[20px] bg-[var(--signal-info-text)] rounded-full border-[2px] border-[var(--app-bg)] flex items-center justify-center text-[9px] font-bold text-on-accent tracking-tighter">in</div>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h1 className="text-[26px] font-bold text-[var(--text-primary)] tracking-tight">
                    Dr. Christian Brand
                  </h1>
                  <ICPDonut score={87} size={36} strokeWidth={3.5} forceColor="var(--icp-high)" />
                </div>
                <div className="flex items-center gap-3 text-[var(--text-body)] text-[14px] font-medium">
                  <span>VP of Sales EMEA</span>
                  <span className="flex items-center gap-1.5 bg-[var(--text-primary)] text-on-accent px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
                     <div className="w-3.5 h-3.5 bg-app-surface text-[var(--text-primary)] flex items-center justify-center rounded-[3px] font-bold text-[9px]">L</div> LogixFlow GmbH
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Contact pill + Meta info */}
            <div>
              <div className="flex bg-app-surface rounded-full shadow-sm border border-[var(--border)] py-2.5 items-center text-[13.5px] font-medium text-[var(--text-body)] w-fit mb-4">
                <div className="flex items-center gap-2 px-6 border-r border-[var(--border)]">
                  <Mail size={16} className="text-[var(--text-muted)]" /> c.brand@logixflow.de
                </div>
                <div className="flex items-center gap-2 px-6 border-r border-[var(--border)]">
                  <Phone size={16} className="text-[var(--text-muted)]" /> +49 123 456789
                </div>
                <div className="flex items-center gap-2 px-6 border-r border-[var(--border)]">
                  <LinkedinIcon className="w-4 h-4 text-[var(--text-muted)]" /> in/dr.
                </div>
                <div className="flex items-center gap-2 px-6">
                  <Globe size={16} className="text-[var(--text-muted)]" /> logixflow.com
                </div>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-[12.5px] font-medium">
                <span>Owner: <strong className="text-[var(--text-body)] font-semibold">Anna Meyer</strong></span>
                <span>·</span>
                <span>Erstellt: 12. Mrz 2025</span>
                <span>·</span>
                <span>Letzter Kontakt: vor 2h</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-8 pt-2">
            <div className="flex items-center gap-10 bg-transparent rounded-[12px]">
               <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">STATUS</span>
                  <div className="flex items-center gap-1.5 bg-app-surface shadow-sm text-[var(--icp-high)] font-bold text-[13px] px-4 py-1.5 rounded-full border border-transparent">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--icp-high)]"></div> Aktiv
                  </div>
               </div>
               <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">HEAT</span>
                  <HeatBadge status="HOT" />
               </div>
               <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">STAGE</span>
                  <StageBadge stage="Demo" />
               </div>
            </div>
            
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-app-surface border border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--app-bg)] transition-colors shadow-sm ml-6">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 overflow-x-auto custom-scrollbar mt-10 border-b border-[var(--border)]">
          {[
            { id: "Uebersicht", label: "Übersicht" },
            { id: "Kommunikation", label: "Kommunikation" },
            { id: "Sequenz", label: "Sequenz" },
            { id: "Tasks", label: "Tasks" },
            { id: "Deal", label: "Deal & Pipeline" },
            { id: "Usage", label: "Usage" },
            { id: "Notizen", label: "Notizen" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-[14px] font-bold tracking-wide transition-all whitespace-nowrap border-b-[3px] ${
                activeTab === tab.id
                  ? "text-[var(--sherloq-primary)] border-[var(--sherloq-primary)]"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-body)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === "Uebersicht" && <TabUebersicht />}
          {activeTab === "Kommunikation" && <TabKommunikation />}
          {activeTab === "Sequenz" && <TabSequenz />}
          {activeTab === "Tasks" && <TabTasks />}
          {activeTab === "Deal" && <TabDeal />}
          {activeTab === "Usage" && <TabUsage />}
          {activeTab === "Notizen" && <TabNotizen />}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: ÜBERSICHT
// ----------------------------------------------------------------------
function TabUebersicht() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      {/* Linke Spalte */}
      <div className="md:col-span-8 flex flex-col gap-6">
        {/* KI KURZAKTE */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--icon-muted)]" /> KI KURZAKTE
            </h2>
            <button className="flex items-center gap-1.5 text-[var(--text-muted)] text-[13px] font-semibold hover:text-[var(--sherloq-primary)] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {[
              "Gute Nutzung der Core-Features, aber noch kein Setup der neuen Analytics-Dashboards.",
              "NPS Score 8 — zufrieden, aber noch kein aktiver Promoter. Potenzial für Referral vorhanden.",
              "5 weitere Seats im Marketing-Bereich möglich — Budget-Gespräch Q3 ausstehend.",
            ].map((txt, idx) => (
              <div
                key={idx}
                className="bg-[var(--app-bg)] px-5 py-4 rounded-xl text-[var(--text-primary)] text-[14px] font-medium flex items-start gap-4"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--sherloq-primary)] mt-1.5 shrink-0"></div>
                <p>{txt}</p>
              </div>
            ))}
            <div className="bg-[var(--signal-success-bg)] px-5 py-4 rounded-xl text-[var(--text-primary)] text-[14px] font-medium flex items-start gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--signal-urgent-text)] mt-1.5 shrink-0"></div>
              <p>
                <strong className="text-[var(--sherloq-primary)] font-bold">Next Step:</strong> Quarterly Review vereinbaren und Expansions-Optionen besprechen. Call vor Ende Mai.
              </p>
            </div>
          </div>
        </div>

        {/* LETZTE KOMMUNIKATION */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--icon-muted)]" /> LETZTE
              KOMMUNIKATION
            </h2>
            <button className="flex items-center gap-2 text-[var(--text-primary)] text-[13px] font-semibold hover:text-[var(--sherloq-primary)] transition-colors">
              Alle <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative pl-6 border-l-2 border-[var(--border)] flex flex-col gap-8 pb-4 ml-6">
            {/* Item 1 */}
            <div className="relative">
              <div className="absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl bg-[var(--signal-info-bg)] flex items-center justify-center text-[var(--signal-info-text)]">
                <LinkedinIcon className="w-5 h-5 fill-current" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--text-primary)] text-[16px]">
                      LinkedIn Nachricht
                    </span>
                    <span className="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Inbound
                    </span>
                  </div>
                  <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%]">
                    Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard
                    aufbaut!
                  </p>
                  <span className="bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-semibold px-2.5 py-1 rounded-full">
                    Positiv
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text-muted)]">vor 2h</span>
              </div>
            </div>
            {/* Item 2 */}
            <div className="relative">
              <div className="absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl bg-[var(--app-bg)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-body)]">
                <Square className="w-5 h-5" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--text-primary)] text-[16px]">
                      Discovery Call & Demo
                    </span>
                    <span className="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Inbound
                    </span>
                  </div>
                  <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%]">
                    Starkes Interesse an Feature Y, Budget-Freeze bis Q3
                    angesprochen.
                  </p>
                  <span className="bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-semibold px-2.5 py-1 rounded-full">
                    Positiv
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  vor 5 Tagen
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AKTIONEN */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[var(--icon-muted)]" /> AKTIONEN
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { icon: <Check className="w-4 h-4" />, label: "Task erstellen" },
              { icon: <Mail className="w-4 h-4" />, label: "Email" },
              { icon: <span className="font-bold text-sm">in</span>, label: "LinkedIn" },
              { icon: <Phone className="w-4 h-4" />, label: "Anrufen" },
              { icon: <FileText className="w-4 h-4" />, label: "Notiz" },
            ].map((btn, i) => (
              <button
                key={i}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors text-[14px] font-semibold text-[var(--text-primary)]"
              >
                <div className="text-[var(--text-muted)] flex items-center justify-center w-5">
                  {btn.icon}
                </div>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rechte Spalte */}
      <div className="md:col-span-4 flex flex-col gap-6">
        {/* BASIS INFO */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--icon-muted)]" /> BASIS INFO
            </h2>
            <button className="flex items-center gap-1.5 text-[var(--text-muted)] text-[13px] font-semibold hover:text-[var(--sherloq-primary)]">
              <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
                QUELLE
              </div>
              <div className="text-[var(--signal-info-text)] font-semibold text-[14px] flex items-center gap-1.5">
                 LinkedIn Signal
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
                CLUSTER
              </div>
              <div className="text-[var(--text-primary)] font-bold text-[12px] bg-[var(--app-bg)] px-2 py-0.5 rounded inline-block">
                Customer
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
                STANDORT
              </div>
              <div className="text-[var(--text-primary)] font-medium text-[14px] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--icon-muted)]" /> München, DE (80331)
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
              UNIQUE ID
            </div>
            <div className="text-[var(--text-primary)] font-semibold text-[14px]">
              #CRM-4872
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> SUBSCRIPTION
          </h2>
          <div className="bg-[var(--app-bg)] rounded-xl p-5 border border-[var(--border)] flex justify-between items-center mb-6">
            <div>
              <div className="text-[var(--sherloq-primary)] text-[18px] font-bold">
                Growth Plan
              </div>
              <div className="text-[var(--text-muted)] text-[12px] mt-1">
                01.10.2025 - 01.10.2026
              </div>
            </div>
            <div className="text-right">
              <div className="text-[var(--text-primary)] text-[24px] font-extrabold tracking-tight">
                189 €
              </div>
              <div className="text-[var(--text-muted)] text-[12px]">/ Monat</div>
            </div>
          </div>
          <div className="flex gap-12">
            <div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
                STATUS
              </div>
              <div className="text-[var(--text-primary)] font-bold text-[15px] flex items-center gap-1">
                Aktiv <Check className="w-4 h-4 text-[var(--sherloq-primary)]" />
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
                CHURN RISK
              </div>
              <div className="text-[var(--text-primary)] font-bold text-[15px] flex items-center gap-1">
                Low <Check className="w-4 h-4 text-[var(--sherloq-primary)]" />
              </div>
            </div>
          </div>
        </div>

        {/* TASKS */}
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--icon-muted)]" /> TASKS
            </h2>
            <button className="flex items-center gap-1.5 text-[var(--sherloq-primary)] text-[13px] font-semibold hover:opacity-80">
              <Square className="w-3.5 h-3.5" /> Neue Task
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--app-bg)] rounded-xl border border-[var(--signal-urgent-bg)] hover:bg-app-surface transition-colors cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--icon-muted)] shrink-0"></div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[var(--text-primary)]">
                Enterprise Upgrade ansprechen
              </p>
              <p className="text-[12px] text-[var(--text-muted)]">
                LinkedIn · AI-Nachricht bereit
              </p>
            </div>
            <div className="text-[var(--signal-urgent-text)] text-[12px] font-semibold flex items-center gap-1 mr-2 shrink-0">
              Heute <TriangleAlert className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: KOMMUNIKATION
// ----------------------------------------------------------------------
function TabKommunikation() {
  const comms = [
    {
      type: "in",
      title: "LinkedIn Nachricht",
      badge: "Inbound",
      date: "28. Mai 2026 · vor 2h",
      content:
        "Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard aufbaut! Würde gern mehr über eure Sherloq-Integration erfahren und ob das auch für unser Team passen könnte.",
      sentiment: "Positiv",
      actions: ["Antworten mit AI", "Vollständig lesen"],
      actionPrimary: 0,
      iconBg: "bg-[var(--signal-info-bg)]",
      iconColor: "text-[var(--signal-info-text)]",
      Icon: LinkedinIcon,
    },
    {
      type: "meeting",
      title: "Discovery Call & Demo",
      badge: "Meeting",
      badgeColor: "bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]",
      date: "23. Mai 2026 · vor 5 Tagen",
      content:
        "Starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen. Max möchte ROI-Dokument sehen. Nächster Schritt: Proposal bis Ende Mai.",
      sentiment: "Positiv",
      actions: ["Transkript", "AI-Zusammenfassung"],
      actionPrimary: -1,
      iconBg: "bg-[var(--app-bg)] border border-[var(--border-strong)]",
      iconColor: "text-[var(--text-body)]",
      Icon: Square,
    },
    {
      type: "email",
      title: "Angebot: ROI-Dokument",
      badge: "Outbound",
      badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
      date: "20. Mai 2026 · vor 8 Tagen",
      content:
        "Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise. Ich freue mich auf Ihr Feedback und stehe für Rückfragen gerne zur Verfügung.",
      sentiment: "Neutral",
      sentimentColor: "bg-app-bg text-text-muted",
      actions: ["Email lesen", "Antworten"],
      actionPrimary: 1,
      iconBg: "bg-[var(--signal-info-text)]", // Teams/Outlook style
      iconColor: "text-on-accent",
      Icon: Mail, // using mail for now, in screenshot it's a 4-square windows like icon
    },
    {
      type: "phone",
      title: "Telefon Call — Erstgespräch",
      badge: "Outbound",
      badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
      date: "16. Mai 2026 · vor 12 Tagen",
      content:
        "Interesse an Analytics-Modul. Fragt nach Enterprise-Konditionen. Sehr offenes Gespräch, gutes Bauchgefühl.",
      sentiment: "Positiv",
      actions: ["Notizen lesen"],
      actionPrimary: -1,
      iconBg: "bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]",
      iconColor: "text-[var(--signal-warn-text)]",
      Icon: Phone, // original uses square
    },
    {
      type: "email",
      title: "Erste Kontaktaufnahme",
      badge: "Outbound",
      badgeColor: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
      date: "7. Mai 2026 · vor 21 Tagen",
      content:
        "Hallo Herr Krause, ich habe Ihren Beitrag über Sales Intelligence gelesen und wollte mich kurz vorstellen...",
      sentiment: "Neutral",
      sentimentColor: "bg-app-bg text-text-muted",
      actions: [],
      actionPrimary: -1,
      iconBg: "bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]",
      Icon: Mail, // original uses an envelope shape
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      <div className="md:col-span-8 flex flex-col gap-6">
        <div className="bg-app-surface rounded-[12px] p-6 shadow-sm border border-[var(--border)]">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> ZEITSTRAHL
          </h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-[var(--border)] pb-6">
            <button className="px-4 py-1.5 rounded-full border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] font-semibold text-[14px]">
              Alle
            </button>
            {[
              { icon: <Square className="w-3.5 h-3.5" />, label: "Email" },
              { icon: <span className="font-bold text-[12px]">in</span>, label: "LinkedIn" },
              { icon: <Square className="w-3.5 h-3.5" />, label: "Phone" },
              { icon: <Square className="w-3.5 h-3.5" />, label: "Teams" },
              { icon: <Square className="w-3.5 h-3.5" />, label: "Meeting" },
            ].map((btn, i) => (
              <button
                key={i}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-[var(--text-body)] font-semibold text-[14px] hover:bg-[var(--app-bg)]"
              >
                <div className="text-[var(--text-muted)] flex items-center justify-center">
                  {btn.icon}
                </div>
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative pl-6 border-l-2 border-[var(--border)] flex flex-col gap-10 pb-4 ml-6">
            {comms.map((comm, idx) => (
              <div key={idx} className="relative">
                <div
                  className={`absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl flex items-center justify-center ${comm.iconBg} ${comm.iconColor} shadow-sm z-10`}
                >
                  <comm.Icon className="w-5 h-5 fill-current" />
                </div>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--text-primary)] text-[16px]">
                      {comm.title}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        comm.badgeColor || "bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]"
                      }`}
                    >
                      {comm.badge}
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-[var(--text-muted)]">
                    {comm.date}
                  </span>
                </div>
                <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%] leading-relaxed">
                  {comm.content}
                </p>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                      comm.sentimentColor || "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]"
                    }`}
                  >
                    {comm.sentiment}
                  </span>
                  {comm.actions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {comm.actions.map((act, i) => (
                        <button
                          key={i}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${
                            i === comm.actionPrimary
                              ? "bg-[var(--sherloq-primary)] text-on-accent border-[var(--sherloq-primary)] hover:opacity-90"
                              : "bg-app-surface text-[var(--text-primary)] border-[var(--border-strong)] hover:bg-[var(--app-bg)]"
                          }`}
                        >
                          {i === comm.actionPrimary ? (
                            <Square className="w-3.5 h-3.5 opacity-80" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          )}
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
      </div>

      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="bg-app-surface rounded-[12px] p-6 shadow-sm border border-[var(--border)]">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> KANAL-STATISTIK
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Email", count: 12, sub: "vor 8 Tagen", icon: Square, color: "text-[var(--sherloq-primary)]", bg: "bg-[var(--signal-success-bg)]" },
              { label: "LinkedIn", count: 7, sub: "vor 2h", icon: LinkedinIcon, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)]" },
              { label: "Phone", count: 4, sub: "vor 5T", icon: Phone, color: "text-[var(--signal-warn-text)]", bg: "bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]" },
              { label: "Teams", count: 3, sub: "vor 5T", icon: Square, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)]" },
              { label: "Meeting", count: 2, sub: "vor 5T", icon: Square, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)]" },
              { label: "WhatsApp", count: 1, sub: "vor 21T", icon: Square, color: "text-[var(--signal-success-text)]", bg: "bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)]" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-4 bg-[var(--app-bg)] rounded-[12px] border border-[var(--border)]"
              >
                <div
                  className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center shadow-sm ${stat.bg} ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5 fill-current" />
                </div>
                <div className="text-[20px] font-extrabold text-[var(--text-primary)]">
                  {stat.count}
                </div>
                <div className="text-[12px] font-medium text-[var(--text-muted)] mt-0.5">
                  {stat.label}
                </div>
                <div className="text-[var(--sherloq-primary)] text-[10px] font-semibold mt-1">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-app-surface rounded-[12px] p-6 shadow-sm border border-[var(--border)]">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> AKTIONEN
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: <Square className="w-5 h-5" />, label: "AI-Antwort generieren" },
              { icon: <Square className="w-5 h-5" />, label: "Email senden" },
              { icon: <span className="font-bold text-[17px]">in</span>, label: "LinkedIn DM" },
            ].map((btn, i) => (
              <button
                key={i}
                className="w-full flex justify-center items-center gap-3 py-3.5 rounded-full border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-[15px] hover:bg-[var(--app-bg)] transition-colors"
              >
                <div className="text-[var(--text-muted)] flex items-center justify-center">
                  {btn.icon}
                </div>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: SEQUENZ
// ----------------------------------------------------------------------
function TabSequenz() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      <div className="md:col-span-8 flex flex-col gap-6">
        <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                <Square className="w-4 h-4 text-[var(--icon-muted)]" /> COLD OUTREACH
                LINKEDIN
              </h2>
              <div className="text-[var(--text-muted)] text-[14px]">
                Schritt 2 von 4 · Nächste Task in 2 Tagen · Gestartet 25. Mai
                2026
              </div>
            </div>
            <div className="text-[20px] font-semibold text-[var(--text-primary)]">
              Aktiv
            </div>
          </div>

          <div className="relative pl-[22px] border-l-2 border-[var(--border)] flex flex-col gap-10 pb-4 ml-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--sherloq-primary)] flex items-center justify-center text-[var(--sherloq-primary)]">
                <Square className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[var(--signal-success-bg)] flex items-center justify-center text-[var(--sherloq-primary)]">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)] text-[16px] mr-2">
                    Erste Email senden
                  </span>
                  <span className="font-semibold text-[13px] text-[var(--text-primary)]">
                    Erledigt · 25. Mai
                  </span>
                  <div className="text-[var(--text-muted)] text-[13px] mt-0.5">
                    Tag 0 · Startschritt
                  </div>
                </div>
              </div>
              <div className="mt-3 ml-11 bg-[var(--app-bg)] rounded-xl p-4 text-[var(--text-body)] text-[15px] border-l-4 border-[var(--sherloq-primary)]">
                Hallo Herr Krause, ich habe Ihren Beitrag über Sales
                Intelligence gelesen und wollte mich vorstellen...
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-[var(--sherloq-primary)] flex items-center justify-center text-on-accent font-bold text-sm">
                2
              </div>
              <div className="flex items-center gap-3">
                <div className="font-bold text-[var(--text-muted)] w-8 h-8 flex items-center justify-center text-[18px]">
                  in
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)] text-[16px] mr-2">
                    LinkedIn Vernetzung
                  </span>
                  <span className="font-semibold text-[13px] text-[var(--text-primary)]">
                    Aktiv · fällig 31. Mai
                  </span>
                  <div className="text-[var(--text-muted)] text-[13px] mt-0.5">
                    Tag 3 · Nächste Aufgabe
                  </div>
                </div>
              </div>
              <div className="mt-3 ml-11 bg-[var(--app-bg)] rounded-xl p-4 text-[var(--text-body)] text-[15px] border-l-4 border-[var(--sherloq-primary)]">
                <strong>AI-Entwurf: </strong>
                Hallo Maximilian, ich habe Ihren Post über Sales Automation
                gesehen — sehr spannend! Würde mich freuen uns zu vernetzen.
                <div className="mt-4 flex items-center gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--sherloq-primary)] text-on-accent font-bold text-[14px] hover:opacity-90 transition-colors">
                    <Square className="w-4 h-4 opacity-70" /> Jetzt senden
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-app-surface border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-[14px] hover:bg-[var(--app-bg)] transition-colors">
                    <Square className="w-4 h-4 text-[var(--text-muted)]" /> Bearbeiten
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--border-strong)] flex items-center justify-center text-[var(--icon-muted)] font-bold text-sm">
                3
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="font-bold text-[var(--text-muted)] w-8 h-8 flex items-center justify-center text-[18px]">
                  in
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)] text-[16px]">
                    LinkedIn DM
                  </span>
                  <div className="text-[var(--text-muted)] text-[13px] mt-0.5">
                    Tag 8 · ab 5. Juni 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--border-strong)] flex items-center justify-center text-[var(--icon-muted)] font-bold text-sm">
                4
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)]">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)] text-[16px]">
                    Follow-up Email
                  </span>
                  <div className="text-[var(--text-muted)] text-[13px] mt-0.5">
                    Tag 13 · ab 10. Juni 2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: TASKS
// ----------------------------------------------------------------------
function TabTasks() {
  return (
    <div className="md:col-span-8 flex flex-col gap-8 max-w-4xl">
      <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> OFFENE TASKS
          </h2>
          <button className="flex items-center gap-2 bg-[var(--sherloq-primary)] text-on-accent px-5 py-2.5 rounded-full font-bold text-[14px] hover:opacity-90 transition-colors shadow-sm">
            <Square className="w-4 h-4 opacity-80" /> Neue Task
          </button>
        </div>

        <div className="flex flex-col gap-0 border-t border-[var(--border)]">
          {/* Task 1 */}
          <div className="flex items-center gap-4 py-4 border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors -mx-8 px-8 cursor-pointer group">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] group-hover:border-[var(--sherloq-primary)] shrink-0 transition-colors"></div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--text-primary)]">
                Enterprise Upgrade ansprechen
              </p>
              <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
                LinkedIn · AI-Nachricht bereit
              </p>
            </div>
            <div className="text-[var(--signal-urgent-text)] text-[14px] font-bold flex items-center gap-1.5 shrink-0">
              Heute <TriangleAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          {/* Task 2 */}
          <div className="flex items-center gap-4 py-4 border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors -mx-8 px-8 cursor-pointer group">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] group-hover:border-[var(--sherloq-primary)] shrink-0 transition-colors"></div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--text-primary)]">
                Quarterly Review vorbereiten
              </p>
              <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
                Meeting · Agenda erstellen
              </p>
            </div>
            <div className="text-[var(--text-muted)] text-[14px] font-medium shrink-0">
              in 5 Tagen
            </div>
          </div>
          {/* Task 3 */}
          <div className="flex items-center gap-4 py-4 border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors -mx-8 px-8 cursor-pointer group">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] group-hover:border-[var(--sherloq-primary)] shrink-0 transition-colors"></div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--text-primary)]">
                ROI Follow-up nachfassen
              </p>
              <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
                Email · Angebot vom 20. Mai
              </p>
            </div>
            <div className="text-[var(--text-muted)] text-[14px] font-medium shrink-0">
              in 8 Tagen
            </div>
          </div>
        </div>
      </div>

      <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> ERLEDIGTE TASKS
          </h2>
        </div>

        <div className="flex flex-col gap-0 border-t border-[var(--border)]">
          <div className="flex items-center gap-4 py-4 border-b border-[var(--border)] -mx-8 px-8 opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--icp-high)] bg-[var(--signal-success-bg)] flex items-center justify-center shrink-0">
              <Square className="w-2.5 h-2.5 text-[var(--icp-high)] fill-current" />
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--text-muted)] line-through">
                Demo-Unterlagen vorbereiten
              </p>
              <p className="text-[14px] text-[var(--icon-muted)] mt-0.5">
                Erledigt am 22. Mai
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: DEAL & PIPELINE
// ----------------------------------------------------------------------
function TabDeal() {
  return (
    <div className="max-w-4xl">
      <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> DEAL & PIPELINE
          </h2>
          <button className="flex items-center gap-1.5 text-[var(--sherloq-primary)] text-[14px] font-bold hover:opacity-80">
            <Square className="w-4 h-4" /> Bearbeiten
          </button>
        </div>

        {/* Stepper / Funnel */}
        <div className="mb-4">
          <div className="flex w-full mb-2">
            {["Backlog", "Demo", "Follow-up", "Proposal", "Won"].map(
              (step, idx) => (
                <div
                  key={step}
                  className={`flex-1 text-center text-[15px] pb-3 border-b-[3px] ${
                    idx === 1
                      ? "text-[var(--sherloq-primary)] border-[var(--sherloq-primary)] font-bold"
                      : idx === 0
                      ? "text-[var(--sherloq-primary)] border-[var(--sherloq-primary)] font-medium"
                      : "text-[var(--text-muted)] border-[var(--border)] font-medium"
                  }`}
                >
                  {step}
                </div>
              )
            )}
          </div>
          <div className="w-full bg-[var(--app-bg)] rounded h-8 mb-4 border border-[var(--border)] flex items-center px-4">
             <Square className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" />
          </div>
          <p className="text-[var(--sherloq-primary)] font-bold text-[16px]">
            Demo · seit 8 Tagen
          </p>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { value: "24.000 €", label: "ARR" },
            { value: "2.000 €", label: "MRR" },
            { value: "12 Mo.", label: "LAUFZEIT" },
            { value: "24.000 €", label: "DEAL VOL." },
            { value: "75%", label: "PROBABILITY" },
            { value: "0 €", label: "ONE-OFF" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[var(--app-bg)] rounded-[12px] py-6 flex flex-col items-center justify-center text-center"
            >
              <div className="text-[var(--text-primary)] text-[24px] font-extrabold tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: USAGE
// ----------------------------------------------------------------------
function TabUsage() {
  return (
    <div className="max-w-4xl">
      <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
        <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
          <Square className="w-4 h-4 text-[var(--icon-muted)]" /> SHERLOQ USAGE
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              LAST LOGIN
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[18px]">
              vor 2 Std.
            </div>
          </div>
          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              LAST USAGE
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[18px]">Heute</div>
          </div>

          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              PROFILES ADDED
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
              142 <span className="text-[var(--icp-high)] text-[14px]">+12%</span>
            </div>
          </div>
          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              MESSAGES
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
              89 <span className="text-[var(--signal-urgent-text)] text-[14px]">-4%</span>
            </div>
          </div>

          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              ENRICHMENTS
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2 mb-3">
              <span className="text-[var(--signal-urgent-text)]">8.500</span>
              <span className="text-[var(--text-muted)] text-[16px] font-medium">
                / 10k
              </span>
            </div>
            <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-[var(--signal-urgent-text)] h-full rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
            <div className="text-[var(--signal-urgent-text)] text-[12px] font-semibold flex items-center gap-1">
              85% <TriangleAlert className="w-3 h-3" /> Limit fast erreicht
            </div>
          </div>

          <div className="bg-[var(--app-bg)] rounded-[12px] p-5 flex flex-col justify-between">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              POSTS GENERIERT
            </div>
            <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
              12 <span className="text-[var(--icp-high)] text-[14px]">+24%</span>
            </div>
          </div>

          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              ONBOARDING
            </div>
            <div className="text-[var(--sherloq-primary)] font-bold text-[18px] flex items-center gap-1.5">
              <Check className="w-5 h-5 stroke-[3]" /> Abgeschlossen
            </div>
          </div>

          <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">
              UPSELL SIGNAL
            </div>
            <div className="text-[var(--text-primary)] font-medium text-[16px]">
              +1.800 € MRR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB: NOTIZEN
// ----------------------------------------------------------------------
function TabNotizen() {
  return (
    <div className="max-w-4xl">
      <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> NOTIZEN
          </h2>
          <button className="flex items-center gap-2 bg-[var(--sherloq-primary)] text-on-accent px-5 py-2.5 rounded-full font-bold text-[14px] hover:opacity-90 transition-colors shadow-sm">
            <Square className="w-4 h-4 opacity-80" /> Speichern
          </button>
        </div>

        <textarea
          className="w-full bg-app-surface border border-[var(--border)] rounded-[12px] p-5 text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--sherloq-primary)] focus:ring-1 focus:ring-[var(--sherloq-primary)] min-h-[120px] mb-8 placeholder-[var(--icon-muted)] resize-y shadow-sm"
          placeholder="Notiz hinzufügen..."
        ></textarea>

        <div className="flex flex-col gap-4">
          <div className="bg-[var(--app-bg)] rounded-xl p-4 text-[15px] text-[var(--text-body)] flex items-start gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--sherloq-primary)] mt-2 shrink-0"></div>
            <div>
              <strong className="text-[var(--text-primary)]">28. Mai:</strong> Max möchte
              Enterprise-Demo bis Ende Juni. Board-Meeting am 15. Juni.
            </div>
          </div>
          <div className="bg-[var(--app-bg)] rounded-xl p-4 text-[15px] text-[var(--text-body)] flex items-start gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--sherloq-primary)] mt-2 shrink-0"></div>
            <div>
              <strong className="text-[var(--text-primary)]">20. Mai:</strong> ROI-Dokument
              versendet. Max wirkte sehr interessiert, fragt nach
              Referenzkunden.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

