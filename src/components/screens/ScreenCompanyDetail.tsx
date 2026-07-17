/**
 * ScreenCompanyDetail — Company-Detailseite (volle Seite). K-4a liefert die ECHTE Kopfzeile
 * + KPIs (aus getCompanyDetail, per Hover vorgeladen). Die Tabs (Übersicht/Kontakte/Deals/
 * Aktivität/Notizen) + Bearbeiten/Anlegen folgen in K-4b — hier bewusst als „folgt"-Hinweis
 * (Honesty, [D5]-Muster), kein Fake-Inhalt. Kein toter Button: nur echte Affordances.
 */
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Building2 } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useNowMs } from "@/hooks/useNowMs";
import { getCompanyDetail } from "@/lib/db";
import { companyToCompaniesRow, formatEuroCents } from "@/lib/companiesMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { Avatar, StatusBadge, EmptyState } from "@/components";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { PanelSkeleton } from "@/components/panel-blocks";

/** KPI-Kachel (echt) — Modulebene, damit sie nicht im Render entsteht (lint). */
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-[160px] rounded-[12px] border border-[var(--border-card)] bg-app-surface px-5 py-4">
      <div className="typo-field-value text-text-primary text-[18px] font-bold">{value}</div>
      <div className="typo-field-label text-text-muted mt-1">{label}</div>
    </div>
  );
}

export default function ScreenCompanyDetail() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { organizationId } = useCurrentOrg();
  const nowMs = useNowMs();

  const detailQuery = useQuery({
    queryKey: ["companyDetail", organizationId, id],
    queryFn: () => getCompanyDetail(organizationId, id),
    enabled: !!id, staleTime: 30_000,
  });

  const back = (
    <button type="button" onClick={() => navigate("/app/companies")}
      className="inline-flex items-center gap-2 text-[13px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer mb-4">
      <ArrowLeft className="w-4 h-4" /> {t("companies.detail.back")}
    </button>
  );

  if (detailQuery.isLoading) return <div className="flex flex-col h-full">{back}<PanelSkeleton rows={4} /></div>;
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="flex flex-col h-full">
        {back}
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<Building2 className="w-6 h-6" />} title={t("companies.detail.notFound")} description={t("companies.detail.notFoundDesc")} />
        </div>
      </div>
    );
  }

  const r = companyToCompaniesRow(detailQuery.data);
  const days = daysSinceIso(r.lastContactAt, nowMs);
  const arr = formatEuroCents(r.arr);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      {back}

      {/* Kopf-Karte (echt) */}
      <div className="rounded-[12px] border border-[var(--border-card)] bg-app-surface px-6 py-5 mb-4">
        <div className="flex items-start gap-4">
          <Avatar name={r.name} size={56} />
          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-extrabold text-text-primary truncate">{r.name}</h1>
              <StatusBadge label={t(`companies.status.${r.status.kind}`)} tone={r.status.tone} />
            </div>
            {[r.industry, r.sizeRange, r.location].filter(Boolean).length > 0 && (
              <span className="typo-subline text-text-muted">{[r.industry, r.sizeRange, r.location].filter(Boolean).join(" · ")}</span>
            )}
            <div className="flex items-center gap-4 mt-1">
              {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-text-body hover:text-[var(--sherloq-primary)]"><Globe className="w-3.5 h-3.5" /> {r.domain ?? r.website}</a>}
              {r.linkedinUrl && <a href={r.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-text-body hover:text-[var(--sherloq-primary)]"><LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn</a>}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs (echt, Honesty: fehlende weglassen) */}
      <div className="flex items-stretch gap-4 flex-wrap mb-4">
        {arr && <Kpi label={t("companies.kpi.arr")} value={arr} />}
        <Kpi label={t("companies.kpi.contacts")} value={t("companies.contactsCount", { count: r.contactCount })} />
        {days != null && days >= 1 && <Kpi label={t("companies.kpi.lastContact")} value={t("companies.daysAgo", { count: days })} />}
        {r.openDealsCount > 0 && <Kpi label={t("companies.kpi.openDeals")} value={t("companies.dealsCount", { count: r.openDealsCount })} />}
      </div>

      {/* Tabs folgen (K-4b) — ehrlicher Platzhalter statt Fake-Inhalt */}
      <div className="rounded-[12px] border border-[var(--border-card)] bg-app-surface px-6 py-8 text-center">
        <p className="text-[14px] font-semibold text-text-primary">{t("companies.detail.tabsSoonTitle")}</p>
        <p className="text-[13px] text-text-muted mt-1">{t("companies.detail.tabsSoonDesc")}</p>
      </div>
    </div>
  );
}
