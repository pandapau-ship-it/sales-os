import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuth } from '@/hooks/useAuth';
import { getContactDetail, getTasksByContact, getContactCommunications, getActivityByContact, getNotesByContact, createTask, updateTask, completeTask, softDeleteTask, createNote, updateNote, softDeleteNote, createCommunication } from '@/lib/db';
import { contactToProfile, communicationToView, type CommunicationChannel, type CommunicationDirection } from '@/lib/hunterMappers';
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
 *   Noch Mock: AktiveSignale-Flags (8c), Subscription/Usage (8d), Details-Tab (8e), KI-Kurzakte [D5].
 */

export type FarmerTab = 'details' | 'overview' | 'activity' | 'communication' | 'tasks' | 'subscription' | 'usage' | 'notes';

export default function FarmerSidepanel({ person: personProp, onClose, onExit, variant = 'panel', initialTab = null, initialTaskId = null, initialHighlightSection = null }: { person: Lead | Customer | null; onClose: () => void; onExit?: () => void; variant?: 'panel' | 'full'; initialTab?: FarmerTab | null; initialTaskId?: string | null; initialHighlightSection?: string | null }) {
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

  // Header-Quellen aus dem Mock-Kontakt (Slice 1). Farmer = Kunde → Subscription-Status statt Stage.
  const customer = person as Customer | null;
  const subscriptionStatus = customer?.sherloqStatus ?? null;

  // MOCK (Slice 2) — echte Werte kommen mit dem Farmer-DB-Wiring. HONESTY: nur befüllte Felder rendern.
  const mockSubscription: SubscriptionData = {
    plan: customer?.subscriptionPlan,
    status: subscriptionStatus ?? undefined,
    mrr: '2.000 €', arr: '24.000 €',
    activeSince: '01.03.2026', nextPayment: '01.07.2026',
    cancellationPeriod: '3 Monate zum Laufzeitende', nrr: '112 %',
  };
  const mockUsage: UsageData = {
    lastLogin: customer?.lastLogin, lastUsage: customer?.lastLogin,
    profilesAdded: customer?.profilesAdded != null ? { value: customer.profilesAdded.toLocaleString('de-DE'), trend: '+12%' } : undefined,
    messages: { value: '1.240', trend: '+8%' },
    enrichments: { used: 8500, limit: 10000 },
    onboarding: 'Abgeschlossen',
  };

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

  // Mock-Telefon NUR noch für den Details-Tab (8e). KontaktZeile nutzt echte profile.phones (8a).
  const mockPhones = [{ id: 'fp-1', type: 'Geschäftlich', number: '+49 89 1234 5678', favorite: true }];
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
          {/* Farmer-Signale [D33] (Slice 2, Mock): Churn Risk · Upsell · Kunde wird kalt.
              Echte Score-/Signal-Logik kommt mit dem DB-Wiring; CTAs → Action-Panel [D34]. */}
          <AktiveSignale
            churnRisk
            upsell
            goingCold
            cancelled
            onChurn={() => setActionSignal({
              kind: 'churn_risk', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
              churnScore: 78, lastLoginDays: 21, usageDropPct: 40,
            })}
            onUpsell={() => setActionSignal({
              kind: 'upsell_potential', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
              seatUtilizationPct: 92, featureUsageUp: true, nps: 9,
            })}
            onCold={() => setActionSignal({
              kind: 'going_cold', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, lastContactDays: 18,
            })}
            onCancelled={() => setActionSignal({
              kind: 'cancelled', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, cancelledDate: '31.07.2026', cancelReason: 'Budget gestrichen',
            })}
          />
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
          <SubscriptionBox variant="compact" data={mockSubscription} onShowAll={() => setActiveTab('subscription')} />
          <UsageBox variant="compact" data={mockUsage} onShowAll={() => setActiveTab('usage')} />
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
          <SubscriptionBox data={mockSubscription} flashId="subscription" flash={flashSection === 'subscription'} />
          {/* Vollansicht hat keinen eigenen Usage-Tab → Usage hier im Subscription-Tab mit anzeigen. */}
          {variant === 'full' && <UsageBox variant="full" data={mockUsage} />}
        </div>
      )}
      {activeTab === 'usage' && <div className="animate-fade-in"><UsageBox variant="full" data={mockUsage} /></div>}

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

  // Details-Tab (nur Vollansicht) — ausschließlich Library-Komponenten (DetailSection · DetailField ·
  // DetailPhoneList · NotizenListe), kein eigenes Feld-Markup. 1:1 wie Hunter, Mock readonly.
  const dn = person ? person.person.name.split(' ') : [];
  const detailFirst = dn[0] ?? '';
  const detailLast = dn.slice(1).join(' ');
  const detailEmail = person?.contactEmail || `${detailFirst.toLowerCase()}@${(person?.person.company ?? 'firma').toLowerCase().replace(/[^a-z]+/g, '')}.com`;
  const detailLinkedin = person ? `in/${person.person.name.toLowerCase().replace(/[^a-z]+/g, '-')}` : '';
  const detailWeb = `${(person?.person.company ?? 'example').toLowerCase().replace(/[^a-z]+/g, '')}.com`;
  const subLabel = subscriptionStatus === 'ACTIVE' ? 'Aktiv' : subscriptionStatus === 'CANCELLED' ? 'Gekündigt' : subscriptionStatus === 'TRIAL' ? 'Trial' : subscriptionStatus === 'TRIAL_EXPIRED' ? 'Trial abgelaufen' : '—';
  const detailsContent = person && (
    <div className="space-y-5 animate-fade-in">
      <DetailSection title="Person" icon={User} variant="page">
        <DetailField label="Anrede" value="Herr" readonly />
        <DetailField label="Sprache" value="Deutsch" readonly />
        <DetailField label="Vorname" value={detailFirst} readonly />
        <DetailField label="Nachname" value={detailLast} readonly />
        <DetailField label="Jobtitel" value={person.person.jobTitle} readonly />
        <DetailField label="Seniority" value="Director" readonly />
        <DetailField label="Abteilung" value="Customer Success" readonly />
        <DetailField label="Standort / Stadt" value="München" readonly />
        <DetailField label="Land" value="Deutschland" readonly />
        <DetailField label="Twitter / X" value={`@${detailFirst.toLowerCase()}`} readonly />

        {/* Kontaktdaten — in dezenter grauer Sub-Kachel (1:1 Hunter-Muster) */}
        <div className="sm:col-span-2 bg-app-bg rounded-[10px] p-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailField label="E-Mail" type="email" copyable value={detailEmail} onCopy={() => showToast('Kopiert ✓')} readonly />
            <DetailField label="LinkedIn" copyable value={detailLinkedin} href={`https://www.linkedin.com/${detailLinkedin}`} onCopy={() => showToast('Kopiert ✓')} readonly />
            <DetailField label="Webadresse" copyable value={detailWeb} href={`https://${detailWeb}`} onCopy={() => showToast('Kopiert ✓')} readonly />
          </div>
          <div className="mt-5">
            <DetailPhoneList phones={mockPhones} types={['Mobil', 'Geschäftlich', 'Privat', 'Weitere']} readonly onCopy={() => showToast('Kopiert ✓')} />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Firma" icon={Building2} variant="page">
        <DetailField label="Firma" value={person.person.company} readonly />
        <DetailField label="Branche" value="SaaS" readonly />
        <DetailField label="Unternehmensgröße" value="51–200" readonly />
        <DetailField label="Domain" copyable value={detailWeb} href={`https://${detailWeb}`} onCopy={() => showToast('Kopiert ✓')} readonly />
        <DetailField label="Stadt / HQ" value="München" readonly />
        <DetailField label="Land" value="Deutschland" readonly />
      </DetailSection>

      {/* Farmer-spezifisch: Subscription-Status statt Lead Status */}
      <DetailSection title="Klassifizierung" icon={Tag} variant="page">
        <DetailField label="Subscription-Status" value={subLabel} readonly />
        <DetailField label="ICP Score" value={person.icpScore != null ? String(person.icpScore) : ''} readonly />
        <DetailField label="Owner" value="Oliver Prossi" readonly />
        <DetailField label="Tags" value="Bestandskunde · Growth" readonly />
      </DetailSection>

      <NotizenListe
        onToast={showToast}
        noteRows={[]}
        onCreate={() => showToast('Notiz gespeichert ✓')}
        onUpdate={() => showToast('Notiz gespeichert ✓')}
        onDelete={() => showToast('Notiz gelöscht')}
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
        <FarmerSidepanel person={display} onClose={() => setShowVollansicht(false)} onExit={onClose} variant="full" />
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
