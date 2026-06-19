import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEMO_ORGANIZATION_ID } from '@/lib/org';
import { getContactDetail, getPipelineSettings, getTasksByContact, createTask, completeTask, softDeleteTask, getNotesByContact, createNote, updateNote, softDeleteNote, getDealsByContact, getActivityByContact, getProducts, getOrgUsers, createDeal, updateDeal, updateDealStage, updateDealWon, updateDealLost, softDeleteDeal } from '@/lib/db';
import { contactToProfile, latestActiveDeal, dealToView, WON_STAGE_SLUG, LOST_STAGE_SLUG } from '@/lib/hunterMappers';
import DealLostModal from './DealLostModal';
import { triggerConfetti } from '@/lib/confetti';
import {
  ArrowUpRight, ArrowLeft, X, Phone, Clock, Check,
  Plus, Briefcase,
  StickyNote, User, Building2, Tag, CheckCircle2
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Avatar from '@/components/shared/Avatar';
import { AktiveSignale, AktivitaetsVerlauf, DealsListe, DetailField, DetailPhoneList, DetailSection, HeatBadge, KontaktZeile, NotizenListe, OffeneTasks, PanelTabs, StatusBadge, TasksListe } from '@/components';

/** Telefon-Eintrag (Favorit inline, Rest im Popover bei P8-Edit). */
interface Phone { id: string; type: string; number: string; favorite: boolean }

// EditableInline → panel-blocks/EditableInline (importiert). PhoneField → panel-blocks/PhoneField.

/**
 * HunterSidepanel — Info Panel (§22.1, 820px). Nutzt dieselbe Sheet-„drawer"-Shell
 * wie CustomerDrawer / die Action-Panels: schwebendes, abgerundetes Panel rechts mit
 * identischer Slide-in/-out-Animation (kein Inline-Layout, überlagert die Liste).
 * `person = null` → geschlossen; Inhalt rendert aus einer gehaltenen Kopie, damit das
 * Panel während der Ausfahr-Animation nicht leer wird.
 */
/** Dropdown-Optionen für die Detail-Felder (Vollansicht). Spiegeln die CRM-Felder
 *  aus CLAUDE.md → „KONTAKTE / COMPANIES". Später aus settings/Enums geladen. */
const ANREDE_OPTS = ['Herr', 'Frau', 'Divers'];
const SENIORITY_OPTS = ['C-Level', 'VP', 'Director', 'Manager', 'IC', 'Founder'];
const SPRACHE_OPTS = ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Andere'];
const LAND_OPTS = ['Deutschland', 'Österreich', 'Schweiz', 'Andere'];
const BRANCHE_OPTS = ['SaaS', 'Fintech', 'E-Commerce', 'Healthcare', 'Industrie', 'Andere'];
const GROESSE_OPTS = ['1–10', '11–50', '51–200', '201–500', '500+'];
const LEAD_STATUS_OPTS = ['Lead', 'Qualified Lead', 'Marketing Qualified Lead (MQL)', 'Sales Qualified Lead (SQL)', 'Customer', 'Churned'];

const DEFAULT_DETAILS = {
  anrede: 'Herr', vorname: 'Christian', nachname: 'Brand',
  jobtitel: 'VP of Sales EMEA', seniority: 'VP', abteilung: 'Sales',
  sprache: 'Deutsch', stadt: 'München', land: 'Deutschland', twitter: '',
  firma: 'LogixFlow GmbH', branche: 'SaaS', groesse: '51–200',
  domain: 'logixflow.de', firmaStadt: 'München', firmaLand: 'Deutschland',
  leadStatus: 'Sales Qualified Lead (SQL)', icp: '87',
  tags: 'Enterprise · ROI-Fokus · Outreach', owner: 'Oliver Prossi',
  notiz: 'Budget-Freeze bis Q3 — der ROI-Case ist der Hebel. Demo lief sehr positiv, Abschluss ab Q4 realistisch.',
};

// DetailField · DetailSection · StatusBadge · DetailPhoneList → ausgelagert nach
// src/components/panel-blocks/ (siehe Imports). Hier nur noch deren Komposition.

export default function HunterSidepanel({ person: personProp, onClose, onExit, variant = 'panel', initialAction = null, initialTab = null }: { person: any; onClose: () => void; onExit?: () => void; variant?: 'panel' | 'full'; initialAction?: 'mail' | 'task' | 'chat' | null; initialTab?: 'overview' | 'deals' | 'tasks' | 'activity' | 'notes' | null }) {
  const [activeTab, setActiveTab] = useState(variant === 'full' ? 'details' : 'overview');
  // Aus der Übersicht „Deal/Task bearbeiten" → Ziel-Tab öffnet die Bearbeiten-Kachel direkt.
  const [dealsAutoEditId, setDealsAutoEditId] = useState<string | null>(null); // Übersicht „Bearbeiten" → Deal-id im Deals-Tab
  const [tasksAutoEditId, setTasksAutoEditId] = useState<string | null>(null);
  // Footer-Quick-Actions: öffnen den jeweiligen Tab direkt im Anlege-/Compose-Modus.
  const [dealsAutoNew, setDealsAutoNew] = useState(false);
  const [notesAutoCompose, setNotesAutoCompose] = useState(false);
  const [showVollansicht, setShowVollansicht] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vom User editierbare Felder (kein System-Wert) — lokaler Mock-State.
  const [contact, setContact] = useState({ email: '', linkedin: '', web: '' });
  const [phones, setPhones] = useState<Phone[]>([]);
  const [details, setDetails] = useState(DEFAULT_DETAILS);
  const setDetail = (k: keyof typeof DEFAULT_DETAILS, v: string) => { setDetails((d) => ({ ...d, [k]: v })); showToast('Gespeichert'); };

  // Open-State von der Prop; Inhalt aus gehaltener Kopie (wie CustomerDrawer).
  const [display, setDisplay] = useState<any>(personProp);
  useEffect(() => {
    if (personProp) {
      setDisplay(personProp);
      // Editierbare Felder beim Öffnen zurücksetzen (Kontaktzeile wird unten aus dem Fetch geseedet).
      setDetails(DEFAULT_DETAILS);
      // Karten-Aktion: Panel direkt mit der passenden Aktion öffnen. ('mail' deferred — Kommunikation P7.)
      if (initialAction === 'task') { setTasksAutoEditId('new'); setActiveTab('tasks'); }
      else if (initialTab) { setActiveTab(initialTab); } // Deeplink z.B. Kanban-Karten-Klick → Deals-Tab
      else setActiveTab(variant === 'full' ? 'details' : 'overview');
    }
  }, [personProp, initialAction, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps
  const isOpen = personProp !== null;
  const person = display;

  // P1 — Single-Source-Kopf: person.id trägt die echte contact_id → Kontakt laden.
  // Name/Jobtitel/Firma/Initialen/ICP/Heat/Status NUR über contactToProfile; Stage über
  // contactActiveStage. KEINE hardcodierten Kopf-Literale mehr (Heat-Bug behoben).
  const contactId: string | null = person?.id ?? null;
  const contactQuery = useQuery({
    queryKey: ['contactDetail', DEMO_ORGANIZATION_ID, contactId],
    queryFn: () => getContactDetail(DEMO_ORGANIZATION_ID, contactId as string),
    enabled: !!contactId && isOpen,
  });
  const stagesQuery = useQuery({
    queryKey: ['pipelineStages', DEMO_ORGANIZATION_ID],
    queryFn: () => getPipelineSettings(DEMO_ORGANIZATION_ID),
  });
  const stageMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.name]));
  // P5c-2b: Stage→Probability (für abgeleitete Probability-Anzeige) + Stage-Liste fürs Create-Dropdown (in Pipeline-Reihenfolge).
  const stageProbMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.probability]));
  const stageOptions = [...(stagesQuery.data ?? [])].sort((a, b) => a.order - b.order).map((s) => ({ slug: s.slug, name: s.name }));
  const contactRow = contactQuery.data ?? null;
  const profile = contactToProfile(contactRow);              // zentrale Leitung
  const headLoading = !!contactId && contactQuery.isLoading && !contactRow;

  // P2 — Kontaktzeile aus dem echten Kontakt seeden (email/phone/linkedin_url + Firmen-Website).
  // Werte zentral über contactToProfile; fehlend → leer → Read-Zeile blendet das Element aus.
  useEffect(() => {
    if (!contactRow) return;
    setContact({ email: profile.email ?? '', linkedin: profile.linkedinUrl ?? '', web: profile.website ?? '' });
    setPhones(profile.phone ? [{ id: 'p1', type: 'Telefon', number: profile.phone, favorite: true }] : []);
  }, [contactRow]); // eslint-disable-line react-hooks/exhaustive-deps

  // P3 — Tasks-Tab: echte Tasks des Kontakts + Anlegen/Abhaken (erster Panel-Write).
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['tasksByContact', DEMO_ORGANIZATION_ID, contactId],
    queryFn: () => getTasksByContact(DEMO_ORGANIZATION_ID, contactId as string),
    enabled: !!contactId && isOpen,
  });
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasksByContact', DEMO_ORGANIZATION_ID, contactId] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', DEMO_ORGANIZATION_ID] }); // Follow-ups-Tab mitziehen
  };
  // Echte Deals des Kontakts als Auswahl im „Neue Task"-Formular (Deal optional).
  const dealOptions = ((contactRow?.deals as Record<string, any>[] | undefined) ?? [])
    .filter((d) => d?.id && d?.name)
    .map((d) => ({ value: d.id as string, label: d.name as string }));
  const CH_TO_DB: Record<string, string> = { mail: 'email', linkedin: 'linkedin', phone: 'phone', calendar: 'calendar', other: 'other' };
  const createTaskMutation = useMutation({
    mutationFn: (v: { title: string; description: string; channel: string; priority: string; dueDate: string; dueTime: string; deal: string }) =>
      createTask({
        organizationId: DEMO_ORGANIZATION_ID,
        contactId: contactId as string,
        dealId: v.deal && v.deal !== 'none' ? v.deal : undefined,
        title: v.title,
        description: v.description || undefined,
        channel: CH_TO_DB[v.channel] ?? 'other',         // mail→email
        dueAt: new Date(`${v.dueDate}T${v.dueTime || '09:00'}:00`).toISOString(),
        priority: v.priority,
        source: 'manual',                                  // assigned_to bleibt NULL (P3)
      }),
    onSuccess: () => { invalidateTasks(); showToast('Task angelegt ✓'); },
    onError: (e) => showToast(`Anlegen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => completeTask(taskId, DEMO_ORGANIZATION_ID),
    onSuccess: () => { invalidateTasks(); showToast('Task erledigt ✓'); },
    onError: (e) => showToast(`Abhaken fehlgeschlagen: ${(e as Error).message}`),
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => softDeleteTask(taskId, DEMO_ORGANIZATION_ID),
    onSuccess: () => { invalidateTasks(); showToast('Aufgabe gelöscht ✓'); },
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });

  // P4 — Notizen-Tab: echte Notizen des Kontakts + Anlegen.
  const notesQuery = useQuery({
    queryKey: ['notesByContact', DEMO_ORGANIZATION_ID, contactId],
    queryFn: () => getNotesByContact(DEMO_ORGANIZATION_ID, contactId as string),
    enabled: !!contactId && isOpen,
  });
  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notesByContact', DEMO_ORGANIZATION_ID, contactId] });
  const createNoteMutation = useMutation({
    mutationFn: (body: string) => createNote(DEMO_ORGANIZATION_ID, contactId as string, body),
    onSuccess: () => { invalidateNotes(); showToast('Notiz angelegt ✓'); },
    onError: (e) => showToast(`Notiz fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });
  const updateNoteMutation = useMutation({
    mutationFn: (v: { id: string; body: string }) => updateNote(v.id, DEMO_ORGANIZATION_ID, v.body),
    onSuccess: () => { invalidateNotes(); showToast('Notiz aktualisiert ✓'); },
    onError: (e) => showToast(`Aktualisieren fehlgeschlagen: ${(e as Error).message}`),
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => softDeleteNote(noteId, DEMO_ORGANIZATION_ID),
    onSuccess: () => { invalidateNotes(); showToast('Notiz gelöscht ✓'); },
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`),
  });

  // P5a — Deals-Tab: echte Deals des Kontakts (lesen). Stage-Anzeige über stageMap.
  const dealsQuery = useQuery({
    queryKey: ['dealsByContact', DEMO_ORGANIZATION_ID, contactId],
    queryFn: () => getDealsByContact(DEMO_ORGANIZATION_ID, contactId as string),
    enabled: !!contactId && isOpen,
  });
  // Aktivität-Tab: echter Feed aus audit_log (Kontakt + seine Deals/Tasks/Notes).
  const activityQuery = useQuery({
    queryKey: ['activityByContact', DEMO_ORGANIZATION_ID, contactId],
    queryFn: () => getActivityByContact(DEMO_ORGANIZATION_ID, contactId as string),
    enabled: !!contactId && isOpen && activeTab === 'activity', // erst laden, wenn der Tab offen ist
  });
  // Übersicht „Deal Setup" zeigt den primären Deal = zuletzt aktiver, sonst neuester
  // (getDealsByContact sortiert created_at desc). Werte zentral über dealToView.
  const dealRows = dealsQuery.data ?? [];
  const primaryDealRow = latestActiveDeal(dealRows) ?? dealRows[0];
  const primaryDeal = primaryDealRow ? dealToView(primaryDealRow, stageMap, stageProbMap) : undefined;
  // Übersicht-Signale aus echten Daten: offene Tasks + Stagnation des primären Deals (stagnation_days
  // wird erst von der Edge Function score_deal_health gesetzt → bis dahin 0 → kein Fake-Signal).
  const openTaskCount = (tasksQuery.data ?? []).filter((tk) => !(tk as { completed_at?: string }).completed_at).length;
  const primaryStagnationDays = (primaryDealRow as { stagnation_days?: number } | undefined)?.stagnation_days ?? 0;
  // P5b — Produkt-Katalog (Dropdown) + Deal anlegen.
  const productsQuery = useQuery({
    queryKey: ['products', DEMO_ORGANIZATION_ID],
    queryFn: () => getProducts(DEMO_ORGANIZATION_ID),
  });
  const productOptions = (productsQuery.data ?? []).map((p) => (p as { name: string }).name);
  // P5c-1 — Owner-Dropdown: User der Org (id + Name).
  const usersQuery = useQuery({
    queryKey: ['orgUsers', DEMO_ORGANIZATION_ID],
    queryFn: () => getOrgUsers(DEMO_ORGANIZATION_ID),
  });
  const ownerOptions = (usersQuery.data ?? []).map((u) => ({ id: (u as { id: string }).id, name: (u as { full_name?: string }).full_name ?? '' })).filter((o) => o.name);
  const createDealMutation = useMutation({
    mutationFn: (v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string }) =>
      createDeal(DEMO_ORGANIZATION_ID, {
        name: v.name,
        product: v.product || undefined,
        valueEur: v.value && !Number.isNaN(Number(v.value)) ? Number(v.value) : undefined, // € → Cent in createDeal
        // Optionale Felder: leer → undefined (→ null in createDeal, nie 0). Ganzzahlen.
        termMonths: v.termMonths && !Number.isNaN(Number(v.termMonths)) ? Math.trunc(Number(v.termMonths)) : undefined,
        noticePeriodDays: v.noticePeriodDays && !Number.isNaN(Number(v.noticePeriodDays)) ? Math.trunc(Number(v.noticePeriodDays)) : undefined,
        expectedCloseDate: v.expectedCloseDate || undefined, // 'YYYY-MM-DD' aus dem Datumsfeld
        ownerId: v.ownerId || undefined, // gewählter Owner (User-ID); leer → undefined → null
        stage: v.stage || undefined, // gewählte Stage (Slug); leer → undefined → Default 'backlog'
        contactId: contactId as string,
      }),
    onSuccess: () => {
      // Alle von Deals abhängigen Listen mit-invalidieren → neuer Deal sofort überall (ohne Reload):
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', DEMO_ORGANIZATION_ID, contactId] }); // Panel
      queryClient.invalidateQueries({ queryKey: ['deals', DEMO_ORGANIZATION_ID] });                     // Pipeline Liste/Kanban + Übersicht-KPIs/Funnel
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', DEMO_ORGANIZATION_ID] });              // Neu-in-Pipeline-Tab
      queryClient.invalidateQueries({ queryKey: ['dueTasks', DEMO_ORGANIZATION_ID] });                  // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', DEMO_ORGANIZATION_ID] });                   // Signals: aktive-Deal-Stage der Karte
      showToast('Deal angelegt ✓');
    },
    onError: (e) => showToast(`Anlegen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });
  // P5c-2/2b — Deal bearbeiten: editierbare Felder via updateDeal; Stage-Wechsel separat via
  // updateDealStage (setzt stage_updated_at + Stagnation-Reset). leer → null (Feld geleert).
  const updateDealMutation = useMutation({
    mutationFn: async (p: { dealId: string; v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string } }) => {
      await updateDeal(DEMO_ORGANIZATION_ID, p.dealId, {
        name: p.v.name,
        product: p.v.product || undefined,
        valueEur: p.v.value && !Number.isNaN(Number(p.v.value)) ? Number(p.v.value) : undefined,
        termMonths: p.v.termMonths && !Number.isNaN(Number(p.v.termMonths)) ? Math.trunc(Number(p.v.termMonths)) : undefined,
        noticePeriodDays: p.v.noticePeriodDays && !Number.isNaN(Number(p.v.noticePeriodDays)) ? Math.trunc(Number(p.v.noticePeriodDays)) : undefined,
        expectedCloseDate: p.v.expectedCloseDate || undefined,
        ownerId: p.v.ownerId || undefined,
      });
      // Stage nur bei echtem Wechsel schreiben (sonst würde stage_updated_at/Stagnation unnötig resetten).
      const current = (dealsQuery.data ?? []).find((d) => (d as { id: string }).id === p.dealId) as { stage?: string } | undefined;
      if (p.v.stage && p.v.stage !== current?.stage) {
        await updateDealStage(p.dealId, p.v.stage, DEMO_ORGANIZATION_ID);
      }
    },
    onSuccess: () => {
      // Gleiche Keys wie createDeal → Änderung sofort überall (Deals-Tab + Übersicht + Pipeline):
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', DEMO_ORGANIZATION_ID, contactId] });
      queryClient.invalidateQueries({ queryKey: ['deals', DEMO_ORGANIZATION_ID] });
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', DEMO_ORGANIZATION_ID] });
      queryClient.invalidateQueries({ queryKey: ['dueTasks', DEMO_ORGANIZATION_ID] }); // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', DEMO_ORGANIZATION_ID] });  // Signals: aktive-Deal-Stage der Karte
      showToast('Deal aktualisiert ✓');
    },
    onError: (e) => showToast(`Speichern fehlgeschlagen: ${(e as Error).message}`),
  });
  const [lostModal, setLostModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  // P8-2d/3 — Stage-Wechsel am Stage-Badge (Deals-/Übersicht-Tab). Drei Pfade, gleiche
  // Invalidierung: normaler Move (updateDealStage), gewonnen (updateDealWon, direkt, kein Modal),
  // verloren (DealLostModal → updateDealLost).
  const invalidateDealsScope = () => {
    queryClient.invalidateQueries({ queryKey: ['dealsByContact', DEMO_ORGANIZATION_ID, contactId] });
    queryClient.invalidateQueries({ queryKey: ['deals', DEMO_ORGANIZATION_ID] });
    queryClient.invalidateQueries({ queryKey: ['newInPipeline', DEMO_ORGANIZATION_ID] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', DEMO_ORGANIZATION_ID] }); // Follow-ups: aktive-Deal-Stage der Karte
    queryClient.invalidateQueries({ queryKey: ['signals', DEMO_ORGANIZATION_ID] });  // Signals: aktive-Deal-Stage der Karte
  };
  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, newSlug }: { dealId: string; newSlug: string }) => updateDealStage(dealId, newSlug, DEMO_ORGANIZATION_ID),
    onSuccess: () => { invalidateDealsScope(); showToast('Stage geändert ✓'); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  const wonMutation = useMutation({
    mutationFn: (dealId: string) => updateDealWon(dealId, DEMO_ORGANIZATION_ID),
    onSuccess: () => { invalidateDealsScope(); triggerConfetti(); showToast('Deal gewonnen ✓'); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  const lostMutation = useMutation({
    mutationFn: ({ dealId, lostReason, note }: { dealId: string; lostReason: string; note: string }) => updateDealLost(dealId, DEMO_ORGANIZATION_ID, lostReason, note),
    onSuccess: () => { invalidateDealsScope(); showToast('Deal als verloren markiert'); setLostModal({ open: false, dealId: null }); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  const handleStageChange = (dealId: string, newSlug: string) => {
    if (newSlug === WON_STAGE_SLUG) { wonMutation.mutate(dealId); return; }
    if (newSlug === LOST_STAGE_SLUG) { setLostModal({ open: true, dealId }); return; }
    updateStageMutation.mutate({ dealId, newSlug });
  };
  // P5c-3 — Deal soft-löschen: deleted_at = now() (Audit via Trigger). Invalidation wie create/update.
  const deleteDealMutation = useMutation({
    mutationFn: (dealId: string) => softDeleteDeal(dealId, DEMO_ORGANIZATION_ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', DEMO_ORGANIZATION_ID, contactId] });
      queryClient.invalidateQueries({ queryKey: ['deals', DEMO_ORGANIZATION_ID] });
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', DEMO_ORGANIZATION_ID] });
      queryClient.invalidateQueries({ queryKey: ['dueTasks', DEMO_ORGANIZATION_ID] }); // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', DEMO_ORGANIZATION_ID] });  // Signals: aktive-Deal-Stage der Karte
      showToast('Deal gelöscht');
    },
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`),
  });


  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Footer-Quick-Actions (Task/Mail/Deal/Notiz) — öffnen direkt das jeweilige Anlege-Panel.
  const ACTIONS = [
    { icon: Plus, label: 'Task', onClick: () => { setTasksAutoEditId('new'); setActiveTab('tasks'); } },
    { icon: Briefcase, label: 'Deal', onClick: () => { setDealsAutoNew(true); setActiveTab('deals'); } },
    { icon: StickyNote, label: 'Notiz', onClick: () => { setNotesAutoCompose(true); setActiveTab('notes'); } },
  ];
  const renderActions = (btnClass: string) =>
    ACTIONS.map((a) => {
      const Icon = a.icon;
      return (
        <button key={a.label} onClick={a.onClick} className={btnClass}>
          <Icon className="w-3.5 h-3.5" /> {a.label}
        </button>
      );
    });

  // Wiederverwendbare Inhalts-Fragmente — identisch in Panel (820px) und Vollansicht (Seite).
  const identityBlock = (
    <div className="flex items-center gap-4 min-w-0">
      <Avatar name={profile.name} src={profile.avatarUrl} size={64} className="shadow-sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">
            {headLoading ? '…' : profile.name}
          </h1>
          {profile.icpScore != null && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
              ICP: {profile.icpScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
          {profile.jobTitle && <span>{profile.jobTitle}</span>}
          {profile.jobTitle && profile.company && <span className="text-icon-muted">•</span>}
          {profile.company && (
            <>
              <span className="px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-on-accent text-[9px] font-bold">{profile.company.charAt(0).toUpperCase()}</span>
              <span className="font-semibold text-text-body">{profile.company}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const statusBadgesInner = (
    <>
      {profile.statusLabel && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Status</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-bg border border-border text-text-body text-[12px] font-extrabold leading-none">
            {profile.statusLabel}
          </span>
        </div>
      )}

      {profile.heatStatus && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Heat</span>
          <HeatBadge status={profile.heatStatus} />
        </div>
      )}
      {/* KEINE Stage im Kontakt-Header: Stage ist eine Deal-Eigenschaft, kein Kontakt-Wert.
          Stage-Wechsel läuft über die Kanban-Karte (ScreenHunting, P8-2c). */}
    </>
  );

  const FIELD_LABEL: Record<'email' | 'linkedin' | 'web', string> = { email: 'E-Mail', linkedin: 'LinkedIn', web: 'Webadresse' };
  const contactPill = (
    <KontaktZeile
      readonly
      onCopied={() => showToast('Kopiert ✓')}
      contact={contact}
      phones={phones}
      onSaveField={(f, v) => { setContact((c) => ({ ...c, [f]: v })); showToast(`${FIELD_LABEL[f]} gespeichert`); }}
      onCopyField={(f) => showToast(`${FIELD_LABEL[f]} kopiert`)}
      onSetFavorite={(id) => { setPhones((prev) => prev.map((p) => ({ ...p, favorite: p.id === id }))); showToast('Favorit-Nummer gesetzt'); }}
      onUpdateNumber={(id, number) => { setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, number } : p))); showToast('Nummer gespeichert'); }}
      onCopyPhone={() => showToast('Telefon kopiert')}
      onAddPhone={() => showToast('Weitere Nummer hinzugefügt')}
    />
  );

  const tabNav = (
    <PanelTabs
      tabs={[
        { id: 'overview', label: 'Übersicht' },
        { id: 'activity', label: 'Aktivität' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'deals', label: 'Deals' },
        { id: 'notes', label: 'Notizen' },
      ]}
      active={activeTab}
      onChange={setActiveTab}
    />
  );

  const tabContent = person && (
        <>

        {activeTab === 'overview' && (
          <div className="space-y-7 animate-fade-in">
            {/* Honesty: nur real ableitbare Signale (Stagnation > 0 · keine offene Task); sonst Sektion weg. */}
            <AktiveSignale
              stagnationDays={primaryStagnationDays}
              stageLabel={primaryDeal?.stageLabel}
              noOpenTask={!!primaryDeal && openTaskCount === 0}
              onStagnant={() => { if (primaryDeal) { setDealsAutoEditId(primaryDeal.id); } setActiveTab('deals'); }}
              onNoTask={() => { setTasksAutoEditId('new'); setActiveTab('tasks'); }}
            />

            {/* Übersicht: ALLE Deals kompakt (aktiver zuerst), ab >2 einklappbar; Edit → Deals-Tab + diesen Deal. */}
            <DealsListe
              variant="compact"
              dealRows={dealsQuery.data ?? []}
              stageNameBySlug={stageMap}
              stageProbBySlug={stageProbMap}
              stageOptions={stageOptions}
              primaryDealId={primaryDeal?.id}
              onEditDeal={(id) => { setDealsAutoEditId(id); setActiveTab('deals'); }}
              onChangeStage={(dealId, newSlug) => handleStageChange(dealId, newSlug)}
              stageChangePendingId={updateStageMutation.isPending ? (updateStageMutation.variables?.dealId ?? null) : null}
            />

            {/* Echte offene Tasks; fällige orange; keine → Sektion erscheint nicht. */}
            <OffeneTasks
              taskRows={tasksQuery.data ?? []}
              onAdd={() => { setTasksAutoEditId('new'); setActiveTab('tasks'); }}
              onOpenTasks={() => setActiveTab('tasks')}
              onEditTask={(id) => { setTasksAutoEditId(id); setActiveTab('tasks'); }}
              onComplete={(id) => completeTaskMutation.mutate(id)}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
            />

            {/* Deferred (PROGRESS): KI-Kurzakte (KI-Pipeline) · Active Sequence (contact_sequences) ·
                externe/LinkedIn-Signale (Signal-Quelle) · Kommunikations-Vorschau (P7, Quelle fehlt). */}
          </div>
        )}

        {activeTab === 'activity' && (
          <AktivitaetsVerlauf rows={activityQuery.data ?? []} />
        )}

        {activeTab === 'tasks' && (
          <TasksListe
            onToast={showToast}
            autoEditId={tasksAutoEditId}
            onAutoEditConsumed={() => setTasksAutoEditId(null)}
            taskRows={tasksQuery.data ?? []}
            contactName={profile.name}
            dealOptions={dealOptions}
            onCreate={(v) => createTaskMutation.mutate(v)}
            onComplete={(id) => completeTaskMutation.mutate(id)}
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
        )}

        {activeTab === 'deals' && (
          <DealsListe
            variant="detail"
            onToast={showToast}
            autoNew={dealsAutoNew}
            autoEditId={dealsAutoEditId ?? undefined}
            onAutoEditConsumed={() => { setDealsAutoEditId(null); setDealsAutoNew(false); }}
            dealRows={dealsQuery.data ?? []}
            stageNameBySlug={stageMap}
            stageProbBySlug={stageProbMap}
            productOptions={productOptions}
            ownerOptions={ownerOptions}
            stageOptions={stageOptions}
            onCreateDeal={(v) => createDealMutation.mutate(v)}
            onUpdateDeal={(dealId, v) => updateDealMutation.mutate({ dealId, v })}
            onDeleteDeal={(dealId) => deleteDealMutation.mutate(dealId)}
            onChangeStage={(dealId, newSlug) => handleStageChange(dealId, newSlug)}
            stageChangePendingId={updateStageMutation.isPending ? (updateStageMutation.variables?.dealId ?? null) : null}
          />
        )}

        {activeTab === 'notes' && (
          <NotizenListe
            onToast={showToast}
            autoCompose={notesAutoCompose}
            onAutoComposeConsumed={() => setNotesAutoCompose(false)}
            noteRows={notesQuery.data ?? []}
            onCreate={(body) => createNoteMutation.mutate(body)}
            onUpdate={(id, body) => updateNoteMutation.mutate({ id, body })}
            onDelete={(id) => deleteNoteMutation.mutate(id)}
          />
        )}

        </>
  );

  // Details-Tab (nur Vollansicht) — alle Kontakt-/Firmen-/CRM-Felder (CLAUDE.md → CRM FELDER),
  // editierbar (Standard) bzw. readonly (System). Bündelt was bei „+ SDR Lead" erfassbar ist.
  const PHONE_TYPES = ['Mobil', 'Geschäftlich', 'Privat', 'Weitere'];
  const addPhone = () => {
    setPhones((prev) => {
      const maxId = prev.reduce((m, p) => Math.max(m, parseInt(p.id.replace(/\D/g, '')) || 0), 0);
      return [...prev, { id: 'p' + (maxId + 1), type: 'Weitere', number: '', favorite: prev.length === 0 }];
    });
  };
  const setFavoritePhone = (id: string) => { setPhones((prev) => prev.map((p) => ({ ...p, favorite: p.id === id }))); showToast('Favorit-Nummer gesetzt'); };
  const updatePhone = (id: string, patch: Partial<Phone>) => setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePhone = (id: string) => {
    setPhones((prev) => {
      let next = prev.filter((p) => p.id !== id);
      if (next.length && !next.some((p) => p.favorite)) next = next.map((p, i) => (i === 0 ? { ...p, favorite: true } : p));
      return next;
    });
    showToast('Nummer entfernt');
  };
  const detailsContent = person && (
    <div className="space-y-5 animate-fade-in">
      <DetailSection title="Person" icon={User}>
        <DetailField label="Anrede" value={details.anrede} options={ANREDE_OPTS} onSelect={(v) => setDetail('anrede', v)} />
        <DetailField label="Sprache" value={details.sprache} options={SPRACHE_OPTS} onSelect={(v) => setDetail('sprache', v)} />
        <DetailField label="Vorname" value={details.vorname} onSave={(v) => setDetail('vorname', v)} />
        <DetailField label="Nachname" value={details.nachname} onSave={(v) => setDetail('nachname', v)} />
        <DetailField label="Jobtitel" value={details.jobtitel} onSave={(v) => setDetail('jobtitel', v)} />
        <DetailField label="Seniority" value={details.seniority} options={SENIORITY_OPTS} onSelect={(v) => setDetail('seniority', v)} />
        <DetailField label="Abteilung" value={details.abteilung} onSave={(v) => setDetail('abteilung', v)} />
        <DetailField label="Standort / Stadt" value={details.stadt} onSave={(v) => setDetail('stadt', v)} />
        <DetailField label="Land" value={details.land} options={LAND_OPTS} onSelect={(v) => setDetail('land', v)} />
        <DetailField label="Twitter / X" value={details.twitter} onSave={(v) => setDetail('twitter', v)} />

        {/* Kontaktdaten — in dezenter grauer Sub-Kachel (nur dieser Bereich grau) */}
        <div className="sm:col-span-2 bg-app-bg rounded-[10px] p-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailField label="E-Mail" type="email" copyable value={contact.email} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, email: v })); showToast('Gespeichert'); }} />
            <DetailField label="LinkedIn" copyable value={contact.linkedin} href={`https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, linkedin: v })); showToast('Gespeichert'); }} />
            <DetailField label="Webadresse" copyable value={contact.web} href={`https://${contact.web.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, web: v })); showToast('Gespeichert'); }} />
          </div>
          <div className="mt-5">
            <DetailPhoneList
              phones={phones}
              types={PHONE_TYPES}
              onSetFavorite={setFavoritePhone}
              onUpdate={updatePhone}
              onAdd={addPhone}
              onRemove={removePhone}
              onCopy={() => showToast('Kopiert ✓')}
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Firma" icon={Building2}>
        <DetailField label="Firma" value={details.firma} onSave={(v) => setDetail('firma', v)} />
        <DetailField label="Branche" value={details.branche} options={BRANCHE_OPTS} onSelect={(v) => setDetail('branche', v)} />
        <DetailField label="Unternehmensgröße" value={details.groesse} options={GROESSE_OPTS} onSelect={(v) => setDetail('groesse', v)} />
        <DetailField label="Domain" copyable value={details.domain} href={`https://${details.domain.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => setDetail('domain', v)} />
        <DetailField label="Stadt / HQ" value={details.firmaStadt} onSave={(v) => setDetail('firmaStadt', v)} />
        <DetailField label="Land" value={details.firmaLand} options={LAND_OPTS} onSelect={(v) => setDetail('firmaLand', v)} />
      </DetailSection>

      <DetailSection title="Klassifizierung" icon={Tag}>
        <DetailField label="Lead Status" value={details.leadStatus} options={LEAD_STATUS_OPTS} onSelect={(v) => setDetail('leadStatus', v)} />
        <DetailField label="ICP Score" value={details.icp} onSave={(v) => setDetail('icp', v)} />
        <DetailField label="Owner" value={details.owner} onSave={(v) => setDetail('owner', v)} />
        <DetailField label="Tags" value={details.tags} onSave={(v) => setDetail('tags', v)} />

        {/* System-gesetzte Status → read-only Badges (keine Input-Felder).
            Stage (läuft echt über primaryDeal.stageLabel im Deal-Setup) und Heat
            (über contactToProfile.heatStatus) waren hier hardcodiert → entfernt (Honesty). */}
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-1.5">E-Mail verifiziert</div>
          <StatusBadge tone="success" icon={CheckCircle2} label="Verifiziert" />
        </div>
      </DetailSection>

      <DetailSection title="Notizen" icon={StickyNote} cols={1}>
        <textarea
          value={details.notiz}
          onChange={(e) => setDetails((d) => ({ ...d, notiz: e.target.value }))}
          onBlur={() => showToast('Notiz gespeichert')}
          rows={4}
          placeholder="Kontext, nächste Schritte, Hinweise…"
          className="w-full bg-transparent border border-transparent hover:border-border focus:border-[var(--sherloq-primary)] focus:bg-app-surface rounded-[10px] p-3 text-[13px] text-text-primary leading-relaxed outline-none resize-none transition-colors placeholder-[var(--text-muted)]"
        />
      </DetailSection>

      {/* System-Felder ganz unten, zusammengeklappt by default */}
      <DetailSection title="System" icon={Clock} collapsible defaultCollapsed>
        <DetailField label="Lead-Quelle" value="Manuell" readonly />
        <DetailField label="Erstellt am" value="12. März 2026" readonly />
        <DetailField label="Letzter Kontakt" value="vor 2 Tagen · E-Mail" readonly />
        <DetailField label="Letzte Antwort" value="vor 5 Tagen" readonly />
        <DetailField label="Enrichment-Quelle" value="Surfe" readonly />
        <DetailField label="CRM ID" value="HS-48213" readonly />
      </DetailSection>
    </div>
  );

  const panelBtn = "px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 flex items-center justify-center gap-1.5";
  const fullBtn = "px-4 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 flex items-center justify-center gap-1.5";

  // Panel-Variante — 820px Sheet (Layout unverändert).
  const panelBody = person && (
    <>
      <header className="p-7 pb-0 bg-app-surface items-start relative z-10 border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between gap-6">
          {identityBlock}
          {/* Rechts auf Namens-Höhe: Status · Heat (wie in der Vollansicht), daneben Aktionen. */}
          <div className="flex items-start gap-6 shrink-0">
            <div className="hidden md:flex items-start gap-7">
              {statusBadgesInner}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowVollansicht(true)} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors">
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

      <main className="flex-1 overflow-y-auto p-7 space-y-7 bg-app-bg custom-scrollbar pb-28">
        {tabContent}
      </main>

      <footer className="p-4 border-t border-border-subtle bg-app-surface shrink-0 flex items-center justify-between gap-2 shadow-sm relative z-10">
        {renderActions(panelBtn)}
      </footer>
    </>
  );

  // Voll-Variante — echte Seite. Die gesamte Seite scrollt (ein Scroll-Container);
  // nur Topbar und Tab-Leiste bleiben per sticky oben stehen. Kein Panel-Inner-Scroll.
  const FULL_TABS = [
    { id: 'details', label: 'Details' },
    { id: 'overview', label: 'Übersicht' },
    { id: 'activity', label: 'Aktivität' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'deals', label: 'Deals' },
    { id: 'notes', label: 'Notizen' },
  ];
  const fullBody = person && (
    <div className="fixed inset-0 z-[120] bg-app-bg font-sans overflow-y-auto animate-fade-in">
      {/* Steuer-Zeile — ← zurück zum Panel, ✕ schließt ganz. Kein Balken, scrollt mit. */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-5 flex items-center justify-between">
        <button onClick={onClose} aria-label="Zurück" data-tip="Zurück" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <button onClick={() => (onExit ?? onClose)()} aria-label="Schließen" data-tip="Schließen" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-surface transition-colors cursor-pointer">
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Hero — randlos direkt in die Seite integriert (keine Kachel) */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-3 pb-7">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {identityBlock}
          <div className="flex items-start gap-7 shrink-0">
            {statusBadgesInner}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-7">
          {renderActions(fullBtn)}
        </div>
      </div>

      {/* Tabs — sticky am oberen Rand, über die volle Breite */}
      <div className="sticky top-0 z-20 bg-app-bg border-b border-border-subtle">
        <nav className="max-w-[1100px] mx-auto px-5 sm:px-10 flex flex-nowrap gap-8 overflow-x-auto scrollbar-none">
          {FULL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-[13px] font-bold transition-colors shrink-0 ${activeTab === tab.id ? 'text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-text-body'}`}
            >
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
    {variant === 'full' ? fullBody : (
      <Sheet open={isOpen && !showVollansicht} onOpenChange={(open) => { if (!open && !showVollansicht) onClose(); }}>
        <SheetContent
          side="drawer"
          className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
          style={{ width: 820, maxWidth: "95vw" }}
        >
          {panelBody}
        </SheetContent>
      </Sheet>
    )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {variant !== 'full' && showVollansicht && (
        <HunterSidepanel person={display} onClose={() => setShowVollansicht(false)} onExit={onClose} variant="full" />
      )}

      {/* P8-3: Lost-Dialog bei Wechsel in „verloren" (Stage-Badge im Deals-/Übersicht-Tab). Won = kein Modal. */}
      <DealLostModal
        open={lostModal.open}
        pending={lostMutation.isPending}
        onCancel={() => setLostModal({ open: false, dealId: null })}
        onConfirm={(lostReason, note) => { if (lostModal.dealId) lostMutation.mutate({ dealId: lostModal.dealId, lostReason, note }); }}
      />
    </>
  );
}
