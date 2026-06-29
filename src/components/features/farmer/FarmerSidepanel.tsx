import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuth } from '@/hooks/useAuth';
import { getContactDetail, getTasksByContact, getContactCommunications, getActivityByContact, getNotesByContact, getSettings, createTask, updateTask, completeTask, softDeleteTask, createNote, updateNote, softDeleteNote, createCommunication, updateContact, updateCompany, createContactPhone, updateContactPhone, setContactPhonePrimary, deleteContactPhone } from '@/lib/db';
import { contactToProfile, communicationToView, calculateFarmerPriority, type CommunicationChannel, type CommunicationDirection } from '@/lib/hunterMappers';
import { isValidEmail, normalizeUrl, isValidUrl } from '@/lib/validation';
import { ANREDE_OPTS, SENIORITY_OPTS, SPRACHE_OPTS, LAND_OPTS, BRANCHE_OPTS, GROESSE_OPTS, PHONE_TYPES, DETAIL_MAP, seedContactDetails, type ContactDetailsState } from '@/lib/contactDetailFields';
import KommunikationLogModal from '../hunter/KommunikationLogModal';
import {
  X, Check, ArrowUpRight, ArrowLeft, Tag, User, Building2,
  LayoutDashboard, Activity, MessageSquare, CheckSquare, CreditCard, BarChart3, FileText,
  Mail,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Avatar from '@/components/shared/Avatar';
import { useDeeplinkHighlight } from '@/hooks/useDeeplinkHighlight';
import {
  AktiveSignale, AktivitaetsVerlauf, DetailField, DetailPhoneList, DetailSection, FarmerActionDrawer,
  HeatBadge, KiKurzaktePlaceholder, KommunikationKompakt, KommunikationVerlauf, KontaktZeile, NotizenListe, OffeneTasks,
  PanelSkeleton, PanelTabs, SubscriptionBadge, SubscriptionBox, TasksListe, UsageBox,
} from '@/components';
import type { SubscriptionData, UsageData, FarmerActionData } from '@/components';
import type { Lead, Customer } from '@/types';

/**
 * FarmerSidepanel — Info-Panel für Bestandskunden (Farmer, `contact_status='kunde'`), [D33].
 * Schlanke Farmer-Hülle, die die HunterSidepanel-Struktur 1:1 übernimmt (Header/Tabs/Footer +
 * Full-Bleed-Invariante aus `ui/sheet.tsx`), aber Farmer-Inhalte zeigt. Bewusst eine EIGENE
 * Komponente (kein `mode`-Flag am HunterSidepanel) — sie komponiert dieselben prop-driven
 * panel-blocks. Ersetzt langfristig den Alt-`CustomerDrawer` (font-mono, kein typo-Kanon).
 *
 * SLICE 1: Hülle + wiederverwendbare Tabs (Aktivität/Kommunikation/Tasks/Notizen 1:1; Übersicht
 * mit AktiveSignale/OffeneTasks/KommunikationKompakt).
 * SLICE 2: Subscription-/Usage-Tab, Usage-Schnellhinweis, echte Farmer-Signal-Logik (Churn/Upsell/
 * Wird kalt). Verdrahtung (CustomerDrawer → FarmerSidepanel) = späterer Slice.
 * SLICE 8a: KontaktZeile/Header echt via contactToProfile(getContactDetail).
 * SLICE 8b: Tabs Tasks/Kommunikation/Aktivität/Notizen echt via *ByContact-Queries; Übersicht-
 *   Kompakt (OffeneTasks/KommunikationKompakt) teilt sich die Query mit dem jeweiligen Tab.
 * SLICE 8c: AktiveSignale echt — Flags aus customer-Scores/-Status, Schwellen aus settings.thresholds;
 *   Positiv-Zustand statt Fake-Karten.
 * SLICE 8d: Subscription-Tab echt — Plan/Status/MRR/ARR/Aktiv-seit aus companies-Embed (Single Source);
 *   NRR/Nächste-Zahlung/Kündigungsfrist = „Folgt" (kein DB-Feld).
 * SLICE 8e: Details-Tab echt + editierbar — Person/Firma aus getContactDetail, Schreiben via updateContact/
 *   updateCompany (saveDetail/saveContactField), Telefon via DetailPhoneList (contact_phones). KontaktZeile-
 *   Stift = Deep-Link in Details-Tab (onEditField + autoEdit). Owner/Tags/Usage „Folgt"; KI [D5].
 */

export type FarmerTab = 'details' | 'overview' | 'activity' | 'communication' | 'tasks' | 'subscription' | 'usage' | 'notes';

export default function FarmerSidepanel({ person: personProp, onClose, onExit, variant = 'panel', initialTab = null, initialTaskId = null, initialHighlightSection = null, initialFocusField = null }: { person: Lead | Customer | null; onClose: () => void; onExit?: () => void; variant?: 'panel' | 'full'; initialTab?: FarmerTab | null; initialTaskId?: string | null; initialHighlightSection?: string | null; initialFocusField?: string | null }) {
  const [activeTab, setActiveTab] = useState<FarmerTab>(variant === 'full' ? 'details' : (initialTab ?? 'overview'));
  // Sektions-Deeplink: ein Tab-Block (KI-Kurzakte/Subscription/Kommunikation) leuchtet kurz auf
  // (gleiches Muster wie TasksListe-Row, zentral via useDeeplinkHighlight + .deeplink-flash).
  const flashSection = useDeeplinkHighlight(initialHighlightSection);
  const [actionSignal, setActionSignal] = useState<FarmerActionData | null>(null); // [D34] Farmer Action Panel
  const [showVollansicht, setShowVollansicht] = useState(false); // [D47] Vollansicht (variant='full')
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 1800); };

  // Open-State von der Prop; Inhalt aus gehaltener Kopie, damit das Panel während der
  // Ausfahr-Animation (person→null) nicht leer wird (gleiches Muster wie HunterSidepanel/CustomerDrawer).
  const [display, setDisplay] = useState<Lead | Customer | null>(personProp);
  useEffect(() => {
    if (personProp) { setDisplay(personProp); setActiveTab(variant === 'full' ? 'details' : (initialTab ?? 'overview')); }
  }, [personProp, initialTab, variant]);
  const isOpen = personProp !== null;
  const person = display;

  // 8a: KontaktZeile/Header aus dem ECHTEN Kontakt — contactId = person.id (1:1 Hunter-Muster).
  // Single Source: contactToProfile(getContactDetail). placeholderData → weicher Übergang.
  const { organizationId } = useCurrentOrg();
  const contactId: string | null = person?.id ?? null;
  const contactQuery = useQuery({
    queryKey: ['contactDetail', organizationId, contactId],
    queryFn: () => getContactDetail(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const contactRow = contactQuery.data ?? null;
  const profile = contactToProfile(contactRow);
  const contactLoading = !!contactId && contactQuery.isLoading && !contactRow;

  // 8b: Tab-Daten aus den echten *ByContact-Queries (1:1 Hunter-Muster).
  // KONSISTENZ: Übersicht-Kompakt (OffeneTasks/KommunikationKompakt) nutzt DIESELBE Query
  // wie der jeweilige Tab — keine zweite Quelle.
  const tasksQuery = useQuery({
    queryKey: ['tasksByContact', organizationId, contactId],
    queryFn: () => getTasksByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const commsQuery = useQuery({
    queryKey: ['contactCommunications', organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const activityQuery = useQuery({
    queryKey: ['activityByContact', organizationId, contactId],
    queryFn: () => getActivityByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const notesQuery = useQuery({
    queryKey: ['notesByContact', organizationId, contactId],
    queryFn: () => getNotesByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const commsView = (commsQuery.data ?? []).map(communicationToView);

  // 8b-write: ALLE Schreib-Aktionen echt (Einheitsgebot — 1:1 HunterSidepanel-Mutationsmuster).
  // useQueryClient + useMutation + invalidate + Toast on success. Kein lokaler State, kein Schein-Toast.
  const queryClient = useQueryClient();
  const { user } = useAuth(); // [D21]: created_by/assigned_to der Writes = eingeloggter User (Fallback NULL)
  const [logOpen, setLogOpen] = useState(false);             // „Kontakt protokollieren"-Modal
  const [tasksAutoEditId, setTasksAutoEditId] = useState<string | null>(null); // Footer/Übersicht „+ Task" → Formular auf
  const [notesAutoCompose, setNotesAutoCompose] = useState(false);             // Footer „Notiz" → Composer auf

  // Echte Deals des Kontakts als Auswahl im „Neue Task"-Formular (Deal optional) — 1:1 Hunter.
  const dealOptions = ((contactRow?.deals as Record<string, any>[] | undefined) ?? [])
    .filter((d) => d?.id && d?.name)
    .map((d) => ({ value: d.id as string, label: d.name as string }));
  const CH_TO_DB: Record<string, string> = { mail: 'email', linkedin: 'linkedin', phone: 'phone', calendar: 'calendar', other: 'other' };

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasksByContact', organizationId, contactId] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups-Tab mitziehen
    queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
  };
  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notesByContact', organizationId, contactId] });
  const invalidateComms = () => {
    queryClient.invalidateQueries({ queryKey: ['contactCommunications', organizationId, contactId] }); // Farmer-Key (8b)
    queryClient.invalidateQueries({ queryKey: ['contactDetail', organizationId, contactId] }); // last_contacted_at via Trigger
  };

  type TaskFormVals = { title: string; description: string; channel: string; priority: string; dueDate: string; dueTime: string; deal: string };
  const taskValsToDb = (v: TaskFormVals) => ({
    title: v.title,
    description: v.description || undefined,
    channel: CH_TO_DB[v.channel] ?? 'other',                 // mail→email
    dueAt: new Date(`${v.dueDate}T${v.dueTime || '09:00'}:00`).toISOString(),
    priority: v.priority,
    dealId: v.deal && v.deal !== 'none' ? v.deal : undefined,
  });
  const createTaskMutation = useMutation({
    mutationFn: (v: TaskFormVals) => createTask({ organizationId, contactId: contactId as string, source: 'manual', assignedTo: user?.id ?? undefined, ...taskValsToDb(v) }),
    onSuccess: () => { invalidateTasks(); showToast('Task angelegt ✓'); },
    onError: (e) => showToast(`Anlegen fehlgeschlagen: ${(e as Error).message}`),
  });
  const updateTaskMutation = useMutation({
    mutationFn: (p: { taskId: string; v: TaskFormVals }) => updateTask(p.taskId, organizationId, taskValsToDb(p.v)),
    onSuccess: () => { invalidateTasks(); showToast('Task gespeichert ✓'); },
    onError: (e) => showToast(`Speichern fehlgeschlagen: ${(e as Error).message}`),
  });
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => completeTask(taskId, organizationId),
    onSuccess: () => { invalidateTasks(); showToast('Task erledigt ✓'); },
    onError: (e) => showToast(`Abhaken fehlgeschlagen: ${(e as Error).message}`),
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => softDeleteTask(taskId, organizationId),
    onSuccess: () => { invalidateTasks(); showToast('Aufgabe gelöscht ✓'); },
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`),
  });
  const createNoteMutation = useMutation({
    mutationFn: (body: string) => createNote(organizationId, contactId as string, body, user?.id ?? undefined),
    onSuccess: () => { invalidateNotes(); showToast('Notiz angelegt ✓'); },
    onError: (e) => showToast(`Notiz fehlgeschlagen: ${(e as Error).message}`),
  });
  const updateNoteMutation = useMutation({
    mutationFn: (v: { id: string; body: string }) => updateNote(v.id, organizationId, v.body),
    onSuccess: () => { invalidateNotes(); showToast('Notiz aktualisiert ✓'); },
    onError: (e) => showToast(`Aktualisieren fehlgeschlagen: ${(e as Error).message}`),
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => softDeleteNote(noteId, organizationId),
    onSuccess: () => { invalidateNotes(); showToast('Notiz gelöscht ✓'); },
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`),
  });
  const createCommMutation = useMutation({
    mutationFn: (v: { channel: CommunicationChannel; direction: CommunicationDirection; occurredAt: string; note: string }) =>
      createCommunication(organizationId, contactId as string, v, user?.id ?? undefined),
    onSuccess: () => { setLogOpen(false); invalidateComms(); showToast('Kontakt protokolliert ✓'); },
    onError: (e) => showToast(`Protokollieren fehlgeschlagen: ${(e as Error).message}`),
  });

  // 8e: Details-Tab editierbar — Person/Firma/Telefon echt + schreibend (1:1 Hunter, Single Source).
  const companyId = (contactRow as { company_id?: string } | null)?.company_id ?? null;
  const [focusField, setFocusField] = useState<string | null>(initialFocusField); // Deep-Link Panel-Stift → Vollansicht (autoEdit)
  const [details, setDetails] = useState<ContactDetailsState>(() => seedContactDetails(null));
  const [editContact, setEditContact] = useState({ email: '', linkedin: '', web: '' });
  useEffect(() => {
    if (!contactRow) return;
    setDetails(seedContactDetails(contactRow as Record<string, any>));
    setEditContact({ email: profile.email ?? '', linkedin: profile.linkedinUrl ?? '', web: profile.website ?? '' });
  }, [contactRow]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidateContact = () => queryClient.invalidateQueries({ queryKey: ['contactDetail', organizationId, contactId] });
  const updateContactMutation = useMutation({
    mutationFn: (fields: Record<string, unknown>) => updateContact(contactId as string, organizationId, fields),
    onSuccess: () => { invalidateContact(); showToast('Gespeichert ✓'); },
    onError: (e) => showToast(`Fehler beim Speichern: ${(e as Error).message}`),
  });
  const updateCompanyMutation = useMutation({
    mutationFn: (fields: Record<string, unknown>) => updateCompany(companyId as string, organizationId, fields),
    onSuccess: () => { invalidateContact(); showToast('Gespeichert ✓'); },
    onError: (e) => showToast(`Fehler beim Speichern: ${(e as Error).message}`),
  });
  // Details-Feld speichern: optimistisch + Persist auf die gemappte Spalte (NULL bei leer). 1:1 Hunter.
  const saveDetail = (key: string, value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    const target = DETAIL_MAP[key];
    if (!target) return;
    const v = value.trim();
    const payload = { [target.col]: v === '' ? null : v };
    if (target.table === 'contact') updateContactMutation.mutate(payload);
    else if (companyId) updateCompanyMutation.mutate(payload);
    else showToast('Keine Firma verknüpft');
  };
  const saveContactField = (field: 'email' | 'linkedin' | 'web', value: string) => {
    const v = value.trim();
    if (field === 'email') {
      if (v !== '' && !isValidEmail(v)) { showToast('Ungültige E-Mail'); return; }
      setEditContact((c) => ({ ...c, email: v }));
      updateContactMutation.mutate({ email: v === '' ? null : v });
    } else if (field === 'linkedin') {
      setEditContact((c) => ({ ...c, linkedin: v }));
      updateContactMutation.mutate({ linkedin_url: v === '' ? null : v });
    } else { // web → company.website
      const url = v === '' ? '' : normalizeUrl(v);
      if (url !== '' && !isValidUrl(url)) { showToast('Ungültige URL'); return; }
      setEditContact((c) => ({ ...c, web: url }));
      if (companyId) updateCompanyMutation.mutate({ website: url === '' ? null : url });
      else showToast('Keine Firma verknüpft');
    }
  };
  // Telefon (contact_phones) — schreibend, invalidiert den contactDetail-Query (profile.phones).
  const invalidatePhones = () => queryClient.invalidateQueries({ queryKey: ['contactDetail', organizationId, contactId] });
  const setPhonePrimaryMutation = useMutation({
    mutationFn: (phoneId: string) => setContactPhonePrimary(organizationId, contactId as string, phoneId),
    onSuccess: () => { invalidatePhones(); showToast('Favorit-Nummer gesetzt ✓'); },
    onError: () => showToast('Favorit konnte nicht gesetzt werden'),
  });
  const updatePhoneMutation = useMutation({
    mutationFn: (p: { phoneId: string; number?: string; label?: string }) => updateContactPhone(organizationId, p.phoneId, { number: p.number, label: p.label }),
    onSuccess: () => { invalidatePhones(); showToast('Nummer gespeichert ✓'); },
    onError: () => showToast('Nummer konnte nicht gespeichert werden'),
  });
  const createPhoneMutation = useMutation({
    mutationFn: (p: { number: string; label?: string; isPrimary?: boolean }) => createContactPhone(organizationId, contactId as string, p),
    onSuccess: () => { invalidatePhones(); showToast('Nummer hinzugefügt ✓'); },
    onError: () => showToast('Nummer konnte nicht hinzugefügt werden'),
  });
  const deletePhoneMutation = useMutation({
    mutationFn: (phoneId: string) => deleteContactPhone(organizationId, phoneId),
    onSuccess: () => { invalidatePhones(); showToast('Nummer entfernt'); },
    onError: () => showToast('Nummer konnte nicht entfernt werden'),
  });

  // Header-Quellen aus dem Mock-Kontakt (Slice 1). Farmer = Kunde → Subscription-Status statt Stage.
  const customer = person as Customer | null;
  const subscriptionStatus = customer?.sherloqStatus ?? null;

  // 8c: AktiveSignale echt — Schwellen aus settings.thresholds (Single Source, identisch zu den
  // Score-Tabs/ReferenceScreens); Score-/Status-Werte kommen vom customer-Objekt (kein neuer Query).
  const settingsQuery = useQuery({
    queryKey: ['settings', organizationId],
    queryFn: () => getSettings(organizationId),
    enabled: !!organizationId && isOpen,
    placeholderData: keepPreviousData,
  });
  const farmerThresholds = settingsQuery.data?.thresholds as Record<string, unknown> | undefined;
  const churnThreshold = (farmerThresholds?.churn_risk_threshold as number | undefined) ?? 61;
  const upsellThreshold = (farmerThresholds?.upsell_threshold as number | undefined) ?? 70;
  // Signal-Resolver = Single Source (calculateFarmerPriority, hunterMappers) — identisch zur Kachel-Ebene.
  // Schwellen aus settings durchgereicht. NULL-Score → inaktiv. displaySignals = nach Churn-Vorrang
  // gefiltert (Retention vor Expansion: Upsell unterdrückt bei aktivem Churn/Gekündigt).
  const farmerPriority = customer
    ? calculateFarmerPriority(customer, { churn_threshold: churnThreshold, upsell_threshold: upsellThreshold })
    : null;
  const displaySignals = farmerPriority?.displaySignals ?? [];
  const churnRiskActive = displaySignals.includes('churn_risk');
  const upsellActive = displaySignals.includes('upsell');
  const goingColdActive = displaySignals.includes('going_cold');
  const cancelledActive = displaySignals.includes('cancelled');
  const anyFarmerSignal = churnRiskActive || upsellActive || goingColdActive || cancelledActive;

  // 8d: Subscription-Tab echt — Plan/Status/MRR/ARR/Aktiv-seit aus dem Firmen-Embed des contactQuery
  // (getContactDetail → company, Single Source; kein Doppel-Fetch). HONESTY: fehlende Werte → Feld
  // ausgeblendet, nie Mock. NRR/Nächste Zahlung/Kündigungsfrist haben KEIN DB-Feld → „Folgt" (Billing/
  // Stripe folgt). Usage-Tab bleibt komplett „Folgt" [D49] — hier NICHT angefasst.
  const companyRow = (contactRow?.company ?? null) as Record<string, any> | null;
  const fmtEuroCents = (cents: unknown) =>
    typeof cents === 'number' ? (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : undefined;
  const fmtDate = (iso: unknown) =>
    typeof iso === 'string' && iso ? new Date(iso).toLocaleDateString('de-DE') : undefined;
  const subscriptionData: SubscriptionData = {
    plan: (companyRow?.subscription_plan as string | null) ?? undefined,
    status: subscriptionStatus ?? undefined,        // = Header-Badge (Single Source customer.sherloqStatus)
    mrr: fmtEuroCents(companyRow?.mrr_monthly),      // companies.mrr_monthly (Cent) → €
    arr: fmtEuroCents(companyRow?.arr_yearly),       // companies.arr_yearly (Cent) → €
    activeSince: fmtDate(companyRow?.subscription_since),
    nextPayment: 'Folgt',                            // kein DB-Feld → Honesty
    cancellationPeriod: 'Folgt',                     // kein DB-Feld → Honesty
    nrr: 'Folgt',                                    // kein DB-Feld → [D49]/Billing
  };
  // Usage: keine echte Produkt-Nutzungsquelle → „Folgt" [D49] (Honesty, konsistent mit dem aufgeklappten
  // Bereich). Leeres Objekt → UsageBox compact rendert null (ausgeblendet), full zeigt „Folgt". KEINE Fake-
  // Zahlen mehr (messages/enrichments/onboarding raus). lastLogin = last-CONTACTED, nicht Produkt-Login → raus.
  const usage: UsageData = {};

  const identityBlock = person && (
    <div className="flex items-center gap-4 min-w-0">
      <Avatar name={person.person.name} src={person.person.avatarUrl} size={64} className="shadow-sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">{person.person.name}</h1>
          {person.icpScore != null && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
              ICP: {person.icpScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
          {person.person.jobTitle && <span>{person.person.jobTitle}</span>}
          {person.person.jobTitle && person.person.company && <span className="text-icon-muted">•</span>}
          {person.person.company && (
            <>
              <span className="px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-on-accent text-[9px] font-bold">{person.person.company.charAt(0).toUpperCase()}</span>
              <span className="font-semibold text-text-body">{person.person.company}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Rechts auf Namens-Höhe: Vertrag (SubscriptionBadge) · Heat — analog Hunter (Status · Heat).
  const statusBadges = person && (
    <>
      {subscriptionStatus && (
        <div className="flex flex-col items-center">
          <span className="typo-section-label text-text-muted mb-2">Vertrag</span>
          <SubscriptionBadge status={subscriptionStatus} />
        </div>
      )}
      {person.heatStatus && (
        <div className="flex flex-col items-center">
          <span className="typo-section-label text-text-muted mb-2">Heat</span>
          <HeatBadge status={person.heatStatus} />
        </div>
      )}
    </>
  );

  // 8a: KontaktZeile echt — Email/LinkedIn/Web + Telefon aus contactToProfile (getContactDetail).
  // Honesty: fehlende Werte → KontaktZeile (readonly) blendet das Element aus. Laden → PanelSkeleton.
  const contactPill = person && (
    contactLoading ? (
      <PanelSkeleton rows={1} height={52} />
    ) : (
      <KontaktZeile
        readonly
        onCopied={() => showToast('Kopiert ✓')}
        contact={{ email: profile.email ?? '', linkedin: profile.linkedinUrl ?? '', web: profile.website ?? '' }}
        phones={profile.phones}
        onCopyField={() => showToast('Kopiert ✓')}
        // FIX C: KontaktZeile editierbar 1:1 wie Hunter — Telefon inline (Phone-Mutationen), Text (Email/
        // LinkedIn/Web) über den Stift → Vollansicht/Details-Tab (Deep-Link bleibt zusätzlich bestehen).
        onSaveField={(f, v) => saveContactField(f as 'email' | 'linkedin' | 'web', v)}
        onEditField={(f) => {
          const target = f === 'web' ? 'website' : f;
          if (variant === 'full') { setFocusField(target); setActiveTab('details'); }
          else { setFocusField(target); setShowVollansicht(true); }
        }}
        onSetFavorite={(id) => setPhonePrimaryMutation.mutate(id)}
        onUpdateNumber={(id, number) => updatePhoneMutation.mutate({ phoneId: id, number })}
        onUpdateLabel={(id, label) => updatePhoneMutation.mutate({ phoneId: id, label })}
        onAddPhone={() => createPhoneMutation.mutate({ number: '', label: 'Weitere', isPrimary: profile.phones.length === 0 })}
        onRemovePhone={(id) => deletePhoneMutation.mutate(id)}
        phoneTypes={PHONE_TYPES}
      />
    )
  );

  const tabNav = (
    <PanelTabs
      tabs={[
        { id: 'overview', label: 'Übersicht', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: 'activity', label: 'Aktivität', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'communication', label: 'Kommunikation', icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
        { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-3.5 h-3.5" /> },
        { id: 'usage', label: 'Usage', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notizen', icon: <FileText className="w-3.5 h-3.5" /> },
      ]}
      active={activeTab}
      onChange={(id) => setActiveTab(id as FarmerTab)}
    />
  );

  const tabContent = person && (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-7 animate-fade-in">
          {/* KI-Kurzakte — immer sichtbar (Honesty: „Folgt"-Platzhalter bis [D5]); Deeplink-Flash-Ziel. */}
          <KiKurzaktePlaceholder flashId="kiakte" flash={flashSection === 'kiakte'} />
          {/* Farmer-Signale [D33] (8c): echt — Flags aus customer-Scores/-Status, Schwellen aus settings.
              NULL-Score = inaktiv. Action-Zahlen nur echte (churnScore/icpScore); erfundene weggelassen
              (lastLogin/usageDrop/seat/nps/cancelDate folgen mit [D5]/8d). CTAs → Action-Panel [D34]. */}
          {anyFarmerSignal ? (
            <AktiveSignale
              churnRisk={churnRiskActive}
              upsell={upsellActive}
              goingCold={goingColdActive}
              cancelled={cancelledActive}
              onChurn={() => setActionSignal({
                kind: 'churn_risk', name: person.person.name, company: person.person.company,
                avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
                churnScore: customer?.churnScore,
              })}
              onUpsell={() => setActionSignal({
                kind: 'upsell_potential', name: person.person.name, company: person.person.company,
                avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
              })}
              onCold={() => setActionSignal({
                kind: 'going_cold', name: person.person.name, company: person.person.company,
                avatarUrl: person.person.avatarUrl,
              })}
              onCancelled={() => setActionSignal({
                kind: 'cancelled', name: person.person.name, company: person.person.company,
                avatarUrl: person.person.avatarUrl,
              })}
            />
          ) : (
            <div className="space-y-2">
              <span className="typo-section-label text-text-muted pl-1">Aktive Signale</span>
              <div className="p-4 bg-[var(--signal-success-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center gap-2 text-xs text-[var(--signal-success-text)] font-semibold">
                <Check className="w-4 h-4" /> Keine akuten Signale — Kunde stabil
              </div>
            </div>
          )}
          {tasksQuery.isLoading
            ? <PanelSkeleton rows={2} height={56} />
            : (
              <OffeneTasks
                taskRows={tasksQuery.data ?? []}
                onAdd={() => { setTasksAutoEditId('new'); setActiveTab('tasks'); }}
                onOpenTasks={() => setActiveTab('tasks')}
                onEditTask={(id) => { setTasksAutoEditId(id); setActiveTab('tasks'); }}
                onComplete={(id) => completeTaskMutation.mutate(id)}
                onDelete={(id) => deleteTaskMutation.mutate(id)}
              />
            )}
          {commsQuery.isLoading
            ? <PanelSkeleton rows={2} height={56} />
            : <KommunikationKompakt items={commsView} onShowAll={() => setActiveTab('communication')} />}
          {/* Kompakte Schnellhinweise: erst Subscription (Plan·Status·MRR), dann Usage. */}
          <SubscriptionBox variant="compact" data={subscriptionData} onShowAll={() => setActiveTab('subscription')} />
          <UsageBox variant="compact" data={usage} onShowAll={() => setActiveTab('usage')} />
        </div>
      )}

      {activeTab === 'activity' && (
        activityQuery.isLoading
          ? <PanelSkeleton rows={5} height={56} />
          : <AktivitaetsVerlauf rows={activityQuery.data ?? []} />
      )}

      {activeTab === 'communication' && (
        commsQuery.isLoading
          ? <PanelSkeleton rows={4} height={64} />
          : <KommunikationVerlauf items={commsView} onLog={() => setLogOpen(true)} flashId="communication" flash={flashSection === 'communication'} />
      )}

      {activeTab === 'tasks' && (
        tasksQuery.isLoading
          ? <PanelSkeleton rows={3} height={72} />
          : (
            <TasksListe
              onToast={showToast}
              autoEditId={tasksAutoEditId}
              onAutoEditConsumed={() => setTasksAutoEditId(null)}
              highlightId={initialTaskId}
              taskRows={tasksQuery.data ?? []}
              contactName={person.person.name}
              dealOptions={dealOptions}
              onCreate={(v) => createTaskMutation.mutate(v)}
              onUpdate={(id, v) => updateTaskMutation.mutate({ taskId: id, v })}
              onComplete={(id) => completeTaskMutation.mutate(id)}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
            />
          )
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-7 animate-fade-in">
          <SubscriptionBox data={subscriptionData} flashId="subscription" flash={flashSection === 'subscription'} />
          {/* Vollansicht hat keinen eigenen Usage-Tab → Usage hier im Subscription-Tab mit anzeigen. */}
          {variant === 'full' && <UsageBox variant="full" data={usage} />}
        </div>
      )}
      {activeTab === 'usage' && <div className="animate-fade-in"><UsageBox variant="full" data={usage} /></div>}

      {activeTab === 'notes' && (
        notesQuery.isLoading
          ? <PanelSkeleton rows={3} height={72} />
          : (
            <NotizenListe
              onToast={showToast}
              autoCompose={notesAutoCompose}
              onAutoComposeConsumed={() => setNotesAutoCompose(false)}
              noteRows={notesQuery.data ?? []}
              onCreate={(body) => createNoteMutation.mutate(body)}
              onUpdate={(id, body) => updateNoteMutation.mutate({ id, body })}
              onDelete={(id) => deleteNoteMutation.mutate(id)}
            />
          )
      )}
    </>
  );

  // Footer-Quick-Actions: Task · Mail (disabled) · Notiz. Mail nutzt das Haus-Disabled-Muster
  // (HunterCard/LeadListRow-Mail): opacity-40 + cursor-not-allowed + data-tip „Folgt mit Nango-Anbindung".
  // Aktionen Slice 1 = Tab-Wechsel; Send-Aktionen folgen mit Action-Panels [D34] / Sending-Layer.
  const ACTIONS: { icon: typeof CheckSquare; label: string; onClick?: () => void; disabled?: boolean; tip?: string }[] = [
    { icon: CheckSquare, label: 'Task', onClick: () => { setTasksAutoEditId('new'); setActiveTab('tasks'); } },
    { icon: Mail, label: 'Mail', disabled: true, tip: 'Folgt mit Nango-Anbindung' },
    { icon: FileText, label: 'Notiz', onClick: () => { setNotesAutoCompose(true); setActiveTab('notes'); } },
  ];
  const btn = "px-3.5 py-2 border border-border text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm flex items-center justify-center gap-1.5";
  const btnFull = "px-4 py-2 border border-border text-text-body rounded-full text-[12px] font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5";
  const btnActive = "hover:bg-app-bg cursor-pointer hover:-translate-y-0.5";
  const btnDisabled = "opacity-40 cursor-not-allowed";
  const renderActions = (btnBase: string) =>
    ACTIONS.map((a) => {
      const Icon = a.icon;
      return (
        <button key={a.label} onClick={a.onClick} disabled={a.disabled} data-tip={a.tip} className={cn(btnBase, a.disabled ? btnDisabled : btnActive)}>
          <Icon className="w-3.5 h-3.5" /> {a.label}
        </button>
      );
    });

  // Details-Tab (nur Vollansicht) — 1:1 Hunter, aber editierbar + echt: Person/Firma aus getContactDetail,
  // Schreiben via updateContact/updateCompany (saveDetail/saveContactField), Telefon via DetailPhoneList.
  // Farmer-Spezifikum: Klassifizierung zeigt SUBSCRIPTION statt Lead Status (Invariante). Honesty: leere
  // DB-Werte → leer/ausgeblendet; Owner/Tags (kein DB-Feld) → „Folgt".
  const subLabel = subscriptionStatus === 'ACTIVE' ? 'Aktiv' : subscriptionStatus === 'CANCELLED' ? 'Gekündigt' : subscriptionStatus === 'TRIAL' ? 'Trial' : subscriptionStatus === 'TRIAL_EXPIRED' ? 'Trial abgelaufen' : '—';
  const detailsContent = person && (
    <div className="space-y-5 animate-fade-in">
      <DetailSection title="Person" icon={User} variant="page">
        <DetailField label="Anrede" value={details.anrede} options={ANREDE_OPTS} onSelect={(v) => saveDetail('anrede', v)} />
        <DetailField label="Sprache" value={details.sprache} options={SPRACHE_OPTS} onSelect={(v) => saveDetail('sprache', v)} />
        <DetailField label="Vorname" value={details.vorname} onSave={(v) => saveDetail('vorname', v)} />
        <DetailField label="Nachname" value={details.nachname} onSave={(v) => saveDetail('nachname', v)} />
        <DetailField label="Jobtitel" value={details.jobtitel} onSave={(v) => saveDetail('jobtitel', v)} />
        <DetailField label="Seniority" value={details.seniority} options={SENIORITY_OPTS} onSelect={(v) => saveDetail('seniority', v)} />
        <DetailField label="Abteilung" value={details.abteilung} onSave={(v) => saveDetail('abteilung', v)} />
        <DetailField label="Standort / Stadt" value={details.stadt} onSave={(v) => saveDetail('stadt', v)} />
        <DetailField label="Land" value={details.land} options={LAND_OPTS} onSelect={(v) => saveDetail('land', v)} />
        <DetailField label="Twitter / X" value={details.twitter} onSave={(v) => saveDetail('twitter', v)} />

        {/* Kontaktdaten — in dezenter grauer Sub-Kachel (1:1 Hunter-Muster), editierbar + echt */}
        <div className="sm:col-span-2 bg-app-bg rounded-[10px] p-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailField label="E-Mail" type="email" copyable value={editContact.email} validate={isValidEmail} autoEdit={focusField === 'email'} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('email', v)} />
            <DetailField label="LinkedIn" copyable value={editContact.linkedin} autoEdit={focusField === 'linkedin'} href={`https://www.linkedin.com/${editContact.linkedin.replace(/^\/+/, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('linkedin', v)} />
            <DetailField label="Webadresse" copyable value={editContact.web} validate={(v) => isValidUrl(normalizeUrl(v))} errorText="Bitte eine gültige Adresse eingeben (mit https://)." autoEdit={focusField === 'website'} href={`https://${editContact.web.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('web', v)} />
          </div>
          <div className="mt-5">
            <DetailPhoneList
              phones={profile.phones}
              types={PHONE_TYPES}
              onSetFavorite={(id) => setPhonePrimaryMutation.mutate(id)}
              onUpdate={(id, patch) => updatePhoneMutation.mutate({ phoneId: id, number: patch.number, label: patch.type })}
              onAdd={() => createPhoneMutation.mutate({ number: '', label: 'Weitere', isPrimary: profile.phones.length === 0 })}
              onRemove={(id) => deletePhoneMutation.mutate(id)}
              onCopy={() => showToast('Kopiert ✓')}
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Firma" icon={Building2} variant="page">
        <DetailField label="Firma" value={details.firma} onSave={(v) => saveDetail('firma', v)} />
        <DetailField label="Branche" value={details.branche} options={BRANCHE_OPTS} onSelect={(v) => saveDetail('branche', v)} />
        <DetailField label="Unternehmensgröße" value={details.groesse} options={GROESSE_OPTS} onSelect={(v) => saveDetail('groesse', v)} />
        <DetailField label="Domain" copyable value={details.domain} href={`https://${details.domain.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveDetail('domain', v)} />
        <DetailField label="Stadt / HQ" value={details.firmaStadt} onSave={(v) => saveDetail('firmaStadt', v)} />
        <DetailField label="Land" value={details.firmaLand} options={LAND_OPTS} onSelect={(v) => saveDetail('firmaLand', v)} />
      </DetailSection>

      {/* Farmer-Invariante: Subscription-Status statt Lead Status. Owner/Tags = kein DB-Feld → „Folgt" (Honesty). */}
      <DetailSection title="Klassifizierung" icon={Tag} variant="page">
        <DetailField label="Subscription-Status" value={subLabel} readonly />
        <DetailField label="ICP Score" value={person.icpScore != null ? String(person.icpScore) : ''} readonly />
        <DetailField label="Owner" value="Folgt" readonly />
        <DetailField label="Tags" value="Folgt" readonly />
      </DetailSection>

      <NotizenListe
        onToast={showToast}
        noteRows={notesQuery.data ?? []}
        onCreate={(body) => createNoteMutation.mutate(body)}
        onUpdate={(id, body) => updateNoteMutation.mutate({ id, body })}
        onDelete={(id) => deleteNoteMutation.mutate(id)}
      />
    </div>
  );

  const panelBody = person && (
    <>
      {/* Fixer weißer Panel-Kopf; grauer `main` scrollt darunter. Die EINE Trennlinie sitzt als
          `border-y` am grauen `main` (nicht an Header/Footer) — Full-Bleed-Invariante (CLAUDE.md). */}
      <header className="pt-7 px-7 bg-app-surface items-start relative z-10 shrink-0">
        <div className="flex items-start justify-between gap-6">
          {identityBlock}
          <div className="flex items-start gap-6 shrink-0">
            <div className="hidden md:flex items-start gap-7">{statusBadges}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowVollansicht(true)} aria-label="Vollansicht" data-tip="Vollansicht" className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">{contactPill}</div>
        <div className="mt-6">{tabNav}</div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-7 space-y-7 bg-app-bg border-y border-border-subtle custom-scrollbar pb-28">
        {tabContent}
      </main>

      <footer className="px-4 py-2.5 bg-app-surface shrink-0 flex items-center justify-between gap-2 relative z-10">
        {renderActions(btn)}
      </footer>
    </>
  );

  // Voll-Variante — echte Seite (analog HunterSidepanel). Ein Scroll-Container; Tabs sticky oben.
  const FULL_TABS: { id: FarmerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'overview', label: 'Übersicht', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Aktivität', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'communication', label: 'Kommunikation', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'notes', label: 'Notizen', icon: <FileText className="w-3.5 h-3.5" /> },
  ];
  const fullBody = person && (
    <div className="fixed inset-0 z-[120] bg-app-bg font-sans overflow-y-auto animate-fade-in">
      {/* Steuer-Zeile — ← zurück zum Panel, ✕ schließt ganz. */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-5 flex items-center justify-between">
        <button onClick={onClose} aria-label="Zurück" data-tip="Zurück" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <button onClick={() => (onExit ?? onClose)()} aria-label="Schließen" data-tip="Schließen" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-surface transition-colors cursor-pointer">
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Hero — randlos integriert (keine Kachel) */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-3 pb-7">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {identityBlock}
          <div className="flex items-start gap-7 shrink-0">{statusBadges}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-7">{renderActions(btnFull)}</div>
      </div>

      {/* Tabs — sticky oben, volle Breite */}
      <div className="sticky top-0 z-20 bg-app-bg border-b border-border-subtle">
        <nav className="max-w-[1100px] mx-auto px-5 sm:px-10 flex flex-nowrap gap-8 overflow-x-auto scrollbar-none">
          {FULL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-[13px] font-bold transition-colors shrink-0 inline-flex items-center gap-1.5 ${activeTab === tab.id ? 'text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-text-body'}`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute left-0 right-0 bottom-0 bg-[var(--sherloq-primary)] rounded-t-full" style={{ height: '2px' }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Inhalt — scrollt mit der Seite */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-8">
        {activeTab === 'details' ? detailsContent : tabContent}
      </div>
    </div>
  );

  return (
    <>
      {variant === 'full' ? createPortal(fullBody, document.body) : (
        <Sheet open={isOpen && !showVollansicht} onOpenChange={(open) => { if (!open && !showVollansicht) onClose(); }}>
          <SheetContent
            side="drawer"
            className="flex flex-col gap-0 h-full font-sans overflow-hidden p-0 bg-app-surface"
            style={{ width: 820, maxWidth: '95vw' }}
          >
            {panelBody}
          </SheetContent>
        </Sheet>
      )}

      {/* [D47] Vollansicht — eigene FarmerSidepanel-Instanz als Vollseiten-Overlay (analog Hunter). */}
      {variant !== 'full' && showVollansicht && (
        <FarmerSidepanel person={display} onClose={() => setShowVollansicht(false)} onExit={onClose} variant="full" initialFocusField={focusField} />
      )}

      {/* [D34] Farmer Action Panel — Churn Risk / Kunde wird kalt. Renderer = ChatActionPanel (unverändert).
          KI-Felder NULL → „Folgt"-Platzhalter; Buttons (Task/Snooze/Senden) erscheinen mit Draft ([D5]). */}
      <FarmerActionDrawer
        signal={actionSignal}
        onClose={() => setActionSignal(null)}
        onCreateTask={() => { setActionSignal(null); setTasksAutoEditId('new'); setActiveTab('tasks'); }}
        onWinbackCall={() => { setActionSignal(null); setLogOpen(true); }}
        onSnooze={() => showToast('Auf später verschoben')}
      />

      {/* „Kontakt protokollieren" — 1:1 Hunter; onSave → createCommunication (echt). */}
      <KommunikationLogModal
        open={logOpen}
        pending={createCommMutation.isPending}
        onSave={(v) => createCommMutation.mutate(v)}
        onCancel={() => setLogOpen(false)}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-[12px] shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
