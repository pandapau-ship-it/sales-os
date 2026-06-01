/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  CalendarCheck,
  Bell,
  Star,
  HelpCircle,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void; // reserved — Search lives in TopBar Cmd+K
}

export default function Sidebar({
  activeTab: _activeTab,
  setActiveTab,
  darkMode: _darkMode,
  setDarkMode: _setDarkMode,
  onOpenSettings,
  onOpenSearch: _onOpenSearch,
}: SidebarProps) {
  // Oberer Bereich — kein Search (bereits in TopBar Cmd+K)
  const topItems = [
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
      action: () => {}, // placeholder — kommt mit Realtime
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
    <TooltipProvider delayDuration={300}>
      <aside className="w-[56px] min-w-[56px] h-[calc(100vh-80px)] bg-app-surface rounded-[16px] shadow-card flex flex-col items-center py-4 select-none sticky top-[68px] ml-4 z-20">
        {/* Top Icons */}
        <div className="flex flex-col gap-2 w-full px-2">
          {topItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={item.action}
                  className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer text-text-muted hover:bg-app-bg hover:text-text-primary"
                >
                  {item.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Icons */}
        <div className="flex flex-col gap-2 w-full px-2 items-center">
          {bottomItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={item.action}
                  className="w-[40px] h-[40px] rounded-[10px] text-text-muted hover:bg-app-bg hover:text-text-primary flex items-center justify-center transition-all duration-150 cursor-pointer"
                >
                  {item.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}
