/**
 * DetailField — Profil-Feld im Read-Mode (Attio/Clay-Stil).
 *  - Standard: Wert ohne Input-Rahmen. Klick auf Wert (oder Stift) → inline editierbar,
 *    speichern bei Blur/Enter, Escape bricht ab.
 *  - options: Dropdown-Auswahl (Anrede, Land, Lead Status …).
 *  - copyable: Copy-Icon rechts → navigator.clipboard + onCopy()-Hook (Toast).
 *  - href: Wert als Link (neuer Tab), Edit weiterhin über Stift.
 *  - readonly: System-Wert (gedimmt, nicht editierbar).
 *  - leer + nicht readonly → kleiner „+ Hinzufügen"-Link statt leerem Feld.
 * Prop-driven · nur index.css-Tokens · Dark-Mode automatisch.
 */
import { useState, useEffect } from "react";
import { Copy, Check, Pencil, Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface DetailFieldProps {
  label: string;
  value: string;
  onSave?: (v: string) => void;
  options?: string[];
  onSelect?: (v: string) => void;
  href?: string;
  copyable?: boolean;
  onCopy?: () => void;
  readonly?: boolean;
  type?: string;
  placeholder?: string;
}

export default function DetailField({
  label, value, onSave, options, onSelect, href, copyable, onCopy, readonly, type = "text", placeholder,
}: DetailFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const filled = value.trim().length > 0;

  const Label = <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-1">{label}</div>;

  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard n/a */ }
    onCopy?.();
  };

  // System-Wert — gedimmt, nicht editierbar.
  if (readonly) {
    return (
      <div className="min-w-0">
        {Label}
        <div className="text-[14px] font-semibold text-text-muted truncate" data-tip="Vom System vergeben">{value || "—"}</div>
      </div>
    );
  }

  // Dropdown — klick öffnet die Auswahl.
  if (options) {
    return (
      <div className="min-w-0">
        {Label}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group/df inline-flex items-center gap-1.5 text-[14px] font-semibold text-text-primary hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer max-w-full">
              <span className="truncate">{value || placeholder || "—"}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted opacity-0 group-hover/df:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {options.map((o) => (
              <DropdownMenuItem key={o} onClick={() => onSelect?.(o)} className="cursor-pointer text-[13px] font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${o === value ? "bg-[var(--sherloq-primary)]" : "bg-[var(--border-strong)]"}`} />
                {o}
                {o === value && <Check className="w-3.5 h-3.5 ml-auto text-[var(--sherloq-primary)]" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Editier-Modus — direkt im Feld tippen.
  if (editing) {
    return (
      <div className="min-w-0">
        {Label}
        <input
          autoFocus
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { if (draft.trim() !== value.trim()) onSave?.(draft.trim()); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="w-full rounded-[8px] border border-[var(--sherloq-primary)] bg-app-surface px-2.5 py-1.5 text-[14px] font-semibold text-text-primary outline-none placeholder-[var(--text-muted)]"
        />
      </div>
    );
  }

  // Leeres Feld — „+ Hinzufügen" statt leerer Zeile.
  if (!filled) {
    return (
      <div className="min-w-0">
        {Label}
        <button onClick={() => { setDraft(""); setEditing(true); }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Hinzufügen
        </button>
      </div>
    );
  }

  // Read-Mode — Wert ohne Rahmen. Aktionen direkt dahinter (bei Copy-Feldern dauerhaft sichtbar).
  return (
    <div className="min-w-0 group/df">
      {Label}
      <div className="inline-flex items-center gap-1.5 max-w-full">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-text-primary hover:text-[var(--sherloq-primary)] hover:underline truncate transition-colors">{value}</a>
        ) : (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-[14px] font-semibold text-text-primary text-left truncate hover:text-[var(--sherloq-primary)] transition-colors cursor-text">{value}</button>
        )}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${copyable ? "opacity-100" : "opacity-0 group-hover/df:opacity-100"}`}>
          {copyable && (
            <button onClick={copy} aria-label="Kopieren" data-tip="Kopieren" className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => { setDraft(value); setEditing(true); }} aria-label="Bearbeiten" data-tip="Bearbeiten" className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
