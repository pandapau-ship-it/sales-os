/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalendarCheck,
  Bell,
  Star,
  HelpCircle,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void; // reserved — Search lives in TopBar Cmd+K
}

export default function Sidebar({
  activeTab: _activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenSearch: _onOpenSearch,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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
      // Badge-Count = notifications WHERE read=false (live via Realtime).
      // Quelle + Event-Modell: siehe CLAUDE.md → "Notifications".
      action: () => {},
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

          {/* Divider */}
          <div className="w-[28px] h-px bg-border my-1" />

          {/* Theme Toggle — Sonne/Mond */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                aria-label={isDark ? "Light Mode" : "Dark Mode"}
                className="w-[40px] h-[40px] rounded-[10px] text-text-muted hover:bg-app-bg hover:text-text-primary flex items-center justify-center transition-all duration-150 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} />
                ) : (
                  <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isDark ? "Light Mode" : "Dark Mode"}
            </TooltipContent>
          </Tooltip>

          {/* Profil / Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenSettings}
                aria-label="Profil"
                className="w-[34px] h-[34px] mt-1 rounded-[10px] bg-sherloq-primary text-white text-[11px] font-semibold flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              >
                OS
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Profil</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
