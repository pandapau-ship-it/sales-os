/**
 * NotizenListe — Notizen-Tab (820px-Panel + Vollansicht): manuelle Notizen mit
 * Datum + Uhrzeit + Autor. „Neue Notiz" öffnet einen Inline-Composer (Textarea),
 * Bearbeiten editiert inline, Bearbeiten/Löschen erscheinen nur bei Hover (HOVER_ACTIONS).
 * Datengetrieben (NotizItem) + Default-Mock — das System spielt echte Notizen später ein.
 */
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export interface NotizItem {
  id: string;
  text: string;
  date: string; // "12. Mai 2026"
  time: string; // "09:14"
  author: string;
}

const DEFAULT_NOTES: NotizItem[] = [
  { id: "n1", text: "Thomas hat angedeutet, dass das Q3-Budget freigegeben wird.", date: "12. Mai 2026", time: "09:14", author: "Oliver Prossi" },
  { id: "n2", text: "Demo lief hervorragend, Thomas war sehr engagiert.", date: "03. April 2026", time: "16:48", author: "Oliver Prossi" },
];

const TEXTAREA =
  "w-full px-3.5 py-3 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors resize-none text-[13px] font-medium leading-relaxed min-h-[88px]";

let seq = 0;

export default function NotizenListe({
  onToast, autoCompose = false, onAutoComposeConsumed,
}: { onToast?: (msg: string) => void; autoCompose?: boolean; onAutoComposeConsumed?: () => void }) {
  const [notes, setNotes] = useState<NotizItem[]>(DEFAULT_NOTES);
  const [composerOpen, setComposerOpen] = useState(autoCompose);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // autoCompose (Footer „Notiz") nur beim Eintritt anwenden, dann im Parent zurücksetzen.
  useEffect(() => { if (autoCompose) onAutoComposeConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stamp = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
      time: now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const addNote = () => {
    if (!draft.trim()) { setComposerOpen(false); return; }
    const { date, time } = stamp();
    setNotes((prev) => [{ id: `new-${seq++}`, text: draft.trim(), date, time, author: "Oliver Prossi" }, ...prev]);
    setDraft("");
    setComposerOpen(false);
    onToast?.("Neue Notiz angelegt ✓");
  };

  const saveEdit = (id: string) => {
    if (!editDraft.trim()) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: editDraft.trim() } : n)));
    setEditingId(null);
    onToast?.("Notiz aktualisiert ✓");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    onToast?.("Notiz gelöscht");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Notizen</span>
        <button onClick={() => setComposerOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Neue Notiz
        </button>
      </div>

      {/* Composer für neue Notiz */}
      {composerOpen && (
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm animate-fade-in space-y-3">
          <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Notiz schreiben…" className={TEXTAREA} />
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setComposerOpen(false); setDraft(""); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-text-muted hover:text-text-body text-[11px] font-bold transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" /> Abbrechen
            </button>
            <button onClick={addNote} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Speichern
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !composerOpen && (
        <div className="text-[12px] text-text-muted px-1">Noch keine Notizen — „Neue Notiz" anlegen.</div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="group p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] text-text-muted font-bold">{note.date} · {note.time} · {note.author}</span>
              {editingId !== note.id && (
                <div className={`flex items-center gap-1 shrink-0 ${HOVER_ACTIONS}`}>
                  <button onClick={() => { setEditingId(note.id); setEditDraft(note.text); }} aria-label="Bearbeiten" data-tip="Bearbeiten" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} aria-label="Löschen" data-tip="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {editingId === note.id ? (
              <div className="mt-2 space-y-3">
                <textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className={TEXTAREA} />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-text-muted hover:text-text-body text-[11px] font-bold transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" /> Abbrechen
                  </button>
                  <button onClick={() => saveEdit(note.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
                    <Check className="w-3.5 h-3.5" /> Speichern
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-text-body font-medium leading-relaxed mt-1.5">{note.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
