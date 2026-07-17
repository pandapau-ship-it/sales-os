/**
 * ZuListeDialog — „Zu Liste hinzufügen" (K-3b). Geteilt: Bulk (Kontakte-Tabelle) UND Einzel
 * (Kontakt-Detail-Panel). shadcn-Dialog.
 *
 * WICHTIG (Honesty, Oliver 2026-07-17): Manuelles Hinzufügen gilt NUR für STATISCHE Listen.
 * DYNAMISCHE Listen verwalten ihre Mitglieder automatisch über die Regel → hier NICHT wählbar,
 * sondern ausgegraut + Hinweis. „Neue statische Liste" legt inline eine an und fügt direkt hinzu.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Ban, ListPlus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLists, createList, addToList, type ListView } from "@/lib/db";
import { useToast } from "@/components/shared/toastContext";

export default function ZuListeDialog({
  open, organizationId, contactIds, createdBy, onClose, onDone,
}: {
  open: boolean;
  organizationId: string;
  contactIds: string[];
  createdBy: string | null;
  onClose: () => void;
  /** Erfolgs-Callback — die ELTERN toasten + invalidieren (garantiert gemountet, co-lokal mit Refresh). */
  onDone?: (info: { count: number; listName: string }) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const listsQuery = useQuery({
    queryKey: ["lists", organizationId],
    queryFn: () => getLists(organizationId),
    enabled: open,
    staleTime: 30_000,
  });
  const lists = listsQuery.data ?? [];

  const add = async (list: ListView) => {
    if (list.type !== "static" || busy) return;
    setBusy(true);
    try {
      await addToList(organizationId, list.id, contactIds);
      onDone?.({ count: contactIds.length, listName: list.name });
      onClose();
    } catch {
      toast(t("kontakte.lists.actionErrorToast"), "error");
    } finally { setBusy(false); }
  };

  const createAndAdd = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await createList(organizationId, { name: newName.trim(), type: "static" }, createdBy);
      if (res) await addToList(organizationId, res.id, contactIds);
      const listName = newName.trim();
      setNewName(""); setCreating(false);
      onDone?.({ count: contactIds.length, listName });
      onClose();
    } catch {
      toast(t("kontakte.lists.actionErrorToast"), "error");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-[var(--border-card)]">
          <DialogTitle className="typo-card-title text-text-primary">
            {t("kontakte.lists.addToListTitle")}
            <span className="ml-2 text-text-muted font-normal text-[13px]">{t("kontakte.lists.forNContacts", { count: contactIds.length })}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {listsQuery.isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 rounded-[8px] bg-app-bg animate-pulse" />)}</div>
          ) : lists.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-text-muted">{t("kontakte.lists.none")}</p>
          ) : (
            lists.map((l) => {
              const dyn = l.type === "dynamic";
              return (
                <button key={l.id} type="button" disabled={dyn || busy} onClick={() => add(l)}
                  data-tip={dyn ? t("kontakte.lists.dynamicNotSelectable") : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-left transition-colors ${dyn ? "opacity-50 cursor-not-allowed" : "hover:bg-app-bg cursor-pointer"}`}>
                  {dyn ? <Ban className="w-4 h-4 text-text-muted shrink-0" /> : <ListPlus className="w-4 h-4 text-[var(--sherloq-primary)] shrink-0" />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-text-primary truncate">{l.name}</span>
                    <span className="block text-[11px] text-text-muted">
                      {dyn ? t("kontakte.lists.dynamicHint") : t("kontakte.lists.memberCount", { count: l.memberCount })}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-[var(--border-card)] p-2">
          {creating ? (
            <div className="flex items-center gap-2 p-1">
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void createAndAdd(); }}
                placeholder={t("kontakte.lists.namePlaceholder")}
                className="flex-1 text-[13px] px-3 py-2 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[8px] outline-none" />
              <button type="button" onClick={createAndAdd} disabled={!newName.trim() || busy}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[8px] text-on-accent text-[12px] font-bold disabled:opacity-40 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
                <Check className="w-3.5 h-3.5" /> {t("kontakte.lists.create")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-[13px] font-semibold text-[var(--sherloq-primary)] hover:bg-app-bg cursor-pointer">
              <Plus className="w-4 h-4" /> {t("kontakte.lists.newStaticList")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
