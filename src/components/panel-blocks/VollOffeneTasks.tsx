/**
 * VollOffeneTasks — „Offene Tasks"-Karte der Vollansicht (Tasks-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Square, TriangleAlert } from "lucide-react";

const tasks = [
  { title: "Enterprise Upgrade ansprechen", sub: "LinkedIn · AI-Nachricht bereit", due: "Heute", urgent: true },
  { title: "Quarterly Review vorbereiten", sub: "Meeting · Agenda erstellen", due: "in 5 Tagen", urgent: false },
  { title: "ROI Follow-up nachfassen", sub: "Email · Angebot vom 20. Mai", due: "in 8 Tagen", urgent: false },
];

export default function VollOffeneTasks() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Square className="w-4 h-4 text-[var(--icon-muted)]" /> OFFENE TASKS
        </h2>
        <button className="flex items-center gap-2 bg-[var(--sherloq-primary)] text-on-accent px-5 py-2.5 rounded-full font-bold text-[14px] hover:opacity-90 transition-colors shadow-sm">
          <Square className="w-4 h-4 opacity-80" /> Neue Task
        </button>
      </div>
      <div className="flex flex-col gap-0 border-t border-[var(--border)]">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors -mx-8 px-8 cursor-pointer group">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border-strong)] group-hover:border-[var(--sherloq-primary)] shrink-0 transition-colors"></div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--text-primary)]">{task.title}</p>
              <p className="text-[14px] text-[var(--text-muted)] mt-0.5">{task.sub}</p>
            </div>
            {task.urgent ? (
              <div className="text-[var(--signal-urgent-text)] text-[14px] font-bold flex items-center gap-1.5 shrink-0">
                {task.due} <TriangleAlert className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="text-[var(--text-muted)] text-[14px] font-medium shrink-0">{task.due}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
