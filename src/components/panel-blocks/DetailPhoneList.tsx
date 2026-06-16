/**
 * DetailPhoneList — Telefonnummern im Profil-Read-Mode (Attio/Clay-Stil).
 *  - Stern: als Favorit (primäre Nummer) markieren.
 *  - Typ je Nummer via Dropdown (Mobil/Geschäftlich/…).
 *  - Nummer: Read-Mode, Klick → inline editierbar.
 *  - Copy + Löschen pro Eintrag · „+ Nummer hinzufügen" unten.
 * Controlled/prop-driven — State lebt beim Aufrufer.
 */
import { useState, useEffect, useRef } from "react";
import { Star, Copy, Trash2, Plus, Check, ChevronDown, Phone } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface PhoneEntry { id: string; type: string; number: string; favorite: boolean }

export default function DetailPhoneList({
  phones, types, onSetFavorite, onUpdate, onAdd, onRemove, onCopy,
}: {
  phones: PhoneEntry[];
  types: string[];
  onSetFavorite: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PhoneEntry>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onCopy: (num: string) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);

  // Neu hinzugefügte Nummer direkt zum Tippen fokussieren.
  const prevLen = useRef(phones.length);
  useEffect(() => {
    if (phones.length > prevLen.current) setEditId(phones[phones.length - 1].id);
    prevLen.current = phones.length;
  }, [phones]);

  const copy = async (num: string) => {
    try { await navigator.clipboard.writeText(num); } catch { /* clipboard n/a */ }
    onCopy(num);
  };

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Telefonnummern</div>
      <div className="flex flex-col gap-1.5">
        {phones.length === 0 && <div className="text-[13px] text-text-muted">Keine Nummer hinterlegt.</div>}
        {phones.map((p) => (
          <div key={p.id} className="group/ph flex items-center gap-2">
            <button
              onClick={() => onSetFavorite(p.id)}
              aria-label="Als primäre Nummer markieren"
              title="Als primäre Nummer markieren"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-app-surface transition-colors cursor-pointer"
            >
              <Star className={`w-[15px] h-[15px] ${p.favorite ? "text-[var(--sherloq-primary)]" : "text-text-muted"}`} fill={p.favorite ? "currentColor" : "none"} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group/t shrink-0 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-text-muted hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer w-[88px]">
                  <span className="truncate">{p.type}</span>
                  <ChevronDown className="w-3 h-3 shrink-0 opacity-0 group-hover/t:opacity-100 transition-opacity" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {types.map((t) => (
                  <DropdownMenuItem key={t} onClick={() => onUpdate(p.id, { type: t })} className="cursor-pointer text-[13px] font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${t === p.type ? "bg-[var(--sherloq-primary)]" : "bg-[var(--border-strong)]"}`} />
                    {t}
                    {t === p.type && <Check className="w-3.5 h-3.5 ml-auto text-[var(--sherloq-primary)]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {editId === p.id ? (
              <input
                autoFocus
                type="tel"
                value={p.number}
                placeholder="+49 …"
                onChange={(e) => onUpdate(p.id, { number: e.target.value })}
                onBlur={() => { setEditId(null); if (!p.number.trim()) onRemove(p.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur(); }}
                className="w-[200px] max-w-full rounded-[8px] border border-[var(--sherloq-primary)] bg-app-surface px-2.5 py-1.5 text-[14px] font-semibold text-text-primary outline-none placeholder-[var(--text-muted)]"
              />
            ) : p.number ? (
              <button onClick={() => setEditId(p.id)} className="text-left text-[14px] font-semibold text-text-primary truncate hover:text-[var(--sherloq-primary)] transition-colors cursor-text">{p.number}</button>
            ) : (
              <button onClick={() => setEditId(p.id)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer">
                <Phone className="w-3.5 h-3.5" /> Nummer eintragen
              </button>
            )}

            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/ph:opacity-100 focus-within:opacity-100 transition">
              <button onClick={() => copy(p.number)} aria-label="Kopieren" className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onRemove(p.id)} aria-label="Entfernen" className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer">
        <Plus className="w-3.5 h-3.5" /> Nummer hinzufügen
      </button>
    </div>
  );
}
