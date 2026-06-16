/**
 * PhoneField — mehrere Telefonnummern platzsparend. Inline nur der Favorit
 * (Typ-Pill + Nummer), beim Hover ein leises „+N" + Chevron. Klick öffnet ein
 * Popover (schwebt, kein Scrim) mit allen Nummern: Anrufen (tel:), Kopieren,
 * Stern = Favorit. Reihenfolge bleibt stabil (kein Umsortieren beim Favorisieren).
 * Verwaltung/Anlegen läuft später über die Vollansicht.
 * Extrahiert aus features/hunter/HunterSidepanel.tsx — kanonischer Stand.
 */
import { useState } from 'react';
import { Star, Check, Copy, Pencil, X, Phone, Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export interface Phone { id: string; type: string; number: string; favorite: boolean }

export default function PhoneField({
  phones, onSetFavorite, onUpdateNumber, onCopy, onAdd,
}: { phones: Phone[]; onSetFavorite: (id: string) => void; onUpdateNumber: (id: string, number: string) => void; onCopy: () => void; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const fav = phones.find((p) => p.favorite) ?? phones[0];
  const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, '')}`;

  const copy = async (p: Phone) => {
    try { await navigator.clipboard.writeText(p.number); } catch { /* clipboard nicht verfügbar */ }
    setCopiedId(p.id);
    onCopy();
    setTimeout(() => setCopiedId(null), 1500);
  };
  const startEdit = (p: Phone) => { setDraft(p.number); setEditId(p.id); setOpen(true); };
  const saveEdit = () => { if (editId) onUpdateNumber(editId, draft.trim()); setEditId(null); };

  if (!fav) return null;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
      <span className="inline-flex items-center gap-1.5 group/phone min-w-0">
        {/* Typ-Pill = Trigger: Klick zeigt die anderen Nummern in der Vorschau */}
        <PopoverTrigger asChild>
          <button
            aria-label="Weitere Nummern anzeigen" title="Weitere Nummern anzeigen"
            className="px-1.5 py-0.5 rounded-[5px] bg-app-bg text-[9px] font-bold text-text-muted uppercase tracking-wide shrink-0 hover:bg-[var(--signal-teal-bg)] hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer"
          >
            {fav.type}
          </button>
        </PopoverTrigger>
        <span className="truncate transition-colors group-hover/phone:text-[var(--sherloq-primary)] group-hover/phone:font-semibold">{fav.number}</span>
        {/* Inline Copy + Edit für den Favoriten (wie die übrigen Felder) */}
        <button onClick={() => copy(fav)} aria-label="Kopieren" title="Kopieren" className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
          {copiedId === fav.id ? <Check className="w-3 h-3 text-[var(--sherloq-primary)]" /> : <Copy className="w-3 h-3" />}
        </button>
        <button onClick={() => startEdit(fav)} aria-label="Bearbeiten" title="Bearbeiten" className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
          <Pencil className="w-3 h-3" />
        </button>
      </span>

      <PopoverContent portal={false} align="start" sideOffset={8} className="w-[320px] p-0 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-subtle text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Telefon</div>
        <div className="py-1">
          {phones.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-app-bg transition-colors">
              <button
                onClick={() => onSetFavorite(p.id)}
                aria-label={p.favorite ? 'Favorit' : 'Als Favorit setzen'} title={p.favorite ? 'Favorit' : 'Als Favorit setzen'}
                className="shrink-0 cursor-pointer"
              >
                <Star className={`w-3.5 h-3.5 transition-colors ${p.favorite ? 'fill-[var(--sherloq-primary)] text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-[var(--sherloq-primary)]'}`} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wide">{p.type}</div>
                {editId === p.id ? (
                  <input
                    autoFocus
                    type="tel"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                      if (e.key === 'Escape') { e.preventDefault(); setEditId(null); }
                    }}
                    className="w-full bg-app-surface border border-[var(--sherloq-primary)] rounded-[7px] px-2 py-1 text-[13px] font-semibold text-text-primary outline-none"
                  />
                ) : (
                  <a href={telHref(p.number)} className="block text-[13px] font-semibold text-text-body hover:text-[var(--sherloq-primary)] transition-colors truncate">{p.number}</a>
                )}
              </div>
              {editId === p.id ? (
                <>
                  <button onClick={saveEdit} aria-label="Speichern" title="Speichern" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditId(null)} aria-label="Abbrechen" title="Abbrechen" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <a href={telHref(p.number)} aria-label="Anrufen" title="Anrufen" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => copy(p)} aria-label="Kopieren" title="Kopieren" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => startEdit(p)} aria-label="Bearbeiten" title="Bearbeiten" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <button onClick={onAdd} className="w-full px-4 py-2.5 border-t border-border-subtle text-left text-[12px] font-bold text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nummer hinzufügen
        </button>
      </PopoverContent>
    </Popover>
  );
}
