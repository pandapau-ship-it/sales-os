/**
 * InfoPanel — wiederverwendbare Shell für Kontext/Überblick (Info Panel).
 * Alle späteren Info-Panels erben von dieser Shell — keine eigene Shell bauen.
 *
 * Verhalten (CLAUDE.md / UI-Referenz §22.1):
 * - Öffnet von rechts, fixed, volle Höhe · Breite default 820px
 * - Schließt NUR via X-Button (kein Backdrop-Klick) · Header sticky, Content scrollt
 * Baut auf dem shadcn-Sheet-Primitiv auf (Radix Dialog).
 */

import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface InfoPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** A11y-Titel (visuell versteckt, falls Header im Content eigenes Titel hat). */
  title?: string;
  width?: number; // default 820
}

export default function InfoPanel({
  open,
  onClose,
  children,
  title = "Info Panel",
  width = 820,
}: InfoPanelProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        // Schließt NUR via X: Backdrop-Klick + Escape unterbinden.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        style={{ width, maxWidth: "95vw", boxShadow: "var(--shadow-panel)" }}
        className="panel-right sm:max-w-none p-0 flex flex-col bg-app-surface border-l border-border"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <button
          onClick={onClose}
          aria-label="Schließen"
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-app-bg hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
