/**
 * ActionPanel — 580px Panel-Shell (Sheet „drawer"). NUR Struktur, kein Inhalt.
 * Extrahiert aus den Action-Panels (ChatActionPanel / PipelineStagnatedDrawer).
 * Inhalt (Banner / Chat / Composer) kommt als children aus features/ + panel-blocks/.
 */
import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function ActionPanel({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="drawer"
        className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
        style={{ width: 580, maxWidth: "95vw", minWidth: 480 }}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
