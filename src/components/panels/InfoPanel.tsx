/**
 * InfoPanel — 820px Panel-Shell (Sheet „drawer"). NUR Struktur, kein Inhalt.
 * Extrahiert aus shared/HunterSidepanel.tsx. Inhalt kommt als children
 * (Header / Main / Footer) aus features/<modul>/ + panel-blocks/.
 */
import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function InfoPanel({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="drawer"
        className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
        style={{ width: 820, maxWidth: "95vw" }}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
