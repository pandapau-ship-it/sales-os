/**
 * ScreenKontakte — Kontakte-Liste (K-3). Daten-TABELLE (TanStack Table), bewusst KEIN
 * HunterCard-Profil (Spalten selbst gerendert ist hier korrekt).
 *
 * CP2: echte Daten, Sortierung, Virtualisierung, Pagination, Zustände.
 * CP3: Filter über die K-2-Sprache (Status-Pills mit echten Counts + kombiniertes „Filter"-Dropdown
 *   für Quelle/ICP → FilterDefinition → evaluateFilter, client-seitig auf dem geladenen Satz),
 *   Bulk-Auswahl (Gmail-Muster), Spalten: ein-/ausblenden + Reihenfolge per Drag + Breite ziehen +
 *   „Auf Standard"; Persistenz PRO USER (user_preferences → table_views.contacts). Anlegen
 *   (ActionPanel-Muster, K1+K2) + Detail-Panel.
 * Lagebild: klickbare Bestands-Zahlen (nur KONTAKT-bezogen + in dieser Tabelle filterbar), echte
 *   Counts, Kategorie mit 0 verschwindet, alle 0 → Zeile weg (Task-getriebene Leere).
 *
 * Übernahme 4c: Library-Bausteine (StatusBadge/ICPDonut/Avatar/LeadSourceBadge/RoutingChip),
 * Tokens, Meta-Label oben (K-2b). Leere Werte ausblenden (Honesty), nie „—" erfinden.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ChevronLeft, ChevronRight,
  Plus, SlidersHorizontal, Filter, GripVertical, Users, MailX, Ban, X, RotateCcw, List, ListPlus,
  Pencil, Trash2, UserMinus,
} from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useNowMs } from "@/hooks/useNowMs";
import { getContacts, getUserPreference, setUserPreference, getLists, getListMembers, renameList, removeFromList, deleteList, type ListView } from "@/lib/db";
import { contactToKontakteRow, type KontakteRow } from "@/lib/kontakteMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { evaluateFilter, type FilterDefinition, type FilterNode } from "@/lib/filter";
import type { ContactRow } from "@/types/rows";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Avatar, ICPDonut, StatusBadge, LeadSourceBadge, RoutingChip, EmptyState } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import KontaktAnlegenPanel from "@/components/features/kontakte/KontaktAnlegenPanel";
import { HunterSidepanel, ZuListeDialog, NeueListeDialog } from "@/components";
import type { Person } from "@/types";

// Labels durchgängig aus i18n (kontakte.*) — hier nur Tone/Ids, kein sichtbarer Text.
const STATUS_TONE: Record<string, "success" | "warn" | "urgent" | "info" | "teal" | "muted"> = {
  in_campaign: "teal", pipeline: "info", kunde: "success", archiviert: "muted", ohne_campaign: "muted", opt_out: "urgent",
};
// Reihenfolge der Status-Pills (nur mit Count > 0 sichtbar).
const STATUS_ORDER = ["ohne_campaign", "in_campaign", "pipeline", "kunde", "archiviert", "opt_out"];
const SOURCE_IDS = ["sherloq", "csv_upload", "crm_sync", "manual"];
const ICP_IDS = ["high", "mid", "low"];
const PAGE_SIZES = [25, 50, 100];
const PREF_KEY = "table_views.contacts";

type SavedView = {
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnSizing?: ColumnSizingState;
  sorting?: SortingState;
  pageSize?: number;
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
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
            count > 0 ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]" : "border-border text-text-body bg-app-surface hover:bg-app-bg",
          )}>
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

export default function ScreenKontakte() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const nowMs = useNowMs();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [icpFilter, setIcpFilter] = useState<string[]>([]);
  const [noContactWay, setNoContactWay] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [anlegenOpen, setAnlegenOpen] = useState(false);
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  // Listen (K-3b)
  const [selectedList, setSelectedList] = useState<ListView | null>(null);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [neueListeOpen, setNeueListeOpen] = useState(false);
  const [zuListeOpen, setZuListeOpen] = useState(false);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ListView | null>(null);
  const queryClient = useQueryClient();

  // ── Persistenz (pro User) — laden beim Mount, speichern bei Änderung ──────────
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!userId) { prefsLoaded.current = true; return; }
    let alive = true;
    getUserPreference<SavedView>(userId, organizationId, PREF_KEY).then((v) => {
      if (!alive || !v) { prefsLoaded.current = true; return; }
      if (v.columnVisibility) setColumnVisibility(v.columnVisibility);
      if (v.columnOrder) setColumnOrder(v.columnOrder);
      if (v.columnSizing) setColumnSizing(v.columnSizing);
      if (v.sorting) setSorting(v.sorting);
      if (v.pageSize) setPagination((p) => ({ ...p, pageSize: v.pageSize! }));
      prefsLoaded.current = true;
    });
    return () => { alive = false; };
  }, [userId, organizationId]);

  useEffect(() => {
    if (!userId || !prefsLoaded.current) return;
    const t = setTimeout(() => {
      void setUserPreference(userId, organizationId, PREF_KEY, {
        columnVisibility, columnOrder, columnSizing, sorting, pageSize: pagination.pageSize,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [userId, organizationId, columnVisibility, columnOrder, columnSizing, sorting, pagination.pageSize]);

  // ── Daten + Filter (K-2) ─────────────────────────────────────────────────────
  const contactsQuery = useQuery({
    queryKey: ["kontakte", organizationId],
    queryFn: () => getContacts(organizationId, { limit: 1000 }),
    staleTime: 30_000,
  });

  // Listen (K-3b): Liste im Dropdown + Mitglieder der aktiven Liste (statisch Join / dynamisch live).
  const listsQuery = useQuery({
    queryKey: ["lists", organizationId],
    queryFn: () => getLists(organizationId),
    staleTime: 30_000,
  });
  const listMembersQuery = useQuery({
    queryKey: ["listMembers", organizationId, selectedList?.id],
    queryFn: () => getListMembers(organizationId, selectedList as ListView),
    enabled: !!selectedList,
    staleTime: 30_000,
  });

  const raw: ContactRow[] = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);

  const rows: KontakteRow[] = useMemo(() => {
    // Aktive Liste ersetzt die Filteransicht (eigener Blick auf die Liste).
    if (selectedList) return (listMembersQuery.data ?? []).map(contactToKontakteRow);
    const def = buildFilterDef(statusFilter, sourceFilter, icpFilter, noContactWay);
    const filtered = def ? raw.filter((r) => evaluateFilter(def, r as unknown as Record<string, unknown>)) : raw;
    return filtered.map(contactToKontakteRow);
  }, [raw, selectedList, listMembersQuery.data, statusFilter, sourceFilter, icpFilter, noContactWay]);

  // Echte Counts aus dem geladenen Satz (≤1000) — nichts erfunden, kein DB-Extra-Call.
  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let noWay = 0;
    for (const c of raw) {
      const s = c.contact_status ?? "";
      if (s) byStatus[s] = (byStatus[s] ?? 0) + 1;
      const noEmail = !c.email;
      const noLi = !c.linkedin_url;
      if (noEmail && noLi) noWay += 1;
    }
    return { byStatus, total: raw.length, noWay, optOut: byStatus["opt_out"] ?? 0 };
  }, [raw]);

  // Filter-/Seitenwechsel → Bulk-Auswahl zurücksetzen (nie still über den Filter hinaus wirken).
  useEffect(() => { setRowSelection({}); setSelectAllFiltered(false); }, [statusFilter, sourceFilter, icpFilter, noContactWay]);

  const col = createColumnHelper<KontakteRow>();
  const columns = useMemo(
    () => [
      col.accessor("name", {
        header: "name", size: 300, minSize: 200,
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
      col.accessor("leadSource", { header: "leadSource", size: 140, minSize: 100, enableSorting: false, cell: (c) => <LeadSourceBadge source={c.getValue()} /> }),
      col.accessor("contactStatus", {
        header: "contactStatus", size: 140, minSize: 100,
        cell: (c) => {
          const v = c.getValue() as string | undefined;
          return v && STATUS_TONE[v] ? <StatusBadge label={t(`kontakte.status.${v}`)} tone={STATUS_TONE[v]} /> : null;
        },
      }),
      col.accessor("lastContactedAt", {
        header: "lastContactedAt", size: 130, minSize: 100,
        cell: (c) => {
          const d = daysSinceIso(c.getValue(), nowMs);
          if (d == null || d < 1) return null;
          return <span className="typo-field-value text-text-primary">{t("kontakte.daysAgo", { count: d })}</span>;
        },
      }),
      col.accessor("icpScore", { header: "icpScore", size: 120, minSize: 90, cell: (c) => (c.getValue() != null ? <ICPDonut score={c.getValue() as number} /> : null) }),
      col.accessor("routing", { header: "routing", size: 150, minSize: 110, enableSorting: false, cell: (c) => <RoutingChip routing={c.getValue()} onNavigate={(p) => navigate(p)} /> }),
    ],
    [col, nowMs, navigate, t],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, columnVisibility, columnOrder, columnSizing, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => r.id,
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { minSize: 80 },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({ count: pageRows.length, getScrollElement: () => scrollRef.current, estimateSize: () => 68, overscan: 8 });
  const headers = table.getHeaderGroups()[0].headers;
  const rowWidth = 36 + table.getVisibleLeafColumns().reduce((s, c) => s + c.getSize(), 0) + 44 + 16 * (table.getVisibleLeafColumns().length + 1);

  const total = rows.length;
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const selectedCount = selectAllFiltered ? total : Object.keys(rowSelection).length;
  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => rowSelection[r.id]);
  const hasFilter = !!statusFilter || sourceFilter.length > 0 || icpFilter.length > 0 || noContactWay;
  // Für „Neue dynamische Liste": aktueller Filter als K-2-Definition (null → Dynamisch nicht wählbar).
  const currentFilterDef = buildFilterDef(statusFilter, sourceFilter, icpFilter, noContactWay);
  // Konkrete IDs der Bulk-Auswahl (selectAllFiltered = alle aktuell sichtbaren Zeilen-IDs).
  const selectedIds = selectAllFiltered ? rows.map((r) => r.id) : Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const lists = listsQuery.data ?? [];
  const listActive = !!selectedList;
  const openList = (l: ListView) => {
    setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay(false);
    setRowSelection({}); setSelectAllFiltered(false);
    setSelectedList(l); setListMenuOpen(false);
  };
  const closeList = () => setSelectedList(null);
  const invalidateLists = () => { void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] }); };

  // Liste umbenennen (Inline im Dropdown).
  const startRename = (l: ListView) => { setRenamingListId(l.id); setRenameValue(l.name); };
  const saveRename = async (l: ListView) => {
    const name = renameValue.trim();
    setRenamingListId(null);
    if (!name || name === l.name) return;
    try {
      await renameList(organizationId, l.id, name);
      if (selectedList?.id === l.id) setSelectedList({ ...selectedList, name });
      invalidateLists();
      toast(t("kontakte.lists.renamedToast", { name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };

  // Liste löschen (mit Bestätigung — irreversibel).
  const confirmDelete = async () => {
    const l = deleteTarget;
    setDeleteTarget(null);
    if (!l) return;
    try {
      await deleteList(organizationId, l.id);
      if (selectedList?.id === l.id) closeList();
      invalidateLists();
      toast(t("kontakte.lists.deletedToast", { name: l.name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };

  // Kontakt(e) aus der AKTIVEN statischen Liste entfernen (nur Mitgliedschaft, nie den Kontakt).
  const removeFromCurrentList = async (ids: string[]) => {
    if (!selectedList || selectedList.type !== "static" || !ids.length) return;
    try {
      await removeFromList(organizationId, selectedList.id, ids);
      void queryClient.invalidateQueries({ queryKey: ["listMembers", organizationId, selectedList.id] });
      invalidateLists();
      clearSelection();
      toast(t("kontakte.lists.removedToast", { count: ids.length, name: selectedList.name }), "success");
    } catch { toast(t("kontakte.lists.actionErrorToast"), "error"); }
  };

  // Lagebild-Kategorien (nur KONTAKT-bezogen + in dieser Tabelle filterbar). 0 → weg.
  const lagebild = [
    { key: "no_way", label: t("kontakte.lagebild.noContactWay"), count: counts.noWay, icon: MailX, active: noContactWay,
      apply: () => { setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay((v) => !v); } },
    { key: "opt_out", label: t("kontakte.lagebild.optOuts"), count: counts.optOut, icon: Ban, active: statusFilter === "opt_out",
      apply: () => { setNoContactWay(false); setSourceFilter([]); setIcpFilter([]); setStatusFilter(statusFilter === "opt_out" ? null : "opt_out"); } },
  ].filter((c) => c.count > 0);

  const resetColumns = () => { setColumnVisibility({}); setColumnOrder([]); setColumnSizing({}); };
  const clearFilters = () => { setStatusFilter(null); setSourceFilter([]); setIcpFilter([]); setNoContactWay(false); };
  const clearSelection = () => { setRowSelection({}); setSelectAllFiltered(false); };
  const bulkAction = (label: string) => { toast(t("kontakte.bulk.actionToast", { label, count: selectedCount }), "info"); clearSelection(); };

  // Status-Pill wählen (single) — hebt „Ohne Kontaktweg" auf.
  const pickStatus = (id: string | null) => { setNoContactWay(false); setStatusFilter(id); };

  // Drag-Reorder der Spalten (nur Datenspalten; Checkbox + Öffnen-Pfeil bleiben fix).
  const onColDrop = (targetId: string) => {
    if (!draggedCol || draggedCol === targetId) { setDraggedCol(null); return; }
    const order = (columnOrder.length ? [...columnOrder] : table.getAllLeafColumns().map((c) => c.id));
    const from2 = order.indexOf(draggedCol);
    const to2 = order.indexOf(targetId);
    if (from2 < 0 || to2 < 0) { setDraggedCol(null); return; }
    order.splice(to2, 0, order.splice(from2, 1)[0]);
    setColumnOrder(order);
    setDraggedCol(null);
  };

  const StatusPill = ({ id, label, count }: { id: string | null; label: string; count: number }) => {
    const active = id === null ? !statusFilter && !noContactWay : statusFilter === id;
    return (
      <button type="button" onClick={() => pickStatus(id)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
          active ? "bg-[var(--sherloq-primary)] text-on-accent border-transparent" : "bg-app-surface text-text-body border-border hover:bg-app-bg",
        )}>
        {label}
        <span className={cn("tabular-nums text-[11px]", active ? "text-on-accent/80" : "text-text-muted")}>{count.toLocaleString("de-DE")}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Kopf */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold text-text-primary">{t("kontakte.title")}</h1>
          {total > 0 && <span className="px-2 py-0.5 rounded-[7px] bg-app-bg text-text-muted text-[13px] font-semibold tabular-nums">{total.toLocaleString("de-DE")}</span>}
        </div>
        <div className="flex items-center gap-2 relative">
          <button type="button" aria-label={t("kontakte.columnsAdjust")} data-tip={t("kontakte.columnsAdjust")} onClick={() => setConfigOpen((o) => !o)}
            className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {configOpen && (
            <div className="absolute right-0 top-11 z-20 w-64 bg-app-surface rounded-[12px] border border-[var(--border-card)] shadow-[var(--shadow-dropdown)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="typo-section-label text-text-muted">{t("kontakte.columns")}</span>
                <button onClick={resetColumns} data-tip={t("kontakte.resetDefaultTip")} className="text-text-muted hover:text-text-primary flex items-center gap-1 text-[11px] cursor-pointer"><RotateCcw className="w-3 h-3" /> {t("kontakte.resetDefault")}</button>
              </div>
              {table.getAllLeafColumns().map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1.5 text-[13px] text-text-body cursor-pointer">
                  <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} disabled={c.id === "name"} className="accent-[var(--sherloq-primary)]" />
                  {t(`kontakte.col.${c.id}`)}
                </label>
              ))}
              <p className="mt-2 pt-2 border-t border-[var(--border-card)] text-[11px] text-text-muted leading-snug">{t("kontakte.columnsHint")}</p>
            </div>
          )}
          <button type="button" onClick={() => setAnlegenOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> {t("kontakte.addContact")}
          </button>
        </div>
      </div>

      {/* Lagebild — nur ohne aktive Liste. Klickbare Bestands-Zahlen (nur echt). Alle 0 → weg. */}
      {!listActive && lagebild.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {lagebild.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} type="button" onClick={c.apply}
                className={cn(
                  "inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-[10px] border text-[12px] transition-colors cursor-pointer",
                  c.active ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border bg-app-surface text-text-body hover:bg-app-bg",
                )}>
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span className="font-bold tabular-nums">{c.count.toLocaleString("de-DE")}</span>
                <span className="text-text-muted">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Listen-Dropdown + (aktive Liste ODER Status-Pills/Filter) */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative">
          <button type="button" onClick={() => setListMenuOpen((o) => !o)}
            className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
              listActive ? "border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)]" : "border-border text-text-body bg-app-surface hover:bg-app-bg")}>
            <List className="w-3.5 h-3.5" /> {t("kontakte.lists.menuTitle")} <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
          {listMenuOpen && (
            <div className="absolute left-0 top-10 z-20 w-64 bg-app-surface rounded-[12px] border border-[var(--border-card)] shadow-[var(--shadow-dropdown)] p-2">
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
                        <button type="button" onClick={() => setDeleteTarget(l)} aria-label={t("kontakte.lists.delete")} data-tip={t("kontakte.lists.delete")} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-surface cursor-pointer"><Trash2 className="w-3 h-3" /></button>
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
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-border mx-1" />

        {listActive && selectedList ? (
          <div className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] text-[12px] font-semibold">
            {selectedList.type === "dynamic" ? <Filter className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[220px]">{selectedList.name}</span>
            <span className="text-[11px] opacity-70">· {t(`kontakte.lists.${selectedList.type}`)} · {rows.length.toLocaleString("de-DE")}</span>
            <button type="button" onClick={closeList} aria-label={t("kontakte.lists.closeList")} data-tip={t("kontakte.lists.closeList")} className="w-5 h-5 rounded-full hover:bg-app-surface/40 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <StatusPill id={null} label={t("kontakte.status.all")} count={counts.total} />
            {STATUS_ORDER.filter((s) => (counts.byStatus[s] ?? 0) > 0).map((s) => (
              <StatusPill key={s} id={s} label={t(`kontakte.status.${s}`)} count={counts.byStatus[s]} />
            ))}
            <span className="w-px h-5 bg-border mx-1" />
            <CombinedFilter source={sourceFilter} onSource={setSourceFilter} icp={icpFilter} onIcp={setIcpFilter} />
            {hasFilter && (
              <button type="button" onClick={clearFilters} className="text-[12px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer px-2">{t("kontakte.resetFilters")}</button>
            )}
          </>
        )}
      </div>

      {/* Bulk-Bar (Gmail-Muster) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-[10px] bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/20">
          <div className="flex items-center gap-3 text-[13px] text-text-body">
            <span className="font-bold">{t("kontakte.bulk.selected", { count: selectedCount })}</span>
            {pageAllSelected && !selectAllFiltered && total > pageRows.length && (
              <button onClick={() => setSelectAllFiltered(true)} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">
                {hasFilter ? t("kontakte.bulk.selectAllFilter", { count: total }) : t("kontakte.bulk.selectAllAll", { count: total })}
              </button>
            )}
            {selectAllFiltered && <button onClick={clearSelection} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">{t("kontakte.bulk.clear")}</button>}
          </div>
          <div className="flex items-center gap-2">
            {listActive && selectedList?.type === "static" && (
              <button onClick={() => removeFromCurrentList(selectedIds)} className="sherloq-btn-secondary inline-flex items-center gap-1.5 text-[var(--signal-urgent-text)] border-[var(--signal-urgent-text)]/30 hover:bg-[var(--signal-urgent-bg)]"><UserMinus className="w-3.5 h-3.5" /> {t("kontakte.lists.removeFromList")}</button>
            )}
            <button onClick={() => setZuListeOpen(true)} className="sherloq-btn-secondary inline-flex items-center gap-1.5"><ListPlus className="w-3.5 h-3.5" /> {t("kontakte.bulk.toList")}</button>
            <button onClick={() => bulkAction(t("kontakte.bulk.tagFull"))} className="sherloq-btn-secondary">{t("kontakte.bulk.tag")}</button>
            <button onClick={() => bulkAction(t("kontakte.bulk.archiveFull"))} className="sherloq-btn-secondary">{t("kontakte.bulk.archive")}</button>
            <button onClick={clearSelection} aria-label={t("kontakte.bulk.clear")} data-tip={t("kontakte.bulk.clear")} className="w-8 h-8 rounded-full hover:bg-app-surface flex items-center justify-center text-text-muted cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Tabelle */}
      <div className="flex-1 min-h-0 flex flex-col bg-app-surface rounded-[12px] border border-[var(--border-card)] overflow-hidden">
        {(listActive ? listMembersQuery.isLoading : contactsQuery.isLoading) ? (
          <div className="flex-1 p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 rounded-[8px] bg-app-bg animate-pulse" />)}</div>
        ) : (listActive ? listMembersQuery.isError : contactsQuery.isError) ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<Users className="w-6 h-6" />} title={t("kontakte.loadError")} description={t("kontakte.loadErrorDesc")} action={{ label: t("kontakte.reload"), onClick: () => (listActive ? listMembersQuery.refetch() : contactsQuery.refetch()) }} />
          </div>
        ) : total === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<Users className="w-6 h-6" />}
              title={listActive ? t("kontakte.lists.emptyTitle") : hasFilter ? t("kontakte.noHits") : t("kontakte.emptyTitle")}
              description={listActive ? t("kontakte.lists.emptyDesc") : hasFilter ? t("kontakte.noHitsDesc") : t("kontakte.emptyDesc")} />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
            <div style={{ minWidth: rowWidth }}>
              {/* Header — sticky, horizontal mit den Zeilen synchron */}
              <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-3 border-b border-[var(--border-card)] bg-app-bg">
                <label className="flex items-center cursor-pointer shrink-0 w-9">
                  <input type="checkbox" aria-label={t("kontakte.selectPageAll")} checked={pageAllSelected}
                    onChange={(e) => { const on = e.target.checked; setSelectAllFiltered(false); setRowSelection(on ? Object.fromEntries(pageRows.map((r) => [r.id, true])) : {}); }}
                    className="accent-[var(--sherloq-primary)]" />
                </label>
                {headers.map((h) => (
                  <div key={h.id} style={{ width: h.getSize() }}
                    className="relative shrink-0 group/col"
                    draggable
                    onDragStart={() => setDraggedCol(h.column.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onColDrop(h.column.id)}>
                    <button type="button" disabled={!h.column.getCanSort()} onClick={h.column.getToggleSortingHandler()}
                      className={cn("typo-field-label text-text-body flex items-center gap-1 text-left max-w-full cursor-grab active:cursor-grabbing", h.column.getCanSort() && "hover:text-text-primary")}>
                      <GripVertical className="w-3 h-3 text-text-muted opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0" />
                      <span className="truncate">{t(`kontakte.col.${h.column.id}`)}</span>
                      {h.column.getCanSort() && ({ asc: <ArrowUp className="w-3 h-3 shrink-0" />, desc: <ArrowDown className="w-3 h-3 shrink-0" /> }[h.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3 h-3 opacity-40 shrink-0" />)}
                    </button>
                    {/* Resize-Handle an der rechten Kante */}
                    <div onMouseDown={h.getResizeHandler()} onTouchStart={h.getResizeHandler()} onClick={(e) => e.stopPropagation()}
                      className={cn("absolute -right-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full cursor-col-resize select-none touch-none", h.column.getIsResizing() ? "bg-[var(--sherloq-primary)]" : "bg-transparent group-hover/col:bg-border-strong")} />
                  </div>
                ))}
                <span className="shrink-0 w-8" />
              </div>

              {/* Zeilen — virtualisiert */}
              <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
                {rowVirtualizer.getVirtualItems().map((vi) => {
                  const row = pageRows[vi.index];
                  const selected = selectAllFiltered || !!rowSelection[row.id];
                  return (
                    <div key={row.id}
                      className={cn("group/row flex items-center gap-4 px-5 border-b border-[var(--border-card)] hover:bg-app-bg/60 transition-colors absolute top-0 left-0 w-full", selected && "bg-[var(--signal-teal-bg)]")}
                      style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}>
                      <label className="flex items-center cursor-pointer shrink-0 w-9">
                        <input type="checkbox" aria-label={t("kontakte.selectRow")} checked={selected}
                          onChange={() => { setSelectAllFiltered(false); row.toggleSelected(); }} className="accent-[var(--sherloq-primary)]" />
                      </label>
                      {row.getVisibleCells().map((cell) => (
                        <div key={cell.id} style={{ width: cell.column.getSize() }} className="min-w-0 shrink-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                      {listActive && selectedList?.type === "static" && (
                        <button type="button" aria-label={t("kontakte.lists.removeFromList")} data-tip={t("kontakte.lists.removeFromList")}
                          onClick={() => removeFromCurrentList([row.id])}
                          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] cursor-pointer opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button" aria-label={t("kontakte.openContact")} data-tip={t("kontakte.openContact")}
                        onClick={() => { const r = row.original; setDetailPerson({ id: r.id, name: r.name, jobTitle: r.jobTitle, company: r.company, initials: r.initials, avatarUrl: r.avatarUrl }); }}
                        className="w-8 h-8 shrink-0 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-transform flex items-center justify-center cursor-pointer">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-card)] shrink-0">
            <div className="flex items-center gap-3 text-[13px] text-text-body">
              <span>{t("kontakte.pageInfo", { from: from.toLocaleString("de-DE"), to: to.toLocaleString("de-DE"), total: total.toLocaleString("de-DE") })}</span>
              <span className="text-border-strong">·</span>
              <span className="flex items-center gap-1.5">{t("kontakte.perPage")}
                <Select value={String(pageSize)} onValueChange={(v) => setPagination((p) => ({ ...p, pageIndex: 0, pageSize: Number(v) }))}>
                  <SelectTrigger className="h-auto rounded-[8px] border-border bg-app-surface px-2 py-1 text-[13px] text-text-body w-[68px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-border text-[12px] font-semibold text-text-body hover:bg-app-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <ChevronLeft className="w-4 h-4" /> {t("kontakte.prev")}
              </button>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-border text-[12px] font-semibold text-text-body hover:bg-app-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                {t("kontakte.next")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anlegen + Detail-Panel */}
      <KontaktAnlegenPanel
        open={anlegenOpen}
        organizationId={organizationId}
        createdBy={userId}
        onClose={() => setAnlegenOpen(false)}
        onCreated={() => { setAnlegenOpen(false); void queryClient.invalidateQueries({ queryKey: ["kontakte", organizationId] }); }}
      />
      {detailPerson && <HunterSidepanel person={detailPerson} onClose={() => setDetailPerson(null)} />}

      {/* Listen (K-3b): Erstellen + „Zu Liste" (Bulk) */}
      <NeueListeDialog
        open={neueListeOpen}
        organizationId={organizationId}
        createdBy={userId}
        currentFilterDef={currentFilterDef}
        onClose={() => setNeueListeOpen(false)}
        onCreated={() => { void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] }); }}
      />
      <ZuListeDialog
        open={zuListeOpen}
        organizationId={organizationId}
        contactIds={selectedIds}
        createdBy={userId}
        onClose={() => setZuListeOpen(false)}
        onDone={() => { clearSelection(); void queryClient.invalidateQueries({ queryKey: ["lists", organizationId] }); }}
      />

      {/* Liste löschen — Bestätigung (irreversibel) */}
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
