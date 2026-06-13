/**
 * HunterInfoPanel — Hunter-spezifische Zusammensetzung des Info-Panels (820px).
 * Setzt die Panel-Shell (panels/InfoPanel) mit den Inhalts-Blöcken (panel-blocks/*)
 * zusammen. Extrahiert/komponiert aus shared/HunterSidepanel.tsx.
 */
import { useState } from "react";
import InfoPanel from "@/components/panels/InfoPanel";
import PanelHeader from "@/components/panel-blocks/PanelHeader";
import PanelTabs from "@/components/panel-blocks/PanelTabs";
import PanelFooter from "@/components/panel-blocks/PanelFooter";
import KontaktZeile from "@/components/panel-blocks/KontaktZeile";
import KiKurzakte from "@/components/panel-blocks/KiKurzakte";
import AktiveSignale from "@/components/panel-blocks/AktiveSignale";
import DealSetup from "@/components/panel-blocks/DealSetup";
import OffeneTasks from "@/components/panel-blocks/OffeneTasks";
import ActiveSequenceChain from "@/components/panel-blocks/ActiveSequenceChain";
import KommunikationPreview from "@/components/panel-blocks/KommunikationPreview";

const TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "communication", label: "Kommunikation" },
  { id: "activity", label: "Aktivität" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notizen" },
];

const KURZAKTE = [
  "Refactoring der Outreach-Struktur gestartet — sucht aktiv ein Tool zur Senkung der SDR Ramp-Up-Time.",
  "Persönlichkeit: analytisch & datengetrieben — reagiert auf klare ROI-Argumentation, wenig Smalltalk.",
  "Objection: Budget-Freeze bis Q3 — echter Einwand, kein Vorwand. Der ROI-Case ist der Hebel.",
  "Buying Signal: Demo sehr positiv, fragte nach Implementierungs-Zeitplan. Abschluss realistisch ab Q4.",
];

export default function HunterInfoPanel({ person, onClose }: { person: any; onClose: () => void }) {
  const [tab, setTab] = useState("overview");

  return (
    <InfoPanel open={person !== null} onClose={onClose}>
      {person && (
        <>
          <header className="p-7 pb-0 bg-app-surface relative z-10 border-b border-border-subtle shrink-0 space-y-6">
            <PanelHeader name={person.name ?? "Christian Brand"} title={person.title} company={person.company} src={person.avatarUrl} onClose={onClose} />
            <KontaktZeile email="c.brand@logixflow.de" phone="+49 170 1234567" linkedin="in/christianbrand" web="logixflow.de" />
            <PanelTabs tabs={TABS} active={tab} onChange={setTab} />
          </header>

          <main className="flex-1 overflow-y-auto p-7 space-y-7 bg-app-bg custom-scrollbar pb-28">
            {tab === "overview" && (
              <div className="space-y-7 animate-fade-in">
                <KiKurzakte items={KURZAKTE} />
                <AktiveSignale />
                <DealSetup stage={person.stage} />
                <OffeneTasks />
                <ActiveSequenceChain />
                <KommunikationPreview onShowAll={() => setTab("communication")} />
              </div>
            )}
          </main>

          <PanelFooter />
        </>
      )}
    </InfoPanel>
  );
}
