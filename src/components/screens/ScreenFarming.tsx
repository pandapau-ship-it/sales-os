/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Sparkles, Check, X, Clock, Trash, Zap, CheckSquare, ListChecks } from 'lucide-react';
import type { Customer, Lead } from '@/types';
import { FarmerKpiCards, FarmerHealthOverview, FarmerKundenKachel, FarmerRetentionKachel, FarmerUpsellKachel, FarmerExpandedCardContent, SubscriptionBadge, LinkedinSignalCard, EmptyState, SequenceLeadCards, FollowUpKaltCard, FarmerSidepanel, FarmerActionDrawer, SignalActionDrawer, type RetentionItem, type UpsellItem, type FarmerActionData, type FarmerTab } from '@/components';
import type { DueTaskCardItem, SignalActionData, SignalCardProps } from '@/lib/hunterMappers';
import { AI_PENDING_LABEL, calculateFarmerPriority, FARMER_SIGNAL_ORDER } from '@/lib/hunterMappers';
import { useToast } from '@/components/shared/toastContext';
import { useNowMs } from '@/hooks/useNowMs';
import { NAV } from '@/lib/navBehavior';

/**
 * Retention-Tab Mock-Kacheln — RISIKO-Übersicht: Churn Risk · Gekündigt. Bis Score-/Signal-
 * Anbindung. HEAT über kanonischen Enum (HeatBadge = Single Source): churn_risk→Cooling (LUKEWARM),
 * cancelled→Warm (WARM). Alte Heat-Label-Wörter sind im Code audit-verboten → nur der Enum.
 * „Kunde wird kalt" (going_cold) gehört bewusst NICHT hierher, sondern in den Follow-ups-Tab
 * (= Aktion, nicht Risiko) — siehe [D46] / CLAUDE.md „Farmer Follow-ups".
 */
// Churn-Treiber (score_drivers.signal) → lesbares Label. Banner-Text wird aus den ECHTEN Treibern
// gebaut (Honesty: keine erfundenen Zahlen). Unbekanntes Signal → roher Key (kein Fake).
const DRIVER_LABEL: Record<string, string> = {
  last_contact: 'lange kein Kontakt',
  no_reply: 'keine Antwort auf letzte Mail',
  overdue_tasks: 'überfällige Tasks',
  inactive_days: 'längere Inaktivität',
  heat_cold: 'Kontakt kalt',
};
function retentionText(type: 'churn_risk' | 'cancelled', drivers?: { signal: string }[]): string {
  if (type === 'cancelled') return 'Kündigung aktiv — persönlicher Anruf empfohlen.';
  const names = (drivers ?? []).map((d) => DRIVER_LABEL[d.signal] ?? d.signal);
  return names.length
    ? `Churn-Risiko: ${names.join(' · ')}.`
    : 'Churn-Score über Schwelle — Check-in empfohlen.'; // Honesty-Fallback (keine Treiber)
}

// Upsell-Treiber (upsell_drivers.signal) → lesbares Label. Banner aus ECHTEN Treibern (Honesty).
const UPSELL_DRIVER_LABEL: Record<string, string> = {
  reply_rate: 'hohe Antwortrate',
  recent_contact: 'kürzlich kontaktiert',
  heat_hot: 'Kontakt warm/heiß',
  active_deal: 'aktiver Deal',
};
function upsellText(drivers?: { signal: string }[]): string {
  const names = (drivers ?? []).map((d) => UPSELL_DRIVER_LABEL[d.signal] ?? d.signal);
  return names.length
    ? `Upsell-Chance: ${names.join(' · ')}.`
    : 'Upsell-Score über Schwelle — Wachstumschance.'; // Honesty-Fallback (keine Treiber)
}


interface ScreenFarmingProps {
  customers: Customer[];
  onUpgradeSubscription: (id: string, newPlan: 'Growth' | 'Enterprise') => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
  /** Churn-Schwelle aus settings.thresholds.churn_risk_threshold (Fallback 61). */
  churnThreshold?: number;
  /** Upsell-Schwelle aus settings.thresholds.upsell_threshold (Fallback 70). */
  upsellThreshold?: number;
  /** [D51] Churn-Vorrang-Schalter aus settings.thresholds.churn_suppresses_upsell (Default true). */
  churnSuppressesUpsell?: boolean;
  /** Fällige Tasks bei Bestandskunden (getDueTasks contactStatus='kunde' → taskToDueCard). */
  dueTasks?: DueTaskCardItem[];
  /** Farmer-geroutete Signale (getSignals routedTo='farmer' → signalToCardProps). */
  signalCards?: SignalCardProps[];
}

export default function ScreenFarming({
  customers,
  onUpgradeSubscription: _onUpgradeSubscription,
  churnThreshold = 61,
  upsellThreshold = 70,
  churnSuppressesUpsell = true,
  dueTasks = [],
  signalCards = [],
}: ScreenFarmingProps) {
  const [subTab, setSubTab] = useState<'overview' | 'kunden' | 'churn' | 'upsell' | 'signals' | 'follow_ups'>('overview');
  const { toast } = useToast();

  // [D46] Follow-ups: FarmerSidepanel-Deeplink (onView → Tasks-Tab + Highlight) + Action-Panel „Kunde wird kalt".
  // FarmerSidepanel hier eigenständig gerendert (D33-Vollverdrahtung der übrigen Tabs folgt separat).
  const [infoPerson, setInfoPerson] = useState<Customer | Lead | null>(null);
  const [infoTab, setInfoTab] = useState<FarmerTab | null>(null);
  const [infoTaskId, setInfoTaskId] = useState<string | null>(null);
  const [infoHighlightSection, setInfoHighlightSection] = useState<string | null>(null); // Sektions-Deeplink (Tab-Block leuchtet auf)
  const [actionSignal, setActionSignal] = useState<FarmerActionData | null>(null);
  const [selectedFarmerSignal, setSelectedFarmerSignal] = useState<SignalActionData | null>(null); // #7 LinkedIn-Signal-Antwort (reuse SignalActionDrawer)

  // Panel im Übersicht-Modus öffnen (Kunden/Retention/Upsell/Signals) — nicht im Tasks-Deeplink.
  const openInfo = (p: Customer | Lead) => { setInfoTab(null); setInfoTaskId(null); setInfoHighlightSection(null); setInfoPerson(p); };
  // Deeplink aus der aufgeklappten Kachel: FarmerSidepanel direkt auf dem passenden Tab öffnen,
  // optional mit Sektions-ID → der Ziel-Block dort leuchtet kurz auf (Deeplink-Highlight).
  const openOnTab = (p: Customer | Lead, tab: FarmerTab, section?: string) => { setInfoTaskId(null); setInfoTab(tab); setInfoHighlightSection(section ?? null); setInfoPerson(p); };

  const nowMs = useNowMs();
  // Echte Quelle: fällige Tasks (dueTasks-Prop) + kalte Kunden (heat COLD) — letzte Mock-Insel entfernt.
  // ICP/Name/Firma überall aus contactToProfile (taskToDueCard bzw. customerRowToView) → Ring konsistent.
  const coldCustomers = customers.filter((c) => c.heatStatus === 'COLD');
  const customerById = (id: string): Customer | undefined => customers.find((c) => c.id === id);

  // Ignorierte Signale (lokaler State, kein Backend) → aus der Liste gefiltert. Kachel verschwindet sofort.
  const [ignoredSignalIds, setIgnoredSignalIds] = useState<string[]>([]);
  const ignoreSignals = (ids: string[]) => setIgnoredSignalIds((prev) => [...new Set([...prev, ...ids])]);

  // Signals: echte farmer-geroutete Signale (signalToCardProps in FarmerReference). Customer-Bezug via
  // contactId (Single Source) für SUBSCRIPTION/Panel/Expand. Ignorierte (lokaler State [D48]) rausfiltern.
  const signalRows = signalCards
    .filter((card) => !ignoredSignalIds.includes(card.id))
    .map((card) => ({ card, customer: card.contactId ? customerById(card.contactId) : undefined }));

  // Übersicht Top-5 — priorisierte Empfehlungen über Bestandskunden (PROGRESS [D47] „Farmer Top-5").
  // ADDITIV/Honesty: churn/upsell_score NULL → diese Signale heute inaktiv; cancelled/going_cold/
  // overdue_task laufen sofort. Sortierung: Dominanz (Geld-Logik) → MRR → Score. Score nie als Badge.
  const overdueContactIds = new Set(
    dueTasks
      .filter((tk) => tk.dueAt && new Date(tk.dueAt).getTime() < nowMs)
      .map((tk) => tk.contactId)
      .filter((id): id is string => !!id),
  );
  const farmerTop5 = customers
    .map((c) => ({ customer: c, prio: calculateFarmerPriority(c, { churn_threshold: churnThreshold, upsell_threshold: upsellThreshold }, { hasOverdueTask: overdueContactIds.has(c.id), churnSuppressesUpsell }) }))
    .filter((x) => x.prio.dominantSignal !== null)
    .sort((a, b) => {
      const ra = FARMER_SIGNAL_ORDER.indexOf(a.prio.dominantSignal!);
      const rb = FARMER_SIGNAL_ORDER.indexOf(b.prio.dominantSignal!);
      if (ra !== rb) return ra - rb;                       // 1. Dominanz (Geld-Logik)
      if (b.prio.mrr !== a.prio.mrr) return b.prio.mrr - a.prio.mrr; // 2. MRR-Höhe
      return b.prio.score - a.prio.score;                  // 3. Score
    })
    .slice(0, 5);

  // Auswahl + Bulk-Leiste (gleiche Mechanik wie Hunter Signals). IDs = signal.id.
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const signalIds = signalRows.map((r) => r.card.id);
  const toggleSignalSelection = (id: string) =>
    setSelectedSignalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAllSignals = () => setSelectedSignalIds(signalIds);
  const deselectAllSignals = () => setSelectedSignalIds([]);

  // Retention-Liste — echte Kunden mit Churn-Risk (churnScore ≥ Schwelle aus settings) ODER gekündigt.
  // „Kunde wird kalt" (going_cold) gehört NICHT hierher → Follow-ups-Tab ([D46]). Sortierung:
  // cancelled zuerst, dann churn_risk nach Score absteigend.
  const retentionRows = customers
    .filter((c) => c.sherloqStatus === 'CANCELLED' || (typeof c.churnScore === 'number' && c.churnScore >= churnThreshold))
    .map((c) => ({ c, type: (c.sherloqStatus === 'CANCELLED' ? 'cancelled' : 'churn_risk') as 'cancelled' | 'churn_risk' }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'cancelled' ? -1 : 1;
      return (b.c.churnScore ?? 0) - (a.c.churnScore ?? 0);
    });

  // Upsell-Liste — Kunden mit upsellScore ≥ Schwelle, ABER mit Churn-Vorrang: bei aktivem Churn Risk
  // oder Gekündigt wird Upsell unterdrückt (Retention vor Expansion). Single Source = derselbe Resolver
  // wie Panel/Top-5 (`calculateFarmerPriority.displaySignals` → `applyFarmerDisplayPrecedence`), keine
  // duplizierte Vorrang-Logik. So erscheint ein churn-aktiver Kunde NICHT zusätzlich im Upsell-Tab.
  const upsellRows = customers
    .filter((c) => calculateFarmerPriority(c, { churn_threshold: churnThreshold, upsell_threshold: upsellThreshold }, { churnSuppressesUpsell }).displaySignals.includes('upsell'))
    .sort((a, b) => (b.upsellScore ?? 0) - (a.upsellScore ?? 0));

  // Badge-Counts: Kunden + Retention + Upsell echt; Signals Mock bis zur Signal-Anbindung.
  const churnCount = retentionRows.length;
  const menuItems: { id: string; label: string; icon?: React.ReactNode; count?: string | number }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'kunden', label: 'Kunden', count: customers.length },
    { id: 'churn', label: 'Retention', icon: <AlertTriangle className="w-3.5 h-3.5" />, count: churnCount },
    { id: 'upsell', label: 'Upsell', icon: <TrendingUp className="w-3.5 h-3.5" />, count: upsellRows.length },
    { id: 'signals', label: 'Signals', icon: <Sparkles className="w-3.5 h-3.5" />, count: signalRows.length },
    { id: 'follow_ups', label: 'Follow-ups', icon: <CheckSquare className="w-3.5 h-3.5" />, count: dueTasks.length + coldCustomers.length },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Farming (Kundenpflege & Expansion)</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Optimiere Kunden-Nutzung, identifiziere Churn Risk und vermehre MRR.</p>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className={`${NAV.container} ${NAV.surface} ${NAV.subRadius}`}>
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as Parameters<typeof setSubTab>[0])}
              style={isActive ? { background: NAV.activeBg } : undefined}
              className={`${NAV.subTab} ${NAV.subTabRadius} ${isActive ? NAV.active : NAV.inactive}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? NAV.badgeActive : NAV.badgeInactive}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. VIEW OVERVIEW — KPIs + Customer Health Overview (ausgelagert nach farming/) */}
      {subTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <FarmerKpiCards customers={customers} />
          {/* Echte Kunden; health_score noch NULL (Slice 2 Score-Funktionen) → Honesty: Balken/Score ausgeblendet. */}
          <FarmerHealthOverview
            rows={customers.map((c) => ({ id: c.id, initials: c.person.initials, name: c.person.company || c.person.name, score: c.healthScore }))}
            onShowAll={() => setSubTab('kunden')}
          />

          {/* Wichtigste Aufgaben — Top-5 priorisiert über Bestandskunden (Geld-Logik [D47]). Jede Quelle
              nutzt ihre bestehende Kachel 1:1. Signal-getrieben: nichts da → Platzhalter. Score nie als Badge. */}
          <div className="mt-2">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Wichtigste Aufgaben</span>
            <div className="mt-3">
              {farmerTop5.length === 0 ? (
                <EmptyState
                  icon={<ListChecks className="w-6 h-6" />}
                  title="Alles im grünen Bereich"
                  description="Keine dringenden Kunden-Signale heute."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {farmerTop5.map(({ customer: c, prio }) => {
                    const sig = prio.dominantSignal;
                    const expanded = <FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />;
                    if (sig === 'cancelled' || sig === 'churn_risk') {
                      const item: RetentionItem = {
                        id: c.id, name: c.person.name, jobTitle: c.person.jobTitle, company: c.person.company,
                        avatarUrl: c.person.avatarUrl, icpScore: c.icpScore, heatStatus: c.heatStatus,
                        sherloqStatus: c.sherloqStatus, timeLabel: c.lastContactedAt, type: sig,
                        text: retentionText(sig, c.scoreDrivers), // Single Source (identisch zum Retention-Tab)
                      };
                      return (
                        <FarmerRetentionKachel
                          key={`r-${c.id}`}
                          item={item}
                          onOpenPanel={() => openInfo(c)}
                          onAction={() => setActionSignal({ kind: sig, name: c.person.name, company: c.person.company, icpScore: c.icpScore })}
                          expandedSlot={expanded}
                        />
                      );
                    }
                    if (sig === 'going_cold') {
                      return (
                        <FollowUpKaltCard
                          key={`c-${c.id}`}
                          contactId={c.id}
                          name={c.person.name}
                          role={c.person.jobTitle}
                          companyName={c.person.company}
                          icpScore={c.icpScore}
                          heatStatus={c.heatStatus}
                          timeAgoLabel={c.lastContactedAt}
                          onSelectLead={() => openInfo(c)}
                          onOutreachClick={() => setActionSignal({ kind: 'going_cold', name: c.person.name, company: c.person.company })}
                          statusBadge={{ label: 'SUBSCRIPTION', node: <SubscriptionBadge status={c.sherloqStatus} /> }}
                          expandedSlot={expanded}
                        />
                      );
                    }
                    if (sig === 'upsell') {
                      const item: UpsellItem = {
                        id: c.id, name: c.person.name, jobTitle: c.person.jobTitle, company: c.person.company,
                        avatarUrl: c.person.avatarUrl, icpScore: c.icpScore, heatStatus: c.heatStatus,
                        sherloqStatus: c.sherloqStatus, timeLabel: c.lastContactedAt,
                        text: 'Upsell-Score über Schwelle — Wachstumschance.',
                      };
                      return (
                        <FarmerUpsellKachel
                          key={`u-${c.id}`}
                          item={item}
                          onOpenPanel={() => openInfo(c)}
                          onAction={() => setActionSignal({ kind: 'upsell_potential', name: c.person.name, company: c.person.company, icpScore: c.icpScore })}
                          expandedSlot={expanded}
                        />
                      );
                    }
                    // overdue_task — fällige Task(s) dieses Kunden (1:1 SequenceLeadCards)
                    return (
                      <SequenceLeadCards
                        key={`t-${c.id}`}
                        items={dueTasks.filter((tk) => tk.contactId === c.id)}
                        onSelectLead={() => openInfo(c)}
                        onView={(_lead, taskId) => { setInfoTab('tasks'); setInfoTaskId(taskId); setInfoPerson(c); }}
                        onComplete={() => toast('Task erledigt ✓', 'success')}
                        renderExpanded={() => expanded}
                        // Farmer-Invariante: SUBSCRIPTION statt Pipeline-Stage. c ist hier direkt verfügbar → kein Lookup.
                        renderStatusBadge={() => ({ label: 'SUBSCRIPTION', node: <SubscriptionBadge status={c.sherloqStatus} /> })}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW KUNDEN (LIST) — Hunter-Kachel-Muster (FarmerKundenKachel = Wrapper um HunterCard) */}
      {subTab === 'kunden' && (
        <div className="flex flex-col gap-3">
          {customers.map((customer) => (
            <FarmerKundenKachel
              key={customer.id}
              contact={customer}
              onOpenPanel={() => openInfo(customer)}
              expandedSlot={<FarmerExpandedCardContent customer={customer} onOpenPanel={(tab, section) => openOnTab(customer, tab as FarmerTab, section)} />}
            />
          ))}
        </div>
      )}

      {/* 3. VIEW RETENTION — echte Kunden: Churn Risk (churnScore ≥ Schwelle) + Gekündigt.
          „Kunde wird kalt" (going_cold) liegt im Follow-ups-Tab ([D46]), NICHT hier. Leer → EmptyState. */}
      {subTab === 'churn' && (
        <div className="flex flex-col gap-3">
          {retentionRows.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Keine Retention-Fälle"
              description="Kein Kunde über der Churn-Schwelle, keine Kündigung — gut so."
            />
          ) : (
            retentionRows.map(({ c, type }) => {
              const item: RetentionItem = {
                id: c.id, name: c.person.name, jobTitle: c.person.jobTitle, company: c.person.company,
                avatarUrl: c.person.avatarUrl, icpScore: c.icpScore, heatStatus: c.heatStatus,
                sherloqStatus: c.sherloqStatus, timeLabel: c.lastContactedAt, type,
                text: retentionText(type, c.scoreDrivers),
              };
              return (
                <FarmerRetentionKachel
                  key={c.id}
                  item={item}
                  onOpenPanel={() => openInfo(c)}
                  onAction={() => setActionSignal({ kind: type, name: c.person.name, company: c.person.company, icpScore: c.icpScore })}
                  expandedSlot={<FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />}
                />
              );
            })
          )}
        </div>
      )}

      {/* 4. VIEW UPSELL — echte Kunden: upsellScore ≥ Schwelle (settings). Leer → EmptyState. */}
      {subTab === 'upsell' && (
        <div className="flex flex-col gap-3">
          {upsellRows.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-6 h-6" />}
              title="Kein Upsell-Potenzial"
              description="Kein Kunde über der Upsell-Schwelle — erscheint automatisch, sobald die Scores steigen."
            />
          ) : (
            upsellRows.map((c) => {
              const item: UpsellItem = {
                id: c.id, name: c.person.name, jobTitle: c.person.jobTitle, company: c.person.company,
                avatarUrl: c.person.avatarUrl, icpScore: c.icpScore, heatStatus: c.heatStatus,
                sherloqStatus: c.sherloqStatus, timeLabel: c.lastContactedAt,
                text: upsellText(c.upsellDrivers),
              };
              return (
                <FarmerUpsellKachel
                  key={c.id}
                  item={item}
                  onOpenPanel={() => openInfo(c)}
                  onAction={() => setActionSignal({ kind: 'upsell_potential', name: c.person.name, company: c.person.company, icpScore: c.icpScore })}
                  expandedSlot={<FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />}
                />
              );
            })
          )}
        </div>
      )}

      {/* 5. VIEW SIGNALS — echte farmer-geroutete Signale (getSignals routedTo='farmer' → signalToCardProps).
          1:1 Hunter-Signals-Muster (LinkedinSignalCard). SUBSCRIPTION statt STAGE (Farmer-Invariante).
          Felder via contactToProfile (Single Source). Snooze/Ignorieren nur lokal ([D48]). */}
      {subTab === 'signals' && (
        <div className="flex flex-col gap-4">

          {/* Bulk-Aktionsleiste — gleiche Leiste wie Hunter Signals */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedSignalIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={selectedSignalIds.length === signalIds.length ? deselectAllSignals : selectAllSignals}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {selectedSignalIds.length} {selectedSignalIds.length === 1 ? 'Signal' : 'Signale'} ausgewählt
              </span>
              <button onClick={deselectAllSignals} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">Auswahl aufheben</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { ignoreSignals(selectedSignalIds); deselectAllSignals(); }} className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" /> Ignorieren
              </button>
              <button onClick={() => toast('Bulk-Aktionen folgen mit dem Action-Panel ([D34])', 'info')} className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Clock className="w-3.5 h-3.5" /> Snoozen
              </button>
              <button onClick={() => toast('Bulk-Aktionen folgen mit dem Action-Panel ([D34])', 'info')} className="bg-app-surface border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {signalRows.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-6 h-6" />}
              title="Keine Signale heute"
              description="Neue Kunden-Signale (LinkedIn-Aktivität) erscheinen hier automatisch"
            />
          ) : (
            signalRows.map(({ card, customer }) => (
              <LinkedinSignalCard
                key={card.id}
                contactId={card.contactId}
                name={card.name}
                role={card.role}
                companyName={card.companyName}
                icpScore={card.icpScore}
                heatStatus={card.heatStatus}
                timeAgoLabel={card.timeAgo}
                channelLabelKey={card.channelLabelKey}
                channelIcon={card.channelIcon}
                showUrgency={false}
                actionText={card.actionText}
                statusBadge={customer ? { label: 'SUBSCRIPTION', node: <SubscriptionBadge status={customer.sherloqStatus} /> } : undefined}
                selected={selectedSignalIds.includes(card.id)}
                onToggleSelect={() => toggleSignalSelection(card.id)}
                onIgnore={() => ignoreSignals([card.id])}
                onOpenInfo={customer ? () => openInfo(customer) : undefined}
                expandedSlot={customer ? <FarmerExpandedCardContent customer={customer} onOpenPanel={(tab, section) => openOnTab(customer, tab as FarmerTab, section)} /> : undefined}
                onOpenAction={() => setSelectedFarmerSignal({
                  name: card.name,
                  company: card.companyName,
                  icpScore: card.icpScore,
                  actionText: card.actionText,
                  timeAgoLabel: (card.timeAgo ?? '').replace(/^vor\s+/, ''),
                  aiRecommendation: AI_PENDING_LABEL, // KI-Felder NULL → „Folgt" [D5]
                  confidence: null,
                  draft: null,
                })}
              />
            ))
          )}
        </div>
      )}

      {/* 6. VIEW FOLLOW-UPS ([D46]) — operative Tagesarbeit: fällige Tasks + „Kunde wird kalt".
          Bewusste Trennung zu Retention (= Risiko-Übersicht). Kein „Stagniert" (kein Deal/Stage im Farmer).
          Komponenten 1:1 wie Hunter (SequenceLeadCards · FollowUpKaltCard). „Ansehen" → Deeplink-Highlight. */}
      {subTab === 'follow_ups' && (
        <div className="flex flex-col gap-4">
          {dueTasks.length === 0 && coldCustomers.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-6 h-6" />}
              title="Nichts zu tun"
              description="Keine fälligen Tasks und kein Kunde wird kalt — alles erledigt."
            />
          ) : (
            <>
              {/* Fällige Tasks bei Bestandskunden — echt (getDueTasks, contactStatus='kunde').
                  „Ansehen" öffnet FarmerSidepanel Tasks-Tab + Highlight; Panel zeigt den echten Kunden. */}
              {dueTasks.length > 0 && (
                <SequenceLeadCards
                  items={dueTasks}
                  onSelectLead={(lead) => { setInfoTab(null); setInfoTaskId(null); setInfoPerson(customerById(lead.person.id) ?? ({ ...lead, sherloqStatus: 'ACTIVE' } as Customer)); }}
                  onView={(lead, taskId) => { setInfoTab('tasks'); setInfoTaskId(taskId); setInfoPerson(customerById(lead.person.id) ?? ({ ...lead, sherloqStatus: 'ACTIVE' } as Customer)); }}
                  onComplete={() => toast('Task erledigt ✓', 'success')}
                  renderExpanded={(lead) => {
                    const c = customerById(lead.person.id) ?? ({ ...lead, sherloqStatus: 'ACTIVE' } as Customer);
                    return <FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />;
                  }}
                  renderStatusBadge={(it) => {
                    // Farmer-Invariante: SUBSCRIPTION statt Pipeline-Stage (Single Source: companies.subscription_status via customerRowToView).
                    const c = it.contactId ? customerById(it.contactId) : undefined;
                    return c ? { label: 'SUBSCRIPTION', node: <SubscriptionBadge status={c.sherloqStatus} /> } : undefined;
                  }}
                />
              )}

              {/* „Kunde wird kalt" — echte Kunden mit heat='kalt' (COLD). Gehört zu Follow-ups (Aktion),
                  NICHT zu Retention (Risiko). CTA → FarmerActionDrawer (going_cold). ICP aus customerRowToView. */}
              {coldCustomers.map((c) => (
                <FollowUpKaltCard
                  key={c.id}
                  contactId={c.id}
                  name={c.person.name}
                  role={c.person.jobTitle}
                  companyName={c.person.company}
                  icpScore={c.icpScore}
                  heatStatus={c.heatStatus}
                  timeAgoLabel={c.lastContactedAt}
                  onSelectLead={() => openInfo(c)}
                  onOutreachClick={() => setActionSignal({ kind: 'going_cold', name: c.person.name, company: c.person.company })}
                  statusBadge={{ label: 'SUBSCRIPTION', node: <SubscriptionBadge status={c.sherloqStatus} /> }}
                  expandedSlot={<FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* [D46] FarmerSidepanel für Follow-ups-„Ansehen" (Deeplink: Tasks-Tab + Highlight). */}
      <FarmerSidepanel
        person={infoPerson}
        initialTab={infoTab}
        initialTaskId={infoTaskId}
        initialHighlightSection={infoHighlightSection}
        onClose={() => { setInfoPerson(null); setInfoTab(null); setInfoTaskId(null); setInfoHighlightSection(null); }}
      />

      {/* [D46] „Kunde wird kalt" → Action-Panel (going_cold). */}
      <FarmerActionDrawer
        signal={actionSignal}
        onClose={() => setActionSignal(null)}
        onCreateTask={() => { setActionSignal(null); toast('Task erstellt ✓', 'success'); }}
        onWinbackCall={() => toast('Anruf protokolliert ✓', 'success')}
        onSnooze={() => toast('Auf später verschoben', 'info')}
      />

      {/* #7 LinkedIn-Signal-Antwort — SignalActionDrawer 1:1 von Hunter (generisch, kein neuer Resolver). */}
      <SignalActionDrawer
        signal={selectedFarmerSignal}
        onClose={() => setSelectedFarmerSignal(null)}
      />

    </div>
  );
}
