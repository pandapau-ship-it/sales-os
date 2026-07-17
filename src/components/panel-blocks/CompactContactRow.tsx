/**
 * CompactContactRow — schlanke, wiederverwendbare Kontakt-Listenzeile: Avatar · Name/Subzeile ·
 * ICP-Ring · Status-Badge · Lead-Source · Routing · „vor X Tagen" (rechts) · Pfeil. Optik wie die
 * Kontakte-Tabellenzeile, aber OHNE Tabellen-Gerüst (keine Spaltenköpfe/Sortierung/Konfig) — für
 * kompakte In-Panel-Listen (erste Nutzung: Companies-Detail → Kontakte-Tab).
 *
 * Layout: Meta-Elemente sitzen in FESTEN Slot-Breiten → die Spalten fluchten über alle Zeilen,
 * auch wenn ein Wert fehlt (leerer Slot hält die Spalte, z.B. Routing bei „In Campaign"). Werte
 * kommen aus dem aufrufenden Mapper (`contactToKontakteRow`, Single Source).
 *
 * K-FS1: bewusst einfache erste Fassung, aber als EINE benannte Komponente (kein Inline-Eigenbau).
 * Der spätere Hunter-Umbau (LeadListRow/HunterCard-Dedup) soll DIESE Zeile als gemeinsame Basis
 * übernehmen, statt eine weitere Variante zu bauen.
 */
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNowMs } from "@/hooks/useNowMs";
import { useHoverPrefetch } from "@/hooks/useHoverPrefetch";
import { daysSinceIso } from "@/lib/hunterMappers";
import type { ContactRouting } from "@/lib/kontakteMappers";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import StatusBadge from "./StatusBadge";
import RoutingChip from "./RoutingChip";
import LeadSourceBadge from "./LeadSourceBadge";

// Kontakt-Status → Badge-Ton (kanonisch, wie in der Kontakte-Tabelle).
const STATUS_TONE: Record<string, "success" | "warn" | "urgent" | "info" | "teal" | "muted"> = {
  in_campaign: "teal", pipeline: "info", kunde: "success", archiviert: "muted", ohne_campaign: "muted", opt_out: "urgent",
};

export interface CompactContactRowProps {
  name: string;
  jobTitle?: string;
  company?: string;
  avatarUrl?: string;
  icpScore?: number;
  /** contacts.contact_status → StatusBadge (Label aus kontakte.status.*). */
  contactStatus?: string;
  /** contacts.lead_source → LeadSourceBadge (z.B. „Manuell"). */
  leadSource?: string;
  lastContactedAt: string | null;
  routing?: ContactRouting | null;
  /** Aria-/Tooltip-Text für den Öffnen-Pfeil (Aufrufer liefert i18n). */
  openLabel: string;
  onOpen: () => void;
  onNavigate?: (path: string) => void;
  onPrefetch?: () => void;
}

export default function CompactContactRow({
  name, jobTitle, company, avatarUrl, icpScore, contactStatus, leadSource, lastContactedAt, routing, openLabel, onOpen, onNavigate, onPrefetch,
}: CompactContactRowProps) {
  const { t } = useTranslation();
  const nowMs = useNowMs();
  const bind = useHoverPrefetch();
  const days = daysSinceIso(lastContactedAt, nowMs);
  const subline = [jobTitle, company].filter(Boolean).join(" · ");
  return (
    <div {...bind(onPrefetch)}
      className="group/row flex items-center gap-4 px-6 py-3.5 border-b border-[var(--border-card)] last:border-b-0 hover:bg-app-bg/60 transition-colors">
      <Avatar name={name} src={avatarUrl} size={40} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="typo-card-title text-text-primary truncate">{name}</span>
        {subline && <span className="typo-subline text-text-muted truncate">{subline}</span>}
      </div>
      {/* Feste Slots → Spalten fluchten über alle Zeilen (leerer Slot hält die Spalte). */}
      <div className="w-12 shrink-0 flex justify-center">{icpScore != null && <ICPDonut score={icpScore} />}</div>
      <div className="w-32 shrink-0">{contactStatus && STATUS_TONE[contactStatus] && <StatusBadge label={t(`kontakte.status.${contactStatus}`)} tone={STATUS_TONE[contactStatus]} />}</div>
      <div className="w-28 shrink-0">{leadSource && <LeadSourceBadge source={leadSource} />}</div>
      <div className="w-40 shrink-0">{routing && <RoutingChip routing={routing} onNavigate={onNavigate} />}</div>
      <div className="w-28 shrink-0 text-right">{days != null && days >= 1 && <span className="typo-field-value text-text-primary whitespace-nowrap">{t("kontakte.daysAgo", { count: days })}</span>}</div>
      <button type="button" aria-label={openLabel} data-tip={openLabel} onClick={onOpen}
        className="w-8 h-8 shrink-0 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-transform flex items-center justify-center cursor-pointer">
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
