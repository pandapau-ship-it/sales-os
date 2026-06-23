/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  ArrowRight,
  ChevronLeft,
  Plus,
  Zap,
  ChevronDown,
  ArrowLeft,
  Eye,
  SlidersHorizontal,
  Check,
  Trash,
  Clock,
  ListChecks,
  TrendingUp,
  Percent,
  Flame,
  Users,
  X
} from 'lucide-react';
import type { Lead, HeatStatus } from '@/types';
import type { PipelineStage } from '@/types/hunter';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { heatFor } from '@/lib/constants';
import { ICPDonut } from '@/components/shared/ICPDonut';
import { NAV } from '@/lib/navBehavior';
import { AddSdrLeadPanel, ContactColdDrawer, EmptyState, FollowUpKaltCard, FunnelAnalysis, HeatBadge, HunterSidepanel, KpiCard, LeadListRow, LinkedinSignalCard, NewInPipelineCards, PipelineKeineTaskCard, PipelineStagniertCard, SequenceLeadCards, SignalActionDrawer, StageBadge, StagnationHint, TaskDrawer } from '@/components';
import type { SignalActionData } from '@/components';

import Avatar from '@/components/shared/Avatar';
import { signalToCardProps, signalToActionData, contactToColdPerson, contactToProfile, taskToDueCard, dealToNewPipelineRow, dealToStagnatedCard, contactToNoTaskCard, calculatePriorityScore, newPipelineInPeriod, isTerminalStage, stagnationFlag, WON_STAGE_SLUG, LOST_STAGE_SLUG, type PipelineRow, type NewPipelinePeriod, type StagnatedCardItem, type NoTaskCardItem } from '@/lib/hunterMappers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDealStage, updateDealWon, updateDealLost } from '@/lib/db';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useToast } from '@/components/shared/Toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DealLostModal, DealCloseModal, DealWonModal } from '@/components';
import { triggerConfetti } from '@/lib/confetti';

interface ScreenHuntingProps {
  leads: Lead[];
  // Slice 1: echte org-gescopte Leads (DB) NUR für den Leads-Tab. Fällt auf `leads`
  // (Mock) zurück, solange nicht gesetzt. Andere Tabs nutzen weiter `leads`.
  leadsData?: Lead[];
  leadsLoading?: boolean;
  leadsError?: boolean;
  // Slice A: echte Deals (org-gescoped) für die Pipeline-Listenansicht.
  dealsData?: PipelineRow[];
  // Roh-Deals (vor dealToPipelineRow) — tragen stagnation_days + tasks(*)-Embed; nötig für
  // die Pipeline-Task-Karten (Stagniert / Keine Task), die diese Felder ableiten.
  rawDealsData?: Record<string, unknown>[];
  dealsLoading?: boolean;
  dealsError?: boolean;
  // Slice B: Pipeline-Stages (settings.pipeline_stages) für die Kanban-Spalten.
  pipelineStages?: PipelineStage[];
  // S-2: echte Signals (org-gescoped, hunter-routed) für den Signals-Tab.
  signalsData?: Record<string, unknown>[];
  signalsLoading?: boolean;
  signalsError?: boolean;
  // Follow-ups (T2): fällige Tasks (completed_at IS NULL AND due_at <= now()),
  // inkl. Kontakt-Embed (+ company + deals für contactActiveStage).
  dueTasksData?: Record<string, unknown>[];
  // Dringlichkeits-Score-Gewichte (Übersicht-Tab) aus settings.thresholds; undefined → Default-Gewichte.
  priorityWeights?: Record<string, number>;
  // Neu-in-Pipeline: frisch angelegte Deals (inkl. contact + company + deals-Embed).
  newInPipelineData?: Record<string, unknown>[];
  // Cold/Inaktiv: Kontakte mit heat_status 'kalt'/'tot' (für den Reaktivierungs-Opener).
  coldContactsData?: Record<string, unknown>[];
  onSelectLead: (lead: Lead) => void;
  // T4a: Task erledigt markieren (Follow-ups). org-Scoping/Mutation liegt im Container.
  onCompleteTask?: (taskId: string) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onAddLead: (lead: Lead) => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
  onOpenCopilot?: (context?: 'elena' | 'marc') => void;
}

export default function ScreenHunting({
  leads,
  leadsData,
  leadsLoading,
  leadsError,
  dealsData,
  rawDealsData,
  dealsLoading,
  dealsError,
  pipelineStages,
  signalsData,
  signalsLoading,
  signalsError,
  dueTasksData,
  priorityWeights,
  newInPipelineData,
  coldContactsData,
  onCompleteTask,
  onAddLead,
  onSelectCommunication,
}: ScreenHuntingProps) {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();
  // Leads-Tab-Quelle: echte DB-Leads, sonst Mock-Fallback. Nur dieser Tab + sein
  // Count/Select nutzen leadRows; Pipeline/Overview/Signals bleiben auf `leads`.
  const leadRows = leadsData ?? leads;
  // Pipeline-Listenansicht (Slice A): echte Deals. Kanban/Tasks bleiben Mock.
  const dealRows = dealsData ?? [];
  // P8-2c/3 — Stage-Wechsel (Kanban-Pfeile + Liste-Dropdown). Drei Schreib-Pfade, gleiche
  // Invalidierung: normaler Move (updateDealStage), gewonnen (updateDealWon, direkt, kein Modal),
  // verloren (DealLostModal → updateDealLost). Reihenfolge ['deals'] zieht Liste/Kanban/Funnel mit.
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [lostModal, setLostModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  const [wonModal, setWonModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  const [closeDealModal, setCloseDealModal] = useState<{ open: boolean; dealId: string | null }>({ open: false, dealId: null });
  const invalidateDealsScope = () => {
    queryClient.invalidateQueries({ queryKey: ['dealsByContact', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['deals', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['newInPipeline', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['dueTasks', organizationId] }); // Follow-ups: aktive-Deal-Stage der Karte
    queryClient.invalidateQueries({ queryKey: ['signals', organizationId] });  // Signals: aktive-Deal-Stage der Karte
  };
  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, newSlug }: { dealId: string; newSlug: string }) => updateDealStage(dealId, newSlug, organizationId),
    onSuccess: () => { invalidateDealsScope(); toast('Stage geändert ✓'); },
    onError: () => toast('Stage konnte nicht geändert werden'),
  });
  const wonMutation = useMutation({
    mutationFn: ({ dealId, wonReason, wonNote }: { dealId: string; wonReason?: string; wonNote?: string }) => updateDealWon(dealId, organizationId, { wonReason, wonNote }),
    onSuccess: () => { invalidateDealsScope(); },
    onError: () => toast('Stage konnte nicht geändert werden'),
  });
  // Won-Flow: Deal SOFORT gewinnen (Write) + Konfetti + Notiz-Modal öffnen. „Überspringen" braucht
  // daher keinen Write mehr; „Speichern" hängt nur die optionale won_note an.
  const startWonFlow = (dealId: string) => {
    triggerConfetti();
    setWonModal({ open: true, dealId });
    wonMutation.mutate({ dealId }, { onSuccess: () => toast('Deal gewonnen ✓') });
  };
  const lostMutation = useMutation({
    mutationFn: ({ dealId, lostReason, note }: { dealId: string; lostReason: string; note: string }) => updateDealLost(dealId, organizationId, lostReason, note),
    onSuccess: () => { invalidateDealsScope(); toast('Deal als verloren markiert'); setLostModal({ open: false, dealId: null }); },
    onError: () => toast('Stage konnte nicht geändert werden'),
  });
  const handleStageChange = (newSlug: string, dealId: string) => {
    if (newSlug === WON_STAGE_SLUG) { startWonFlow(dealId); return; }
    if (newSlug === LOST_STAGE_SLUG) { setLostModal({ open: true, dealId }); return; }
    updateStageMutation.mutate({ dealId, newSlug });
  };
  // Pfeil → Deal eine Stage weiter (nächste in stageOptions-Reihenfolge). Ist die nächste
  // terminal (gewonnen/verloren) → Close-Deal-Popup (Gewonnen/Verloren wählen), kein Auto-Win.
  // Keine nächste → still (Guard).
  const handleAdvanceStage = (currentSlug: string, dealId: string) => {
    const idx = stageOptions.findIndex((s) => s.slug === currentSlug);
    const next = idx >= 0 ? stageOptions[idx + 1] : undefined;
    if (!next) return;
    if (isTerminalStage(next.slug)) { setCloseDealModal({ open: true, dealId }); return; }
    handleStageChange(next.slug, dealId);
  };
  // Pfeil ← Deal eine Stage zurück (vorherige in stageOptions-Reihenfolge). Erste Stage →
  // keine vorherige → Button ist ausgeblendet (idx === 0). Zurück landet nie auf terminal
  // (Terminal-Stages stehen am Ende) → direkter Write.
  const handleRetreatStage = (currentSlug: string, dealId: string) => {
    const idx = stageOptions.findIndex((s) => s.slug === currentSlug);
    const prev = idx > 0 ? stageOptions[idx - 1] : undefined;
    if (!prev) return;
    handleStageChange(prev.slug, dealId);
  };
  // Stage-Liste fürs Inline-Dropdown (slug/name, in Pipeline-Reihenfolge) — wie im Panel.
  const stageOptions = [...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((s) => ({ slug: s.slug, name: s.name }));
  // Signals-Tab: echte Signals → Card-Props (Mapping braucht t + Stage-Labels für aktive-Deal-Stage).
  const stageNameBySlug = Object.fromEntries((pipelineStages ?? []).map((stg) => [stg.slug, stg.name]));
  const signalCards = (signalsData ?? []).map((s) => signalToCardProps(s, t, stageNameBySlug));
  // Follow-ups (T2): fällige Tasks → Card-Items (Kontakt-Kachel + aktive-Deal-Stage + Task-Titel/Fälligkeit).
  const dueTaskCards = (dueTasksData ?? []).map((tk) => taskToDueCard(tk, stageNameBySlug));
  // Neu-in-Pipeline: frisch angelegte Deals → Card-Items (Kontakt-Kachel + aktive-Deal-Stage + Herkunft).
  // Default-Fenster 30T („letzter Monat") — weiteste sinnvolle Spanne, da die Seed-Recency
  // mit dem anon-Key (RLS) nicht prüfbar ist; auf '7d'/'today' per Filter umschaltbar.
  const [newPipelinePeriod, setNewPipelinePeriod] = useState<NewPipelinePeriod>('30d');
  const newPipelineItems = (newInPipelineData ?? []).map((d) => dealToNewPipelineRow(d, stageNameBySlug));

  // Pipeline-Task-Karten aus den ROH-Deals ableiten (stagnation_days + tasks(*) sind nur dort).
  // Schwellenwert je Stage aus settings (pipeline_stages.stagnation_days) — nie hardcodiert; Fallback 7.
  const stagnationBySlug = Object.fromEntries((pipelineStages ?? []).map((s) => [s.slug, s.stagnation_days]));
  const rawDeals = (rawDealsData ?? []) as Record<string, any>[];
  const stagnatedItems: StagnatedCardItem[] = rawDeals
    .filter((d) => !isTerminalStage(d.stage))
    .filter((d) => (d.stagnation_days ?? 0) >= (stagnationBySlug[d.stage] ?? 7))
    .sort((a, b) => (b.stagnation_days ?? 0) - (a.stagnation_days ?? 0))
    .map((d) => dealToStagnatedCard(d, stageNameBySlug));
  // „Keine Task" KONTAKT-basiert: aktive (nicht-terminale) Deals nach Kontakt gruppieren;
  // ein Kontakt erscheint, wenn KEINER seiner Deals eine offene Task hat (completed_at &
  // deleted_at NULL). Eine Kachel pro Kontakt mit allen seinen Deals. Deals ohne Kontakt → übersprungen.
  const hasOpenTask = (d: Record<string, any>) =>
    (((d.tasks as Record<string, any>[]) ?? []).some((tk) => tk.completed_at == null && tk.deleted_at == null));
  const noTaskByContact = new Map<string, Record<string, any>[]>();
  for (const d of rawDeals) {
    if (isTerminalStage(d.stage)) continue;
    const cid = d.contact?.id as string | undefined;
    if (!cid) continue;
    if (!noTaskByContact.has(cid)) noTaskByContact.set(cid, []);
    noTaskByContact.get(cid)!.push(d);
  }
  const noTaskItems: NoTaskCardItem[] = [...noTaskByContact.values()]
    .filter((deals) => deals.every((d) => !hasOpenTask(d))) // kein einziger Deal des Kontakts hat eine offene Task
    .map((deals) => contactToNoTaskCard(deals[0].contact, deals, stageNameBySlug));
  // Übersicht — Dringlichkeits-Score: pro Kontakt (mit ≥1 aktivem Deal) aus aktiven Deals +
  // seinen Signalen. Gewichte aus settings (priorityWeights) — Fallback Default im Mapper.
  // Signal-getrieben: Score 0 → nicht anzeigen. Sortierung: Score → ARR → ICP → ältestes Deal-Datum.
  const signalsByContact = new Map<string, Record<string, any>[]>();
  for (const s of (signalsData ?? []) as Record<string, any>[]) {
    const cid = (s.contact?.id ?? s.contact_id) as string | undefined;
    if (!cid) continue;
    if (!signalsByContact.has(cid)) signalsByContact.set(cid, []);
    signalsByContact.get(cid)!.push(s);
  }
  const oldestDealMs = (deals: Record<string, any>[]) =>
    Math.min(...deals.map((d) => new Date(d.created_at ?? 0).getTime() || Infinity));
  const priorityItems = [...noTaskByContact.values()]
    .map((deals) => {
      const contact = deals[0].contact as Record<string, any>;
      const res = calculatePriorityScore(contact, deals, signalsByContact.get(contact.id) ?? [], priorityWeights, stagnationBySlug);
      return { contact, deals, oldest: oldestDealMs(deals), ...res };
    })
    .filter((it) => it.score > 0)
    .sort((a, b) => b.score - a.score || b.arr - a.arr || (b.icpScore ?? 0) - (a.icpScore ?? 0) || a.oldest - b.oldest);
  const newPipelineFiltered = newPipelineItems.filter((it) => newPipelineInPeriod(it.createdAt, newPipelinePeriod));

  // Übersicht „Wichtigste Aufgaben" — Top 5 aus mehreren Quellen, in Reihenfolge bis 5 erreicht
  // (dedupe per contactId, Signal-getrieben → weniger als 5 wenn nicht genug, nie leere Slots):
  //   1. Kontakte mit Score > 0 (priorityItems) → dominante Signal-Kachel
  //   2. LinkedIn-Signals (signalCards) · 3. Neu in Pipeline (newPipelineFiltered).
  const TOP_N = 5;
  const top5Shown = new Set<string>();
  const top5ScoreItems = [] as typeof priorityItems;
  for (const it of priorityItems) {
    if (top5ScoreItems.length >= TOP_N) break;
    const cid = it.contact.id as string;
    if (top5Shown.has(cid)) continue;
    top5Shown.add(cid);
    top5ScoreItems.push(it);
  }
  const top5SignalSlots: { card: typeof signalCards[number]; index: number }[] = [];
  (signalsData ?? []).forEach((_, i) => {
    if (top5ScoreItems.length + top5SignalSlots.length >= TOP_N) return;
    const card = signalCards[i];
    const cid = card?.contactId as string | undefined;
    if (cid && top5Shown.has(cid)) return;
    if (cid) top5Shown.add(cid);
    top5SignalSlots.push({ card, index: i });
  });
  const top5NewPipeline = [] as typeof newPipelineFiltered;
  for (const it of newPipelineFiltered) {
    if (top5ScoreItems.length + top5SignalSlots.length + top5NewPipeline.length >= TOP_N) break;
    const cid = it.contactId as string | undefined;
    if (cid && top5Shown.has(cid)) continue;
    if (cid) top5Shown.add(cid);
    top5NewPipeline.push(it);
  }
  const top5Count = top5ScoreItems.length + top5SignalSlots.length + top5NewPipeline.length;
  // Übersicht-Aggregate (reine Reads, kein Write): wiederverwenden was schon geladen ist.
  const eur = (n: number) => `€ ${new Intl.NumberFormat('de-DE').format(Math.round(n))}`;
  const openDeals = dealRows.filter((d) => !isTerminalStage(d.stageSlug));
  const pipelineValueEur = openDeals.reduce((sum, d) => sum + (d.valueEur ?? 0), 0); // null-Werte zählen 0
  const openDealCount = openDeals.length;
  // Kanban-KPIs (client-seitig aus dealRows, kein DB-Call). Probability aus pipeline_stages (slug→prob).
  const fmtEur0 = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const stageProbBySlug = Object.fromEntries((pipelineStages ?? []).map((stg) => [stg.slug, stg.probability]));
  const weightedValueEur = openDeals.reduce((sum, d) => sum + (d.valueEur ?? 0) * ((stageProbBySlug[d.stageSlug] ?? 0) / 100), 0);
  // Gewichteter Wert pro Stage (für Hover-Popover) — nur Stages mit aktiven Deals (Honesty), in Pipeline-Reihenfolge.
  const weightedByStage = [...(pipelineStages ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const ds = openDeals.filter((d) => d.stageSlug === s.slug);
      const weighted = ds.reduce((sum, d) => sum + (d.valueEur ?? 0) * ((s.probability ?? 0) / 100), 0);
      return { slug: s.slug, name: s.name, probability: s.probability, weighted, count: ds.length };
    })
    .filter((x) => x.count > 0);
  const HEAT_ORDER: HeatStatus[] = ['HOT', 'WARM', 'LUKEWARM', 'COLD', 'DEAD'];
  const heatCounts = openDeals.reduce((acc, d) => { acc[d.heatStatus] = (acc[d.heatStatus] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const hotSignalCount = signalCards.length;       // identische Quelle wie der Signals-Tab-Count
  const followUpsTodayCount = dueTaskCards.length;  // fällige Tasks (= Follow-ups-Tab)
  // Funnel: Deals-Anzahl + €-Summe pro Stage (Reihenfolge/Namen aus pipeline_stages).
  const funnelStages = [...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((stg) => {
    const ds = dealRows.filter((d) => d.stageSlug === stg.slug);
    const sumEur = ds.reduce((s, d) => s + (d.valueEur ?? 0), 0);
    return {
      slug: stg.slug,
      name: stg.name,
      deals: ds.length,
      valueLabel: eur(sumEur),
      avgValueLabel: ds.length ? eur(sumEur / ds.length) : undefined, // Ø-Wert/Deal (ehrlich), sonst kein Tooltip
      isWon: stg.slug === WON_STAGE_SLUG,
    };
  });
  // Slice C — drei Filter, client-seitig über die geteilte dealRows-Quelle:
  //  • Heat + Owner gelten in BEIDEN Ansichten (Liste + Kanban)
  //  • Stage NUR in der Liste (Kanban ist bereits nach Stage gruppiert)
  const [stageFilter, setStageFilter] = useState('all');         // slug | 'all'
  const [heatFilter, setHeatFilter] = useState<'all' | HeatStatus>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');         // ownerId-Key | 'all'
  const [filtersOpen, setFiltersOpen] = useState(false);          // Progressive Disclosure: Filter erst auf Klick
  const ownerKey = (id: string | null) => id ?? '__none__';      // Radix verbietet '' als Value
  // Stufe 1 (beide Ansichten): Heat + Owner
  const baseFilteredDeals = dealRows.filter((d) =>
    (heatFilter === 'all' || d.heatStatus === heatFilter) &&
    (ownerFilter === 'all' || ownerKey(d.ownerId) === ownerFilter)
  );
  // Stufe 2 (nur Liste): zusätzlich Stage
  const listDealRows = stageFilter === 'all'
    ? baseFilteredDeals
    : baseFilteredDeals.filter((d) => d.stageSlug === stageFilter);
  // Owner-Optionen = distinct aus allen geladenen Deals (unabhängig vom aktiven Filter)
  const ownerOptions = Array.from(
    new Map(dealRows.map((d) => [ownerKey(d.ownerId), d.ownerLabel])).entries(),
  ).map(([id, label]) => ({ id, label }));
  const [subTab, setSubTab] = useState<'overview' | 'new_leads' | 'leads' | 'pipeline' | 'signals' | 'sequences' | 'follow_ups'>('leads');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  // Kanban: Spalten default expanded (Slice B); key = echter stage.slug.
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  // Pipeline-Tab: Listenansicht ↔ Kanban (Toggle); 'tasks' = jetzige Task-Liste (per Button).
  const [pipelineView, setPipelineView] = useState<'list' | 'kanban' | 'tasks'>('list');
  // Anzahl offener Pipeline-Tasks = stagnierende Deals + Deals ohne offene Task (echt, abgeleitet).
  const openTaskCount = stagnatedItems.length + noTaskItems.length;

  // Local state for Quick Lead Adder Dialog
  const [showAddModal, setShowAddModal] = useState(false);

  const [taskLead, setTaskLead] = useState<{name: string, company: string, initials: string, color: string} | null>(null);
  const [taskTitle] = useState('Erster Outreach empfohlen — LinkedIn DM');
  const [taskNote] = useState('Hallo Sarah,\n\nich habe gerade gesehen, dass CloudSphere stark skaliert. Da wir viele BDR-Teams im selben Bereich unterstützen, dachte ich, ein kurzer Connect macht Sinn.\n\nViele Grüße');

  const [selectedSignal, setSelectedSignal] = useState<SignalActionData | null>(null);
  const [selectedColdPerson, setSelectedColdPerson] = useState<any | null>(null);
  // Info-Panel (§22.1, 820px) — vorerst NUR im Leads-Tab inline rechts neben der Liste.
  const [infoPanelLead, setInfoPanelLead] = useState<Lead | null>(null);
  // Karten-Aktion (Mail/Task/Chat) → Info-Panel öffnet direkt mit dieser Aktion.
  const [infoPanelAction, setInfoPanelAction] = useState<'mail' | 'task' | 'chat' | null>(null);
  const [infoPanelTab, setInfoPanelTab] = useState<'overview' | 'deals' | 'tasks' | 'activity' | 'notes' | null>(null);
  // Vorausgefüllter Deal für „Task anlegen" aus Pipeline-Task-Kachel → Deal-Dropdown readonly.
  const [infoPanelDealId, setInfoPanelDealId] = useState<string | null>(null);
  // Deal im Edit-Modus öffnen (Karten-Bleistift im aufgeklappten Bereich).
  const [infoPanelDealEditId, setInfoPanelDealEditId] = useState<string | null>(null);

  // Zentrale Karten-Aktion (aufgeklappter Bereich): Task/Notiz/Deal-Edit → Panel mit passendem Tab.
  const handleCardAction = (action: string, lead: Lead, dealId?: string) => {
    setInfoPanelLead(lead);
    if (action === 'task') setInfoPanelAction('task');
    else if (action === 'note') setInfoPanelTab('notes');
    else if (action === 'editDeal') { setInfoPanelTab('deals'); setInfoPanelDealEditId(dealId ?? null); }
    else if (action === 'mail' || action === 'chat') setInfoPanelAction(action);
  };

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedLeadIds(leadRows.map(l => l.id));
  const deselectAll = () => setSelectedLeadIds([]);

  // Signals-Auswahl (gleiche Mechanik wie Leads). IDs = Namen der Signal-Kacheln.
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const signalIds = signalCards.map((s) => s.id); // echte signals.id statt Namen
  const toggleSignalSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSignalIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };
  const selectAllSignals = () => setSelectedSignalIds(signalIds);
  const deselectAllSignals = () => setSelectedSignalIds([]);

  // Minimaler Lead für das Info-Panel (Übersicht-Demokarten; später aus DB).
  const makeLead = (id: string, name: string, jobTitle: string, company: string, initials: string, icpScore: number): Lead => ({
    id,
    person: { id, name, jobTitle, company, initials },
    kurzakte: '', fullTimeline: [], engagementChain: [], lastTouchpoints: [],
    heatStatus: 'WARM', heatScore: 3, icpScore, lastActivity: '',
    pipelineStage: 'pipeline', signalsCount: 1, contactEmail: '',
  });

  const menuItems = [
    { id: 'overview', label: t('hunter.tabs.overview'), count: null },
    { id: 'signals', label: t('hunter.tabs.signals'), count: hotSignalCount },
    { id: 'new_leads', label: t('hunter.tabs.newInPipeline'), count: newPipelineFiltered.length },
    { id: 'leads', label: t('hunter.tabs.leads'), count: leadRows.length },
    { id: 'follow_ups', label: t('hunter.tabs.followUps'), count: dueTaskCards.length },
    { id: 'pipeline', label: t('hunter.tabs.pipelineKanban'), count: null },
  ];




  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">{t('hunter.title')}</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{t('hunter.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)]/95 text-on-accent text-[12px] font-semibold px-4 py-2 rounded-full cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('hunter.addSdrLead')}</span>
        </button>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className={`${NAV.container} ${NAV.surface} ${NAV.subRadius}`}>
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              style={isActive ? { background: NAV.activeBg } : undefined}
              className={`${NAV.subTab} ${NAV.subTabRadius} ${isActive ? NAV.active : NAV.inactive}`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? NAV.badgeActive : NAV.badgeInactive}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. VIEW OVERVIEW */}
      {subTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* KPI Cards — echte Aggregate (3). „Deals in Gefahr/stagniert" + „+X% Vormonat"
              ausgeblendet: brauchen Stagnations-Berechnung (B5/[D4]) bzw. Monats-Historie. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Pipeline-Wert = Σ offene (nicht-terminale) Deals */}
            <KpiCard
              title={t('hunter.overview.pipelineValue')}
              icon={<TrendingUp size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-success-bg)] text-[var(--sherloq-primary)]"
              value={eur(pipelineValueEur)}
              valueClass="text-text-primary"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.openDeals', { count: openDealCount })}
            />

            {/* Heiße Signale = Anzahl hunter-Signale (gleiche Quelle wie Signals-Tab) */}
            <KpiCard
              title={t('hunter.overview.hotSignals')}
              icon={<Zap size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]"
              value={String(hotSignalCount)}
              valueClass="text-[var(--sherloq-primary)]"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.inSignalsFeed')}
            />

            {/* Follow-ups heute = Anzahl fälliger Tasks (getDueTasks) */}
            <KpiCard
              title={t('hunter.overview.followUpsToday')}
              icon={<Clock size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]"
              value={String(followUpsTodayCount)}
              valueClass="text-text-primary"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.dueTasks')}
            />

          </div>

          <FunnelAnalysis stages={funnelStages} />

          {/* Wichtigste Aufgaben — Top 5 aus mehreren Quellen (Score-Reihenfolge intern, NIE als Badge).
              Jede Quelle nutzt ihre bestehende Kachel 1:1. Signal-getrieben: nichts da → Platzhalter. */}
          <div className="mt-2">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">{t('hunter.overview.top5Header')}</span>
            <div className="mt-3">
              {top5Count === 0 ? (
                <EmptyState
                  icon={<ListChecks className="w-6 h-6" />}
                  title={t('hunter.overview.top5Title')}
                  description={t('hunter.overview.top5Hint')}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Quelle 1 — Kontakte mit Score > 0 → dominante Signal-Kachel (1:1) */}
                  {top5ScoreItems.map((it) => {
                    const cid = it.contact.id as string;
                    if (it.signals.includes('stagnated')) {
                      const dealRaw = it.deals.find((d) => (d.stagnation_days ?? 0) >= (stagnationBySlug[d.stage] ?? 7)) ?? it.deals[0];
                      return (
                        <PipelineStagniertCard
                          key={`s-${cid}`}
                          items={[dealToStagnatedCard(dealRaw, stageNameBySlug)]}
                          onSelectLead={(x) => setInfoPanelLead(makeLead(x.contactId ?? x.dealId, x.name, x.jobTitle, x.companyName, x.initials, x.icpScore ?? 75))}
                          onTaskAnlegen={(x) => { setInfoPanelDealId(x.dealId); setInfoPanelAction('task'); setInfoPanelLead(makeLead(x.contactId ?? x.dealId, x.name, x.jobTitle, x.companyName, x.initials, x.icpScore ?? 75)); }}
                        />
                      );
                    }
                    if (it.signals.includes('going_cold')) {
                      const p = contactToProfile(it.contact);
                      const cp = contactToColdPerson(it.contact);
                      const timeAgoLabel = cp.lastContactDays != null
                        ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: cp.lastContactDays }) })
                        : '';
                      return (
                        <FollowUpKaltCard
                          key={`c-${cid}`}
                          contactId={cid}
                          name={p.name}
                          role={p.jobTitle}
                          companyName={p.company}
                          icpScore={p.icpScore}
                          heatStatus={p.heatStatus}
                          timeAgoLabel={timeAgoLabel}
                          onSelectLead={setInfoPanelLead}
                          onOutreachClick={() => setSelectedColdPerson(cp)}
                        />
                      );
                    }
                    return (
                      <PipelineKeineTaskCard
                        key={`n-${cid}`}
                        items={[contactToNoTaskCard(it.contact, it.deals, stageNameBySlug)]}
                        onSelectLead={(x) => setInfoPanelLead(makeLead(x.contactId, x.name, x.jobTitle, x.companyName, x.initials, x.icpScore ?? 75))}
                        onTaskAnlegen={(x) => { setInfoPanelDealId(null); setInfoPanelAction('task'); setInfoPanelLead(makeLead(x.contactId, x.name, x.jobTitle, x.companyName, x.initials, x.icpScore ?? 75)); }}
                      />
                    );
                  })}

                  {/* Quelle 2 — LinkedIn-Signals (1:1 wie im Signals-Tab) */}
                  {top5SignalSlots.map(({ card, index }) => {
                    const { id, ...cardProps } = card;
                    return (
                      <LinkedinSignalCard
                        key={`sig-${id}`}
                        {...cardProps}
                        showUrgency={false}
                        showStage={true}
                        onOpenInfo={setInfoPanelLead}
                        onOpenAction={() => { const raw = (signalsData ?? [])[index]; if (raw) setSelectedSignal(signalToActionData(raw, t)); }}
                      />
                    );
                  })}

                  {/* Quelle 3 — Neu in Pipeline (1:1; gerendert als eigener Block) */}
                  {top5NewPipeline.length > 0 && (
                    <NewInPipelineCards
                      items={top5NewPipeline}
                      period={newPipelinePeriod}
                      onPeriodChange={setNewPipelinePeriod}
                      onSelectLead={setInfoPanelLead}
                      onCreateTask={(lead) => { setInfoPanelAction('task'); setInfoPanelLead(lead); }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'follow_ups' && (
        <div className="flex flex-col gap-6">
          <SequenceLeadCards items={dueTaskCards} onSelectLead={setInfoPanelLead} onComplete={onCompleteTask} />

          {/* Cold/Inaktiv — echte Kontakte mit heat_status 'kalt'/'tot'. Leer → Sektion ausgeblendet (Signal-Prinzip). */}
          {(coldContactsData ?? []).length > 0 && (
            <div className="flex flex-col gap-4">
              <span className="typo-section-label text-text-muted px-1">{t('hunter.followUps.coldSection')}</span>
              {(coldContactsData ?? []).map((raw) => {
                const p = contactToProfile(raw);
                const cp = contactToColdPerson(raw);
                const timeAgoLabel = cp.lastContactDays != null
                  ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: cp.lastContactDays }) })
                  : '';
                return (
                  <FollowUpKaltCard
                    key={String((raw as { id?: string }).id ?? p.name)}
                    contactId={(raw as { id?: string }).id}
                    name={p.name}
                    role={p.jobTitle}
                    companyName={p.company}
                    icpScore={p.icpScore}
                    heatStatus={p.heatStatus}
                    timeAgoLabel={timeAgoLabel}
                    onSelectLead={setInfoPanelLead}
                    onOutreachClick={() => setSelectedColdPerson(cp)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* NEW LEADS VIEW */}
      {subTab === 'new_leads' && (
        <NewInPipelineCards
          items={newPipelineFiltered}
          period={newPipelinePeriod}
          onPeriodChange={setNewPipelinePeriod}
          onSelectLead={setInfoPanelLead}
          onCreateTask={(lead) => { setInfoPanelAction('task'); setInfoPanelLead(lead); }}
        />
      )}

      {/* 2. VIEW LEADS (LIST) */}
      {subTab === 'leads' && (
        <div className="flex flex-col gap-4">

          {/* List Actions / Select All Bar */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedLeadIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={selectedLeadIds.length === leadRows.length ? deselectAll : selectAll}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {t('hunter.leadCard.selected', { count: selectedLeadIds.length, noun: selectedLeadIds.length === 1 ? t('hunter.leadCard.leadSingular') : t('hunter.leadCard.leadPlural') })}
              </span>
              <button onClick={deselectAll} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">{t('hunter.leadCard.deselect')}</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Target className="w-3.5 h-3.5" /> {t('hunter.leadCard.addToCampaign')}
              </button>
              <button className="bg-app-surface border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {leadsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[76px] rounded-[12px] bg-app-surface border border-[var(--border-card)] animate-pulse" />
              ))}
            </div>
          ) : leadsError ? (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">
              Leads konnten nicht geladen werden.
            </div>
          ) : leadRows.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Noch keine Leads"
              description="Füge deinen ersten Lead hinzu"
              action={{ label: '+ SDR Lead hinzufügen', onClick: () => setShowAddModal(true) }}
            />
          ) : leadRows.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;
            return (
              <LeadListRow
                key={lead.id}
                lead={lead}
                isExpanded={isExpanded}
                selected={selectedLeadIds.includes(lead.id)}
                onToggleExpand={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                onToggleSelect={(e) => toggleLeadSelection(lead.id, e)}
                onOpenInfo={() => setInfoPanelLead(lead)}
                onAction={(a, dealId) => handleCardAction(a, lead, dealId)}
                onSelectCommunication={onSelectCommunication}
              />
            );
          })}
        </div>
      )}

      {/* 3. VIEW PIPELINE (KANBAN BOARD) */}
      {subTab === 'pipeline' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              {t('hunter.pipeline.title')}
            </h2>

            <div className="flex items-center gap-2">
              {/* Task-Liste-Button mit Anzahl offener Tasks → öffnet die Task-Ansicht */}
              <button
                onClick={() => setPipelineView('tasks')}
                className={`px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                  pipelineView === 'tasks'
                    ? 'bg-[var(--sherloq-primary)] text-on-accent border-[var(--sherloq-primary)]'
                    : 'bg-app-surface text-[var(--text-body)] border-[var(--border)] hover:bg-[var(--app-bg)]'
                }`}
              >
                {t('hunter.pipeline.taskList')}
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                  pipelineView === 'tasks' ? 'bg-on-accent/20 text-on-accent' : 'bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]'
                }`}>
                  {openTaskCount}
                </span>
              </button>

              {/* Toggle: Listenansicht ↔ Kanban */}
              <div className="flex bg-[var(--app-bg)] rounded-[10px] p-1 border border-[var(--border)]">
                <button
                  onClick={() => setPipelineView('list')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
                    pipelineView === 'list'
                      ? 'bg-app-surface shadow-sm text-[var(--sherloq-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {t('hunter.pipeline.listView')}
                </button>
                <button
                  onClick={() => setPipelineView('kanban')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
                    pipelineView === 'kanban'
                      ? 'bg-app-surface shadow-sm text-[var(--sherloq-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {t('hunter.pipeline.kanban')}
                </button>
              </div>
            </div>
          </div>

          {/* Slice C — Filter als Progressive Disclosure (Liste + Kanban, nicht Tasks): „Filter"-Button
              klappt die Selects auf; Zähler zeigt aktive Filter auch im eingeklappten Zustand. */}
          {pipelineView !== 'tasks' && (() => {
            const activeFilterCount = [
              heatFilter !== 'all',
              ownerFilter !== 'all',
              pipelineView === 'list' && stageFilter !== 'all',
            ].filter(Boolean).length;
            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFiltersOpen((o) => !o)}
                    aria-expanded={filtersOpen}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] border text-[13px] font-bold transition-colors cursor-pointer ${
                      filtersOpen || activeFilterCount > 0
                        ? 'bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] border-[var(--sherloq-primary)]'
                        : 'bg-app-surface text-text-body border-[var(--border)] hover:bg-app-bg'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Filter
                    {activeFilterCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--sherloq-primary)] text-on-accent text-[10px] font-extrabold flex items-center justify-center">{activeFilterCount}</span>
                    )}
                  </button>
                  <span className="text-[12px] text-text-muted ml-auto font-medium">
                    {(pipelineView === 'list' ? listDealRows.length : baseFilteredDeals.length)} Deals
                  </span>
                </div>

                {filtersOpen && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={heatFilter} onValueChange={(v) => setHeatFilter(v as 'all' | HeatStatus)}>
                      <SelectTrigger className="w-[170px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Heat-Stufen</SelectItem>
                        {(['HOT', 'WARM', 'LUKEWARM', 'COLD', 'DEAD'] as HeatStatus[]).map((h) => (
                          <SelectItem key={h} value={h}>{heatFor(h).label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                      <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Deal Owner</SelectItem>
                        {ownerOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {pipelineView === 'list' && (
                      <Select value={stageFilter} onValueChange={setStageFilter}>
                        <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Stages</SelectItem>
                          {[...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((s) => (
                            <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {pipelineView === 'tasks' ? (
            <div className="flex flex-col gap-4 w-full pb-8">
              {/* Echte, signal-getriebene Listen aus rawDeals. Leer → Komponente rendert nichts. */}
              <PipelineStagniertCard
                items={stagnatedItems}
                onSelectLead={(it) => setInfoPanelLead(makeLead(it.contactId ?? it.dealId, it.name, it.jobTitle, it.companyName, it.initials, it.icpScore ?? 75))}
                onTaskAnlegen={(it) => { setInfoPanelDealId(it.dealId); setInfoPanelAction('task'); setInfoPanelLead(makeLead(it.contactId ?? it.dealId, it.name, it.jobTitle, it.companyName, it.initials, it.icpScore ?? 75)); }}
              />
              <PipelineKeineTaskCard
                items={noTaskItems}
                onSelectLead={(it) => setInfoPanelLead(makeLead(it.contactId, it.name, it.jobTitle, it.companyName, it.initials, it.icpScore ?? 75))}
                onTaskAnlegen={(it) => { setInfoPanelDealId(null); setInfoPanelAction('task'); setInfoPanelLead(makeLead(it.contactId, it.name, it.jobTitle, it.companyName, it.initials, it.icpScore ?? 75)); }}
              />
            </div>
          ) : pipelineView === 'kanban' ? (
           <div className="flex flex-col gap-4">
            {/* KPI-Kacheln über dem Board — einheitliches Prinzip: Titel links + Icon-Box oben rechts
                (auf Überschrift-Höhe), Inhalt darunter. Wert-Kacheln fest; Heat-Verteilung inhaltsbreit
                (w-fit) → wächst mit jeder vorhandenen Phase bis Bildschirmbreite. Client-seitig aus openDeals. */}
            <div className="flex flex-wrap gap-4 w-full items-stretch">
              {/* Tile 1 — Pipeline-Gesamtwert */}
              <div className="flex-1 min-w-[180px] bg-app-surface rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Pipeline-Gesamtwert</span>
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] flex items-center justify-center shrink-0"><TrendingUp size={16} strokeWidth={2.5} /></div>
                </div>
                <div className="text-[24px] font-extrabold text-text-primary tracking-tight leading-none truncate">{fmtEur0(pipelineValueEur)}</div>
              </div>

              {/* Tile 2 — Gewichteter Wert (Hover-Popover: gewichteter Wert pro Stage) */}
              <div className="group relative flex-1 min-w-[180px] bg-app-surface rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Gewichteter Wert</span>
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] flex items-center justify-center shrink-0"><Percent size={16} strokeWidth={2.5} /></div>
                </div>
                <div className="text-[24px] font-extrabold text-text-primary tracking-tight leading-none truncate">{fmtEur0(weightedValueEur)}</div>

                {/* Hover-Popover: gewichteter Wert je Stage (nur Stages mit aktiven Deals) */}
                {weightedByStage.length > 0 && (
                  <div className="absolute left-0 top-full mt-2 z-30 w-[280px] max-w-[90vw] bg-app-surface border border-border rounded-[12px] shadow-[var(--shadow-dropdown)] p-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
                    <div className="px-2 py-1.5 text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Gewichtet pro Stage</div>
                    <div className="flex flex-col">
                      {weightedByStage.map((s) => (
                        <div key={s.slug} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-[8px] hover:bg-app-bg transition-colors">
                          <span className="flex items-center gap-2 min-w-0">
                            <StageBadge stage={s.name} />
                            <span className="text-[10px] font-bold text-text-muted shrink-0">{s.probability}%</span>
                          </span>
                          <span className="text-[13px] font-bold text-text-primary shrink-0">{fmtEur0(s.weighted)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tile 3 — Heat-Verteilung: Baseline gleich groß wie die Wert-Kacheln (flex-1), wächst aber
                  mit den Phasen (min-w-fit, Chips ohne Umbruch) → die Wert-Kacheln links schrumpfen. */}
              <div className="flex-1 min-w-fit max-w-full bg-app-surface rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-6">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Heat-Verteilung</span>
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] flex items-center justify-center shrink-0"><Flame size={16} strokeWidth={2.5} /></div>
                </div>
                {openDealCount === 0 ? (
                  <span className="text-[12px] text-text-muted">Keine aktiven Deals</span>
                ) : (
                  <div className="flex items-center gap-2">
                    {HEAT_ORDER.filter((h) => (heatCounts[h] ?? 0) > 0).map((h) => (
                      <div key={h} className="flex items-center gap-2 bg-app-bg rounded-[10px] px-3 py-1.5 shrink-0">
                        <HeatBadge status={h} />
                        <span className="text-[16px] font-extrabold text-text-primary leading-none">{heatCounts[h]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 items-start min-h-[600px] w-full hide-scrollbar">
              {/* Slice B: Spalten aus settings.pipeline_stages (slug/name/order), echte Deals.
                  Stage-Pfeile/Stagnations-Pills/Action-Badges entfallen (Writes/fingierte
                  Signale → eigene Slices). */}
              {[...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((stage) => {
                const colDeals = baseFilteredDeals
                  .filter((d) => d.stageSlug === stage.slug)
                  .sort((a, b) => (b.icpScore ?? 0) - (a.icpScore ?? 0));
                const count = colDeals.length;
                const totalEur = colDeals.reduce((sum, d) => sum + (d.valueEur ?? 0), 0);
                const isExpanded = expandedCols[stage.slug] ?? true;

                return (
                  <div key={stage.slug} className="flex-1 min-w-[290px] w-[290px] max-w-[290px] flex flex-col h-fit transition-all duration-300 relative bg-[var(--border-subtle)] rounded-[12px] p-3">
                    {/* Spalten-Header (Stage-Name + Anzahl + Collapse) — ÜBER der Übersichts-Kachel, auf der grauen Lane */}
                    <div className="flex justify-between items-center mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-[var(--text-primary)]">{stage.name}</h3>
                        <div className="min-w-[24px] h-6 px-1.5 rounded-full border border-border text-text-muted text-[11px] font-semibold flex items-center justify-center bg-app-surface shadow-sm">
                          {count}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedCols(prev => ({ ...prev, [stage.slug]: !(prev[stage.slug] ?? true) }))}
                        className="w-7 h-7 rounded-full bg-app-surface hover:bg-app-surface flex items-center justify-center border border-transparent hover:border-border transition-colors z-10 cursor-pointer shadow-sm"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronLeft className="w-4 h-4 text-text-muted" />}
                      </button>
                    </div>

                    {/* Übersichts-Kachel — weiß wie die Deal-Kacheln: Zahl links / „Opportunities" darunter · Volumen rechts */}
                    <div className="bg-app-surface rounded-[12px] shadow-[var(--shadow-card)] px-4 py-3 mb-3 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[28px] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">{count}</span>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">{t('hunter.pipeline.opportunities')}</span>
                      </div>
                      <span className="text-[15px] font-bold text-[var(--text-primary)] shrink-0">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalEur)}
                      </span>
                    </div>

                    {/* Cards (nur wenn expanded) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-3">
                        {colDeals.length === 0 ? (
                          <div className="px-3 py-6 text-center text-[12px] text-text-muted">Keine Deals</div>
                        ) : colDeals.map((deal) => (
                          <div
                            key={deal.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { setInfoPanelTab('deals'); setInfoPanelLead(makeLead(deal.contactId ?? deal.id, deal.contactName, deal.contactJobTitle, deal.company, deal.initials, deal.icpScore ?? 75)); }}
                            className="bg-app-surface rounded-[12px] p-4 shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={deal.contactName} size={40} />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-[13px] text-[var(--text-primary)] leading-tight truncate">{deal.contactName}</span>
                                  <span className="text-[11px] text-[var(--sherloq-primary)] leading-tight truncate mt-0.5">{deal.company}</span>
                                  {deal.valueEur !== null && (
                                    <span className="text-[11px] font-bold text-[var(--text-primary)] mt-1">
                                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(deal.valueEur)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-[38px] flex items-center justify-center shrink-0">
                                {deal.icpScore != null && <ICPDonut score={deal.icpScore} />}
                              </div>
                            </div>
                            {/* Trennlinie zwischen Kopf und Aktionszeile (dezenter Bestands-Token). */}
                            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center gap-2">
                              <HeatBadge status={deal.heatStatus} />
                              {/* Aktionsgruppe Zurueck / Auge / Vor: Zurueck nur ab 2. Stage, Vor nur
                                  nicht-terminal, Auge oeffnet das Panel (Deals-Tab, wie Karten-Klick). Alle gleich gross/teal. */}
                              <div className="flex items-center gap-1 shrink-0">
                                {!isTerminalStage(deal.stageSlug) && stageOptions.findIndex((s) => s.slug === deal.stageSlug) > 0 && (
                                  <button
                                    type="button"
                                    aria-label="Eine Stage zurück"
                                    data-tip="Eine Stage zurück"
                                    disabled={updateStageMutation.isPending}
                                    onClick={(e) => { e.stopPropagation(); handleRetreatStage(deal.stageSlug, deal.id); }}
                                    className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:hover:scale-100"
                                  >
                                    <ArrowLeft className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  aria-label="Kontakt öffnen"
                                  data-tip="Kontakt öffnen"
                                  onClick={(e) => { e.stopPropagation(); setInfoPanelTab('deals'); setInfoPanelLead(makeLead(deal.contactId ?? deal.id, deal.contactName, deal.contactJobTitle, deal.company, deal.initials, deal.icpScore ?? 75)); }}
                                  className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!isTerminalStage(deal.stageSlug) && (
                                  <button
                                    type="button"
                                    aria-label="Eine Stage weiter"
                                    data-tip="Eine Stage weiter"
                                    disabled={updateStageMutation.isPending}
                                    onClick={(e) => { e.stopPropagation(); handleAdvanceStage(deal.stageSlug, deal.id); }}
                                    className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:hover:scale-100"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
           </div>
          ) : (
            <div className="flex flex-col gap-3 pb-8">
              {/* Deals-Tabelle (Count + Filter sitzen in der Filterleiste oben) */}
              <div className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
                <div className="grid grid-cols-[1.8fr_1.6fr_1.3fr_1.1fr_0.9fr_1.1fr_auto] gap-4 px-4 py-2.5 bg-app-bg border-b border-border text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                  <span>Kontakt</span>
                  <span>Firma</span>
                  <span>Stage</span>
                  <span>Deal Owner</span>
                  <span>Wert</span>
                  <span>Heat</span>
                  <span className="w-8" />
                </div>
                {dealsLoading ? (
                  <div className="px-4 py-10 text-center text-[13px] text-text-muted">Lädt …</div>
                ) : dealsError ? (
                  <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">Deals konnten nicht geladen werden.</div>
                ) : listDealRows.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[13px] text-text-muted">Keine Deals für diese Filter.</div>
                ) : listDealRows.map((deal) => (
                  <div key={deal.id} className="grid grid-cols-[1.8fr_1.6fr_1.3fr_1.1fr_0.9fr_1.1fr_auto] gap-4 px-4 py-3 items-center border-b border-border-subtle last:border-0 hover:bg-app-bg transition-colors">
                    {/* KONTAKT: Avatar · Name (flex-1 → schiebt den ICP-Ring ans rechte Ende = bündig untereinander) · ICP-Ring. */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={deal.contactName} size={32} />
                      <span className="flex-1 min-w-0 text-[13px] font-bold text-text-primary truncate">{deal.contactName}</span>
                      {deal.icpScore != null && <ICPDonut score={deal.icpScore} size={26} />}
                    </div>
                    {/* FIRMA: eigene Spalte — Company-Avatar (abgerundetes Quadrat) + Name (teal). Echt aus contactToProfile. */}
                    <div className="flex items-center gap-2 min-w-0">
                      {deal.company ? (
                        <>
                          <Avatar name={deal.company} size={32} radius={9} />
                          <span className="text-[13px] font-semibold text-[var(--sherloq-primary)] truncate">{deal.company}</span>
                        </>
                      ) : (
                        <span className="text-[12px] text-text-muted">—</span>
                      )}
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      {/* P8-2d: Stage-Badge klickbar → Inline-Dropdown → Stage wechseln (echter Write).
                          Dekorativer StageBadge bleibt read-only; nur der Wrapper trägt onClick. */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={updateStageMutation.isPending && updateStageMutation.variables?.dealId === deal.id}>
                          <button type="button" aria-label="Stage ändern" data-tip="Stage ändern" className="cursor-pointer disabled:opacity-50 disabled:cursor-default rounded-full">
                            <StageBadge stage={deal.stageLabel} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {stageOptions.map((s) => (
                            <DropdownMenuItem key={s.slug} disabled={s.slug === deal.stageSlug} onSelect={() => handleStageChange(s.slug, deal.id)}>
                              {s.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {(() => { const f = stagnationFlag(deal.stageSlug, deal.stagnationDays, stagnationBySlug); return f != null ? <StagnationHint days={f} /> : null; })()}
                    </div>
                    <span className="text-[12px] text-text-body font-medium truncate">{deal.ownerLabel}</span>
                    <span className="text-[12px] font-bold text-text-primary">
                      {deal.valueEur !== null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(deal.valueEur) : '—'}
                    </span>
                    <div className="min-w-0">
                      <HeatBadge status={deal.heatStatus} />
                    </div>
                    <button
                      onClick={() => setInfoPanelLead(makeLead(deal.contactId ?? deal.id, deal.contactName, deal.contactJobTitle, deal.company, deal.initials, 75))}
                      className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIGNALS TAB */}
      {subTab === 'signals' && (
        <div className="flex flex-col gap-4">

          {/* Bulk-Aktionsleiste — gleiche Leiste wie bei Leads */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedSignalIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={selectedSignalIds.length === signalIds.length ? deselectAllSignals : selectAllSignals}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {t('hunter.signals.selected', { count: selectedSignalIds.length, noun: selectedSignalIds.length === 1 ? t('hunter.signals.signalSingular') : t('hunter.signals.signalPlural') })}
              </span>
              <button onClick={deselectAllSignals} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">{t('hunter.signals.deselect')}</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" /> {t('hunter.signals.ignore')}
              </button>
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Clock className="w-3.5 h-3.5" /> {t('hunter.signals.snooze')}
              </button>
              <button className="bg-app-surface border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {signalsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[88px] rounded-[12px] bg-app-surface border border-[var(--border-card)] animate-pulse" />
              ))}
            </div>
          ) : signalsError ? (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">Signale konnten nicht geladen werden.</div>
          ) : signalCards.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-6 h-6" />}
              title="Keine Signale heute"
              description="Neue Signale erscheinen hier automatisch"
            />
          ) : (
            signalCards.map(({ id, ...cardProps }, i) => (
              <LinkedinSignalCard
                key={id}
                {...cardProps}
                showUrgency={false}
                showStage={true}
                selected={selectedSignalIds.includes(id)}
                onToggleSelect={(e) => toggleSignalSelection(id, e)}
                onOpenInfo={setInfoPanelLead}
                // Opener → SignalActionDrawer mit echten Daten (AI-Felder als Platzhalter, [D5]).
                onOpenAction={() => { const raw = (signalsData ?? [])[i]; if (raw) setSelectedSignal(signalToActionData(raw, t)); }}
              />
            ))
          )}
        </div>
      )}

      {/* SDR Lead anlegen — Action-Side-Panel (features/hunter/AddSdrLeadPanel) */}
      <AddSdrLeadPanel open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={onAddLead} />

      {taskLead && (
        <TaskDrawer 
          person={{
            person: {
              name: taskLead.name,
              company: taskLead.company,
              initials: taskLead.initials,
              jobTitle: 'VP of Growth'
            },
            icpScore: 92
          }}
          recommendedTitle={taskTitle}
          recommendedNote={taskNote}
          onClose={() => setTaskLead(null)}
          onSave={() => setTaskLead(null)}
        />
      )}


      <SignalActionDrawer
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />

      <ContactColdDrawer
        person={selectedColdPerson}
        onClose={() => setSelectedColdPerson(null)}
      />

      {/* Info Panel (§22.1, 820px) — Slide-in-Overlay, vorerst nur Leads-Tab.
          Immer gemountet für die Ausfahr-Animation; person=null → geschlossen. */}
      <HunterSidepanel
        person={infoPanelLead?.person ?? null}
        initialAction={infoPanelAction}
        initialTab={infoPanelTab}
        initialDealId={infoPanelDealId}
        initialDealEditId={infoPanelDealEditId}
        onClose={() => { setInfoPanelLead(null); setInfoPanelAction(null); setInfoPanelTab(null); setInfoPanelDealId(null); setInfoPanelDealEditId(null); }}
      />

      {/* P8-3c: Close-Deal-Popup (letzter Kanban-Pfeil) → Gewonnen (direkt + Konfetti) / Verloren (Lost-Modal). */}
      <DealCloseModal
        open={closeDealModal.open}
        onWon={() => { const id = closeDealModal.dealId; setCloseDealModal({ open: false, dealId: null }); if (id) startWonFlow(id); }}
        onLost={() => { const id = closeDealModal.dealId; setCloseDealModal({ open: false, dealId: null }); setLostModal({ open: true, dealId: id }); }}
        onCancel={() => setCloseDealModal({ open: false, dealId: null })}
      />

      {/* P8-3: Lost-Dialog bei „verloren" (blockierend, Grund Pflicht + optionale Notiz → lost_note). */}
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
        onSave={(reason, note) => { const id = wonModal.dealId; setWonModal({ open: false, dealId: null }); if (id) wonMutation.mutate({ dealId: id, wonReason: reason, wonNote: note }, { onSuccess: () => toast('Gespeichert ✓') }); }}
        onSkip={() => setWonModal({ open: false, dealId: null })}
      />

    </div>
  );
}
