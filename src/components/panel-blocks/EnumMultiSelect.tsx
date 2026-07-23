/**
 * EnumMultiSelect — Mehrfachauswahl bekannter Enum-Werte (FUND 2). Für enum-Felder mit Listen-Operatoren
 * (`in`/`not_in`) — statt Freitext-Komma eine echte Auswahl aus `enumValues`. Speichert `string[]`.
 * shadcn `Popover` (kein Sheet-Kontext im Editor → Standard-Portal ok). Tokens-only, i18n-agnostisch (Labels via prop).
 */
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnumMultiSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  labelFor: (value: string) => string;
  placeholder: string;
  invalid?: boolean;
}

export default function EnumMultiSelect({ options, selected, onChange, labelFor, placeholder, invalid }: EnumMultiSelectProps) {
  const sel = Array.isArray(selected) ? selected : [];
  const toggle = (v: string) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);
  const label = sel.length === 0 ? placeholder : sel.map(labelFor).join(", ");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 min-w-[140px] flex-1 items-center justify-between gap-2 rounded-[8px] border bg-app-bg px-3 text-[13px] transition-colors focus:outline-none focus:border-sherloq-primary",
            invalid ? "border-signal-urgent" : "border-border",
            sel.length === 0 ? "text-text-muted" : "text-text-primary",
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-1" align="start">
        <div className="max-h-[240px] overflow-y-auto">
          {options.map((v) => {
            const on = sel.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggle(v)}
                className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-text-body transition-colors hover:bg-app-bg"
              >
                <span className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border",
                  on ? "border-sherloq-primary bg-sherloq-primary text-on-accent" : "border-border",
                )}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                {labelFor(v)}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
