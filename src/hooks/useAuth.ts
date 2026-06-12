/**
 * useAuth — aktuelle Auth-Session (Login-Status) für die App.
 *
 * Nutzt ausschließlich lib/auth (nie @supabase direkt — Audit-Regel).
 * Ohne konfigurierte Supabase-Env bleibt `session` null und `loading` false.
 */

import { useEffect, useState } from "react";
import { getSession, onAuthChange, type Session } from "@/lib/auth";

export function useAuth(): {
  session: Session | null;
  user: Session["user"] | null;
  loading: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
    });
    const unsubscribe = onAuthChange((s) => {
      if (active) setSession(s);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
