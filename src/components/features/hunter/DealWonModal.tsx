/**
 * DealWonModal — kleines, NICHT blockierendes Modal nach „Deal gewonnen". Der Won-Write + Konfetti
 * passieren bereits beim Öffnen (Aufrufer); dieses Modal hängt optional Grund (won_reason, Auswahl)
 * + Notiz (won_note) an. „Speichern" → onSave(reason, note) (Aufrufer schließt sofort + schreibt im
 * Hintergrund); „Überspringen"/Escape/Außenklick → onSkip (kein Write — Deal ist schon gewonnen).
 * Gegenstück zum blockierenden DealLostModal; Auswahl hier optional (Won ist nicht blockierend).
 * Lucide-Icon statt Emoji (Projekt-Regel „keine Emoji in UI").
 */
import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const REASONS = ["Preis", "Produkt-Fit", "Beziehung/Vertrauen", "Timing", "Wettbewerb geschlagen", "Anderer Grund"];
const MAX_NOTE = 300;

export default function DealWonModal({
  open,
  onSave,
  onSkip,
  pending = false,
}: {
  open: boolean;
  onSave: (wonReason: string, wonNote: string) => void;
  onSkip: () => void;
  pending?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setReason(""); setNote(""); } }, [open]); // frisch je Deal

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="typo-card-title text-text-primary flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-[var(--signal-success-text)]" /> Deal gewonnen
          </DialogTitle>
          <DialogDescription className="text-[12px] text-text-muted">Was hat den Ausschlag gegeben? (optional)</DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-5">
          <div className="space-y-2">
            <span className="typo-section-label text-text-muted">Grund (optional)</span>
            <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border cursor-pointer transition-colors ${reason === r ? "border-[var(--sherloq-primary)] bg-app-bg" : "border-border hover:bg-app-bg"}`}
                >
                  <RadioGroupItem value={r} />
                  <span className="text-[13px] font-semibold text-text-body">{r}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <span className="typo-section-label text-text-muted">Notiz (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
              rows={3}
              placeholder="Kurz festhalten, warum dieser Deal gewonnen wurde …"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-surface outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] text-text-body resize-none"
            />
            <div className="text-right text-[11px] text-text-muted">{note.length}/{MAX_NOTE}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={pending}
            className="px-4 py-2 rounded-[10px] text-text-muted text-[13px] font-bold hover:text-text-body transition-colors cursor-pointer disabled:opacity-50"
          >
            Überspringen
          </button>
          <button
            type="button"
            onClick={() => onSave(reason, note)}
            disabled={pending}
            className="px-4 py-2 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            Speichern →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
