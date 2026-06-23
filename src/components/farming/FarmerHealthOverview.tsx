/**
 * FarmerHealthOverview — „Customer Health Overview" der Farmer-Übersicht: pro Kunde ein
 * Health-Balken (0–100) + Status-Badge. Werte sind DEMO/Mock (Honesty: Footer trägt „Folgt",
 * Score-Hover verweist auf calculate_health_score()). Nur Tokens (kein Hex), Schrift via
 * typo-Primitive. „Alle anzeigen →" wechselt zum Kunden-Tab (onShowAll).
 */
import { AlertTriangle } from "lucide-react";

type BadgeTone = "success" | "teal" | "urgent";
type HealthRow = {
  initials: string;
  name: string;
  score: number;          // 0–100 (Health Index)
  avatarVar: string;      // Avatar-Farbe (Token-Var)
  badge: { label: string; tone: BadgeTone; icon?: boolean };
};

// Demo-Daten (Mock) — echte Werte kommen aus calculate_health_score() (Edge Function).
const ROWS: HealthRow[] = [
  { initials: "PG", name: "PayGuard AG",   score: 92, avatarVar: "var(--sherloq-primary)",     badge: { label: "Aktiv", tone: "success" } },
  { initials: "HM", name: "HiringMate Ltd", score: 68, avatarVar: "var(--signal-warn-text)",    badge: { label: "Upsell Ready", tone: "teal" } },
  { initials: "LO", name: "Logistify DE",  score: 8,  avatarVar: "var(--signal-urgent-text)",   badge: { label: "Churn Risk", tone: "urgent", icon: true } },
];

/** Health-Level → Token-Farbe (Balken + Score-Zahl). */
function levelVar(score: number): string {
  if (score > 70) return "var(--signal-success-text)";
  if (score >= 40) return "var(--signal-warn-text)";
  return "var(--signal-urgent-text)";
}

const PILL_TONE: Record<BadgeTone, string> = {
  success: "pill-success",
  teal: "pill-teal",
  urgent: "pill-urgent",
};

export default function FarmerHealthOverview({ onShowAll }: { onShowAll?: () => void }) {
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
      <div className="flex flex-col gap-4">
        {ROWS.map((r) => {
          const color = levelVar(r.score);
          return (
            <div key={r.initials} className="flex items-center gap-4">
              {/* Avatar + Name */}
              <div className="flex items-center gap-2.5 w-[180px] shrink-0 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-on-accent shrink-0"
                  style={{ background: r.avatarVar }}
                >
                  {r.initials}
                </span>
                <span className="text-[14px] font-semibold text-text-primary truncate">{r.name}</span>
              </div>

              {/* Balken */}
              <div className="flex-1 h-2 bg-app-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: color }} />
              </div>

              {/* Score + Badge */}
              <span
                className="typo-field-value w-8 text-right shrink-0"
                style={{ color }}
                title="Score-Details folgen mit calculate_health_score()"
              >
                {r.score}
              </span>
              <span className={`sherloq-pill ${PILL_TONE[r.badge.tone]} typo-chip inline-flex items-center gap-1.5 w-[110px] justify-center shrink-0`}>
                {r.badge.icon
                  ? <AlertTriangle className="w-3 h-3" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                {r.badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="typo-subline italic text-text-muted text-center mt-5">
        NRR DIESE WOCHE: +2 % · 0 NEUE KÜNDIGUNGEN · 1 UPSELL ABGESCHLOSSEN
        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted not-italic">
          Folgt
        </span>
      </p>
    </div>
  );
}
