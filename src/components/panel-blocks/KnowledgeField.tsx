/**
 * KnowledgeField — ein Feld im Bereich „Mein Unternehmen" (Produkte & Preise, Personal Voice,
 * Unternehmensprofil). VERBINDLICHES Muster für den gesamten Bereich (entschieden 20.07.2026):
 *
 *   Label oben, darunter IMMER ein sichtbares graues Eingabefeld (FIELD-Kanon), gespeichert beim
 *   Verlassen des Feldes. KEIN Stift, kein Read-Mode-Zwischenschritt.
 *
 * Warum: Das ist eine Ausfüll-Seite — man kommt her, UM zu tippen, nicht um zu lesen. Der zuvor
 * gebaute Read-Mode (Wert als Text, Klick öffnet ein Feld) ließ die Seite weiß und randlos wirken
 * und wich von der Design-Referenz ab. Read-Mode + Inline-Edit bleibt das richtige Muster für
 * LESE-Flächen (`DetailField` in den CRM-Panels) — hier ist es das falsche.
 *
 * Der KI-Knopf pro Feld bleibt: er erzeugt später einen Vorschlag für GENAU DIESES Feld (nicht für
 * die ganze Seite) und schreibt über denselben zentralen Weg wie die Tastatureingabe. Heute bewusst
 * ausgegraut + „Folgt" — `lib/ai.ts` existiert noch nicht, und ein Knopf, der so tut, als könne er
 * etwas, wäre ein Honesty-Bruch.
 *
 * Regel A: `DetailField` (panel-blocks) deckt das nicht ab — es ist genau der Read-Mode-Baustein
 * und kennt keinen zweiten Aktions-Slot (KI). Daher eigener, schlanker Baustein, geteilt über alle
 * drei Slices.
 *
 * Leer ist ein gültiger Zustand: in diesem Bereich gibt es KEINE Pflichtfelder — nie eine Warnung.
 */
import { useState, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD, FIELD_MULTILINE } from "@/lib/componentBehavior";

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
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // Solange das Feld den Fokus hat, gewinnt das Getippte — sonst könnte ein Refetch, der direkt
  // nach dem Speichern eintrifft, eine bereits begonnene neue Eingabe überschreiben.
  const focused = useRef(false);

  // Fremde Änderung (Refetch nach dem Speichern, anderes Gerät) WÄHREND des Renderns übernehmen —
  // Reacts empfohlener Weg statt eines Sync-Effects. Was gerade getippt wird, bleibt erhalten,
  // solange sich der Server-Wert nicht ändert.
  if (value !== lastValue) {
    setLastValue(value);
    if (!focused.current) setDraft(value);
  }

  const commit = () => { if (draft !== value) void onSave(draft); };

  const shared = {
    id,
    value: draft,
    placeholder,
    disabled: !canEdit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; commit(); },
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="typo-field-label text-text-muted">{label}</label>
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label={t("company.aiSuggest", { field: label })}
          data-tip={t("settings.nav.comingSoon")}
          className="w-7 h-7 rounded-[6px] text-text-muted opacity-40 cursor-not-allowed flex items-center justify-center shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {multiline ? (
        <Textarea {...shared} rows={rows} className={FIELD_MULTILINE} />
      ) : (
        <Input
          {...shared}
          className={FIELD}
          // Enter beendet die Eingabe wie das Verlassen des Feldes (mehrzeilig: echter Umbruch).
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
      )}
    </div>
  );
}
