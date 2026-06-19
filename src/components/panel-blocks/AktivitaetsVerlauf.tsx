/**
 * AktivitaetsVerlauf — Aktivität-Tab (820px-Panel + Vollansicht): vertikaler Feed der
 * SYSTEM-/User-Events auf diesem Datensatz (≠ Kommunikation = externe Touchpoints).
 * Zeigt unsere EIGENEN App-Aktionen, die wir ab Tag 1 abbilden können (CLAUDE.md
 * `activity_log`): Deal angelegt (mit Kurzinfo), Stage-Wechsel, Task angelegt/erledigt,
 * Heat-Wechsel, in Sequenz aufgenommen, Notiz, Kontakt angelegt. Datengetrieben über
 * `AktivitaetItem` + Default-Mock — das System kann activity_log-Einträge später 1:1
 * einspielen. Externe CRM-Aktivitäten (HubSpot/Outlook) mischen sich hier später dazu.
 * Verbindungslinie neutral-grau (grün bleibt dem Kommunikations-Zeitstrahl vorbehalten).
 */
import {
  TrendingUp, ArrowRightLeft, ListPlus, CheckCircle2, Flame, Zap, StickyNote, Star, UserPlus,
  type LucideIcon,
} from "lucide-react";

type AktivitaetType =
  | "deal_created" | "stage_changed" | "task_created" | "task_done"
  | "heat_changed" | "sequence_added" | "note_added" | "favorite" | "contact_created";

export interface AktivitaetItem {
  type: AktivitaetType;
  title: string;
  /** Kurzinfo zum Event — z.B. beim Deal: „Sherloq Enterprise · 24.000 € · Demo vereinbart". */
  detail?: string;
  /** Wer/was die Aktion ausgelöst hat: User-Name · „System" · „KI-SDR". */
  actor: string;
  time: string;
}

// Icon + Token-Akzent je Event-Typ (fg = Symbol, bg = getönter Kreis). Tokens-only.
const META: Record<AktivitaetType, { icon: LucideIcon; fg: string; bg: string }> = {
  deal_created:    { icon: TrendingUp,    fg: "var(--signal-teal-text)",    bg: "var(--signal-teal-bg)" },
  stage_changed:   { icon: ArrowRightLeft, fg: "var(--signal-info-text)",    bg: "var(--signal-info-bg)" },
  task_created:    { icon: ListPlus,       fg: "var(--signal-info-text)",    bg: "var(--signal-info-bg)" },
  task_done:       { icon: CheckCircle2,   fg: "var(--signal-success-text)", bg: "var(--signal-success-bg)" },
  heat_changed:    { icon: Flame,          fg: "var(--signal-warn-text)",    bg: "var(--signal-warn-bg)" },
  sequence_added:  { icon: Zap,            fg: "var(--signal-info-text)",    bg: "var(--signal-info-bg)" },
  note_added:      { icon: StickyNote,     fg: "var(--text-muted)",          bg: "var(--app-bg)" },
  favorite:        { icon: Star,           fg: "var(--signal-warn-text)",    bg: "var(--signal-warn-bg)" },
  contact_created: { icon: UserPlus,       fg: "var(--text-muted)",          bg: "var(--app-bg)" },
};

const DEFAULT_ITEMS: AktivitaetItem[] = [
  { type: "deal_created",    title: "Deal angelegt",          detail: "Sherloq Enterprise · 24.000 € · Demo vereinbart", actor: "Oliver Sand", time: "vor 5 Tagen" },
  { type: "stage_changed",   title: "Stage gewechselt",       detail: "Backlog → Demo vereinbart",                       actor: "Oliver Sand", time: "vor 5 Tagen" },
  { type: "task_done",       title: "Task erledigt",          detail: "Discovery Call vorbereiten",                      actor: "Oliver Sand", time: "vor 6 Tagen" },
  { type: "heat_changed",    title: "Heat-Status geändert",   detail: "Warm → Engaged",                                  actor: "System",      time: "vor 7 Tagen" },
  { type: "task_created",    title: "Task angelegt",          detail: "Erster Outreach — LinkedIn DM · fällig 12. Juni", actor: "KI-SDR",      time: "vor 11 Tagen" },
  { type: "sequence_added",  title: "In Sequenz aufgenommen", detail: "Cold LinkedIn · Schritt 1",                       actor: "KI-SDR",      time: "vor 12 Tagen" },
  { type: "contact_created", title: "Kontakt angelegt",       detail: "via LinkedIn-Import",                             actor: "System",      time: "vor 14 Tagen" },
];

export default function AktivitaetsVerlauf({ items = DEFAULT_ITEMS }: { items?: AktivitaetItem[] }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <span className="block pl-1 typo-section-label text-text-muted">
        Aktivitätsverlauf
      </span>

      <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-sm">
        <ol className="relative">
          {items.map((item, idx) => {
            const meta = META[item.type];
            const Icon = meta.icon;
            const isLast = idx === items.length - 1;
            return (
              <li key={idx} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Neutrale Verbindungslinie (Node → nächster Node) */}
                {!isLast && (
                  <span className="absolute left-[15px] top-[34px] bottom-0 w-[2px] bg-border" aria-hidden="true" />
                )}

                {/* Icon-Node */}
                <span
                  className="relative z-10 shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center ring-4 ring-[var(--surface)]"
                  style={{ color: meta.fg, background: meta.bg }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </span>

                {/* Inhalt */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="typo-card-title text-text-primary leading-snug">{item.title}</h4>
                    <span className="text-[11px] font-medium text-text-muted shrink-0 pt-0.5">{item.time}</span>
                  </div>
                  {item.detail && (
                    <p className="text-[12px] text-text-body leading-relaxed mt-0.5">{item.detail}</p>
                  )}
                  <span className="block text-[11px] text-text-muted mt-0.5">{item.actor}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="px-1 text-[11px] text-text-muted leading-relaxed">
        Externe CRM-Aktivitäten (HubSpot, Outlook) werden hier später ergänzt.
      </p>
    </div>
  );
}
