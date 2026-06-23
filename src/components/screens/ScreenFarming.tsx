/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import type { Customer } from '@/types';
import { FarmerKpiCards, FarmerHealthOverview, FarmerKundenKachel } from '@/components';
import { NAV } from '@/lib/navBehavior';

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

  // Demo-Badges: Kunden = echte Mock-Länge; Churn = abgeleitet (heatScore <= 2);
  // Upsell (€-Summe) + Signals sind Mock bis zur Score-/Signal-Anbindung.
  const churnCount = customers.filter((c) => c.heatScore <= 2).length;
  const menuItems: { id: string; label: string; icon?: React.ReactNode; count?: string | number }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'kunden', label: 'Kunden', count: customers.length },
    { id: 'churn', label: 'Churn & Trial', icon: <AlertTriangle className="w-3.5 h-3.5" />, count: churnCount },
    { id: 'upsell', label: 'Upsell', icon: <TrendingUp className="w-3.5 h-3.5" />, count: '4.2k€' },
    { id: 'signals', label: 'Signals', icon: <Sparkles className="w-3.5 h-3.5" />, count: 2 },
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

      {/* 3. VIEW HEALTH & CHURN INDEX */}
      {subTab === 'churn' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-app-surface rounded-[16px] p-6 shadow-card">
            <h3 className="text-[14px] font-semibold text-text-primary mb-4">Risiko-Ranking der Accounts (Churn Prevention Mode)</h3>
            
            <div className="flex flex-col gap-3">
              {customers.map((cust) => {
                const healthScore = cust.heatScore; // 1-5
                const isCritical = healthScore <= 2;
                return (
                  <div 
                    key={cust.id}
                    className={`flex items-center justify-between p-4 rounded-[14px] border transition-all ${
                      isCritical ? 'bg-[var(--signal-urgent-bg)]/30 border-[var(--signal-urgent-bg)]' : 'bg-app-surface border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cust.person.avatarUrl ? (
                        <img src={cust.person.avatarUrl} alt={cust.person.name} className="w-9 h-9 rounded-pill object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-pill bg-sherloq-primary text-on-accent flex items-center justify-center font-sans font-medium text-[12px]">
                          {cust.person.initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-text-primary">{cust.person.company}</span>
                          <span className="text-[11px] text-text-muted font-medium">({cust.person.name})</span>
                        </div>
                        <p className="text-[11px] text-text-body mt-0.5 font-mono">Letzter Login: {cust.lastLogin}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Health Score Dot indicator */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-text-muted font-mono">Health Index:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span 
                              key={s} 
                              className={`w-2.5 h-2.5 rounded-pill ${
                                s <= healthScore
                                  ? (healthScore <= 2 ? 'bg-[var(--signal-urgent-text)]' : 'bg-[var(--signal-success-text)]')
                                  : 'bg-[var(--border)]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectCustomer(cust)}
                        className={`text-[11px] font-semibold px-4 py-1.5 rounded-pill border cursor-pointer transition-all ${
                          isCritical
                            ? 'bg-[var(--signal-urgent-bg)] border-[var(--signal-urgent-text)]/20 text-signal-urgent hover:bg-[var(--signal-urgent-bg)]/80'
                            : 'bg-app-surface border-border hover:bg-app-bg text-text-body'
                        }`}
                      >
                        {isCritical ? <span className="inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> CS-Ticket erstellen</span> : 'Nutzung auslesen'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

      {/* 5. VIEW SIGNALS — Feed folgt (eigener Slice) */}
      {subTab === 'signals' && (
        <div className="bg-app-surface rounded-[16px] p-10 shadow-card flex flex-col items-center text-center gap-2">
          <Sparkles className="w-6 h-6 text-text-muted" />
          <h3 className="text-[14px] font-semibold text-text-primary">Farmer-Signale</h3>
          <p className="text-[12px] text-text-muted">Der Signal-Feed (Churn-/Upsell-/Trial-Signale) folgt in einem eigenen Slice.</p>
        </div>
      )}

    </div>
  );
}
