/**
 * TaskAnlegenForm — „Keine Task"-Action-Panel-Inhalt (Header + Kontext-/KI-Meldungen)
 * für den NoTaskDrawer. Das eigentliche Task-Formular kommt aus dem geteilten Block
 * `TaskFormular` — identisch zur Task-Maske im Info-Panel (eine Quelle). Sheet-Shell +
 * Toast leben im Drawer; hier nur der Inhalt. Prop-driven (Toast via onToast).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X, Sparkles, Mail } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import TaskFormular from "./TaskFormular";

interface NoTaskPerson { name: string; company: string; }

const AI_NOTE = "AI-Notiz: Demo war positiv. ROI-Dokument und konkretes Angebot als nächsten Schritt senden.";

export default function TaskAnlegenForm({
  person, onClose, onToast,
}: { person: NoTaskPerson; onClose: () => void; onToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const s = person;

  // KI-Vorschlag „Übernehmen" füllt den Titel → Formular über key neu mounten.
  const [appliedTitle, setAppliedTitle] = useState("ROI-Dokument senden");
  const [formKey, setFormKey] = useState(0);

  const handleApplySuggestion = () => {
    setAppliedTitle("ROI-Dokument senden");
    setFormKey((k) => k + 1);
    onToast(t("hunter.drawers.noTask.toastApplied"));
  };

  const handleSave = () => {
    onToast(`${t("hunter.drawers.noTask.toastSaved")} ✓`);
    setTimeout(() => onClose(), 1100);
  };

  const handleCancel = () => {
    onToast(t("hunter.drawers.noTask.toastCancelled"));
    setTimeout(() => onClose(), 1100);
  };

  return (
    <>
      {/* HEADER */}
      <header className="h-[74px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={s.name || "Sarah Jenkins"} size={44} className="shadow-sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="typo-card-title text-text-primary leading-none">{s.name || "Sarah Jenkins"}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] text-[9px] font-extrabold tracking-wide">
                <AlertTriangle className="w-2.5 h-2.5" /> {t("hunter.card.noTask")}
              </span>
            </div>
            <p className="text-[11px] font-medium text-text-muted mt-1">{s.company || "CloudSphere"}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app-surface custom-scrollbar">
        {/* BLOCK 1: KONTEXT */}
        <section className="space-y-3">
          <span className="typo-section-label text-[var(--signal-warn-text)] flex items-center gap-1.5">
            <AlertTriangle className="w-2.5 h-2.5" /> {t("hunter.drawers.noTask.noTaskStored")}
          </span>
          <div className="p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-xl text-[13px] text-[var(--signal-warn-text)] font-semibold leading-relaxed">
            {t("hunter.drawers.noTask.everyDealNeedsTask")}
          </div>
          <div className="p-4 bg-app-surface border border-[var(--border-card)] rounded-[12px]">
            <span className="typo-section-label text-text-muted block mb-1">
              {t("hunter.drawers.noTask.dealInfo")}
            </span>
            <p className="text-[13px] text-text-body font-semibold leading-relaxed">
              Stage: Demo vereinbart · Neu in Pipeline · vor 3 Tagen
            </p>
          </div>
        </section>

        {/* BLOCK 2: KI VORSCHLAG */}
        <section className="bg-[var(--signal-teal-bg)] border border-[var(--signal-success-bg)] rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--sherloq-primary)] uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {t("hunter.drawers.noTask.kiSuggests")}
          </div>
          <div>
            <h4 className="typo-card-title text-text-primary leading-tight">ROI-Dokument senden</h4>
            <p className="text-[13px] font-medium text-text-body leading-relaxed mt-2">
              Demo war positiv — konkretes Angebot als nächster Schritt sinnvoll.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--sherloq-primary)]">
              <Mail className="w-3.5 h-3.5" /> {t("hunter.drawers.noTask.emailRecommended")}
            </span>
            <button onClick={handleApplySuggestion} className="px-3 py-1.5 bg-[var(--sherloq-primary)] text-on-accent rounded-[10px] text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity">
              {t("hunter.common.apply")}
            </button>
          </div>
        </section>

        {/* TASK-FORMULAR (geteilter Block — identisch zum Info-Panel) */}
        <TaskFormular
          key={formKey}
          mode="create"
          initial={{ contact: s.name || "Sarah Jenkins", title: appliedTitle, description: AI_NOTE, deal: "demo", channel: "mail", priority: "medium" }}
          onClose={handleCancel}
          onSave={handleSave}
          onToast={onToast}
        />
      </div>
    </>
  );
}
