/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Sparkles, Check, X, Clock, Trash, Zap } from 'lucide-react';
import type { Customer } from '@/types';
import { FarmerKpiCards, FarmerHealthOverview, FarmerKundenKachel, FarmerRetentionKachel, SubscriptionBadge, LinkedinSignalCard, EmptyState, type RetentionItem } from '@/components';
import { useToast } from '@/components/shared/Toast';
import { NAV } from '@/lib/navBehavior';

/**
 * Retention-Tab Mock-Kacheln — 3 Typen (Churn Risk · Wird kalt · Gekündigt). Bis Score-/Signal-
 * Anbindung. HEAT über kanonischen Enum (HeatBadge = Single Source): churn_risk→Cooling (LUKEWARM),
 * going_cold→Cold (COLD), cancelled→Warm (WARM). Alte Heat-Label-Wörter sind im Code audit-verboten
 * → daher ausschließlich der Enum, nie literale Labels.
 */
const RETENTION_ITEMS: RetentionItem[] = [
  {
    id: 'ret-1', name: 'Marc Levigne', jobTitle: 'VP Sales', company: 'DataPulse Corp',
    icpScore: 78, heatStatus: 'LUKEWARM', sherloqStatus: 'active', timeLabel: 'vor 7 Tagen',
    type: 'churn_risk',
    text: 'Nutzung der Plattform ist in den letzten 7 Tagen um 80% gefallen. AI empfiehlt sofortigen Check-in.',
  },
  {
    id: 'ret-2', name: 'Laura Becker', jobTitle: 'Head of Customer Success', company: 'Logistify DE',
    icpScore: 78, heatStatus: 'COLD', sherloqStatus: 'active', timeLabel: 'vor 28 Tagen',
    type: 'going_cold',
    text: 'Kein Kontakt seit 28 Tagen. AI empfiehlt Check-In bevor Kunde abwandert.',
  },
  {
    id: 'ret-3', name: 'Jonas Weber', jobTitle: 'CEO', company: 'Scalify GmbH',
    icpScore: 65, heatStatus: 'WARM', sherloqStatus: 'cancelled', timeLabel: 'vor 2 Tagen',
    type: 'cancelled',
    text: 'Kündigung eingegangen. Sofortiger persönlicher Anruf empfohlen.',
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
  onSelectCustomer: (cust: Customer) => void;
  onUpgradeSubscription: (id: string, newPlan: 'Growth' | 'Enterprise') => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
}

export default function ScreenFarming({
  customers,
  onSelectCustomer,
  onUpgradeSubscription: _onUpgradeSubscription,
}: ScreenFarmingProps) {
  const [subTab, setSubTab] = useState<'overview' | 'kunden' | 'churn' | 'upsell' | 'signals'>('overview');
  const { toast } = useToast();

  // Signals: Mock-Meta auf echte Kunden mappen (Company-Match). Nur Treffer erscheinen (Honesty).
  const signalRows = FARMER_SIGNALS
    .map((sig) => ({ sig, customer: customers.find((c) => c.person.company === sig.company) }))
    .filter((r): r is { sig: FarmerSignalMeta; customer: Customer } => !!r.customer);

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
          <FarmerKpiCards />
          <FarmerHealthOverview onShowAll={() => setSubTab('kunden')} />
        </div>
      )}

      {/* 2. VIEW KUNDEN (LIST) — Hunter-Kachel-Muster (FarmerKundenKachel = Wrapper um HunterCard) */}
      {subTab === 'kunden' && (
        <div className="flex flex-col gap-3">
          {customers.map((customer) => (
            <FarmerKundenKachel
              key={customer.id}
              contact={customer}
              onOpenPanel={() => onSelectCustomer(customer)}
            />
          ))}
        </div>
      )}

      {/* 3. VIEW RETENTION — Churn Risk · Wird kalt · Gekündigt (FarmerRetentionKachel = HunterCard-Wrapper, Mock) */}
      {subTab === 'churn' && (
        <div className="flex flex-col gap-3">
          {RETENTION_ITEMS.map((item) => (
            <FarmerRetentionKachel
              key={item.id}
              item={item}
              onOpenPanel={() => {
                const cust = customers.find((c) => c.person.name === item.name);
                if (cust) onSelectCustomer(cust);
                else toast('Kontakt-Panel folgt mit DB-Wiring', 'info');
              }}
              onAction={() => toast('Action Panel folgt ([D34])', 'info')}
            />
          ))}
        </div>
      )}

      {/* 4. VIEW UPSELL — Feed folgt (eigener Slice) */}
      {subTab === 'upsell' && (
        <div className="bg-app-surface rounded-[16px] p-10 shadow-card flex flex-col items-center text-center gap-2">
          <TrendingUp className="w-6 h-6 text-text-muted" />
          <h3 className="text-[14px] font-semibold text-text-primary">Upsell-Empfehlungen</h3>
          <p className="text-[12px] text-text-muted">Der Upsell-Feed (Potenzial-Signale + AI-Empfehlung) folgt in einem eigenen Slice.</p>
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
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {selectedSignalIds.length} {selectedSignalIds.length === 1 ? 'Signal' : 'Signale'} ausgewählt
              </span>
              <button onClick={deselectAllSignals} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">Auswahl aufheben</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toast('Bulk-Aktionen folgen mit dem Action-Panel ([D34])', 'info')} className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
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
                onOpenInfo={() => onSelectCustomer(customer)}
                onOpenAction={() => toast('Antworten: Action-Panel folgt ([D34])', 'info')}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
}
