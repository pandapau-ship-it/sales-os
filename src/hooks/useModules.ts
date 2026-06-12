/**
 * useModules — welche Module sind für die aktuelle Organisation aktiv?
 *
 * Nicht aktive Module werden komplett ausgeblendet (kein Hinweis) — Pattern:
 *   const { hasModule } = useModules()
 *   if (!hasModule('farmer')) return null
 *
 * ModuleKeys = kanonische Liste aus CLAUDE.md → MODUL-SYSTEM.
 * Daten kommen aus Supabase (`user_modules`), Zugriff nur über getSupabaseClient()
 * — nie @supabase direkt (Audit-Regel).
 *
 * Phase 0 ohne Backend: getSupabaseClient() liefert null → Default = alle Module
 * sichtbar, damit die Layout-Shell vollständig rendert. Sobald die DB verbunden
 * ist, werden die echten aktiven Module geladen.
 */

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/db";

export const MODULE_KEYS = [
  "core_crm",
  "ai_sdr",
  "hunter",
  "farmer",
  "enrichment",
  "email_verification",
  "sherloq_signals",
  "whitelabel",
  "ai_chat",
  "crm_sync",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// Phase 0: ohne Backend alle Module aktiv (Shell soll vollständig erscheinen).
const PHASE0_DEFAULT = new Set<ModuleKey>(MODULE_KEYS);

export function useModules(): {
  hasModule: (m: ModuleKey) => boolean;
  modules: Set<ModuleKey>;
  loading: boolean;
} {
  const [modules, setModules] = useState<Set<ModuleKey>>(PHASE0_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      // Phase 0 ohne Env → Default behalten.
      setLoading(false);
      return;
    }
    let active = true;
    client
      .from("user_modules")
      .select("module")
      .eq("active", true)
      .then(({ data }: { data: { module: string }[] | null }) => {
        if (!active) return;
        if (data) {
          setModules(new Set(data.map((r) => r.module as ModuleKey)));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    hasModule: (m: ModuleKey) => modules.has(m),
    modules,
    loading,
  };
}
