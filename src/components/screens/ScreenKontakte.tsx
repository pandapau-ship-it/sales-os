/**
 * ScreenKontakte — Kontakte-Liste (K-3). Daten-TABELLE (TanStack Table), bewusst KEIN
 * HunterCard-Profil (Spalten selbst gerendert ist hier korrekt).
 *
 * CP2: echte Daten, Sortierung, Virtualisierung, Pagination, Zustände.
 * CP3: Filter über die K-2-Sprache (Pills → FilterDefinition → evaluateFilter, client-seitig auf
 *   dem geladenen Satz), Bulk-Auswahl (Gmail-Muster: Seite vs. ganzer Filter), Spalten-Sichtbarkeit
 *   + „Auf Standard", Persistenz PRO USER (user_preferences → table_views.contacts: Spalten/
 *   Sortierung/Seitengröße). Anlegen/Duplikat/Detail-Panel folgen CP4.
 *
 * Übernahme 4c: Library-Bausteine (StatusBadge/ICPDonut/Avatar/LeadSourceBadge/RoutingChip),
 * Tokens, Meta-Label oben (K-2b). Leere Werte ausblenden (Honesty), nie „—" erfinden.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown, Plus, SlidersHorizontal, Users, X, RotateCcw,
} from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useNowMs } from "@/hooks/useNowMs";
import { getContacts, getUserPreference, setUserPreference } from "@/lib/db";
import { contactToKontakteRow, type KontakteRow } from "@/lib/kontakteMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { evaluateFilter, type FilterDefinition, type FilterNode } from "@/lib/filter";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, ICPDonut, StatusBadge, LeadSourceBadge, RoutingChip, EmptyState } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import KontaktAnlegenPanel from "@/components/features/kontakte/KontaktAnlegenPanel";
import { HunterSidepanel } from "@/components";
import type { Person } from "@/types";

const STATUS_CFG: Record<string, { label: string; tone: "success" | "warn" | "urgent" | "info" | "teal" | "muted" }> = {
  in_campaign: { label: "In Campaign", tone: "teal" },
  pipeline: { label: "Pipeline", tone: "info" },
  kunde: { label: "Kunde", tone: "success" },
  archiviert: { label: "Archiviert", tone: "muted" },
  ohne_campaign: { label: "Neu", tone: "muted" },
  opt_out: { label: "Opt-out", tone: "urgent" },
};
const STATUS_PILLS = [
  { id: "in_campaign", label: "In Campaign" },
  { id: "pipeline", label: "Pipeline" },
  { id: "kunde", label: "Kunde" },
  { id: "archiviert", label: "Archiviert" },
  { id: "opt_out", label: "Opt-out" },
];
const SOURCE_PILLS = [
  { id: "sherloq", label: "Sherloq" },
  { id: "csv_upload", label: "CSV" },
  { id: "crm_sync", label: "CRM" },
  { id: "manual", label: "Manuell" },
];
const ICP_PILLS = [
  { id: "high", label: "ICP >75" },
  { id: "mid", label: "ICP 50–74" },
  { id: "low", label: "ICP <50" },
];
const PAGE_SIZES = [25, 50, 100];
const COLUMN_LABELS: Record<string, string> = {
  name: "Kontakt", leadSource: "Quelle", contactStatus: "Status",
  lastContactedAt: "Zuletzt", icpScore: "ICP Score", routing: "Routing",
};
const PREF_KEY = "table_views.contacts";

/** Filter-Pills → K-2-FilterDefinition (contacts-Felder). Kein Filter → null. */
function buildFilterDef(status: string | null, source: string | null, icp: string | null): FilterDefinition | null {
  const rules: FilterNode[] = [];
  if (status) rules.push({ field: "contact_status", operator: "eq", value: status });
  if (source) rules.push({ field: "lead_source", operator: "eq", value: source });
  if (icp === "high") rules.push({ field: "icp_score", operator: "gt", value: 75 });
  else if (icp === "low") rules.push({ field: "icp_score", operator: "lt", value: 50 });
  else if (icp === "mid") rules.push({ logic: "AND", rules: [
    { field: "icp_score", operator: "gte", value: 50 },
    { field: "icp_score", operator: "lte", value: 74 },
  ] });
  if (!rules.length) return null;
  return { entity: "contacts", where: rules.length === 1 ? rules[0] : { logic: "AND", rules } };
}

export default function ScreenKontakte() {
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const nowMs = useNowMs();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [icpFilter, setIcpFilter] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [anlegenOpen, setAnlegenOpen] = useState(false);
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);
  const queryClient = useQueryClient();

  // ── Persistenz (pro User) — laden beim Mount, speichern bei Änderung ──────────
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!userId) { prefsLoaded.current = true; return; }
    let alive = true;
    getUserPreference<{ columnVisibility?: VisibilityState; sorting?: SortingState; pageSize?: number }>(
      userId, organizationId, PREF_KEY,
    ).then((v) => {
      if (!alive || !v) { prefsLoaded.current = true; return; }
      if (v.columnVisibility) setColumnVisibility(v.columnVisibility);
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
        columnVisibility, sorting, pageSize: pagination.pageSize,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [userId, organizationId, columnVisibility, sorting, pagination.pageSize]);

  // ── Daten + Filter (K-2) ─────────────────────────────────────────────────────
  const contactsQuery = useQuery({
    queryKey: ["kontakte", organizationId],
    queryFn: () => getContacts(organizationId, { limit: 1000 }),
    staleTime: 30_000,
  });

  const rows: KontakteRow[] = useMemo(() => {
    const def = buildFilterDef(statusFilter, sourceFilter, icpFilter);
    const raw = contactsQuery.data ?? [];
    const filtered = def ? raw.filter((r) => evaluateFilter(def, r as unknown as Record<string, unknown>)) : raw;
    return filtered.map(contactToKontakteRow);
  }, [contactsQuery.data, statusFilter, sourceFilter, icpFilter]);

  // Filter-/Seitenwechsel → Bulk-Auswahl zurücksetzen (nie still über den Filter hinaus wirken).
  useEffect(() => { setRowSelection({}); setSelectAllFiltered(false); }, [statusFilter, sourceFilter, icpFilter]);

  const col = createColumnHelper<KontakteRow>();
  const columns = useMemo(
    () => [
      col.accessor("name", {
        header: "Kontakt",
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
      col.accessor("leadSource", { header: "Quelle", enableSorting: false, cell: (c) => <LeadSourceBadge source={c.getValue()} /> }),
      col.accessor("contactStatus", {
        header: "Status",
        cell: (c) => {
          const cfg = c.getValue() ? STATUS_CFG[c.getValue() as string] : undefined;
          return cfg ? <StatusBadge label={cfg.label} tone={cfg.tone} /> : null;
        },
      }),
      col.accessor("lastContactedAt", {
        header: "Zuletzt",
        cell: (c) => {
          const d = daysSinceIso(c.getValue(), nowMs);
          if (d == null || d < 1) return null;
          return <span className="typo-field-value text-text-primary">vor {d} {d === 1 ? "Tag" : "Tagen"}</span>;
        },
      }),
      col.accessor("icpScore", { header: "ICP Score", cell: (c) => (c.getValue() != null ? <ICPDonut score={c.getValue() as number} /> : null) }),
      col.accessor("routing", { header: "Routing", enableSorting: false, cell: (c) => <RoutingChip routing={c.getValue()} onNavigate={(p) => navigate(p)} /> }),
    ],
    [col, nowMs, navigate],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => r.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({ count: pageRows.length, getScrollElement: () => scrollRef.current, estimateSize: () => 68, overscan: 8 });

  const total = rows.length;
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const selectedCount = selectAllFiltered ? total : Object.keys(rowSelection).length;
  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => rowSelection[r.id]);
  const hasFilter = !!(statusFilter || sourceFilter || icpFilter);

  const resetColumns = () => setColumnVisibility({});
  const clearSelection = () => { setRowSelection({}); setSelectAllFiltered(false); };
  const bulkAction = (label: string) => { toast(`${label}: ${selectedCount} Kontakte (folgt) ✓`, "info"); clearSelection(); };

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors cursor-pointer",
        active ? "bg-[var(--sherloq-primary)] text-on-accent border-transparent" : "bg-app-surface text-text-body border-border hover:bg-app-bg",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Kopf */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold text-text-primary">Kontakte</h1>
          {total > 0 && <span className="px-2 py-0.5 rounded-[7px] bg-app-bg text-text-muted text-[13px] font-semibold tabular-nums">{total.toLocaleString("de-DE")}</span>}
        </div>
        <div className="flex items-center gap-2 relative">
          <button type="button" aria-label="Spalten anpassen" data-tip="Spalten anpassen" onClick={() => setConfigOpen((o) => !o)}
            className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {configOpen && (
            <div className="absolute right-0 top-11 z-20 w-56 bg-app-surface rounded-[12px] border border-[var(--border-card)] shadow-[var(--shadow-dropdown)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="typo-section-label text-text-muted">Spalten</span>
                <button onClick={resetColumns} data-tip="Auf Standard zurücksetzen" className="text-text-muted hover:text-text-primary flex items-center gap-1 text-[11px] cursor-pointer"><RotateCcw className="w-3 h-3" /> Standard</button>
              </div>
              {table.getAllLeafColumns().map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1.5 text-[13px] text-text-body cursor-pointer">
                  <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} disabled={c.id === "name"} className="accent-[var(--sherloq-primary)]" />
                  {COLUMN_LABELS[c.id] ?? c.id}
                </label>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setAnlegenOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> Kontakt
          </button>
        </div>
      </div>

      {/* Filter-Pills */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Pill active={!statusFilter} onClick={() => setStatusFilter(null)}>Alle</Pill>
        {STATUS_PILLS.map((p) => <Pill key={p.id} active={statusFilter === p.id} onClick={() => setStatusFilter(statusFilter === p.id ? null : p.id)}>{p.label}</Pill>)}
        <span className="w-px h-5 bg-border mx-1" />
        {SOURCE_PILLS.map((p) => <Pill key={p.id} active={sourceFilter === p.id} onClick={() => setSourceFilter(sourceFilter === p.id ? null : p.id)}>{p.label}</Pill>)}
        <span className="w-px h-5 bg-border mx-1" />
        {ICP_PILLS.map((p) => <Pill key={p.id} active={icpFilter === p.id} onClick={() => setIcpFilter(icpFilter === p.id ? null : p.id)}>{p.label}</Pill>)}
      </div>

      {/* Bulk-Bar (Gmail-Muster) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-[10px] bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/20">
          <div className="flex items-center gap-3 text-[13px] text-text-body">
            <span className="font-bold">{selectedCount.toLocaleString("de-DE")} ausgewählt</span>
            {/* Gmail: Seite vs. ganzer Filter explizit unterscheiden */}
            {pageAllSelected && !selectAllFiltered && total > pageRows.length && (
              <button onClick={() => setSelectAllFiltered(true)} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">
                Alle {total.toLocaleString("de-DE")} {hasFilter ? "im aktuellen Filter" : "Kontakte"} auswählen
              </button>
            )}
            {selectAllFiltered && <button onClick={clearSelection} className="text-[var(--sherloq-primary)] font-semibold hover:underline cursor-pointer">Auswahl aufheben</button>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkAction("Zu Liste hinzufügen")} className="sherloq-btn-secondary">Zu Liste</button>
            <button onClick={() => bulkAction("Tag setzen")} className="sherloq-btn-secondary">Tag</button>
            <button onClick={() => bulkAction("Archivieren")} className="sherloq-btn-secondary">Archivieren</button>
            <button onClick={clearSelection} aria-label="Auswahl schließen" data-tip="Auswahl aufheben" className="w-8 h-8 rounded-full hover:bg-app-surface flex items-center justify-center text-text-muted cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Tabelle */}
      <div className="flex-1 min-h-0 flex flex-col bg-app-surface rounded-[12px] border border-[var(--border-card)] overflow-hidden">
        <div className="grid grid-cols-[36px_minmax(200px,2fr)_140px_130px_120px_110px_140px_44px] gap-4 px-5 py-3 border-b border-[var(--border-card)] bg-app-bg shrink-0 items-center">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" aria-label="Alle auf dieser Seite auswählen" checked={pageAllSelected}
              onChange={(e) => { const on = e.target.checked; setSelectAllFiltered(false); setRowSelection(on ? Object.fromEntries(pageRows.map((r) => [r.id, true])) : {}); }}
              className="accent-[var(--sherloq-primary)]" />
          </label>
          {table.getHeaderGroups()[0].headers.map((h) => (
            <button key={h.id} type="button" disabled={!h.column.getCanSort()} onClick={h.column.getToggleSortingHandler()}
              className={cn("typo-field-label text-text-muted flex items-center gap-1 text-left", h.column.getCanSort() && "hover:text-text-body cursor-pointer")}>
              {flexRender(h.column.columnDef.header, h.getContext())}
              {h.column.getCanSort() && ({ asc: <ArrowUp className="w-3 h-3" />, desc: <ArrowDown className="w-3 h-3" /> }[h.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3 h-3 opacity-40" />)}
            </button>
          ))}
          <span />
        </div>

        {contactsQuery.isLoading ? (
          <div className="flex-1 p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 rounded-[8px] bg-app-bg animate-pulse" />)}</div>
        ) : contactsQuery.isError ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<Users className="w-6 h-6" />} title="Konnte gerade nicht geladen werden" description="Bitte erneut versuchen." action={{ label: "Nochmal laden", onClick: () => contactsQuery.refetch() }} />
          </div>
        ) : total === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<Users className="w-6 h-6" />}
              title={hasFilter ? "Keine Treffer" : "Noch keine Kontakte"}
              description={hasFilter ? "Kein Kontakt passt zu diesem Filter." : "Lege deinen ersten Kontakt an oder importiere eine Liste."} />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const row = pageRows[vi.index];
                const selected = selectAllFiltered || !!rowSelection[row.id];
                return (
                  <div key={row.id}
                    className={cn("grid grid-cols-[36px_minmax(200px,2fr)_140px_130px_120px_110px_140px_44px] gap-4 px-5 items-center border-b border-[var(--border-card)] hover:bg-app-bg/60 transition-colors absolute top-0 left-0 w-full", selected && "bg-[var(--signal-teal-bg)]")}
                    style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" aria-label="Kontakt auswählen" checked={selected}
                        onChange={() => { setSelectAllFiltered(false); row.toggleSelected(); }} className="accent-[var(--sherloq-primary)]" />
                    </label>
                    {row.getVisibleCells().map((cell) => <div key={cell.id} className="min-w-0">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>)}
                    <button type="button" aria-label="Kontakt öffnen" data-tip="Kontakt öffnen"
                      onClick={() => { const r = row.original; setDetailPerson({ id: r.id, name: r.name, jobTitle: r.jobTitle, company: r.company, initials: r.initials, avatarUrl: r.avatarUrl }); }}
                      className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-transform flex items-center justify-center cursor-pointer justify-self-end">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-card)] shrink-0">
            <div className="flex items-center gap-3 text-[13px] text-text-muted">
              <span>Zeige {from.toLocaleString("de-DE")}–{to.toLocaleString("de-DE")} von {total.toLocaleString("de-DE")}</span>
              <span className="text-border-strong">·</span>
              <span className="flex items-center gap-1.5">Pro Seite
                <Select value={String(pageSize)} onValueChange={(v) => setPagination((p) => ({ ...p, pageIndex: 0, pageSize: Number(v) }))}>
                  <SelectTrigger className="h-auto rounded-[8px] border-border bg-app-surface px-2 py-1 text-[13px] text-text-body w-[68px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="sherloq-btn-secondary disabled:opacity-40 disabled:cursor-default">Zurück</button>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="sherloq-btn-secondary disabled:opacity-40 disabled:cursor-default">Weiter</button>
            </div>
          </div>
        )}
      </div>

      {/* CP4: Anlegen + Detail-Panel */}
      <KontaktAnlegenPanel
        open={anlegenOpen}
        organizationId={organizationId}
        createdBy={userId}
        onClose={() => setAnlegenOpen(false)}
        onCreated={() => { setAnlegenOpen(false); void queryClient.invalidateQueries({ queryKey: ["kontakte", organizationId] }); }}
      />
      {detailPerson && <HunterSidepanel person={detailPerson} onClose={() => setDetailPerson(null)} />}
    </div>
  );
}
