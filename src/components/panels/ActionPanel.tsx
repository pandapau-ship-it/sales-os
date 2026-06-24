/**
 * ActionPanel — Panel-Shell (Sheet „drawer"). NUR Struktur, kein Inhalt.
 * Standardbreite 720px FIX — konsistent mit den anderen Action-Panels (ChatActionPanel).
 * Inhalt (Banner / Chat / Composer) kommt als children aus features/ + panel-blocks/.
 */
import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function ActionPanel({
  open, onClose, children, width = 720,
}: { open: boolean; onClose: () => void; children: ReactNode; width?: number | string }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="drawer"
        className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
        style={{ width, maxWidth: "95vw" }}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
