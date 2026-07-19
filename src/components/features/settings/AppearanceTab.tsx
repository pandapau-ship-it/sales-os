/**
 * AppearanceTab — Settings → Persönlich → Ansicht (SET-2 UI).
 *
 * Navigation pro User ein-/ausblenden + Reihenfolge (rein visuell, NIE ein Recht). Echte Daten:
 * getNavPreferences / setNavPreferences (user_preferences 057). „Einstellungen" ist fest, nicht
 * ausblendbar/sortierbar (Lock-Zeile). Reihenfolge über Hoch/Runter-Pfeile (Entscheidung C, kein Lib).
 * Ausgeblendetes bleibt per Suche/Chat erreichbar (Hinweistext). Auto-Save nach jeder Änderung.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, Bot, Target, Sprout, Users, Building2, Settings as SettingsIcon, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useModules, type ModuleKey } from "@/hooks/useModules";
import { useSaveState } from "@/hooks/useSaveState";
import { getNavPreferences, setNavPreferences } from "@/lib/db";
import { NAV_DEFAULTS, type NavPreferences } from "@/lib/settingsDefaults";
import { SettingsCard } from "@/components";
import { Switch } from "@/components/ui/switch";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meintag: Sun, "ai-sdr": Bot, hunter: Target, farmer: Sprout, kontakte: Users, companies: Building2,
};
// Modul-gebundene Nav-Einträge (Firmen-Entitlement). meintag/kontakte/companies sind immer verfügbar.
const MODULE: Record<string, ModuleKey | undefined> = {
  "ai-sdr": "ai_sdr", hunter: "hunter", farmer: "farmer",
};
const LABEL_KEY: Record<string, string> = {
  meintag: "nav.meintag", "ai-sdr": "nav.aisdr", hunter: "nav.hunter", farmer: "nav.farmer", kontakte: "nav.kontakte", companies: "nav.companies",
};

export default function AppearanceTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { organizationId } = useCurrentOrg();
  const { hasModule } = useModules();
  const qc = useQueryClient();
  const save = useSaveState();

  // Firmen-Entitlement: ist das Modul im Plan der Org aktiv? (Persönliche Präferenz wirkt nur INNERHALB.)
  const isEntitled = (route: string) => { const m = MODULE[route]; return !m || hasModule(m); };

  const query = useQuery({
    enabled: !!user?.id,
    queryKey: ["navPrefs", user?.id],
    queryFn: () => getNavPreferences(user!.id, organizationId),
    staleTime: 60_000,
  });

  // Lokaler Entwurf (optimistisch), initialisiert aus der Query.
  const [draft, setDraft] = useState<NavPreferences | null>(null);
  const prefs = draft ?? query.data ?? NAV_DEFAULTS;

  const mutation = useMutation({
    mutationFn: (next: NavPreferences) => setNavPreferences(user!.id, organizationId, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["navPrefs", user?.id] }),
  });

  const apply = (next: NavPreferences) => {
    setDraft(next);
    if (user?.id) void save.run(mutation.mutateAsync(next));
  };

  const toggle = (route: string) => {
    const hidden = prefs.hidden.includes(route)
      ? prefs.hidden.filter((r) => r !== route)
      : [...prefs.hidden, route];
    apply({ ...prefs, hidden });
  };

  const move = (route: string, dir: -1 | 1) => {
    const order = [...prefs.order];
    const i = order.indexOf(route);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    apply({ ...prefs, order });
  };

  return (
    <div className="max-w-2xl">
      <SettingsCard title={t("personal.appearance.navTitle")} description={t("personal.appearance.navDesc")} saved={save.state}>
        <div className="border border-border rounded-[12px] overflow-hidden divide-y divide-[var(--border-card)]">
          {prefs.order.map((route, idx) => {
            const Icon = ICONS[route];
            const entitled = isEntitled(route);
            const visible = entitled && !prefs.hidden.includes(route);
            return (
              <div key={route} className={`flex items-center justify-between p-3 bg-app-surface transition-colors ${entitled ? "hover:bg-app-bg" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label={t("personal.appearance.moveUp")}
                      data-tip={t("personal.appearance.moveUp")}
                      disabled={idx === 0}
                      onClick={() => move(route, -1)}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("personal.appearance.moveDown")}
                      data-tip={t("personal.appearance.moveDown")}
                      disabled={idx === prefs.order.length - 1}
                      onClick={() => move(route, 1)}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className={`flex items-center gap-2.5 ${visible ? "text-text-primary" : "text-text-muted"}`}>
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{t(LABEL_KEY[route])}</span>
                  </div>
                </div>
                {entitled ? (
                  <Switch checked={visible} onCheckedChange={() => toggle(route)} aria-label={t(LABEL_KEY[route])} />
                ) : (
                  // Nicht im Plan der Org gebucht → kein bedienbarer Toggle, klarer Hinweis (Entitlement-Ehrlichkeit).
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-text-muted">{t("personal.appearance.notInPlan")}</span>
                    <Switch checked={false} disabled aria-label={t(LABEL_KEY[route])} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Feste „Einstellungen"-Zeile — nie ausblendbar/sortierbar */}
          <div className="flex items-center justify-between p-3 bg-app-bg opacity-80 select-none">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-text-muted ml-0.5" />
              <div className="flex items-center gap-2.5 text-text-muted">
                <SettingsIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{t("nav.settings")}</span>
              </div>
            </div>
            <Switch checked disabled aria-label={t("nav.settings")} />
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 pt-3">
          <p className="text-[12px] text-text-muted max-w-sm">{t("personal.appearance.hint")}</p>
          <button
            type="button"
            onClick={() => apply(NAV_DEFAULTS)}
            className="text-[12px] font-semibold text-text-muted hover:text-sherloq-primary transition-colors shrink-0 cursor-pointer"
          >
            {t("personal.appearance.reset")}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
