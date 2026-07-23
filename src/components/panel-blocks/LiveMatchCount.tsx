/**
 * LiveMatchCount — Live-Trefferzahl des Regel-Builders (L-3b): „Trifft aktuell auf X Datensätze zu".
 * Ruft den read-only Dry-Run (`dryRunLifecycleRule` → Edge, Cross-Entity Option B) DEBOUNCED (400 ms),
 * nur bei vollständiger Regel. Zeigt Idle/Loading/Error/Count. Ignoriert veraltete Antworten (Request-Token).
 * Tokens-only, i18n. Wiederverwendbar für jede „Vorschau-Trefferzahl" einer Filter-Definition.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers, Loader2, AlertCircle } from "lucide-react";
import { dryRunLifecycleRule, type LifecycleRuleConditions } from "@/lib/db";
import type { FilterEntity } from "@/lib/filter/types";

export interface LiveMatchCountProps {
  anchor: FilterEntity;
  conditions: LifecycleRuleConditions;
  /** Nur bei vollständiger Regel abfragen (sonst idle → nichts anzeigen). */
  enabled: boolean;
}

type State = { kind: "idle" } | { kind: "loading" } | { kind: "error" } | { kind: "count"; n: number };

export default function LiveMatchCount({ anchor, conditions, enabled }: LiveMatchCountProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: "idle" });
  const reqId = useRef(0);
  const condKey = JSON.stringify(conditions);

  useEffect(() => {
    if (!enabled) { setState({ kind: "idle" }); return; }
    const my = ++reqId.current;
    setState({ kind: "loading" });
    const timer = setTimeout(async () => {
      try {
        const { matchCount } = await dryRunLifecycleRule(anchor, JSON.parse(condKey) as LifecycleRuleConditions);
        if (reqId.current === my) setState({ kind: "count", n: matchCount });
      } catch {
        if (reqId.current === my) setState({ kind: "error" });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [anchor, condKey, enabled]);

  if (state.kind === "idle") return null;

  const base = "inline-flex items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[12px] font-medium";

  if (state.kind === "loading") {
    return (
      <div className={`${base} border-border bg-app-bg text-text-muted`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("lifecycle.ui.liveCount.loading")}
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className={`${base} border-signal-urgent/30 bg-signal-urgent/10 text-signal-urgent`}>
        <AlertCircle className="h-3.5 w-3.5" /> {t("lifecycle.ui.liveCount.error")}
      </div>
    );
  }
  if (state.n === 0) {
    return (
      <div className={`${base} border-border bg-app-bg text-text-muted`}>
        <Layers className="h-3.5 w-3.5" /> {t("lifecycle.ui.liveCount.zero")}
      </div>
    );
  }
  return (
    <div className={`${base} border-border bg-app-bg text-text-body`}>
      <Layers className="h-3.5 w-3.5 text-text-muted" />
      {t("lifecycle.ui.liveCount.some", { count: state.n })}
    </div>
  );
}
