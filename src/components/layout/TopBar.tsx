/**
 * TopBar — primäre Navigation, 56px sticky Header.
 * Logo links · 4 Pills zentriert (Sliding-Pill) · Cmd+K + Avatar rechts.
 *
 * Verbindlich: Mein Tag · AI SDR · Hunter · Farmer (nicht Hunting/Farming).
 * Nav-Container rounded-[12px], Tabs rounded-[9px], aktiv = Brand-Gradient + weiß.
 * Alle Texte über t(), keine hardcodierten Farben (Tokens / Brand-Gradient).
 */

import { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sun, Bot, Target, Sprout } from "lucide-react";

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

const ICON = "w-4 h-4";

const NAV_ITEMS = [
  { route: "meintag", labelKey: "nav.meintag", icon: <Sun className={ICON} /> },
  { route: "ai-sdr", labelKey: "nav.aisdr", icon: <Bot className={ICON} /> },
  { route: "hunter", labelKey: "nav.hunter", icon: <Target className={ICON} /> },
  { route: "farmer", labelKey: "nav.farmer", icon: <Sprout className={ICON} /> },
];

export default function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((i) => pathname.startsWith(`/app/${i.route}`)),
  );

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slider, setSlider] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const btn = buttonRefs.current[activeIndex];
    if (btn) setSlider({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
  }, [activeIndex, t]);

  return (
    <header
      style={{ height: 56, background: "transparent", position: "sticky", top: 0, zIndex: 30 }}
      className="px-6 flex items-center justify-between select-none relative"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          style={{ width: 32, height: 32, background: "var(--sherloq-primary)", borderRadius: "var(--radius-btn)" }}
          className="flex items-center justify-center"
        >
          <span className="text-white font-semibold text-sm leading-none">S</span>
        </div>
        <div className="flex flex-col leading-none gap-[3px]">
          <span style={{ color: "var(--text-primary)", fontSize: 14 }} className="font-semibold tracking-tight">
            Sherloq
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 10 }} className="uppercase tracking-wider font-mono">
            SALES OS
          </span>
        </div>
      </div>

      {/* Nav (absolut zentriert) */}
      <nav
        style={{ background: "var(--surface)", borderRadius: 12, padding: 3 }}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 shadow-nav"
      >
        {slider.ready && (
          <div
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: slider.left,
              width: slider.width,
              background: "var(--sherloq-gradient)",
              borderRadius: 9,
              transition: "left 200ms cubic-bezier(0.4,0,0.2,1), width 200ms cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "none",
            }}
          />
        )}
        {NAV_ITEMS.map((item, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={item.route}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => navigate(`/app/${item.route}`)}
              style={{ color: active ? "white" : "var(--text-body)", borderRadius: 9, position: "relative", zIndex: 1 }}
              className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium cursor-pointer transition-colors duration-150${
                !active ? " hover:bg-[var(--app-bg)]" : ""
              }`}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Cmd+K + Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: 176,
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            color: "var(--text-muted)",
            fontSize: 12,
            padding: "5px 10px",
            background: "var(--surface)",
          }}
          className="flex items-center justify-between cursor-pointer transition-colors hover:bg-[var(--app-bg)]"
        >
          <span>{t("common.search")}</span>
          <span
            style={{
              background: "var(--app-bg)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "1px 5px",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            ⌘K
          </span>
        </button>

        <button
          style={{ width: 30, height: 30, background: "var(--sherloq-primary)", borderRadius: 9 }}
          className="flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          OS
        </button>
      </div>
    </header>
  );
}
