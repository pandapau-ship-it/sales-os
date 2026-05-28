/**
 * TopBar — primary navigation bar, 56px sticky header.
 * Follows migration spec: logo left, pill nav center (absolute), search + avatar right.
 * All values use design tokens — no hardcoded hex.
 */

import React from "react";
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

const NAV_ITEMS = [
  { id: "meintag", label: "Mein Tag", icon: <Sun    className="w-4 h-4" /> },
  { id: "hunting", label: "Hunting",  icon: <Target className="w-4 h-4" /> },
  { id: "farming", label: "Farming",  icon: <Sprout className="w-4 h-4" /> },
];

export default function TopBar({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
}: TopBarProps) {
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

      {/* ── NAV PILLS (absolutely centered) ──────────────────── */}
      <nav
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-pill)",
          boxShadow: "var(--shadow-nav)",
          padding: "4px",
        }}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={
                isActive
                  ? {
                      background: "var(--sherloq-primary)",
                      color: "white",
                      borderRadius: "var(--radius-pill)",
                    }
                  : {
                      color: "var(--text-body)",
                      borderRadius: "var(--radius-pill)",
                    }
              }
              className={`flex items-center gap-2 px-5 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer${
                !isActive ? " hover:bg-[var(--app-bg)]" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── RIGHT: Cmd+K + Avatar ────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: 180,
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            color: "var(--text-muted)",
            fontSize: 12,
            padding: "6px 12px",
            background: "var(--surface)",
          }}
          className="flex items-center justify-between cursor-pointer transition-colors hover:bg-[var(--app-bg)]"
        >
          <span>Suchen...</span>
          <span
            style={{
              background: "var(--app-bg)",
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
            width: 32,
            height: 32,
            background: "var(--sherloq-primary)",
            borderRadius: "var(--radius-pill)",
          }}
          className="flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer"
        >
          OS
        </button>
      </div>
    </header>
  );
}
