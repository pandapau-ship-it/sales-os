/**
 * TopBar — primary navigation bar, 56px sticky header.
 * Follows migration spec: logo left, pill nav center (absolute), search + avatar right.
 * All values use design tokens — no hardcoded hex.
 * Sliding pill: single absolutely-positioned div that glides between tabs via offsetLeft measurement.
 */

import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sun,
  Target,
  Sprout,
} from "lucide-react";

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
}

// Labels via i18n key — resolved with t() at render time, never hardcoded.
const NAV_ITEMS = [
  { id: "meintag", labelKey: "nav.meintag", icon: <Sun    className="w-4 h-4" /> },
  { id: "hunting", labelKey: "nav.hunting", icon: <Target className="w-4 h-4" /> },
  { id: "farming", labelKey: "nav.farming", icon: <Sprout className="w-4 h-4" /> },
];

export default function TopBar({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
}: TopBarProps) {
  const { t } = useTranslation();
  // Track button DOM nodes so we can read offsetLeft + offsetWidth for the slider
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slider, setSlider] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeTab);
    const btn = buttonRefs.current[activeIndex];
    if (btn) {
      setSlider({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
    }
  }, [activeTab]);

  return (
    <header
      style={{
        height: "56px",
        background: "transparent",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
      className="px-6 flex items-center justify-between select-none relative"
    >
      {/* ── LOGO ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--sherloq-primary)",
            borderRadius: "var(--radius-pill)",
          }}
          className="flex items-center justify-center"
        >
          <span className="text-white font-semibold text-sm leading-none">S</span>
        </div>
        <div className="flex flex-col leading-none gap-[3px]">
          <span
            style={{ color: "var(--text-primary)", fontSize: 14 }}
            className="font-semibold tracking-tight"
          >
            Sherloq
          </span>
          <span
            style={{ color: "var(--text-muted)", fontSize: 10 }}
            className="uppercase tracking-wider font-mono"
          >
            SALES OS
          </span>
        </div>
      </div>

      {/* ── NAV (absolutely centered) ─────────────────────────── */}
      <nav
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: "3px",
        }}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5"
      >
        {/* Sliding background pill — moves to the active tab */}
        {slider.ready && (
          <div
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: slider.left,
              width: slider.width,
              background: "var(--sherloq-primary)",
              borderRadius: 9,
              transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
          />
        )}

        {NAV_ITEMS.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { buttonRefs.current[index] = el; }}
              onClick={() => setActiveTab(item.id)}
              style={{
                color: isActive ? "white" : "var(--text-body)",
                borderRadius: 9,
                position: "relative", // sits above the slider
                zIndex: 1,
              }}
              className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium cursor-pointer transition-colors duration-150${
                !isActive ? " hover:bg-[var(--app-bg)]" : ""
              }`}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* ── RIGHT: Cmd+K + Avatar ─────────────────────────────── */}
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
          style={{
            width: 30,
            height: 30,
            background: "var(--sherloq-primary)",
            borderRadius: 9,
          }}
          className="flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          OS
        </button>
      </div>
    </header>
  );
}
