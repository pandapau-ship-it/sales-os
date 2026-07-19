/**
 * Sidebar — linke Icon-Rail, finale Struktur (verbindlich, CLAUDE.md → Sidebar).
 *
 * Genau 8 Icons (kein Posteingang-Icon, keine Bell/Star/Maximize):
 *   Sun → meintag · Bot → ai-sdr · Target → hunter · Sprout → farmer
 *   ── Users → kontakte · Building2 → companies
 *   ── Settings · Avatar (Profil)
 * Dark-Mode-Toggle sitzt im Avatar-Bereich (Sonne/Mond).
 *
 * Screen-Icons sind modul-gegated (useModules) — nicht aktive Module blenden ihr
 * Icon aus (Phase 0: alle aktiv). Aktives Icon = Brand-Gradient + weiß.
 */

import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sun,
  Moon,
  Bot,
  Target,
  Sprout,
  Users,
  Building2,
  Settings as SettingsIcon,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useModules, type ModuleKey } from "@/hooks/useModules";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { NAV } from "@/lib/navBehavior";

interface NavIcon {
  route: string;
  labelKey: string;
  icon: React.ReactNode;
  module?: ModuleKey; // wenn gesetzt: nur sichtbar wenn Modul aktiv
}

const ICON = "w-[18px] h-[18px]";

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { hasModule } = useModules();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const doLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const screens: NavIcon[] = [
    { route: "meintag", labelKey: "nav.meintag", icon: <Sun className={ICON} strokeWidth={1.5} /> },
    { route: "ai-sdr", labelKey: "nav.aisdr", icon: <Bot className={ICON} strokeWidth={1.5} />, module: "ai_sdr" },
    { route: "hunter", labelKey: "nav.hunter", icon: <Target className={ICON} strokeWidth={1.5} />, module: "hunter" },
    { route: "farmer", labelKey: "nav.farmer", icon: <Sprout className={ICON} strokeWidth={1.5} />, module: "farmer" },
  ];

  const data: NavIcon[] = [
    { route: "kontakte", labelKey: "nav.kontakte", icon: <Users className={ICON} strokeWidth={1.5} /> },
    { route: "companies", labelKey: "nav.companies", icon: <Building2 className={ICON} strokeWidth={1.5} /> },
  ];

  const isActive = (route: string) => pathname.startsWith(`/app/${route}`);

  const renderIcon = (item: NavIcon) => {
    if (item.module && !hasModule(item.module)) return null;
    const active = isActive(item.route);
    return (
      <Tooltip key={item.route}>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate(`/app/${item.route}`)}
            aria-label={t(item.labelKey)}
            aria-current={active ? "page" : undefined}
            style={active ? { background: NAV.activeBg } : undefined}
            className={`w-[40px] h-[40px] ${NAV.radius} ${NAV.iconBtn} ${active ? NAV.activeIcon : NAV.inactiveIcon}`}
          >
            {item.icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={`w-[56px] min-w-[56px] h-[calc(100vh-80px)] ${NAV.surface} ${NAV.radius} flex flex-col items-center py-4 select-none sticky top-[68px] ml-4 z-20`}>
        {/* Screens */}
        <div className="flex flex-col gap-2 items-center">{screens.map(renderIcon)}</div>

        <div className="w-[28px] h-px bg-border my-3" />

        {/* Datenbank */}
        <div className="flex flex-col gap-2 items-center">{data.map(renderIcon)}</div>

        <div className="flex-1" />

        {/* Unten: Settings + Theme-Toggle + Avatar */}
        <div className="flex flex-col gap-2 items-center">
          {renderIcon({
            route: "settings",
            labelKey: "nav.settings",
            icon: <SettingsIcon className={ICON} strokeWidth={1.5} />,
          })}

          <div className="w-[28px] h-px bg-border my-1" />

          {/* Dark-Mode-Toggle (Avatar-Bereich) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                aria-label={isDark ? t("theme.light") : t("theme.dark")}
                className="w-[32px] h-[32px] rounded-[10px] text-text-muted hover:bg-app-bg hover:text-text-primary flex items-center justify-center transition-all duration-150 cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isDark ? t("theme.light") : t("theme.dark")}</TooltipContent>
          </Tooltip>

          {/* Avatar / Profil — Dropdown mit Logout (Platz für „Mein Profil" folgt in SET-2) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={t("nav.profil")}
                    className="w-[34px] h-[34px] mt-1 rounded-[10px] bg-sherloq-primary text-on-accent text-[11px] font-semibold flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    OS
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">{t("nav.profil")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="end" className="w-56">
              {user?.email && (
                <>
                  <DropdownMenuLabel className="truncate font-normal text-text-muted">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem disabled>
                <UserCircle className="w-4 h-4" />
                {t("auth.myProfile")}
                <span className="ml-auto text-[10px] text-text-muted">{t("common.comingSoon")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { void doLogout(); }}>
                <LogOut className="w-4 h-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
