import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import TaskAnlegenForm from "@/components/panel-blocks/TaskAnlegenForm";

interface NoTaskPerson {
  name: string;
  company: string;
}

export interface NoTaskDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  person: NoTaskPerson | null;
  onClose: () => void;
}

/**
 * NoTaskDrawer — Action Panel „Keine Task": Sheet-„drawer"-Shell (50vw) + Toast.
 * Der Inhalt (Header + Task-Formular) liegt im panel-block `TaskAnlegenForm`.
 */
export default function NoTaskDrawer({ person, onClose }: NoTaskDrawerProps) {
  // Inhalt aus gehaltener Kopie, damit das Panel während der Ausfahr-Animation gefüllt bleibt.
  const [display, setDisplay] = useState<NoTaskPerson | null>(person);
  useEffect(() => { if (person) setDisplay(person); }, [person]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  const isOpen = person !== null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: "50vw", maxWidth: "95vw", minWidth: 480 }}>
          {display && <TaskAnlegenForm person={display} onClose={onClose} onToast={triggerToast} />}
        </SheetContent>
      </Sheet>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-inverse-surface text-on-accent px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
