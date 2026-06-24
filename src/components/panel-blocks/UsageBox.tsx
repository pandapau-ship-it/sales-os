/**
 * UsageBox — Sherloq-Usage-Block des Farmer-Info-Panels ([D33], Slice 2).
 * `variant="full"`  → volles Kennzahlen-Grid im Usage-Tab (Last Login · Last Usage · Profiles added
 *                     mit Trend · Messages mit Trend · Enrichments used/limit mit Warn-Tint · Onboarding).
 * `variant="compact"` → kompakter Vorgeschmack in der Übersicht (analog `KommunikationKompakt`):
 *                     Last Login · Onboarding · Enrichments-Auslastung + „Usage ansehen →".
 * typo-Kanon (`typo-field-label`/`typo-field-value`), Elevation = In-Panel-Box (border-card, kein
 * Schatten). HONESTY: fehlende Werte ausgeblendet. Inhaltliche Vorlage: alter CustomerDrawer. Mock.
 */
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import DetailSection from './DetailSection';

export interface UsageData {
  lastLogin?: string;
  lastUsage?: string;
  profilesAdded?: { value: string; trend?: string };
  messages?: { value: string; trend?: string };
  enrichments?: { used: number; limit: number };
  onboarding?: string;
}

/** Trend-Suffix: „+12%" grün (Anstieg) · „-8%" rot (Rückgang). */
function Trend({ trend }: { trend?: string }) {
  if (!trend) return null;
  const down = trend.trim().startsWith('-');
  const Icon = down ? TrendingDown : TrendingUp;
  const color = down ? 'text-[var(--signal-urgent-text)]' : 'text-[var(--signal-success-text)]';
  return (
    <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${color}`}>
      <Icon className="w-3 h-3" />{trend}
    </span>
  );
}

/** Auslastung ab 80 % → Warn-Tint (Honesty: kein Fake-Alarm darunter). */
function enrichmentHigh(u?: { used: number; limit: number }) {
  return !!u && u.limit > 0 && u.used / u.limit >= 0.8;
}
function fmtEnrichments(u: { used: number; limit: number }) {
  return `${u.used.toLocaleString('de-DE')} / ${u.limit.toLocaleString('de-DE')}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="typo-field-label text-text-muted">{label}</span>
      <span className="typo-field-value text-text-primary flex items-center gap-2">{children}</span>
    </div>
  );
}

export default function UsageBox({
  data, variant = 'full', onShowAll,
}: {
  data: UsageData;
  variant?: 'full' | 'compact';
  onShowAll?: () => void;
}) {
  const high = enrichmentHigh(data.enrichments);

  if (variant === 'compact') {
    // Kompakte Übersicht-Zeile (nur vorhandene Teile). Klick → voller Usage-Tab.
    const parts: { label: string; value: React.ReactNode; tint?: boolean }[] = [];
    if (data.lastLogin) parts.push({ label: 'Last Login', value: data.lastLogin });
    if (data.onboarding) parts.push({ label: 'Onboarding', value: data.onboarding });
    if (data.enrichments) parts.push({ label: 'Enrichments', value: fmtEnrichments(data.enrichments), tint: high });
    if (parts.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="typo-section-label text-text-muted">Usage</span>
          {onShowAll && (
            <button type="button" onClick={onShowAll} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
              Usage ansehen →
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
              <span className={`text-[12px] font-bold ${p.tint ? 'text-[var(--signal-warn-text)]' : 'text-text-primary'}`}>{p.value}</span>
            </span>
          ))}
        </button>
      </div>
    );
  }

  return (
    <DetailSection title="Usage" icon={BarChart3}>
      {data.lastLogin && <Field label="Last Login">{data.lastLogin}</Field>}
      {data.lastUsage && <Field label="Last Usage">{data.lastUsage}</Field>}
      {data.profilesAdded && (
        <Field label="Profiles added">{data.profilesAdded.value}<Trend trend={data.profilesAdded.trend} /></Field>
      )}
      {data.messages && (
        <Field label="Messages generiert">{data.messages.value}<Trend trend={data.messages.trend} /></Field>
      )}
      {data.enrichments && (
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="typo-field-label text-text-muted">Enrichments</span>
          <span className={`typo-field-value ${high ? 'text-[var(--signal-warn-text)]' : 'text-text-primary'}`}>{fmtEnrichments(data.enrichments)}</span>
        </div>
      )}
      {data.onboarding && <Field label="Onboarding">{data.onboarding}</Field>}
    </DetailSection>
  );
}
