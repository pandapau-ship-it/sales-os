/**
 * RuleEditor — 3-Schritt-Editor des Lifecycle-Regel-Builders (L-3d). In-Place-Seite (kein Sheet) in der
 * Overview: Schritt 1 Datenart & Name · Schritt 2 Bedingungen (ConditionBuilder + LiveMatchCount) ·
 * Schritt 3 Aktion (Registry-getrieben, Payload-Felder inkl. Listen-Picker + [D57]-Sammelmeldungshinweis).
 *
 * Regel A — Wiederverwendet: Stepper (shared), ConditionBuilder + LiveMatchCount (panel-blocks),
 * summarizeRule (lib/lifecycle/summary), ui/select · ui/button · ui/alert-dialog. KEIN Sheet-Neubau —
 * der Editor ist eine In-Place-Seite (kein rechtes Panel), daher keine ActionPanel-Shell nötig.
 *
 * EIN Schreibweg: upsertLifecycleRule (automation.manage-Gate + Option-B-Validierung serverseitig).
 * Fehler kommen strukturiert ([D54]: error.details = JSON {code,…}) — wir parsen den Code, raten nicht am Text.
 * Edit nutzt den optimistischen Sperr-Guard (expectedUpdatedAt = rule.updatedAt → stale_write statt still).
 * Tokens-only, i18n, Dark-Mode automatisch.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, AlertCircle, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import Stepper from "@/components/shared/Stepper";
import ConditionBuilder from "@/components/panel-blocks/ConditionBuilder";
import LiveMatchCount from "@/components/panel-blocks/LiveMatchCount";
import { cn } from "@/lib/utils";
import {
  upsertLifecycleRule, getActionTypes, getLists,
  type LifecycleRuleView, type LifecycleRulePatch, type ActionTypeMeta,
} from "@/lib/db";
import type { FilterEntity } from "@/lib/filter/types";
import type { RuleTemplate } from "@/lib/lifecycle/templates";
import {
  ENTITY_ORDER, ENTITY_META, actionParamLabelKey, actionParamPlaceholderKey,
} from "@/lib/lifecycle/config";
import { emptyConditions, isConditionsComplete, type BuilderConditions } from "@/lib/lifecycle/conditions";
import { summarizeRule } from "@/lib/lifecycle/summary";

export type EditorInit =
  | { mode: "new" }
  | { mode: "edit"; rule: LifecycleRuleView }
  | { mode: "template"; tpl: RuleTemplate };

export interface RuleEditorProps {
  orgId: string;
  init: EditorInit;
  onClose: () => void;   // zurück zur Liste (Verwerfen-Guard läuft intern)
  onSaved: () => void;   // gespeichert → schließen + Liste neu laden
}

interface Draft {
  name: string;
  anchor: FilterEntity;
  conditions: BuilderConditions;
  actionType: string;
  params: Record<string, unknown>;
}

/** Startzustand aus dem Init-Modus (rein). */
function draftFromInit(init: EditorInit): Draft {
  if (init.mode === "edit") {
    const r = init.rule;
    return { name: r.name, anchor: r.anchorEntity, conditions: r.conditions, actionType: r.action.type, params: { ...(r.action.params ?? {}) } };
  }
  if (init.mode === "template") {
    const tpl = init.tpl;
    return { name: tpl.name, anchor: tpl.anchor, conditions: tpl.conditions, actionType: tpl.action.type, params: { ...(tpl.action.params ?? {}) } };
  }
  return { name: "", anchor: "contacts", conditions: emptyConditions(), actionType: "", params: {} };
}

/** [D54]: error.details ist ein JSON-String {code, field, …} — parsen statt am Text raten. */
function parseStructured(err: unknown): { code?: string; field?: string; message: string; hint?: string } {
  const e = err as { message?: string; details?: string; hint?: string };
  let code: string | undefined, field: string | undefined;
  try { const d = JSON.parse(e.details ?? "{}") as { code?: string; field?: string }; code = d.code; field = d.field; } catch { /* kein strukturiertes detail */ }
  return { code, field, message: e.message ?? String(err), hint: e.hint || undefined };
}

const BOX = "rounded-[12px] border border-[var(--border-card)] bg-app-surface";
const FIELD = "w-full rounded-[10px] border border-border bg-app-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-sherloq-primary focus:outline-none";

export default function RuleEditor({ orgId, init, onClose, onSaved }: RuleEditorProps) {
  const { t } = useTranslation();
  const isEdit = init.mode === "edit";
  const ruleId = init.mode === "edit" ? init.rule.id : null;
  const expectedUpdatedAt = init.mode === "edit" ? init.rule.updatedAt : null;

  const [initial] = useState<Draft>(() => draftFromInit(init));
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false); // Schritt-Hinweise erst nach „Weiter"/„Speichern"
  const [confirmClose, setConfirmClose] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);

  // Aktions-Registry (global, cache-freundlich)
  const actionsQ = useQuery({ queryKey: ["action-types"], queryFn: getActionTypes, staleTime: 5 * 60_000 });
  const actions = useMemo(() => actionsQ.data ?? [], [actionsQ.data]);
  const availableActions = actions.filter((a) => a.appliesTo.includes(draft.anchor));
  const currentAction = actions.find((a) => a.key === draft.actionType) ?? null;

  // Listen nur laden, wenn add_to_list aktiv ist (statische Listen wählbar — dynamische berechnen sich selbst)
  const needsList = currentAction?.key === "add_to_list";
  const listsQ = useQuery({ queryKey: ["lists", orgId], queryFn: () => getLists(orgId), enabled: needsList, staleTime: 60_000 });
  const staticLists = (listsQ.data ?? []).filter((l) => l.type === "static");

  // Anker bestimmt die Feld-Whitelist → bei Wechsel Bedingungen zurücksetzen und ggf. Aktion verwerfen.
  const setAnchor = (anchor: FilterEntity) => {
    if (anchor === draft.anchor) return;
    const actionStillOk = !!draft.actionType && !!actions.find((a) => a.key === draft.actionType)?.appliesTo.includes(anchor);
    setDraft((d) => ({ ...d, anchor, conditions: emptyConditions(), actionType: actionStillOk ? d.actionType : "", params: actionStillOk ? d.params : {} }));
  };
  const setAction = (key: string) => setDraft((d) => ({ ...d, actionType: key, params: {} }));
  const setParam = (key: string, value: unknown) => setDraft((d) => ({ ...d, params: { ...d.params, [key]: value } }));

  // Validierung je Schritt
  const nameOk = draft.name.trim().length > 0;
  const conditionsOk = isConditionsComplete(draft.conditions);
  const requiredParams = currentAction ? Object.entries(currentAction.paramsSchema).filter(([, v]) => v === "required").map(([k]) => k) : [];
  const paramsOk = requiredParams.every((k) => { const v = draft.params[k]; return v !== undefined && v !== null && String(v).trim() !== ""; });
  const actionOk = !!currentAction && currentAction.status === "active" && paramsOk;

  // Klartext-Live-Zusammenfassung (immer sichtbar)
  const actionLabel = currentAction ? t(currentAction.labelKey) : t("lifecycle.ui.editor.chooseAction");
  const payloadText = actionPayloadText(currentAction, draft.params, staticLists);
  const summary = summarizeRule(draft.anchor, draft.conditions, actionLabel, payloadText, t);

  const saveM = useMutation({
    mutationFn: async () => {
      // nur die Schema-Params der GEWÄHLTEN Aktion senden (keine Reste einer vorher gewählten Aktion)
      const cleanParams: Record<string, unknown> = {};
      for (const k of Object.keys(currentAction!.paramsSchema)) {
        const v = draft.params[k];
        if (v === undefined || v === null || String(v).trim() === "") continue;
        cleanParams[k] = k === "due_in_days" ? Number(v) : v;
      }
      const patch: LifecycleRulePatch = {
        name: draft.name.trim(),
        anchor_entity: draft.anchor,
        conditions: draft.conditions,
        action: { type: draft.actionType, params: cleanParams },
      };
      return upsertLifecycleRule(ruleId, patch, expectedUpdatedAt);
    },
    onSuccess: () => onSaved(),
  });
  const saveErr = saveM.error ? parseStructured(saveM.error) : null;
  const saveErrText = saveErr
    ? saveErr.code === "stale_write"
      ? t("lifecycle.ui.staleWrite")
      : `${t("lifecycle.ui.editor.saveError")} ${saveErr.hint ?? saveErr.message}`
    : null;

  const goNext = () => {
    setShowErrors(true);
    if (step === 1 && !nameOk) return;
    if (step === 2 && !conditionsOk) return;
    setShowErrors(false);
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => { setShowErrors(false); setStep((s) => Math.max(1, s - 1)); };
  const attemptClose = () => { if (dirty) setConfirmClose(true); else onClose(); };
  const doSave = () => { setShowErrors(true); if (actionOk) saveM.mutate(); };

  const steps = [
    { label: t("lifecycle.ui.editor.stepAnchor") },
    { label: t("lifecycle.ui.editor.stepConditions") },
    { label: t("lifecycle.ui.editor.stepAction") },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Kopf */}
      <div>
        <button
          type="button"
          onClick={attemptClose}
          aria-label={t("lifecycle.ui.editor.back")}
          className="inline-flex items-center gap-1.5 mb-4 text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("lifecycle.ui.editor.back")}
        </button>
        <h2 className="typo-card-title text-text-primary">
          {isEdit ? t("lifecycle.ui.editor.titleEdit") : t("lifecycle.ui.editor.titleNew")}
        </h2>
      </div>

      <div className="max-w-[720px]">
        <Stepper steps={steps} current={step} />
      </div>

      {/* Klartext-Live-Zusammenfassung — immer sichtbar */}
      <div className={cn(BOX, "px-4 py-3 max-w-[720px]")}>
        <div className="typo-section-label text-text-muted mb-1">{t("lifecycle.ui.matchLabel")}</div>
        <p className="text-[14px] leading-snug text-text-primary">{summary}</p>
      </div>

      {/* Schritt-Inhalt */}
      <div className="max-w-[720px]">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="typo-field-label text-text-muted mb-2">{t("lifecycle.ui.editor.anchorHeading")}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ENTITY_ORDER.map((e) => {
                  const meta = ENTITY_META[e];
                  const Icon = meta.icon;
                  const selected = draft.anchor === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setAnchor(e)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-[12px] border p-4 text-left transition-colors",
                        selected ? "border-sherloq-primary bg-sherloq-primary/5" : "border-border bg-app-surface hover:border-sherloq-primary/40",
                      )}
                    >
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]"
                        style={{ background: `var(${meta.colorVar}-bg)`, color: `var(${meta.colorVar}-text)` }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[13px] font-semibold text-text-primary">{t(meta.labelKey)}</span>
                      <span className="text-[11px] text-text-muted">{t(meta.descKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="rule-name" className="typo-field-label text-text-muted mb-2 block">{t("lifecycle.ui.editor.nameLabel")}</label>
              <input
                id="rule-name"
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder={t("lifecycle.ui.editor.namePlaceholder")}
                className={FIELD}
              />
              {showErrors && !nameOk && (
                <p className="mt-1.5 text-[11px] text-signal-urgent">{t("lifecycle.ui.editor.nameRequired")}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="typo-field-label text-text-muted">{t("lifecycle.ui.editor.conditionsHeading")}</div>
            <ConditionBuilder anchor={draft.anchor} value={draft.conditions} onChange={(c) => setDraft((d) => ({ ...d, conditions: c }))} />
            <LiveMatchCount anchor={draft.anchor} conditions={draft.conditions} enabled={conditionsOk} />
            {showErrors && !conditionsOk && (
              <p className="text-[11px] text-signal-urgent">{t("lifecycle.ui.editor.conditionsIncomplete")}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="typo-field-label text-text-muted">{t("lifecycle.ui.editor.actionHeading")}</div>

            {actionsQ.isLoading ? (
              <div className="flex items-center gap-2 text-[13px] text-text-muted"><Loader2 className="h-4 w-4 animate-spin" />{t("lifecycle.ui.liveCount.loading")}</div>
            ) : actionsQ.isError ? (
              <div className="flex items-center gap-2 text-[13px] text-signal-urgent"><AlertCircle className="h-4 w-4" />{t("lifecycle.ui.loadError")}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableActions.map((a) => {
                    const soon = a.status === "coming_soon";
                    const selected = draft.actionType === a.key;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={soon}
                        onClick={() => !soon && setAction(a.key)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-[10px] border px-3.5 py-2.5 text-left text-[13px] transition-colors",
                          soon
                            ? "border-border bg-app-bg text-text-muted opacity-60 cursor-not-allowed"
                            : selected
                              ? "border-sherloq-primary bg-sherloq-primary/5 text-text-primary font-medium"
                              : "border-border bg-app-surface text-text-body hover:border-sherloq-primary/40 cursor-pointer",
                        )}
                      >
                        <span>{t(a.labelKey)}</span>
                        {soon
                          ? <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider"><Lock className="h-3 w-3" />{t("lifecycle.ui.comingSoon")}</span>
                          : selected && <Check className="h-4 w-4 text-sherloq-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Payload-Felder der gewählten Aktion */}
                {currentAction && currentAction.status === "active" && (
                  <div className={cn(BOX, "flex flex-col gap-4 p-4")}>
                    {Object.entries(currentAction.paramsSchema).map(([key, req]) => (
                      <ActionParamField
                        key={key}
                        paramKey={key}
                        required={req === "required"}
                        value={draft.params[key]}
                        onChange={(v) => setParam(key, v)}
                        lists={key === "list_id" ? staticLists : undefined}
                        listsLoading={key === "list_id" && listsQ.isLoading}
                        listsError={key === "list_id" && listsQ.isError}
                      />
                    ))}

                    {/* [D57] Sammelmeldungs-Hinweis für Benachrichtigungs-Aktionen */}
                    {(currentAction.key === "notify" || currentAction.key === "notify_urgent") && (
                      <div className="flex items-start gap-2 rounded-[8px] bg-app-bg px-3 py-2 text-[11px] text-text-muted">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{t("lifecycle.ui.bundleHint")}</span>
                      </div>
                    )}
                  </div>
                )}

                {showErrors && !actionOk && (
                  <p className="text-[11px] text-signal-urgent">{t("lifecycle.ui.editor.actionRequired")}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Speicher-Fehler ([D54] strukturiert) */}
      {saveErrText && (
        <div className="flex items-center gap-2 max-w-[720px] rounded-[10px] border border-signal-urgent/30 bg-signal-urgent/5 px-3.5 py-2.5 text-[12px] text-signal-urgent">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveErrText}</span>
        </div>
      )}

      {/* Fußzeile */}
      <div className="flex items-center justify-between max-w-[720px] pt-1">
        <Button variant="ghost" onClick={step === 1 ? attemptClose : goBack} disabled={saveM.isPending}>
          {step === 1 ? t("lifecycle.ui.editor.cancel") : t("lifecycle.ui.editor.back")}
        </Button>
        {step < 3 ? (
          <Button onClick={goNext}>{t("lifecycle.ui.editor.next")}</Button>
        ) : (
          <Button onClick={doSave} disabled={saveM.isPending}>
            {saveM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveM.isPending ? t("lifecycle.ui.editor.saving") : t("lifecycle.ui.editor.save")}
          </Button>
        )}
      </div>

      {/* Verwerfen-Bestätigung */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lifecycle.ui.editor.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("lifecycle.ui.editor.discardBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("lifecycle.ui.editor.discardCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onClose} className="bg-signal-urgent text-on-accent hover:opacity-90">
              {t("lifecycle.ui.editor.discardConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Kurz-Payload für die Klartext-Zeile (Titel/Tag/Listenname/Nachricht) — sonst null (Honesty: kein Fake). */
function actionPayloadText(
  a: ActionTypeMeta | null,
  params: Record<string, unknown>,
  lists: { id: string; name: string }[],
): string | null {
  if (!a) return null;
  if (a.key === "create_task") return (params.title as string)?.trim() || null;
  if (a.key === "add_tag") return (params.tag as string)?.trim() || null;
  if (a.key === "add_to_list") return lists.find((l) => l.id === params.list_id)?.name ?? null;
  if (a.key === "notify" || a.key === "notify_urgent") return (params.message as string)?.trim() || null;
  return null;
}

/** Ein Payload-Feld (Text / Zahl / Nachricht / Listen-Picker) — aus dem params_schema der Aktion. */
function ActionParamField({
  paramKey, required, value, onChange, lists, listsLoading, listsError,
}: {
  paramKey: string;
  required: boolean;
  value: unknown;
  onChange: (v: unknown) => void;
  lists?: { id: string; name: string; type: string }[];
  listsLoading?: boolean;
  listsError?: boolean;
}) {
  const { t } = useTranslation();
  const label = t(actionParamLabelKey(paramKey));
  const ph = t(actionParamPlaceholderKey(paramKey));

  // Listen-Picker (add_to_list) — nur statische Listen
  if (paramKey === "list_id") {
    return (
      <div>
        <label className="typo-field-label text-text-muted mb-2 block">{label}{required && <span className="text-signal-urgent"> *</span>}</label>
        {listsError ? (
          <p className="text-[12px] text-signal-urgent">{t("lifecycle.ui.editor.listLoadError")}</p>
        ) : lists && lists.length === 0 && !listsLoading ? (
          <p className="text-[12px] text-text-muted">{t("lifecycle.ui.editor.listEmpty")}</p>
        ) : (
          <Select value={(value as string) ?? ""} onValueChange={onChange} disabled={listsLoading}>
            <SelectTrigger className={FIELD}><SelectValue placeholder={listsLoading ? t("lifecycle.ui.liveCount.loading") : ph} /></SelectTrigger>
            <SelectContent>
              {(lists ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <p className="mt-1.5 text-[11px] text-text-muted">{t("lifecycle.ui.dynamicListReason")}</p>
      </div>
    );
  }

  // Zahl (due_in_days)
  const isNumber = paramKey === "due_in_days";
  // Mehrzeilig (message)
  const isTextarea = paramKey === "message";

  return (
    <div>
      <label htmlFor={`param-${paramKey}`} className="typo-field-label text-text-muted mb-2 block">
        {label}{required && <span className="text-signal-urgent"> *</span>}
      </label>
      {isTextarea ? (
        <textarea
          id={`param-${paramKey}`}
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ph}
          className={cn(FIELD, "resize-none")}
        />
      ) : (
        <input
          id={`param-${paramKey}`}
          type={isNumber ? "number" : "text"}
          min={isNumber ? 0 : undefined}
          value={(value as string | number) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ph}
          className={FIELD}
        />
      )}
    </div>
  );
}
