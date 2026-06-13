/**
 * PanelTabs — Tab-Navigation des Info-Panels. Extrahiert aus shared/HunterSidepanel.tsx.
 */
interface PanelTabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export default function PanelTabs({ tabs, active, onChange }: PanelTabsProps) {
  return (
    <nav className="flex flex-nowrap border-b border-border-subtle gap-7 overflow-x-auto scrollbar-none w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative pb-3 text-xs font-bold transition-all shrink-0 ${active === tab.id ? "text-[var(--sherloq-primary)]" : "text-text-muted hover:text-text-body"}`}
        >
          {tab.label}
          {active === tab.id && (
            <div className="absolute left-0 right-0 bottom-0 bg-[var(--sherloq-primary)] rounded-t-full" style={{ height: "2px" }} />
          )}
        </button>
      ))}
    </nav>
  );
}
