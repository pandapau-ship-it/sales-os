/**
 * TasksListe — alle Aufgaben des Kontakts (Tasks-Tab, 820px-Panel + Vollansicht).
 * P3: datengetrieben über `taskRows` (echte DB-Tasks) — offene zuerst, erledigte abgesetzt
 * unten. Zusammenfassungs-Zeile (Titel + Kurztext + Detail-Pills) ist aufklappbar → volle
 * Read-Only-Details; fehlende Felder werden ausgeblendet. „Neue Task" → TaskFormular →
 * `onCreate` (createTask). „Erledigt" → `onComplete` (completeTask). Tokens-only.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Mail, Phone, Calendar, Clock, Briefcase, ClipboardList, ChevronDown,
  Pencil, CheckCircle2, Trash2, type LucideIcon,
} from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import TaskFormular, { type TaskFormInitial, type TaskFormValues } from "./TaskFormular";

type Channel = "mail" | "linkedin" | "phone" | "calendar" | "other";
type Priority = "low" | "medium" | "high" | "urgent";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  channel: Channel;
  dueLabel: string;
  dueDate: string; // yyyy-mm-dd
  dueTime: string;
  overdue?: boolean;
  completed?: boolean;
  priority: Priority;
  deal: string;       // Anzeige (Deal-Name); leer → kein Deal-Pill
  dealValue?: string; // Select-Value für die Maske (deal.id oder 'none')
  contact: string;
  assignee: string;   // leer → keine Zuständig-Zeile
}

const CHANNEL: Record<Channel, { Icon: LucideIcon | typeof LinkedinIcon; label: string }> = {
  mail: { Icon: Mail, label: "E-Mail" },
  linkedin: { Icon: LinkedinIcon, label: "LinkedIn" },
  phone: { Icon: Phone, label: "Telefon" },
  calendar: { Icon: Calendar, label: "Termin" },
  other: { Icon: ClipboardList, label: "Aufgabe" },
};

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  low: { label: "Niedrig", cls: "bg-app-bg border-border text-text-muted" },
  medium: { label: "Mittel", cls: "bg-app-bg border-border text-text-muted" },
  high: { label: "Hoch", cls: "bg-[var(--signal-warn-bg)] border-[var(--signal-warn-bg)] text-[var(--signal-warn-text)]" },
  urgent: { label: "Dringend", cls: "bg-[var(--signal-urgent-bg)] border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]" },
};

/** DB-Kanal (email…) → Formular-/Anzeige-Kanal (mail…). */
function dbChannelToUi(c: unknown): Channel {
  if (c === "email") return "mail";
  if (c === "linkedin" || c === "phone" || c === "calendar" || c === "other") return c;
  return "other";
}

/** Tage zwischen Datum und heute (0 = heute, <0 = überfällig). */
function dayDiff(iso: string): number {
  const d = new Date(iso);
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d0.getTime() - t0.getTime()) / 86_400_000);
}

/** DB-Task-Zeile → TaskItem. Gemeinsame Werte (Kontaktname) kommen aus dem Panel-Kontext. */
function rowToItem(row: Record<string, any>, contactName: string): TaskItem {
  const dueIso: string | null = row.due_at ?? null;
  const completed = row.completed_at != null;
  let dueLabel = "";
  let overdue = false;
  if (dueIso) {
    const diff = dayDiff(dueIso);
    overdue = !completed && diff < 0;
    dueLabel = diff === 0 ? "Heute fällig" : diff < 0 ? `vor ${Math.abs(diff)} Tagen` : `In ${diff} Tagen`;
  }
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    channel: dbChannelToUi(row.channel),
    dueLabel,
    dueDate: dueIso ? String(dueIso).slice(0, 10) : "",
    dueTime: dueIso ? String(dueIso).slice(11, 16) : "",
    overdue,
    completed,
    priority: (["low", "medium", "high", "urgent"].includes(row.priority) ? row.priority : "medium") as Priority,
    deal: row.deal?.name ?? "",
    dealValue: row.deal_id ?? "none",
    contact: contactName,
    assignee: row.assignee?.full_name ?? "",
  };
}

function toInitial(task: TaskItem): TaskFormInitial {
  return {
    title: task.title, contact: task.contact, deal: task.dealValue ?? "none", channel: task.channel,
    description: task.description, dueDate: task.dueDate || undefined, dueTime: task.dueTime || undefined, priority: task.priority,
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wide">{label}</span>
      <span className="block text-[12px] font-semibold text-text-body truncate mt-0.5">{value}</span>
    </div>
  );
}

export default function TasksListe({
  onToast, autoEditId = null, onAutoEditConsumed,
  taskRows, contactName = "", dealOptions, onCreate, onComplete, onDelete,
}: {
  onToast?: (msg: string) => void;
  autoEditId?: string | null;
  onAutoEditConsumed?: () => void;
  /** Echte DB-Task-Zeilen (P3). undefined → leer. */
  taskRows?: Record<string, any>[];
  contactName?: string;
  dealOptions?: { value: string; label: string }[];
  onCreate?: (values: TaskFormValues) => void;
  onComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}) {
  const { t } = useTranslation();
  const tasks = (taskRows ?? []).map((r) => rowToItem(r, contactName));

  const validAuto = autoEditId === "new" || (autoEditId && tasks.some((x) => x.id === autoEditId)) ? autoEditId : null;
  const [editing, setEditing] = useState<"new" | string | null>(validAuto);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // autoEditId (Footer „+ Task" / Übersicht) öffnet die Maske — auch wenn der Tab schon offen
  // ist (reagiert auf Prop-Änderung, nicht nur auf Mount). Danach im Parent zurücksetzen.
  useEffect(() => {
    if (!autoEditId) return;
    if (autoEditId === "new" || tasks.some((x) => x.id === autoEditId)) setEditing(autoEditId);
    onAutoEditConsumed?.();
  }, [autoEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (editing !== null) {
    const task = editing === "new" ? undefined : tasks.find((x) => x.id === editing);
    return (
      <div className="animate-fade-in">
        <TaskFormular
          mode={editing === "new" ? "create" : "edit"}
          initial={task ? toInitial(task) : { contact: contactName }}
          dealOptions={dealOptions}
          onClose={() => setEditing(null)}
          onSave={(values) => {
            if (editing === "new") onCreate?.(values);
            else onToast?.(`${t("hunter.drawers.noTask.toastSaved")} ✓`); // Edit-Persistenz folgt (P8)
            setEditing(null);
          }}
          onToast={onToast}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted">Alle Aufgaben</span>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> {t("hunter.drawers.noTask.newTask")}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="py-10 text-center text-[12px] font-semibold text-text-muted">{t("hunter.panel.noTasks")}</div>
      ) : (
      <div className="space-y-3">
        {tasks.map((task) => {
          const isOpen = !!expanded[task.id];
          const ch = CHANNEL[task.channel];
          const ChannelIcon = ch.Icon;
          const prio = PRIORITY[task.priority];
          return (
            <div key={task.id} className={`group bg-app-surface border border-border rounded-[12px] shadow-sm overflow-hidden ${task.completed ? "opacity-60" : ""}`}>
              {/* Zusammenfassung — klickbar zum Aufklappen */}
              <div className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none" onClick={() => setExpanded((p) => ({ ...p, [task.id]: !p[task.id] }))}>
                <div className="min-w-0">
                  <p className={`typo-card-title text-text-primary ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                  {task.description && <p className="text-[11px] text-text-muted leading-relaxed mt-1">{task.description}</p>}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold"><ChannelIcon className="w-3 h-3" /> {ch.label}</span>
                    {task.dueLabel && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${task.overdue ? "bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]" : "bg-app-bg border border-border text-text-muted"}`}><Clock className="w-3 h-3" /> {task.dueLabel}</span>}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${prio.cls}`}>Priorität: {prio.label}</span>
                    {task.deal && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold"><Briefcase className="w-3 h-3" /> {task.deal}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {task.completed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[var(--signal-success-text)]"><CheckCircle2 className="w-3.5 h-3.5" /> {t("hunter.followUps.markDone")}</span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); onComplete?.(task.id); }} aria-label={t("hunter.followUps.markDone")} data-tip={t("hunter.followUps.markDone")} className={`w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-success-text)] hover:bg-[var(--signal-success-bg)] cursor-pointer ${HOVER_ACTIONS}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {!task.completed && (
                    <button onClick={(e) => { e.stopPropagation(); setEditing(task.id); }} aria-label={t("hunter.drawers.noTask.editTask")} data-tip={t("hunter.drawers.noTask.editTask")} className={`w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg cursor-pointer ${HOVER_ACTIONS}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(task.id); }} aria-label={t("hunter.panel.delete")} data-tip={t("hunter.panel.delete")} className={`w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] cursor-pointer ${HOVER_ACTIONS}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown className={`w-4 h-4 text-icon-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Lösch-Bestätigung (soft delete) — abbrechbar */}
              {confirmDeleteId === task.id && (
                <div className="px-4 py-3 border-t border-border-subtle bg-[var(--signal-urgent-bg)] flex items-center justify-between gap-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[12px] font-bold text-[var(--signal-urgent-text)]">{t("hunter.panel.confirmDelete")}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-[10px] border border-border bg-app-surface text-text-body text-[11px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
                      {t("hunter.common.cancel")}
                    </button>
                    <button onClick={() => { onDelete?.(task.id); setConfirmDeleteId(null); }} className="px-3 py-1.5 rounded-[10px] bg-[var(--signal-urgent-text)] text-on-accent text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
                      {t("hunter.panel.delete")}
                    </button>
                  </div>
                </div>
              )}

              {/* Aufgeklappt — volle Read-Only-Details (fehlende Felder ausgeblendet) */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border-subtle animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-3">
                    {task.contact && <DetailRow label={t("hunter.drawers.noTask.contact")} value={task.contact} />}
                    {task.deal && <DetailRow label={t("hunter.drawers.noTask.deal")} value={task.deal} />}
                    <DetailRow label={t("hunter.drawers.noTask.channel")} value={ch.label} />
                    {task.dueDate && <DetailRow label={t("hunter.drawers.noTask.dueDate")} value={`${task.dueDate}${task.dueTime ? ` · ${task.dueTime}` : ""}`} />}
                    <DetailRow label={t("hunter.drawers.noTask.priority")} value={prio.label} />
                    {task.assignee && <DetailRow label={t("hunter.drawers.noTask.assignee")} value={task.assignee} />}
                  </div>
                  {task.description && (
                    <div className="mt-4">
                      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wide">{t("hunter.drawers.noTask.descriptionOptional")}</span>
                      <p className="text-[12px] text-text-body leading-relaxed mt-1">{task.description}</p>
                    </div>
                  )}
                  {!task.completed && (
                    <button onClick={() => setEditing(task.id)} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-border text-text-body text-[11px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" /> {t("hunter.drawers.noTask.editTask")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
