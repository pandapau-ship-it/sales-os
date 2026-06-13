/**
 * SnoozeSettings — Admin-Settings-Sektion „Snooze-Regelwerk" (Design / Mock).
 * Gehört in Settings → Automation. NICHT verdrahtet (kein system_config-Write);
 * Speichern zeigt nur einen Toast. Werte später aus system_config:
 * snooze_max_count · snooze_max_days · snooze_escalation_type.
 * Nur Tokens aus index.css.
 */
import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/shared/Toast";

const DURATIONS = [
  { value: "1", label: "1 Tag" },
  { value: "3", label: "3 Tage" },
  { value: "7", label: "7 Tage" },
  { value: "14", label: "14 Tage" },
];
const ESCALATIONS = [
  { value: "task", label: "Task erstellen" },
  { value: "notification", label: "Admin benachrichtigen" },
  { value: "both", label: "Beides" },
];

const LABEL = "text-[12px] font-bold text-text-primary block";
const HINT = "text-[11px] text-text-muted mt-1";
const TRIGGER = "mt-1.5 rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary";

export default function SnoozeSettings() {
  const { toast } = useToast();
  const [maxCount, setMaxCount] = useState("3");
  const [maxDays, setMaxDays] = useState("7");
  const [escalation, setEscalation] = useState("both");

  return (
    <section className="w-full max-w-[640px] bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden font-sans">
      {/* HEADER */}
      <header className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--sherloq-primary)]" />
          <h3 className="text-[15px] font-bold text-text-primary">Snooze-Regelwerk</h3>
        </div>
        <p className="text-[12px] text-text-muted mt-1">
          Wie oft und wie lange Signale verschoben werden dürfen, bevor sie eskalieren.
        </p>
      </header>

      <div className="p-6 flex flex-col gap-5">
        {/* Feld 1 — Max. Snoozes pro Signal */}
        <div>
          <label className={LABEL}>Max. Snoozes pro Signal</label>
          <Input
            type="number"
            min={1}
            value={maxCount}
            onChange={(e) => setMaxCount(e.target.value)}
            className="mt-1.5 max-w-[120px]"
          />
          <p className={HINT}>Nach {maxCount || "X"} Snoozes wird das Signal eskaliert.</p>
        </div>

        {/* Feld 2 — Max. Snooze-Dauer */}
        <div>
          <label className={LABEL}>Max. Snooze-Dauer</label>
          <Select value={maxDays} onValueChange={setMaxDays}>
            <SelectTrigger className={`${TRIGGER} w-full max-w-[200px]`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Feld 3 — Eskalation bei Limit */}
        <div>
          <label className={LABEL}>Eskalation bei Limit</label>
          <Select value={escalation} onValueChange={setEscalation}>
            <SelectTrigger className={`${TRIGGER} w-full max-w-[260px]`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESCALATIONS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-6 py-4 border-t border-border-subtle flex justify-end bg-app-bg">
        <button
          type="button"
          onClick={() => toast("Einstellungen gespeichert ✓")}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          style={{ background: "var(--sherloq-gradient)" }}
        >
          <Check className="w-3.5 h-3.5" /> Speichern
        </button>
      </footer>
    </section>
  );
}
