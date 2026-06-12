/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Server } from 'lucide-react';

export default function ScreenSherloqSystem() {
  const stats = [
    { title: 'PROFILES ADDED', value: '198 / 500', pct: 40, color: 'bg-sherloq-primary' },
    { title: 'SDK TRAFFIC', value: '1.43M calls', pct: 72, color: 'bg-[var(--signal-success-text)]' },
    { title: 'API HEALTH', value: '100.0%', pct: 100, color: 'bg-[var(--signal-success-text)]' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Sherloq System Status</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Überblick über deine Plattformlizenz, API-Nutzung und Performance-Zahlen.</p>
      </div>

      {/* Grid of system diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-app-surface rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">{stat.title}</span>
            <h3 className="text-[24px] font-bold text-text-primary mt-1.5">{stat.value}</h3>
            
            <div className="w-full bg-app-bg h-2 rounded-pill overflow-hidden mt-4">
              <div className={`${stat.color} h-full transition-all`} style={{ width: `${stat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Plans */}
      <div className="bg-app-surface rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-between items-center border-b border-[var(--app-bg)] pb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary">Modell- & Plan-Übersicht</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Details deines aktuellen Workspace</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-signal-success bg-[var(--signal-success-bg)] px-3 py-1 rounded-pill border border-[var(--signal-success-text)]/10">
            Abrechnung aktiv
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-app-surface shadow-[0_4px_15px_rgb(0,0,0,0.04)] rounded-[24px] p-5">
            <span className="text-[11px] font-mono text-text-muted font-bold">STARTER</span>
            <h4 className="text-[18px] font-bold text-text-primary mt-2">49€ / Monat</h4>
            <p className="text-[11px] text-text-body mt-1">Für einzelne BDRs. Bis zu 50 Leads.</p>
          </div>
          <div className="bg-app-surface shadow-[0_4px_15px_rgb(0,0,0,0.04)] ring-1 ring-sherloq-primary/10 rounded-[24px] p-5 relative">
            <span className="absolute top-3 right-3 text-[9px] bg-sherloq-primary text-on-accent px-2 py-0.5 rounded-pill font-bold">AKTIV</span>
            <span className="text-[11px] font-mono text-sherloq-primary font-bold">GROWTH</span>
            <h4 className="text-[18px] font-bold text-text-primary mt-2">149€ / AM Team</h4>
            <p className="text-[11px] text-text-body mt-1">Für bis zu 5 AMs. Unlimitierte Sequenzen.</p>
          </div>
          <div className="bg-app-surface shadow-[0_4px_15px_rgb(0,0,0,0.04)] rounded-[24px] p-5">
            <span className="text-[11px] font-mono text-text-muted font-bold">ENTERPRISE</span>
            <h4 className="text-[18px] font-bold text-text-primary mt-2">Custom Package</h4>
            <p className="text-[11px] text-text-body mt-1">Für große B2B Vertriebsteams mit SLA & fine-tuned LLM.</p>
          </div>
        </div>
      </div>

      {/* Integration Status (honest design) */}
      <div className="bg-app-surface rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h4 className="text-[13px] font-semibold text-text-primary mb-4">Integrierte Drittsysteme</h4>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-app-bg rounded-[16px] border border-border/70">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-sherloq-primary" />
              <span className="text-[12px] font-semibold text-text-primary">Salesforce Connector</span>
            </div>
            <span className="text-[10px] font-mono text-signal-success font-bold bg-[var(--signal-success-bg)] px-2 py-0.5 rounded-pill">CONNECTED ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-app-bg rounded-[16px] border border-border/70">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-sherloq-primary" />
              <span className="text-[12px] font-semibold text-text-primary">HubSpot API Sync</span>
            </div>
            <span className="text-[10px] font-mono text-signal-success font-bold bg-[var(--signal-success-bg)] px-2 py-0.5 rounded-pill">CONNECTED ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
