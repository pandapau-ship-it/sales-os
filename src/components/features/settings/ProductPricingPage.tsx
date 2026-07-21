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
import { AI_PILL_PENDING } from "@/lib/componentBehavior";
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
import { SettingsCard, KnowledgeField, StatusBadge } from "@/components";
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
  // Offenes Produkt. Drei Zustände bewusst getrennt, sonst verhält sich der Chevron des ersten
  // Produkts anders als alle anderen: `undefined` = noch keine Wahl getroffen (→ erstes Produkt
  // offen) · `null` = bewusst alles zugeklappt · id = diese Karte offen.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

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

  // Ohne bewusste Auswahl ist das ERSTE Produkt offen — nie alle gleichzeitig. Zeigt die Auswahl
  // auf ein nicht mehr existierendes Produkt (gerade gelöscht), fällt sie auf das erste zurück,
  // statt die Seite komplett zugeklappt stehen zu lassen.
  const activeId =
    openId === undefined || (openId !== null && !products.some((p) => p.id === openId))
      ? products[0]?.id
      : openId;
  const isOpen = (id: string) => activeId === id;

  /**
   * Wie viele wichtige Angaben fehlen diesem Produkt noch? Nutzt DIESELBE Registry wie die
   * Vollständigkeits-Anzeige oben (`fieldImportance.ts`) — keine zweite, parallele Logik.
   * 0 = nichts required/recommended offen → auf der zugeklappten Zeile erscheint gar kein Hinweis.
   */
  const openCountOf = (p: ProductRow) => {
    const r = computeCompleteness({ products: [{
      id: p.id, name: p.name, description: p.description, benefit: p.benefit,
      audience: p.audience, price: p.price, price_model: p.price_model,
    }] }, "product");
    return r.total - r.filled;
  };

  const addProduct = async () => {
    const id = await createProduct();
    if (id) setOpenId(id); // neues Produkt kommt aufgeklappt — man will sofort tippen
  };

  const removeProduct = async (p: ProductRow) => {
    await deleteProduct(p.id);
    // Nur die Auswahl zurücksetzen, wenn das GELÖSCHTE Produkt das offene war — sonst würde
    // das Löschen einer anderen Karte die Ansicht des Nutzers ungefragt umspringen lassen
    // (und ein bewusst zugeklappter Zustand ginge verloren).
    setOpenId((cur) => (cur === p.id ? undefined : cur));
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
                  {/* Zugeklappt: dezenter Hinweis, WENN etwas Wichtiges fehlt. Neutral-grau,
                      kein Warn-Ton — es ist eine Einladung, kein Alarm. Vollständig → nichts. */}
                  {!isOpen(p.id) && openCountOf(p) > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full typo-chip bg-app-bg text-text-muted shrink-0"
                      data-tip={t("company.statusMissingTip")}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0" />
                      {t("company.statusMissing", { n: openCountOf(p) })}
                    </span>
                  )}
                </button>

                {/* Preismodell-Badge — im Kopf, immer sichtbar (auf+zu), analog zum Passungs-Badge
                    bei den Zielgruppen. Kategorie ohne Gut/Schlecht → ein konsistenter farbiger Ton
                    (info). Kein Modell gesetzt → kein Badge (Honesty). */}
                {p.price_model && (
                  <span className="shrink-0">
                    <StatusBadge tone="info" label={t(`company.priceModel.${p.price_model}`)} />
                  </span>
                )}

                {/* Teil 3: KI füllt SPÄTER das ganze Produkt auf einmal — heute ehrlich „Folgt". */}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-label={t("company.aiFillProduct")}
                  data-tip={t("settings.nav.comingSoon")}
                  className={`${AI_PILL_PENDING} px-2.5 py-1 shrink-0`}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <KnowledgeField
                  canEdit={canEdit}
                    label={t("company.field.price")}
                    value={p.price ?? ""}
                    placeholder={t("company.placeholder.price")}
                    onSave={(v) => patchProduct(p.id, { price: v })}
                  />
                  <div>
                    <label
                      htmlFor={`price-model-${p.id}`}
                      className="typo-field-label text-text-muted block mb-1.5"
                    >
                      {t("company.field.priceModel")}
                    </label>
                    <Select
                      value={p.price_model ?? ""}
                      onValueChange={(v) => patchProduct(p.id, { price_model: v })}
                    >
                      <SelectTrigger
                        id={`price-model-${p.id}`}
                        aria-label={t("company.field.priceModel")}
                        className="h-9 text-[13px]"
                      >
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
                if (confirmDelete) void write(saveProducts, removeProduct(confirmDelete));
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
