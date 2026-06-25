/**
 * SubscriptionBox — Vertrags-/Abo-Block des Farmer-Info-Panels ([D33], Slice 2).
 * `variant="full"`    → Read-only Kennzahlen-Grid (Plan · Status · MRR · ARR · Aktiv seit · Nächste
 *                       Zahlung · Kündigungsfrist · NRR) im typo-Kanon. Elevation = In-Panel-Box
 *                       (`DetailSection` variant 'panel' → border-card, KEIN Schatten).
 * `variant="compact"` → kompakte Übersicht-Zeile (Plan · Status · MRR · Nächste Zahlung/Kündigung)
 *                       analog `UsageBox` compact, Klick → voller Subscription-Tab (`onShowAll`).
 * Status = `SubscriptionBadge`. HONESTY: fehlende Werte werden ausgeblendet — keine erfundenen
 * Fallbacks. Inhaltliche Vorlage: alter CustomerDrawer (aber neu im Kanon). Mock bis Farmer-DB-Wiring.
 */
import type { ReactNode } from 'react';
import { CreditCard } from 'lucide-react';
import DetailSection from './DetailSection';
import SubscriptionBadge from '../farming/SubscriptionBadge';

export interface SubscriptionData {
  plan?: string;
  status?: string;            // SubscriptionBadge (active/cancelled/…)
  mrr?: string;
  arr?: string;
  activeSince?: string;
  nextPayment?: string;
  cancellationPeriod?: string;
  nrr?: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="typo-field-label text-text-muted">{label}</span>
      <span className="typo-field-value text-text-primary">{children}</span>
    </div>
  );
}

export default function SubscriptionBox({
  data, variant = 'full', onShowAll,
}: {
  data: SubscriptionData;
  variant?: 'full' | 'compact';
  onShowAll?: () => void;
}) {
  if (variant === 'compact') {
    // Kompakte Übersicht-Zeile (nur vorhandene Teile). Klick → voller Subscription-Tab.
    const parts: { label: string; value: ReactNode }[] = [];
    if (data.plan) parts.push({ label: 'Plan', value: data.plan });
    if (data.status) parts.push({ label: 'Status', value: <SubscriptionBadge status={data.status} /> });
    if (data.mrr) parts.push({ label: 'MRR', value: data.mrr });
    if (data.nextPayment) parts.push({ label: 'Nächste Zahlung', value: data.nextPayment });
    else if (data.cancellationPeriod) parts.push({ label: 'Kündigung', value: data.cancellationPeriod });
    if (parts.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="typo-section-label text-text-muted">Subscription</span>
          {onShowAll && (
            <button type="button" onClick={onShowAll} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
              Subscription ansehen →
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onShowAll}
          className="w-full bg-app-surface border border-[var(--border-card)] rounded-[12px] p-4 flex items-center flex-wrap gap-x-6 gap-y-2 text-left hover:bg-app-bg transition-colors cursor-pointer"
        >
          {parts.map((p) => (
            <span key={p.label} className="flex items-center gap-2 min-w-0">
              <span className="typo-field-label text-text-muted">{p.label}</span>
              <span className="text-[12px] font-bold text-text-primary">{p.value}</span>
            </span>
          ))}
        </button>
      </div>
    );
  }

  return (
    <DetailSection title="Subscription" icon={CreditCard}>
      {data.plan && <Field label="Plan">{data.plan}</Field>}
      {data.status && (
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="typo-field-label text-text-muted">Status</span>
          <div><SubscriptionBadge status={data.status} /></div>
        </div>
      )}
      {data.mrr && <Field label="MRR">{data.mrr}</Field>}
      {data.arr && <Field label="ARR">{data.arr}</Field>}
      {data.activeSince && <Field label="Aktiv seit">{data.activeSince}</Field>}
      {data.nextPayment && <Field label="Nächste Zahlung">{data.nextPayment}</Field>}
      {data.cancellationPeriod && <Field label="Kündigungsfrist">{data.cancellationPeriod}</Field>}
      {data.nrr && <Field label="NRR">{data.nrr}</Field>}
    </DetailSection>
  );
}
