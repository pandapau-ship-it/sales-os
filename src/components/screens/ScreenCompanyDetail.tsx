/**
 * ScreenCompanyDetail — Company-Detailseite (volle Seite). K-4b-1: Kopf + KPIs (echt) +
 * Tab-Navigation. Aktiv: Übersicht (Company-Details, inline editierbar via updateCompany) +
 * Kontakte (echte Kontakte der Firma, „+ Kontakt" mit vorbelegter Company). Deals/Aktivität/
 * Notizen folgen in K-4b-2 (ehrlicher „folgt"-Platzhalter, kein Fake).
 *
 * Honesty: fehlende Werte → nichts; Sherloq-Zusammenfassung/Live-Signale + „Quelle/Inhaber" +
 * Churn-KPI bleiben aus (kein Company-Modul/Feld dafür). Wiederverwendung: DetailSection/
 * DetailField/PanelTabs/Avatar/ICPDonut/StatusBadge/HunterSidepanel/KontaktAnlegenPanel.
 */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Building2, Users, Briefcase, Activity, StickyNote, LayoutDashboard, Plus } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useNowMs } from "@/hooks/useNowMs";
import {
  getCompanyDetail, getContacts, updateCompany,
  getPipelineSettings, getProducts, getOrgUsers,
  getDealsByCompany, createDeal, updateDeal, updateDealStage, softDeleteDeal,
  getNotesByCompany, createCompanyNote, updateNote, softDeleteNote,
  getCompanyActivity,
} from "@/lib/db";
import { prefetchContactPanel } from "@/lib/prefetch";
import { companyToCompaniesRow, formatEuroCents } from "@/lib/companiesMappers";
import { contactToKontakteRow } from "@/lib/kontakteMappers";
import { daysSinceIso, companyActivityToView } from "@/lib/hunterMappers";
import { BRANCHE_OPTS, GROESSE_OPTS, LAND_OPTS } from "@/lib/contactDetailFields";
import { Avatar, EmptyState, DetailSection, DetailField, HunterSidepanel, KontaktAnlegenPanel, CompactContactRow, DealsListe, KommunikationVerlauf, NotizenListe } from "@/components";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { PanelSkeleton, PanelTabs } from "@/components/panel-blocks";
import { useToast } from "@/components/shared/toastContext";
import type { Person } from "@/types";

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
  const { user } = useAuth();
  const nowMs = useNowMs();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState("overview");
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["companyDetail", organizationId, id],
    queryFn: () => getCompanyDetail(organizationId, id),
    enabled: !!id, staleTime: 30_000,
  });
  // Volle Kontakte der Firma — erst laden, wenn der Kontakte-Tab offen ist (Anzahl kommt aus dem Embed).
  const contactsQuery = useQuery({
    queryKey: ["companyContacts", organizationId, id],
    queryFn: () => getContacts(organizationId, { companyId: id, limit: 500 }),
    enabled: !!id && tab === "contacts", staleTime: 30_000,
  });
  // Deals-Tab (lazy)
  const dealsQuery = useQuery({
    queryKey: ["companyDeals", organizationId, id],
    queryFn: () => getDealsByCompany(organizationId, id),
    enabled: !!id && tab === "deals", staleTime: 30_000,
  });
  // Notizen-Tab (lazy)
  const notesQuery = useQuery({
    queryKey: ["companyNotes", organizationId, id],
    queryFn: () => getNotesByCompany(organizationId, id),
    enabled: !!id && tab === "notes", staleTime: 30_000,
  });
  // Aktivität-Tab (lazy) — aggregierter Touchpoint-Feed aller Firmen-Kontakte
  const activityQuery = useQuery({
    queryKey: ["companyActivity", organizationId, id],
    queryFn: () => getCompanyActivity(organizationId, id),
    enabled: !!id && tab === "activity", staleTime: 30_000,
  });
  // Referenzdaten für den Deals-Tab (Stage-Maps + Kataloge) — nur wenn Deals-Tab aktiv.
  const stagesQuery = useQuery({ queryKey: ["pipelineStages", organizationId], queryFn: () => getPipelineSettings(organizationId), enabled: tab === "deals", staleTime: 5 * 60_000 });
  const productsQuery = useQuery({ queryKey: ["products", organizationId], queryFn: () => getProducts(organizationId), enabled: tab === "deals", staleTime: 5 * 60_000 });
  const usersQuery = useQuery({ queryKey: ["orgUsers", organizationId], queryFn: () => getOrgUsers(organizationId), enabled: tab === "deals", staleTime: 5 * 60_000 });

  const stages = stagesQuery.data ?? [];
  const stageMap = Object.fromEntries(stages.map((s) => [s.slug, s.name]));
  const stageProbMap = Object.fromEntries(stages.map((s) => [s.slug, s.probability]));
  const stagnationBySlug = Object.fromEntries(stages.map((s) => [s.slug, s.stagnation_days]));
  const stageOptions = [...stages].sort((a, b) => a.order - b.order).map((s) => ({ slug: s.slug, name: s.name }));
  const productOptions = (productsQuery.data ?? []).map((p) => (p as { name: string }).name);
  const ownerOptions = (usersQuery.data ?? []).map((u) => ({ id: (u as { id: string }).id, name: (u as { full_name?: string }).full_name ?? "" })).filter((o) => o.name);

  const invalidateDeals = () => {
    void qc.invalidateQueries({ queryKey: ["companyDeals", organizationId, id] });
    void qc.invalidateQueries({ queryKey: ["companyDetail", organizationId, id] }); // Offene-Deals-KPI
    void qc.invalidateQueries({ queryKey: ["deals", organizationId] });             // Hunter Pipeline/Übersicht
  };
  type DealFormValues = { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string };
  const mapDealForm = (v: DealFormValues) => ({
    name: v.name,
    product: v.product || undefined,
    valueEur: v.value && !Number.isNaN(Number(v.value)) ? Number(v.value) : undefined,
    termMonths: v.termMonths && !Number.isNaN(Number(v.termMonths)) ? Math.trunc(Number(v.termMonths)) : undefined,
    noticePeriodDays: v.noticePeriodDays && !Number.isNaN(Number(v.noticePeriodDays)) ? Math.trunc(Number(v.noticePeriodDays)) : undefined,
    expectedCloseDate: v.expectedCloseDate || undefined,
    ownerId: v.ownerId || undefined,
  });
  const createDealMutation = useMutation({
    mutationFn: (v: DealFormValues) => createDeal(organizationId, { ...mapDealForm(v), stage: v.stage || undefined, companyId: id }),
    onSuccess: () => { invalidateDeals(); toast(t("companies.deals.createdToast"), "success"); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const updateDealMutation = useMutation({
    mutationFn: async (p: { dealId: string; v: DealFormValues }) => {
      await updateDeal(organizationId, p.dealId, mapDealForm(p.v));
      const current = (dealsQuery.data ?? []).find((d) => (d as { id: string }).id === p.dealId) as { stage?: string } | undefined;
      if (p.v.stage && p.v.stage !== current?.stage) await updateDealStage(p.dealId, p.v.stage, organizationId);
    },
    onSuccess: () => { invalidateDeals(); toast(t("companies.deals.updatedToast"), "success"); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const deleteDealMutation = useMutation({
    mutationFn: (dealId: string) => softDeleteDeal(dealId, organizationId),
    onSuccess: () => { invalidateDeals(); toast(t("companies.deals.deletedToast"), "success"); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const changeStageMutation = useMutation({
    mutationFn: (p: { dealId: string; newSlug: string }) => updateDealStage(p.dealId, p.newSlug, organizationId),
    onSuccess: () => invalidateDeals(),
    onError: (e) => toast((e as Error).message, "error"),
  });

  const invalidateNotes = () => void qc.invalidateQueries({ queryKey: ["companyNotes", organizationId, id] });
  const createNoteMutation = useMutation({ mutationFn: (body: string) => createCompanyNote(organizationId, id, body, user?.id), onSuccess: invalidateNotes, onError: (e) => toast((e as Error).message, "error") });
  const updateNoteMutation = useMutation({ mutationFn: (p: { id: string; body: string }) => updateNote(p.id, organizationId, p.body), onSuccess: invalidateNotes, onError: (e) => toast((e as Error).message, "error") });
  const deleteNoteMutation = useMutation({ mutationFn: (noteId: string) => softDeleteNote(noteId, organizationId), onSuccess: invalidateNotes, onError: (e) => toast((e as Error).message, "error") });

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

  const saveField = async (col: string, value: string) => {
    try {
      await updateCompany(id, organizationId, { [col]: value.trim() || null });
      void qc.invalidateQueries({ queryKey: ["companyDetail", organizationId, id] });
      toast(t("companies.detail.savedToast"), "success");
    } catch { toast(t("companies.detail.saveErrorToast"), "error"); }
  };

  const tabs = [
    { id: "overview", label: t("companies.tabs.overview"), icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "contacts", label: `${t("companies.tabs.contacts")} (${r.contactCount})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: "deals", label: t("companies.tabs.deals"), icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "activity", label: t("companies.tabs.activity"), icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "notes", label: t("companies.tabs.notes"), icon: <StickyNote className="w-3.5 h-3.5" /> },
  ];

  const contactRows = (contactsQuery.data ?? []).map(contactToKontakteRow);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      {back}

      {/* Kopf-Karte (echt) */}
      <div className="rounded-[12px] border border-[var(--border-card)] bg-app-surface px-6 py-5 mb-4">
        <div className="flex items-start gap-4">
          <Avatar name={r.name} size={56} />
          <div className="flex flex-col min-w-0 gap-1">
            <h1 className="text-[22px] font-extrabold text-text-primary truncate">{r.name}</h1>
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

      {/* Tabs */}
      <div className="border-b border-[var(--border-card)] mb-5"><PanelTabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {/* Tab-Inhalt */}
      {tab === "overview" && (
        <DetailSection title={t("companies.details.title")} icon={Building2} variant="page" cols={2}>
          {/* Name = Pflichtfeld (wie Kontakt-Name im Details-Tab): leer wird nicht gespeichert. */}
          <DetailField label={t("companies.details.name")} value={r.name} onSave={(v) => { if (v.trim()) saveField("name", v); }} />
          <DetailField label={t("companies.details.industry")} value={r.industry ?? ""} options={BRANCHE_OPTS} onSelect={(v) => saveField("industry", v)} />
          <DetailField label={t("companies.details.size")} value={r.sizeRange ?? ""} options={GROESSE_OPTS} onSelect={(v) => saveField("size_range", v)} />
          <DetailField label={t("companies.details.city")} value={r.city ?? ""} onSave={(v) => saveField("city", v)} />
          <DetailField label={t("companies.details.country")} value={r.country ?? ""} options={LAND_OPTS} onSelect={(v) => saveField("country", v)} />
          <DetailField label={t("companies.details.domain")} value={r.domain ?? ""} onSave={(v) => saveField("domain", v)} />
          <DetailField label={t("companies.details.website")} value={r.website ?? ""} href={r.website || undefined} onSave={(v) => saveField("website", v)} />
          <DetailField label={t("companies.details.linkedin")} value={r.linkedinUrl ?? ""} href={r.linkedinUrl || undefined} onSave={(v) => saveField("linkedin_url", v)} />
          <DetailField label={t("companies.details.crmId")} value={r.crmId ?? ""} readonly />
        </DetailSection>
      )}

      {tab === "contacts" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="typo-section-label text-text-muted">{t("companies.detail.contactsTitle", { count: r.contactCount })}</h2>
            <button type="button" onClick={() => setAddContactOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[12px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {t("companies.detail.addContact")}
            </button>
          </div>
          {contactsQuery.isLoading ? (
            <PanelSkeleton rows={3} />
          ) : contactRows.length === 0 ? (
            <EmptyState icon={<Users className="w-6 h-6" />} title={t("companies.detail.noContacts")} description={t("companies.detail.noContactsDesc")} />
          ) : (
            <div className="rounded-[12px] border border-[var(--border-card)] bg-app-surface overflow-hidden">
              {contactRows.map((c) => (
                <CompactContactRow key={c.id}
                  name={c.name} jobTitle={c.jobTitle} company={c.company} avatarUrl={c.avatarUrl}
                  icpScore={c.icpScore} contactStatus={c.contactStatus} leadSource={c.leadSource} lastContactedAt={c.lastContactedAt} routing={c.routing}
                  openLabel={t("companies.detail.openContact")}
                  onOpen={() => setDetailPerson({ id: c.id, name: c.name, jobTitle: c.jobTitle, company: c.company, initials: c.initials, avatarUrl: c.avatarUrl })}
                  onNavigate={(p) => navigate(p)}
                  onPrefetch={() => prefetchContactPanel(qc, organizationId, c.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "deals" && (
        <DealsListe
          variant="detail"
          dealRows={dealsQuery.data ?? []}
          stageNameBySlug={stageMap}
          stageProbBySlug={stageProbMap}
          stagnationBySlug={stagnationBySlug}
          productOptions={productOptions}
          ownerOptions={ownerOptions}
          stageOptions={stageOptions}
          onCreateDeal={(v) => createDealMutation.mutate(v)}
          onUpdateDeal={(dealId, v) => updateDealMutation.mutate({ dealId, v })}
          onDeleteDeal={(dealId) => deleteDealMutation.mutate(dealId)}
          onChangeStage={(dealId, newSlug) => changeStageMutation.mutate({ dealId, newSlug })}
          onToast={(m) => toast(m, "success")}
        />
      )}

      {tab === "activity" && (
        activityQuery.isLoading ? <PanelSkeleton rows={3} />
          : <KommunikationVerlauf items={(activityQuery.data ?? []).map(companyActivityToView)} />
      )}

      {tab === "notes" && (
        notesQuery.isLoading ? <PanelSkeleton rows={3} />
          : <NotizenListe
              noteRows={notesQuery.data ?? []}
              onCreate={(body) => createNoteMutation.mutate(body)}
              onUpdate={(noteId, body) => updateNoteMutation.mutate({ id: noteId, body })}
              onDelete={(noteId) => deleteNoteMutation.mutate(noteId)}
              onToast={(m) => toast(m, "success")}
            />
      )}

      {/* Kontakt-Panel + Anlegen (vorbelegte Company) */}
      {detailPerson && <HunterSidepanel person={detailPerson} onClose={() => setDetailPerson(null)} />}
      <KontaktAnlegenPanel open={addContactOpen} organizationId={organizationId} createdBy={user?.id ?? null} initialCompany={r.name}
        onClose={() => setAddContactOpen(false)}
        onCreated={() => {
          setAddContactOpen(false);
          void qc.invalidateQueries({ queryKey: ["companyContacts", organizationId, id] });
          void qc.invalidateQueries({ queryKey: ["companyDetail", organizationId, id] });
        }} />
    </div>
  );
}
