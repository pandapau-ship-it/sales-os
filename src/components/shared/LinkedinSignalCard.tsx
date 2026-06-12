import { useTranslation } from "react-i18next";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

interface LinkedinSignalCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBg?: string;
  companyInitials: string;
  companyName: string;
  stage?: string;
  labelType?: "STAGE" | "SUBSCRIPTION";
  icpScore?: number;
  timeAgo?: string;
  timeAgoLabel?: string;
  timeLeftHours?: number;
  windowHours?: number;
  actionText: string;
  commentText?: string;
  quoteText?: string;
  aiRecommendation?: string;
  onActNow?: () => void;
}

/**
 * LinkedinSignalCard — gleiche Kachel-Struktur wie eine Leads-Kachel
 * (Avatar · Name/Jobtitel | ICP/Company | Stage/Heat | Zeit), plus eine
 * Signal-Row am unteren Rand (grauer Hintergrund, border-t) mit
 * LinkedIn-Signal-Badge, Aktionstext, Timer-Balken und Act-now-Button.
 */
export function LinkedinSignalCard({
  name,
  role,
  avatarUrl,
  companyInitials,
  companyName,
  stage = "Signal",
  icpScore = 80,
  timeAgo = "2 Std.",
  timeAgoLabel,
  timeLeftHours = 46,
  windowHours = 48,
  actionText,
  onActNow,
}: LinkedinSignalCardProps) {
  const { t } = useTranslation();

  const timeProgress =
    windowHours > 0 ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100) : 100;

  return (
    <div className="rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--border-card)] bg-white flex flex-col overflow-hidden font-sans">
      {/* TOP ROW — identisch zur Leads-Kachel */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar name={name} src={avatarUrl} size={40} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--signal-info-text)] border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-[var(--text-primary)] font-sans">{name}</span>
              <span className="text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
                {role}, {companyName}
              </span>
            </div>
          </div>

          {/* ICP donut & Company Area */}
          <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
            <div className="w-[48px] flex items-center justify-center">
              <ICPDonut score={icpScore} />
            </div>

            <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
              <div className="bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                {companyInitials}
              </div>
              <span className="text-[14px] text-[var(--sherloq-primary)] font-semibold w-[120px] truncate">{companyName}</span>
            </div>
          </div>

          {/* Stage & Heat */}
          <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
            <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
              <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.stage')}</span>
              <div className="px-4 py-2 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]">
                {stage}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
              <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.heat')}</span>
              <div className="px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 bg-[var(--signal-success-bg)] text-[var(--icp-high)] border-[var(--signal-success-bg)]">
                ● {t('hunter.heat.active')}
              </div>
            </div>
          </div>

          {/* Zeit — ganz rechts */}
          <div className="flex items-center pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-end">
            <div className="flex flex-col items-end w-[130px]">
              <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">{timeAgoLabel || timeAgo}</span>
              <span className="mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap">
                {t('hunter.common.hoursLeft', { hours: timeLeftHours })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNAL-ROW — einzige Ergänzung ggü. Leads-Kachel */}
      <div className="bg-[var(--app-bg)] border-t border-[var(--border-card)] px-4 py-3 flex items-center justify-between gap-4">
        {/* Links: LinkedIn-Signal-Badge + Aktionstext */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
            <LinkedinIcon className="w-[11px] h-[11px]" />
            {t('hunter.common.linkedinSignal')}
          </span>
          <span className="text-[12px] font-medium text-[var(--text-body)] truncate">{actionText}</span>
        </div>

        {/* Rechts: Timer-Balken + Act now */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col w-[160px]">
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--icp-low)] rounded-full" style={{ width: `${timeProgress}%` }} />
            </div>
            <span className="mt-1 text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-widest text-right">
              {t('hunter.common.hoursWindow', { hours: windowHours })}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActNow?.();
            }}
            className="bg-[var(--sherloq-primary)] text-white rounded-full px-4 py-2 text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {t('hunter.signals.actNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
