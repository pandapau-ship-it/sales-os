/**
 * ActionFooter — sticky Fußbereich der Action-Panels: Composer-Slot + Disclaimer.
 * Extrahiert aus shared/ChatActionPanel.tsx.
 */
import type { ReactNode } from "react";

export default function ActionFooter({
  children, disclaimer = "Sherloq AI kann Fehler machen — wichtige Infos bitte prüfen.",
}: { children: ReactNode; disclaimer?: string }) {
  return (
    <div className="shrink-0 border-t border-border bg-app-surface px-4 pt-3 pb-3">
      {children}
      <p className="text-[10px] text-text-muted text-center mt-2">{disclaimer}</p>
    </div>
  );
}
