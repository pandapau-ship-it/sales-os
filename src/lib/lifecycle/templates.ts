/**
 * lib/lifecycle/templates.ts — Vorlagen-Galerie des Regel-Builders (L-3c). Startpunkte, die den Editor
 * vorbefüllt öffnen. NUR echte Felder/Operatoren/Aktionen (FILTER_SCHEMA / action_types). Titel/Beschreibung i18n.
 */
import type { LifecycleRuleConditions } from "@/lib/db";
import type { FilterEntity, FilterOperator, FilterValue } from "@/lib/filter/types";

export interface RuleTemplate {
  id: string;
  titleKey: string;
  descKey: string;
  name: string; // Vorschlags-Name der Regel (User-Eingabe, nicht i18n)
  anchor: FilterEntity;
  conditions: LifecycleRuleConditions;
  action: { type: string; params?: Record<string, unknown> };
}

const grp = (entity: FilterEntity, rules: Array<{ field: string; operator: FilterOperator; value?: FilterValue }>) =>
  ({ entity, where: { logic: "AND" as const, rules } });

export const TEMPLATES: RuleTemplate[] = [
  {
    id: "churn_warning",
    titleKey: "lifecycle.templates.churn.title",
    descKey: "lifecycle.templates.churn.desc",
    name: "Churn-Frühwarnung",
    anchor: "contacts",
    conditions: { logic: "AND", groups: [grp("contacts", [{ field: "churn_score", operator: "gte", value: 61 }])] },
    action: { type: "create_task", params: { title: "Churn-Risiko prüfen" } },
  },
  {
    id: "stagnating_deal",
    titleKey: "lifecycle.templates.stagnating.title",
    descKey: "lifecycle.templates.stagnating.desc",
    name: "Deal stagniert (High Value)",
    anchor: "deals",
    conditions: { logic: "AND", groups: [grp("deals", [
      { field: "stagnation_days", operator: "gt", value: 14 },
      { field: "value", operator: "gte", value: 1000000 },
    ])] },
    action: { type: "notify_urgent" },
  },
  {
    id: "hot_icp",
    titleKey: "lifecycle.templates.hotIcp.title",
    descKey: "lifecycle.templates.hotIcp.desc",
    name: "Heißer ICP-Lead",
    anchor: "contacts",
    conditions: { logic: "AND", groups: [grp("contacts", [
      { field: "icp_score", operator: "gte", value: 80 },
      { field: "heat_status", operator: "in", value: ["heiss", "warm"] },
    ])] },
    action: { type: "add_tag", params: { tag: "Hot ICP" } },
  },
  {
    id: "trial_ending",
    titleKey: "lifecycle.templates.trial.title",
    descKey: "lifecycle.templates.trial.desc",
    name: "Trial-Ende Follow-up",
    anchor: "companies",
    conditions: { logic: "AND", groups: [grp("companies", [{ field: "subscription_status", operator: "eq", value: "trial" }])] },
    action: { type: "notify" },
  },
  {
    id: "customer_cooling",
    titleKey: "lifecycle.templates.cooling.title",
    descKey: "lifecycle.templates.cooling.desc",
    name: "Kunde wird kalt",
    anchor: "contacts",
    conditions: { logic: "AND", groups: [grp("contacts", [
      { field: "contact_status", operator: "eq", value: "kunde" },
      { field: "heat_status", operator: "in", value: ["kalt", "tot"] },
    ])] },
    action: { type: "notify_urgent" },
  },
];
