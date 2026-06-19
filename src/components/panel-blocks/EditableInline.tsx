/**
 * EditableInline — Anzeige eines nicht-systemvorgegebenen Felds (Kontaktdaten).
 * Hover: Inhalt wird dunkelgrün + Copy- und Stift-Icon erscheinen.
 *  - Copy  → kopiert den Wert wirklich in die Zwischenablage (kurzes Check-Feedback).
 *  - Stift → öffnet ein Popover (schwebt über dem Feld, KEIN abgedunkelter Hintergrund)
 *            mit Eingabefeld + Speichern/Abbrechen.
 *  - href  → Wert wird als Hyperlink gerendert (neuer Tab, neutrale Farbe, nicht blau).
 * Extrahiert aus features/hunter/HunterSidepanel.tsx — kanonischer Stand.
 */
import { useState } from 'react';
import { Check, Copy, Pencil, Save } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export default function EditableInline({
  value, label, onSave, onCopy, type = 'text', href,
}: { value: string; label: string; onSave: (v: string) => void; onCopy: () => void; type?: string; href?: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [copied, setCopied] = useState(false);

  const save = () => { onSave(draft.trim()); setOpen(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard nicht verfügbar */ }
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  const valueClass = "truncate transition-colors text-text-muted group-hover/edit:text-[var(--sherloq-primary)] group-hover/edit:font-semibold";

  return (
    <Popover open={open} onOpenChange={(o) => { if (o) setDraft(value); setOpen(o); }}>
      <PopoverAnchor asChild>
        <span className="inline-flex items-center gap-1 group/edit cursor-default">
          {href && value ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`${valueClass} hover:underline cursor-pointer`}>
              {value}
            </a>
          ) : (
            <span className={valueClass}>{value || '—'}</span>
          )}
          <button onClick={copy} aria-label="Kopieren" data-tip="Kopieren" className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
            {copied ? <Check className="w-3 h-3 text-[var(--sherloq-primary)]" /> : <Copy className="w-3 h-3" />}
          </button>
          <PopoverTrigger asChild>
            <button aria-label="Bearbeiten" data-tip="Bearbeiten" className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
              <Pencil className="w-3 h-3" />
            </button>
          </PopoverTrigger>
        </span>
      </PopoverAnchor>

      <PopoverContent portal={false} align="start" sideOffset={8} className="w-[300px] space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">{label}</label>
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
            className="w-full bg-app-bg border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-[var(--sherloq-primary)] transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setOpen(false)} className="px-3.5 py-1.5 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
            Abbrechen
          </button>
          <button onClick={save} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: 'var(--sherloq-gradient)' }}>
            <Save className="w-3.5 h-3.5" /> Speichern
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
