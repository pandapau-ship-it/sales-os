/**
 * CommandPalette — Cmd+K (Navigation + Quick Actions).
 *
 * STRIKTE REGEL (CLAUDE.md): Cmd+K = NUR Navigation + Schnellaktionen.
 * KEIN AI-Chat — das ist ein separates Interface (Phase 3).
 *
 * Baut auf dem shadcn-Command-Primitiv (cmdk) auf. Navigation via react-router.
 * Quick Actions sind in Phase 0 Platzhalter (echte Anlage-Flows folgen später).
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sun,
  Bot,
  Target,
  Sprout,
  Users,
  Building2,
  Bell,
  Settings as SettingsIcon,
  UserPlus,
  CheckSquare,
  Briefcase,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON = "w-4 h-4 text-text-muted";

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const go = (route: string) => {
    navigate(`/app/${route}`);
    onOpenChange(false);
  };

  const navItems = [
    { route: "meintag", labelKey: "nav.meintag", icon: <Sun className={ICON} /> },
    { route: "ai-sdr", labelKey: "nav.aisdr", icon: <Bot className={ICON} /> },
    { route: "hunter", labelKey: "nav.hunter", icon: <Target className={ICON} /> },
    { route: "farmer", labelKey: "nav.farmer", icon: <Sprout className={ICON} /> },
    { route: "kontakte", labelKey: "nav.kontakte", icon: <Users className={ICON} /> },
    { route: "companies", labelKey: "nav.companies", icon: <Building2 className={ICON} /> },
    { route: "notifications", labelKey: "nav.notifications", icon: <Bell className={ICON} /> },
    { route: "settings", labelKey: "nav.settings", icon: <SettingsIcon className={ICON} /> },
  ];

  const quickActions = [
    { key: "newContact", labelKey: "cmdk.newContact", icon: <UserPlus className={ICON} /> },
    { key: "newTask", labelKey: "cmdk.newTask", icon: <CheckSquare className={ICON} /> },
    { key: "newDeal", labelKey: "cmdk.newDeal", icon: <Briefcase className={ICON} /> },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("cmdk.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("cmdk.empty")}</CommandEmpty>

        <CommandGroup heading={t("cmdk.navigation")}>
          {navItems.map((item) => (
            <CommandItem
              key={item.route}
              onSelect={() => go(item.route)}
              className="rounded-[9px] gap-2.5"
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t("cmdk.quickActions")}>
          {quickActions.map((a) => (
            <CommandItem
              key={a.key}
              // Phase 0: Anlage-Flows folgen später — vorerst Palette schließen.
              onSelect={() => onOpenChange(false)}
              className="rounded-[9px] gap-2.5"
            >
              {a.icon}
              <span>{t(a.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
