/**
 * KiKurzakte — KI-Kurzakte als Bullet-Liste, manuell editierbar (Stift → Textarea → Speichern).
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx. Edit-/Draft-State intern;
 * `onSave` liefert die geparsten Zeilen zurück (Aufrufer speichert + zeigt ggf. Toast).
 */
import { useState } from "react";
import { Zap, Pencil, Save } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export default function KiKurzakte({ items, onSave }: { items: string[]; onSave: (items: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="group bg-app-surface rounded-[12px] p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--sherloq-primary)] uppercase tracking-wider">
          <Zap className="w-4 h-4" /> KI Kurzakte
        </div>
        {!editing && (
          <button onClick={() => { setDraft(items.join('\n')); setEditing(true); }} aria-label="Bearbeiten" data-tip="Bearbeiten" className={`text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer ${HOVER_ACTIONS}`}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Ein Stichpunkt pro Zeile"
            className="w-full bg-app-bg border border-[var(--sherloq-primary)] rounded-[10px] p-3 text-[13px] text-text-primary leading-relaxed outline-none resize-none scrollbar-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-[10px] border border-border text-text-body text-[11px] font-bold hover:bg-app-bg transition-colors cursor-pointer">Abbrechen</button>
            <button
              onClick={() => {
                const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
                onSave(lines);
                setEditing(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Speichern
            </button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 text-[13px] text-text-body leading-relaxed">
          {items.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
