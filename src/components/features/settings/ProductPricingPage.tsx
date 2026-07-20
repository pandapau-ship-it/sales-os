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
 * USPs + Wettbewerber liegen zwar auf Firmen-Ebene (org_profile) und flossen anfangs hier ein —
 * sie sind bewusst WIEDER ENTFERNT: ihr Zuhause ist die Company-Profile-Seite (Slice 3). Das
 * Backend (org_profile.usps/competitors, update_org_profile) bleibt unverändert bestehen; bis
 * Slice 3 gebaut ist, sind die beiden Listen über keine Oberfläche erreichbar. Bewusst so —
 * lieber kurz unerreichbar als dauerhaft am falschen Ort (Honesty).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Sparkles, ChevronDown } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useSaveState } from "@/hooks/useSaveState";
import {
  getProductsFull, createProduct, updateProduct, deleteProduct, type ProductRow,
} from "@/lib/db";
import { textOf } from "@/lib/i18nText";
import { computeCompleteness } from "@/lib/companyKnowledge";
import { SettingsCard, KnowledgeField } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const PRICE_MODELS = ["per_seat", "monthly", "one_time"] as const;

export default function ProductPricingPage() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { has } = useEffectivePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  // Je Karte ein eigener Zustand — sonst blinkt „Gespeichert ✓" in allen drei Karten gleichzeitig.
  const saveProducts = useSaveState();
  const canEdit = has("settings.manage");

  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  // Genau EIN Produkt offen (zuletzt bearbeitetes bzw. erstes) — der Rest bleibt eine ruhige Zeile.
  const [openId, setOpenId] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["productsFull", organizationId],
    queryFn: () => getProductsFull(organizationId),
    enabled: !!organizationId,
    staleTime: 60_000,
  });
  const products = productsQuery.data ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["productsFull", organizationId] });
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

  // scope "product": diese Seite urteilt nur über das, was sie auch anbietet —
  // USPs/Wettbewerber leben jetzt auf der Company-Profile-Seite (Slice 3).
  const completeness = computeCompleteness(
    {
      products: products.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        benefit: p.benefit, audience: p.audience, price: p.price, price_model: p.price_model,
      })),
    },
    "product",
  );

  // Ohne bewusste Auswahl ist das ERSTE Produkt offen — nie alle gleichzeitig.
  const isOpen = (id: string) => (openId ?? products[0]?.id) === id;

  /** Kurzer Status für die zugeklappte Zeile — zeigt an, was noch fehlt (aus derselben Registry). */
  const statusOf = (p: ProductRow) => {
    const open = computeCompleteness({ products: [{
      id: p.id, name: p.name, description: p.description, benefit: p.benefit,
      audience: p.audience, price: p.price, price_model: p.price_model,
    }] }, "product");
    return open.filled === open.total
      ? t("company.statusComplete")
      : t("company.statusMissing", { n: open.total - open.filled });
  };

  const addProduct = async () => {
    const id = await createProduct();
    if (id) setOpenId(id); // neues Produkt kommt aufgeklappt — man will sofort tippen
  };

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
              className="border border-[var(--border-card)] rounded-[12px] bg-app-surface group/product overflow-hidden"
            >
              {/* Kopfzeile: immer sichtbar. Zugeklappt = Name + Status, ein Klick öffnet. */}
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen(p.id) ? null : p.id)}
                  aria-expanded={isOpen(p.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-text-muted transition-transform shrink-0",
                      isOpen(p.id) ? "" : "-rotate-90",
                    )}
                  />
                  <span className="typo-card-title text-text-primary truncate">
                    {p.name.trim() || t("company.unnamedProduct")}
                  </span>
                  {!isOpen(p.id) && (
                    <span className="typo-chip text-text-muted shrink-0">
                      {statusOf(p)}
                    </span>
                  )}
                </button>

                {/* Teil 3: KI füllt SPÄTER das ganze Produkt auf einmal — heute ehrlich „Folgt". */}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-label={t("company.aiFillProduct")}
                  data-tip={t("settings.nav.comingSoon")}
                  className="h-8 px-2.5 rounded-[8px] text-text-muted opacity-40 cursor-not-allowed flex items-center gap-1.5 shrink-0 text-[12px] font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("company.aiFill")}
                </button>

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

              {isOpen(p.id) && (
              <div className="space-y-4 px-5 pb-5">
                <KnowledgeField
                  canEdit={canEdit}
                  label={t("company.field.name")}
                  value={p.name}
                  placeholder={t("company.placeholder.name")}
                  onSave={(v) => patchProduct(p.id, { name: v })}
                />
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
              )}
            </article>
          ))}
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => void write(saveProducts, addProduct())}
            className="sherloq-btn-secondary mt-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t("company.addProduct")}
          </button>
        )}
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
