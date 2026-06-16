/**
 * DealKurzinfo — rechte Spalte der aufgeklappten Profilkarte (HunterCard & LeadListRow):
 * „Deal Details" (Deal-Name + Produkt + Volumen/Laufzeit/Stage/Probability) und „Aktionen"
 * (Mail/Task → jeweiliges Panel via `onAction`; **Stage = Dropdown** der Pipeline-Stages;
 * AI Chat). Zentral, prop-driven, Tokens-only. `onAction` öffnet das Kontakt-Panel mit der
 * Aktion; fehlt es, fällt der Klick auf `onOpenInfo` (Panel ohne Vorauswahl) zurück.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Briefcase, Target, Mail, CalendarCheck, MessageSquare, AlertTriangle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type DealCardAction = "mail" | "task" | "chat";

// Kanonische Default-Stages (bis settings/pipeline_stages aus der DB kommen).
const STAGES = ["Backlog", "Demo vereinbart", "Follow-up offen", "Onboarding offen", "Free Trial", "Gewonnen"];

export default function DealKurzinfo({
  stage, company, product = "Enterprise", daysInStage = 8, onAction, onOpenInfo, onStageChange,
}: {
  stage: string;
  company?: string;
  product?: string;
  daysInStage?: number;
  onAction?: (action: DealCardAction) => void;
  onOpenInfo?: () => void;
  onStageChange?: (stage: string) => void;
}) {
  const { t } = useTranslation();
  const [localStage, setLocalStage] = useState(stage);
  const act = (a: DealCardAction) => (onAction ? onAction(a) : onOpenInfo?.());
  // Aktuellen Stage-Wert immer auswählbar halten (Karten-Label ≠ kanonischer Slug möglich).
  const stageOptions = Array.from(new Set([localStage, ...STAGES].filter(Boolean)));

  return (
    <>
      {/* Deal Details */}
      <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
          <Briefcase className="w-4 h-4" /> {t("hunter.leadCard.dealDetails")}
        </div>
        {company && <p className="text-[15px] font-extrabold text-text-primary mb-3 truncate">{company} — {product}</p>}
        <div className="grid grid-cols-2 gap-4 text-[12px]">
          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t("hunter.leadCard.volume")}</span>
            <span className="font-bold text-[var(--sherloq-primary)] text-[14px]">24.000 € ARR</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">Produkt</span>
            <span className="font-bold text-text-primary text-[14px] truncate">{product}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t("hunter.leadCard.duration")}</span>
            <span className="font-bold text-[var(--text-primary)] text-[14px]">12 Monate</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t("hunter.common.stage")}</span>
            <span className="font-bold text-[var(--icp-low)] text-[14px] flex items-center gap-1.5">
              {localStage} <span className="font-semibold text-[var(--icp-low)] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {daysInStage}T</span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t("hunter.leadCard.probability")}</span>
            <span className="font-bold text-[var(--text-primary)] text-[14px]">60%</span>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
          <Target className="w-4 h-4" /> {t("hunter.leadCard.actions")}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); act("mail"); }} className="flex-1 bg-app-surface border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Mail className="w-3.5 h-3.5" /> {t("hunter.leadCard.mail")}
            </button>
            <button onClick={(e) => { e.stopPropagation(); act("task"); }} className="flex-1 bg-app-surface border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <CalendarCheck className="w-3.5 h-3.5" /> {t("hunter.leadCard.task")}
            </button>
          </div>
          {/* Stage-Wechsel als Dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <Select value={localStage} onValueChange={(v) => { setLocalStage(v); onStageChange?.(v); }}>
              <SelectTrigger className="w-full rounded-[12px] border-border bg-app-surface text-[12px] font-semibold text-text-body">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mr-2">{t("hunter.common.stage")}</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button onClick={(e) => { e.stopPropagation(); act("chat"); }} className="w-full bg-app-surface border border-[var(--border)] hover:bg-[var(--app-bg)] text-[var(--text-primary)] font-bold text-[13px] py-2.5 rounded-[12px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <MessageSquare className="w-4 h-4 text-[var(--sherloq-primary)]" /> {t("hunter.leadCard.startAiChat")}
          </button>
        </div>
      </div>
    </>
  );
}
