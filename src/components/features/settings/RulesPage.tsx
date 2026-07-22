/**
 * RulesPage — Settings → Arbeitsweise → „Regeln" (SET-4a, Slice 2b + Überarbeitung).
 *
 * Das „Schaufenster der Konfigurierbarkeit": der Nutzer justiert die verhaltenssteuernden WERTE
 * (Heat-/Pipeline-/Follow-up-Schwellen, Churn/Upsell-Gewichte + An/Aus, Signal-Frische, ICP). Alle
 * Werte über EINEN Schreibweg `updateSettings` (RPC `update_settings`, Whitelist + Min/Max +
 * `rules.edit`/`pipeline.manage`/`automation.manage`-Gate + audit) — genau der Weg, den später auch der
 * AI-Chat nutzt. UI blendet per Recht nur aus; der Server erzwingt zusätzlich.
 *
 * FARB-BEDEUTUNG (bewusste Ausnahme): Heat-Stufen (`HEAT_STATUS`-Tokens), Churn = Risiko
 * (`--signal-urgent-text`) und Upsell = Chance (`--signal-success-text`) nutzen ihre echte Bedeutungs-
 * farbe — ausschließlich über bestehende Tokens, kein Hex, dark-mode automatisch.
 *
 * EHRLICH: der Score wird 0–100 normalisiert → Gewichte = relative Wichtigkeit (kein „Summe bis
 * Schwelle"); die Schwelle steht separat als Marke auf der 0–100-Skala. Churn-Level-Bänder read-only.
 * Nicht messbare / externe Signale ausgegraut. Layout-Reserve „Eigene Actions" bewusst leer. Keine
 * erfundenen Werte / keine erfundenen Upsell-Bänder; `WhyPopover.usedBy` nennt ECHTE Funktionen.
 *
 * Reset-Empfehlungen spiegeln die Seeds (012/048/052/054) — zentral in `REC` (kein zweites System).
 */
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Flame, Sun, Snowflake, CloudSnow, Ghost, GitBranch, TrendingDown, TrendingUp,
  Radar, Puzzle, RotateCcw, type LucideIcon,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useSaveState } from "@/hooks/useSaveState";
import { getSettings, updateSettings } from "@/lib/db";
import { HEAT_STATUS } from "@/lib/constants";
import {
  SettingsCard, StatusBadge, RuleRow, ValueChip, WhyPopover, WeightEditor, HeatThresholdTile,
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

/** Heat-Stufen → Farb-Token + Icon + settings-Feld (gekettet: engaged < warm < cooling < cold). */
const HEAT_TILES: Array<{ key: string; sub: keyof typeof REC.heat; Icon: LucideIcon }> = [
  { key: "engaged", sub: "heiss_max_days", Icon: Flame },
  { key: "warm", sub: "warm_max_days", Icon: Sun },
  { key: "cooling", sub: "lauwarm_max_days", Icon: CloudSnow },
  { key: "cold", sub: "kalt_max_days", Icon: Snowflake },
];
const HEAT_COLOR: Record<string, string> = {
  engaged: HEAT_STATUS.engaged.color, warm: HEAT_STATUS.warm.color,
  cooling: HEAT_STATUS.cooling.color, cold: HEAT_STATUS.cold.color, gone: HEAT_STATUS.gone.color,
};

const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

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
  const points = t("settings.rules.unit.points");
  const workdays = t("settings.rules.unit.workdays");

  const whyEl = (key: string, usedBy: string) => (
    <WhyPopover title={t(`settings.rules.why.${key}.title`)} description={t(`settings.rules.why.${key}.desc`)} usedBy={usedBy} />
  );

  const iconEl = (I: LucideIcon) => <I className="w-3.5 h-3.5" />;
  const section = (I: LucideIcon, title: string, desc: string, headerExtra: ReactNode, body: ReactNode) => (
    <SettingsCard
      title={title}
      description={desc}
      saved={save.state}
      headerAction={<span className="inline-flex items-center gap-1.5">{headerExtra}<span className="text-text-muted">{iconEl(I)}</span></span>}
    >
      {body}
    </SettingsCard>
  );

  // Hover-Reset auf Empfehlung (für rechtsbündige Werte-Zeilen ohne RuleRow).
  const resetBtn = (canEdit: boolean, current: number, rec: number | undefined, onReset: () => void) =>
    canEdit && rec != null && current !== rec ? (
      <button
        type="button"
        onClick={onReset}
        aria-label={t("settings.rules.reset", { value: rec })}
        data-tip={t("settings.rules.reset", { value: rec })}
        className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-surface transition-colors cursor-pointer opacity-0 group-hover/er:opacity-100 focus-within:opacity-100"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    ) : null;

  // Rechtsbündige Wert-Zeile (Label links · Reset+Chip rechts) — für Pipeline/Follow-up (Gruppe 2).
  const editRow = (key: string, label: string, chip: ReactNode, reset?: ReactNode) => (
    <div key={key} className="group/er flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-[13px] text-text-body min-w-0">{label}</span>
      <span className="inline-flex items-center gap-1 shrink-0">{reset}{chip}</span>
    </div>
  );

  // ── WeightEditor-Konfigurationen (echte Signal-Keys) ─────────────────────────────────────────
  const churnSignals: EditableSignal[] = ["last_contact", "no_reply", "inactive_days", "heat_cold", "overdue_tasks"].map((k) => ({
    key: k, label: t(`settings.rules.sig.churn.${k}`), weight: cw[k] ?? (REC.churn_weights as Num)[k] ?? 0, active: cwa[k] !== false,
  }));
  const churnExternal: InactiveSignal[] = ["last_login", "usage_down", "support_tickets", "contract_ends", "cancellation"].map((k) => ({
    label: t(`settings.rules.sig.churnExt.${k}`), reason: "integration",
  }));
  const upsellSignals: EditableSignal[] = ["reply_rate", "recent_contact", "heat_hot", "active_deal"].map((k) => ({
    key: k, label: t(`settings.rules.sig.upsell.${k}`), weight: uw[k] ?? (REC.upsell_weights as Num)[k] ?? 0, active: uwa[k] !== false,
  }));
  const upsellInactive: InactiveSignal[] = [
    ...["positive_sentiment", "no_upsell_attempt"].map((k) => ({ label: t(`settings.rules.sig.upsellNM.${k}`), reason: "not_measured" as const })),
    ...["enrichment", "feature_usage", "seats", "nps", "logins"].map((k) => ({ label: t(`settings.rules.sig.upsellExt.${k}`), reason: "integration" as const })),
  ];

  // Terminale Stufen (gewonnen/verloren) haben keinen Stagnations-Timer → nicht editierbar.
  const nonTerminalStages = stages.filter((s) => s.slug !== "gewonnen" && s.slug !== "verloren");

  const bandTones: Array<{ key: string; tone: "success" | "warn" | "urgent" }> = [
    { key: "low", tone: "success" }, { key: "mid", tone: "warn" }, { key: "high", tone: "warn" }, { key: "critical", tone: "urgent" },
  ];

  const weightCol = t("settings.rules.weightCol", { max: 50 });
  const churnThreshold = (th.churn_risk_threshold as number) ?? REC.churn_risk_threshold;
  const upsellThreshold = (th.upsell_threshold as number) ?? REC.upsell_threshold;

  // 0–100-Skala mit Schwellen-Marke (ehrlich: KEINE „Summe rennt zur Schwelle").
  const scoreScale = (threshold: number, accent: string) => (
    <div className="px-1">
      <div className="relative h-2 rounded-full bg-border">
        <div className="absolute -top-1 h-4 w-[3px] rounded-full" style={{ left: `calc(${Math.min(100, Math.max(0, threshold))}% - 1.5px)`, background: accent }} />
      </div>
      <div className="flex justify-between typo-subline text-text-muted mt-1"><span>0</span><span>100</span></div>
    </div>
  );

  // Kopf einer Score-Karte (Icon in getönter Box + Titel + Untertitel).
  const scoreHeader = (I: LucideIcon, color: string, title: string, subtitle: string) => (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0" style={{ background: tint(color, 12) }}>
        <I className="w-4 h-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <div className="typo-card-title text-text-primary">{title}</div>
        <div className="typo-subline text-text-muted">{subtitle}</div>
      </div>
    </div>
  );

  const howBox = (text: string) => (
    <div className="rounded-[10px] bg-app-bg border border-border px-3 py-2.5">
      <p className="typo-subline text-text-body">
        <span className="font-semibold text-text-primary">{t("settings.rules.howTitle")} </span>{text}
      </p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="typo-page-title text-text-primary">{t("settings.rules.title")}</h2>
        <p className="typo-subline text-text-muted mt-1">{t("settings.rules.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* GRUPPE 1 — Heat & Kontakt: 5 farbige Kacheln + Regel-Synthese */}
        {section(Flame, t("settings.rules.g.heat.title"), t("settings.rules.g.heat.desc"), whyEl("heat", "score-heat-status"), (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {HEAT_TILES.map((tile) => {
                const val = heat[tile.sub] ?? REC.heat[tile.sub];
                const idx = HEAT_TILES.findIndex((x) => x.key === tile.key);
                const prevVal = idx > 0 ? (heat[HEAT_TILES[idx - 1].sub] ?? REC.heat[HEAT_TILES[idx - 1].sub]) : 0;
                const nextVal = idx < HEAT_TILES.length - 1 ? (heat[HEAT_TILES[idx + 1].sub] ?? REC.heat[HEAT_TILES[idx + 1].sub]) : 365;
                return (
                  <HeatThresholdTile
                    key={tile.key}
                    color={HEAT_COLOR[tile.key]}
                    label={t(`settings.rules.heat.tile.${tile.key}.label`)}
                    icon={iconEl(tile.Icon)}
                    caption={t(`settings.rules.heat.tile.${tile.key}.caption`)}
                    value={val} unit={days} min={prevVal + 1} max={nextVal - 1}
                    canEdit={canRules} ariaLabel={t(`settings.rules.heat.tile.${tile.key}.caption`)}
                    onSave={(v) => setHeat(tile.sub, v)}
                  />
                );
              })}
              {/* Gone — abgeleitet, read-only */}
              <HeatThresholdTile
                color={HEAT_COLOR.gone}
                label={t("settings.rules.heat.tile.gone.label")}
                icon={iconEl(Ghost)}
                caption={t("settings.rules.heat.tile.gone.caption")}
                readOnlyText={t("settings.rules.heat.tile.gone.value", { value: (heat.kalt_max_days ?? REC.heat.kalt_max_days) + 1 })}
              />
            </div>
            {/* Regel-Synthese */}
            <div className="rounded-[10px] bg-app-bg border border-border px-4 py-3">
              <p className="typo-subline text-text-body">
                <span className="font-semibold text-text-primary">{t("settings.rules.heat.synthTitle")} </span>
                {t("settings.rules.heat.synthesis", {
                  a: heat.heiss_max_days ?? REC.heat.heiss_max_days,
                  b: heat.warm_max_days ?? REC.heat.warm_max_days,
                  c: heat.lauwarm_max_days ?? REC.heat.lauwarm_max_days,
                  d: heat.kalt_max_days ?? REC.heat.kalt_max_days,
                })}
              </p>
            </div>
          </div>
        ))}

        {/* GRUPPE 2 — Pipeline & Follow-ups: zwei Karten, rechtsbündige Werte */}
        {section(GitBranch, t("settings.rules.g.pipeline.title"), t("settings.rules.g.pipeline.desc"), whyEl("pipeline", "score-deal-health"), (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stagnation je Stufe */}
            <div className="rounded-[12px] border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="typo-field-label text-text-muted">{t("settings.rules.pipeline.stagnationTitle")}</span>
                <span className="typo-field-label text-text-muted">{t("settings.rules.pipeline.stageCol")}</span>
              </div>
              {nonTerminalStages.map((s) =>
                editRow(
                  s.slug, s.name,
                  <ValueChip value={s.stagnation_days ?? REC.stagnation[s.slug] ?? 7} unit={days} min={1} max={365}
                    canEdit={canPipeline} ariaLabel={`${s.name} ${t("settings.rules.pipeline.stagnatesAfter")}`} align="end"
                    onSave={(v) => setStage(s.slug, v)} />,
                  resetBtn(canPipeline, s.stagnation_days ?? REC.stagnation[s.slug] ?? 7, REC.stagnation[s.slug], () => setStage(s.slug, REC.stagnation[s.slug])),
                ),
              )}
              {editRow("gewonnen", t("settings.rules.pipeline.wonLabel"),
                <span className="inline-flex items-center rounded-[7px] bg-app-bg border border-border px-2.5 py-0.5 text-[12px] font-medium text-text-muted">
                  {t("settings.rules.pipeline.wonNoTimer")}
                </span>)}
            </div>
            {/* Follow-up-Rhythmus — Header einzeilig (auf gleicher Höhe wie „Stagnation je Stufe" links) */}
            <div className="rounded-[12px] border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="typo-field-label text-text-muted">{t("settings.rules.pipeline.followupTitle")}</span>
              </div>
              {editRow("f1", t("settings.rules.followup.first"),
                <ValueChip value={ad.followup_first_days ?? REC.followup_first_days} unit={workdays} min={1} max={14}
                  canEdit={canAuto} ariaLabel={t("settings.rules.followup.first")} align="end" onSave={(v) => setAuto("followup_first_days", v)} />,
                resetBtn(canAuto, ad.followup_first_days ?? REC.followup_first_days, REC.followup_first_days, () => setAuto("followup_first_days", REC.followup_first_days)))}
              {editRow("f2", t("settings.rules.followup.second"),
                <ValueChip value={ad.followup_second_days ?? REC.followup_second_days} unit={workdays} min={2} max={30}
                  canEdit={canAuto} ariaLabel={t("settings.rules.followup.second")} align="end" onSave={(v) => setAuto("followup_second_days", v)} />,
                resetBtn(canAuto, ad.followup_second_days ?? REC.followup_second_days, REC.followup_second_days, () => setAuto("followup_second_days", REC.followup_second_days)))}
              {editRow("fm", t("settings.rules.followup.max"),
                <ValueChip value={ad.max_auto_followups ?? REC.max_auto_followups} min={1} max={10}
                  canEdit={canAuto} ariaLabel={t("settings.rules.followup.max")} align="end" onSave={(v) => setAuto("max_auto_followups", v)} />,
                resetBtn(canAuto, ad.max_auto_followups ?? REC.max_auto_followups, REC.max_auto_followups, () => setAuto("max_auto_followups", REC.max_auto_followups)))}
              <p className="typo-subline text-text-muted mt-3">{t("settings.rules.pipeline.workdayNote")}</p>
            </div>
          </div>
        ))}

        {/* GRUPPE 3 — Churn & Upsell */}
        {section(TrendingDown, t("settings.rules.g.churn.title"), t("settings.rules.g.churn.desc"), null, (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn = Risiko (rot) */}
            <div className="space-y-4">
              {scoreHeader(TrendingDown, "var(--signal-urgent-text)", t("settings.rules.churn.title"), t("settings.rules.churn.subtitle"))}
              {howBox(t("settings.rules.churn.how"))}
              <div className="space-y-2">
                <RuleRow before={t("settings.rules.churn.threshold")} unit={points} tone="urgent" value={churnThreshold}
                  min={0} max={100} recommended={REC.churn_risk_threshold} canEdit={canRules} why={whyEl("churn", "score-churn-risk")}
                  onSave={(v) => setThr("churn_risk_threshold", v)} />
                {scoreScale(churnThreshold, "var(--signal-urgent-text)")}
              </div>
              <WeightEditor signals={churnSignals} inactiveSignals={churnExternal} canEdit={canRules} tone="urgent"
                baseLabel={t("settings.rules.weightBase")} weightLabel={weightCol}
                inactiveLabel={t("settings.rules.externalSignals")} inactiveNote={t("settings.rules.integrationNote")}
                onWeightChange={(k, v) => setWeight("churn_weights", cw, k, v)}
                onActiveToggle={(k, v) => setActive("churn_weights_active", cwa, k, v)} />
              {/* Level-Bänder read-only (echt) */}
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
            {/* Upsell = Chance (grün) */}
            <div className="space-y-4">
              {scoreHeader(TrendingUp, "var(--signal-success-text)", t("settings.rules.upsell.title"), t("settings.rules.upsell.subtitle"))}
              {howBox(t("settings.rules.upsell.how"))}
              <div className="space-y-2">
                <RuleRow before={t("settings.rules.upsell.threshold")} unit={points} tone="success" value={upsellThreshold}
                  min={0} max={100} recommended={REC.upsell_threshold} canEdit={canRules} why={whyEl("upsell", "score-upsell")}
                  onSave={(v) => setThr("upsell_threshold", v)} />
                {scoreScale(upsellThreshold, "var(--signal-success-text)")}
              </div>
              <WeightEditor signals={upsellSignals} inactiveSignals={upsellInactive} canEdit={canRules} tone="success"
                baseLabel={t("settings.rules.weightBase")} weightLabel={weightCol}
                inactiveLabel={t("settings.rules.inactiveSignals")} inactiveNote={t("settings.rules.integrationNote")}
                onWeightChange={(k, v) => setWeight("upsell_weights", uw, k, v)}
                onActiveToggle={(k, v) => setActive("upsell_weights_active", uwa, k, v)} />
              {/* Upsell: KEINE erfundenen Bänder — nur die Schwelle (oben) zählt. */}
            </div>
          </div>
        ))}

        {/* GRUPPE 4 — Signale & ICP: value-first (Chip am Zeilenanfang) */}
        {section(Radar, t("settings.rules.g.signals.title"), t("settings.rules.g.signals.desc"), null, (
          <div className="space-y-1">
            <RuleRow valueFirst before={t("settings.rules.signals.fresh")}
              value={(th.signal_fresh_hours as number) ?? REC.signal_fresh_hours} min={1} max={168} recommended={REC.signal_fresh_hours}
              canEdit={canRules} why={whyEl("signalFresh", "calculatePriorityScore")}
              onSave={(v) => setThr("signal_fresh_hours", v)} />
            <RuleRow valueFirst before={t("settings.rules.signals.maxAi")}
              value={ad.max_ai_adjustments_per_lead ?? REC.max_ai_adjustments_per_lead} min={1} max={10} recommended={REC.max_ai_adjustments_per_lead}
              canEdit={canAuto} onSave={(v) => setAuto("max_ai_adjustments_per_lead", v)} />
            <RuleRow valueFirst before={t("settings.rules.signals.icp")}
              value={ad.icp_score_threshold ?? REC.icp_score_threshold} min={0} max={100} recommended={REC.icp_score_threshold}
              canEdit={canAuto} onSave={(v) => setAuto("icp_score_threshold", v)} />
          </div>
        ))}

        {/* GRUPPE 5 — Mein-Tag-Gewichte (nur Verweis, kein Editor hier) */}
        {section(Sun, t("settings.rules.g.meinTag.title"), t("settings.rules.g.meinTag.desc"), null, (
          <p className="typo-subline text-text-muted">{t("settings.rules.meinTag.note")}</p>
        ))}

        {/* LAYOUT-RESERVE — Eigene Actions (bewusst leer, ehrlich „folgt später") */}
        <div className="rounded-[12px] border border-dashed border-border bg-app-bg p-8 text-center">
          <span className="inline-flex text-text-muted mb-2">{iconEl(Puzzle)}</span>
          <p className="typo-subline text-text-muted">{t("settings.rules.g.custom.note")}</p>
        </div>
      </div>
    </div>
  );
}
