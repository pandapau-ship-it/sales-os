/**
 * ProductPricingPage — Settings → Mein Unternehmen → Produkte & Preise (Slice 1/3, Migr. 077).
 *
 * Was die AI später beim Texten über euer Angebot weiß. NICHTS hier ist ein Pflichtfeld —
 * der Nutzer füllt in seinem Tempo, leere Felder bleiben ehrlich leer (kein Zwang, keine Warnung).
 *
 * Schreiben läuft AUSSCHLIESSLICH über `updateProduct`/`updateOrgProfile` (→ RPCs mit
 * Rechte-Check + audit_log). Stift, künftiger KI-Knopf und künftiger AI-Chat teilen sich damit
 * denselben Weg — kein zweiter Schreibpfad für dieselbe Sache.
 *
 * USPs + Wettbewerber gehören der FIRMA (org_profile), nicht dem Produkt: sie werden hier nur
 * gezeigt/gepflegt, damit sie nicht doppelt existieren, wenn Slice 3 das Unternehmensprofil baut.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Sparkles } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useSaveState } from "@/hooks/useSaveState";
import {
  getProductsFull, getOrgProfileLite, createProduct, updateProduct, deleteProduct, updateOrgProfile,
  type ProductRow, type OrgProfileLite,
} from "@/lib/db";
import { textOf } from "@/lib/i18nText";
import { computeCompleteness } from "@/lib/companyKnowledge";
import { SettingsCard, KnowledgeField } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const PRICE_MODELS = ["per_seat", "monthly", "one_time"] as const;

/** Stabile id für neue Listen-Einträge (USP/Wettbewerber) — trägt die Zuordnung beim Bearbeiten. */
const newId = () => `i${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export default function ProductPricingPage() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { has } = useEffectivePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  // Je Karte ein eigener Zustand — sonst blinkt „Gespeichert ✓" in allen drei Karten gleichzeitig.
  const saveProducts = useSaveState();
  const saveUsps = useSaveState();
  const saveComp = useSaveState();
  const canEdit = has("settings.manage");

  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  const [newCompetitor, setNewCompetitor] = useState("");

  const productsQuery = useQuery({
    queryKey: ["productsFull", organizationId],
    queryFn: () => getProductsFull(organizationId),
    enabled: !!organizationId,
    staleTime: 60_000,
  });
  const orgQuery = useQuery({
    queryKey: ["orgProfileLite", organizationId],
    queryFn: () => getOrgProfileLite(organizationId),
    enabled: !!organizationId,
    staleTime: 60_000,
  });

  const products = productsQuery.data ?? [];
  const org: OrgProfileLite = orgQuery.data ?? { usps: [], competitors: [] };

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["productsFull", organizationId] });
    void qc.invalidateQueries({ queryKey: ["orgProfileLite", organizationId] });
    void qc.invalidateQueries({ queryKey: ["products", organizationId] }); // Deal-Dropdown teilt die Tabelle
  };

  /** Ein Schreibweg für ALLES auf dieser Seite — inkl. sichtbarem Speicher-Zustand + Fehlerhinweis. */
  const write = async (where: ReturnType<typeof useSaveState>, p: Promise<unknown>) => {
    try {
      await where.run(p);
      invalidate();
    } catch {
      toast(t("company.saveFailed"));
    }
  };

  const patchProduct = (id: string, patch: Record<string, unknown>) =>
    write(saveProducts, updateProduct(id, patch));
  const patchOrg = (where: ReturnType<typeof useSaveState>, patch: Record<string, unknown>) =>
    write(where, updateOrgProfile(patch));

  const completeness = computeCompleteness({
    products: products.map((p) => ({
      id: p.id, name: p.name, description: p.description, benefit: p.benefit, audience: p.audience,
    })),
    usps: org.usps,
    competitors: org.competitors,
  });

  const hintText = completeness.nextHint
    ? t(`company.hint.${completeness.nextHint}`, { product: completeness.productName ?? "" })
    : t("company.hint.done");

  return (
    <div>
      <div className="mb-6">
        <h2 className="typo-page-title text-text-primary">{t("settings.nav.product-pricing")}</h2>
        <p className="typo-subline text-text-muted mt-1">{t("company.productPricingIntro")}</p>
      </div>

      {/* Vollständigkeit + Wirkungshinweis — regelbasiert, sanfter Anreiz statt Pflichtfeld */}
      <SettingsCard title={t("company.completeness")} description={t("company.completenessHelp")}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 rounded-full bg-app-bg overflow-hidden">
            <div
              className="h-full bg-sherloq-primary transition-all duration-300"
              style={{ width: `${completeness.percent}%` }}
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="typo-chip text-text-body shrink-0">
            {t("company.filledOf", { filled: completeness.filled, total: completeness.total })}
          </span>
        </div>
        <p className="typo-subline text-text-body">{hintText}</p>
      </SettingsCard>

      {/* Produkte */}
      <SettingsCard
        title={t("company.products")}
        description={t("company.productsHelp")}
        saved={saveProducts.state}
      >
        {products.length === 0 && (
          <p className="typo-subline text-text-muted mb-4">{t("company.noProducts")}</p>
        )}

        <div className="space-y-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="border border-[var(--border-card)] rounded-[12px] p-5 bg-app-surface group/product"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <KnowledgeField
                    canEdit={canEdit}
                    label={t("company.field.name")}
                    value={p.name}
                    placeholder={t("company.placeholder.name")}
                    onSave={(v) => patchProduct(p.id, { name: v })}
                  />
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p)}
                    aria-label={t("company.removeProduct")}
                    data-tip={t("company.removeProduct")}
                    className="w-8 h-8 rounded-[8px] text-text-muted hover:bg-app-bg hover:text-signal-urgent flex items-center justify-center transition-colors cursor-pointer shrink-0 opacity-0 group-hover/product:opacity-100 focus-within:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <KnowledgeField
                    canEdit={canEdit}
                  label={t("company.field.description")}
                  value={textOf(p.description)}
                  placeholder={t("company.placeholder.description")}
                  multiline
                  onSave={(v) => patchProduct(p.id, { description: v })}
                />
                <KnowledgeField
                    canEdit={canEdit}
                  label={t("company.field.benefit")}
                  value={textOf(p.benefit)}
                  placeholder={t("company.placeholder.benefit")}
                  multiline
                  onSave={(v) => patchProduct(p.id, { benefit: v })}
                />
                <KnowledgeField
                    canEdit={canEdit}
                  label={t("company.field.audience")}
                  value={textOf(p.audience)}
                  placeholder={t("company.placeholder.audience")}
                  onSave={(v) => patchProduct(p.id, { audience: v })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <KnowledgeField
                    canEdit={canEdit}
                    label={t("company.field.price")}
                    value={p.price ?? ""}
                    placeholder={t("company.placeholder.price")}
                    onSave={(v) => patchProduct(p.id, { price: v })}
                  />
                  <div>
                    <span className="typo-field-label text-text-muted block mb-1.5">
                      {t("company.field.priceModel")}
                    </span>
                    <Select
                      value={p.price_model ?? ""}
                      onValueChange={(v) => patchProduct(p.id, { price_model: v })}
                    >
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder={t("company.placeholder.priceModel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_MODELS.map((m) => (
                          <SelectItem key={m} value={m} className="text-[13px]">
                            {t(`company.priceModel.${m}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preis-Freigabe — pro Produkt, standardmäßig AUS. Der Hinweistext erklärt WARUM. */}
                <div className="rounded-[8px] bg-app-bg p-4 flex items-start gap-3">
                  <Switch
                    checked={p.ai_may_reference_price}
                    disabled={!canEdit}
                    onCheckedChange={(v) => patchProduct(p.id, { ai_may_reference_price: v })}
                    aria-label={t("company.priceRelease")}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary">
                      {t("company.priceRelease")}
                    </div>
                    <p className="typo-subline text-text-muted mt-0.5">
                      {t("company.priceReleaseHelp")}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => write(saveProducts, createProduct())}
            className="sherloq-btn-secondary mt-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t("company.addProduct")}
          </button>
        )}
      </SettingsCard>

      {/* USPs — Firmen-Ebene (org_profile), hier nur gepflegt */}
      <SettingsCard title={t("company.usps")} description={t("company.uspsHelp")} saved={saveUsps.state}>
        <div className="space-y-3">
          {org.usps.map((u, i) => (
            <div key={u.id} className="flex items-start gap-2 group/usp">
              <div className="flex-1 min-w-0">
                <KnowledgeField
                    canEdit={canEdit}
                  label={t("company.usp", { n: i + 1 })}
                  value={textOf(u.text)}
                  placeholder={t("company.placeholder.usp")}
                  multiline
                  rows={2}
                  onSave={(v) =>
                    patchOrg(saveUsps, { usps: org.usps.map((x) => (x.id === u.id ? { ...x, text: v } : x)) })
                  }
                />
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => patchOrg(saveUsps, { usps: org.usps.filter((x) => x.id !== u.id) })}
                  aria-label={t("company.removeUsp")}
                  data-tip={t("company.removeUsp")}
                  className="w-7 h-7 mt-5 rounded-[6px] text-text-muted hover:bg-app-bg hover:text-signal-urgent flex items-center justify-center transition-colors cursor-pointer shrink-0 opacity-0 group-hover/usp:opacity-100 focus-within:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => patchOrg(saveUsps, { usps: [...org.usps, { id: newId(), text: "" }] })}
            className="sherloq-btn-secondary mt-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t("company.addUsp")}
          </button>
        )}
      </SettingsCard>

      {/* Wettbewerber — ebenfalls Firmen-Ebene */}
      <SettingsCard
        title={t("company.competitors")}
        description={t("company.competitorsHelp")}
        saved={saveProducts.state}
      >
        {canEdit && (
          <div className="flex gap-2 mb-4">
            <Input
              value={newCompetitor}
              placeholder={t("company.placeholder.competitor")}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const name = newCompetitor.trim();
                if (!name) return;
                setNewCompetitor("");
                void patchOrg(saveComp, { competitors: [...org.competitors, { id: newId(), name, why_us: "" }] });
              }}
            />
            <button
              type="button"
              onClick={() => {
                const name = newCompetitor.trim();
                if (!name) return;
                setNewCompetitor("");
                void patchOrg(saveComp, { competitors: [...org.competitors, { id: newId(), name, why_us: "" }] });
              }}
              className="sherloq-btn-secondary shrink-0"
            >
              {t("company.addCompetitor")}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {org.competitors.map((c) => (
            <div key={c.id} className="border border-[var(--border-card)] rounded-[8px] p-4 group/comp">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[13px] font-semibold text-text-primary">{c.name}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => patchOrg(saveComp, { competitors: org.competitors.filter((x) => x.id !== c.id) })}
                    aria-label={t("company.removeCompetitor")}
                    data-tip={t("company.removeCompetitor")}
                    className="w-7 h-7 rounded-[6px] text-text-muted hover:bg-app-bg hover:text-signal-urgent flex items-center justify-center transition-colors cursor-pointer shrink-0 opacity-0 group-hover/comp:opacity-100 focus-within:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <KnowledgeField
                    canEdit={canEdit}
                label={t("company.whyUs", { name: c.name })}
                value={textOf(c.why_us)}
                placeholder={t("company.placeholder.whyUs")}
                multiline
                rows={2}
                onSave={(v) =>
                  patchOrg(saveComp, {
                    competitors: org.competitors.map((x) => (x.id === c.id ? { ...x, why_us: v } : x)),
                  })
                }
              />
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Was der KI-Knopf später kann — ehrlich als „Folgt", statt einen toten Knopf zu erklären */}
      <p className="typo-subline text-text-muted flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        {t("company.aiHint")}
      </p>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("company.removeProduct")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("company.removeProductConfirm", {
                name: confirmDelete?.name?.trim() || t("company.unnamedProduct"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) void write(saveProducts, deleteProduct(confirmDelete.id));
                setConfirmDelete(null);
              }}
            >
              {t("company.removeProduct")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
