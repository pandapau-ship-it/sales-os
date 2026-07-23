/**
 * ChipInput — freie Listen-Werte als Tokens (FUND 2). Für Listen-Operatoren auf freien Feldern
 * (text/number `in`/`not_in`, tags `has_any`) — statt Komma-Freitext sichtbare Chips. Enter oder Komma
 * legt einen Chip an, Backspace im leeren Feld entfernt den letzten, jeder Chip hat ein ✕. Speichert
 * `string[]` bzw. `number[]` (numeric). Tokens-only, i18n via prop.
 */
import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipInputProps {
  value: Array<string | number>;
  onChange: (values: Array<string | number>) => void;
  numeric?: boolean;
  placeholder: string;
  invalid?: boolean;
}

export default function ChipInput({ value, onChange, numeric, placeholder, invalid }: ChipInputProps) {
  const { t } = useTranslation();
  const chips = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");

  const commit = () => {
    const raw = draft.trim();
    if (!raw) return;
    const v: string | number = numeric ? Number(raw) : raw;
    if (numeric && Number.isNaN(v as number)) { setDraft(""); return; } // keine ungültige Zahl aufnehmen
    if (!chips.some((c) => String(c) === String(v))) onChange([...chips, v]); // kein Duplikat
    setDraft("");
  };
  const removeAt = (i: number) => onChange(chips.filter((_, idx) => idx !== i));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
    else if (e.key === "Backspace" && draft === "" && chips.length > 0) { e.preventDefault(); removeAt(chips.length - 1); }
  };

  return (
    <div className={cn(
      "flex min-h-9 flex-1 flex-wrap items-center gap-1.5 rounded-[8px] border bg-app-bg px-2 py-1.5 transition-colors focus-within:border-sherloq-primary",
      invalid ? "border-signal-urgent" : "border-border",
    )}>
      {chips.map((c, i) => (
        <span key={`${c}-${i}`} className="inline-flex items-center gap-1 rounded-[6px] bg-app-surface px-2 py-0.5 text-[12px] text-text-body border border-border">
          {String(c)}
          <button type="button" onClick={() => removeAt(i)} aria-label={t("common.delete")} data-tip={t("common.delete")} className="text-text-muted hover:text-signal-urgent">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type={numeric ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={chips.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}
