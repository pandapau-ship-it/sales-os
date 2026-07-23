/**
 * RuleMatchBanner — L-3e Deeplink-Kopfzeile über der Kontakte-/Companies-Liste, wenn der User aus
 * einer gefeuerten Lifecycle-Regel-Benachrichtigung (`?firedBy=<ruleId>`) hierher gesprungen ist.
 * Geteilt von ScreenKontakte + ScreenCompanies (Single Source). Erklärt in Alltagssprache, WAS er sieht,
 * und deckt alle Edge-Fälle ehrlich ab: laden · Ladefehler · Regel weg · keine Treffer mehr · Treffer
 * (mit Hinweis auf inzwischen gelöschte). Tokens-only, Dark-Mode automatisch, i18n.
 */
import { Zap, AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { RuleMatchTargets } from "@/lib/db";

interface RuleMatchBannerProps {
  loading: boolean;
  error: boolean;
  state: RuleMatchTargets | null;
  entityLabelPlural: string; // z.B. "Kontakte" / "Firmen" — für „Unten siehst du alle …"
  onClear: () => void;
}

export function RuleMatchBanner({ loading, error, state, entityLabelPlural, onClear }: RuleMatchBannerProps) {
  const { t } = useTranslation();

  // Ton: Grün-Teal = echter Treffer-Filter · Amber = Problem/Hinweis (weg/leer/Fehler).
  let tone: "info" | "warn" = "info";
  let title: string;
  let body: string | null = null;

  if (loading) {
    title = t("lifecycle.deeplink.loading");
  } else if (error || !state) {
    tone = "warn"; title = t("lifecycle.deeplink.error");
  } else if (!state.exists) {
    tone = "warn";
    title = t("lifecycle.deeplink.goneTitle");
    body = t("lifecycle.deeplink.goneBody", { entity: entityLabelPlural });
  } else if (state.matchedTotal === 0) {
    tone = "warn";
    title = t("lifecycle.deeplink.noMatchTitle");
    body = t("lifecycle.deeplink.noMatchBody", { entity: entityLabelPlural });
  } else {
    title = t("lifecycle.deeplink.matchTitle", { name: state.name ?? "" });
    const parts = [t("lifecycle.deeplink.matchBody", { count: state.ids.length })];
    if (state.unavailable > 0) parts.push(t("lifecycle.deeplink.unavailable", { count: state.unavailable }));
    body = parts.join(" · ");
  }

  const Icon = tone === "warn" ? AlertTriangle : Zap;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 mb-4 rounded-[12px] border",
        tone === "warn"
          ? "bg-[var(--signal-warn-bg)] border-[var(--signal-warn-text)]/25"
          : "bg-[var(--signal-teal-bg)] border-[var(--sherloq-primary)]/25",
      )}
    >
      <Icon
        className={cn("w-4 h-4 mt-0.5 shrink-0", tone === "warn" ? "text-[var(--signal-warn-text)]" : "text-[var(--sherloq-primary)]")}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("typo-card-title", tone === "warn" ? "text-[var(--signal-warn-text)]" : "text-[var(--sherloq-primary)]")}>
          {title}
        </p>
        {body && <p className="typo-subline text-text-body mt-0.5">{body}</p>}
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("lifecycle.deeplink.clear")}
        data-tip={t("lifecycle.deeplink.clear")}
        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface/60 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
