/**
 * DataTableCard — geteilte Tabellen-Präsentation (K-3 Phase C, extrahiert aus ScreenKontakte).
 *
 * Rendert Kopfzeile (Sortieren · Drag-Reorder · Breite-Ziehen), virtualisierten Body (Checkbox +
 * Zellen + optionale Zeilen-Aktionen + Öffnen-Pfeil mit Hover-Prefetch), Pagination-Footer und
 * Lade-/Fehler-/Leer-Zustände. Auswahl läuft über die TanStack-Bordmittel (page-all + per-row);
 * die Auswahl-STATE besitzt der Screen via `useDataTable` (für Bulk/Listen). Companies (Phase D)
 * nutzt dieselbe Komponente. Chrome-Texte generisch (`table.*`), `entityLabel` für Aria.
 */
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { reorderColumns } from "@/lib/columnOrder";
import { useHoverPrefetch } from "@/hooks/useHoverPrefetch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

export interface DataTableCardProps<T> {
  table: Table<T>;
  isLoading?: boolean;
  isError?: boolean;
  onReload?: () => void;
  /** Leer-Zustand (Text kommt vom Screen — kein/Filter/Liste). */
  emptyState: ReactNode;
  onRowOpen: (row: T) => void;
  /** Hover-Intent-Prefetch (Regel C) — der Screen liefert die prefetch-Funktion je Zeile. */
  onRowPrefetch?: (row: T) => void;
  /** Zusätzliche Zeilen-Aktionen (vor dem Öffnen-Pfeil), z.B. „Aus Liste entfernen". */
  rowActions?: (row: T) => ReactNode;
  pageSizes?: number[];
  /** Für Aria/Tooltip: „<Entity> öffnen"/„<Entity> auswählen" (z.B. „Kontakt"). */
  entityLabel: string;
  rowHeight?: number;
}

export default function DataTableCard<T>({
  table, isLoading, isError, onReload, emptyState, onRowOpen, onRowPrefetch, rowActions,
  pageSizes = [25, 50, 100], entityLabel, rowHeight = 68,
}: DataTableCardProps<T>) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggedCol = useRef<string | null>(null);
  const prefetch = useHoverPrefetch();

  const headers = table.getHeaderGroups()[0].headers;
  const pageRows = table.getRowModel().rows;
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({ count: pageRows.length, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 8 });
  const visibleCols = table.getVisibleLeafColumns();
  const rowWidth = 36 + visibleCols.reduce((s, c) => s + c.getSize(), 0) + 44 + 16 * (visibleCols.length + 1);

  const total = table.getPrePaginationRowModel().rows.length; // alle (bereits im Screen gefilterten) Zeilen, vor Pagination
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  // Drag-Reorder (nur Datenspalten; Checkbox + Öffnen-Pfeil bleiben fix). reorderColumns
  // normalisiert auf den VOLLSTÄNDIGEN aktuellen Spaltensatz → auch nachträglich sichtbar
  // geschaltete Set-B-Spalten sind verschiebbar, selbst wenn die gespeicherte Order sie nicht kennt.
  const onColDrop = (targetId: string) => {
    const dragged = draggedCol.current;
    draggedCol.current = null;
    if (!dragged) return;
    const next = reorderColumns(
      table.getAllLeafColumns().map((c) => c.id),
      table.getState().columnOrder,
      dragged,
      targetId,
    );
    if (next) table.setColumnOrder(next);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-app-surface rounded-[12px] border border-[var(--border-card)] overflow-hidden">
      {isLoading ? (
        <div className="flex-1 p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 rounded-[8px] bg-app-bg animate-pulse" />)}</div>
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<Users className="w-6 h-6" />} title={t("table.loadError")} description={t("table.loadErrorDesc")} action={onReload ? { label: t("table.reload"), onClick: onReload } : undefined} />
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center">{emptyState}</div>
      ) : (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <div style={{ minWidth: rowWidth }}>
            {/* Header — sticky, horizontal mit den Zeilen synchron */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-3 border-b border-[var(--border-card)] bg-app-bg">
              <label className="flex items-center cursor-pointer shrink-0 w-9">
                <input type="checkbox" aria-label={t("table.selectPageAll")} checked={table.getIsAllPageRowsSelected()}
                  onChange={table.getToggleAllPageRowsSelectedHandler()} className="accent-[var(--sherloq-primary)]" />
              </label>
              {headers.map((h) => (
                <div key={h.id} style={{ width: h.getSize() }} className="relative shrink-0 group/col"
                  draggable onDragStart={() => { draggedCol.current = h.column.id; }} onDragOver={(e) => e.preventDefault()} onDrop={() => onColDrop(h.column.id)}>
                  <button type="button" disabled={!h.column.getCanSort()} onClick={h.column.getToggleSortingHandler()}
                    className={cn("typo-field-label text-text-body flex items-center gap-1 text-left max-w-full cursor-grab active:cursor-grabbing", h.column.getCanSort() && "hover:text-text-primary")}>
                    <GripVertical className="w-3 h-3 text-text-muted opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0" />
                    <span className="truncate">{flexRender(h.column.columnDef.header, h.getContext())}</span>
                    {h.column.getCanSort() && ({ asc: <ArrowUp className="w-3 h-3 shrink-0" />, desc: <ArrowDown className="w-3 h-3 shrink-0" /> }[h.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3 h-3 opacity-40 shrink-0" />)}
                  </button>
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
                const selected = row.getIsSelected();
                return (
                  <div key={row.id}
                    {...prefetch(onRowPrefetch ? () => onRowPrefetch(row.original) : undefined)}
                    className={cn("group/row flex items-center gap-4 px-5 border-b border-[var(--border-card)] hover:bg-app-bg/60 transition-colors absolute top-0 left-0 w-full", selected && "bg-[var(--signal-teal-bg)]")}
                    style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}>
                    <label className="flex items-center cursor-pointer shrink-0 w-9">
                      <input type="checkbox" aria-label={t("table.selectRow", { entity: entityLabel })} checked={selected}
                        onChange={row.getToggleSelectedHandler()} className="accent-[var(--sherloq-primary)]" />
                    </label>
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} style={{ width: cell.column.getSize() }} className="min-w-0 shrink-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                    {rowActions?.(row.original)}
                    <button type="button" aria-label={t("table.openEntity", { entity: entityLabel })} data-tip={t("table.openEntity", { entity: entityLabel })}
                      onClick={() => onRowOpen(row.original)}
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
          <div className="flex items-center gap-3 text-[13px] text-text-primary">
            <span className="font-medium">{t("table.pageInfo", { from: from.toLocaleString("de-DE"), to: to.toLocaleString("de-DE"), total: total.toLocaleString("de-DE") })}</span>
            <span className="text-border-strong">·</span>
            <span className="flex items-center gap-1.5 text-text-body">{t("table.perPage")}
              <Select value={String(pageSize)} onValueChange={(v) => table.setPagination((p) => ({ ...p, pageIndex: 0, pageSize: Number(v) }))}>
                <SelectTrigger className="h-auto rounded-[8px] border-border-strong bg-app-surface px-2 py-1 text-[13px] font-semibold text-text-primary w-[68px]"><SelectValue /></SelectTrigger>
                <SelectContent>{pageSizes.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </span>
          </div>
          {/* Aktiv = dunkler Text + kräftiger Rahmen (gut lesbar); deaktiviert = klar abgesetzt (muted, kein Hover). */}
          <div className="flex items-center gap-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-border-strong text-[12px] font-semibold text-text-primary hover:bg-app-bg hover:border-[var(--sherloq-primary)] transition-colors cursor-pointer disabled:text-text-muted disabled:border-border disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border">
              <ChevronLeft className="w-4 h-4" /> {t("table.prev")}
            </button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] border border-border-strong text-[12px] font-semibold text-text-primary hover:bg-app-bg hover:border-[var(--sherloq-primary)] transition-colors cursor-pointer disabled:text-text-muted disabled:border-border disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border">
              {t("table.next")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
