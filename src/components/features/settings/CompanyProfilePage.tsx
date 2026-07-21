/**
 * CompanyProfilePage — Settings → Mein Unternehmen → Unternehmensprofil (Slice 3a, Migr. 080).
 *
 * Zwei Reiter: „Überblick" (summary/USP/Produktmodell/Nutzen/Probleme/Ergebnisse) und
 * „Angebot & Markt" (Angebote + Wettbewerber direkt/angrenzend). ICPs/Personas = Slice 3b.
 *
 * Muster wie Slice 1/2: durchgehend sichtbare graue Felder (`KnowledgeField` / neue
 * `KnowledgeListField`), Speichern beim Verlassen, EIN Schreibweg (`updateOrgProfile` → RPC
 * `update_org_profile` mit Whitelist + `field_meta`-locked + audit_log), Vollständigkeits-Ring
 * über DIESELBE Registry (`fieldImportance.ts`, Scope „org"). Alle Felder optional.
 *
 * Der „AI Context Builder" ist die bewusste Dark-Ausnahme (wie der AI Voice Trainer) — dunkle
 * Fläche + türkis über die geteilten Tokens `--ai-panel-*`, zwei echte Buttons, „Folgt" bis `lib/ai.ts`.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Globe, MessageSquare, Layers, Briefcase } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useSaveState } from "@/hooks/useSaveState";
import { getOrgProfile, updateOrgProfile, type OrgProfile } from "@/lib/db";
import { textOf } from "@/lib/i18nText";
import { computeCompleteness } from "@/lib/companyKnowledge";
import { SettingsCard, KnowledgeField, KnowledgeListField, PanelTabs } from "@/components";
import type { ListItem } from "@/components/panel-blocks/KnowledgeListField";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toastContext";

export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { has } = useEffectivePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  const save = useSaveState();
  const canEdit = has("settings.manage");

  const [tab, setTab] = useState<"overview" | "offerings">("overview");

  const query = useQuery({
    queryKey: ["orgProfile", organizationId],
    queryFn: () => getOrgProfile(organizationId),
    enabled: !!organizationId,
    staleTime: 60_000,
  });
  const org: OrgProfile = query.data ?? {
    summary: "", product_service_model: "", value_outcome: "",
    usps: [], problems_solved: [], business_outcomes: [], offerings: [], competitors: [],
  };

  /** EIN Schreibweg für ALLES auf dieser Seite (inkl. Speicher-Zustand + Fehlerhinweis). */
  const patchOrg = async (patch: Record<string, unknown>) => {
    try {
      await save.run(updateOrgProfile(patch));
      void qc.invalidateQueries({ queryKey: ["orgProfile", organizationId] });
    } catch {
      toast(t("company.saveFailed"));
    }
  };
  const setText = (key: string, v: string) => patchOrg({ [key]: v });
  const setList = (key: string, items: ListItem[]) => patchOrg({ [key]: items });

  // Wettbewerber: EINE Spalte `competitors`, im UI nach `kind` in zwei Listen geteilt.
  const isAdjacent = (c: { kind?: string }) => c.kind === "adjacent";
  const directItems = (org.competitors ?? []).filter((c) => !isAdjacent(c)) as unknown as ListItem[];
  const adjacentItems = (org.competitors ?? []).filter(isAdjacent) as unknown as ListItem[];
  const setCompetitors = (kind: "direct" | "adjacent", items: ListItem[]) => {
    const tagged = items.map((it) => ({ ...it, kind }));
    const other = (org.competitors ?? []).filter((c) =>
      kind === "direct" ? isAdjacent(c) : !isAdjacent(c),
    );
    patchOrg({ competitors: [...tagged, ...other] });
  };

  // Vollständigkeit: DIESELBE Registry, Scope „org" (products bewusst leer — hier geht es um die Firma).
  const completeness = computeCompleteness(
    {
      products: [],
      summary: org.summary, product_service_model: org.product_service_model, value_outcome: org.value_outcome,
      usps: org.usps, competitors: org.competitors,
      problems_solved: org.problems_solved, business_outcomes: org.business_outcomes, offerings: org.offerings,
    },
    "org",
  );
  const hintText = completeness.nextHint
    ? t(`company.hint.${completeness.nextHint}`)
    : t("company.hint.done");

  const tabs = [
    { id: "overview", label: t("company.profile.tab.overview"), icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "offerings", label: t("company.profile.tab.offerings"), icon: <Briefcase className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="typo-page-title text-text-primary">{t("settings.nav.unternehmensprofil")}</h2>
        <p className="typo-subline text-text-muted mt-1">{t("company.profile.intro")}</p>
      </div>

      {/* Kopf: Zusammenfassung (links) + AI Context Builder (rechts, Dark-Ausnahme), nebeneinander. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 items-stretch">
        <SettingsCard
          className="md:col-span-7 mb-0 h-full"
          title={t("company.profile.summary.label")}
          description={t("company.profile.summary.help")}
          saved={save.state}
        >
          <KnowledgeField
            canEdit={canEdit}
            value={textOf(org.summary)}
            placeholder={t("company.profile.summary.ph")}
            multiline
            rows={4}
            onSave={(v) => setText("summary", v)}
          />
        </SettingsCard>

        {/* AI Context Builder — bewusste Dark-Ausnahme (Tokens --ai-panel-*), zwei echte Buttons „Folgt". */}
        <section className="md:col-span-5 h-full bg-[var(--ai-panel-surface)] rounded-[12px] p-6 flex flex-col">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[var(--ai-panel-accent)]" />
              <span className="typo-section-label text-[var(--ai-panel-accent)]">{t("company.profile.contextTitle")}</span>
            </div>
            <p className="typo-subline text-[var(--ai-panel-muted)]">{t("company.profile.contextHelp")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-auto pt-4">
            <Button
              type="button" size="sm" disabled
              aria-label={t("company.profile.scanCta")}
              data-tip={t("settings.nav.comingSoon")}
              className="rounded-full bg-sherloq-primary text-on-accent hover:bg-sherloq-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Globe className="w-4 h-4" />
              {t("company.profile.scanCta")}
            </Button>
            <Button
              type="button" size="sm" disabled
              aria-label={t("company.profile.chatCta")}
              data-tip={t("settings.nav.comingSoon")}
              className="rounded-full bg-[var(--on-accent)] text-[var(--ai-panel-surface)] hover:bg-[var(--on-accent)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              {t("company.profile.chatCta")}
            </Button>
          </div>
        </section>
      </div>

      {/* Vollständigkeit — regelbasiert, sanfter Anreiz (wie Slice 1/2) */}
      <SettingsCard title={t("company.completeness")} description={t("company.profile.completenessHelp")}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 rounded-full bg-app-bg overflow-hidden">
            <div
              className="h-full bg-sherloq-primary transition-all duration-300"
              style={{ width: `${completeness.percent}%` }}
              role="progressbar" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100}
            />
          </div>
          <span className="typo-chip text-text-body shrink-0">
            {t("company.filledOf", { filled: completeness.filled, total: completeness.total })}
          </span>
        </div>
        <p className="typo-subline text-text-body">{hintText}</p>
      </SettingsCard>

      {/* Reiter */}
      <SettingsCard title={t("company.profile.detailsTitle")} description={t("company.profile.detailsHelp")} saved={save.state}>
        <div className="border-b border-[var(--border-card)] mb-5">
          <PanelTabs tabs={tabs} active={tab} onChange={(id) => setTab(id as typeof tab)} />
        </div>

        {tab === "overview" ? (
          <div className="space-y-6">
            <KnowledgeListField
              canEdit={canEdit}
              label={t("company.profile.usps.label")}
              items={org.usps as unknown as ListItem[]}
              fields={[{ key: "text", placeholder: t("company.profile.usps.ph"), multiline: true }]}
              addLabel={t("company.profile.usps.add")}
              removeLabel={t("company.profile.usps.remove")}
              emptyHint={t("company.profile.usps.empty")}
              onChange={(items) => setList("usps", items)}
            />
            <KnowledgeField
              canEdit={canEdit}
              label={t("company.profile.productModel.label")}
              value={textOf(org.product_service_model)}
              placeholder={t("company.profile.productModel.ph")}
              multiline
              onSave={(v) => setText("product_service_model", v)}
            />
            <KnowledgeField
              canEdit={canEdit}
              label={t("company.profile.valueOutcome.label")}
              value={textOf(org.value_outcome)}
              placeholder={t("company.profile.valueOutcome.ph")}
              multiline
              onSave={(v) => setText("value_outcome", v)}
            />
            <KnowledgeListField
              canEdit={canEdit}
              label={t("company.profile.problems.label")}
              items={org.problems_solved as unknown as ListItem[]}
              fields={[{ key: "text", placeholder: t("company.profile.problems.ph") }]}
              addLabel={t("company.profile.problems.add")}
              removeLabel={t("company.profile.problems.remove")}
              emptyHint={t("company.profile.problems.empty")}
              onChange={(items) => setList("problems_solved", items)}
            />
            <KnowledgeListField
              canEdit={canEdit}
              label={t("company.profile.outcomes.label")}
              items={org.business_outcomes as unknown as ListItem[]}
              fields={[{ key: "text", placeholder: t("company.profile.outcomes.ph") }]}
              addLabel={t("company.profile.outcomes.add")}
              removeLabel={t("company.profile.outcomes.remove")}
              emptyHint={t("company.profile.outcomes.empty")}
              onChange={(items) => setList("business_outcomes", items)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <KnowledgeListField
              canEdit={canEdit}
              label={t("company.profile.offerings.label")}
              items={org.offerings as unknown as ListItem[]}
              fields={[
                { key: "title", label: t("company.profile.offerings.titleLabel"), placeholder: t("company.profile.offerings.titlePh") },
                { key: "text", label: t("company.profile.offerings.textLabel"), placeholder: t("company.profile.offerings.textPh"), multiline: true },
              ]}
              addLabel={t("company.profile.offerings.add")}
              removeLabel={t("company.profile.offerings.remove")}
              emptyHint={t("company.profile.offerings.empty")}
              onChange={(items) => setList("offerings", items)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KnowledgeListField
                canEdit={canEdit}
                label={t("company.profile.competitors.directLabel")}
                items={directItems}
                fields={[
                  { key: "name", label: t("company.profile.competitors.nameLabel"), placeholder: t("company.profile.competitors.namePh") },
                  { key: "why_us", label: t("company.profile.competitors.whyLabel"), placeholder: t("company.profile.competitors.whyPh"), multiline: true },
                ]}
                addLabel={t("company.profile.competitors.add")}
                removeLabel={t("company.profile.competitors.remove")}
                emptyHint={t("company.profile.competitors.empty")}
                onChange={(items) => setCompetitors("direct", items)}
              />
              <KnowledgeListField
                canEdit={canEdit}
                label={t("company.profile.competitors.adjacentLabel")}
                items={adjacentItems}
                fields={[
                  { key: "name", label: t("company.profile.competitors.nameLabel"), placeholder: t("company.profile.competitors.namePh") },
                  { key: "why_us", label: t("company.profile.competitors.whyLabel"), placeholder: t("company.profile.competitors.whyPh"), multiline: true },
                ]}
                addLabel={t("company.profile.competitors.add")}
                removeLabel={t("company.profile.competitors.remove")}
                emptyHint={t("company.profile.competitors.empty")}
                onChange={(items) => setCompetitors("adjacent", items)}
              />
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Was der KI-Knopf/Scan später kann — ehrlich als „Folgt" */}
      <p className="typo-subline text-text-muted flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        {t("company.profile.aiHint")}
      </p>
    </div>
  );
}
