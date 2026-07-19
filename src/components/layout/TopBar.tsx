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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sun, Bot, Target, Sprout, Bell } from "lucide-react";
import { NAV } from "@/lib/navBehavior";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useModules, type ModuleKey } from "@/hooks/useModules";
import { getUnreadNotificationCount, getNavPreferences } from "@/lib/db";
import { NAV_DEFAULTS } from "@/lib/settingsDefaults";
import { subscribeToNotifications } from "@/lib/realtime";

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

const ICON = "w-4 h-4";

// Primäre Sektionen (nur diese 4 zeigt die TopBar). Sichtbarkeit/Reihenfolge steuern
// Firmen-Entitlement (useModules) UND persönliche Ansicht-Pref (user_preferences) — GENAU wie Sidebar.
const PRIMARY_NAV: Record<string, { labelKey: string; icon: React.ReactNode; module?: ModuleKey }> = {
  meintag: { labelKey: "nav.meintag", icon: <Sun className={ICON} /> },
  "ai-sdr": { labelKey: "nav.aisdr", icon: <Bot className={ICON} />, module: "ai_sdr" },
  hunter: { labelKey: "nav.hunter", icon: <Target className={ICON} />, module: "hunter" },
  farmer: { labelKey: "nav.farmer", icon: <Sprout className={ICON} />, module: "farmer" },
};

export default function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const { hasModule } = useModules();
  const qc = useQueryClient();

  // Persönliche Ansicht-Prefs — SELBER Query-Key wie Sidebar/AppearanceTab → Änderung wirkt sofort,
  // gleichzeitig links UND oben, ohne Reload.
  const navPrefsQuery = useQuery({
    enabled: !!user?.id,
    queryKey: ["navPrefs", user?.id],
    queryFn: () => getNavPreferences(user!.id, organizationId),
    staleTime: 60_000,
  });
  const prefs = navPrefsQuery.data ?? NAV_DEFAULTS;

  // Reihenfolge aus der Pref, Ausgeblendetes raus, dann Firmen-Entitlement (beide Ebenen, AND).
  const NAV_ITEMS = prefs.order
    .filter((r) => r in PRIMARY_NAV && !prefs.hidden.includes(r))
    .map((r) => ({ route: r, ...PRIMARY_NAV[r] }))
    .filter((it) => !it.module || hasModule(it.module));

  // Glocken-Badge: echter Ungelesen-Count (RLS → nur eigene; ohne Session leer). Realtime hält ihn live.
  const unreadQuery = useQuery({
    queryKey: ["notificationCount", organizationId],
    queryFn: () => getUnreadNotificationCount(organizationId),
    staleTime: 30_000,
  });
  const unread = unreadQuery.data ?? 0;

  // Dezenter Badge-Puls NUR bei Zuwachs (neue Mitteilung), einmalig (N-S2 Polish 1, Ruhe-Prinzip).
  const prevUnread = useRef(unread);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (unread > prevUnread.current) {
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 700);
      prevUnread.current = unread;
      return () => clearTimeout(id);
    }
    prevUnread.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToNotifications(user.id, () => {
      void qc.invalidateQueries({ queryKey: ["notificationCount", organizationId] });
      void qc.invalidateQueries({ queryKey: ["notifications", organizationId] });
    });
  }, [user?.id, organizationId, qc]);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((i) => pathname.startsWith(`/app/${i.route}`)),
  );

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slider, setSlider] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const btn = buttonRefs.current[activeIndex];
    if (btn) setSlider({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
  }, [activeIndex, t, NAV_ITEMS.length]);

  return (
    <header
      style={{ height: 56, marginTop: 30, background: "transparent", position: "sticky", top: 0, zIndex: 30 }}
      className="px-6 flex items-center justify-between select-none relative"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          style={{ width: 32, height: 32, background: "var(--sherloq-primary)", borderRadius: "var(--radius-btn)" }}
          className="flex items-center justify-center"
        >
          <span className="text-on-accent font-semibold text-sm leading-none">S</span>
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
        style={{ padding: 3 }}
        className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 ${NAV.surface} ${NAV.radius}`}
      >
        {slider.ready && (
          <div
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: slider.left,
              width: slider.width,
              background: NAV.activeBg,
              borderRadius: 9999,
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
              style={{ position: "relative", zIndex: 1 }}
              className={`${NAV.tab} ${NAV.radius} ${active ? "text-on-accent" : NAV.inactive}`}
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
          onClick={() => navigate("/app/notifications")}
          aria-label={t("notifications.title")}
          data-tip={t("notifications.title")}
          style={{
            width: 30,
            height: 30,
            border: "1px solid var(--border-strong)",
            borderRadius: 9,
            background: "var(--surface)",
            position: "relative",
          }}
          className="flex items-center justify-center text-text-muted cursor-pointer transition-colors hover:bg-[var(--app-bg)] hover:text-text-primary"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--signal-urgent-text)] text-on-accent text-[9px] font-bold flex items-center justify-center tabular-nums ${pulse ? "badge-pulse" : ""}`}
              aria-label={t("notifications.unreadCount", { count: unread })}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <button
          style={{ width: 30, height: 30, background: "var(--sherloq-primary)", borderRadius: 9 }}
          className="flex items-center justify-center text-on-accent text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          OS
        </button>
      </div>
    </header>
  );
}
