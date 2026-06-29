/**
 * FarmerHealthOverview — „Customer Health Overview" der Farmer-Übersicht: pro Kunde eine Zeile
 * (Avatar + Name) + Health-Balken (0–100) + Status-Badge. DB-verdrahtet (Slice 2): Zeilen kommen
 * aus den echten Bestandskunden. HONESTY: `health_score` ist NULL bis `calculate_health_score()`
 * läuft → Balken/Score/Badge werden dann **ausgeblendet** (kein 0, kein Fake), nur Avatar+Name +
 * dezenter „—"-Hinweis. Nur Tokens (kein Hex), Schrift via typo-Primitive. „Alle anzeigen →" → Kunden-Tab.
 */
import { AlertTriangle, Users } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export type HealthRow = {
  id: string;
  initials: string;
  name: string;
  /** 0–100 (calculate_health_score). undefined → Score/Balken/Badge ausgeblendet (Honesty). */
  score?: number;
};

/** Health-Level → Token-Farbe (Balken + Score-Zahl + Badge). */
function levelVar(score: number): string {
  if (score > 70) return "var(--signal-success-text)";
  if (score >= 40) return "var(--signal-warn-text)";
  return "var(--signal-urgent-text)";
}

/** Score → Health-Badge (gesund/aufmerksamkeit/kritisch). Nur bei vorhandenem Score. */
function badgeFor(score: number): { label: string; pill: string; icon: boolean } {
  if (score > 70) return { label: "Gesund", pill: "pill-success", icon: false };
  if (score >= 40) return { label: "Aufmerksamkeit", pill: "pill-warn", icon: false };
  return { label: "Kritisch", pill: "pill-urgent", icon: true };
}

export default function FarmerHealthOverview({
  rows = [],
  onShowAll,
}: {
  rows?: HealthRow[];
  onShowAll?: () => void;
}) {
  return (
    <div className="bg-app-surface rounded-[16px] p-6 border border-[var(--border-card)] shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="typo-section-label text-text-muted">Customer Health Overview</span>
        <button
          onClick={onShowAll}
          className="text-[12px] font-medium text-sherloq-primary hover:opacity-80 transition-opacity cursor-pointer"
        >
          Alle anzeigen →
        </button>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <EmptyState icon={<Users className="w-6 h-6" />} title="Keine Kunden" />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => {
            const hasScore = typeof r.score === "number";
            const color = hasScore ? levelVar(r.score as number) : "var(--icon-muted)";
            const badge = hasScore ? badgeFor(r.score as number) : null;
            return (
              <div key={r.id} className="flex items-center gap-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-2.5 w-[180px] shrink-0 min-w-0">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-on-accent shrink-0"
                    style={{ background: color }}
                  >
                    {r.initials}
                  </span>
                  <span className="text-[14px] font-semibold text-text-primary truncate">{r.name}</span>
                </div>

                {/* Balken — nur mit echtem Score (Honesty: sonst leerer Track) */}
                <div className="flex-1 h-2 bg-app-bg rounded-full overflow-hidden">
                  {hasScore && (
                    <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: color }} />
                  )}
                </div>

                {/* Score-Zahl — vorhanden bzw. dezentes „—" */}
                {hasScore ? (
                  <span className="typo-field-value w-8 text-right shrink-0" style={{ color }}>{r.score}</span>
                ) : (
                  <span className="typo-field-value w-8 text-right shrink-0 text-text-muted" title="Health-Score folgt mit calculate_health_score()">—</span>
                )}

                {/* Health-Badge — nur mit echtem Score */}
                {badge ? (
                  <span className={`sherloq-pill ${badge.pill} typo-chip inline-flex items-center gap-1.5 w-[110px] justify-center shrink-0`}>
                    {badge.icon ? <AlertTriangle className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    {badge.label}
                  </span>
                ) : (
                  <span className="w-[110px] shrink-0" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="typo-subline italic text-text-muted text-center mt-5">
        Health-Score, NRR &amp; Kündigungen
        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted not-italic">
          Folgt
        </span>
      </p>
    </div>
  );
}
