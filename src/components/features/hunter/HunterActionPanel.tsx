/**
 * HunterActionPanel — Hunter-spezifische Zusammensetzung des Action-Panels (580px).
 * Setzt die Panel-Shell (panels/ActionPanel) mit Header + Chat-Composer (panel-blocks/*)
 * zusammen. Extrahiert/komponiert aus shared/ChatActionPanel.tsx.
 */
import { useState } from "react";
import ActionPanel from "@/components/panels/ActionPanel";
import PanelHeader from "@/components/panel-blocks/PanelHeader";
import ActionComposer from "@/components/panel-blocks/ActionComposer";
import ActionFooter from "@/components/panel-blocks/ActionFooter";

export default function HunterActionPanel({ person, onClose }: { person: any; onClose: () => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const firstName = person?.name?.split(" ")[0] ?? "";

  return (
    <ActionPanel open={person !== null} onClose={onClose}>
      {person && (
        <>
          <header className="px-6 py-4 border-b border-border shrink-0 bg-app-surface">
            <PanelHeader name={person.name ?? "Kontakt"} company={person.company} src={person.avatarUrl} onClose={onClose} />
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg px-5 py-5 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="flex justify-end">
                <div className="max-w-[82%] bg-[var(--signal-info-bg)] text-text-primary rounded-2xl rounded-tr-md px-3.5 py-2 text-[13px] font-medium leading-relaxed shadow-sm">{m}</div>
              </div>
            ))}
          </div>

          <ActionFooter>
            <ActionComposer placeholder={`Sherloq zu ${firstName} fragen…`} onSend={(t) => setMessages((prev) => [...prev, t])} />
          </ActionFooter>
        </>
      )}
    </ActionPanel>
  );
}
