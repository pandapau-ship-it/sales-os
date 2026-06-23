/**
 * FarmerKpiCards — KPI-Reihe der Farmer-Übersicht (4 Kacheln über die geteilte KpiCard):
 * MRR Gesamt · Churn Risk MRR · Upsell Potenzial · Net Revenue Retention.
 * Werte sind DEMO/Mock (Honesty: jede berechnete Zahl trägt einen „Folgt"-Chip) — echte
 * Anbindung folgt mit den Edge Functions (score_churn_risk / calculate_health_score).
 * Nur Tokens (kein Hex), Schrift via KpiCard/typo-Primitive.
 */
import type { ReactNode } from "react";
import { TrendingUp, AlertTriangle, Zap } from "lucide-react";
import KpiCard from "../panel-blocks/KpiCard";

/** Kleiner „Folgt"-Hinweis für noch nicht berechnete (gemockte) Werte. */
function Folgt() {
  return (
    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted">
      Folgt
    </span>
  );
}

type Kpi = {
  title: string;
  icon: ReactNode;
  iconClass: string;
  value: string;
  valueClass: string;
  subtitle: ReactNode;
};

const KPIS: Kpi[] = [
  {
    title: "MRR GESAMT",
    icon: <TrendingUp size={16} strokeWidth={2.5} />,
    iconClass: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
    value: "€ 42.800",
    valueClass: "text-text-primary",
    subtitle: <><span className="text-signal-success">▲ +8 % gegenüber Vormonat</span><Folgt /></>,
  },
  {
    title: "CHURN RISK MRR",
    icon: <AlertTriangle size={16} strokeWidth={2.5} />,
    iconClass: "bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]",
    value: "€ 8.400",
    valueClass: "text-[var(--icp-low)]",
    subtitle: <><span className="text-signal-urgent">2 Accounts gefährdet</span><Folgt /></>,
  },
  {
    title: "UPSELL POTENZIAL",
    icon: <TrendingUp size={16} strokeWidth={2.5} />,
    iconClass: "bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]",
    value: "€ 4.200",
    valueClass: "text-sherloq-primary",
    subtitle: <><span className="text-text-muted">3 Kunden mit Potenzial</span><Folgt /></>,
  },
  {
    title: "NET REVENUE RETENTION",
    icon: <Zap size={16} strokeWidth={2.5} />,
    iconClass: "bg-[var(--signal-warn-bg)] text-[var(--signal-warn-text)]",
    value: "92 %",
    valueClass: "text-[var(--icp-medium)]",
    subtitle: <><span className="text-signal-warn">Ziel: &gt;100 %</span><Folgt /></>,
  },
];

export default function FarmerKpiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KPIS.map((k) => (
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
