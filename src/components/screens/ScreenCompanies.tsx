/**
 * ScreenCompanies — Companies-Liste (K-4a). Nutzt die GETEILTE Tabellen-Mechanik (Phase C):
 * `useDataTable` · `DataTableCard` · `ColumnConfigPopover` — 1:1 wie ScreenKontakte, eigener
 * `persistKey="table_views.companies"`. Companies-spezifisch: Spalten-Definition, 3 Filter-
 * Dropdowns (Branche/Größe/Land), Lagebild (nur echte Aggregate), Bulk (Tag/Export).
 *
 * Spalten: 6 default sichtbar (Company·Status·Kontakte·Zuletzt·ARR·Routing) + Set B (default aus):
 * Branche·Größe·Ort·Domain·Website·LinkedIn·Plan·Subscription·MRR·Umsatz·Offene Deals·Tech·Tags·CRM·Erstellt.
 * Honesty: fehlender Wert → Zelle rendert nichts. Abgeleiteter Status/Routing: Single Source `companyStatus`.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import { ChevronDown, Filter, Building2, Users, X, Globe } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useNowMs } from "@/hooks/useNowMs";
import { useDataTable } from "@/hooks/useDataTable";
import { prefetchCompanyPanel } from "@/lib/prefetch";
import { getCompanies } from "@/lib/db";
import { companyToCompaniesRow, formatEuroCents, type CompaniesRow } from "@/lib/companiesMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, StatusBadge, RoutingChip, EmptyState, DataTableCard, ColumnConfigPopover } from "@/components";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { useToast } from "@/components/shared/toastContext";

const PREF_KEY = "table_views.companies";
// Set-B-Spalten: default ausgeblendet (im Konfig-Popover wählbar).
const SET_B_HIDDEN: Record<string, boolean> = {
  industry: false, sizeRange: false, location: false, domain: false, website: false, linkedinUrl: false,
  subscriptionPlan: false, subscriptionStatus: false, mrr: false, annualRevenue: false, openDealsCount: false,
  techStack: false, tags: false, crmId: false, createdAt: false,
};

const distinct = (vals: (string | undefined)[]): string[] =>
  [...new Set(vals.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "de"));

/** 3 Multi-Select-Dropdowns (Branche/Größe/Land) — Optionen aus den echten Daten. */
function CompaniesFilter({
  industries, sizes, countries, sel, onChange,
}: {
  industries: string[]; sizes: string[]; countries: string[];
  sel: { industry: string[]; size: string[]; country: string[] };
  onChange: (next: { industry: string[]; size: string[]; country: string[] }) => void;
}) {
  const { t } = useTranslation();
  const count = sel.industry.length + sel.size.length + sel.country.length;
  const toggle = (key: keyof typeof sel, id: string) => {
    const arr = sel[key];
    onChange({ ...sel, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
  };
  // Render-Funktion (keine Sub-Komponente im Render → lint-konform).
  const renderSection = (label: string, opts: string[], field: keyof typeof sel) =>
    opts.length ? (
      <div key={field}>
        <div className="typo-section-label text-text-muted px-2 pt-1 pb-1">{label}</div>
        {opts.map((id) => (
          <label key={id} className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] text-[13px] text-text-body hover:bg-app-bg cursor-pointer">
            <input type="checkbox" checked={sel[field].includes(id)} onChange={() => toggle(field, id)} className="accent-[var(--sherloq-primary)] w-3.5 h-3.5" />
            {id}
          </label>
        ))}
      </div>
    ) : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
            count > 0 ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]" : "border-border text-text-body bg-app-surface hover:bg-app-bg")}>
          <Filter className="w-3.5 h-3.5" /> {t("companies.filter")}
          {count > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-[6px] bg-[var(--sherloq-primary)] text-on-accent text-[10px] font-bold flex items-center justify-center tabular-nums">{count}</span>}
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" portal={false} className="w-60 p-1.5 max-h-[360px] overflow-y-auto">
        {renderSection(t("companies.filterIndustry"), industries, "industry")}
        {renderSection(t("companies.filterSize"), sizes, "size")}
        {renderSection(t("companies.filterCountry"), countries, "country")}
      </PopoverContent>
    </Popover>
  );
}

// Zell-Helfer (Honesty: leer → nichts).
const textCell = (v?: string | null) => (v ? <span className="typo-field-value text-text-body truncate block">{v}</span> : null);
const dateCell = (iso: string | null) => (iso ? <span className="typo-field-value text-text-body">{new Date(iso).toLocaleDateString("de-DE")}</span> : null);

export default function ScreenCompanies() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const nowMs = useNowMs();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sel, setSel] = useState<{ industry: string[]; size: string[]; country: string[] }>({ industry: [], size: [], country: [] });
  const [noContact, setNoContact] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ["companies", organizationId],
    queryFn: () => getCompanies(organizationId, { limit: 1000 }),
    staleTime: 30_000,
  });

  const allRows: CompaniesRow[] = useMemo(() => (companiesQuery.data ?? []).map(companyToCompaniesRow), [companiesQuery.data]);
  const industries = useMemo(() => distinct(allRows.map((r) => r.industry)), [allRows]);
  const sizes = useMemo(() => distinct(allRows.map((r) => r.sizeRange)), [allRows]);
  const countries = useMemo(() => distinct(allRows.map((r) => r.country)), [allRows]);

  const rows: CompaniesRow[] = useMemo(() => allRows.filter((r) => {
    if (sel.industry.length && !(r.industry && sel.industry.includes(r.industry))) return false;
    if (sel.size.length && !(r.sizeRange && sel.size.includes(r.sizeRange))) return false;
    if (sel.country.length && !(r.country && sel.country.includes(r.country))) return false;
    if (noContact && r.contactCount !== 0) return false;
    return true;
  }), [allRows, sel, noContact]);

  const noContactCount = useMemo(() => allRows.filter((r) => r.contactCount === 0).length, [allRows]);

  // Filterwechsel → Bulk-Auswahl zurücksetzen.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRowSelection({}); }, [sel, noContact]);

  const col = createColumnHelper<CompaniesRow>();
  const columns = useMemo(() => [
    col.accessor("name", {
      header: t("companies.col.name"), size: 260, minSize: 180,
      cell: (c) => {
        const r = c.row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={r.name} size={36} />
            <div className="flex flex-col min-w-0">
              <span className="typo-card-title text-text-primary truncate">{r.name}</span>
              <span className="typo-subline text-text-muted truncate">{[r.industry, r.sizeRange, r.city].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        );
      },
    }),
    col.accessor((r) => r.status.kind, {
      id: "status", header: t("companies.col.status"), size: 140, minSize: 110, enableSorting: false,
      cell: (c) => { const s = c.row.original.status; return <StatusBadge label={t(`companies.status.${s.kind}`)} tone={s.tone} />; },
    }),
    col.accessor("contactCount", { header: t("companies.col.contactCount"), size: 120, minSize: 90, cell: (c) => (
      <span className="typo-field-value text-text-body">{t("companies.contactsCount", { count: c.getValue() })}</span>
    ) }),
    col.accessor("lastContactAt", { header: t("companies.col.lastContactAt"), size: 120, minSize: 100, cell: (c) => {
      const d = daysSinceIso(c.getValue(), nowMs); return d != null && d >= 1 ? <span className="typo-field-value text-text-primary">{t("companies.daysAgo", { count: d })}</span> : null;
    } }),
    col.accessor("arr", { header: t("companies.col.arr"), size: 120, minSize: 90, cell: (c) => textCell(formatEuroCents(c.getValue())) }),
    col.accessor((r) => r.status.routing, {
      id: "routing", header: t("companies.col.routing"), size: 140, minSize: 110, enableSorting: false,
      cell: (c) => <RoutingChip routing={c.row.original.status.routing} onNavigate={(p) => navigate(p)} />,
    }),
    // ── Set B (default aus) ──
    col.accessor("industry", { header: t("companies.col.industry"), size: 150, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("sizeRange", { header: t("companies.col.sizeRange"), size: 120, minSize: 90, cell: (c) => textCell(c.getValue()) }),
    col.accessor("location", { header: t("companies.col.location"), size: 160, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("domain", { header: t("companies.col.domain"), size: 160, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("website", { header: t("companies.col.website"), size: 120, minSize: 90, enableSorting: false, cell: (c) => {
      const v = c.getValue(); return v ? <a href={v} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--sherloq-primary)] hover:opacity-80 inline-flex"><Globe className="w-4 h-4" /></a> : null;
    } }),
    col.accessor("linkedinUrl", { header: t("companies.col.linkedinUrl"), size: 110, minSize: 90, enableSorting: false, cell: (c) => {
      const v = c.getValue(); return v ? <a href={v} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--sherloq-primary)] hover:opacity-80 inline-flex"><LinkedinIcon className="w-4 h-4" /></a> : null;
    } }),
    col.accessor("subscriptionPlan", { header: t("companies.col.subscriptionPlan"), size: 130, minSize: 90, cell: (c) => textCell(c.getValue()) }),
    col.accessor("subscriptionStatus", { header: t("companies.col.subscriptionStatus"), size: 130, minSize: 100, cell: (c) => {
      const v = c.getValue(); return v ? <StatusBadge label={t(`companies.subscription.${v}`, { defaultValue: v })} tone={v === "active" ? "success" : v === "churned" ? "urgent" : "info"} /> : null;
    } }),
    col.accessor("mrr", { header: t("companies.col.mrr"), size: 110, minSize: 90, cell: (c) => textCell(formatEuroCents(c.getValue())) }),
    col.accessor("annualRevenue", { header: t("companies.col.annualRevenue"), size: 130, minSize: 100, cell: (c) => textCell(formatEuroCents(c.getValue())) }),
    col.accessor("openDealsCount", { header: t("companies.col.openDealsCount"), size: 120, minSize: 90, cell: (c) => {
      const n = c.getValue(); return n > 0 ? <span className="typo-field-value text-text-body">{t("companies.dealsCount", { count: n })}</span> : null;
    } }),
    col.accessor("techStack", { header: t("companies.col.techStack"), size: 160, minSize: 100, enableSorting: false, cell: (c) => {
      const tags = c.getValue(); if (!tags?.length) return null;
      return <div className="flex items-center gap-1 min-w-0">{tags.slice(0, 2).map((tag) => <span key={tag} className="px-1.5 py-0.5 rounded-[6px] bg-app-bg text-text-muted text-[11px] truncate">{tag}</span>)}{tags.length > 2 && <span className="text-[11px] text-text-muted">+{tags.length - 2}</span>}</div>;
    } }),
    col.accessor("tags", { header: t("companies.col.tags"), size: 160, minSize: 100, enableSorting: false, cell: (c) => {
      const tags = c.getValue(); if (!tags?.length) return null;
      return <div className="flex items-center gap-1 min-w-0">{tags.slice(0, 2).map((tag) => <span key={tag} className="px-1.5 py-0.5 rounded-[6px] bg-app-bg text-text-muted text-[11px] truncate">{tag}</span>)}{tags.length > 2 && <span className="text-[11px] text-text-muted">+{tags.length - 2}</span>}</div>;
    } }),
    col.accessor("crmId", { header: t("companies.col.crmId"), size: 120, minSize: 90, cell: (c) => textCell(c.getValue()) }),
    col.accessor("createdAt", { header: t("companies.col.createdAt"), size: 120, minSize: 100, cell: (c) => dateCell(c.getValue()) }),
  ], [col, t, nowMs, navigate]);

  const { table, resetColumns } = useDataTable<CompaniesRow>({
    data: rows, columns, getRowId: (r) => r.id, persistKey: PREF_KEY, userId, organizationId,
    rowSelection, onRowSelectionChange: setRowSelection, initialColumnVisibility: SET_B_HIDDEN,
  });

  const total = rows.length;
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;
  const pageRowCount = table.getRowModel().rows.length;
  const pageAllSelected = table.getIsAllPageRowsSelected();
  const hasFilter = sel.industry.length > 0 || sel.size.length > 0 || sel.country.length > 0 || noContact;

  const clearSelection = () => setRowSelection({});
  const clearFilters = () => { setSel({ industry: [], size: [], country: [] }); setNoContact(false); };
  const bulkAction = (label: string) => { toast(t("companies.bulk.actionToast", { label, count: selectedCount }), "info"); clearSelection(); };

  const emptyState = (
    <EmptyState icon={<Building2 className="w-6 h-6" />}
      title={hasFilter ? t("companies.noHits") : t("companies.emptyTitle")}
      description={hasFilter ? t("companies.noHitsDesc") : t("companies.emptyDesc")} />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Kopf */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold text-text-primary">{t("companies.title")}</h1>
          {total > 0 && <span className="px-2 py-0.5 rounded-[7px] bg-app-bg text-text-muted text-[13px] font-semibold tabular-nums">{total.toLocaleString("de-DE")}</span>}
        </div>
        <ColumnConfigPopover table={table} columnLabelFor={(id) => t(`companies.col.${id}`)} onReset={resetColumns} pinnedId="name" />
      </div>

      {/* Lagebild — nur echte Aggregate (Honesty) */}
      {noContactCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button type="button" onClick={() => setNoContact((v) => !v)}
            className={cn("inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-[10px] border text-[12px] transition-colors cursor-pointer",
              noContact ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border bg-app-surface text-text-body hover:bg-app-bg")}>
            <Users className="w-3.5 h-3.5 opacity-80" />
            <span className="font-bold tabular-nums">{noContactCount.toLocaleString("de-DE")}</span>
            <span className="text-text-muted">{t("companies.lagebild.noContact")}</span>
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <CompaniesFilter industries={industries} sizes={sizes} countries={countries} sel={sel} onChange={setSel} />
        {hasFilter && (
          <button type="button" onClick={clearFilters} className="text-[12px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer px-2">{t("companies.resetFilters")}</button>
        )}
      </div>

      {/* Bulk-Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-[10px] bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/20">
          <div className="flex items-center gap-3 text-[13px] text-text-body">
            <span className="font-bold">{t("companies.bulk.selected", { count: selectedCount })}</span>
            {pageAllSelected && selectedCount < total && (
              <button onClick={() => setRowSelection(Object.fromEntries(rows.map((r) => [r.id, true])))} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">
                {t("companies.bulk.selectAll", { count: total })}
              </button>
            )}
            {selectedCount === total && total > pageRowCount && <button onClick={clearSelection} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">{t("companies.bulk.clear")}</button>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkAction(t("companies.bulk.tagFull"))} className="sherloq-btn-secondary">{t("companies.bulk.tag")}</button>
            <button onClick={() => bulkAction(t("companies.bulk.exportFull"))} className="sherloq-btn-secondary">{t("companies.bulk.export")}</button>
            <button onClick={clearSelection} aria-label={t("companies.bulk.clear")} data-tip={t("companies.bulk.clear")} className="w-8 h-8 rounded-full hover:bg-app-surface flex items-center justify-center text-text-muted cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Tabelle (geteilte Komponente) */}
      <DataTableCard
        table={table}
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        onReload={() => companiesQuery.refetch()}
        emptyState={emptyState}
        entityLabel={t("companies.entity")}
        onRowOpen={(r) => navigate(`/app/companies/${r.id}`)}
        onRowPrefetch={(r) => prefetchCompanyPanel(queryClient, organizationId, r.id)}
      />
    </div>
  );
}
