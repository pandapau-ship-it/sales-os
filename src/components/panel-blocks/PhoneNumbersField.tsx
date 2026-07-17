/**
 * PhoneNumbersField — mehrere Telefonnummern (Typ-Select + Nummer + Primär-Stern).
 * Controlled: value + onChange. Wiederverwendbar in Kontakt-Formularen.
 */
import { Phone, Star, Plus, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export interface PhoneRow { id: number; type: string; number: string; primary: boolean; }
const TYPES = ["Mobil", "Büro", "Direkt"];
const FIELD =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";

export default function PhoneNumbersField({
  value, onChange,
}: { value: PhoneRow[]; onChange: (rows: PhoneRow[]) => void }) {
  const add = () =>
    onChange([...value, { id: Math.max(0, ...value.map((x) => x.id)) + 1, type: "Büro", number: "", primary: false }]);
  const remove = (id: number) => {
    let next = value.filter((x) => x.id !== id);
    if (next.length && !next.some((x) => x.primary)) next = next.map((x, i) => (i === 0 ? { ...x, primary: true } : x));
    onChange(next);
  };
  const setPrimary = (id: number) => onChange(value.map((x) => ({ ...x, primary: x.id === id })));
  const patch = (id: number, key: "type" | "number", val: string) =>
    onChange(value.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  return (
    <div className="flex flex-col gap-2">
      {value.map((ph) => (
        <div key={ph.id} className="group flex items-center gap-2">
          <button type="button" onClick={() => setPrimary(ph.id)} aria-label="Primär markieren" data-tip="Primär markieren"
            className={`w-9 h-9 shrink-0 rounded-[10px] border flex items-center justify-center transition-colors cursor-pointer ${ph.primary ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border text-text-muted hover:text-text-body"}`}>
            <Star className="w-3.5 h-3.5" fill={ph.primary ? "currentColor" : "none"} />
          </button>
          <Select value={ph.type} onValueChange={(v) => patch(ph.id, "type", v)}>
            <SelectTrigger className="w-[120px] shrink-0 rounded-[10px] border-border bg-app-bg text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Phone className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="tel" placeholder="+49 170 ..." value={ph.number} onChange={(e) => patch(ph.id, "number", e.target.value)} className={`${FIELD} pl-9`} />
          </div>
          {value.length > 1 && (
            <button type="button" onClick={() => remove(ph.id)} aria-label="Nummer entfernen" data-tip="Nummer entfernen" className={`w-9 h-9 shrink-0 rounded-[10px] text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-bg flex items-center justify-center cursor-pointer ${HOVER_ACTIONS}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer mt-0.5">
        <Plus className="w-3.5 h-3.5" /> Nummer hinzufügen
      </button>
    </div>
  );
}
