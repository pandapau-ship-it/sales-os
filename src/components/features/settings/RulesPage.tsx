/**
 * RulesPage — Settings → Arbeitsweise → „Regeln" (SET-4a, Slice 2b).
 *
 * Das „Schaufenster der Konfigurierbarkeit": der Nutzer justiert die verhaltenssteuernden WERTE
 * (Heat-/Pipeline-/Follow-up-Schwellen, Churn/Upsell-Gewichte + An/Aus, Signal-Frische, ICP).
 * Jeder Wert als Klartext-Satz mit anklickbarem Chip (`RuleRow`) bzw. als Gewichte-Editor
 * (`WeightEditor`). Save-on-change über EINEN Schreibweg `updateSettings` (RPC `update_settings`,
 * Whitelist + Min/Max + `rules.edit`/`pipeline.manage`/`automation.manage`-Gate + audit) — genau der
 * Weg, den später auch der AI-Chat nutzt. UI blendet per Recht nur aus; der Server erzwingt zusätzlich.
 *
 * EHRLICH: der Score wird 0–100 normalisiert → Gewichte = relative Wichtigkeit (kein „Summe bis
 * Schwelle"). Level-Bänder read-only. Nicht messbare / externe Signale ausgegraut. Layout-Reserve
 * „Eigene Actions" bewusst leer. Keine erfundenen Werte; `WhyPopover.usedBy` nennt ECHTE Funktionen.
 *
 * Reset-Empfehlungen spiegeln die Seeds (012/048/052/054) — zentral in `REC` (kein zweites System).
 */
import { useTranslation } from "react-i18next";
import { Flame, GitBranch, TrendingDown, TrendingUp, Radar, Sun, Puzzle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useSaveState } from "@/hooks/useSaveState";
import { getSettings, updateSettings } from "@/lib/db";
import {
  SettingsCard, StatusBadge, RuleRow, WhyPopover, WeightEditor,
  type EditableSignal, type InactiveSignal,
} from "@/components";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/shared/toastContext";

/** Empfohlene Default-Werte — Spiegel der Seeds (012/048/052/054). Single Source für „Zurücksetzen". */
const REC = {
  heat: { heiss_max_days: 3, warm_max_days: 7, lauwarm_max_days: 14, kalt_max_days: 30 },
  churn_risk_threshold: 61,
  upsell_threshold: 70,
  signal_fresh_hours: 24,
  churn_weights: { last_contact: 25, no_reply: 20, inactive_days: 20, heat_cold: 20, overdue_tasks: 0 },
  upsell_weights: { reply_rate: 20, recent_contact: 15, heat_hot: 20, active_deal: 10 },
  followup_first_days: 3, followup_second_days: 7, max_auto_followups: 2,
  max_ai_adjustments_per_lead: 3, icp_score_threshold: 65,
  stagnation: { backlog: 7, demo_vereinbart: 5, followup_offen: 3, onboarding_offen: 14, free_trial: 14 } as Record<string, number>,
} as const;

type Num = Record<string, number>;
type Bool = Record<string, boolean>;
type Stage = { slug: string; name: string; stagnation_days?: number | null };

export default function RulesPage() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { has } = useEffectivePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  const save = useSaveState();

  const settingsQuery = useQuery({
    enabled: !!organizationId,
    queryKey: ["settings", organizationId],
    queryFn: () => getSettings(organizationId),
    staleTime: 60_000,
  });

  // Drei-Zustands-Gate (wie ReferenceScreens): Lese-Fehler wird SICHTBAR, nicht still auf REC-Defaults
  // degradiert (sonst zeigte der Editor Empfehlungswerte als echte Org-Werte — [D51] „kein stummer Default-Degrade").
  if (settingsQuery.isLoading) {
    return <div className="py-16 text-center text-[13px] text-text-muted">{t("common.loading")}</div>;
  }
  if (settingsQuery.isError) {
    return (
      <div className="py-16 text-center">
        <p className="typo-card-title text-text-primary">{t("settings.rules.loadError")}</p>
        <p className="typo-subline text-text-muted mt-1">{t("settings.rules.loadErrorDesc")}</p>
      </div>
    );
  }

  const settings = (settingsQuery.data ?? {}) as Record<string, unknown>;
  const th = (settings.thresholds ?? {}) as Record<string, unknown>;
  const ad = (settings.automation_defaults ?? {}) as Num;
  const stages = (settings.pipeline_stages ?? []) as Stage[];
  const heat = (th.heat_status ?? {}) as Num; // single-source-ok: settings.thresholds.heat_status = Heat-Tagesgrenzen-Config, KEIN Kontakt-Heat-Wert
  const cw = (th.churn_weights ?? {}) as Num;
  const cwa = (th.churn_weights_active ?? {}) as Bool;
  const uw = (th.upsell_weights ?? {}) as Num;
  const uwa = (th.upsell_weights_active ?? {}) as Bool;

  // Rechte je Bereich (serverseitig zusätzlich erzwungen).
  const canRules = has("rules.edit");
  const canPipeline = has("pipeline.manage");
  const canAuto = has("automation.manage");

  const write = async (patch: Record<string, unknown>) => {
    try {
      await save.run(updateSettings(patch));
      void qc.invalidateQueries({ queryKey: ["settings", organizationId] });
    } catch {
      toast(t("company.saveFailed"));
    }
  };
  // Schreib-Helfer — thresholds/automation_defaults shallow-merge (volle Zweitebene-Objekte).
  const setThr = (key: string, v: number | boolean) => write({ thresholds: { [key]: v } });
  const setHeat = (sub: string, v: number) => write({ thresholds: { heat_status: { ...heat, [sub]: v } } });
  const setAuto = (key: string, v: number) => write({ automation_defaults: { [key]: v } });
  const setWeight = (group: "churn_weights" | "upsell_weights", src: Num, sub: string, v: number) =>
    write({ thresholds: { [group]: { ...src, [sub]: v } } });
  const setActive = (group: "churn_weights_active" | "upsell_weights_active", src: Bool, sub: string, v: boolean) =>
    write({ thresholds: { [group]: { ...src, [sub]: v } } });
  const setStage = (slug: string, days: number) =>
    write({ pipeline_stages: stages.map((s) => (s.slug === slug ? { ...s, stagnation_days: days } : s)) });

  const days = t("settings.rules.unit.days");
  const hours = t("settings.rules.unit.hours");
  const points = t("settings.rules.unit.points");

  const whyEl = (key: string, usedBy: string) => (
    <WhyPopover title={t(`settings.rules.why.${key}.title`)} description={t(`settings.rules.why.${key}.desc`)} usedBy={usedBy} />
  );

  const icon = (I: typeof Flame) => <I className="w-3.5 h-3.5" />;
  const section = (I: typeof Flame, title: string, desc: string, body: React.ReactNode) => (
    <SettingsCard title={title} description={desc} saved={save.state} headerAction={<span className="text-text-muted">{icon(I)}</span>}>
      {body}
    </SettingsCard>
  );

  // ── WeightEditor-Konfigurationen (echte Signal-Keys) ─────────────────────────────────────────
  const churnSignals: EditableSignal[] = ["last_contact", "no_reply", "inactive_days", "heat_cold", "overdue_tasks"].map((k) => ({
    key: k,
    label: t(`settings.rules.sig.churn.${k}`),
    weight: cw[k] ?? (REC.churn_weights as Num)[k] ?? 0,
    active: cwa[k] !== false,
  }));
  const churnExternal: InactiveSignal[] = ["last_login", "usage_down", "support_tickets", "contract_ends", "cancellation"].map((k) => ({
    label: t(`settings.rules.sig.churnExt.${k}`), reason: "integration",
  }));
  const upsellSignals: EditableSignal[] = ["reply_rate", "recent_contact", "heat_hot", "active_deal"].map((k) => ({
    key: k,
    label: t(`settings.rules.sig.upsell.${k}`),
    weight: uw[k] ?? (REC.upsell_weights as Num)[k] ?? 0,
    active: uwa[k] !== false,
  }));
  const upsellNotMeasured: InactiveSignal[] = ["positive_sentiment", "no_upsell_attempt"].map((k) => ({
    label: t(`settings.rules.sig.upsellNM.${k}`), reason: "not_measured",
  }));
  const upsellExternal: InactiveSignal[] = ["enrichment", "feature_usage", "seats", "nps", "logins"].map((k) => ({
    label: t(`settings.rules.sig.upsellExt.${k}`), reason: "integration",
  }));

  // Terminale Stufen (gewonnen/verloren) haben keinen Stagnations-Timer → nicht editierbar (billiger Filter, kein Memo nötig).
  const nonTerminalStages = stages.filter((s) => s.slug !== "gewonnen" && s.slug !== "verloren");

  const bandTones: Array<{ key: string; tone: "success" | "warn" | "muted" }> = [
    { key: "low", tone: "success" }, { key: "mid", tone: "warn" }, { key: "high", tone: "warn" }, { key: "critical", tone: "muted" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="typo-page-title text-text-primary">{t("settings.rules.title")}</h2>
        <p className="typo-subline text-text-muted mt-1">{t("settings.rules.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* GRUPPE 1 — Heat & Kontakt (gekettet: engaged < warm < cooling < cold) */}
        {section(Flame, t("settings.rules.g.heat.title"), t("settings.rules.g.heat.desc"), (
          <div className="space-y-1">
            <RuleRow icon={icon(Flame)} before={t("settings.rules.heat.engaged")} unit={days}
              value={heat.heiss_max_days ?? REC.heat.heiss_max_days} min={1} max={(heat.warm_max_days ?? REC.heat.warm_max_days) - 1}
              recommended={REC.heat.heiss_max_days} canEdit={canRules} why={whyEl("heat", "score-heat-status")}
              onSave={(v) => setHeat("heiss_max_days", v)} />
            <RuleRow icon={icon(Flame)} before={t("settings.rules.heat.warm")} unit={days}
              value={heat.warm_max_days ?? REC.heat.warm_max_days} min={(heat.heiss_max_days ?? REC.heat.heiss_max_days) + 1} max={(heat.lauwarm_max_days ?? REC.heat.lauwarm_max_days) - 1}
              recommended={REC.heat.warm_max_days} canEdit={canRules} why={whyEl("heat", "score-heat-status")}
              onSave={(v) => setHeat("warm_max_days", v)} />
            <RuleRow icon={icon(Flame)} before={t("settings.rules.heat.cooling")} unit={days}
              value={heat.lauwarm_max_days ?? REC.heat.lauwarm_max_days} min={(heat.warm_max_days ?? REC.heat.warm_max_days) + 1} max={(heat.kalt_max_days ?? REC.heat.kalt_max_days) - 1}
              recommended={REC.heat.lauwarm_max_days} canEdit={canRules} why={whyEl("heat", "score-heat-status")}
              onSave={(v) => setHeat("lauwarm_max_days", v)} />
            <RuleRow icon={icon(Flame)} before={t("settings.rules.heat.cold")} unit={days}
              value={heat.kalt_max_days ?? REC.heat.kalt_max_days} min={(heat.lauwarm_max_days ?? REC.heat.lauwarm_max_days) + 1} max={365}
              recommended={REC.heat.kalt_max_days} canEdit={canRules} why={whyEl("heat", "score-heat-status")}
              onSave={(v) => setHeat("kalt_max_days", v)} />
            <p className="typo-subline text-text-muted pt-1">
              {t("settings.rules.heat.gone", { value: (heat.kalt_max_days ?? REC.heat.kalt_max_days) + 1 })}
            </p>
          </div>
        ))}

        {/* GRUPPE 2 — Pipeline & Follow-ups */}
        {section(GitBranch, t("settings.rules.g.pipeline.title"), t("settings.rules.g.pipeline.desc"), (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <div className="space-y-1">
              {nonTerminalStages.map((s) => (
                <RuleRow key={s.slug} before={`${s.name} ${t("settings.rules.pipeline.stagnatesAfter")}`} unit={days}
                  value={s.stagnation_days ?? REC.stagnation[s.slug] ?? 7} min={1} max={365}
                  recommended={REC.stagnation[s.slug]} canEdit={canPipeline} why={whyEl("pipeline", "score-deal-health")}
                  onSave={(v) => setStage(s.slug, v)} />
              ))}
              <p className="typo-subline text-text-muted pt-1">{t("settings.rules.pipeline.wonNoTimer")}</p>
            </div>
            <div className="space-y-1">
              <RuleRow before={t("settings.rules.followup.first")} unit={t("settings.rules.unit.workdays")}
                value={ad.followup_first_days ?? REC.followup_first_days} min={1} max={14} recommended={REC.followup_first_days}
                canEdit={canAuto} onSave={(v) => setAuto("followup_first_days", v)} />
              <RuleRow before={t("settings.rules.followup.second")} unit={t("settings.rules.unit.workdays")}
                value={ad.followup_second_days ?? REC.followup_second_days} min={2} max={30} recommended={REC.followup_second_days}
                canEdit={canAuto} onSave={(v) => setAuto("followup_second_days", v)} />
              <RuleRow before={t("settings.rules.followup.max")} unit={t("settings.rules.unit.followups")}
                value={ad.max_auto_followups ?? REC.max_auto_followups} min={1} max={10} recommended={REC.max_auto_followups}
                canEdit={canAuto} onSave={(v) => setAuto("max_auto_followups", v)} />
            </div>
          </div>
        ))}

        {/* GRUPPE 3 — Churn & Upsell */}
        {section(TrendingDown, t("settings.rules.g.churn.title"), t("settings.rules.g.churn.desc"), (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">{icon(TrendingDown)}</span>
                <span className="typo-card-title text-text-primary">{t("settings.rules.churn.title")}</span>
              </div>
              <RuleRow before={t("settings.rules.churn.threshold")} unit={points} value={(th.churn_risk_threshold as number) ?? REC.churn_risk_threshold}
                min={0} max={100} recommended={REC.churn_risk_threshold} canEdit={canRules} why={whyEl("churn", "score-churn-risk")}
                onSave={(v) => setThr("churn_risk_threshold", v)} />
              <WeightEditor signals={churnSignals} inactiveSignals={churnExternal} canEdit={canRules}
                onWeightChange={(k, v) => setWeight("churn_weights", cw, k, v)}
                onActiveToggle={(k, v) => setActive("churn_weights_active", cwa, k, v)} />
              {/* Level-Bänder read-only */}
              <div>
                <div className="typo-field-label text-text-muted mb-1.5">{t("settings.rules.churn.bands")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {bandTones.map((b) => (
                    <StatusBadge key={b.key} tone={b.tone} label={t(`settings.rules.churn.band.${b.key}`)} />
                  ))}
                </div>
              </div>
              {/* Churn unterdrückt Upsell */}
              <div className="flex items-center justify-between gap-3 rounded-[10px] bg-app-bg border border-border px-3 py-2.5">
                <span className="typo-subline text-text-body">{t("settings.rules.churn.suppress")}</span>
                <Switch checked={(th.churn_suppresses_upsell as boolean) ?? true} disabled={!canRules}
                  onCheckedChange={(v) => setThr("churn_suppresses_upsell", v)} aria-label={t("settings.rules.churn.suppress")} />
              </div>
            </div>
            {/* Upsell */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">{icon(TrendingUp)}</span>
                <span className="typo-card-title text-text-primary">{t("settings.rules.upsell.title")}</span>
              </div>
              <RuleRow before={t("settings.rules.upsell.threshold")} unit={points} value={(th.upsell_threshold as number) ?? REC.upsell_threshold}
                min={0} max={100} recommended={REC.upsell_threshold} canEdit={canRules} why={whyEl("upsell", "score-upsell")}
                onSave={(v) => setThr("upsell_threshold", v)} />
              <WeightEditor signals={upsellSignals} inactiveSignals={[...upsellNotMeasured, ...upsellExternal]} canEdit={canRules}
                onWeightChange={(k, v) => setWeight("upsell_weights", uw, k, v)}
                onActiveToggle={(k, v) => setActive("upsell_weights_active", uwa, k, v)} />
              {/* Upsell: KEINE erfundenen Bänder — nur die Schwelle (oben) zählt. */}
            </div>
          </div>
        ))}

        {/* GRUPPE 4 — Signale & ICP */}
        {section(Radar, t("settings.rules.g.signals.title"), t("settings.rules.g.signals.desc"), (
          <div className="space-y-1">
            <RuleRow icon={icon(Radar)} before={t("settings.rules.signals.fresh")} unit={hours}
              value={(th.signal_fresh_hours as number) ?? REC.signal_fresh_hours} min={1} max={168} recommended={REC.signal_fresh_hours}
              canEdit={canRules} why={whyEl("signalFresh", "calculatePriorityScore")}
              onSave={(v) => setThr("signal_fresh_hours", v)} />
            <RuleRow icon={icon(Radar)} before={t("settings.rules.signals.maxAi")} after={t("settings.rules.signals.maxAiSuffix")}
              value={ad.max_ai_adjustments_per_lead ?? REC.max_ai_adjustments_per_lead} min={1} max={10} recommended={REC.max_ai_adjustments_per_lead}
              canEdit={canAuto} onSave={(v) => setAuto("max_ai_adjustments_per_lead", v)} />
            <RuleRow icon={icon(Radar)} before={t("settings.rules.signals.icp")} unit={points}
              value={ad.icp_score_threshold ?? REC.icp_score_threshold} min={0} max={100} recommended={REC.icp_score_threshold}
              canEdit={canAuto} onSave={(v) => setAuto("icp_score_threshold", v)} />
          </div>
        ))}

        {/* GRUPPE 5 — Mein-Tag-Gewichte (nur Verweis, kein Editor hier) */}
        {section(Sun, t("settings.rules.g.meinTag.title"), t("settings.rules.g.meinTag.desc"), (
          <p className="typo-subline text-text-muted">{t("settings.rules.meinTag.note")}</p>
        ))}

        {/* LAYOUT-RESERVE — Eigene Actions (bewusst leer, ehrlich „folgt später") */}
        <div className="rounded-[12px] border border-dashed border-border bg-app-bg p-8 text-center">
          <span className="inline-flex text-text-muted mb-2">{icon(Puzzle)}</span>
          <p className="typo-subline text-text-muted">{t("settings.rules.g.custom.note")}</p>
        </div>
      </div>
    </div>
  );
}
