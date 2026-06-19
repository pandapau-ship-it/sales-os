/**
 * DealLostModal — blockierender Dialog beim Wechsel in die Terminal-Stage „verloren" (P8-3).
 * Pflichtfeld Grund (RadioGroup) + optionale Notiz (max 300). Bestätigen → onConfirm(reason, note);
 * der Aufrufer schreibt (updateDealLost) und schließt. Blockierend: kein Escape-/Außenklick-Close,
 * Close-X ausgeblendet ([&>button]:hidden) — schließen nur über „Abbrechen"/„Als verloren markieren".
 * Präsentational + prop-driven → wird in ScreenHunting UND HunterSidepanel geteilt (eine Quelle).
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const REASONS = ["Preis", "Kein Bedarf", "Wettbewerber", "Timing", "Kein Response", "Anderer Grund"];
const MAX_NOTE = 300;

export default function DealLostModal({
  open,
  onCancel,
  onConfirm,
  pending = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (lostReason: string, note: string) => void;
  pending?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  // Beim Öffnen Felder leeren → frischer Dialog je Deal.
  useEffect(() => { if (open) { setReason(""); setNote(""); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => { /* blockierend: schließen nur über die Buttons */ }}>
      <DialogContent
        className="[&>button]:hidden max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="typo-card-title text-text-primary">Deal als verloren markieren</DialogTitle>
          <DialogDescription className="text-[12px] text-text-muted">
            Der Deal wird geschlossen. Bitte einen Grund angeben.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-5">
          <div className="space-y-2">
            <span className="typo-section-label text-text-muted">Grund (Pflicht)</span>
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

          <div className="space-y-2">
            <span className="typo-section-label text-text-muted">Notiz (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
              rows={3}
              placeholder="Kontext zum verlorenen Deal …"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-surface outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] text-text-body resize-none"
            />
            <div className="text-right text-[11px] text-text-muted">{note.length}/{MAX_NOTE}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 rounded-[10px] border border-border bg-app-surface text-text-body text-[13px] font-bold hover:bg-app-bg transition-colors cursor-pointer disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason, note)}
            disabled={!reason || pending}
            className="px-4 py-2 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            Als verloren markieren →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
