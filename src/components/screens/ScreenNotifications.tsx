/**
 * ScreenNotifications — N-S2 Mitteilungsseite (Route /app/notifications, im AppLayout).
 *
 * Standardansicht („Offen") zeigt NUR Ungelesenes in vier Gruppen (N2), Klick = gelesen +
 * verschwindet (N13) + Navigation zu `link`. „Verlauf"-Tab = Gelesenes (90T-Retention via Cleanup-Cron).
 * Reine RLS-Queries (getNotifications/mark*), kein notify()-Aufruf. Realtime hält Liste + Badge live.
 * Leer = Normalzustand (EmptyState, kein Fehler). Ohne Login-Session: RLS liefert leer → EmptyState.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/db";
import { subscribeToNotifications } from "@/lib/realtime";
import { groupByNotificationGroup, type NotificationGroup } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type Tab = "open" | "history";

// Severity → Punkt-Farbe (Signal-Tokens). Urgent/High heben sich ab, normal/low ruhig.
const SEVERITY_DOT: Record<string, string> = {
  urgent: "var(--signal-urgent-text)",
  high: "var(--signal-warn-text)",
  normal: "var(--sherloq-primary)",
  low: "var(--text-muted)",
};

function relTime(iso: string, t: (k: string, o?: Record<string, unknown>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t("notifications.time.justNow");
  if (min < 60) return t("notifications.time.minutesAgo", { count: min });
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return t("notifications.time.hoursAgo", { count: hrs });
  return t("notifications.time.daysAgo", { count: Math.floor(hrs / 24) });
}

export default function ScreenNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("open");

  const mode = tab === "open" ? "unread" : "history";
  const listQuery = useQuery({
    queryKey: ["notifications", organizationId, mode],
    queryFn: () => getNotifications(organizationId, mode),
    staleTime: 30_000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["notifications", organizationId] });
    void qc.invalidateQueries({ queryKey: ["notificationCount", organizationId] });
  };

  // Realtime: jede Änderung an den eigenen Mitteilungen → Liste + Badge neu laden (kein Reload).
  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToNotifications(user.id, invalidate);
    return unsub;
    // invalidate hängt nur an stabilen Werten (qc/org) — bewusst nicht in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, organizationId]);

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, organizationId),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(organizationId),
    onSuccess: invalidate,
  });

  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const items = listQuery.data ?? [];
  const groups = groupByNotificationGroup(items);

  function openItem(n: NotificationRow) {
    // Mit Link → sofort gelesen + navigieren (Seite wechselt, keine Fade-Animation nötig).
    if (n.link) {
      if (!n.read_at) markRead.mutate(n.id);
      navigate(n.link);
      return;
    }
    // Ohne Link → sanftes Ausblenden, dann gelesen markieren (N13 + Polish 2, reduced-motion-aware via CSS).
    if (!n.read_at) {
      setExiting((s) => new Set(s).add(n.id));
      window.setTimeout(() => markRead.mutate(n.id), 200);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 text-text-body">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5" /> {t("notifications.title")}
        </h1>
        {tab === "open" && items.length > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold text-text-body bg-app-surface border border-border-strong hover:bg-app-bg transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" /> {t("notifications.markAllRead")}
          </button>
        )}
      </header>

      {/* Tabs Offen / Verlauf */}
      <div className="flex gap-1 p-1 bg-app-surface rounded-[12px] w-fit mb-5">
        {(["open", "history"] as const).map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={cn(
              "px-3.5 py-1.5 text-[12px] font-medium rounded-[9px] transition-colors cursor-pointer",
              tab === tb ? "bg-sherloq-primary text-on-accent" : "text-text-body hover:bg-app-bg",
            )}
          >
            {t(tb === "open" ? "notifications.tabs.open" : "notifications.tabs.history")}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title={tab === "open" ? t("notifications.empty") : t("notifications.emptyHistory")}
        />
      ) : tab === "open" ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.group}>
              <div className="typo-section-label text-text-muted mb-2 flex items-center gap-1.5">
                {t(`notifications.groups.${g.group as NotificationGroup}`)}
                <span className="font-semibold tabular-nums opacity-70">· {g.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {g.items.map((n) => (
                  <NotificationRowItem key={n.id} n={n} t={t} onOpen={openItem} exiting={exiting.has(n.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((n) => (
            <NotificationRowItem key={n.id} n={n} t={t} onOpen={openItem} read />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRowItem({
  n,
  t,
  onOpen,
  read,
  exiting,
}: {
  n: NotificationRow;
  t: (k: string, o?: Record<string, unknown>) => string;
  onOpen: (n: NotificationRow) => void;
  read?: boolean;
  exiting?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 rounded-[10px] border border-[var(--border-card)] bg-app-surface hover:bg-app-bg transition-all duration-200 motion-reduce:transition-none cursor-pointer",
        read && "opacity-70",
        exiting && "opacity-0 -translate-x-2 pointer-events-none", // Polish 2: sanftes Ausblenden beim Als-gelesen
      )}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0 mt-1.5"
        style={{ background: SEVERITY_DOT[n.severity] ?? SEVERITY_DOT.normal }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="typo-card-title text-text-primary block truncate">{n.title}</span>
        {n.body && <span className="typo-subline text-text-muted block truncate">{n.body}</span>}
      </span>
      <span className="typo-subline text-text-muted shrink-0 whitespace-nowrap">{relTime(n.created_at, t)}</span>
      {n.link && <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />}
    </button>
  );
}
