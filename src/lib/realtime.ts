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

// import { getSupabaseClient } from "@/lib/db";

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
  return subscribeToTable<T>("pipeline_deals", organizationId, onChange);
}

/** Live-Updates der Benachrichtigungen (Glocken-Badge). */
export function subscribeToNotifications<T>(
  organizationId: string,
  onChange: (change: RealtimeChange<T>) => void,
): Unsubscribe {
  return subscribeToTable<T>("notifications", organizationId, onChange);
}
