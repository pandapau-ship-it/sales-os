/**
 * SubscriptionBox — Vertrags-/Abo-Block des Farmer-Info-Panels ([D33], Slice 2). Read-only
 * Kennzahlen-Grid (Plan · Status · MRR · ARR · Aktiv seit · Nächste Zahlung · Kündigungsfrist · NRR)
 * im typo-Kanon (`typo-field-label`/`typo-field-value`). Elevation = In-Panel-Box
 * (`DetailSection` variant 'panel' → border-card, KEIN Schatten). Status = `SubscriptionBadge`.
 * HONESTY: fehlende Werte werden ausgeblendet — keine erfundenen Fallbacks. Inhaltliche Vorlage:
 * alter CustomerDrawer (aber neu im Kanon). Mock bis Farmer-DB-Wiring.
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

export default function SubscriptionBox({ data }: { data: SubscriptionData }) {
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
