/**
 * TasksListe — alle Aufgaben des Kontakts (Tasks-Tab, 820px-Panel + Vollansicht).
 * Zusammenfassungs-Zeile (Titel + Kurztext + Detail-Pills) ist aufklappbar → zeigt
 * die vollen Read-Only-Details (Kontakt/Deal/Kanal/Fälligkeit/Priorität/Zuständig/
 * Erinnerung + Beschreibung). „Neue Task" und der Bearbeiten-Button öffnen die
 * TaskFormular-Maske (nur Formular, ohne Kontext-/KI-Meldungen). Tokens-only.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Mail, Phone, Calendar, Clock, Briefcase, ClipboardList, ChevronDown,
  Pencil, Trash2, type LucideIcon,
} from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import TaskFormular, { type TaskFormInitial } from "./TaskFormular";

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
  priority: Priority;
  deal: string;
  dealValue?: string; // Select-Value für die Maske
  contact: string;
  assignee: string;
  reminder?: { date: string; time: string } | null;
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

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "t1", title: "ROI-Dokument senden",
    description: "Demo war positiv — konkretes Angebot als nächsten Schritt senden.",
    channel: "mail", dueLabel: "Heute fällig", dueDate: "2026-06-18", dueTime: "09:00", overdue: true,
    priority: "high", deal: "Demo vereinbart", dealValue: "demo", contact: "Sarah Jenkins",
    assignee: "Ich selbst", reminder: { date: "2026-06-17", time: "09:00" },
  },
  {
    id: "t2", title: "Follow-up Call buchen",
    description: "Nach dem Angebot kurzen Abschluss-Call zur Klärung offener Punkte vereinbaren.",
    channel: "phone", dueLabel: "In 3 Tagen", dueDate: "2026-06-21", dueTime: "11:00", overdue: false,
    priority: "medium", deal: "Demo vereinbart", dealValue: "demo", contact: "Sarah Jenkins",
    assignee: "Ich selbst", reminder: null,
  },
];

function toInitial(task: TaskItem): TaskFormInitial {
  return {
    title: task.title, contact: task.contact, deal: task.dealValue ?? "demo", channel: task.channel,
    description: task.description, dueDate: task.dueDate, dueTime: task.dueTime, priority: task.priority,
    reminderActive: !!task.reminder, reminderDate: task.reminder?.date, reminderTime: task.reminder?.time,
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

export default function TasksListe({ onToast }: { onToast?: (msg: string) => void }) {
  const { t } = useTranslation();
  // null = Liste · 'new' = anlegen · <id> = bearbeiten
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const tasks = DEFAULT_TASKS;

  if (editing !== null) {
    const task = editing === "new" ? undefined : tasks.find((x) => x.id === editing);
    return (
      <div className="animate-fade-in">
        <TaskFormular
          mode={editing === "new" ? "create" : "edit"}
          initial={task ? toInitial(task) : {}}
          onClose={() => setEditing(null)}
          onSave={() => { onToast?.(`${t("hunter.drawers.noTask.toastSaved")} ✓`); setEditing(null); }}
          onToast={onToast}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Alle Aufgaben</span>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> {t("hunter.drawers.noTask.newTask")}
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isOpen = !!expanded[task.id];
          const ch = CHANNEL[task.channel];
          const ChannelIcon = ch.Icon;
          const prio = PRIORITY[task.priority];
          return (
            <div key={task.id} className="group bg-app-surface border border-border rounded-[12px] shadow-sm overflow-hidden">
              {/* Zusammenfassung — klickbar zum Aufklappen */}
              <div className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none" onClick={() => setExpanded((p) => ({ ...p, [task.id]: !p[task.id] }))}>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-primary">{task.title}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed mt-1">{task.description}</p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold"><ChannelIcon className="w-3 h-3" /> {ch.label}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${task.overdue ? "bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]" : "bg-app-bg border border-border text-text-muted"}`}><Clock className="w-3 h-3" /> {task.dueLabel}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${prio.cls}`}>Priorität: {prio.label}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold"><Briefcase className="w-3 h-3" /> {task.deal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditing(task.id); }} aria-label={t("hunter.drawers.noTask.editTask")} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onToast?.("Task gelöscht"); }} aria-label="Löschen" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown className={`w-4 h-4 text-icon-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Aufgeklappt — volle Read-Only-Details */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border-subtle animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-3">
                    <DetailRow label={t("hunter.drawers.noTask.contact")} value={task.contact} />
                    <DetailRow label={t("hunter.drawers.noTask.deal")} value={task.deal} />
                    <DetailRow label={t("hunter.drawers.noTask.channel")} value={ch.label} />
                    <DetailRow label={t("hunter.drawers.noTask.dueDate")} value={`${task.dueDate} · ${task.dueTime}`} />
                    <DetailRow label={t("hunter.drawers.noTask.priority")} value={prio.label} />
                    <DetailRow label={t("hunter.drawers.noTask.assignee")} value={task.assignee} />
                    <DetailRow label={t("hunter.drawers.noTask.reminder")} value={task.reminder ? `${task.reminder.date} · ${task.reminder.time}` : "—"} />
                  </div>
                  <div className="mt-4">
                    <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wide">{t("hunter.drawers.noTask.descriptionOptional")}</span>
                    <p className="text-[12px] text-text-body leading-relaxed mt-1">{task.description}</p>
                  </div>
                  <button onClick={() => setEditing(task.id)} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-border text-text-body text-[11px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" /> {t("hunter.drawers.noTask.editTask")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
