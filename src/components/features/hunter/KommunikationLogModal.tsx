/**
 * KommunikationLogModal — kleines, nicht-blockierendes Modal zum manuellen Protokollieren eines
 * Touchpoints (Email · LinkedIn · Anruf · Meeting). shadcn Dialog. Felder: Kanal (4 Pills mit
 * Icon/Farbe) · Richtung (Ausgehend/Eingehend) · Datum+Uhrzeit (Default: jetzt) · Notiz (optional,
 * max 300). „Protokollieren" → onSave({channel, direction, occurredAt, note}); Abbrechen/Escape →
 * onCancel. Schreibt nichts selbst — der Aufrufer triggert createCommunication.
 * Tokens-only (LinkedIn-Blau etc. als --channel-*). Kein Emoji (Projekt-Regel) → Lucide-Icons.
 */
import { useEffect, useState } from "react";
import { Mail, Phone, Calendar, ArrowUpRight, ArrowDownLeft, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import type { CommunicationChannel, CommunicationDirection } from "@/lib/hunterMappers";

const CHANNELS: { value: CommunicationChannel; label: string; accent: string }[] = [
  { value: "email",    label: "Email",    accent: "var(--channel-email)" },
  { value: "linkedin", label: "LinkedIn", accent: "var(--channel-linkedin)" },
  { value: "call",     label: "Anruf",    accent: "var(--channel-call)" },
  { value: "meeting",  label: "Meeting",  accent: "var(--sherloq-primary)" },
];
// LinkedIn ist eine Brand-Glyphe (kein lucide-Icon) → eigener Render-Pfad.
const LUCIDE: Partial<Record<CommunicationChannel, LucideIcon>> = { email: Mail, call: Phone, meeting: Calendar };
function ChannelGlyph({ channel, className }: { channel: CommunicationChannel; className?: string }) {
  if (channel === "linkedin") return <LinkedinIcon className={className} />;
  const Icon = LUCIDE[channel] ?? Mail;
  return <Icon className={className} strokeWidth={2.2} />;
}

const DIRECTIONS: { value: CommunicationDirection; label: string; icon: LucideIcon }[] = [
  { value: "outbound", label: "Ausgehend", icon: ArrowUpRight },
  { value: "inbound",  label: "Eingehend", icon: ArrowDownLeft },
];

const MAX_NOTE = 300;
const pad = (n: number) => String(n).padStart(2, "0");

export default function KommunikationLogModal({
  open,
  onSave,
  onCancel,
  pending = false,
}: {
  open: boolean;
  onSave: (v: { channel: CommunicationChannel; direction: CommunicationDirection; occurredAt: string; note: string }) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const [channel, setChannel] = useState<CommunicationChannel>("email");
  const [direction, setDirection] = useState<CommunicationDirection>("outbound");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  // Bei jedem Öffnen frisch + Default „jetzt".
  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setChannel("email");
    setDirection("outbound");
    setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    setNote("");
  }, [open]);

  const submit = () => {
    if (!date || !time) return;
    const occurredAt = new Date(`${date}T${time}:00`).toISOString();
    onSave({ channel, direction, occurredAt, note: note.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="typo-card-title text-text-primary">Kontakt protokollieren</DialogTitle>
          <DialogDescription className="text-[12px] text-text-muted">
            Erfasse einen Touchpoint — aktualisiert „zuletzt kontaktiert".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kanal */}
          <div>
            <span className="block text-[11px] font-semibold text-text-muted mb-2">Kanal</span>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => {
                const sel = channel === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border text-[12px] font-bold transition-colors cursor-pointer"
                    style={
                      sel
                        ? { color: c.accent, borderColor: c.accent, background: `color-mix(in srgb, ${c.accent} 10%, transparent)` }
                        : { color: "var(--text-body)", borderColor: "var(--border)", background: "var(--app-bg)" }
                    }
                  >
                    <span style={{ color: c.accent }} className="inline-flex"><ChannelGlyph channel={c.value} className="w-4 h-4" /></span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Richtung */}
          <div>
            <span className="block text-[11px] font-semibold text-text-muted mb-2">Richtung</span>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => {
                const Icon = d.icon;
                const sel = direction === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDirection(d.value)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] border text-[12px] font-bold transition-colors cursor-pointer ${
                      sel
                        ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]"
                        : "border-border text-text-body bg-app-bg"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.5} /> {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datum + Uhrzeit */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[11px] font-semibold text-text-muted mb-2">Datum</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold"
              />
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-text-muted mb-2">Uhrzeit</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold"
              />
            </div>
          </div>

          {/* Notiz */}
          <div>
            <span className="block text-[11px] font-semibold text-text-muted mb-2">Notiz <span className="font-normal">(optional)</span></span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
              rows={3}
              placeholder="Worum ging es?"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] resize-none"
            />
            <span className="block text-right text-[10px] text-text-muted mt-1">{note.length}/{MAX_NOTE}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !date || !time}
            className="px-4 py-2 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[12px] font-bold hover:bg-[var(--sherloq-primary-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Protokollieren →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
