/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Sparkles, Check, X, Clock, Trash, Zap, CheckSquare } from 'lucide-react';
import type { Customer, Lead } from '@/types';
import { FarmerKpiCards, FarmerHealthOverview, FarmerKundenKachel, FarmerRetentionKachel, FarmerUpsellKachel, FarmerExpandedCardContent, SubscriptionBadge, LinkedinSignalCard, EmptyState, SequenceLeadCards, FollowUpKaltCard, FarmerSidepanel, FarmerActionDrawer, SignalActionDrawer, type RetentionItem, type UpsellItem, type FarmerActionData, type FarmerTab } from '@/components';
import type { DueTaskCardItem, SignalActionData } from '@/lib/hunterMappers';
import { AI_PENDING_LABEL } from '@/lib/hunterMappers';
import { useToast } from '@/components/shared/Toast';
import { NAV } from '@/lib/navBehavior';

/**
 * Retention-Tab Mock-Kacheln — RISIKO-Übersicht: Churn Risk · Gekündigt. Bis Score-/Signal-
 * Anbindung. HEAT über kanonischen Enum (HeatBadge = Single Source): churn_risk→Cooling (LUKEWARM),
 * cancelled→Warm (WARM). Alte Heat-Label-Wörter sind im Code audit-verboten → nur der Enum.
 * „Kunde wird kalt" (going_cold) gehört bewusst NICHT hierher, sondern in den Follow-ups-Tab
 * (= Aktion, nicht Risiko) — siehe [D46] / CLAUDE.md „Farmer Follow-ups".
 */
const RETENTION_ITEMS: RetentionItem[] = [
  {
    id: 'ret-1', name: 'Marc Levigne', jobTitle: 'VP Sales', company: 'DataPulse Corp',
    icpScore: 78, heatStatus: 'LUKEWARM', sherloqStatus: 'active', timeLabel: 'vor 7 Tagen',
    type: 'churn_risk',
    text: 'Nutzung der Plattform ist in den letzten 7 Tagen um 80% gefallen. AI empfiehlt sofortigen Check-in.',
  },
  {
    id: 'ret-3', name: 'Jonas Weber', jobTitle: 'CEO', company: 'Scalify GmbH',
    icpScore: 65, heatStatus: 'WARM', sherloqStatus: 'cancelled', timeLabel: 'vor 2 Tagen',
    type: 'cancelled',
    text: 'Kündigung eingegangen. Sofortiger persönlicher Anruf empfohlen.',
  },
];

/**
 * Upsell-Tab Mock-Kacheln — 1 Typ (Upsell Potential, grüne Zap-Badge). Bis Score-/Signal-
 * Anbindung. HEAT über kanonischen Enum→HeatBadge: Warm→WARM, Engaged→HOT.
 */
const UPSELL_ITEMS: UpsellItem[] = [
  {
    id: 'ups-1', name: 'Sarah Jenkins', jobTitle: 'Head of Growth', company: 'CloudSphere',
    icpScore: 84, heatStatus: 'WARM', sherloqStatus: 'active', timeLabel: 'vor 3 Tagen',
    text: 'Nutzung des Features stark gestiegen. AI empfiehlt Upsell-Option.',
  },
  {
    id: 'ups-2', name: 'Thomas Müller', jobTitle: 'BDR Enablement Specialist', company: 'HiringMate Ltd',
    icpScore: 49, heatStatus: 'HOT', sherloqStatus: 'active', timeLabel: 'vor 1 Tag',
    text: 'Enrichment-Limit zu 85% ausgeschöpft. AI empfiehlt Plan-Upgrade.',
  },
];

/**
 * Mock-Signale je Kunde (Company-gematcht) — NUR echte Aktivitäts-/LinkedIn-Signale (wie Hunter).
 * Churn & Upsell sind KEINE Signale → eigene Tabs („Churn & Trial" / „Upsell"). Bis zur echten
 * Signal-Anbindung ([D34]).
 */
type FarmerSignalMeta = { company: string; actionText: string };
const FARMER_SIGNALS: FarmerSignalMeta[] = [
  { company: 'PayGuard AG', actionText: 'Hat euren Produkt-Post auf LinkedIn geliked' },
  { company: 'Logistify DE', actionText: 'Hat dein LinkedIn-Profil besucht' },
  { company: 'HiringMate Ltd', actionText: 'Hat auf einen LinkedIn-Kommentar geantwortet' },
];

interface ScreenFarmingProps {
  customers: Customer[];
  onUpgradeSubscription: (id: string, newPlan: 'Growth' | 'Enterprise') => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
}

export default function ScreenFarming({
  customers,
  onUpgradeSubscription: _onUpgradeSubscription,
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
  // Retention-/Upsell-Item (kein Customer-Objekt) → minimaler Customer fürs FarmerSidepanel (Mock-Shaping).
  const itemToPerson = (it: RetentionItem | UpsellItem): Customer => ({
    id: it.id,
    person: {
      id: it.id, name: it.name, jobTitle: it.jobTitle, company: it.company,
      initials: it.name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    },
    icpScore: it.icpScore,
    heatStatus: it.heatStatus,
    sherloqStatus: (it.sherloqStatus ?? '').toUpperCase(),
    contactEmail: '',
  } as Customer);

  // MOCK fällige Tasks (Honesty: realistische Werte, kein Fake-KI) — echte Werte mit Farmer-DB-Wiring.
  const nowMs = Date.now();
  const dueTaskCards: DueTaskCardItem[] = [
    { id: 'fdt-1', contactId: customers[0]?.id, name: customers[0]?.person.name ?? 'Maximilian Krause', role: customers[0]?.person.jobTitle ?? 'Director Account Management', companyName: customers[0]?.person.company ?? 'PayGuard AG', initials: customers[0]?.person.initials ?? 'MK', icpScore: customers[0]?.icpScore, heatStatus: customers[0]?.heatStatus, taskTitle: 'Quartals-Business-Review terminieren', dueAt: new Date(nowMs + 86_400_000).toISOString() },
    { id: 'fdt-2', contactId: customers[1]?.id, name: customers[1]?.person.name ?? 'Jonas Weber', role: customers[1]?.person.jobTitle ?? 'CEO', companyName: customers[1]?.person.company ?? 'Scalify GmbH', initials: customers[1]?.person.initials ?? 'JW', icpScore: customers[1]?.icpScore, heatStatus: customers[1]?.heatStatus, taskTitle: 'Onboarding-Status nachfassen', dueAt: new Date(nowMs - 86_400_000).toISOString() },
  ];

  // Ignorierte Signale (lokaler State, kein Backend) → aus der Liste gefiltert. Kachel verschwindet sofort.
  const [ignoredSignalIds, setIgnoredSignalIds] = useState<string[]>([]);
  const ignoreSignals = (ids: string[]) => setIgnoredSignalIds((prev) => [...new Set([...prev, ...ids])]);

  // Signals: Mock-Meta auf echte Kunden mappen (Company-Match). Nur Treffer (Honesty), ohne Ignorierte.
  const signalRows = FARMER_SIGNALS
    .map((sig) => ({ sig, customer: customers.find((c) => c.person.company === sig.company) }))
    .filter((r): r is { sig: FarmerSignalMeta; customer: Customer } => !!r.customer)
    .filter((r) => !ignoredSignalIds.includes(r.customer.id));

  // Auswahl + Bulk-Leiste (gleiche Mechanik wie Hunter Signals). IDs = customer.id.
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const signalIds = signalRows.map((r) => r.customer.id);
  const toggleSignalSelection = (id: string) =>
    setSelectedSignalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAllSignals = () => setSelectedSignalIds(signalIds);
  const deselectAllSignals = () => setSelectedSignalIds([]);

  // Demo-Badges: Kunden = echte Mock-Länge; Churn = abgeleitet (heatScore <= 2);
  // Upsell (€-Summe) + Signals sind Mock bis zur Score-/Signal-Anbindung.
  const churnCount = customers.filter((c) => c.heatScore <= 2).length;
  const menuItems: { id: string; label: string; icon?: React.ReactNode; count?: string | number }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'kunden', label: 'Kunden', count: customers.length },
    { id: 'churn', label: 'Retention', icon: <AlertTriangle className="w-3.5 h-3.5" />, count: churnCount },
    { id: 'upsell', label: 'Upsell', icon: <TrendingUp className="w-3.5 h-3.5" />, count: '4.2k€' },
    { id: 'signals', label: 'Signals', icon: <Sparkles className="w-3.5 h-3.5" />, count: signalRows.length },
    { id: 'follow_ups', label: 'Follow-ups', icon: <CheckSquare className="w-3.5 h-3.5" />, count: dueTaskCards.length + 1 },
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
              onClick={() => setSubTab(item.id as any)}
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

      {/* 3. VIEW RETENTION — Churn Risk · Wird kalt · Gekündigt (FarmerRetentionKachel = HunterCard-Wrapper, Mock) */}
      {subTab === 'churn' && (
        <div className="flex flex-col gap-3">
          {/* Risiko-Übersicht: Churn Risk · Gekündigt. „Kunde wird kalt" liegt im Follow-ups-Tab ([D46]). */}
          {RETENTION_ITEMS.map((item) => (
            <FarmerRetentionKachel
              key={item.id}
              item={item}
              onOpenPanel={() => openInfo(itemToPerson(item))}
              onAction={() => setActionSignal({ kind: item.type, name: item.name, company: item.company, icpScore: item.icpScore })}
              expandedSlot={<FarmerExpandedCardContent customer={itemToPerson(item)} onOpenPanel={(tab, section) => openOnTab(itemToPerson(item), tab as FarmerTab, section)} />}
            />
          ))}
        </div>
      )}

      {/* 4. VIEW UPSELL — Upsell Potential (FarmerUpsellKachel = HunterCard-Wrapper, Mock) */}
      {subTab === 'upsell' && (
        <div className="flex flex-col gap-3">
          {UPSELL_ITEMS.map((item) => (
            <FarmerUpsellKachel
              key={item.id}
              item={item}
              onOpenPanel={() => openInfo(itemToPerson(item))}
              onAction={() => setActionSignal({ kind: 'upsell_potential', name: item.name, company: item.company, icpScore: item.icpScore })}
              expandedSlot={<FarmerExpandedCardContent customer={itemToPerson(item)} onOpenPanel={(tab, section) => openOnTab(itemToPerson(item), tab as FarmerTab, section)} />}
            />
          ))}
        </div>
      )}

      {/* 5. VIEW SIGNALS — 1:1 Hunter-Signals-Muster (LinkedinSignalCard + HunterCard).
          Unterschiede: SUBSCRIPTION statt STAGE · Kunden-Heat · Churn/Upsell/LinkedIn-Signaltypen.
          Daten = Mock (FARMER_SIGNALS), CTA = Platzhalter-Toast bis Action-Panel ([D34]). */}
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
            signalRows.map(({ sig, customer }) => (
              <LinkedinSignalCard
                key={customer.id}
                contactId={customer.person.id}
                name={customer.person.name}
                role={customer.person.jobTitle}
                companyName={customer.person.company}
                avatarUrl={customer.person.avatarUrl}
                icpScore={customer.icpScore}
                heatStatus={customer.heatStatus}
                timeAgoLabel={customer.lastLogin}
                showUrgency={false}
                actionText={sig.actionText}
                statusBadge={{ label: 'SUBSCRIPTION', node: <SubscriptionBadge status={customer.sherloqStatus} /> }}
                selected={selectedSignalIds.includes(customer.id)}
                onToggleSelect={() => toggleSignalSelection(customer.id)}
                onIgnore={() => ignoreSignals([customer.id])}
                onOpenInfo={() => openInfo(customer)}
                expandedSlot={<FarmerExpandedCardContent customer={customer} onOpenPanel={(tab, section) => openOnTab(customer, tab as FarmerTab, section)} />}
                onOpenAction={() => setSelectedFarmerSignal({
                  name: customer.person.name,
                  company: customer.person.company,
                  avatarUrl: customer.person.avatarUrl,
                  icpScore: customer.icpScore,
                  actionText: sig.actionText,
                  timeAgoLabel: (customer.lastLogin ?? '').replace(/^vor\s+/, ''),
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
          {/* Fällige Tasks bei Bestandskunden — „Ansehen" öffnet FarmerSidepanel Tasks-Tab + Highlight. */}
          <SequenceLeadCards
            items={dueTaskCards}
            onSelectLead={(lead) => { setInfoTab(null); setInfoTaskId(null); setInfoPerson({ ...lead, sherloqStatus: 'ACTIVE' } as Customer); }}
            onView={(lead, taskId) => { setInfoTab('tasks'); setInfoTaskId(taskId); setInfoPerson({ ...lead, sherloqStatus: 'ACTIVE' } as Customer); }}
            onComplete={() => toast('Task erledigt ✓', 'success')}
            renderExpanded={(lead) => {
              const c = { ...lead, sherloqStatus: 'ACTIVE' } as Customer;
              return <FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />;
            }}
          />

          {/* „Kunde wird kalt" — gehört zu Follow-ups (Aktion), NICHT zu Retention (Risiko).
              CTA „Start Outreach" → FarmerActionDrawer (going_cold-Config). */}
          <FollowUpKaltCard
            contactId="cust-2"
            name="Laura Becker"
            role="Head of Customer Success"
            companyName="Logistify DE"
            icpScore={78}
            heatStatus="COLD"
            timeAgoLabel="vor 28 Tagen"
            onSelectLead={(lead) => { setInfoTab(null); setInfoTaskId(null); setInfoPerson({ ...lead, sherloqStatus: 'ACTIVE' } as Customer); }}
            onOutreachClick={() => setActionSignal({ kind: 'going_cold', name: 'Laura Becker', company: 'Logistify DE', lastContactDays: 28 })}
            expandedSlot={(() => {
              const c = { id: 'cust-2', person: { id: 'cust-2', name: 'Laura Becker', jobTitle: 'Head of Customer Success', company: 'Logistify DE', initials: 'LB' }, icpScore: 78, heatStatus: 'COLD', sherloqStatus: 'ACTIVE', lastLogin: 'vor 28 Tagen', contactEmail: '' } as Customer;
              return <FarmerExpandedCardContent customer={c} onOpenPanel={(tab, section) => openOnTab(c, tab as FarmerTab, section)} />;
            })()}
          />
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
