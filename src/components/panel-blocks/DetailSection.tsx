/**
 * DetailSection — Profil-Sektion (Person/Firma/…) als Karte mit dezentem teal
 * Akzent-Border links. Optional einklappbar (System-Felder zu, by default).
 * Prop-driven · nur index.css-Tokens.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface DetailSectionProps {
  title: string;
  icon?: any;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  cols?: 1 | 2;
  children: any;
}

export default function DetailSection({
  title, icon: Icon, collapsible = false, defaultCollapsed = false, cols = 2, children,
}: DetailSectionProps) {
  const [open, setOpen] = useState(!defaultCollapsed);
  return (
    <section className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-5 pt-4 ${open ? "pb-3" : "pb-4"} text-[11px] font-bold uppercase tracking-wider text-text-muted ${collapsible ? "cursor-pointer hover:text-text-body transition-colors" : "cursor-default"}`}
      >
        {Icon && <Icon className="w-4 h-4 text-[var(--sherloq-primary)]" />}
        {title}
        {collapsible && <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? "" : "-rotate-90"}`} />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          {/* Daten in dezenter grauer Innen-Kachel — bessere Lesbarkeit, gruppiert die Felder */}
          <div className={`bg-app-bg rounded-[10px] p-5 grid gap-x-8 gap-y-5 ${cols === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
