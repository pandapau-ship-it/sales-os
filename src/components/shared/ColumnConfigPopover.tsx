/**
 * ColumnConfigPopover — geteilte Spalten-Konfiguration (K-3 Phase C). shadcn Popover
 * (click-outside + Escape). Ein-/Ausblenden pro Spalte + „Standard" (Sichtbarkeit + Reihenfolge
 * + Breite). Beliebig große Spaltenliste. Der Screen liefert `table` + `columnLabelFor` (i18n je
 * Spalten-Id) + `pinnedId` (Spalte, die nicht abgewählt werden darf). Chrome-Texte generisch (`table.*`).
 */
import type { Table } from "@tanstack/react-table";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function ColumnConfigPopover<T>({
  table, columnLabelFor, onReset, pinnedId,
}: {
  table: Table<T>;
  columnLabelFor: (id: string) => string;
  onReset: () => void;
  /** Spalte, die immer sichtbar bleibt (Checkbox disabled) — z.B. die Namensspalte. */
  pinnedId?: string;
}) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t("table.columnsAdjust")} data-tip={t("table.columnsAdjust")}
          className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" portal={false} className="w-64 p-3 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="typo-section-label text-text-muted">{t("table.columns")}</span>
          <button onClick={onReset} data-tip={t("table.resetDefaultTip")} className="text-text-muted hover:text-text-primary flex items-center gap-1 text-[11px] cursor-pointer"><RotateCcw className="w-3 h-3" /> {t("table.resetDefault")}</button>
        </div>
        {table.getAllLeafColumns().map((c) => (
          <label key={c.id} className="flex items-center gap-2 py-1.5 text-[13px] text-text-body cursor-pointer">
            <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} disabled={c.id === pinnedId} className="accent-[var(--sherloq-primary)]" />
            {columnLabelFor(c.id)}
          </label>
        ))}
        <p className="mt-2 pt-2 border-t border-[var(--border-card)] text-[11px] text-text-muted leading-snug">{t("table.columnsHint")}</p>
      </PopoverContent>
    </Popover>
  );
}
