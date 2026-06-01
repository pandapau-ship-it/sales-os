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

      {/* ── NAV (absolutely centered) ─────────────────────────── */}
      <nav
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: "3px",
        }}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={
                isActive
                  ? { background: "var(--sherloq-primary)", color: "white", borderRadius: 10 }
                  : { color: "var(--text-body)", borderRadius: 10 }
              }
              className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer${
                !isActive ? " hover:bg-[var(--app-bg)]" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
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
          <span>Suchen...</span>
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
