/**
 * useDataTable — geteilte Tabellen-Mechanik (K-3 Phase C, extrahiert aus ScreenKontakte).
 *
 * Kapselt: TanStack-Table-Instanz (Sortieren · Spalten-Reihenfolge · Breite · Sichtbarkeit ·
 * Pagination · controlled RowSelection) + Resize + Persistenz PRO USER (`user_preferences`,
 * Schlüssel via `persistKey`). Der Screen liefert data/columns/rowSelection; die Präsentation
 * (`DataTableCard` + `ColumnConfigPopover`) konsumiert die zurückgegebene `table`.
 *
 * Companies (Phase D) nutzt denselben Hook mit eigenem `persistKey` (`table_views.companies`).
 * Beliebig große Spaltenlisten werden unterstützt (Sichtbarkeit/Reihenfolge/Breite pro Spalte).
 */
import { useEffect, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type ColumnSizingState,
  type RowSelectionState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { getUserPreference, setUserPreference } from "@/lib/db";

type SavedView = {
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnSizing?: ColumnSizingState;
  sorting?: SortingState;
  pageSize?: number;
};

export interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
  /** user_preferences-Schlüssel, z.B. "table_views.contacts" — trennt Ansichten pro Screen/User. */
  persistKey: string;
  userId: string | null;
  organizationId: string;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  pageSizeDefault?: number;
  /** Standard-Sichtbarkeit (z.B. optionale Set-B-Spalten default `false`). Auch Ziel von „Standard". */
  initialColumnVisibility?: VisibilityState;
}

export function useDataTable<T>({
  data, columns, getRowId, persistKey, userId, organizationId,
  rowSelection, onRowSelectionChange, pageSizeDefault = 50, initialColumnVisibility,
}: UseDataTableOptions<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: pageSizeDefault });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility ?? {});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // ── Persistenz (pro User) — laden beim Mount, speichern debounced ─────────────
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!userId) { prefsLoaded.current = true; return; }
    let alive = true;
    getUserPreference<SavedView>(userId, organizationId, persistKey).then((v) => {
      if (!alive || !v) { prefsLoaded.current = true; return; }
      if (v.columnVisibility) setColumnVisibility(v.columnVisibility);
      if (v.columnOrder) setColumnOrder(v.columnOrder);
      if (v.columnSizing) setColumnSizing(v.columnSizing);
      if (v.sorting) setSorting(v.sorting);
      if (v.pageSize) setPagination((p) => ({ ...p, pageSize: v.pageSize! }));
      prefsLoaded.current = true;
    });
    return () => { alive = false; };
  }, [userId, organizationId, persistKey]);

  useEffect(() => {
    if (!userId || !prefsLoaded.current) return;
    const t = setTimeout(() => {
      void setUserPreference(userId, organizationId, persistKey, {
        columnVisibility, columnOrder, columnSizing, sorting, pageSize: pagination.pageSize,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [userId, organizationId, persistKey, columnVisibility, columnOrder, columnSizing, sorting, pagination.pageSize]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, columnVisibility, columnOrder, columnSizing, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange,
    getRowId,
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { minSize: 80 },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /** Setzt Sichtbarkeit (auf den Default) + Reihenfolge + Breite zurück (Konfig-Popover „Standard"). */
  const resetColumns = () => { setColumnVisibility(initialColumnVisibility ?? {}); setColumnOrder([]); setColumnSizing({}); };

  return { table, resetColumns };
}
