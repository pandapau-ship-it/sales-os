/**
 * ErledigtAction — zentrale „Erledigt"-Aktion für ALLE Action-Panels.
 * Button (outlined, grün) + shadcn Popover (RadioGroup „Was hast du gemacht?").
 * Bestätigen → Toast „Erledigt ✓ · In Kurzakte gespeichert" → onDone() (Panel schließt).
 *
 * EINE Quelle: in shared/ChatActionPanel eingebunden → erscheint in allen Chat-Action-Panels.
 * Hier ändern → überall geändert. Mock/Design — schreibt (noch) nichts in die DB.
 */
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/shared/Toast";

// Optionen = „Zählt als Kontakt"-Kanäle (setzen später last_contacted_at → Heat/Kurzakte).
const OPTIONS = [
  { value: "email", label: "Email gesendet" },
  { value: "linkedin", label: "LinkedIn Nachricht" },
  { value: "call", label: "Telefonat" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Anderes" },
];

export default function ErledigtAction({ onDone }: { onDone?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("email");
  const [note, setNote] = useState("");

  const confirm = () => {
    toast("Erledigt ✓ · In Kurzakte gespeichert");
    setOpen(false);
    onDone?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[var(--icp-high)] text-[var(--icp-high)] text-[11px] font-bold hover:bg-[var(--signal-success-bg)] transition-colors cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Bereits erledigt
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" sideOffset={8} className="w-[300px] p-4 rounded-[12px]">
        <p className="text-[12px] font-bold text-text-primary mb-3">Was hast du gemacht?</p>

        <RadioGroup value={choice} onValueChange={setChoice} className="gap-2">
          {OPTIONS.map((o) => (
            <div key={o.value} className="flex items-center gap-2.5">
              <RadioGroupItem value={o.value} id={`erl-${o.value}`} className="border-border-strong text-[var(--sherloq-primary)]" />
              <label htmlFor={`erl-${o.value}`} className="text-[13px] text-text-body cursor-pointer select-none">{o.label}</label>
            </div>
          ))}
        </RadioGroup>

        {/* Notiz — immer verfügbar, egal welche Auswahl */}
        <div className="mt-3">
          <label className="text-[11px] font-semibold text-text-muted block mb-1">Notiz (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Was wurde besprochen / vereinbart?…"
            className="w-full text-[12px] font-sans leading-relaxed px-3 py-2 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none resize-none transition-colors placeholder-[var(--text-muted)]"
          />
        </div>

        <div className="flex justify-end mt-3.5">
          <button
            type="button"
            onClick={confirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: "var(--sherloq-gradient)" }}
          >
            Bestätigen →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
