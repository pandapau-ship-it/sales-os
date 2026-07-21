/**
 * KnowledgeListField — generische WACHSENDE Liste im „Mein Unternehmen"-Muster (Slice 3+).
 *
 * Für jsonb-Arrays mit stabilen `{id, …}`-Einträgen (USPs, Angebote, Wettbewerber, gelöste Probleme,
 * Geschäftsergebnisse — und in 3b ICP-/Persona-Listen wie Job-Titel, Zitate). Jeder Eintrag hat EIN
 * oder MEHRERE Sub-Felder (`fields`-Config) — z.B. Angebot = {title, text}, Wettbewerber = {name, why_us}.
 *
 * Regel A: `DetailPhoneList` war das strukturelle Vorbild (Array + add/remove + Auto-Fokus), ist aber
 * Read-Mode. Diese Komponente nutzt stattdessen den **FIELD-Kanon** — indem sie je Sub-Feld ein
 * `KnowledgeField` rendert (Single Source der Feld-Optik + save-on-blur), nur ohne KI-Pill
 * (`showAi={false}`; ein Pill pro Item wäre zu laut — KI arbeitet auf Seiten-Ebene).
 *
 * Prop-driven: `items` kommt vom Aufrufer, jede Änderung meldet `onChange(nextItems)` die VOLLE Liste
 * zurück (der Aufrufer schreibt sie als ein Feld über den zentralen RPC — `update_org_profile`).
 * Entfernen ist DIREKT (kein Bestätigungsdialog): es ist nur ein Formularfeld, noch nicht gespeichert.
 */
import { Plus, Trash2 } from "lucide-react";
import { textOf, type I18nText } from "@/lib/i18nText";
import KnowledgeField from "./KnowledgeField";

export interface ListItem {
  id: string;
  [key: string]: unknown;
}
export interface ListSubField {
  key: string;
  /** Kleines Label über dem Sub-Feld — nur bei mehreren Sub-Feldern pro Eintrag sinnvoll. */
  label?: string;
  placeholder?: string;
  multiline?: boolean;
}

/** Draft-Zeile im Leerzustand: stabile ID, damit KnowledgeField nicht bei jedem Render neu mountet. */
const DRAFT_ID = "__draft__";

export default function KnowledgeListField({
  label, items, fields, canEdit = true, addLabel, removeLabel, emptyHint, emptyRow, onChange,
}: {
  label: string;
  items: ListItem[];
  fields: ListSubField[];
  canEdit?: boolean;
  addLabel: string;
  removeLabel: string;
  emptyHint?: string;
  /**
   * Leerzustand zeigt EINE leere, direkt beschreibbare Zeile statt `emptyHint`-Text
   * (Tippen legt den ersten Eintrag an, leer bleibt verworfen). Default: nur bei Einzelfeld-Listen
   * (USPs/Probleme/Ergebnisse) — Mehrfeld-Listen (Wettbewerber/Angebote) blieben sonst mit einer
   * leeren Karte zu laut und behalten den Hint. Explizit überschreibbar.
   */
  emptyRow?: boolean;
  onChange: (next: ListItem[]) => void;
}) {
  const multi = fields.length > 1;
  const showEmptyRow = (emptyRow ?? !multi) && canEdit;

  const isReal = (id: string) => items.some((it) => it.id === id);
  const setField = (id: string, key: string, v: string) => {
    // Draft-Zeile (nicht in `items`): erst bei echtem Wert als Eintrag anlegen — leer wird verworfen.
    if (!isReal(id)) {
      if (v.trim() === "") return;
      const created: ListItem = { id: crypto.randomUUID() };
      for (const f of fields) created[f.key] = f.key === key ? v : "";
      onChange([...items, created]);
      return;
    }
    onChange(items.map((it) => (it.id === id ? { ...it, [key]: v } : it)));
  };
  const removeItem = (id: string) => onChange(items.filter((it) => it.id !== id));
  const addItem = () => {
    const blank: ListItem = { id: crypto.randomUUID() };
    for (const f of fields) blank[f.key] = "";
    onChange([...items, blank]);
  };

  // Leer + Einzelfeld → eine leere Draft-Zeile rendern (kein „Noch nichts eingetragen."-Text).
  const draft: ListItem = { id: DRAFT_ID };
  for (const f of fields) draft[f.key] = "";
  const rows = items.length === 0 && showEmptyRow ? [draft] : items;

  const removeBtn = (id: string, extra: string) =>
    canEdit && isReal(id) ? (
      <button
        type="button"
        onClick={() => removeItem(id)}
        aria-label={removeLabel}
        data-tip={removeLabel}
        className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-signal-urgent hover:bg-app-surface transition-colors cursor-pointer shrink-0 opacity-0 group-hover/li:opacity-100 focus-within:opacity-100 ${extra}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    ) : null;

  return (
    <div>
      <div className="typo-field-label text-text-muted mb-1.5">{label}</div>
      {items.length === 0 && !showEmptyRow && emptyHint && (
        <p className="typo-subline text-text-muted mb-2">{emptyHint}</p>
      )}

      <div className="space-y-2.5">
        {rows.map((it) =>
          multi ? (
            // Mehrere Sub-Felder → dezent umrandeter Block gruppiert den Eintrag; graue Felder
            // heben sich gegen die weiße Karte ab (Container selbst transparent, kein zweites Grau).
            <div key={it.id} className="group/li relative rounded-[10px] border border-[var(--border-card)] p-3">
              <div className="space-y-2.5 pr-8">
                {fields.map((f) => (
                  <KnowledgeField
                    key={f.key}
                    canEdit={canEdit}
                    showAi={false}
                    label={f.label}
                    value={textOf(it[f.key] as I18nText)}
                    placeholder={f.placeholder}
                    multiline={f.multiline}
                    onSave={(v) => setField(it.id, f.key, v)}
                  />
                ))}
              </div>
              {removeBtn(it.id, "absolute top-2 right-2")}
            </div>
          ) : (
            // Ein Sub-Feld → schlanke Zeile: Feld + Entfernen daneben.
            <div key={it.id} className="group/li flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <KnowledgeField
                  canEdit={canEdit}
                  showAi={false}
                  value={textOf(it[fields[0].key] as I18nText)}
                  placeholder={fields[0].placeholder}
                  multiline={fields[0].multiline}
                  onSave={(v) => setField(it.id, fields[0].key, v)}
                />
              </div>
              {removeBtn(it.id, "mt-0.5")}
            </div>
          ),
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={addItem}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-text-muted hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> {addLabel}
        </button>
      )}
    </div>
  );
}
