/**
 * SettingsShell — Einstiegs-Ansicht der Einstellungen (Route /app/settings, SET-3).
 *
 * Aufbau (Referenz-Struktur, eigene Umsetzung): Zurück-Button oben links · links die vollständige
 * Gruppen-Navigation nach `settingsNav.ts` (Bauplan Abschnitt 1) · rechts die aktive Seite.
 * Nur gebaute Seiten sind klickbar; alles andere ist ausgegraut + „Folgt" (nicht fokussierbar) —
 * die Hülle steht damit EINMAL vollständig, künftige Slices setzen nur `built: true`.
 * „Persönlich" ist bewusst KEINE Gruppe: unten steht EIN dezenter Verweis auf /app/profil.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { isElevatedRole } from "@/lib/permissions";
import {
  SETTINGS_GROUP_ORDER, visibleSettingsPages, type SettingsPage,
} from "@/lib/settingsNav";
import { cn } from "@/lib/utils";
import TeamMembersPage from "./TeamMembersPage";
import ProductPricingPage from "./ProductPricingPage";
import PersonalVoicePage from "./PersonalVoicePage";
import CompanyProfilePage from "./CompanyProfilePage";
import RulesPage from "./RulesPage";
import RuleOverview from "./lifecycle/RuleOverview";

export default function SettingsShell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role } = useCurrentOrg();
  const { has } = useEffectivePermissions();
  const ctx = { isElevated: isElevatedRole(role), has };

  // Aktive Seite über die URL (?page=…) → deeplink- und teilbar. Default = erste gebaute Seite („Team & Rechte").
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("page") ?? "team";
  const setActive = (key: string) => setSearchParams({ page: key });

  const renderItem = (p: SettingsPage) => {
    const disabled = !p.built;
    return (
      <button
        key={p.key}
        type="button"
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        data-tip={disabled ? t("settings.nav.comingSoon") : undefined}
        onClick={() => !disabled && setActive(p.key)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors",
          disabled
            ? "text-text-muted opacity-50 cursor-not-allowed"
            : active === p.key
              ? "bg-app-surface text-sherloq-primary font-semibold shadow-[var(--shadow-card)]"
              : "text-text-body hover:bg-app-surface cursor-pointer",
        )}
      >
        {t(`settings.nav.${p.key}`)}
        {disabled && <span className="ml-2 text-[10px] uppercase tracking-wider">{t("settings.nav.comingSoon")}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* Linke Gruppen-Navigation */}
      <aside className="w-full md:w-60 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t("common.back")}
          className="inline-flex items-center gap-1.5 mb-5 text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </button>

        <h1 className="typo-page-title text-text-primary mb-5">{t("settings.title")}</h1>

        <nav className="space-y-5">
          {SETTINGS_GROUP_ORDER.map((group) => {
            const pages = visibleSettingsPages(group, ctx);
            if (pages.length === 0) return null; // Gruppe ohne sichtbare Seite → ganz weg (Rollen-Sichtbarkeit)
            return (
              <div key={group}>
                <div className="typo-section-label text-text-muted mb-1.5 px-3">
                  {t(`settings.groups.${group}`)}
                </div>
                <div className="space-y-0.5">{pages.map(renderItem)}</div>
              </div>
            );
          })}
        </nav>

        {/* Dezenter Verweis statt eigener „Persönlich"-Gruppe (Struktur-Korrektur) */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate("/app/profil")}
            className="inline-flex items-center gap-1.5 px-3 text-[12px] font-medium text-text-muted hover:text-sherloq-primary transition-colors cursor-pointer"
          >
            {t("settings.personalLink")}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Rechte Seite: aktive Settings-Seite (aktuell nur Team & Rechte gebaut) */}
      <div className="flex-1 min-w-0">
        {active === "team" && <TeamMembersPage />}
        {active === "product-pricing" && <ProductPricingPage />}
        {active === "personal-voice" && <PersonalVoicePage />}
        {active === "unternehmensprofil" && <CompanyProfilePage />}
        {active === "regeln" && <RulesPage />}
        {active === "automatik-regeln" && <RuleOverview />}
      </div>
    </div>
  );
}
