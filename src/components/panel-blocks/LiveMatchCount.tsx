/**
 * LiveMatchCount — Live-Trefferzahl des Regel-Builders (L-3b): „Trifft aktuell auf X Datensätze zu".
 * Server-State über TanStack Query (Projekt-Pflicht — kein useEffect+fetch): read-only Dry-Run
 * (`dryRunLifecycleRule` → Edge, Cross-Entity Option B), DEBOUNCED (400 ms über einen verzögerten
 * queryKey), nur bei vollständiger Regel. Zeigt Idle/Loading/Error/Count. Tokens-only, i18n.
 * Wiederverwendbar für jede „Vorschau-Trefferzahl" einer Filter-Definition.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Layers, Loader2, AlertCircle } from "lucide-react";
import { dryRunLifecycleRule, type LifecycleRuleConditions } from "@/lib/db";
import type { FilterEntity } from "@/lib/filter/types";

export interface LiveMatchCountProps {
  anchor: FilterEntity;
  conditions: LifecycleRuleConditions;
  /** Nur bei vollständiger Regel abfragen (sonst idle → nichts anzeigen). */
  enabled: boolean;
}

export default function LiveMatchCount({ anchor, conditions, enabled }: LiveMatchCountProps) {
  const { t } = useTranslation();
  const condKey = JSON.stringify(conditions);
  // Debounce: der queryKey folgt der Eingabe erst nach 400 ms Ruhe (setState im Timer-Callback, nicht im Effect-Body).
  const [debouncedKey, setDebouncedKey] = useState(condKey);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKey(condKey), 400);
    return () => clearTimeout(timer);
  }, [condKey]);
  const settled = debouncedKey === condKey;

  const query = useQuery({
    queryKey: ["lifecycle-dry-run", anchor, debouncedKey],
    queryFn: () => dryRunLifecycleRule(anchor, JSON.parse(debouncedKey) as LifecycleRuleConditions),
    enabled: enabled && settled,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: false,
  });

  if (!enabled) return null;

  const base = "inline-flex items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[12px] font-medium";

  // Loading = während der Debounce-Ruhe ODER während des laufenden Abrufs.
  if (!settled || query.isFetching) {
    return (
      <div className={`${base} border-border bg-app-bg text-text-muted`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("lifecycle.ui.liveCount.loading")}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className={`${base} border-signal-urgent/30 bg-signal-urgent/10 text-signal-urgent`}>
        <AlertCircle className="h-3.5 w-3.5" /> {t("lifecycle.ui.liveCount.error")}
      </div>
    );
  }
  const n = query.data?.matchCount ?? 0;
  if (n === 0) {
    return (
      <div className={`${base} border-border bg-app-bg text-text-muted`}>
        <Layers className="h-3.5 w-3.5" /> {t("lifecycle.ui.liveCount.zero")}
      </div>
    );
  }
  return (
    <div className={`${base} border-border bg-app-bg text-text-body`}>
      <Layers className="h-3.5 w-3.5 text-text-muted" />
      {t("lifecycle.ui.liveCount.some", { count: n })}
    </div>
  );
}
