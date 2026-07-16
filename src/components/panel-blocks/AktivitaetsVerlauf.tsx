/**
 * AktivitaetsVerlauf — Aktivität-Tab (820px-Panel + Vollansicht): vertikaler Feed der echten
 * SYSTEM-/User-Events dieses Kontakts aus dem `audit_log` (getActivityByContact). Pro Eintrag:
 * Was (lesbar aus entity_type + op, z.B. „Deal erstellt"), Wann (relativ), Wer (nur wenn
 * `user_id`/Name vorhanden — bei System/AI weggelassen, Honesty; Auth/[D21] offen).
 * Keine Einträge → ehrlich leerer Zustand, KEIN Mock. (≠ Kommunikation = externe Touchpoints.)
 */
import { Briefcase, CheckSquare, FileText, User, Activity, type LucideIcon } from "lucide-react";

// Lesbares Substantiv je Tabelle (audit_log.entity_type ist der Tabellenname, plural).
const NOUN: Record<string, string> = {
  deals: "Deal", tasks: "Task", notes: "Notiz", contacts: "Kontakt", companies: "Company",
};
const ICON: Record<string, LucideIcon> = {
  deals: Briefcase, tasks: CheckSquare, notes: FileText, contacts: User, companies: Briefcase,
};
// Verb + Farb-Ton je Operation.
const VERB: Record<string, { label: string; fg: string; bg: string }> = {
  INSERT: { label: "erstellt",      fg: "var(--signal-teal-text)",    bg: "var(--signal-teal-bg)" },
  UPDATE: { label: "aktualisiert",  fg: "var(--signal-info-text)",    bg: "var(--signal-info-bg)" },
  DELETE: { label: "gelöscht",      fg: "var(--signal-urgent-text)",  bg: "var(--signal-urgent-bg)" },
};

// „vor X" aus einem ISO-Timestamp — rein relativ, keine erfundenen Werte.
function relTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

type Row = Record<string, unknown>;

function describe(row: Row): { label: string; icon: LucideIcon; fg: string; bg: string } {
  const entity = String(row.entity_type ?? "");
  const op = String((row.metadata as { op?: string } | null)?.op ?? String(row.action ?? "").split("_")[0] ?? "").toUpperCase();
  const noun = NOUN[entity] ?? entity ?? "Eintrag";
  const v = VERB[op];
  return {
    label: `${noun} ${v ? v.label : "geändert"}`,
    icon: ICON[entity] ?? Activity,
    fg: v ? v.fg : "var(--text-muted)",
    bg: v ? v.bg : "var(--app-bg)",
  };
}

export default function AktivitaetsVerlauf({ rows }: { rows?: Row[] }) {
  const items = rows ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="block pl-1 typo-section-label text-text-muted">Aktivitätsverlauf</span>

      {items.length === 0 ? (
        <div className="bg-app-surface rounded-[12px] p-8 border border-[var(--border-card)] text-center">
          <Activity className="w-6 h-6 mx-auto text-text-muted mb-2" />
          <p className="text-[12px] text-text-muted">Noch keine Aktivität.</p>
        </div>
      ) : (
        <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border-card)]">
          <ol className="relative">
            {items.map((row, idx) => {
              const { label, icon: Icon, fg, bg } = describe(row);
              const actor = (row.user as { full_name?: string } | null)?.full_name; // nur wenn vorhanden
              const isLast = idx === items.length - 1;
              return (
                <li key={(row.id as string) ?? idx} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast && <span className="absolute left-[15px] top-[34px] bottom-0 w-[2px] bg-border" aria-hidden="true" />}
                  <span
                    className="relative z-10 shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center ring-4 ring-[var(--surface)]"
                    style={{ color: fg, background: bg }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="typo-card-title text-text-primary leading-snug">{label}</h4>
                      <span className="text-[11px] font-medium text-text-muted shrink-0 pt-0.5">{relTime(row.created_at as string)}</span>
                    </div>
                    {actor && <span className="block text-[11px] text-text-muted mt-0.5">{actor}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <p className="px-1 text-[11px] text-text-muted leading-relaxed">
        Externe CRM-Aktivitäten (HubSpot, Outlook) werden hier später ergänzt.
      </p>
    </div>
  );
}
