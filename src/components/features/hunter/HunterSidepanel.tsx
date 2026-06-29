import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuth } from '@/hooks/useAuth';
import { getContactDetail, getPipelineSettings, getTasksByContact, createTask, updateTask, completeTask, softDeleteTask, getNotesByContact, createNote, updateNote, softDeleteNote, getDealsByContact, getActivityByContact, getContactCommunications, createCommunication, updateContact, updateCompany, getProducts, getOrgUsers, createDeal, updateDeal, updateDealStage, updateDealWon, updateDealLost, softDeleteDeal, createContactPhone, updateContactPhone, setContactPhonePrimary, deleteContactPhone } from '@/lib/db';
import { contactToProfile, latestActiveDeal, dealToView, communicationToView, CONTACT_STATUS_LABEL, CONTACT_STATUS_SELECTABLE, WON_STAGE_SLUG, LOST_STAGE_SLUG, type CommunicationChannel, type CommunicationDirection } from '@/lib/hunterMappers';
import { isValidEmail, normalizeUrl, isValidUrl } from '@/lib/validation';
import DealLostModal from './DealLostModal';
import DealWonModal from './DealWonModal';
import KommunikationLogModal from './KommunikationLogModal';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { triggerConfetti } from '@/lib/confetti';
import {
  ArrowUpRight, ArrowLeft, X, Clock, Check,
  Briefcase,
  User, Building2, Tag,
  LayoutDashboard, Activity, MessageSquare, CheckSquare, FileText
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Avatar from '@/components/shared/Avatar';
import { AktiveSignale, AktivitaetsVerlauf, DealsListe, DetailField, DetailPhoneList, DetailSection, HeatBadge, KiKurzaktePlaceholder, KommunikationKompakt, KommunikationVerlauf, KontaktZeile, NotizenListe, OffeneTasks, PanelSkeleton, PanelTabs, TasksListe } from '@/components';

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
const PHONE_TYPES = ['Mobil', 'Geschäftlich', 'Privat', 'Weitere'];
// Lead-Status-Dropdown: Slugs + Labels aus der EINEN Quelle (CONTACT_STATUS_LABEL in hunterMappers),
// identisch zum Kopf-Badge (contactToProfile.statusLabel). Schreibt auf contacts.contact_status.
const CONTACT_STATUS_OPTIONS = CONTACT_STATUS_SELECTABLE.map((slug) => ({ slug, label: CONTACT_STATUS_LABEL[slug] }));
const LEAD_STATUS_OPTS = CONTACT_STATUS_OPTIONS.map((o) => o.label);
const contactStatusLabel = (slug?: string) => (slug ? CONTACT_STATUS_LABEL[slug] ?? '' : '');
const contactStatusSlug = (label: string) => CONTACT_STATUS_OPTIONS.find((o) => o.label === label)?.slug;

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

// Details-Tab-Feld → DB-Spalte. table='contact' → contacts, 'company' → companies.
// Nur gemappte Felder werden persistiert; ungemappte (Klassifizierung) bleiben lokal.
const DETAIL_MAP: Record<string, { table: 'contact' | 'company'; col: string }> = {
  anrede: { table: 'contact', col: 'salutation' },
  sprache: { table: 'contact', col: 'language' },
  vorname: { table: 'contact', col: 'first_name' },
  nachname: { table: 'contact', col: 'last_name' },
  jobtitel: { table: 'contact', col: 'job_title' },
  seniority: { table: 'contact', col: 'seniority' },
  abteilung: { table: 'contact', col: 'department' },
  stadt: { table: 'contact', col: 'city' },
  land: { table: 'contact', col: 'country' },
  twitter: { table: 'contact', col: 'twitter_handle' },
  firma: { table: 'company', col: 'name' },
  branche: { table: 'company', col: 'industry' },
  groesse: { table: 'company', col: 'size_range' },
  domain: { table: 'company', col: 'domain' },
  firmaStadt: { table: 'company', col: 'city' },
  firmaLand: { table: 'company', col: 'country' },
};

// DetailField · DetailSection · StatusBadge · DetailPhoneList → ausgelagert nach
// src/components/panel-blocks/ (siehe Imports). Hier nur noch deren Komposition.

export default function HunterSidepanel({ person: personProp, onClose, onExit, variant = 'panel', initialAction = null, initialTab = null, initialDealId = null, initialDealEditId = null, initialFocusField = null, initialTaskId = null }: { person: any; onClose: () => void; onExit?: () => void; variant?: 'panel' | 'full'; initialAction?: 'mail' | 'task' | 'chat' | null; initialTab?: 'overview' | 'deals' | 'tasks' | 'activity' | 'notes' | null; initialDealId?: string | null; initialDealEditId?: string | null; initialFocusField?: string | null; initialTaskId?: string | null }) {
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth(); // [D21]: created_by/owner_id der Writes = eingeloggter User (Fallback NULL)
  const [activeTab, setActiveTab] = useState(variant === 'full' ? 'details' : 'overview');
  // Aus der Übersicht „Deal/Task bearbeiten" → Ziel-Tab öffnet die Bearbeiten-Kachel direkt.
  const [dealsAutoEditId, setDealsAutoEditId] = useState<string | null>(null); // Übersicht „Bearbeiten" → Deal-id im Deals-Tab
  const [tasksAutoEditId, setTasksAutoEditId] = useState<string | null>(null);
  // Footer-Quick-Actions: öffnen den jeweiligen Tab direkt im Anlege-/Compose-Modus.
  const [dealsAutoNew, setDealsAutoNew] = useState(false);
  const [notesAutoCompose, setNotesAutoCompose] = useState(false);
  const [showVollansicht, setShowVollansicht] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null); // Deep-Link aus dem Panel-Stift in die Vollansicht
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false); // Kommunikation-protokollieren-Modal
  const [confirmPhoneDeleteId, setConfirmPhoneDeleteId] = useState<string | null>(null); // letzte Nummer löschen → AlertDialog

  // Vom User editierbare Felder (kein System-Wert) — lokaler Mock-State.
  const [contact, setContact] = useState({ email: '', linkedin: '', web: '' });
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
      if (initialFocusField) { setActiveTab('details'); } // Deep-Link Panel-Stift → Vollansicht Details-Tab
      else if (initialDealEditId) { setDealsAutoEditId(initialDealEditId); setActiveTab('deals'); } // Karten-Bleistift → Deal im Edit-Modus
      else if (initialAction === 'task') { setTasksAutoEditId('new'); setActiveTab('tasks'); }
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
    queryKey: ['contactDetail', organizationId, contactId],
    queryFn: () => getContactDetail(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData, // vorigen Kontakt halten → weicher Übergang statt leerem Kopf
  });
  const stagesQuery = useQuery({
    queryKey: ['pipelineStages', organizationId],
    queryFn: () => getPipelineSettings(organizationId),
  });
  const stageMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.name]));
  // P5c-2b: Stage→Probability (für abgeleitete Probability-Anzeige) + Stage-Liste fürs Create-Dropdown (in Pipeline-Reihenfolge).
  const stageProbMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.probability]));
  const stagnationBySlug = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.stagnation_days]));
  const stageOptions = [...(stagesQuery.data ?? [])].sort((a, b) => a.order - b.order).map((s) => ({ slug: s.slug, name: s.name }));
  const contactRow = contactQuery.data ?? null;
  const profile = contactToProfile(contactRow);              // zentrale Leitung
  const headLoading = !!contactId && contactQuery.isLoading && !contactRow;
  const companyId = (contactRow as { company_id?: string } | null)?.company_id ?? null;

  // P2 — Kontaktzeile aus dem echten Kontakt seeden (email/linkedin_url + Firmen-Website).
  // Werte zentral über contactToProfile; fehlend → leer → Read-Zeile blendet das Element aus.
  // PH2: Telefonnummern kommen read-only direkt aus profile.phones (contact_phones) — kein lokaler State.
  useEffect(() => {
    if (!contactRow) return;
    setContact({ email: profile.email ?? '', linkedin: profile.linkedinUrl ?? '', web: profile.website ?? '' });
    // Details-Tab aus echten DB-Werten seeden (NULL → leer, kein Fake-Default). Klassifizierung
    // (Lead Status/ICP/Owner/Tags) bleibt vorerst lokal (außerhalb dieses Slices).
    const c = contactRow as Record<string, any>;
    const co = (c.company ?? {}) as Record<string, any>;
    setDetails((d) => ({
      ...d,
      anrede: c.salutation ?? '', sprache: c.language ?? '',
      vorname: c.first_name ?? '', nachname: c.last_name ?? '', // single-source-ok: Details-Tab seedet editierbare Roh-Stammdaten (contactToProfile deckt sie nicht ab)
      jobtitel: c.job_title ?? '', seniority: c.seniority ?? '', // single-source-ok: editierbares Roh-Feld für den Details-Tab
      abteilung: c.department ?? '', stadt: c.city ?? '', land: c.country ?? '',
      twitter: c.twitter_handle ?? '',
      firma: co.name ?? '', branche: co.industry ?? '', groesse: co.size_range ?? '',
      domain: co.domain ?? '', firmaStadt: co.city ?? '', firmaLand: co.country ?? '',
      leadStatus: contactStatusLabel(c.contact_status), // echtes contacts.contact_status → Label
    }));
  }, [contactRow]); // eslint-disable-line react-hooks/exhaustive-deps

  // P3 — Tasks-Tab: echte Tasks des Kontakts + Anlegen/Abhaken (erster Panel-Write).
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['tasksByContact', organizationId, contactId],
    queryFn: () => getTasksByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasksByContact', organizationId, contactId] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups-Tab mitziehen
    queryClient.invalidateQueries({ queryKey: ['deals', organizationId] }); // Pipeline-Task-Karten (Keine-Task/Stagniert) neu ableiten
  };
  // Echte Deals des Kontakts als Auswahl im „Neue Task"-Formular (Deal optional).
  const dealOptions = ((contactRow?.deals as Record<string, any>[] | undefined) ?? [])
    .filter((d) => d?.id && d?.name)
    .map((d) => ({ value: d.id as string, label: d.name as string }));
  const CH_TO_DB: Record<string, string> = { mail: 'email', linkedin: 'linkedin', phone: 'phone', calendar: 'calendar', other: 'other' };
  const createTaskMutation = useMutation({
    mutationFn: (v: { title: string; description: string; channel: string; priority: string; dueDate: string; dueTime: string; deal: string }) =>
      createTask({
        organizationId: organizationId,
        contactId: contactId as string,
        dealId: v.deal && v.deal !== 'none' ? v.deal : undefined,
        title: v.title,
        description: v.description || undefined,
        channel: CH_TO_DB[v.channel] ?? 'other',         // mail→email
        dueAt: new Date(`${v.dueDate}T${v.dueTime || '09:00'}:00`).toISOString(),
        priority: v.priority,
        source: 'manual',
        assignedTo: user?.id ?? undefined,                 // [D21]: verantwortlicher User; ohne Session → NULL
      }),
    onSuccess: () => { invalidateTasks(); showToast('Task angelegt ✓'); },
    onError: (e) => showToast(`Anlegen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });
  const updateTaskMutation = useMutation({
    mutationFn: (p: { taskId: string; v: { title: string; description: string; channel: string; priority: string; dueDate: string; dueTime: string; deal: string } }) =>
      updateTask(p.taskId, organizationId, {
        title: p.v.title,
        description: p.v.description || undefined,
        channel: CH_TO_DB[p.v.channel] ?? 'other',         // mail→email
        dueAt: new Date(`${p.v.dueDate}T${p.v.dueTime || '09:00'}:00`).toISOString(),
        priority: p.v.priority,
        dealId: p.v.deal && p.v.deal !== 'none' ? p.v.deal : undefined,
      }),
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
    onError: (e) => showToast(`Löschen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });

  // P4 — Notizen-Tab: echte Notizen des Kontakts + Anlegen.
  const notesQuery = useQuery({
    queryKey: ['notesByContact', organizationId, contactId],
    queryFn: () => getNotesByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notesByContact', organizationId, contactId] });
  const createNoteMutation = useMutation({
    mutationFn: (body: string) => createNote(organizationId, contactId as string, body, user?.id ?? undefined),
    onSuccess: () => { invalidateNotes(); showToast('Notiz angelegt ✓'); },
    onError: (e) => showToast(`Notiz fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
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

  // P5a — Deals-Tab: echte Deals des Kontakts (lesen). Stage-Anzeige über stageMap.
  const dealsQuery = useQuery({
    queryKey: ['dealsByContact', organizationId, contactId],
    queryFn: () => getDealsByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen,
    placeholderData: keepPreviousData,
  });
  // Aktivität-Tab: echter Feed aus audit_log (Kontakt + seine Deals/Tasks/Notes).
  const activityQuery = useQuery({
    queryKey: ['activityByContact', organizationId, contactId],
    queryFn: () => getActivityByContact(organizationId, contactId as string),
    enabled: !!contactId && isOpen && activeTab === 'activity', // erst laden, wenn der Tab offen ist
    placeholderData: keepPreviousData,
  });
  // Kommunikation-Tab: manuell protokollierte Touchpoints (communications, 036).
  const commsQuery = useQuery({
    queryKey: ['communications', organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId as string),
    enabled: !!contactId && isOpen && (activeTab === 'communication' || activeTab === 'overview'), // Übersicht nutzt denselben Cache
    placeholderData: keepPreviousData,
  });
  const commsView = (commsQuery.data ?? []).map(communicationToView);
  const createCommMutation = useMutation({
    mutationFn: (v: { channel: CommunicationChannel; direction: CommunicationDirection; occurredAt: string; note: string }) =>
      createCommunication(organizationId, contactId as string, v, user?.id ?? undefined),
    onSuccess: () => {
      setLogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['communications', organizationId, contactId] });
      queryClient.invalidateQueries({ queryKey: ['contactDetail', organizationId, contactId] }); // last_contacted_at via Trigger
      showToast('Kontakt protokolliert ✓');
    },
    onError: (e) => showToast(`Protokollieren fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });

  // Details-Tab / Kontakt-Inline-Edit: echte Writes auf contacts/companies. last_contacted_at-frei.
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

  // Details-Feld speichern: optimistisch lokal + Persist auf die gemappte Spalte (NULL bei leer).
  const saveDetail = (key: string, value: string) => {
    setDetails((d) => ({ ...d, [key]: value })); // optimistisch (UI bleibt responsiv)
    const target = DETAIL_MAP[key];
    if (!target) return; // ungemappt (Klassifizierung) → nur lokal, kein Persist
    const v = value.trim();
    const payload = { [target.col]: v === '' ? null : v };
    if (target.table === 'contact') updateContactMutation.mutate(payload);
    else if (companyId) updateCompanyMutation.mutate(payload);
    else showToast('Keine Firma verknüpft');
  };

  // Kontaktwege (E-Mail/LinkedIn/Web). Validierung: E-Mail → isValidEmail; Web → normalizeUrl+isValidUrl
  // (LinkedIn ist Handle/Pfad → nur trimmen). Ungültig → kein Write (DetailField zeigt den roten Rand).
  const saveContactField = (field: 'email' | 'linkedin' | 'web', value: string) => {
    const v = value.trim();
    if (field === 'email') {
      if (v !== '' && !isValidEmail(v)) { showToast('Ungültige E-Mail'); return; }
      setContact((c) => ({ ...c, email: v }));
      updateContactMutation.mutate({ email: v === '' ? null : v });
    } else if (field === 'linkedin') {
      setContact((c) => ({ ...c, linkedin: v }));
      updateContactMutation.mutate({ linkedin_url: v === '' ? null : v });
    } else { // web → company.website
      const url = v === '' ? '' : normalizeUrl(v);
      if (url !== '' && !isValidUrl(url)) { showToast('Ungültige URL'); return; }
      setContact((c) => ({ ...c, web: url }));
      if (companyId) updateCompanyMutation.mutate({ website: url === '' ? null : url });
      else showToast('Keine Firma verknüpft');
    }
  };

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
    queryKey: ['products', organizationId],
    queryFn: () => getProducts(organizationId),
  });
  const productOptions = (productsQuery.data ?? []).map((p) => (p as { name: string }).name);
  // P5c-1 — Owner-Dropdown: User der Org (id + Name).
  const usersQuery = useQuery({
    queryKey: ['orgUsers', organizationId],
    queryFn: () => getOrgUsers(organizationId),
  });
  const ownerOptions = (usersQuery.data ?? []).map((u) => ({ id: (u as { id: string }).id, name: (u as { full_name?: string }).full_name ?? '' })).filter((o) => o.name);
  const createDealMutation = useMutation({
    mutationFn: (v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string }) =>
      createDeal(organizationId, {
        name: v.name,
        product: v.product || undefined,
        valueEur: v.value && !Number.isNaN(Number(v.value)) ? Number(v.value) : undefined, // € → Cent in createDeal
        // Optionale Felder: leer → undefined (→ null in createDeal, nie 0). Ganzzahlen.
        termMonths: v.termMonths && !Number.isNaN(Number(v.termMonths)) ? Math.trunc(Number(v.termMonths)) : undefined,
        noticePeriodDays: v.noticePeriodDays && !Number.isNaN(Number(v.noticePeriodDays)) ? Math.trunc(Number(v.noticePeriodDays)) : undefined,
        expectedCloseDate: v.expectedCloseDate || undefined, // 'YYYY-MM-DD' aus dem Datumsfeld
        ownerId: v.ownerId || user?.id || undefined, // gewählter Owner; sonst anlegender User ([D21]); ohne Session → null
        stage: v.stage || undefined, // gewählte Stage (Slug); leer → undefined → Default 'backlog'
        contactId: contactId as string,
      }),
    onSuccess: () => {
      // Alle von Deals abhängigen Listen mit-invalidieren → neuer Deal sofort überall (ohne Reload):
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', organizationId, contactId] }); // Panel
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });                     // Pipeline Liste/Kanban + Übersicht-KPIs/Funnel
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', organizationId] });              // Neu-in-Pipeline-Tab
      queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] });                  // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', organizationId] });                   // Signals: aktive-Deal-Stage der Karte
      showToast('Deal angelegt ✓');
    },
    onError: (e) => showToast(`Anlegen fehlgeschlagen: ${(e as Error).message}`), // nicht still abfangen
  });
  // P5c-2/2b — Deal bearbeiten: editierbare Felder via updateDeal; Stage-Wechsel separat via
  // updateDealStage (setzt stage_updated_at + Stagnation-Reset). leer → null (Feld geleert).
  const updateDealMutation = useMutation({
    mutationFn: async (p: { dealId: string; v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string } }) => {
      await updateDeal(organizationId, p.dealId, {
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
        await updateDealStage(p.dealId, p.v.stage, organizationId);
      }
    },
    onSuccess: () => {
      // Gleiche Keys wie createDeal → Änderung sofort überall (Deals-Tab + Übersicht + Pipeline):
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', organizationId, contactId] });
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', organizationId] });  // Signals: aktive-Deal-Stage der Karte
      showToast('Deal aktualisiert ✓');
    },
    onError: (e) => showToast(`Speichern fehlgeschlagen: ${(e as Error).message}`),
  });
  const [lostModal, setLostModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  const [wonModal, setWonModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  // P8-2d/3 — Stage-Wechsel am Stage-Badge (Deals-/Übersicht-Tab). Drei Pfade, gleiche
  // Invalidierung: normaler Move (updateDealStage), gewonnen (updateDealWon, direkt, kein Modal),
  // verloren (DealLostModal → updateDealLost).
  const invalidateDealsScope = () => {
    queryClient.invalidateQueries({ queryKey: ['dealsByContact', organizationId, contactId] });
    queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['newInPipeline', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups: aktive-Deal-Stage der Karte
    queryClient.invalidateQueries({ queryKey: ['signals', organizationId] });  // Signals: aktive-Deal-Stage der Karte
  };
  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, newSlug }: { dealId: string; newSlug: string }) => updateDealStage(dealId, newSlug, organizationId),
    onSuccess: () => { invalidateDealsScope(); showToast('Stage geändert ✓'); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  const wonMutation = useMutation({
    mutationFn: ({ dealId, wonReason, wonNote }: { dealId: string; wonReason?: string; wonNote?: string }) => updateDealWon(dealId, organizationId, { wonReason, wonNote }),
    onSuccess: () => { invalidateDealsScope(); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  // Won-Flow: sofort gewinnen + Konfetti + Notiz-Modal öffnen; „Überspringen" = kein Write.
  const startWonFlow = (dealId: string) => {
    triggerConfetti();
    setWonModal({ open: true, dealId });
    wonMutation.mutate({ dealId }, { onSuccess: () => showToast('Deal gewonnen ✓') });
  };
  const lostMutation = useMutation({
    mutationFn: ({ dealId, lostReason, note }: { dealId: string; lostReason: string; note: string }) => updateDealLost(dealId, organizationId, lostReason, note),
    onSuccess: () => { invalidateDealsScope(); showToast('Deal als verloren markiert'); setLostModal({ open: false, dealId: null }); },
    onError: () => showToast('Stage konnte nicht geändert werden'),
  });
  const handleStageChange = (dealId: string, newSlug: string) => {
    if (newSlug === WON_STAGE_SLUG) { startWonFlow(dealId); return; }
    if (newSlug === LOST_STAGE_SLUG) { setLostModal({ open: true, dealId }); return; }
    updateStageMutation.mutate({ dealId, newSlug });
  };
  // PH3 — Telefonnummern schreiben (contact_phones). Invalidiert nur contactDetail (Phones-Embed).
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
  // Telefon-Handler (geteilt von Kontaktzeile-PhoneField + Details-DetailPhoneList).
  const phoneAdd = () => createPhoneMutation.mutate({ number: '', label: 'Weitere', isPrimary: profile.phones.length === 0 });
  const phoneDelete = (id: string) => {
    // Sicherheitsabfrage (shadcn AlertDialog) nur, wenn es die einzige Nummer ist — sonst direkt löschen.
    if (profile.phones.length <= 1) { setConfirmPhoneDeleteId(id); return; }
    deletePhoneMutation.mutate(id);
  };
  // P5c-3 — Deal soft-löschen: deleted_at = now() (Audit via Trigger). Invalidation wie create/update.
  const deleteDealMutation = useMutation({
    mutationFn: (dealId: string) => softDeleteDeal(dealId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealsByContact', organizationId, contactId] });
      queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['newInPipeline', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups: aktive-Deal-Stage der Karte
      queryClient.invalidateQueries({ queryKey: ['signals', organizationId] });  // Signals: aktive-Deal-Stage der Karte
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
    { icon: CheckSquare, label: 'Task', onClick: () => { setTasksAutoEditId('new'); setActiveTab('tasks'); } },
    { icon: Briefcase, label: 'Deal', onClick: () => { setDealsAutoNew(true); setActiveTab('deals'); } },
    { icon: FileText, label: 'Notiz', onClick: () => { setNotesAutoCompose(true); setActiveTab('notes'); } },
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
          <span className="typo-section-label text-text-muted mb-2">Status</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-bg border border-border text-text-body text-[12px] font-extrabold leading-none">
            {profile.statusLabel}
          </span>
        </div>
      )}

      {profile.heatStatus && (
        <div className="flex flex-col items-center">
          <span className="typo-section-label text-text-muted mb-2">Heat</span>
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
      phones={profile.phones}
      onSaveField={(f, v) => saveContactField(f as 'email' | 'linkedin' | 'web', v)}
      // Stift im readonly-Panel → Vollansicht öffnen + auf das Feld fokussieren (web → website).
      onEditField={(f) => { setFocusField(f === 'web' ? 'website' : f); setShowVollansicht(true); }}
      onCopyField={(f) => showToast(`${FIELD_LABEL[f]} kopiert`)}
      onSetFavorite={(id) => setPhonePrimaryMutation.mutate(id)}
      onUpdateNumber={(id, number) => updatePhoneMutation.mutate({ phoneId: id, number })}
      onAddPhone={phoneAdd}
      onRemovePhone={phoneDelete}
      onUpdateLabel={(id, label) => updatePhoneMutation.mutate({ phoneId: id, label })}
      phoneTypes={PHONE_TYPES}
    />
  );

  const tabNav = (
    <PanelTabs
      tabs={[
        { id: 'overview', label: 'Übersicht', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: 'activity', label: 'Aktivität', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'communication', label: 'Kommunikation', icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
        { id: 'deals', label: 'Deals', icon: <Briefcase className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notizen', icon: <FileText className="w-3.5 h-3.5" /> },
      ]}
      active={activeTab}
      onChange={setActiveTab}
    />
  );

  const tabContent = person && (
        <>

        {activeTab === 'overview' && (
          (dealsQuery.isLoading || tasksQuery.isLoading || commsQuery.isLoading) ? (
            <PanelSkeleton rows={4} height={80} />
          ) : (
          <div className="space-y-7 animate-fade-in">
            {/* KI-Kurzakte — immer sichtbar (Honesty: „Folgt"-Platzhalter bis [D5]). */}
            <KiKurzaktePlaceholder />
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
              stagnationBySlug={stagnationBySlug}
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

            {/* Kompakter „Letzter Kontakt"-Block: 3 neueste echte Touchpoints; leer → ausgeblendet. */}
            <KommunikationKompakt items={commsView} onShowAll={() => setActiveTab('communication')} />

            {/* Deferred (PROGRESS): KI-Kurzakte (KI-Pipeline) · Active Sequence (contact_sequences) ·
                externe/LinkedIn-Signale (Signal-Quelle). */}
          </div>
          )
        )}

        {activeTab === 'activity' && (
          activityQuery.isLoading
            ? <PanelSkeleton rows={5} height={56} />
            : <AktivitaetsVerlauf rows={activityQuery.data ?? []} />
        )}

        {activeTab === 'communication' && (
          commsQuery.isLoading
            ? <PanelSkeleton rows={4} height={64} />
            : <KommunikationVerlauf items={commsView} onLog={() => setLogOpen(true)} />
        )}

        {activeTab === 'tasks' && (
          tasksQuery.isLoading ? <PanelSkeleton rows={3} height={72} /> : (
          <TasksListe
            onToast={showToast}
            autoEditId={tasksAutoEditId}
            onAutoEditConsumed={() => setTasksAutoEditId(null)}
            highlightId={initialTaskId}
            taskRows={tasksQuery.data ?? []}
            contactName={profile.name}
            dealOptions={dealOptions}
            initialDealId={initialDealId}
            onCreate={(v) => createTaskMutation.mutate(v)}
            onUpdate={(id, v) => updateTaskMutation.mutate({ taskId: id, v })}
            onComplete={(id) => completeTaskMutation.mutate(id)}
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
          )
        )}

        {activeTab === 'deals' && (
          dealsQuery.isLoading ? <PanelSkeleton rows={2} height={140} /> : (
          <DealsListe
            variant="detail"
            onToast={showToast}
            autoNew={dealsAutoNew}
            autoEditId={dealsAutoEditId ?? undefined}
            onAutoEditConsumed={() => { setDealsAutoEditId(null); setDealsAutoNew(false); }}
            dealRows={dealsQuery.data ?? []}
            stageNameBySlug={stageMap}
            stageProbBySlug={stageProbMap}
            stagnationBySlug={stagnationBySlug}
            productOptions={productOptions}
            ownerOptions={ownerOptions}
            stageOptions={stageOptions}
            onCreateDeal={(v) => createDealMutation.mutate(v)}
            onUpdateDeal={(dealId, v) => updateDealMutation.mutate({ dealId, v })}
            onDeleteDeal={(dealId) => deleteDealMutation.mutate(dealId)}
            onChangeStage={(dealId, newSlug) => handleStageChange(dealId, newSlug)}
            stageChangePendingId={updateStageMutation.isPending ? (updateStageMutation.variables?.dealId ?? null) : null}
          />
          )
        )}

        {activeTab === 'notes' && (
          notesQuery.isLoading ? <PanelSkeleton rows={3} height={72} /> : (
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

  // Details-Tab (nur Vollansicht) — alle Kontakt-/Firmen-/CRM-Felder (CLAUDE.md → CRM FELDER),
  // editierbar (Standard) bzw. readonly (System). Bündelt was bei „+ SDR Lead" erfassbar ist.
  // PH3: Telefon-Liste schreibbar (echte contact_phones — Favorit/Edit/Add/Remove via Mutations).
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

        {/* Kontaktdaten — in dezenter grauer Sub-Kachel (nur dieser Bereich grau) */}
        <div className="sm:col-span-2 bg-app-bg rounded-[10px] p-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailField label="E-Mail" type="email" copyable value={contact.email} validate={isValidEmail} autoEdit={initialFocusField === 'email'} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('email', v)} />
            <DetailField label="LinkedIn" copyable value={contact.linkedin} autoEdit={initialFocusField === 'linkedin'} href={`https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('linkedin', v)} />
            <DetailField label="Webadresse" copyable value={contact.web} validate={(v) => isValidUrl(normalizeUrl(v))} autoEdit={initialFocusField === 'website'} href={`https://${contact.web.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => saveContactField('web', v)} />
          </div>
          <div className="mt-5">
            <DetailPhoneList
              phones={profile.phones}
              types={PHONE_TYPES}
              onSetFavorite={(id) => setPhonePrimaryMutation.mutate(id)}
              onUpdate={(id, patch) => updatePhoneMutation.mutate({ phoneId: id, number: patch.number, label: patch.type })}
              onAdd={phoneAdd}
              onRemove={phoneDelete}
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

      <DetailSection title="Klassifizierung" icon={Tag} variant="page">
        <DetailField label="Lead Status" value={details.leadStatus} options={LEAD_STATUS_OPTS} onSelect={(v) => { setDetails((d) => ({ ...d, leadStatus: v })); const slug = contactStatusSlug(v); if (slug) updateContactMutation.mutate({ contact_status: slug }); }} />
        <DetailField label="ICP Score" value={details.icp} onSave={(v) => setDetail('icp', v)} />
        <DetailField label="Owner" value={details.owner} onSave={(v) => setDetail('owner', v)} />
        <DetailField label="Tags" value={details.tags} onSave={(v) => setDetail('tags', v)} />

        {/* E-Mail-Verifiziert-Badge entfernt: war hardcodiert „Verifiziert" (Mock). Kommt erst echt
            mit dem email_verification-Modul (settings.modules) zurück (Honesty: kein Fake-Status). */}
      </DetailSection>

      <DetailSection title="Notizen" icon={FileText} cols={1} variant="page">
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
      <DetailSection title="System" icon={Clock} collapsible defaultCollapsed variant="page">
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
      {/* Fixer weißer Panel-Kopf (Name/Kontaktzeile/Tabs); grauer `main` scrollt darunter.
          Trennlinie bewusst NICHT hier (und NICHT an der PanelTabs-nav) — sonst zwei border-b
          (nav eingerückt + header voll-breit) mit weißem Spalt dazwischen. Die EINE Trennlinie
          sitzt als `border-t` an der Oberkante des grauen `main` → Grau beginnt bündig an der Linie.
          (Gleiches Muster fürs Farmer-Info-Panel [D33] übernehmen.) */}
      <header className="pt-7 px-7 bg-app-surface items-start relative z-10 shrink-0">
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

      <main className="flex-1 min-h-0 overflow-y-auto p-7 space-y-7 bg-app-bg border-y border-border-subtle custom-scrollbar pb-28">
        {tabContent}
      </main>

      <footer className="px-4 py-2.5 bg-app-surface shrink-0 flex items-center justify-between gap-2 relative z-10">
        {renderActions(panelBtn)}
      </footer>
    </>
  );

  // Voll-Variante — echte Seite. Die gesamte Seite scrollt (ein Scroll-Container);
  // nur Topbar und Tab-Leiste bleiben per sticky oben stehen. Kein Panel-Inner-Scroll.
  const FULL_TABS = [
    { id: 'details', label: 'Details', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'overview', label: 'Übersicht', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Aktivität', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'communication', label: 'Kommunikation', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'deals', label: 'Deals', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'notes', label: 'Notizen', icon: <FileText className="w-3.5 h-3.5" /> },
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
          style={{ width: 820, maxWidth: "95vw" }}
        >
          {panelBody}
        </SheetContent>
      </Sheet>
    )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-[12px] shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {variant !== 'full' && showVollansicht && (
        <HunterSidepanel person={display} onClose={() => { setShowVollansicht(false); setFocusField(null); }} onExit={onClose} variant="full" initialDealId={initialDealId} initialFocusField={focusField} />
      )}

      <KommunikationLogModal
        open={logOpen}
        pending={createCommMutation.isPending}
        onSave={(v) => createCommMutation.mutate(v)}
        onCancel={() => setLogOpen(false)}
      />

      {/* Letzte Telefonnummer löschen — destruktive Bestätigung (shadcn AlertDialog statt window.confirm). */}
      <AlertDialog open={confirmPhoneDeleteId !== null} onOpenChange={(o) => { if (!o) setConfirmPhoneDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nummer löschen</AlertDialogTitle>
            <AlertDialogDescription>Das ist die einzige Nummer dieses Kontakts. Wirklich löschen?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmPhoneDeleteId) deletePhoneMutation.mutate(confirmPhoneDeleteId); setConfirmPhoneDeleteId(null); }}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* P8-3: Lost-Dialog bei Wechsel in „verloren" (Stage-Badge im Deals-/Übersicht-Tab). Won = kein Modal. */}
      <DealLostModal
        open={lostModal.open}
        pending={lostMutation.isPending}
        onCancel={() => setLostModal({ open: false, dealId: null })}
        onConfirm={(lostReason, note) => { const id = lostModal.dealId; setLostModal({ open: false, dealId: null }); if (id) lostMutation.mutate({ dealId: id, lostReason, note }); }}
      />

      {/* Won-Notiz (nicht blockierend): Deal ist bereits gewonnen; „Speichern" hängt won_note an, „Überspringen" = kein Write. */}
      <DealWonModal
        open={wonModal.open}
        pending={wonMutation.isPending}
        onSave={(reason, note) => { const id = wonModal.dealId; setWonModal({ open: false, dealId: null }); if (id) wonMutation.mutate({ dealId: id, wonReason: reason, wonNote: note }, { onSuccess: () => showToast('Gespeichert ✓') }); }}
        onSkip={() => setWonModal({ open: false, dealId: null })}
      />
    </>
  );
}
