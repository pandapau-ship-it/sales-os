/**
 * LeadListRow — Lead-Listenzeile (Hunter „Leads"-Liste): collapsed Top-Row
 * (Avatar/ICP/Company/Stage/Heat/Zeit/Pfeil) + aufklappbarer Detailbereich
 * (KI-Kurzakte · Deal Details · Aktionen · Communication Chain).
 * Kanonischer Stand aus screens/ScreenHunting.tsx. Prop-driven (State/Handler beim Aufrufer).
 */
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Check, ChevronUp, ChevronDown, ArrowRight, CheckSquare, FileText, Mail,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import HeatBadge from './HeatBadge';
import StageBadge from './StageBadge';
import { type DealCardAction } from './DealKurzinfo';
import ExpandedCardContent from './ExpandedCardContent';

export default function LeadListRow({
  lead, isExpanded, selected, onToggleExpand, onToggleSelect, onOpenInfo, onAction,
}: {
  lead: any;
  isExpanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (e: MouseEvent) => void;
  onOpenInfo: () => void;
  /** Karten-Aktion → Panel mit Tab/Aktion (editDeal trägt dealId). Fehlt → Fallback onOpenInfo. */
  onAction?: (action: DealCardAction, dealId?: string) => void;
  // Weiter akzeptiert (Aufrufer-Kompatibilität), im neuen Expand nicht genutzt.
  onSelectCommunication?: (personId: string, tpId: string) => void;
}) {
  const act = (a: DealCardAction, dealId?: string) => (onAction ? onAction(a, dealId) : onOpenInfo());
  const { t } = useTranslation();
  // „vor X Tagen" aus contacts.last_contacted_at (reine Anzeige). null → „—".
  const lastContactedDays = lead.lastContactedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / 86400000))
    : null;

  // lead.id = contact_id → für den geteilten, lazy ladenden Expand-Inhalt.
  const contactId: string | undefined = lead.id;

  return (
    <div
      className={`group rounded-[12px] p-4 flex flex-col gap-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-[var(--border-card)] relative ${
        selected ? 'bg-[var(--signal-teal-bg)]' : 'bg-app-surface'
      }`}
      onClick={onToggleExpand}
    >
      {/* TOP ROW / COLLAPSED STATE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">

        {/* Select Checkbox (Hover/Selected state) */}
        <div
          onClick={onToggleSelect}
          className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-[6px] z-10 ${
            selected ? 'bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]' : 'bg-app-surface border-2 border-[var(--border)] hover:border-[var(--text-muted)]'
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />}
        </div>

        {/* Avatar & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 group-hover:ml-8 transition-all duration-300">
          <div className="relative shrink-0">
            <Avatar name={lead.person.name} src={lead.person.avatarUrl} size={40} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="typo-card-title text-[var(--text-primary)]">{lead.person.name}</span>
            <span className="typo-subline text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
              {lead.person.jobTitle}, {lead.person.company}
            </span>
          </div>
        </div>

        {/* ICP donut & Company Area */}
        <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
          <div className="w-[48px] flex items-center justify-center">
            {lead.icpScore != null && <ICPDonut score={lead.icpScore} />}
          </div>

          {/* Firmen-Block: Quadrat = Initiale des Firmennamens (kein Logo-Feld). Keine
              Firma (company_id NULL) → komplett ausblenden; Breite bleibt als
              unsichtbarer Platzhalter erhalten, damit Status/Heat nicht verrutschen. */}
          {lead.person.company ? (
            <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
              <div className="bg-[var(--text-primary)] text-on-accent typo-card-title w-[40px] h-[40px] flex items-center justify-center rounded-[12px] shrink-0">
                {lead.person.company.charAt(0).toUpperCase()}
              </div>
              <span className="typo-field-value text-[var(--sherloq-primary)] w-[120px] truncate">{lead.person.company}</span>
            </div>
          ) : (
            <div className="w-[140px] xl:w-[180px]" aria-hidden />
          )}
        </div>

        {/* Middle Stats (Simplified) */}
        <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
          <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
            <span className="absolute -top-[14px] typo-field-label text-[var(--icon-muted)]">{t('hunter.leadCard.statusLabel')}</span>
            {lead.contactStatusLabel && <StageBadge stage={lead.contactStatusLabel} />}
          </div>
          <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
            <span className="absolute -top-[14px] typo-field-label text-[var(--icon-muted)]">{t('hunter.common.heat')}</span>
            <HeatBadge status={lead.heatStatus} />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
          {/* Zeit-Spalte: Wrapper bleibt als unsichtbarer Platzhalter (kein Layout-Sprung);
              bei last_contacted_at=NULL wird nichts gerendert (kein „—"). */}
          <div className="flex flex-col items-end justify-center hidden sm:flex w-[130px] relative h-full">
            {/* „vor 0 Tagen" wird unterdrückt — erst ab 1 Tag. Überschrift wie STATUS/HEAT. */}
            {lastContactedDays !== null && lastContactedDays >= 1 && (
              <>
                <span className="absolute -top-[14px] right-0 typo-field-label text-[var(--icon-muted)]">{t('hunter.common.lastContact')}</span>
                <span className="typo-field-value text-[var(--text-primary)] whitespace-nowrap">
                  {t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: lastContactedDays }) })}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 relative justify-end">
            {/* Quick-Actions nur im aufgeklappten Zustand — Icon-only, Tooltip on hover. */}
            {isExpanded && (
              <>
                <button onClick={(e) => { e.stopPropagation(); act('task'); }} aria-label={t('hunter.leadCard.task')} data-tip={t('hunter.leadCard.task')} className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer">
                  <CheckSquare className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); act('note'); }} aria-label="Notiz" data-tip="Notiz" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer">
                  <FileText className="w-5 h-5" />
                </button>
                <button disabled aria-label={t('hunter.leadCard.mail')} data-tip="Folgt mit Nango-Anbindung" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted opacity-40 hover:bg-app-bg cursor-not-allowed">
                  <Mail className="w-5 h-5" />
                </button>
              </>
            )}
            <button className="w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)]">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInfo();
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT — geteilter Inhalt (KI-Kurzakte · Deals · Kommunikation), lazy. */}
      {isExpanded && (
        <ExpandedCardContent contactId={contactId} onEditDeal={(dealId) => act('editDeal', dealId)} />
      )}
    </div>
  );
}
