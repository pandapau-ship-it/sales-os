/**
 * KnowledgeField — ein Feld im Bereich „Mein Unternehmen" (Produkte & Preise, später Personal
 * Voice + Unternehmensprofil). Trägt die verbindliche Doppel-Affordanz:
 *
 *   Stift (Pencil)   → manuelles Bearbeiten; speichert über die ZENTRALE Update-Funktion des Aufrufers
 *                 (update_product / update_org_profile) — es gibt keinen zweiten Schreibweg.
 *   KI-Knopf (Sparkles) → erzeugt später einen Vorschlag für GENAU DIESES Feld (nicht die ganze Seite).
 *                 Heute bewusst ausgegraut + „Folgt" — `lib/ai.ts` existiert noch nicht, und ein
 *                 Knopf, der so tut als könne er etwas, wäre ein Honesty-Bruch.
 *
 * Regel A: `DetailField` (panel-blocks) deckt das nicht ab — es kennt keinen zweiten Aktions-Slot
 * und ist auf CRM-Panel-Semantik (copyable/href/options) zugeschnitten. Daher eigener, schlanker
 * Baustein, bewusst geteilt für die zwei Folge-Slices.
 *
 * Leer ist ein gültiger Zustand: in diesem Bereich gibt es KEINE Pflichtfelder. Leere Felder
 * zeigen den Platzhalter, nie eine Warnung.
 */
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export default function KnowledgeField({
  label, value, placeholder, multiline = false, rows = 3, canEdit = true, onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** false → nur lesen (fehlendes Recht). Gleiche Gating-Logik wie die übrigen Aktionen der Seite. */
  canEdit?: boolean;
  onSave: (next: string) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  // Der Entwurf wird beim ÖFFNEN aus dem aktuellen Wert gesetzt (nicht per Sync-Effect) —
  // so überschreibt ein Hintergrund-Refetch nie, was gerade getippt wird.
  const startEdit = () => { if (!canEdit) return; setDraft(value); setEditing(true); };

  const commit = () => {
    setEditing(false);
    if (draft !== value) void onSave(draft);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="typo-field-label text-text-muted">{label}</span>
        <div className={cn("flex items-center gap-0.5", HOVER_ACTIONS)}>
          {canEdit && <button
            type="button"
            onClick={startEdit}
            aria-label={t("company.editField", { field: label })}
            data-tip={t("common.edit")}
            className="w-7 h-7 rounded-[6px] text-text-muted hover:bg-app-bg hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>}
          <button
            type="button"
            disabled
            aria-label={t("company.aiSuggest", { field: label })}
            aria-disabled="true"
            data-tip={t("settings.nav.comingSoon")}
            className="w-7 h-7 rounded-[6px] text-text-muted opacity-40 cursor-not-allowed flex items-center justify-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        multiline ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
          />
        )
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={!canEdit}
          className={cn(
            "w-full text-left text-[13px] text-text-body whitespace-pre-wrap min-h-[20px]",
            canEdit ? "cursor-text" : "cursor-default",
          )}
        >
          {value.trim().length > 0
            ? value
            : <span className="text-text-muted">{placeholder ?? t("company.emptyField")}</span>}
        </button>
      )}
    </div>
  );
}
