/**
 * SettingsCard — Karten-Sektion für Settings-Seiten (Titel · Beschreibung · dezentes „Gespeichert ✓").
 *
 * Regel-A-Begründung: `DetailSection` hat weder eine Beschreibung noch einen Header-Slot für den
 * Speicher-Zustand — beides ist das Kern-Muster der SET-2-„Persönlich"-Seiten. Daher eigener, schlanker
 * Baustein (Ebene-1-Karte auf Seiten-Hintergrund), tokens-only, Dark-Mode automatisch. Wiederverwendbar
 * für alle künftigen Settings-Seiten. `saved` steuert das Feedback: 'saving' → dezenter Spinner-Text,
 * 'saved' → „Gespeichert ✓" (verblasst), null → nichts.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";

export type SaveState = "saving" | "saved" | null;

export default function SettingsCard({
  title, description, saved = null, children,
}: {
  title: string;
  description?: string;
  saved?: SaveState;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="bg-app-surface rounded-[12px] border border-[var(--border-card)] shadow-[var(--shadow-card)] p-6 mb-6">
      <div className="flex justify-between items-start mb-5 gap-4">
        <div>
          <h3 className="typo-card-title text-text-primary">{title}</h3>
          {description && <p className="typo-subline text-text-muted mt-1">{description}</p>}
        </div>
        <div className="h-5 flex items-center shrink-0">
          {saved === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("personal.saving")}
            </span>
          )}
          {saved === "saved" && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-signal-success">
              <Check className="w-3.5 h-3.5" />
              {t("personal.saved")}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
