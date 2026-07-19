/**
 * realtime.ts — alle Realtime-Subscriptions.
 *
 * Komponenten nutzen NUR diese Funktionen — nie supabase.channel direkt.
 * Holt den Client ausschließlich über getSupabaseClient() aus db.ts.
 *
 * REGEL (→ CLAUDE.md Performance): max ~5 Channels gleichzeitig, eine
 * Subscription pro Listen-Ansicht, bei Unmount IMMER unsubscribe (die hier
 * zurückgegebene Funktion aufrufen — z.B. im useEffect-Cleanup).
 *
 * STATUS: Phase 5 noch nicht gestartet → No-op-Subscriptions (geben eine
 * funktionierende Unsubscribe-Funktion zurück). Beim Supabase-Einbau werden
 * nur die Körper ersetzt (getSupabaseClient().channel(...).on(...).subscribe()).
 */

import { getSupabaseClient } from "@/lib/db";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeChange<T> {
  event: RealtimeEvent;
  new: T | null;
  old: T | null;
}

export type Unsubscribe = () => void;

/**
 * Generische Tabellen-Subscription, gefiltert auf organization_id.
 * Gibt eine Unsubscribe-Funktion zurück — im Cleanup aufrufen.
 */
export function subscribeToTable<T>(
  _table: string,
  _organizationId: string,
  _onChange: (change: RealtimeChange<T>) => void,
): Unsubscribe {
  // Phase 5:
  // const client = getSupabaseClient();
  // const channel = client.channel(`${_table}:${_organizationId}`) ... .subscribe();
  // return () => client.removeChannel(channel);
  return () => {};
}

/** Live-Updates der Lead-Liste. */
export function subscribeToLeads<T>(
  organizationId: string,
  onChange: (change: RealtimeChange<T>) => void,
): Unsubscribe {
  return subscribeToTable<T>("contacts", organizationId, onChange);
}

/** Live-Updates der Tasks. */
export function subscribeToTasks<T>(
  organizationId: string,
  onChange: (change: RealtimeChange<T>) => void,
): Unsubscribe {
  return subscribeToTable<T>("tasks", organizationId, onChange);
}

/** Live-Updates der Pipeline-Deals. */
export function subscribeToDeals<T>(
  organizationId: string,
  onChange: (change: RealtimeChange<T>) => void,
): Unsubscribe {
  return subscribeToTable<T>("deals", organizationId, onChange);
}

/**
 * Live-Updates der Benachrichtigungen (Glocken-Badge + Mitteilungsseite, N-S2).
 * ECHT verdrahtet (nicht der No-op-Stub oben): user-gefilterter postgres_changes-Channel auf
 * `notifications`. `onChange` ist ein einfacher Callback (Query invalidieren + refetch) — der Bell
 * lädt bei jeder Änderung neu, kein Payload-Merge nötig. RLS greift auf der Realtime-Seite mit →
 * nur eigene Zeilen. Ohne Client/User (Demo-Modus) No-op. removeChannel im Cleanup aufrufen.
 */
// FIX 1: eindeutiges Channel-Topic pro Subscription. Supabase verlangt eindeutige Topics — zwei
// Subscriber auf denselben Topic (TopBar + ScreenNotifications) bzw. StrictMode-Doppelläufe
// kollidierten sonst („tried to subscribe multiple times") und schalteten die App weiß.
let channelSeq = 0;

export function subscribeToNotifications(
  userId: string,
  onChange: () => void,
): Unsubscribe {
  const client = getSupabaseClient();
  if (!client || !userId) return () => {};
  // FIX 2: defensiver Guard — ein Realtime-Fehler läuft in der Effect-Phase und würde ohne
  // ErrorBoundary den Baum unmounten (weiße Seite). Hier abfangen → App bleibt stehen.
  try {
    const channel = client
      .channel(`notifications:${userId}:${++channelSeq}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => onChange(),
      )
      .subscribe();
    return () => {
      try {
        void client.removeChannel(channel);
      } catch {
        /* Cleanup-Fehler dürfen die App nie stören */
      }
    };
  } catch (e) {
    console.error("subscribeToNotifications failed", e);
    return () => {};
  }
}
