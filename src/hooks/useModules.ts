/**
 * useModules — welche Module sind für die aktuelle Organisation aktiv?
 *
 * Nicht aktive Module werden komplett ausgeblendet (kein Hinweis) — Pattern:
 *   const { hasModule } = useModules()
 *   if (!hasModule('farmer')) return null
 *
 * ModuleKeys = kanonische Liste aus CLAUDE.md → MODUL-SYSTEM.
 * Daten kommen aus `settings.modules` (kanonische Quelle) via `getModules()` aus
 * lib/db — nie @supabase direkt (Audit-Regel). Server-State über TanStack Query.
 *
 * Ohne Backend / leeres Ergebnis: Fallback = alle Module sichtbar (PHASE0_DEFAULT),
 * damit die Layout-Shell vollständig rendert. Mit verbundener DB greifen die echten
 * aktiven Module aus settings.modules der Organisation.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModules } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/org";

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
  // settings.modules der Org (org_id im Query-Key). getModules liefert {} ohne
  // Backend/Settings → Fallback unten greift.
  const { data, isLoading } = useQuery({
    queryKey: ["modules", DEMO_ORGANIZATION_ID],
    queryFn: () => getModules(DEMO_ORGANIZATION_ID),
  });

  const modules = useMemo<Set<ModuleKey>>(() => {
    if (!data) return PHASE0_DEFAULT; // noch nicht geladen → Shell vollständig
    const active = MODULE_KEYS.filter((k) => data[k] === true);
    // Leeres/kein settings.modules → sinnvoller Default statt „alles tot".
    return active.length ? new Set<ModuleKey>(active) : PHASE0_DEFAULT;
  }, [data]);

  return {
    hasModule: (m: ModuleKey) => modules.has(m),
    modules,
    loading: isLoading,
  };
}
