/**
 * PersonalVoicePage — Settings → Mein Unternehmen → Personal Voice (Slice 2/3, Migr. 078/079).
 *
 * Die eigene Schreibstimme des Users (pro User, visibility:'self') — was der AI SDR später braucht,
 * um in DEINER Stimme zu texten. Klar getrennt von contacts.personality_profile (Empfänger).
 *
 * Muster identisch zu „Produkte & Preise" (Slice 1): durchgehend sichtbare graue `KnowledgeField`-
 * Eingabefelder (kein Read-Mode/Stift), Speichern beim Verlassen des Feldes, EIN Schreibweg
 * (updateVoiceProfile → RPC mit Whitelist + audit_log), Vollständigkeits-Ring über DIESELBE
 * Registry (`fieldImportance.ts`, scope "voice"). KI-Aktionen sind sichtbar als „Folgt"
 * (`AI_PILL_PENDING`) — es gibt noch keine echte Analyse (`lib/ai.ts` fehlt), also KEIN Fake.
 *
 * Fünf Kanäle: overview + post/comment/dm + email (das Referenz-Design kennt email nicht; der
 * AI SDR mailt aber primär). Alle Felder optional — nichts ist Pflicht (bereichsweite Regel).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Layers, FileText, MessageSquare, Send, Mail, Check, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useSaveState } from "@/hooks/useSaveState";
import {
  getMyVoiceProfile, updateVoiceProfile, getMyProfile,
  type VoiceProfile, type VoiceChannel, type VoiceChannelKey,
} from "@/lib/db";
import { textOf } from "@/lib/i18nText";
import { AI_PILL_PENDING } from "@/lib/componentBehavior";
import { computeCompleteness, type KnowledgeVoiceChannel } from "@/lib/companyKnowledge";
import { SettingsCard, KnowledgeField, PanelTabs, Avatar } from "@/components";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toastContext";

const CHANNELS: VoiceChannelKey[] = ["post", "comment", "dm", "email"];

export default function PersonalVoicePage() {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const save = useSaveState();
  const { toast } = useToast();
  // Self-Service: die eigene Voice ist immer editierbar, sobald eine Session existiert
  // (kein settings.manage — der Server prüft ohnehin auth.uid()).
  const canEdit = !!user?.id;

  const [activeTab, setActiveTab] = useState<"overview" | VoiceChannelKey>("overview");

  const voiceQuery = useQuery({
    enabled: !!organizationId && !!user?.id,
    queryKey: ["voiceProfile", organizationId, user?.id],
    queryFn: () => getMyVoiceProfile(organizationId, user!.id),
    staleTime: 60_000,
  });
  // Für die Profil-Vorschau: echte Daten (Name/Avatar/E-Mail), kein Mock.
  const profileQuery = useQuery({
    enabled: !!user?.id,
    queryKey: ["myProfile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    staleTime: 60_000,
  });

  const voice: VoiceProfile = voiceQuery.data ?? {
    overview: {}, post: {}, comment: {}, dm: {}, email: {}, primary_channel: "email",
  };

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["voiceProfile", organizationId, user?.id] });

  /** EIN Schreibweg für die ganze Seite — inkl. sichtbarem Speicher-Zustand + Fehlerhinweis. */
  const write = async (p: Promise<unknown>) => {
    try {
      await save.run(p);
      invalidate();
    } catch {
      toast(t("company.saveFailed"));
    }
  };

  /**
   * Ein Feld genau eines Kanals (bzw. overview) patchen — der Server merged shallow. `v` ist
   * meist ein String; für „Do's & Don'ts" ein Objekt {always,never} (zwei Teile DESSELBEN Feldes).
   */
  const patchVoice = (group: "overview" | VoiceChannelKey, field: string, v: unknown) =>
    write(updateVoiceProfile({ [group]: { [field]: v } }));

  // Vollständigkeit: DIESELBE Registry wie Slice 1, scope "voice" (products bewusst leer —
  // dieser Bereich urteilt nur über Voice-Felder). dos_donts ist optional → zählt nicht, daher "".
  const toChannel = (c: VoiceChannel): KnowledgeVoiceChannel => ({
    samples: c.samples ?? "", sentence_style: c.sentence_style ?? "",
    hooks: c.hooks ?? "", dos_donts: "",
  });
  const completeness = computeCompleteness(
    {
      products: [],
      voice: {
        overview: {
          bio: voice.overview.bio ?? "", themes: voice.overview.themes ?? "",
          style: voice.overview.style ?? "", tone: voice.overview.tone ?? "",
        },
        post: toChannel(voice.post), comment: toChannel(voice.comment),
        dm: toChannel(voice.dm), email: toChannel(voice.email),
      },
    },
    "voice",
  );
  const hintText = completeness.nextHint
    ? t(`company.hint.${completeness.nextHint}`)
    : t("company.hint.done");

  const TAB_ICON: Record<string, React.ReactNode> = {
    overview: <Layers className="w-3.5 h-3.5" />,
    post: <FileText className="w-3.5 h-3.5" />,
    comment: <MessageSquare className="w-3.5 h-3.5" />,
    dm: <Send className="w-3.5 h-3.5" />,
    email: <Mail className="w-3.5 h-3.5" />,
  };
  const tabs = [
    { id: "overview", label: t("voice.tab.overview"), icon: TAB_ICON.overview },
    ...CHANNELS.map((c) => ({ id: c, label: t(`voice.tab.${c}`), icon: TAB_ICON[c] })),
  ];

  // „So klingt das" / KI-Vorschlag je Feld sind AI-Features → sichtbar als „Folgt", nie Fake.
  const aiPending = (label: string) => (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={label}
      data-tip={t("settings.nav.comingSoon")}
      className={`${AI_PILL_PENDING} px-2.5 py-1 shrink-0`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  const previewName = profileQuery.data?.full_name?.trim() || profileQuery.data?.email || "";
  // Jobtitel/Firma werden angezeigt, WENN das Profil sie liefert (Honesty: kein Fake). Die heutige
  // `users`-Tabelle hat diese Spalten NICHT → sie erscheinen korrekt nicht; sobald sie ergänzt
  // werden (getMyProfile-Select), rendert diese Logik sie automatisch — defensiver optionaler Lesezugriff.
  const prof = profileQuery.data as (typeof profileQuery.data & { job_title?: string; company?: string }) | undefined;
  const previewSub = [prof?.job_title?.trim(), prof?.company?.trim()].filter(Boolean).join(" · "); // single-source-ok: eigenes User-Profil (getMyProfile/users), kein contacts-Wert

  return (
    <div>
      <div className="mb-6">
        <h2 className="typo-page-title text-text-primary">{t("settings.nav.personal-voice")}</h2>
        <p className="typo-subline text-text-muted mt-1">{t("voice.intro")}</p>
      </div>

      {/* Voice-Karte + AI Voice Trainer NEBENEINANDER (6/6), nicht volle Breite — 6/6 statt 7/5,
          damit die längeren deutschen Trainer-Button-Labels auf EINER Zeile passen. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 items-stretch">
        {/* Profil-Vorschau — WESSEN Stimme das ist. Echte Daten (Name/E-Mail/Avatar), kein Mock. */}
        <SettingsCard
          className="md:col-span-6 mb-0 h-full"
          title={t("voice.previewTitle")}
          description={t("voice.previewHelp")}
        >
          {previewName ? (
            <div className="flex items-center gap-3 rounded-[12px] bg-app-bg border border-[var(--border-card)] p-4">
              <Avatar name={previewName} src={profileQuery.data?.avatar_url ?? undefined} size={44} />
              <div className="min-w-0">
                <div className="typo-card-title text-text-primary truncate">{previewName}</div>
                {previewSub && (
                  <div className="typo-subline text-text-body truncate">{previewSub}</div>
                )}
                {profileQuery.data?.email && (
                  <div className="typo-subline text-text-muted truncate">{profileQuery.data.email}</div>
                )}
              </div>
            </div>
          ) : (
            <p className="typo-subline text-text-muted">{t("voice.previewEmpty")}</p>
          )}
        </SettingsCard>

        {/* AI Voice Trainer — BEWUSSTE EINZELFALL-AUSNAHME (Entscheidung Oliver): GENAU diese Kachel
            übernimmt die Original-Referenz-Optik (dunkle Fläche + türkise Schrift), immer dunkel in
            beiden Modi. Farben leben als Tokens in index.css (audit-konform), keine rohen Hex im JSX.
            Zwei ECHTE Buttons (gefüllter Haupt- + heller Zweit-Button, rounded-full) — bleiben aber
            „Folgt"/disabled bis `lib/ai.ts` existiert (Honesty: kein Knopf, der Funktion nur vortäuscht). */}
        <section className="md:col-span-6 h-full bg-[var(--voice-trainer-surface)] rounded-[12px] p-6 flex flex-col">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[var(--voice-trainer-accent)]" />
              <span className="typo-section-label text-[var(--voice-trainer-accent)]">
                {t("voice.trainerTitle")}
              </span>
            </div>
            <p className="typo-subline text-[var(--voice-trainer-muted)]">
              {t("voice.trainerHelp")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-auto pt-4">
            <Button
              type="button"
              size="sm"
              disabled
              aria-label={t("voice.trainerCta")}
              data-tip={t("settings.nav.comingSoon")}
              className="rounded-full bg-sherloq-primary text-on-accent hover:bg-sherloq-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {t("voice.trainerCta")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled
              aria-label={t("voice.trainerChatCta")}
              data-tip={t("settings.nav.comingSoon")}
              className="rounded-full bg-[var(--on-accent)] text-[var(--voice-trainer-surface)] hover:bg-[var(--on-accent)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              {t("voice.trainerChatCta")}
            </Button>
          </div>
        </section>
      </div>

      {/* Vollständigkeit — regelbasiert, sanfter Anreiz statt Pflichtfeld (wie Produkte & Preise) */}
      <SettingsCard title={t("company.completeness")} description={t("voice.completenessHelp")}>
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

      {/* Kanäle — KI-Knopf oben rechts (wie „Produkte & Preise"), füllt später alle Kanal-Felder. */}
      <SettingsCard
        title={t("voice.channelsTitle")}
        description={t("voice.channelsHelp")}
        saved={save.state}
        headerAction={
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label={t("voice.aiFillAll")}
            data-tip={t("settings.nav.comingSoon")}
            className={`${AI_PILL_PENDING} px-2.5 py-1`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("voice.aiFill")}
          </button>
        }
      >
        <div className="border-b border-[var(--border-card)] mb-5">
          <PanelTabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />
        </div>

        {activeTab === "overview" ? (
          <div className="space-y-4">
            <KnowledgeField
              canEdit={canEdit}
              label={t("voice.overview.bio.label")}
              value={textOf(voice.overview.bio)}
              placeholder={t("voice.overview.bio.ph")}
              multiline
              onSave={(v) => patchVoice("overview", "bio", v)}
            />
            <KnowledgeField
              canEdit={canEdit}
              label={t("voice.overview.style.label")}
              value={textOf(voice.overview.style)}
              placeholder={t("voice.overview.style.ph")}
              multiline
              onSave={(v) => patchVoice("overview", "style", v)}
            />
            <KnowledgeField
              canEdit={canEdit}
              label={t("voice.overview.tone.label")}
              value={textOf(voice.overview.tone)}
              placeholder={t("voice.overview.tone.ph")}
              onSave={(v) => patchVoice("overview", "tone", v)}
            />
            <KnowledgeField
              canEdit={canEdit}
              label={t("voice.overview.themes.label")}
              value={textOf(voice.overview.themes)}
              placeholder={t("voice.overview.themes.ph")}
              multiline
              onSave={(v) => patchVoice("overview", "themes", v)}
            />
          </div>
        ) : (
          <ChannelFields
            channel={activeTab}
            values={voice[activeTab]}
            canEdit={canEdit}
            onSave={(field, v) => patchVoice(activeTab, field, v)}
            aiPending={aiPending}
          />
        )}
      </SettingsCard>

      {/* Was der KI-Knopf später kann — ehrlich als „Folgt" (kein toter Knopf ohne Erklärung) */}
      <p className="typo-subline text-text-muted flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        {t("voice.aiHint")}
      </p>
    </div>
  );
}

/**
 * Die Felder eines Kanals: Beispiele · Schreibstil · Aufmacher, dann „Do's & Don'ts" als ZWEI
 * benannte Teile (immer/nie) DESSELBEN Feldes `dos_donts` — kein neues DB-Feld. Der Save schickt
 * das ganze {always,never}-Objekt, damit der Server-Shallow-Merge den Nachbar-Teil nie verliert.
 */
function ChannelFields({
  channel: _channel, values, canEdit, onSave, aiPending,
}: {
  channel: VoiceChannelKey;
  values: VoiceChannel;
  canEdit: boolean;
  onSave: (field: string, v: unknown) => void;
  aiPending: (label: string) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const dd = values.dos_donts ?? {};

  return (
    <div className="space-y-4">
      <KnowledgeField
        canEdit={canEdit}
        multiline
        label={t("voice.field.writingStyle.label")}
        value={textOf(values.sentence_style)}
        placeholder={t("voice.field.writingStyle.ph")}
        onSave={(v) => onSave("sentence_style", v)}
      />
      <KnowledgeField
        canEdit={canEdit}
        multiline
        label={t("voice.field.hooks.label")}
        value={textOf(values.hooks)}
        placeholder={t("voice.field.hooks.ph")}
        onSave={(v) => onSave("hooks", v)}
      />
      {/* „Das machst du immer" — Bestätigungs-Symbol (grün). */}
      <KnowledgeField
        canEdit={canEdit}
        multiline
        icon={<Check className="w-3.5 h-3.5 text-signal-success" />}
        label={t("voice.field.dosAlways.label")}
        value={textOf(dd.always)}
        placeholder={t("voice.field.dosAlways.ph")}
        onSave={(v) => onSave("dos_donts", { ...dd, always: v })}
      />
      {/* „Das machst du nie" — Warn-Symbol. Beide Teile leben im selben Feld dos_donts. */}
      <KnowledgeField
        canEdit={canEdit}
        multiline
        icon={<AlertTriangle className="w-3.5 h-3.5 text-signal-warn" />}
        label={t("voice.field.dosNever.label")}
        value={textOf(dd.never)}
        placeholder={t("voice.field.dosNever.ph")}
        onSave={(v) => onSave("dos_donts", { ...dd, never: v })}
      />
      {/* „Beispiele" bewusst GANZ UNTEN (nach „Das machst du nie") — echte Proben sind der
          natürliche Abschluss des Kanals, nicht der Einstieg. */}
      <KnowledgeField
        canEdit={canEdit}
        multiline
        label={t("voice.field.samples.label")}
        value={textOf(values.samples)}
        placeholder={t("voice.field.samples.ph")}
        onSave={(v) => onSave("samples", v)}
      />
      {/* „So klingt das" — Live-Beispiel ist ein AI-Feature → sichtbar „Folgt", kein Fake. */}
      {aiPending(t("voice.soundsLike"))}
    </div>
  );
}
