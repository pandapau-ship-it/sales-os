/**
 * TaskFormular — generische Task-Maske (Anlegen + Bearbeiten): NUR das Formular,
 * keine Kontext-/KI-Meldungen. Größen/Token nach House-Style (vgl. AddSdrLeadPanel +
 * PanelField): Header 15px/bold, Feld-Labels 11px/semibold, Inputs px-3.5 py-2.5 auf
 * bg-app-bg, Buttons rounded-[10px]. Self-contained State aus `initial`. Prop-driven
 * (onSave/onClose, optional onToast). Tokens-only, reused i18n-Keys (hunter.drawers.noTask.*).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList, Mail, Phone, Calendar, Check, type LucideIcon } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export interface TaskFormInitial {
  title?: string;
  contact?: string;
  deal?: string; // 'demo' | 'enterprise' | 'none'
  channel?: string; // 'mail' | 'linkedin' | 'phone' | 'calendar' | 'other'
  description?: string;
  dueDate?: string; // yyyy-mm-dd
  dueTime?: string; // HH:mm
  priority?: string; // 'low' | 'medium' | 'high' | 'urgent'
  reminderActive?: boolean;
  reminderDate?: string;
  reminderTime?: string;
}

// House-Style-Klassen (wie AddSdrLeadPanel: FIELD/TRIGGER-Konstanten).
const LABEL = "text-[11px] font-semibold text-text-muted";
const INPUT =
  "w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold";

const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const CHANNELS: { key: string; Icon: LucideIcon | typeof LinkedinIcon }[] = [
  { key: "mail", Icon: Mail },
  { key: "linkedin", Icon: LinkedinIcon },
  { key: "phone", Icon: Phone },
  { key: "calendar", Icon: Calendar },
  { key: "other", Icon: ClipboardList },
];

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export interface TaskFormValues {
  title: string;
  description: string;
  channel: string; // 'mail' | 'linkedin' | 'phone' | 'calendar' | 'other' (Caller mappt mail→email)
  priority: string;
  dueDate: string;
  dueTime: string;
  deal: string; // Deal-Value (echte deal.id) oder 'none'
}

export default function TaskFormular({
  mode = "create", initial = {}, dealOptions, lockDeal = false, onClose, onSave,
}: {
  mode?: "create" | "edit";
  initial?: TaskFormInitial;
  /** Echte Deals des Kontakts (P3). Fehlt → nur „Kein Deal". */
  dealOptions?: { value: string; label: string }[];
  /** Deal fest vorgegeben (z.B. aus Keine-Task-Kachel) → Dropdown readonly, nicht änderbar. */
  lockDeal?: boolean;
  onClose: () => void;
  onSave: (values: TaskFormValues) => void;
  onToast?: (msg: string) => void;
}) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(initial.title ?? "");
  const [isError, setIsError] = useState(false);
  const [channel, setChannel] = useState(initial.channel ?? "mail");
  const [priority, setPriority] = useState(initial.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial.dueDate ?? plusDays(2));
  const [dueTime, setDueTime] = useState(initial.dueTime ?? "09:00");
  const [description, setDescription] = useState(initial.description ?? "");
  const [deal, setDeal] = useState(initial.deal ?? "none");

  const handleSave = () => {
    if (!title.trim()) {
      setIsError(true);
      return;
    }
    onSave({ title: title.trim(), description, channel, priority, dueDate, dueTime, deal });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[var(--sherloq-primary)]" />
            <h2 className="typo-card-title text-text-primary">
              {mode === "edit" ? t("hunter.drawers.noTask.editTask") : t("hunter.drawers.noTask.newTask")}
            </h2>
          </div>
          {mode === "create" && (
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
              {t("hunter.drawers.noTask.openedInstantly")}
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Titel */}
          <div className="space-y-1.5">
            <label className={LABEL}>{t("hunter.drawers.noTask.whatToDo")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (isError) setIsError(false); }}
              placeholder={t("hunter.drawers.noTask.taskTitlePlaceholder")}
              className={`w-full px-3.5 py-2.5 rounded-[10px] border outline-none transition-colors focus:border-[var(--sherloq-primary)] text-[13px] font-semibold ${isError ? "border-[var(--signal-warn-text)] bg-[var(--signal-warn-bg)]" : "border-border bg-app-bg"}`}
            />
          </div>

          {/* Kontakt & Deal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.contact")}</label>
              <input
                type="text"
                value={initial.contact ?? ""}
                readOnly
                className={`${INPUT} cursor-not-allowed text-text-muted`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.deal")}</label>
              {lockDeal ? (
                // Deal aus der Kachel vorgegeben → readonly (wie Kontakt), nicht änderbar.
                <input
                  type="text"
                  value={(dealOptions ?? []).find((o) => o.value === deal)?.label ?? deal}
                  readOnly
                  className={`${INPUT} cursor-not-allowed text-text-muted`}
                />
              ) : (
                <Select value={deal} onValueChange={setDeal}>
                  <SelectTrigger className="w-full px-3.5 py-2.5 rounded-[10px] border-border bg-app-bg text-[13px] font-semibold text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(dealOptions ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                    <SelectItem value="none">Kein Deal verknüpft</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Kanal */}
          <div className="space-y-2">
            <label className={LABEL}>{t("hunter.drawers.noTask.channel")}</label>
            <div className="flex gap-2">
              {CHANNELS.map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setChannel(key)}
                  aria-label={key} data-tip={key}
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${channel === key ? "bg-[var(--sherloq-primary)] text-on-accent border-transparent" : "bg-app-bg border-border text-text-muted hover:bg-app-bg"}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Beschreibung */}
          <div className="space-y-1.5">
            <label className={LABEL}>{t("hunter.drawers.noTask.descriptionOptional")}</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-border bg-app-bg outline-none focus:border-[var(--sherloq-primary)] transition-colors resize-none text-[13px] font-medium leading-relaxed min-h-[120px]"
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.dueDate")}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.time")}</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.priority")}</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1.5 rounded-[7px] text-[10px] font-bold cursor-pointer ${priority === p ? "bg-[var(--sherloq-primary)] text-on-accent" : "bg-app-bg text-text-muted"}`}
                  >
                    {t(`hunter.drawers.noTask.${p}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.assignee")}</label>
              <div className="flex items-center gap-2 bg-app-bg p-1.5 rounded-[10px]">
                <div className="w-6 h-6 rounded-full bg-sherloq-primary text-on-accent text-[10px] flex items-center justify-center font-bold">ME</div>
                <span className="text-[12px] font-bold text-text-body">{t("hunter.drawers.noTask.myself")}</span>
              </div>
            </div>
          </div>

          {/* Erinnerung — ausgegraut/deaktiviert ([D19]: Reminder-Feld + Auslöse-System fehlen) */}
          <div className="space-y-3 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-text-muted">{t("hunter.drawers.noTask.reminder")}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-muted">{t("hunter.panel.soon")}</span>
                <button
                  disabled
                  aria-label={t("hunter.panel.soon")} data-tip={t("hunter.panel.soon")}
                  className="w-11 h-6 rounded-full p-0.5 bg-border opacity-50 cursor-not-allowed"
                >
                  <span className="block w-5 h-5 rounded-full bg-app-surface shadow-sm translate-x-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <button onClick={handleSave} className="w-full py-3 text-on-accent rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
        <Check className="w-4 h-4" />
        {t("hunter.common.saveTask")}
      </button>
      <button onClick={onClose} className="w-full text-center text-[12px] font-bold text-text-muted hover:text-text-body transition-colors cursor-pointer">
        {t("hunter.common.cancel")}
      </button>
    </div>
  );
}
