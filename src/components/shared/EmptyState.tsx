/**
 * EmptyState — einheitlicher Leerzustand: Icon · Titel · Beschreibung · optionale Aktion.
 * Token-basiert, zentriert. Icon = Lucide-Komponente.
 */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <div className="w-12 h-12 rounded-[12px] bg-app-bg flex items-center justify-center text-text-muted">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
        <p className="text-[12px] text-text-muted max-w-[320px] leading-relaxed">{description}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="sherloq-btn-primary mt-1">
          {action.label}
        </button>
      )}
    </div>
  );
}
