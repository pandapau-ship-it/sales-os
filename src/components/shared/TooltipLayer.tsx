/**
 * TooltipLayer — GLOBALE Hover-Tooltips für Icon-Buttons (und alles mit `data-tip`).
 * Einmal in der App gemountet (App.tsx). Lauscht delegiert auf `[data-tip]`, rendert
 * den Tooltip per Portal an <body> (position: fixed) → sofort sichtbar, kein Clipping
 * durch overflow-hidden/scroll-Container, getönt via Tokens. Kein Wrappen je Button nötig:
 * Button bekommt nur `data-tip="Löschen"` (siehe Design-Invariant „Icon-Buttons").
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TipState { label: string; x: number; y: number; }

export default function TooltipLayer() {
  const [tip, setTip] = useState<TipState | null>(null);

  useEffect(() => {
    const findTip = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest("[data-tip]") as HTMLElement | null) : null;

    const onOver = (e: MouseEvent) => {
      const el = findTip(e.target);
      const label = el?.getAttribute("data-tip");
      if (el && label) {
        const r = el.getBoundingClientRect();
        setTip({ label, x: r.left + r.width / 2, y: r.top });
      } else {
        setTip(null);
      }
    };
    const hide = () => setTip(null);

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", hide);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);

  if (!tip) return null;

  return createPortal(
    <div
      role="tooltip"
      style={{ position: "fixed", left: tip.x, top: tip.y - 8, transform: "translate(-50%, -100%)" }}
      className="z-[100] pointer-events-none px-2 py-1 rounded-[6px] bg-inverse-surface text-on-accent text-[11px] font-semibold shadow-md whitespace-nowrap animate-fade-in max-w-[240px] truncate"
    >
      {tip.label}
    </div>,
    document.body,
  );
}
