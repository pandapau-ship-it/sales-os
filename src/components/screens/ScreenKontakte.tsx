/**
 * ScreenKontakte — Kontakte-Liste (K-3). Nutzt die GETEILTE Tabellen-Mechanik (Phase C):
 * `useDataTable` (Tabelle + Persistenz) · `DataTableCard` (Header/Body/Pagination/Zustände/Prefetch) ·
 * `ColumnConfigPopover` (Spalten). Kontakte-spezifisch bleibt hier: Spalten-Definition, Filter
 * (Status-Pills/Lagebild/Filter-Dropdown), Listen-Integration, Anlege-/Detail-Panel.
 *
 * Spalten: 6 default sichtbar (Kontakt·Quelle·Status·Zuletzt·ICP·Routing) + Set B (default aus,
 * im Konfig-Popover wählbar): Firma·E-Mail·LinkedIn·Anrede·Jobtitel·Seniority·Abteilung·Sprache·
 * Twitter·Lead Status·Heat·E-Mail verifiziert·Letzte Antwort·Tags·Lead-Owner·Telefon·Erstellt am.
 * Honesty: fehlender Wert → Zelle rendert nichts.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import {
  ChevronDown, Plus, Filter, Users, MailX, Ban, X, List, ListPlus, Pencil, Trash2, UserMinus, Upload, UploadCloud, GitMerge,
} from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useNowMs } from "@/hooks/useNowMs";
import { useDataTable } from "@/hooks/useDataTable";
import { prefetchContactPanel } from "@/lib/prefetch";
import { getContacts, getLists, getListMembers, renameList, removeFromList, deleteList, softDeleteContacts, getRuleMatchTargets, type ListView } from "@/lib/db";
import { contactToKontakteRow, type KontakteRow } from "@/lib/kontakteMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { evaluateFilter, type FilterDefinition, type FilterNode } from "@/lib/filter";
import type { ContactRow } from "@/types/rows";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Avatar, ICPDonut, StatusBadge, HeatBadge, LeadSourceBadge, RoutingChip, EmptyState, DataTableCard, ColumnConfigPopover, TableSearch, RuleMatchBanner } from "@/components";
import { buildSearchText } from "@/lib/tableSearch";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { useToast } from "@/components/shared/toastContext";
import KontaktAnlegenPanel from "@/components/features/kontakte/KontaktAnlegenPanel";
import { HunterSidepanel, ZuListeDialog, NeueListeDialog } from "@/components";
import type { Person } from "@/types";

const STATUS_TONE: Record<string, "success" | "warn" | "urgent" | "info" | "teal" | "muted"> = {
  in_campaign: "teal", pipeline: "info", kunde: "success", archiviert: "muted", ohne_campaign: "muted", opt_out: "urgent",
};
const STATUS_ORDER = ["ohne_campaign", "in_campaign", "pipeline", "kunde", "archiviert", "opt_out"];
const SOURCE_IDS = ["sherloq", "csv_upload", "crm_sync", "manual"];
const ICP_IDS = ["high", "mid", "low"];
const PREF_KEY = "table_views.contacts";
// Set-B-Spalten: default ausgeblendet (im Konfig-Popover wählbar).
const SET_B_HIDDEN: Record<string, boolean> = {
  company: false, email: false, linkedinUrl: false, salutation: false, jobTitle: false, seniority: false,
  department: false, language: false, twitterHandle: false, leadStatus: false, heatStatus: false,
  emailVerifiedStatus: false, lastReplyAt: false, tags: false, ownerName: false, phonePrimary: false, createdAt: false,
};

/** Filter-Auswahl → K-2-FilterDefinition (contacts-Felder). Kein Filter → null. */
function buildFilterDef(status: string | null, source: string[], icp: string[], noContactWay: boolean): FilterDefinition | null {
  const rules: FilterNode[] = [];
  if (status) rules.push({ field: "contact_status", operator: "eq", value: status });
  if (source.length) rules.push({ field: "lead_source", operator: "in", value: source });
  if (icp.length) {
    const bands: FilterNode[] = [];
    if (icp.includes("high")) bands.push({ field: "icp_score", operator: "gt", value: 75 });
    if (icp.includes("mid")) bands.push({ logic: "AND", rules: [
      { field: "icp_score", operator: "gte", value: 50 },
      { field: "icp_score", operator: "lte", value: 74 },
    ] });
    if (icp.includes("low")) bands.push({ field: "icp_score", operator: "lt", value: 50 });
    rules.push(bands.length === 1 ? bands[0] : { logic: "OR", rules: bands });
  }
  if (noContactWay) rules.push({ logic: "AND", rules: [
    { field: "email", operator: "is_empty" },
    { field: "linkedin_url", operator: "is_empty" },
  ] });
  if (!rules.length) return null;
  return { entity: "contacts", where: rules.length === 1 ? rules[0] : { logic: "AND", rules } };
}

/** Kombiniertes „Filter"-Dropdown (Quelle + ICP) — aktive Gesamtzahl im Trigger. */
function CombinedFilter({
  source, onSource, icp, onIcp,
}: { source: string[]; onSource: (v: string[]) => void; icp: string[]; onIcp: (v: string[]) => void }) {
  const { t } = useTranslation();
  const count = source.length + icp.length;
  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const Row = ({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) => (
    <label className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] text-[13px] text-text-body hover:bg-app-bg cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onToggle} className="accent-[var(--sherloq-primary)] w-3.5 h-3.5" />
      {label}
    </label>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
            count > 0 ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]" : "border-border text-text-body bg-app-surface hover:bg-app-bg")}>
          <Filter className="w-3.5 h-3.5" /> {t("kontakte.filter")}
          {count > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-[6px] bg-[var(--sherloq-primary)] text-on-accent text-[10px] font-bold flex items-center justify-center tabular-nums">{count}</span>}
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" portal={false} className="w-56 p-1.5">
        <div className="typo-section-label text-text-muted px-2 pt-1 pb-1">{t("kontakte.filterSource")}</div>
        {SOURCE_IDS.map((id) => <Row key={id} checked={source.includes(id)} label={t(`kontakte.source.${id}`)} onToggle={() => toggle(source, onSource, id)} />)}
        <div className="my-1 border-t border-[var(--border-card)]" />
        <div className="typo-section-label text-text-muted px-2 pt-1 pb-1">{t("kontakte.filterIcp")}</div>
        {ICP_IDS.map((id) => <Row key={id} checked={icp.includes(id)} label={t(`kontakte.icpBand.${id}`)} onToggle={() => toggle(icp, onIcp, id)} />)}
      </PopoverContent>
    </Popover>
  );
}

// Zell-Helfer (Honesty: leer → nichts). Reine Funktionen, keine Komponenten (lint-konform).
const textCell = (v?: string | null) => (v ? <span className="typo-field-value text-text-body truncate block">{v}</span> : null);
const dateCell = (iso: string | null) => (iso ? <span className="typo-field-value text-text-body">{new Date(iso).toLocaleDateString("de-DE")}</span> : null);

export default function ScreenKontakte() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const nowMs = useNowMs();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auswahl (controlled — für Bulk/Listen), Filter, Listen, Panels
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [icpFilter, setIcpFilter] = useState<string[]>([]);
  const [noContactWay, setNoContactWay] = useState(false);
  const [anlegenOpen, setAnlegenOpen] = useState(false);
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);
  const [selectedList, setSelectedList] = useState<ListView | null>(null);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [neueListeOpen, setNeueListeOpen] = useState(false);
  const [zuListeOpen, setZuListeOpen] = useState(false);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ListView | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── Daten ─────────────────────────────────────────────────────────────────────
  const contactsQuery = useQuery({
    queryKey: ["kontakte", organizationId],
    queryFn: () => getContacts(organizationId, { limit: 1000 }),
    staleTime: 30_000,
  });
  const listsQuery = useQuery({ queryKey: ["lists", organizationId], queryFn: () => getLists(organizationId), staleTime: 30_000 });
  const listMembersQuery = useQuery({
    queryKey: ["listMembers", organizationId, selectedList?.id],
    queryFn: () => getListMembers(organizationId, selectedList as ListView),
    enabled: !!selectedList, staleTime: 30_000,
  });

  // ── L-3e Deeplink: Sprung aus gefeuerter Lifecycle-Regel (?firedBy=<ruleId>) ────────
  const [searchParams, setSearchParams] = useSearchParams();
  const firedBy = searchParams.get("firedBy");
  const ruleMatchQuery = useQuery({
    queryKey: ["ruleMatch", organizationId, firedBy],
    queryFn: () => getRuleMatchTargets(firedBy as string, organizationId),
    enabled: !!firedBy, staleTime: 30_000,
  });
  const ruleMatch = ruleMatchQuery.data ?? null;
  // Filter greift NUR bei existierender Regel MIT Kontakt-Treffern; sonst volle Liste + Banner-Hinweis.
  const firedIds = useMemo(() => {
    if (!firedBy || !ruleMatch || !ruleMatch.exists || ruleMatch.targetEntity !== "contact" || ruleMatch.ids.length === 0) return null;
    return new Set(ruleMatch.ids);
  }, [firedBy, ruleMatch]);
  const clearFiredBy = () => { const next = new URLSearchParams(searchParams); next.delete("firedBy"); setSearchParams(next, { replace: true }); };

  const raw: ContactRow[] = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);
  const rows: KontakteRow[] = useMemo(() => {
    if (firedIds) return raw.filter((r) => firedIds.has(r.id)).map(contactToKontakteRow); // Deeplink dominiert
    if (selectedList) return (listMembersQuery.data ?? []).map(contactToKontakteRow);
    const def = buildFilterDef(statusFilter, sourceFilter, icpFilter, noContactWay);
    const filtered = def ? raw.filter((r) => evaluateFilter(def, r as unknown as Record<string, unknown>)) : raw;
    return filtered.map(contactToKontakteRow);
  }, [raw, firedIds, selectedList, listMembersQuery.data, statusFilter, sourceFilter, icpFilter, noContactWay]);

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let noWay = 0;
    for (const c of raw) {
      const s = c.contact_status ?? "";
      if (s) byStatus[s] = (byStatus[s] ?? 0) + 1;
      if (!c.email && !c.linkedin_url) noWay += 1;
    }
    return { byStatus, total: raw.length, noWay, optOut: byStatus["opt_out"] ?? 0 };
  }, [raw]);

  // Filter-/Listenwechsel → Bulk-Auswahl zurücksetzen (nie still über den Filter hinaus wirken).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRowSelection({}); }, [statusFilter, sourceFilter, icpFilter, noContactWay, selectedList]);

  // ── Spalten (6 default + Set B) ────────────────────────────────────────────────
  const col = createColumnHelper<KontakteRow>();
  const columns = useMemo(() => [
    col.accessor("name", {
      header: t("kontakte.col.name"), size: 260, minSize: 180,
      cell: (c) => {
        const r = c.row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={r.name} src={r.avatarUrl} size={36} />
            <div className="flex flex-col min-w-0">
              <span className="typo-card-title text-text-primary truncate">{r.name}</span>
              <span className="typo-subline text-text-muted truncate">{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        );
      },
    }),
    col.accessor("leadSource", { header: t("kontakte.col.leadSource"), size: 130, minSize: 100, enableSorting: false, cell: (c) => <LeadSourceBadge source={c.getValue()} /> }),
    col.accessor("contactStatus", { header: t("kontakte.col.contactStatus"), size: 130, minSize: 100, cell: (c) => {
      const v = c.getValue(); return v && STATUS_TONE[v] ? <StatusBadge label={t(`kontakte.status.${v}`)} tone={STATUS_TONE[v]} /> : null;
    } }),
    col.accessor("lastContactedAt", { header: t("kontakte.col.lastContactedAt"), size: 120, minSize: 100, cell: (c) => {
      const d = daysSinceIso(c.getValue(), nowMs); return d != null && d >= 1 ? <span className="typo-field-value text-text-primary">{t("kontakte.daysAgo", { count: d })}</span> : null;
    } }),
    col.accessor("icpScore", { header: t("kontakte.col.icpScore"), size: 110, minSize: 90, cell: (c) => (c.getValue() != null ? <ICPDonut score={c.getValue() as number} /> : null) }),
    col.accessor("routing", { header: t("kontakte.col.routing"), size: 140, minSize: 110, enableSorting: false, cell: (c) => <RoutingChip routing={c.getValue()} onNavigate={(p) => navigate(p)} /> }),
    // ── Set B (default aus) ──
    col.accessor("company", { header: t("kontakte.col.company"), size: 160, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("email", { header: t("kontakte.col.email"), size: 200, minSize: 120, cell: (c) => textCell(c.getValue()) }),
    col.accessor("linkedinUrl", { header: t("kontakte.col.linkedinUrl"), size: 120, minSize: 90, enableSorting: false, cell: (c) => {
      const v = c.getValue(); return v ? <a href={v} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--sherloq-primary)] hover:opacity-80 inline-flex"><LinkedinIcon className="w-4 h-4" /></a> : null;
    } }),
    col.accessor("salutation", { header: t("kontakte.col.salutation"), size: 100, minSize: 80, cell: (c) => textCell(c.getValue()) }),
    col.accessor("jobTitle", { header: t("kontakte.col.jobTitle"), size: 160, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("seniority", { header: t("kontakte.col.seniority"), size: 120, minSize: 90, cell: (c) => textCell(c.getValue()) }),
    col.accessor("department", { header: t("kontakte.col.department"), size: 140, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("language", { header: t("kontakte.col.language"), size: 100, minSize: 80, cell: (c) => textCell(c.getValue()) }),
    col.accessor("twitterHandle", { header: t("kontakte.col.twitterHandle"), size: 130, minSize: 90, cell: (c) => textCell(c.getValue()) }),
    col.accessor("leadStatus", { header: t("kontakte.col.leadStatus"), size: 140, minSize: 100, cell: (c) => {
      const v = c.getValue(); return v ? <StatusBadge label={t(`kontakte.leadStatusValue.${v}`, { defaultValue: v })} tone="muted" /> : null;
    } }),
    col.accessor("heatStatus", { header: t("kontakte.col.heatStatus"), size: 120, minSize: 90, cell: (c) => (c.getValue() ? <HeatBadge status={c.getValue()!} /> : null) }),
    col.accessor("emailVerifiedStatus", { header: t("kontakte.col.emailVerifiedStatus"), size: 140, minSize: 100, cell: (c) => {
      const v = c.getValue(); if (!v) return null;
      const tone = v === "valid" ? "success" : v === "invalid" ? "urgent" : "muted";
      return <StatusBadge label={t(`kontakte.emailVerify.${v}`, { defaultValue: v })} tone={tone} />;
    } }),
    col.accessor("lastReplyAt", { header: t("kontakte.col.lastReplyAt"), size: 120, minSize: 100, cell: (c) => {
      const d = daysSinceIso(c.getValue(), nowMs); return d != null && d >= 1 ? <span className="typo-field-value text-text-body">{t("kontakte.daysAgo", { count: d })}</span> : null;
    } }),
    col.accessor("tags", { header: t("kontakte.col.tags"), size: 160, minSize: 100, enableSorting: false, cell: (c) => {
      const tags = c.getValue(); if (!tags?.length) return null;
      return <div className="flex items-center gap-1 min-w-0">{tags.slice(0, 2).map((tag) => <span key={tag} className="px-1.5 py-0.5 rounded-[6px] bg-app-bg text-text-muted text-[11px] truncate">{tag}</span>)}{tags.length > 2 && <span className="text-[11px] text-text-muted">+{tags.length - 2}</span>}</div>;
    } }),
    col.accessor("ownerName", { header: t("kontakte.col.ownerName"), size: 150, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("phonePrimary", { header: t("kontakte.col.phonePrimary"), size: 140, minSize: 100, cell: (c) => textCell(c.getValue()) }),
    col.accessor("createdAt", { header: t("kontakte.col.createdAt"), size: 120, minSize: 100, cell: (c) => dateCell(c.getValue()) }),
  ], [col, t, nowMs, navigate]);

  const { table, resetColumns, search, setSearch } = useDataTable<KontakteRow>({
    data: rows, columns, getRowId: (r) => r.id, persistKey: PREF_KEY, userId, organizationId,
    rowSelection, onRowSelectionChange: setRowSelection, initialColumnVisibility: SET_B_HIDDEN,
    searchAccessor: (r) => buildSearchText([r.name, r.email, r.jobTitle, r.company, r.phoneSearch]),
  });

  // ── Derived ────────────────────────────────────────────────────────────────────
  const total = rows.length;
  // Such+Filter-gefilterte Menge (für Bulk „alle auswählen" — nie unsichtbare Zeilen mitnehmen).
  const filteredRows = table.getFilteredRowModel().rows;
  const filteredCount = filteredRows.length;
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;
  const pageRowCount = table.getRowModel().rows.length;
  const pageAllSelected = table.getIsAllPageRowsSelected();
  const hasFilter = !!statusFilter || sourceFilter.length > 0 || icpFilter.length > 0 || noContactWay;
  const currentFilterDef = buildFilterDef(statusFilter, sourceFilter, icpFilter, noContactWay);
  const lists = listsQuery.data ?? [];
  const listActive = !!selectedList;

  // ── Handler ─────────────────────────────────────────────────────────────────────
  const clearSelection = () => setRowSelection({});
  const clearFilters = () => { setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay(false); };
  const pickStatus = (id: string | null) => { setNoContactWay(false); setStatusFilter(id); };
  const bulkAction = (label: string) => { toast(t("kontakte.bulk.actionToast", { label, count: selectedCount }), "info"); clearSelection(); };
  const deleteContactsMutation = useMutation({
    mutationFn: (ids: string[]) => softDeleteContacts(organizationId, ids, userId),
    onSuccess: (_d, ids) => {
      void queryClient.invalidateQueries({ queryKey: ["kontakte", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["listMembers", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] });
      toast(t("kontakte.delete.doneToast", { count: ids.length }), "success");
      clearSelection();
    },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const invalidateLists = () => { void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] }); };
  const openList = (l: ListView) => {
    setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay(false);
    setRowSelection({}); setSelectedList(l); setListMenuOpen(false);
  };
  const closeList = () => setSelectedList(null);
  const startRename = (l: ListView) => { setRenamingListId(l.id); setRenameValue(l.name); };
  const saveRename = async (l: ListView) => {
    const name = renameValue.trim(); setRenamingListId(null);
    if (!name || name === l.name) return;
    try {
      await renameList(organizationId, l.id, name);
      if (selectedList?.id === l.id) setSelectedList({ ...selectedList, name });
      invalidateLists(); toast(t("kontakte.lists.renamedToast", { name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };
  const confirmDelete = async () => {
    const l = deleteTarget; setDeleteTarget(null);
    if (!l) return;
    try {
      await deleteList(organizationId, l.id);
      if (selectedList?.id === l.id) closeList();
      invalidateLists(); toast(t("kontakte.lists.deletedToast", { name: l.name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };
  const removeFromCurrentList = async (ids: string[]) => {
    if (!selectedList || selectedList.type !== "static" || !ids.length) return;
    try {
      await removeFromList(organizationId, selectedList.id, ids);
      void queryClient.invalidateQueries({ queryKey: ["listMembers", organizationId, selectedList.id] });
      invalidateLists(); clearSelection();
      toast(t("kontakte.lists.removedToast", { count: ids.length, name: selectedList.name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };

  const lagebild = [
    { key: "no_way", label: t("kontakte.lagebild.noContactWay"), count: counts.noWay, icon: MailX, active: noContactWay,
      apply: () => { setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay((v) => !v); } },
    { key: "opt_out", label: t("kontakte.lagebild.optOuts"), count: counts.optOut, icon: Ban, active: statusFilter === "opt_out",
      apply: () => { setNoContactWay(false); setSourceFilter([]); setIcpFilter([]); setStatusFilter(statusFilter === "opt_out" ? null : "opt_out"); } },
  ].filter((c) => c.count > 0);

  // Render-Funktion (keine Komponente im Render → lint-konform).
  const renderStatusPill = (id: string | null, label: string, count: number) => {
    const active = id === null ? !statusFilter && !noContactWay : statusFilter === id;
    return (
      <button key={id ?? "all"} type="button" onClick={() => pickStatus(id)}
        className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
          active ? "bg-[var(--sherloq-primary)] text-on-accent border-transparent" : "bg-app-surface text-text-body border-border hover:bg-app-bg")}>
        {label}
        <span className={cn("tabular-nums text-[11px]", active ? "text-on-accent/80" : "text-text-muted")}>{count.toLocaleString("de-DE")}</span>
      </button>
    );
  };

  const searchActive = search.trim().length > 0;
  const emptyState = (
    <EmptyState icon={<Users className="w-6 h-6" />}
      title={searchActive || hasFilter ? t("kontakte.noHits") : listActive ? t("kontakte.lists.emptyTitle") : t("kontakte.emptyTitle")}
      description={searchActive || hasFilter ? t("kontakte.noHitsDesc") : listActive ? t("kontakte.lists.emptyDesc") : t("kontakte.emptyDesc")} />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Kopf */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold text-text-primary">{t("kontakte.title")}</h1>
          {total > 0 && <span className="px-2 py-0.5 rounded-[7px] bg-app-bg text-text-muted text-[13px] font-semibold tabular-nums">{total.toLocaleString("de-DE")}</span>}
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover table={table} columnLabelFor={(id) => t(`kontakte.col.${id}`)} onReset={resetColumns} pinnedId="name" />
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-app-surface border border-border-strong text-text-body text-[13px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> {t("kontakte.actions")} <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/app/kontakte/import")} className="gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4" /> {t("kontakte.importCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/kontakte/duplicates")} className="gap-2 cursor-pointer">
                <GitMerge className="w-4 h-4" /> {t("kontakte.manageDuplicates")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => setAnlegenOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> {t("kontakte.addContact")}
          </button>
        </div>
      </div>

      {/* L-3e Deeplink-Banner — Sprung aus gefeuerter Lifecycle-Regel */}
      {firedBy && (
        <RuleMatchBanner loading={ruleMatchQuery.isLoading} error={ruleMatchQuery.isError}
          state={ruleMatch} entityLabelPlural={t("kontakte.title")} onClear={clearFiredBy} />
      )}

      {/* Lagebild — nur ohne aktive Liste / ohne aktiven Deeplink-Filter */}
      {!listActive && !firedIds && lagebild.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {lagebild.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} type="button" onClick={c.apply}
                className={cn("inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-[10px] border text-[12px] transition-colors cursor-pointer",
                  c.active ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border bg-app-surface text-text-body hover:bg-app-bg")}>
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span className="font-bold tabular-nums">{c.count.toLocaleString("de-DE")}</span>
                <span className="text-text-muted">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Deeplink-Filter aktiv → schlanke Toolbar (nur Suche innerhalb der Treffer) */}
      {firedIds ? (
        <div className="flex items-center mb-4">
          <div className="ml-auto"><TableSearch value={search} onChange={setSearch} placeholder={t("table.search")} /></div>
        </div>
      ) : (
      /* Listen-Dropdown + (aktive Liste ODER Status-Pills/Filter) */
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Popover open={listMenuOpen} onOpenChange={setListMenuOpen}>
          <PopoverTrigger asChild>
            <button type="button"
              className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
                listActive ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]" : "border-border text-text-body bg-app-surface hover:bg-app-bg")}>
              <List className="w-3.5 h-3.5" /> {t("kontakte.lists.menuTitle")} <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" portal={false} className="w-64 p-2">
            {lists.length === 0 ? (
              <p className="px-2 py-3 text-center text-[12px] text-text-muted">{t("kontakte.lists.none")}</p>
            ) : lists.map((l) => (
              <div key={l.id} className="group/li flex items-center gap-1 px-2 py-1.5 rounded-[8px] hover:bg-app-bg">
                {renamingListId === l.id ? (
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void saveRename(l); if (e.key === "Escape") setRenamingListId(null); }}
                    onBlur={() => void saveRename(l)}
                    className="flex-1 min-w-0 text-[13px] px-2 py-1 bg-app-surface border border-[var(--sherloq-primary)] rounded-[6px] outline-none" />
                ) : (
                  <>
                    <button type="button" onClick={() => openList(l)} className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer">
                      {l.type === "dynamic" ? <Filter className="w-3.5 h-3.5 text-[var(--sherloq-primary)] shrink-0" /> : <List className="w-3.5 h-3.5 text-text-muted shrink-0" />}
                      <span className="flex-1 min-w-0 truncate text-[13px] text-text-body">{l.name}</span>
                      <span className="text-[11px] text-text-muted tabular-nums">{l.memberCount.toLocaleString("de-DE")}</span>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/li:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                      <button type="button" onClick={() => startRename(l)} aria-label={t("kontakte.lists.rename")} data-tip={t("kontakte.lists.rename")} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface cursor-pointer"><Pencil className="w-3 h-3" /></button>
                      <button type="button" onClick={() => { setDeleteTarget(l); setListMenuOpen(false); }} aria-label={t("kontakte.lists.delete")} data-tip={t("kontakte.lists.delete")} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-surface cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="mt-1 pt-1 border-t border-[var(--border-card)]">
              <button type="button" onClick={() => { setListMenuOpen(false); setNeueListeOpen(true); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-[8px] text-[13px] font-semibold text-[var(--sherloq-primary)] hover:bg-app-bg cursor-pointer">
                <Plus className="w-4 h-4" /> {t("kontakte.lists.newList")}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <span className="w-px h-5 bg-border mx-1" />

        {listActive && selectedList ? (
          <div className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] text-[12px] font-semibold">
            {selectedList.type === "dynamic" ? <Filter className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[220px]">{selectedList.name}</span>
            <span className="text-[11px] opacity-70">· {t(`kontakte.lists.${selectedList.type}`)} · {total.toLocaleString("de-DE")}</span>
            <button type="button" onClick={closeList} aria-label={t("kontakte.lists.closeList")} data-tip={t("kontakte.lists.closeList")} className="w-5 h-5 rounded-full hover:bg-app-surface/40 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            {renderStatusPill(null, t("kontakte.status.all"), counts.total)}
            {STATUS_ORDER.filter((s) => (counts.byStatus[s] ?? 0) > 0).map((s) => renderStatusPill(s, t(`kontakte.status.${s}`), counts.byStatus[s]))}
            <span className="w-px h-5 bg-border mx-1" />
            <CombinedFilter source={sourceFilter} onSource={setSourceFilter} icp={icpFilter} onIcp={setIcpFilter} />
            {hasFilter && (
              <button type="button" onClick={clearFilters} className="text-[12px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer px-2">{t("kontakte.resetFilters")}</button>
            )}
          </>
        )}
        <div className="ml-auto"><TableSearch value={search} onChange={setSearch} placeholder={t("table.search")} /></div>
      </div>
      )}

      {/* Bulk-Bar (Gmail-Muster) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-[10px] bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/20">
          <div className="flex items-center gap-3 text-[13px] text-text-body">
            <span className="font-bold">{t("kontakte.bulk.selected", { count: selectedCount })}</span>
            {pageAllSelected && selectedCount < filteredCount && (
              <button onClick={() => setRowSelection(Object.fromEntries(filteredRows.map((r) => [r.id, true])))} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">
                {hasFilter || searchActive ? t("kontakte.bulk.selectAllFilter", { count: filteredCount }) : t("kontakte.bulk.selectAllAll", { count: filteredCount })}
              </button>
            )}
            {selectedCount === filteredCount && filteredCount > pageRowCount && <button onClick={clearSelection} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">{t("kontakte.bulk.clear")}</button>}
          </div>
          <div className="flex items-center gap-2">
            {listActive && selectedList?.type === "static" && (
              <button onClick={() => removeFromCurrentList(selectedIds)} className="sherloq-btn-secondary inline-flex items-center gap-1.5 text-[var(--signal-urgent-text)] border-[var(--signal-urgent-text)]/30 hover:bg-[var(--signal-urgent-bg)]"><UserMinus className="w-3.5 h-3.5" /> {t("kontakte.lists.removeFromList")}</button>
            )}
            <button onClick={() => setZuListeOpen(true)} className="sherloq-btn-secondary inline-flex items-center gap-1.5"><ListPlus className="w-3.5 h-3.5" /> {t("kontakte.bulk.toList")}</button>
            <button onClick={() => bulkAction(t("kontakte.bulk.tagFull"))} className="sherloq-btn-secondary">{t("kontakte.bulk.tag")}</button>
            <button onClick={() => bulkAction(t("kontakte.bulk.archiveFull"))} className="sherloq-btn-secondary">{t("kontakte.bulk.archive")}</button>
            <button onClick={() => setBulkDeleteOpen(true)} className="sherloq-btn-secondary inline-flex items-center gap-1.5 text-[var(--signal-urgent-text)] border-[var(--signal-urgent-text)]/30 hover:bg-[var(--signal-urgent-bg)]"><Trash2 className="w-3.5 h-3.5" /> {t("kontakte.bulk.delete")}</button>
            <button onClick={clearSelection} aria-label={t("kontakte.bulk.clear")} data-tip={t("kontakte.bulk.clear")} className="w-8 h-8 rounded-full hover:bg-app-surface flex items-center justify-center text-text-muted cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Tabelle (geteilte Komponente) */}
      <DataTableCard
        table={table}
        isLoading={listActive ? listMembersQuery.isLoading : contactsQuery.isLoading}
        isError={listActive ? listMembersQuery.isError : contactsQuery.isError}
        onReload={() => (listActive ? listMembersQuery.refetch() : contactsQuery.refetch())}
        emptyState={emptyState}
        entityLabel={t("kontakte.entity")}
        onRowOpen={(r) => setDetailPerson({ id: r.id, name: r.name, jobTitle: r.jobTitle, company: r.company, initials: r.initials, avatarUrl: r.avatarUrl })}
        onRowPrefetch={(r) => prefetchContactPanel(queryClient, organizationId, r.id)}
        rowActions={(r) => (listActive && selectedList?.type === "static") ? (
          <button type="button" aria-label={t("kontakte.lists.removeFromList")} data-tip={t("kontakte.lists.removeFromList")}
            onClick={() => removeFromCurrentList([r.id])}
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] cursor-pointer opacity-0 group-hover/row:opacity-100 transition-opacity">
            <UserMinus className="w-4 h-4" />
          </button>
        ) : null}
      />

      {/* Anlegen + Detail-Panel */}
      <KontaktAnlegenPanel open={anlegenOpen} organizationId={organizationId} createdBy={userId}
        onClose={() => setAnlegenOpen(false)}
        onCreated={() => { setAnlegenOpen(false); void queryClient.invalidateQueries({ queryKey: ["kontakte", organizationId] }); }} />
      {/* Haupt-Kontakte-Tabelle: Pfeil öffnet direkt die Vollansicht (konsistent zu Companies).
          Direkt geöffnet → ← und ✕ führen beide zur Liste zurück (kein Panel-Umweg). Gilt NUR hier;
          Company-Kontakte-Tab/Hunter/Farmer öffnen weiterhin das Schnellpanel. */}
      {detailPerson && <HunterSidepanel person={detailPerson} variant="full" onClose={() => setDetailPerson(null)} onExit={() => setDetailPerson(null)} />}

      {/* Listen: Erstellen + „Zu Liste" (Bulk) */}
      <NeueListeDialog open={neueListeOpen} organizationId={organizationId} createdBy={userId} currentFilterDef={currentFilterDef}
        onClose={() => setNeueListeOpen(false)}
        onCreated={() => { void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] }); }} />
      <ZuListeDialog open={zuListeOpen} organizationId={organizationId} contactIds={selectedIds} createdBy={userId}
        onClose={() => setZuListeOpen(false)}
        onDone={({ list, count }) => {
          toast(t("kontakte.lists.addedToast", { count, name: list.name }), "success", { label: t("kontakte.lists.viewList"), onClick: () => openList(list) });
          clearSelection();
          void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] });
          void queryClient.invalidateQueries({ queryKey: ["listMembers", organizationId] });
        }} />

      {/* Liste löschen — Bestätigung */}
      {/* Bulk-Löschen (Soft-Delete) — roter Bestätigungs-Dialog mit Anzahl */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kontakte.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("kontakte.delete.confirm", { count: selectedCount })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteContactsMutation.mutate(selectedIds); setBulkDeleteOpen(false); }} className="bg-[var(--signal-urgent-text)] hover:opacity-90">{t("kontakte.bulk.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kontakte.lists.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("kontakte.lists.deleteConfirm", { name: deleteTarget?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[var(--signal-urgent-text)] hover:opacity-90">{t("kontakte.lists.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
