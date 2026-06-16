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

export default function TaskFormular({
  mode = "create", initial = {}, onClose, onSave, onToast,
}: {
  mode?: "create" | "edit";
  initial?: TaskFormInitial;
  onClose: () => void;
  onSave: () => void;
  onToast?: (msg: string) => void;
}) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(initial.title ?? "");
  const [isError, setIsError] = useState(false);
  const [channel, setChannel] = useState(initial.channel ?? "mail");
  const [priority, setPriority] = useState(initial.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial.dueDate ?? plusDays(2));
  const [reminderActive, setReminderActive] = useState(initial.reminderActive ?? false);
  const [reminderDate, setReminderDate] = useState(initial.reminderDate ?? plusDays(1));
  const [reminderTime, setReminderTime] = useState(initial.reminderTime ?? "09:00");

  const toggleReminder = () => {
    onToast?.(reminderActive ? t("hunter.drawers.noTask.toastReminderOff") : t("hunter.drawers.noTask.toastReminderOn"));
    setReminderActive((v) => !v);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setIsError(true);
      return;
    }
    onSave();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[var(--sherloq-primary)]" />
            <h2 className="text-[15px] font-bold text-text-primary">
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
                value={initial.contact ?? "Sarah Jenkins"}
                readOnly
                className={`${INPUT} cursor-not-allowed text-text-muted`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.drawers.noTask.deal")}</label>
              <Select defaultValue={initial.deal ?? "demo"}>
                <SelectTrigger className="w-full px-3.5 py-2.5 rounded-[10px] border-border bg-app-bg text-[13px] font-semibold text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Demo vereinbart</SelectItem>
                  <SelectItem value="enterprise">Enterprise Upgrade (24.000€)</SelectItem>
                  <SelectItem value="none">Kein Deal verknüpft</SelectItem>
                </SelectContent>
              </Select>
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
              defaultValue={initial.description ?? ""}
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
              <input type="time" defaultValue={initial.dueTime ?? "09:00"} className={INPUT} />
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

          {/* Erinnerung */}
          <div className="space-y-3 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-text-body">{t("hunter.drawers.noTask.reminder")}</span>
              <button
                onClick={toggleReminder}
                aria-label={t("hunter.drawers.noTask.reminder")} data-tip={t("hunter.drawers.noTask.reminder")}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${reminderActive ? "bg-[var(--sherloq-primary)]" : "bg-border"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-app-surface shadow-sm transition-transform ${reminderActive ? "translate-x-[20px]" : "translate-x-0"}`} />
              </button>
            </div>
            {reminderActive && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className={LABEL}>{t("hunter.drawers.noTask.reminderDay")}</label>
                  <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className={INPUT} />
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL}>{t("hunter.drawers.noTask.time")}</label>
                  <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className={INPUT} />
                </div>
              </div>
            )}
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
