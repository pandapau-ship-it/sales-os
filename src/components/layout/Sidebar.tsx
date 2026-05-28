/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Search,
  CalendarCheck,
  Bell,
  Star,
  HelpCircle,
  Settings,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  activeTab: _activeTab,
  setActiveTab,
  darkMode: _darkMode,
  setDarkMode: _setDarkMode,
  onOpenSettings,
  onOpenSearch,
}: SidebarProps) {
  // Oberer Bereich (Globale Schnellzugriffe)
  const topItems = [
    {
      id: "search",
      icon: <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Suche (Cmd+K)",
      action: onOpenSearch,
    },
    {
      id: "calendar",
      icon: <CalendarCheck className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Aufgaben & Termine",
      action: () => setActiveTab("meintag"),
    },
    {
      id: "notifications",
      icon: <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Benachrichtigungen",
      action: () => {}, // placeholder
    },
  ];

  // Unterer Bereich / Fixer Footer
  const bottomItems = [
    {
      id: "premium",
      icon: <Star className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Premium Plan",
      action: () => setActiveTab("system"),
    },
    {
      id: "help",
      icon: <HelpCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Hilfe",
      action: () => alert("Hilfe Center öffnen..."),
    },
    {
      id: "settings",
      icon: <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />,
      tooltip: "Einstellungen",
      action: onOpenSettings,
    },
  ];

  return (
    <aside className="w-[56px] min-w-[56px] h-[calc(100vh-80px)] bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center py-4 select-none sticky top-[68px] ml-4 z-20">
      {/* Top Icons */}
      <div className="flex flex-col gap-2 w-full px-2">
        {topItems.map((item) => (
          <div
            key={item.id}
            className="relative group flex justify-center w-full"
          >
            <button
              onClick={item.action}
              className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-all duration-200 cursor-pointer text-[#868E96] hover:bg-[#F8F9FA] hover:text-[#212529]"
            >
              {item.icon}
            </button>
            <div className="absolute left-[64px] top-1/2 -translate-y-1/2 bg-[#212529] text-white text-[13px] font-sans font-medium px-3 py-1.5 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md z-30">
              {item.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* Spacer to push bottom icons down */}
      <div className="flex-1" />

      {/* Bottom Icons */}
      <div className="flex flex-col gap-2 w-full px-2 items-center">
        {bottomItems.map((item) => (
          <div
            key={item.id}
            className="relative group flex justify-center w-full"
          >
            <button
              onClick={item.action}
              className="w-[40px] h-[40px] rounded-[12px] text-[#868E96] hover:bg-[#F8F9FA] hover:text-[#212529] flex items-center justify-center transition-all duration-150 cursor-pointer"
            >
              {item.icon}
            </button>
            <div className="absolute left-[64px] top-1/2 -translate-y-1/2 bg-[#212529] text-white text-[13px] font-sans font-medium px-3 py-1.5 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md z-30">
              {item.tooltip}
            </div>
          </div>
        ))}

        {/* User Avatar */}
        <div className="relative group mt-2 flex justify-center w-full">
          <button className="w-8 h-8 rounded-full bg-[#125455] text-white font-sans text-[12px] font-semibold flex items-center justify-center shadow-[0_4px_15px_rgb(23,82,83,0.2)] hover:opacity-90 transition-opacity cursor-pointer">
            AM
          </button>
          <div className="absolute left-[64px] top-1/2 -translate-y-1/2 bg-[#212529] text-white text-[13px] font-sans font-medium px-3 py-1.5 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md z-30">
            Profil & Logout
          </div>
        </div>
      </div>
    </aside>
  );
}
