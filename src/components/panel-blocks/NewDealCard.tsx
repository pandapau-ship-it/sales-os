/**
 * NewDealCard — „Neuer Deal"-Karte (Wert, Owner, ARR/MRR optional, Abschluss-Datum).
 * Controlled: deal + onChange(patch). Wiederverwendbar in Lead-/Deal-Formularen.
 */
import { Briefcase, Euro, Calendar } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PanelField from "@/components/panel-blocks/PanelField";

export interface DealDraft { value: string; owner: string; arr: string; mrr: string; close: string; }
const FIELD_SURFACE =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-surface border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";

export default function NewDealCard({
  deal, onChange, owners, onRemove,
}: { deal: DealDraft; onChange: (patch: Partial<DealDraft>) => void; owners: string[]; onRemove: () => void }) {
  return (
    <div className="rounded-[12px] border border-border bg-app-bg p-4 flex flex-col gap-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[var(--sherloq-primary)]" />
          <span className="text-[12px] font-bold text-text-primary">Neuer Deal</span>
        </div>
        <button type="button" onClick={onRemove} className="text-[11px] font-semibold text-text-muted hover:text-[var(--signal-danger-text)] transition-colors cursor-pointer">
          entfernen
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PanelField label="Wert / Betrag">
          <div className="relative">
            <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="number" min="0" step="100" placeholder="25000" value={deal.value} onChange={(e) => onChange({ value: e.target.value })} className={`${FIELD_SURFACE} pl-9`} />
          </div>
        </PanelField>
        <PanelField label="Owner">
          <Select value={deal.owner || undefined} onValueChange={(v) => onChange({ owner: v })}>
            <SelectTrigger className="w-full rounded-[10px] border-border bg-app-surface text-[13px]"><SelectValue placeholder="Zuständig…" /></SelectTrigger>
            <SelectContent>{owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </PanelField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PanelField label="ARR" hint="(optional)">
          <div className="relative">
            <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="number" min="0" step="100" placeholder="12000" value={deal.arr} onChange={(e) => onChange({ arr: e.target.value })} className={`${FIELD_SURFACE} pl-9`} />
          </div>
        </PanelField>
        <PanelField label="MRR" hint="(optional)">
          <div className="relative">
            <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="number" min="0" step="100" placeholder="1000" value={deal.mrr} onChange={(e) => onChange({ mrr: e.target.value })} className={`${FIELD_SURFACE} pl-9`} />
          </div>
        </PanelField>
      </div>
      <PanelField label="Abschluss-Datum (erwartet)">
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="date" value={deal.close} onChange={(e) => onChange({ close: e.target.value })} className={`${FIELD_SURFACE} pl-9 pr-3 text-text-body`} />
        </div>
      </PanelField>
    </div>
  );
}
