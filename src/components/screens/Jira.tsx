/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Shield, ArrowUpRight, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

interface JiraTicket {
  id: string;
  summary: string;
  status: 'OFTEN' | 'IN_PROGRESS' | 'DONE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  epic: string;
}

export default function ScreenJira() {
  const [subTab, setSubTab] = useState<'tickets' | 'epics'>('tickets');

  const tickets: JiraTicket[] = [
    { id: 'SHQ-104', summary: 'Faktura-Schnittstelle schlägt fehl bei Enterprise Upgrades', status: 'IN_PROGRESS', priority: 'HIGH', epic: 'B2B Billing Revamp' },
    { id: 'SHQ-112', summary: 'Weichkanal Integration: LinkedIn API Connector Rate Limit', status: 'OFTEN', priority: 'HIGH', epic: 'LinkedIn Multi-Channel' },
    { id: 'SHQ-85', summary: 'Dark Mode Contrast Ratio für WCAG AA compliance anpassen', status: 'DONE', priority: 'LOW', epic: 'Core Design Refresh' },
    { id: 'SHQ-99', summary: 'SDR Briefing: Cache Zeit auf 60 Minuten maximieren', status: 'DONE', priority: 'MEDIUM', epic: 'AI Pipeline Optimization' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12 text-left">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#E9ECEF] pb-3">
        <Terminal className="w-5 h-5 text-[#868E96]" />
        <div>
          <h1 className="text-[14px] font-semibold text-[#212529] uppercase tracking-wider font-mono">Sherloq JIRA Alignment</h1>
          <p className="text-[11px] text-[#868E96] font-mono leading-none mt-1">Status der technischen Support-Schnittstelle</p>
        </div>
      </div>

      {/* Mini sub nav */}
      <div className="flex gap-2.5">
        <button 
          onClick={() => setSubTab('tickets')}
          className={`text-[11px] font-mono px-3 py-1 rounded-full border transition-all cursor-pointer ${
            subTab === 'tickets' ? 'bg-[#212529] text-white border-[#212529]' : 'bg-white text-[#868E96] border-[#E9ECEF] hover:bg-[#F8F9FA]'
          }`}
        >
          Meine Tickets ({tickets.length})
        </button>
        <button 
          onClick={() => setSubTab('epics')}
          className={`text-[11px] font-mono px-3 py-1 rounded-full border transition-all cursor-pointer ${
            subTab === 'epics' ? 'bg-[#212529] text-white border-[#212529]' : 'bg-white text-[#868E96] border-[#E9ECEF] hover:bg-[#F8F9FA]'
          }`}
        >
          Epics
        </button>
      </div>

      {subTab === 'tickets' && (
        <div className="bg-white border border-[#E9ECEF] rounded-[24px] overflow-hidden shadow-xs">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[10px] font-mono font-bold text-[#868E96] border-b border-[#E9ECEF]">
                <th className="px-5 py-3">KEY</th>
                <th className="px-5 py-3">DESCRIPTION</th>
                <th className="px-5 py-3">EPIC</th>
                <th className="px-5 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8F9FA]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors text-[12px]">
                  <td className="px-5 py-4 font-mono font-bold text-[#175253]">{t.id}</td>
                  <td className="px-5 py-4 font-medium text-[#212529]">
                    <div className="flex items-center gap-1.5">
                      {t.priority === 'HIGH' && <span className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />}
                      <span>{t.summary}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#868E96]">{t.epic}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'DONE' ? 'bg-[#EBFBEE] text-[#2B8A3E]' : t.status === 'IN_PROGRESS' ? 'bg-[#FFF9DB] text-[#F59E0B]' : 'bg-[#EBF8FF] text-[#2563EB]'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'epics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E9ECEF] rounded-[24px] p-5">
            <span className="text-[10px] font-mono text-[#868E96] font-bold block mb-1">EPIC NAME</span>
            <h3 className="text-[13px] font-bold text-[#212529]">B2B Billing Revamp</h3>
            <p className="text-[11px] text-[#495057] mt-1.5 leading-relaxed">Integration automatisierter Kreditkartenzahlungen bei self-service Plan-Upgrades.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-[#868E96]">
              <span>2 Tasks verbleibend</span>
              <span>80% abgeschlossen</span>
            </div>
          </div>

          <div className="bg-white border border-[#E9ECEF] rounded-[24px] p-5">
            <span className="text-[10px] font-mono text-[#868E96] font-bold block mb-1">EPIC NAME</span>
            <h3 className="text-[13px] font-bold text-[#212529]">Core Design Refresh</h3>
            <p className="text-[11px] text-[#495057] mt-1.5 leading-relaxed">Systemweiter Launch des weichen, schwebenden Hyper-Modern Floating UI Themes.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-[#868E96]">
              <span>0 Tasks verbleibend</span>
              <span className="text-emerald-700 font-bold font-sans">100% abgeschlossen ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
