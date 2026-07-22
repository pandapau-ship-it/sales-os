/**
 * WhyPopover — „Warum?"-Erklärung eines Regel-/Score-Werts (C21, systemweiter UI-Standard).
 *
 * Zeigt EHRLICH: was der Wert bewirkt (`description`) + welche ECHTE Funktion ihn liest (`usedBy`).
 * KEINE erfundenen Produkt-/Funktionsnamen (Honesty) — der Aufrufer übergibt die echten Namen
 * (z.B. „score-churn-risk"). Prop-driven (Texte kommen bereits übersetzt), tokens-only.
 *
 * Trigger = dezentes HelpCircle-Icon (in Regel-Zeilen hover-gated durch die Eltern-`group`).
 * Innerhalb eines Sheets/Dialogs `portal={false}` (Fokus-Falle) — hier Standard, da Settings-Seite.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function WhyPopover({
  title, description, usedBy, className,
}: {
  title: string;
  description: string;
  /** ECHTE Funktion(en), die den Wert lesen — z.B. „score-churn-risk". Kein erfundener Name. */
  usedBy: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("settings.rules.why")}
          data-tip={t("settings.rules.why")}
          className={cn(
            "w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-text-muted",
            "hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer",
            className,
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" portal={false} className="w-72 p-3.5">
        <div className="typo-card-title text-text-primary mb-1.5">{title}</div>
        <p className="typo-subline text-text-body leading-relaxed">{description}</p>
        <div className="mt-2.5 pt-2 border-t border-border typo-chip text-text-muted">
          {t("settings.rules.usedBy")} <span className="text-text-body">{usedBy}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
