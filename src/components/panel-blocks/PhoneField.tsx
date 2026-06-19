/**
 * PhoneField — mehrere Telefonnummern platzsparend. Inline nur der Favorit
 * (Typ-Pill + Nummer), beim Hover ein leises „+N" + Chevron. Klick öffnet ein
 * Popover (schwebt, kein Scrim) mit allen Nummern: Anrufen (tel:), Kopieren,
 * Stern = Favorit. Reihenfolge bleibt stabil (kein Umsortieren beim Favorisieren).
 * Verwaltung/Anlegen läuft später über die Vollansicht.
 * Extrahiert aus features/hunter/HunterSidepanel.tsx — kanonischer Stand.
 */
import { useState } from 'react';
import { Star, Check, Copy, Pencil, X, Phone, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { isValidPhone } from '@/lib/validation';

export interface Phone { id: string; type: string; number: string; favorite: boolean }

export default function PhoneField({
  phones, onSetFavorite, onUpdateNumber, onCopy, onAdd, onRemove, types, onUpdateLabel, readonly = false,
}: { phones: Phone[]; onSetFavorite?: (id: string) => void; onUpdateNumber?: (id: string, number: string) => void; onCopy: () => void; onAdd?: () => void; onRemove?: (id: string) => void; types?: string[]; onUpdateLabel?: (id: string, label: string) => void; readonly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);
  const fav = phones.find((p) => p.favorite) ?? phones[0];
  const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, '')}`;

  const copy = async (p: Phone) => {
    try { await navigator.clipboard.writeText(p.number); } catch { /* clipboard nicht verfügbar */ }
    setCopiedId(p.id);
    onCopy();
    setTimeout(() => setCopiedId(null), 1500);
  };
  const startEdit = (p: Phone) => { setDraft(p.number); setError(false); setEditId(p.id); setOpen(true); };
  const cancelEdit = () => { setEditId(null); setError(false); };
  const saveEdit = () => {
    if (!editId) return;
    const v = draft.trim();
    if (!isValidPhone(v)) { setError(true); return; } // ungültig → kein Write, Edit bleibt offen
    onUpdateNumber?.(editId, v);
    setEditId(null); setError(false);
  };

  if (!fav) return null;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) cancelEdit(); }}>
      <span className="inline-flex items-center gap-1.5 group/phone min-w-0">
        {/* Typ-Pill = Trigger: Klick zeigt die anderen Nummern in der Vorschau */}
        <PopoverTrigger asChild>
          <button
            aria-label="Weitere Nummern anzeigen" data-tip="Weitere Nummern anzeigen"
            className="px-1.5 py-0.5 rounded-[5px] bg-app-bg text-[9px] font-bold text-text-muted uppercase tracking-wide shrink-0 hover:bg-[var(--signal-teal-bg)] hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer"
          >
            {fav.type}
          </button>
        </PopoverTrigger>
        <span className="truncate transition-colors group-hover/phone:text-[var(--sherloq-primary)] group-hover/phone:font-semibold">{fav.number}</span>
        {/* Inline Copy + Edit für den Favoriten (wie die übrigen Felder) */}
        <button onClick={() => copy(fav)} aria-label="Kopieren" data-tip="Kopieren" className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
          {copiedId === fav.id ? <Check className="w-3 h-3 text-[var(--sherloq-primary)]" /> : <Copy className="w-3 h-3" />}
        </button>
        {!readonly && (
          <button onClick={() => startEdit(fav)} aria-label="Bearbeiten" data-tip="Bearbeiten" className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer shrink-0">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </span>

      <PopoverContent portal={false} align="start" sideOffset={8} className="w-[320px] p-0 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-subtle text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Telefon</div>
        <div className="py-1">
          {phones.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-app-bg transition-colors">
              {readonly ? (
                <span className="shrink-0" aria-label={p.favorite ? 'Favorit' : undefined} data-tip={p.favorite ? 'Favorit' : undefined}>
                  <Star className={`w-3.5 h-3.5 ${p.favorite ? 'fill-[var(--sherloq-primary)] text-[var(--sherloq-primary)]' : 'text-text-muted opacity-40'}`} />
                </span>
              ) : (
                <button
                  onClick={() => onSetFavorite?.(p.id)}
                  aria-label={p.favorite ? 'Favorit' : 'Als Favorit setzen'} data-tip={p.favorite ? 'Favorit' : 'Als Favorit setzen'}
                  className="shrink-0 cursor-pointer"
                >
                  <Star className={`w-3.5 h-3.5 transition-colors ${p.favorite ? 'fill-[var(--sherloq-primary)] text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-[var(--sherloq-primary)]'}`} />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wide">{p.type}</div>
                {editId === p.id ? (
                  <>
                    {types && onUpdateLabel && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {types.map((tp) => (
                          <button
                            key={tp}
                            onClick={() => onUpdateLabel(p.id, tp)}
                            className={`px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${tp === p.type ? 'bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]' : 'bg-app-bg text-text-muted hover:text-[var(--sherloq-primary)]'}`}
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      autoFocus
                      type="tel"
                      value={draft}
                      onChange={(e) => { setDraft(e.target.value); if (error) setError(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                      }}
                      className={`w-full bg-app-surface border rounded-[7px] px-2 py-1 text-[13px] font-semibold text-text-primary outline-none ${error ? 'border-[var(--signal-urgent-text)]' : 'border-[var(--sherloq-primary)]'}`}
                    />
                    {error && <div className="mt-1 text-[10px] font-semibold text-[var(--signal-urgent-text)]">Nur Ziffern und + erlaubt</div>}
                  </>
                ) : (
                  <a href={telHref(p.number)} className="block text-[13px] font-semibold text-text-body hover:text-[var(--sherloq-primary)] transition-colors truncate">{p.number}</a>
                )}
              </div>
              {editId === p.id ? (
                <>
                  <button onClick={saveEdit} aria-label="Speichern" data-tip="Speichern" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={cancelEdit} aria-label="Abbrechen" data-tip="Abbrechen" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <a href={telHref(p.number)} aria-label="Anrufen" data-tip="Anrufen" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => copy(p)} aria-label="Kopieren" data-tip="Kopieren" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {!readonly && (
                    <button onClick={() => startEdit(p)} aria-label="Bearbeiten" data-tip="Bearbeiten" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!readonly && onRemove && (
                    <button onClick={() => onRemove(p.id)} aria-label="Löschen" data-tip="Löschen" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {!readonly && (
          <button onClick={onAdd} className="w-full px-4 py-2.5 border-t border-border-subtle text-left text-[12px] font-bold text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nummer hinzufügen
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
