import { TaskEntwurfForm } from '@/components';

interface TaskDrawerProps {
  person: any;
  recommendedChannel?: string;
  recommendedTitle?: string;
  recommendedNote?: string;
  onClose: () => void;
  onSave: (taskData: any) => void;
}

/**
 * TaskDrawer — 850px-Overlay-Hülle (Backdrop + Panel) für den Task-Entwurf.
 * Der Inhalt (Header + Kontakt-Bar + Formular + Speichern) liegt im panel-block `TaskEntwurfForm`.
 */
export default function TaskDrawer({
  person, recommendedChannel, recommendedTitle, recommendedNote, onClose, onSave,
}: TaskDrawerProps) {
  return (
    <div className="fixed inset-0 bg-[var(--text-body)]/20 backdrop-blur-sm z-50 flex justify-end font-sans transition-opacity animate-fade-in pr-2 py-2" onClick={onClose}>
      <div
        className="w-full max-w-[850px] h-full bg-[var(--app-bg)] shadow-[var(--shadow-dropdown)] flex flex-col relative overflow-hidden animate-slide-left rounded-[16px] border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <TaskEntwurfForm
          person={person}
          recommendedChannel={recommendedChannel}
          recommendedTitle={recommendedTitle}
          recommendedNote={recommendedNote}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
