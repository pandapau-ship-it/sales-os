/**
 * ScreenKontakte — Kontakte-Liste (K-3). Daten-Tabelle (TanStack Table), NICHT Karten.
 *
 * CP2: echte Daten (getContacts → contactToKontakteRow), Spalten mit Sortierung, Virtualisierung
 * innerhalb der Seite, Pagination (Seitengröße 25/50/100), alle Zustände (Laden/Fehler/leer).
 * Filter/Bulk/Spalten-Konfig/Persistenz/Anlegen folgen in CP3/CP4.
 *
 * Übernahme-Regeln (Dauerregel 4c): kein 1:1-Markup — bestehende Library-Bausteine
 * (StatusBadge/ICPDonut/Avatar/LeadSourceBadge/RoutingChip, Tokens, cn()). Dies ist eine
 * Daten-TABELLE, bewusst KEIN HunterCard-Profil (Spalten selbst gerendert ist hier korrekt).
 * Leere Werte ausblenden (Honesty), nie „—" erfinden.
 */
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown, Plus, SlidersHorizontal, Users } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useNowMs } from "@/hooks/useNowMs";
import { getContacts } from "@/lib/db";
import { contactToKontakteRow, type KontakteRow } from "@/lib/kontakteMappers";
import { daysSinceIso } from "@/lib/hunterMappers";
import { cn } from "@/lib/utils";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import StatusBadge from "@/components/panel-blocks/StatusBadge";
import LeadSourceBadge from "@/components/panel-blocks/LeadSourceBadge";
import RoutingChip from "@/components/panel-blocks/RoutingChip";
import EmptyState from "@/components/shared/EmptyState";

// contact_status → StatusBadge-Ton (leichter Tint, kein Fake). Unbekannt → muted.
const STATUS_CFG: Record<string, { label: string; tone: "success" | "warn" | "urgent" | "info" | "teal" | "muted" }> = {
  in_campaign: { label: "In Campaign", tone: "teal" },
  pipeline: { label: "Pipeline", tone: "info" },
  kunde: { label: "Kunde", tone: "success" },
  archiviert: { label: "Archiviert", tone: "muted" },
  ohne_campaign: { label: "Neu", tone: "muted" },
  opt_out: { label: "Opt-out", tone: "urgent" },
};

const PAGE_SIZES = [25, 50, 100];

export default function ScreenKontakte() {
  const { organizationId } = useCurrentOrg();
  const navigate = useNavigate();
  const nowMs = useNowMs();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const pageSize = pagination.pageSize;

  // CP2: bounded Fetch (Filter/serverseitige Pagination folgen CP3). RLS + org-gescoped.
  const contactsQuery = useQuery({
    queryKey: ["kontakte", organizationId],
    queryFn: () => getContacts(organizationId, { limit: 1000 }),
    staleTime: 30_000,
  });
  const rows: KontakteRow[] = useMemo(
    () => (contactsQuery.data ?? []).map(contactToKontakteRow),
    [contactsQuery.data],
  );

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
                <span className="typo-subline text-text-muted truncate">
                  {[r.jobTitle, r.company].filter(Boolean).join(" · ")}
                </span>
              </div>
            </div>
          );
        },
      }),
      col.accessor("leadSource", {
        header: "Quelle",
        enableSorting: false,
        cell: (c) => <LeadSourceBadge source={c.getValue()} />,
      }),
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
          if (d == null || d < 1) return null; // NULL / „vor 0 Tagen" → ausblenden (Honesty)
          return <span className="typo-field-value text-text-primary">vor {d} {d === 1 ? "Tag" : "Tagen"}</span>;
        },
      }),
      col.accessor("icpScore", {
        header: "ICP Score",
        cell: (c) => (c.getValue() != null ? <ICPDonut score={c.getValue() as number} /> : null),
      }),
      col.accessor("routing", {
        header: "Routing",
        enableSorting: false,
        cell: (c) => <RoutingChip routing={c.getValue()} onNavigate={(p) => navigate(p)} />,
      }),
    ],
    [col, nowMs, navigate],
  );

  // TanStack Table verwaltet seinen State intern (kompatibel); die react-compiler-Heuristik
  // des Hooks-Plugins kennt das Muster nicht → hier bewusst deaktiviert.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 68,
    overscan: 8,
  });

  const total = rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Kopf */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-extrabold text-text-primary">Kontakte</h1>
          {total > 0 && (
            <span className="px-2 py-0.5 rounded-[7px] bg-app-bg text-text-muted text-[13px] font-semibold tabular-nums">
              {total.toLocaleString("de-DE")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Spalten anpassen"
            data-tip="Spalten anpassen"
            className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[13px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Kontakt
          </button>
        </div>
      </div>

      {/* Tabellen-Container (Ebene 1) */}
      <div className="flex-1 min-h-0 flex flex-col bg-app-surface rounded-[12px] border border-[var(--border-card)] overflow-hidden">
        {/* Header-Zeile */}
        <div className="grid grid-cols-[minmax(220px,2fr)_140px_130px_120px_110px_140px_44px] gap-4 px-5 py-3 border-b border-[var(--border-card)] bg-app-bg shrink-0">
          {table.getHeaderGroups()[0].headers.map((h) => (
            <button
              key={h.id}
              type="button"
              disabled={!h.column.getCanSort()}
              onClick={h.column.getToggleSortingHandler()}
              className={cn(
                "typo-field-label text-text-muted flex items-center gap-1 text-left",
                h.column.getCanSort() && "hover:text-text-body cursor-pointer",
              )}
            >
              {flexRender(h.column.columnDef.header, h.getContext())}
              {h.column.getCanSort() &&
                ({ asc: <ArrowUp className="w-3 h-3" />, desc: <ArrowDown className="w-3 h-3" /> }[h.column.getIsSorted() as string] ?? (
                  <ChevronsUpDown className="w-3 h-3 opacity-40" />
                ))}
            </button>
          ))}
        </div>

        {/* Body */}
        {contactsQuery.isLoading ? (
          <div className="flex-1 p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 rounded-[8px] bg-app-bg animate-pulse" />
            ))}
          </div>
        ) : contactsQuery.isError ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Konnte gerade nicht geladen werden"
              description="Bitte erneut versuchen."
              action={{ label: "Nochmal laden", onClick: () => contactsQuery.refetch() }}
            />
          </div>
        ) : total === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<Users className="w-6 h-6" />} title="Noch keine Kontakte" description="Lege deinen ersten Kontakt an oder importiere eine Liste." />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const row = pageRows[vi.index];
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(220px,2fr)_140px_130px_120px_110px_140px_44px] gap-4 px-5 items-center border-b border-[var(--border-card)] hover:bg-app-bg/60 transition-colors absolute top-0 left-0 w-full"
                    style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} className="min-w-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                    <button
                      type="button"
                      aria-label="Kontakt öffnen"
                      data-tip="Kontakt öffnen"
                      className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-transform flex items-center justify-center cursor-pointer justify-self-end"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Pagination + Seitengröße */}
        {total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-card)] shrink-0">
            <div className="flex items-center gap-3 text-[13px] text-text-muted">
              <span>Zeige {from.toLocaleString("de-DE")}–{to.toLocaleString("de-DE")} von {total.toLocaleString("de-DE")}</span>
              <span className="text-border-strong">·</span>
              <label className="flex items-center gap-1.5">
                Pro Seite
                <select
                  value={pageSize}
                  onChange={(e) => setPagination((p) => ({ ...p, pageIndex: 0, pageSize: Number(e.target.value) }))}
                  className="rounded-[8px] border border-border bg-app-surface px-2 py-1 text-text-body cursor-pointer"
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="sherloq-btn-secondary disabled:opacity-40 disabled:cursor-default">Zurück</button>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="sherloq-btn-secondary disabled:opacity-40 disabled:cursor-default">Weiter</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
