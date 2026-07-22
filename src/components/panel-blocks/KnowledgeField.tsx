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
import { useState, useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD, FIELD_MULTILINE, AI_PILL_PENDING } from "@/lib/componentBehavior";
import { useAutoGrowTextarea, type AutoGrowGroup } from "@/hooks/useAutoGrowTextarea";

export default function KnowledgeField({
  label, value, placeholder, multiline = false, rows = 3, canEdit = true, icon, showAi = true,
  coupleGroup, onSave,
}: {
  /** Optional — leer/undefined = kein Label-Kopf (z.B. Einzel-Feld-Einträge in `KnowledgeListField`). */
  label?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** false → nur lesen (fehlendes Recht). Gleiche Gating-Logik wie die übrigen Aktionen der Seite. */
  canEdit?: boolean;
  /** Optionales Icon links vom Label (z.B. Bestätigungs-/Warn-Symbol bei „immer"/„nie"). */
  icon?: ReactNode;
  /** false → kein KI-Vorschlags-Knopf (z.B. je Listen-Eintrag wäre ein Pill pro Item zu laut). */
  showAi?: boolean;
  /**
   * Opt-in: koppelt dieses mehrzeilige Feld mit den anderen Feldern derselben Gruppe auf die Höhe
   * des längsten (bündiges Nebeneinander-Paar, z. B. dos_donts „immer"/„nie"). STRIKT opt-in —
   * ohne diese Prop verhält sich das Feld exakt wie bisher (eigene Höhe, kein Kopplungs-Code).
   */
  coupleGroup?: AutoGrowGroup;
  onSave: (next: string) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const id = useId();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // Solange das Feld den Fokus hat, gewinnt das Getippte — sonst könnte ein Refetch, der direkt
  // nach dem Speichern eintrifft, eine bereits begonnene neue Eingabe überschreiben.
  // Bewusst State und kein Ref: der Wert wird WÄHREND des Renderns gelesen, und Refs dürfen dort
  // nicht angefasst werden (react-hooks/refs).
  const [focused, setFocused] = useState(false);

  // Fremde Änderung (Refetch nach dem Speichern, anderes Gerät) WÄHREND des Renderns übernehmen —
  // Reacts empfohlener Weg statt eines Sync-Effects. Was gerade getippt wird, bleibt erhalten,
  // solange sich der Server-Wert nicht ändert.
  if (value !== lastValue) {
    setLastValue(value);
    if (!focused) setDraft(value);
  }

  const commit = () => { if (draft !== value) void onSave(draft); };

  // Mehrzeilige Felder wachsen zeilenweise mit dem Inhalt (zentrale Single Source). Bei Einzeiligen
  // ist `taRef` nie am DOM → der Hook ist ein No-op. `draft` treibt das Neu-Messen bei jeder Eingabe.
  useAutoGrowTextarea(taRef, draft, multiline ? coupleGroup : undefined);

  const shared = {
    id,
    value: draft,
    placeholder,
    disabled: !canEdit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => { setFocused(false); commit(); },
  };

  return (
    <div>
      {(label || showAi) && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label ? (
            <label htmlFor={id} className="typo-field-label text-text-muted inline-flex items-center gap-1.5">
              {icon}
              {label}
            </label>
          ) : (
            <span />
          )}
          {showAi && (
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label={t("company.aiSuggest", { field: label ?? "" })}
              data-tip={t("settings.nav.comingSoon")}
              className={`${AI_PILL_PENDING} px-2 py-0.5 shrink-0`}
            >
              <Sparkles className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {multiline ? (
        <Textarea {...shared} ref={taRef} rows={rows} className={FIELD_MULTILINE} />
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
