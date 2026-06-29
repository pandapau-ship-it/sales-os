/**
 * FarmerKpiCards — KPI-Reihe der Farmer-Übersicht (4 Kacheln über die geteilte KpiCard):
 * MRR Gesamt · Churn Risk MRR · Upsell Potenzial · Net Revenue Retention.
 * DB-verdrahtet (Slice 3): rechnet aus den echten Bestandskunden (`customers`-Prop).
 * HONESTY: MRR/Scores sind NULL bis Migration-048-Felder befüllt sind (Score-Edge-Functions) →
 * dann „—" statt €0/Fake. NRR hat noch keine Berechnungsbasis ([D43] Historisierung) → „Folgt".
 * Nur Tokens (kein Hex), Schrift via KpiCard/typo-Primitive.
 */
import type { ReactNode } from "react";
import { TrendingUp, AlertTriangle, Zap } from "lucide-react";
import KpiCard from "../panel-blocks/KpiCard";
import type { Customer } from "@/types";

// Schwellen = settings.thresholds.* (Default; maßgeblich rechnen die Score-Edge-Functions server-seitig
// gegen settings — hier nur fürs Anzeige-Bucketing gespiegelt, nicht hardcodierte Business-Logik).
const CHURN_THRESHOLD = 61;
const UPSELL_THRESHOLD = 70;

/** „Folgt"-Hinweis für noch nicht berechenbare Werte (keine Datenbasis). */
function Folgt() {
  return (
    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted">
      Folgt
    </span>
  );
}

const fmtEur = (cent: number) => `€ ${Math.round(cent / 100).toLocaleString("de-DE")}`;
const mrrValues = (list: Customer[]) =>
  list.map((c) => c.mrrMonthly).filter((v): v is number => typeof v === "number");

type Kpi = {
  title: string;
  icon: ReactNode;
  iconClass: string;
  value: string;
  valueClass: string;
  subtitle: ReactNode;
};

export default function FarmerKpiCards({ customers = [] }: { customers?: Customer[] }) {
  const active = customers.filter((c) => c.sherloqStatus === "ACTIVE");

  // MRR Gesamt — Summe mrr_monthly aktiver Kunden. Kein einziger MRR gesetzt → „—" (Honesty).
  const activeMrr = mrrValues(active);
  const hasMrr = activeMrr.length > 0;
  const mrrTotal = activeMrr.reduce((a, b) => a + b, 0);

  // Churn Risk MRR — Kunden mit churn_score ≥ Schwelle. Keine Scores berechnet → „—".
  const hasChurnScores = customers.some((c) => typeof c.churnScore === "number");
  const churnRisk = customers.filter((c) => typeof c.churnScore === "number" && (c.churnScore as number) >= CHURN_THRESHOLD);
  const churnMrr = mrrValues(churnRisk).reduce((a, b) => a + b, 0);

  // Upsell Potenzial — Kunden mit upsell_score ≥ Schwelle. Keine Scores → „—".
  const hasUpsellScores = customers.some((c) => typeof c.upsellScore === "number");
  const upsell = customers.filter((c) => typeof c.upsellScore === "number" && (c.upsellScore as number) >= UPSELL_THRESHOLD);
  const upsellMrr = mrrValues(upsell).reduce((a, b) => a + b, 0);

  const kpis: Kpi[] = [
    {
      title: "MRR GESAMT",
      icon: <TrendingUp size={16} strokeWidth={2.5} />,
      iconClass: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
      value: hasMrr ? fmtEur(mrrTotal) : "—",
      valueClass: hasMrr ? "text-text-primary" : "text-text-muted",
      subtitle: <span className="text-text-muted">{active.length} {active.length === 1 ? "aktiver Kunde" : "aktive Kunden"}</span>,
    },
    {
      title: "CHURN RISK MRR",
      icon: <AlertTriangle size={16} strokeWidth={2.5} />,
      iconClass: "bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]",
      value: hasChurnScores ? fmtEur(churnMrr) : "—",
      valueClass: hasChurnScores ? "text-[var(--icp-low)]" : "text-text-muted",
      subtitle: hasChurnScores
        ? <span className="text-signal-urgent">{churnRisk.length} {churnRisk.length === 1 ? "Account" : "Accounts"} gefährdet</span>
        : <Folgt />,
    },
    {
      title: "UPSELL POTENZIAL",
      icon: <TrendingUp size={16} strokeWidth={2.5} />,
      iconClass: "bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]",
      value: hasUpsellScores ? fmtEur(upsellMrr) : "—",
      valueClass: hasUpsellScores ? "text-sherloq-primary" : "text-text-muted",
      subtitle: hasUpsellScores
        ? <span className="text-text-muted">{upsell.length} {upsell.length === 1 ? "Kunde" : "Kunden"} mit Potenzial</span>
        : <Folgt />,
    },
    {
      title: "NET REVENUE RETENTION",
      icon: <Zap size={16} strokeWidth={2.5} />,
      iconClass: "bg-[var(--signal-warn-bg)] text-[var(--signal-warn-text)]",
      value: "—", // keine Berechnungsbasis ohne Historisierung ([D43])
      valueClass: "text-text-muted",
      subtitle: <Folgt />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <KpiCard
          key={k.title}
          title={k.title}
          icon={k.icon}
          iconClass={k.iconClass}
          value={k.value}
          valueClass={k.valueClass}
          subtitle={k.subtitle}
          subtitleClass="text-[11px] font-semibold inline-flex items-center"
        />
      ))}
    </div>
  );
}
