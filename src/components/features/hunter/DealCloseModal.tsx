/**
 * DealCloseModal — kleines, NICHT blockierendes Popup beim letzten Kanban-Pfeil (P8-3c).
 * Fragt: gewonnen oder verloren? Gewonnen → onWon (direkter Write + Konfetti). Verloren → onLost
 * (öffnet den blockierenden DealLostModal). Außenklick/Escape/Abbrechen → onCancel (nichts passiert).
 * Präsentational + prop-driven.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DealCloseModal({
  open,
  onWon,
  onLost,
  onCancel,
}: {
  open: boolean;
  onWon: () => void;
  onLost: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="typo-card-title text-text-primary">Deal abschließen</DialogTitle>
          <DialogDescription className="text-[12px] text-text-body">Wie ist dieser Deal ausgegangen?</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onWon}
            className="w-full px-4 py-2.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Gewonnen →
          </button>
          <button
            type="button"
            onClick={onLost}
            className="w-full px-4 py-2.5 rounded-[10px] border border-border bg-app-surface text-text-body text-[13px] font-bold hover:bg-app-bg transition-colors cursor-pointer"
          >
            Verloren →
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-1.5 text-text-muted text-[12px] font-semibold hover:text-text-body transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
