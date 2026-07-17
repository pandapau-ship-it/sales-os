/**
 * TableSearch — geteiltes Suchfeld für die DataTable-Screens (Kontakte + Companies).
 * Reine, schnelle Substring-Suche (kein AI) — die Filter-Logik lebt zentral in `useDataTable`
 * (globalFilter + tableSearch.matchesQuery); diese Komponente ist nur die Eingabe. Platzierung:
 * oben rechts neben den Filtern (Screen-Toolbar). Placeholder kommt vom Screen (i18n).
 */
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TableSearch({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { t } = useTranslation();
  return (
    <div className="relative w-[240px] max-w-full">
      <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] pl-9 pr-8 py-1.5 bg-app-surface border border-border rounded-[8px] text-text-primary focus:border-[var(--sherloq-primary)] focus:outline-none transition-colors placeholder-[var(--text-muted)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("table.clearSearch")}
          data-tip={t("table.clearSearch")}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-[6px] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
