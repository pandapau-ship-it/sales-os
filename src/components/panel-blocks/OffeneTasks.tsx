/**
 * OffeneTasks — offene Aufgaben des Kontakts (Übersicht), datengetrieben aus echten Tasks
 * (getTasksByContact). Nur OFFENE Tasks (completed_at IS NULL); fällige (due_at ≤ heute)
 * werden orange hervorgehoben. KEINE offene Task → Sektion erscheint gar nicht (Task-
 * getriebene Leere). Klick auf eine Kachel → Tasks-Tab (`onOpenTasks`). Hover: Bearbeiten/
 * Löschen/Erledigt (echte Mutationen über den Parent).
 */
import { AlertTriangle, Mail, Phone, Pencil, Trash2, Check } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

const CHANNEL: Record<string, { Icon: typeof Mail; label: string }> = {
  email: { Icon: Mail, label: "E-Mail" },
  phone: { Icon: Phone, label: "Telefon" },
};

// Fälligkeits-Label + „fällig"-Flag (overdue oder heute) aus due_at — keine Fake-Werte.
function meta(row: Record<string, any>) {
  const due = row.due_at ? new Date(row.due_at).getTime() : null;
  const now = Date.now();
  const days = due != null ? Math.round((due - now) / 86_400_000) : null;
  const overdue = due != null && due < now;
  const dueLabel = due == null ? null
    : overdue ? `Überfällig seit ${Math.abs(days as number)}T`
    : days === 0 ? "Heute fällig"
    : `In ${days} Tagen`;
  const due_now = overdue || days === 0; // orange hervorheben
  const channel = row.channel ? CHANNEL[row.channel as string] : undefined;
  return { dueLabel, due_now, channel };
}

export default function OffeneTasks({
  taskRows, onAdd, onOpenTasks, onEditTask, onComplete, onDelete,
}: {
  taskRows?: Record<string, any>[];
  onAdd?: () => void;
  onOpenTasks?: () => void;
  onEditTask?: (id: string) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const open = (taskRows ?? []).filter((t) => !t.completed_at);
  if (open.length === 0) return null; // keine offene Task → Sektion komplett weg (Task-getriebene Leere)

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const Actions = ({ id }: { id: string }) => (
    <div className={`flex items-center gap-1 shrink-0 ${HOVER_ACTIONS}`}>
      <button onClick={(e) => { stop(e); onEditTask?.(id); }} aria-label="Bearbeiten" data-tip="Bearbeiten" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={(e) => { stop(e); onDelete?.(id); }} aria-label="Löschen" data-tip="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={(e) => { stop(e); onComplete?.(id); }} aria-label="Erledigt" data-tip="Erledigt" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-success-text)] hover:bg-[var(--signal-success-bg)] transition-colors cursor-pointer">
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted">Offene Tasks</span>
        <button onClick={onAdd} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">+ Task hinzufügen</button>
      </div>
      <div className="space-y-3">
        {open.map((task) => {
          const { dueLabel, due_now, channel } = meta(task);
          const Ch = channel?.Icon;
          return (
            <div
              key={task.id as string}
              onClick={onOpenTasks}
              className={`group p-4 rounded-[12px] flex items-center justify-between gap-3 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${due_now ? "bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]" : "bg-app-surface border border-border hover:bg-app-bg"}`}
            >
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${due_now ? "text-[var(--signal-warn-text)]" : "text-text-primary"}`}>{(task.title as string) || "Task"}</p>
                {(dueLabel || channel) && (
                  <span className={`text-[10px] font-semibold flex items-center gap-1.5 mt-1 ${due_now ? "text-[var(--signal-warn-text)]" : "text-text-muted"}`}>
                    {due_now && <AlertTriangle className="w-[10px] h-[10px]" />}
                    {dueLabel}
                    {dueLabel && channel && " · "}
                    {Ch && <Ch className="w-[11px] h-[11px]" />}{channel?.label}
                  </span>
                )}
              </div>
              <Actions id={task.id as string} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
