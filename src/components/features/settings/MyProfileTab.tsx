/**
 * MyProfileTab — Settings → Persönlich → Mein Profil (SET-2 UI).
 *
 * Echte Daten: getMyProfile / updateMyProfile (auth.uid()-eigener Datensatz, validiert + audit_log).
 * Sprache: setLanguage (i18n/localStorage, sofortiger Wechsel) + Persistenz in user_preferences
 * ('ui.language') für spätere Cross-Device-/Chat-Nutzung (Entscheidung A). KEINE Personal-Voice-Karte
 * (gehört in „Mein Unternehmen"). Avatar v1 = Anzeige (Upload folgt, Entscheidung B). Auto-Save je Karte.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useSaveState } from "@/hooks/useSaveState";
import { getMyProfile, updateMyProfile, setUserPreference, getProfileStats } from "@/lib/db";
import { setLanguage, type Language } from "@/lib/i18n";
import { isValidUrl } from "@/lib/validation";
import { Avatar, SettingsCard } from "@/components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "de", label: "Deutsch" }, { code: "en", label: "English" }, { code: "es", label: "Español" },
];
// E3-Kanon: Cal.com oder externer Link (beliebiger Anbieter).
const PROVIDERS = ["calcom", "external"] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="typo-field-label text-text-muted mb-1.5 block">{children}</label>;
}

export default function MyProfileTab() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { organizationId, role } = useCurrentOrg();
  const qc = useQueryClient();

  const profileQuery = useQuery({
    enabled: !!user?.id,
    queryKey: ["myProfile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    staleTime: 60_000,
  });
  const p = profileQuery.data;

  // Profil-Statistik (eigene Kontakte + deren Companies) — reine Zähl-Abfrage.
  const statsQuery = useQuery({
    enabled: !!user?.id,
    queryKey: ["profileStats", user?.id],
    queryFn: getProfileStats,
    staleTime: 60_000,
  });
  const stats = statsQuery.data;

  const memberSince = p?.created_at
    ? new Date(p.created_at).toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const general = useSaveState();
  const lang = useSaveState();
  const booking = useSaveState();
  const sig = useSaveState();

  const save = useMutation({
    mutationFn: (patch: Record<string, string>) => updateMyProfile(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myProfile", user?.id] }),
  });

  // Lokaler Entwurf für Felder, die on-blur speichern (kein Flackern während des Tippens).
  const [name, setName] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);

  const nameVal = name ?? p?.full_name ?? "";
  const linkVal = link ?? p?.booking_link ?? "";
  const sigVal = signature ?? p?.signature ?? "";
  const currentLang = i18n.language as Language;

  const roleLabel = t(`settings.team.role${role.charAt(0).toUpperCase()}${role.slice(1)}`, role);

  return (
    <div className="max-w-3xl">
      {/* Allgemein: Avatar · Name · Rolle */}
      <SettingsCard title={t("personal.profile.generalTitle")} description={t("personal.profile.generalDesc")} saved={general.state}>
        <div className="flex items-center gap-6">
          <Avatar name={nameVal || p?.email || "?"} src={p?.avatar_url ?? undefined} size={72} />
          <div className="flex-1 flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
              <FieldLabel>{t("personal.profile.name")}</FieldLabel>
              <Input
                value={nameVal}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { if (nameVal !== (p?.full_name ?? "")) void general.run(save.mutateAsync({ full_name: nameVal })); }}
                placeholder={t("personal.profile.namePlaceholder")}
              />
            </div>
            <div>
              <FieldLabel>{t("personal.profile.role")}</FieldLabel>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-[7px] bg-app-bg text-text-body typo-chip">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Dezente Statistik-Zeile + „Dabei seit" — reine Anzeige, echte Zähl-Daten */}
        {(stats || memberSince) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-4 mt-1 border-t border-[var(--border-card)] text-[12px] text-text-muted">
            {stats && <span>{t("personal.profile.statsContacts", { count: stats.contacts })}</span>}
            {stats && <span aria-hidden className="text-border">·</span>}
            {stats && <span>{t("personal.profile.statsCompanies", { count: stats.companies })}</span>}
            {memberSince && (
              <span className="ml-auto">{t("personal.profile.memberSince", { date: memberSince })}</span>
            )}
          </div>
        )}
      </SettingsCard>

      {/* Sprache */}
      <SettingsCard title={t("personal.profile.langTitle")} description={t("personal.profile.langDesc")} saved={lang.state}>
        <div className="max-w-xs">
          <FieldLabel>{t("personal.profile.language")}</FieldLabel>
          <Select
            value={currentLang}
            onValueChange={(code) => {
              setLanguage(code as Language);
              if (user?.id) void lang.run(setUserPreference(user.id, organizationId, "ui.language", { lang: code }));
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>

      {/* Booking-Quelle */}
      <SettingsCard title={t("personal.profile.bookingTitle")} description={t("personal.profile.bookingDesc")} saved={booking.state}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>{t("personal.profile.provider")}</FieldLabel>
            <Select
              value={p?.booking_provider ?? undefined}
              onValueChange={(code) => void booking.run(save.mutateAsync({ booking_provider: code }))}
            >
              <SelectTrigger><SelectValue placeholder={t("personal.profile.providerPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((code) => <SelectItem key={code} value={code}>{t(`personal.profile.provider_${code}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>{t("personal.profile.bookingLink")}</FieldLabel>
            <Input
              type="url"
              value={linkVal}
              aria-invalid={linkError}
              onChange={(e) => { setLink(e.target.value); setLinkError(false); }}
              onBlur={() => {
                if (linkVal === (p?.booking_link ?? "")) return;
                if (linkVal && !isValidUrl(linkVal)) { setLinkError(true); return; }
                void booking.run(save.mutateAsync({ booking_link: linkVal }));
              }}
              placeholder={p?.booking_provider === "external" ? t("personal.profile.bookingLinkExternalPlaceholder") : "https://..."}
            />
            {linkError && <p className="text-[12px] text-signal-urgent mt-1" role="alert">{t("personal.profile.linkInvalid")}</p>}
          </div>
        </div>
      </SettingsCard>

      {/* Signatur */}
      <SettingsCard title={t("personal.profile.sigTitle")} description={t("personal.profile.sigDesc")} saved={sig.state}>
        <div>
          <FieldLabel>{t("personal.profile.signature")}</FieldLabel>
          <Textarea
            rows={8}
            value={sigVal}
            onChange={(e) => setSignature(e.target.value)}
            onBlur={() => { if (sigVal !== (p?.signature ?? "")) void sig.run(save.mutateAsync({ signature: sigVal })); }}
            placeholder={t("personal.profile.sigPlaceholder")}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
