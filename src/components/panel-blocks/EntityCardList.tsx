/**
 * EntityCardList — verallgemeinertes „Produkte-Karten"-Muster (Slice 3b-3, Single Source).
 *
 * Liste eigenständiger, einklappbarer Karten für DB-Datensätze mit eigenem Lebenszyklus
 * (Anlegen/Bearbeiten/Löschen über RPCs) — im Gegensatz zu `KnowledgeListField` (Text-Schnipsel in
 * einem jsonb-Array EINER Zeile). Genutzt für Zielgruppen (org_icps) UND — verschachtelt — Personen
 * (org_personas): dieselbe Karten-Mechanik, nur `variant` unterscheidet die Optik.
 *
 * Jede Karte: Chevron-Aufklappen (eigener openId-Scope je Instanz → verschachteln ist sicher),
 * Name-Feld (FIELD-Kanon via `KnowledgeField`), Löschen mit `AlertDialog`-Bestätigung (ganze Entität
 * mit Kind-Daten → harte Bestätigung, wie ProductPricingPage), `renderBody` für die typ-spezifischen
 * Felder (inkl. einer verschachtelten EntityCardList für die Personen einer Zielgruppe).
 *
 * Elevation-Regel: `primary` = Ebene-1-Karte auf Seiten-BG; `nested` = dezent auf grauem Grund
 * (bg-app-bg, KEIN zweiter Schatten) — Elevation nur einmal pro Kontext.
 */
import { useState, type ReactNode } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import KnowledgeField from "./KnowledgeField";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export interface EntityItem {
  id: string;
  name: string;
}

export default function EntityCardList<T extends EntityItem>({
  items, canEdit = true, variant = "primary",
  addLabel, unnamedLabel, namePlaceholder,
  removeTitle, removeDescription, removeCancel, removeConfirm,
  emptyHint, headerMeta, headerBadge, onAdd, onRename, onRemove, renderBody,
}: {
  items: T[];
  canEdit?: boolean;
  variant?: "primary" | "nested";
  addLabel: string;
  unnamedLabel: string;
  namePlaceholder: string;
  removeTitle: string;
  removeDescription: string;
  removeCancel: string;
  removeConfirm: string;
  /** Wird gezeigt, wenn die Liste leer ist (z.B. „Noch keine Person"). */
  emptyHint?: string;
  /** Optionaler dezenter Hinweis in der zugeklappten Kopfzeile (z.B. Personen-Anzahl). */
  headerMeta?: (item: T) => ReactNode;
  /** Badge im Kachel-Kopf, IMMER sichtbar (auf- und zugeklappt) — z.B. Passung/Kaufrolle. */
  headerBadge?: (item: T) => ReactNode;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  renderBody: (item: T) => ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null); // eigener Scope je Instanz
  const [confirm, setConfirm] = useState<T | null>(null);
  const nested = variant === "nested";

  return (
    <div className="space-y-2.5">
      {items.length === 0 && emptyHint && (
        <p className="typo-subline text-text-muted">{emptyHint}</p>
      )}

      {items.map((it) => {
        const isOpen = openId === it.id;
        return (
          <article
            key={it.id}
            className={cn(
              "group/entity overflow-hidden border border-[var(--border-card)]",
              nested ? "rounded-[10px] bg-app-bg" : "rounded-[12px] bg-app-surface",
            )}
          >
            {/* Kopfzeile: immer sichtbar. Zugeklappt = Name (+ optionaler Meta), Klick öffnet. */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : it.id)}
                aria-expanded={isOpen}
                className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
              >
                <ChevronDown
                  className={cn("w-4 h-4 text-text-muted transition-transform shrink-0", isOpen ? "" : "-rotate-90")}
                />
                <span className="typo-card-title text-text-primary truncate">
                  {it.name.trim() || unnamedLabel}
                </span>
                {!isOpen && headerMeta && <span className="shrink-0">{headerMeta(it)}</span>}
              </button>
              {headerBadge && <span className="shrink-0">{headerBadge(it)}</span>}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setConfirm(it)}
                  aria-label={removeTitle}
                  data-tip={removeTitle}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-signal-urgent hover:bg-app-surface transition-colors cursor-pointer shrink-0 opacity-0 group-hover/entity:opacity-100 focus-within:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Aufgeklappt: Name-Feld (FIELD-Kanon) + typ-spezifische Felder. */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[var(--border-card)]">
                <KnowledgeField
                  canEdit={canEdit}
                  showAi={false}
                  value={it.name}
                  placeholder={namePlaceholder}
                  onSave={(v) => onRename(it.id, v)}
                />
                {renderBody(it)}
              </div>
            )}
          </article>
        );
      })}

      {canEdit && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>{removeDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{removeCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) onRemove(confirm.id);
                setConfirm(null);
              }}
            >
              {removeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
