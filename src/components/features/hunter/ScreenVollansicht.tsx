/**
 * ScreenVollansicht — Kontakt-Vollansicht (Hunter). Komponiert aus panel-blocks/:
 * Header nutzt KontaktZeile · PanelTabs · HeatBadge · StageBadge · ICPDonut;
 * Tab-Inhalte sind eigene panel-blocks (KiKurzakte + Voll*). Kein Inline-Block.
 * Mock/Design — nicht verdrahtet.
 */
import { useState } from "react";
import { X, Check, Mail, Phone, FileText, Sparkles, Square } from "lucide-react";
import { ICPDonut } from "@/components/shared/ICPDonut";
import KontaktZeile from "@/components/panel-blocks/KontaktZeile";
import PanelTabs from "@/components/panel-blocks/PanelTabs";
import HeatBadge from "@/components/panel-blocks/HeatBadge";
import StageBadge from "@/components/panel-blocks/StageBadge";
import KiKurzakte from "@/components/panel-blocks/KiKurzakte";
import VollLetzteKommunikation from "@/components/panel-blocks/VollLetzteKommunikation";
import VollAktionen from "@/components/panel-blocks/VollAktionen";
import VollBasisInfo from "@/components/panel-blocks/VollBasisInfo";
import VollSubscription from "@/components/panel-blocks/VollSubscription";
import VollTasksKompakt from "@/components/panel-blocks/VollTasksKompakt";
import VollKommunikationZeitstrahl from "@/components/panel-blocks/VollKommunikationZeitstrahl";
import VollKanalStatistik from "@/components/panel-blocks/VollKanalStatistik";
import VollSequenz from "@/components/panel-blocks/VollSequenz";
import VollOffeneTasks from "@/components/panel-blocks/VollOffeneTasks";
import VollErledigteTasks from "@/components/panel-blocks/VollErledigteTasks";
import VollDealPipeline from "@/components/panel-blocks/VollDealPipeline";
import VollSherloqUsage from "@/components/panel-blocks/VollSherloqUsage";
import VollNotizen from "@/components/panel-blocks/VollNotizen";

const TABS = [
  { id: "Uebersicht", label: "Übersicht" },
  { id: "Kommunikation", label: "Kommunikation" },
  { id: "Sequenz", label: "Sequenz" },
  { id: "Tasks", label: "Tasks" },
  { id: "Deal", label: "Deal & Pipeline" },
  { id: "Usage", label: "Usage" },
  { id: "Notizen", label: "Notizen" },
];

const KURZAKTE = [
  "Gute Nutzung der Core-Features, aber noch kein Setup der neuen Analytics-Dashboards.",
  "NPS Score 8 — zufrieden, aber noch kein aktiver Promoter. Potenzial für Referral vorhanden.",
  "5 weitere Seats im Marketing-Bereich möglich — Budget-Gespräch Q3 ausstehend.",
  "Next Step: Quarterly Review vereinbaren und Expansions-Optionen besprechen. Call vor Ende Mai.",
];

const UEBERSICHT_AKTIONEN = [
  { icon: <Check className="w-4 h-4" />, label: "Task erstellen" },
  { icon: <Mail className="w-4 h-4" />, label: "Email" },
  { icon: <span className="font-bold text-sm">in</span>, label: "LinkedIn" },
  { icon: <Phone className="w-4 h-4" />, label: "Anrufen" },
  { icon: <FileText className="w-4 h-4" />, label: "Notiz" },
];

const KOMM_AKTIONEN = [
  { icon: <Square className="w-5 h-5" />, label: "AI-Antwort generieren" },
  { icon: <Square className="w-5 h-5" />, label: "Email senden" },
  { icon: <span className="font-bold text-[17px]">in</span>, label: "LinkedIn DM" },
];

export default function ScreenVollansicht() {
  const [activeTab, setActiveTab] = useState("Uebersicht");

  return (
    <div className="w-full h-full flex flex-col bg-[var(--app-bg)] animate-fade-in font-sans">
      {/* Profil Header (Mock) */}
      <div className="pt-6 px-8 max-w-[1400px] w-full mx-auto">
        <div className="flex justify-between">
          <div className="flex flex-col gap-6">
            {/* Avatar + Name + Tag */}
            <div className="flex items-start gap-4">
              <div className="w-[72px] h-[72px] rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center text-[26px] font-bold relative shrink-0 font-sans tracking-tight">
                DB
                <div className="absolute bottom-0 right-0 w-[20px] h-[20px] bg-[var(--signal-info-text)] rounded-full border-[2px] border-[var(--app-bg)] flex items-center justify-center text-[9px] font-bold text-on-accent tracking-tighter">in</div>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h1 className="text-[26px] font-bold text-[var(--text-primary)] tracking-tight">Dr. Christian Brand</h1>
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

            {/* Kontakt-Leiste + Meta */}
            <div>
              <div className="mb-4 w-fit">
                <KontaktZeile email="c.brand@logixflow.de" phone="+49 123 456789" linkedin="in/dr." web="logixflow.com" />
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-[12.5px] font-medium">
                <span>Owner: <strong className="text-[var(--text-body)] font-semibold">Anna Meyer</strong></span>
                <span>·</span>
                <span>Erstellt: 12. Mrz 2025</span>
                <span>·</span>
                <span>Letzter Kontakt: vor 2h</span>
              </div>
            </div>
          </div>

          {/* Rechts: Status/Heat/Stage + Schließen */}
          <div className="flex items-start gap-8 pt-2">
            <div className="flex items-center gap-10">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">STATUS</span>
                <div className="flex items-center gap-1.5 bg-app-surface shadow-sm text-[var(--icp-high)] font-bold text-[13px] px-4 py-1.5 rounded-full">
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
        <div className="mt-10">
          <PanelTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab-Inhalt */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === "Uebersicht" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
              <div className="md:col-span-8 flex flex-col gap-6">
                <KiKurzakte items={KURZAKTE} />
                <VollLetzteKommunikation />
                <VollAktionen icon={<Sparkles className="w-4 h-4 text-[var(--icon-muted)]" />} items={UEBERSICHT_AKTIONEN} />
              </div>
              <div className="md:col-span-4 flex flex-col gap-6">
                <VollBasisInfo />
                <VollSubscription />
                <VollTasksKompakt />
              </div>
            </div>
          )}

          {activeTab === "Kommunikation" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
              <div className="md:col-span-8 flex flex-col gap-6">
                <VollKommunikationZeitstrahl />
              </div>
              <div className="md:col-span-4 flex flex-col gap-6">
                <VollKanalStatistik />
                <VollAktionen icon={<Square className="w-4 h-4 text-[var(--icon-muted)]" />} items={KOMM_AKTIONEN} vertical padding="p-6" />
              </div>
            </div>
          )}

          {activeTab === "Sequenz" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
              <div className="md:col-span-8 flex flex-col gap-6"><VollSequenz /></div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="md:col-span-8 flex flex-col gap-8 max-w-4xl">
              <VollOffeneTasks />
              <VollErledigteTasks />
            </div>
          )}

          {activeTab === "Deal" && <div className="max-w-4xl"><VollDealPipeline /></div>}
          {activeTab === "Usage" && <div className="max-w-4xl"><VollSherloqUsage /></div>}
          {activeTab === "Notizen" && <div className="max-w-4xl"><VollNotizen /></div>}
        </div>
      </div>
    </div>
  );
}
