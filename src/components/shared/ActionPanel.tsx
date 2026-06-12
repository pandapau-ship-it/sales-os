/**
 * ActionPanel — wiederverwendbare Shell für „Jetzt handeln" (Action Panel).
 * Alle späteren Action-Panels erben von dieser Shell.
 *
 * Verhalten (CLAUDE.md / UI-Referenz §22.2):
 * - Öffnet von rechts, fixed · Breite default 580px · einspaltiger Scroll
 * - Kein Backdrop-Close (Aktion muss abgeschlossen oder abgebrochen werden)
 * - Footer: Cancel (schließt ohne Toast) · Bestätigen → onComplete() + Toast + auto-close
 * Baut auf dem shadcn-Sheet-Primitiv auf.
 */

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast, type ToastVariant } from "@/components/shared/Toast";

interface ActionPanelProps {
  open: boolean;
  onClose: () => void;
  /** Nach erfolgreicher Aktion aufgerufen → Panel schließt + Toast. */
  onComplete: () => void;
  children: React.ReactNode;
  title?: string;
  width?: number; // default 580
  confirmLabel?: string;
  toastMessage?: string;
  toastVariant?: ToastVariant;
}

export default function ActionPanel({
  open,
  onClose,
  onComplete,
  children,
  title = "Action Panel",
  width = 580,
  confirmLabel,
  toastMessage,
  toastVariant = "success",
}: ActionPanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleComplete = () => {
    onComplete();
    if (toastMessage) toast(toastMessage, toastVariant);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        style={{ width, maxWidth: "95vw", boxShadow: "var(--shadow-panel)" }}
        className="panel-right sm:max-w-none p-0 flex flex-col bg-app-surface border-l border-border"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <button
          onClick={onClose}
          aria-label={t("common.cancel")}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-app-bg hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>

        {/* Sticky Footer */}
        <div className="border-t border-border-subtle p-4 flex items-center justify-end gap-2 bg-app-surface">
          <button onClick={onClose} className="sherloq-btn-secondary">
            {t("common.cancel")}
          </button>
          <button onClick={handleComplete} className="sherloq-btn-primary">
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
