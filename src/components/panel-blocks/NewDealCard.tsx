/**
 * NewDealCard — „Neuer Deal"-Karte (Deal-Name, Produkt, Wert, Owner, ARR/MRR optional,
 * Abschluss-Datum). Controlled: deal + onChange(patch). Zentrale Deal-Formular-Komponente —
 * wiederverwendbar in Lead-/Deal-Formularen (DealsListe, AddSdrLeadPanel). Produkt = Dropdown
 * mit der Option „Eigenes Produkt…" (Freitext).
 */
import { useState } from "react";
import { Briefcase, Euro, Calendar } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PanelField from './PanelField';

export interface DealDraft { name: string; product: string; value: string; owner: string; arr: string; mrr: string; close: string; }

/** Standard-Produktkatalog (bis system_config). Eigenes Produkt → „Eigenes Produkt…". */
// Nur der Default für `products` unten — kein Importeur außerhalb dieser Datei.
const DEAL_PRODUCTS = ["Starter", "Growth", "Scale", "Enterprise", "Enrichment Add-on", "Signals Add-on"];
const CUSTOM = "__custom__";

const FIELD_SURFACE =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-surface border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";

export default function NewDealCard({
  deal, onChange, owners, onRemove, products = DEAL_PRODUCTS,
}: { deal: DealDraft; onChange: (patch: Partial<DealDraft>) => void; owners: string[]; onRemove: () => void; products?: string[] }) {
  // Custom-Produkt aktiv, wenn ein Produktname gesetzt ist, der nicht im Katalog steht.
  const [custom, setCustom] = useState<boolean>(!!deal.product && !products.includes(deal.product));
  const selectValue = custom ? CUSTOM : (deal.product || undefined);
  const onProduct = (v: string) => {
    if (v === CUSTOM) { setCustom(true); onChange({ product: "" }); }
    else { setCustom(false); onChange({ product: v }); }
  };

  return (
    <div className="rounded-[12px] border border-[var(--border-card)] bg-app-bg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[var(--sherloq-primary)]" />
          <span className="text-[12px] font-bold text-text-primary">Neuer Deal</span>
        </div>
        <button type="button" onClick={onRemove} className="text-[11px] font-semibold text-text-muted hover:text-[var(--signal-danger-text)] transition-colors cursor-pointer">
          entfernen
        </button>
      </div>

      <PanelField label="Deal-Name">
        <input type="text" placeholder="z.B. LogixFlow — Growth" value={deal.name} onChange={(e) => onChange({ name: e.target.value })} className={FIELD_SURFACE} />
      </PanelField>

      <PanelField label="Produkt">
        <Select value={selectValue} onValueChange={onProduct}>
          <SelectTrigger className="w-full rounded-[10px] border-border bg-app-surface text-[13px]"><SelectValue placeholder="Produkt wählen…" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            <SelectItem value={CUSTOM}>Eigenes Produkt…</SelectItem>
          </SelectContent>
        </Select>
        {custom && (
          <input autoFocus type="text" placeholder="Produktname eingeben" value={deal.product} onChange={(e) => onChange({ product: e.target.value })} className={`${FIELD_SURFACE} mt-2`} />
        )}
      </PanelField>

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
