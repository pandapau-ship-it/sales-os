/**
 * PanelField — Label (+ Pflicht-Stern / optionaler Hinweis) über einem Eingabe-Element.
 * Wiederverwendbarer Feld-Wrapper für Panel-Formulare.
 */
import type { ReactNode } from "react";

export default function PanelField({
  label, required = false, hint, children,
}: { label: string; required?: boolean; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-text-muted font-semibold block mb-1">
        {label}
        {required && <span className="text-[var(--signal-danger-text)]"> *</span>}
        {hint && <span className="font-normal text-text-muted"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}
