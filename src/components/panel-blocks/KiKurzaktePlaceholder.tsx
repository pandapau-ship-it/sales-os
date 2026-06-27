/**
 * KiKurzaktePlaceholder — geteilter „KI-Kurzakte folgt"-Block für aufgeklappte Kacheln + Panel-Übersicht.
 * Single Source: Hunter (ExpandedCardContent, HunterSidepanel) + Farmer (FarmerExpandedCardContent,
 * FarmerSidepanel) nutzen ihn 1:1, bis die AI-Pipeline ([D5]) echte Kurzakten liefert. Label außerhalb
 * (wie „Deals"), Box darunter. Elevation = In-Panel-Box (border-card, KEIN Schatten).
 *
 * `onClick` optional: gesetzt → die Box wird klickbar (Hover-Affordance, Deeplink z.B. → Übersicht-Tab);
 * ohne → statische Box (kein Hover, kein toter Klick). „Kein Hover ohne onClick."
 * `flashId`/`flash`: Deeplink-Highlight — die Box trägt `data-flash-id` (Scroll-Anker) + `deeplink-flash`
 * (kurzes Aufleuchten auf der eigenen --surface-Fläche). Zentral via `useDeeplinkHighlight`.
 */
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KiKurzaktePlaceholder(
  { onClick, flashId, flash = false }: { onClick?: () => void; flashId?: string; flash?: boolean } = {},
) {
  const { t } = useTranslation();
  const boxClass = cn("flex-1 bg-app-surface rounded-[12px] p-5 border border-[var(--border-card)]", flash && "deeplink-flash");
  const body = <p className="text-[13px] text-text-muted italic leading-relaxed">KI-Kurzakte folgt mit der AI-Pipeline ([D5]).</p>;
  return (
    <div className="h-full flex flex-col gap-2">
      <span className="px-1 typo-section-label text-text-muted inline-flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" /> {t("hunter.common.kiKurzakte")}
        <span className="px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted text-[9px] font-extrabold uppercase tracking-wide">Folgt</span>
      </span>
      {onClick ? (
        <button type="button" onClick={onClick} data-flash-id={flashId} className={cn(boxClass, "text-left hover:bg-app-bg transition-colors cursor-pointer")}>
          {body}
        </button>
      ) : (
        <div data-flash-id={flashId} className={boxClass}>{body}</div>
      )}
    </div>
  );
}
