/**
 * ActionComposer — Chat-Eingabe der Action-Panels (Textarea + Senden).
 * Extrahiert aus shared/ChatActionPanel.tsx.
 */
import { useState } from "react";
import { Send } from "lucide-react";

export default function ActionComposer({
  placeholder = "Sherloq fragen…", onSend,
}: { placeholder?: string; onSend?: (text: string) => void }) {
  const [value, setValue] = useState("");
  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    setValue("");
  };
  return (
    <div className="flex items-end gap-2 bg-app-bg border border-border rounded-[14px] px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-app-surface transition-all">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder={placeholder}
        className="flex-1 bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-text-body placeholder-[var(--text-muted)] min-h-[28px] max-h-[96px] scrollbar-none py-1"
      />
      <button onClick={send} aria-label="Senden" title="Senden" className="w-9 h-9 rounded-full text-on-accent flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-sm" style={{ background: "var(--sherloq-gradient)" }}>
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
