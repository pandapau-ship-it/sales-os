/**
 * MailComposer — schlanke „Neue E-Mail"-Maske (An / Betreff / Nachricht + Senden/Abbrechen).
 * House-Style wie TaskFormular/NewDealCard: Header 15px/bold, Labels 11px/semibold, Inputs
 * px-3.5 py-2.5 auf bg-app-bg, primärer CTA als Gradient-Pill. Prop-driven, Tokens-only.
 * Genutzt im Kommunikation-Tab (Footer-Aktion „Mail").
 */
import { useState } from "react";
import { Mail, Send, X } from "lucide-react";

const LABEL = "text-[11px] font-semibold text-text-muted";
const INPUT =
  "w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold";

export default function MailComposer({
  to = "", onClose, onSend,
}: { to?: string; onClose: () => void; onSend?: () => void }) {
  const [toVal, setToVal] = useState(to);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = () => {
    if (!toVal.trim() || !body.trim()) return;
    onSend?.();
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-app-surface rounded-[12px] border border-[var(--border-card)] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--sherloq-primary)]" />
            <h2 className="typo-card-title text-text-primary">Neue E-Mail</h2>
          </div>
          <button onClick={onClose} aria-label="Schließen" data-tip="Schließen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL}>An</label>
            <input type="email" value={toVal} onChange={(e) => setToVal(e.target.value)} placeholder="name@firma.de" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Betreff</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Betreff" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Nachricht</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nachricht schreiben…"
              className="w-full px-3.5 py-3 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors resize-none text-[13px] font-medium leading-relaxed min-h-[140px]"
            />
          </div>
        </div>
      </div>

      <button onClick={send} className="w-full py-3 text-on-accent rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
        <Send className="w-4 h-4" /> Senden
      </button>
      <button onClick={onClose} className="w-full text-center text-[12px] font-bold text-text-muted hover:text-text-body transition-colors cursor-pointer">
        Abbrechen
      </button>
    </div>
  );
}
