/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, Users, Activity, CreditCard, Shield, Settings, Server } from 'lucide-react';

export default function ScreenSherloqSystem() {
  const stats = [
    { title: 'PROFILES ADDED', value: '198 / 500', pct: 40, color: 'bg-[#175253]' },
    { title: 'SDK TRAFFIC', value: '1.43M calls', pct: 72, color: 'bg-emerald-600' },
    { title: 'API HEALTH', value: '100.0%', pct: 100, color: 'bg-[#2B8A3E]' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#212529] tracking-tight">Sherloq System Status</h1>
        <p className="text-[12px] text-[#868E96] mt-0.5">Überblick über deine Plattformlizenz, API-Nutzung und Performance-Zahlen.</p>
      </div>

      {/* Grid of system diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] font-mono font-semibold text-[#868E96] uppercase tracking-wider">{stat.title}</span>
            <h3 className="text-[24px] font-bold text-[#212529] mt-1.5">{stat.value}</h3>
            
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4">
              <div className={`${stat.color} h-full transition-all`} style={{ width: `${stat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-between items-center border-b border-[#F8F9FA] pb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#212529]">Modell- & Plan-Übersicht</h3>
            <p className="text-[11px] text-[#868E96] mt-0.5">Details deines aktuellen Workspace</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#2B8A3E] bg-[#EBFBEE] px-3 py-1 rounded-full border border-[#2B8A3E]/10">
            Abrechnung aktiv
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white shadow-[0_4px_15px_rgb(0,0,0,0.04)] rounded-[24px] p-5">
            <span className="text-[11px] font-mono text-[#868E96] font-bold">STARTER</span>
            <h4 className="text-[18px] font-bold text-[#212529] mt-2">49€ / Monat</h4>
            <p className="text-[11px] text-[#495057] mt-1">Für einzelne BDRs. Bis zu 50 Leads.</p>
          </div>
          <div className="bg-white shadow-[0_4px_15px_rgb(0,0,0,0.04)] ring-1 ring-[#125455]/10 rounded-[24px] p-5 relative">
            <span className="absolute top-3 right-3 text-[9px] bg-[#125455] text-white px-2 py-0.5 rounded-full font-bold">AKTIV</span>
            <span className="text-[11px] font-mono text-[#125455] font-bold">GROWTH</span>
            <h4 className="text-[18px] font-bold text-[#212529] mt-2">149€ / AM Team</h4>
            <p className="text-[11px] text-[#495057] mt-1">Für bis zu 5 AMs. Unlimitierte Sequenzen.</p>
          </div>
          <div className="bg-white shadow-[0_4px_15px_rgb(0,0,0,0.04)] rounded-[24px] p-5">
            <span className="text-[11px] font-mono text-[#868E96] font-bold">ENTERPRISE</span>
            <h4 className="text-[18px] font-bold text-[#212529] mt-2">Custom Package</h4>
            <p className="text-[11px] text-[#495057] mt-1">Für große B2B Vertriebsteams mit SLA & fine-tuned LLM.</p>
          </div>
        </div>
      </div>

      {/* Integration Status (honest design) */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h4 className="text-[13px] font-semibold text-[#212529] mb-4">Integrierte Drittsysteme</h4>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-[16px] border border-[#E9ECEF]/70">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#175253]" />
              <span className="text-[12px] font-semibold text-[#212529]">Salesforce Connector</span>
            </div>
            <span className="text-[10px] font-mono text-[#2B8A3E] font-bold bg-[#EBFBEE] px-2 py-0.5 rounded-full">CONNECTED ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-[16px] border border-[#E9ECEF]/70">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-[#175253]" />
              <span className="text-[12px] font-semibold text-[#212529]">HubSpot API Sync</span>
            </div>
            <span className="text-[10px] font-mono text-[#2B8A3E] font-bold bg-[#EBFBEE] px-2 py-0.5 rounded-full">CONNECTED ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
