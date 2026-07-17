/**
 * NeueListeDialog — „Neue Liste erstellen" (K-3b). shadcn-Dialog.
 * Fragt zuerst den Typ: STATISCH (manuelle Mitglieder) oder DYNAMISCH (aktueller Filter, live).
 * Dynamisch übernimmt den AKTUELLEN Kontakte-Filter (`currentFilterDef` = buildFilterDef-Ergebnis) —
 * dieselbe Filter-Quelle, keine zweite Filter-UI. Ohne aktiven Filter ist „Dynamisch" nicht wählbar
 * (Honesty: eine leere Regel wäre keine sinnvolle dynamische Liste).
 */
import { useState } from "react";
import { Users, Filter, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createList } from "@/lib/db";
import type { FilterDefinition } from "@/lib/filter";
import { useToast } from "@/components/shared/toastContext";

export default function NeueListeDialog({
  open, organizationId, createdBy, currentFilterDef, onClose, onCreated,
}: {
  open: boolean;
  organizationId: string;
  createdBy: string | null;
  /** Aktueller Kontakte-Filter (null = kein Filter aktiv → Dynamisch nicht wählbar). */
  currentFilterDef: FilterDefinition | null;
  onClose: () => void;
  onCreated: (listId: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<"static" | "dynamic">("static");
  const [busy, setBusy] = useState(false);
  const dynamicDisabled = !currentFilterDef;

  const submit = async () => {
    if (!name.trim() || busy) return;
    if (type === "dynamic" && !currentFilterDef) return;
    setBusy(true);
    try {
      const res = await createList(organizationId, {
        name: name.trim(), type,
        filterConfig: type === "dynamic" ? currentFilterDef : null,
      }, createdBy);
      toast(t("kontakte.lists.createdToast", { name: name.trim() }), "success");
      setName(""); setType("static");
      if (res) onCreated(res.id);
      onClose();
    } catch {
      toast(t("kontakte.create.createErrorToast"), "error");
    } finally { setBusy(false); }
  };

  // Render-Funktion (kein React-Komponenten-Wrapper im Render → kein State-Reset, lint-konform).
  const renderTypeCard = (id: "static" | "dynamic", Icon: typeof Users, label: string, desc: string, disabled?: boolean, hint?: string) => (
    <button type="button" disabled={disabled} onClick={() => setType(id)} data-tip={disabled ? hint : undefined}
      className={`flex-1 text-left p-3 rounded-[10px] border transition-colors ${disabled ? "opacity-50 cursor-not-allowed border-border" : type === id ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] cursor-pointer" : "border-border hover:bg-app-bg cursor-pointer"}`}>
      <Icon className={`w-4 h-4 mb-1.5 ${type === id && !disabled ? "text-[var(--sherloq-primary)]" : "text-text-muted"}`} />
      <span className="block text-[13px] font-bold text-text-primary">{label}</span>
      <span className="block text-[11px] text-text-muted leading-snug mt-0.5">{desc}</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-[var(--border-card)]">
          <DialogTitle className="typo-card-title text-text-primary">{t("kontakte.lists.newListTitle")}</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] text-text-muted font-semibold block mb-1">{t("kontakte.lists.nameLabel")}</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              placeholder={t("kontakte.lists.namePlaceholder")}
              className="w-full text-[13px] px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] outline-none" />
          </div>

          <div>
            <label className="text-[11px] text-text-muted font-semibold block mb-1.5">{t("kontakte.lists.chooseType")}</label>
            <div className="flex gap-2">
              {renderTypeCard("static", Users, t("kontakte.lists.static"), t("kontakte.lists.typeStaticDesc"))}
              {renderTypeCard("dynamic", Filter, t("kontakte.lists.dynamic"), t("kontakte.lists.typeDynamicDesc"), dynamicDisabled, t("kontakte.lists.dynamicNeedsFilter"))}
            </div>
            {dynamicDisabled && <p className="mt-1.5 text-[11px] text-text-muted">{t("kontakte.lists.dynamicNeedsFilter")}</p>}
          </div>
        </div>

        <div className="border-t border-[var(--border-card)] p-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg cursor-pointer disabled:opacity-50">{t("common.cancel")}</button>
          <button type="button" onClick={submit} disabled={!name.trim() || busy} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--sherloq-gradient)" }}>
            <Check className="w-3.5 h-3.5" /> {t("kontakte.lists.create")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
