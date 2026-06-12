/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal } from 'lucide-react';

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
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Terminal className="w-5 h-5 text-text-muted" />
        <div>
          <h1 className="text-[14px] font-semibold text-text-primary uppercase tracking-wider font-mono">Sherloq JIRA Alignment</h1>
          <p className="text-[11px] text-text-muted font-mono leading-none mt-1">Status der technischen Support-Schnittstelle</p>
        </div>
      </div>

      {/* Mini sub nav */}
      <div className="flex gap-2.5">
        <button 
          onClick={() => setSubTab('tickets')}
          className={`text-[11px] font-mono px-3 py-1 rounded-pill border transition-all cursor-pointer ${
            subTab === 'tickets' ? 'bg-[var(--text-primary)] text-white border-[#212529]' : 'bg-app-surface text-text-muted border-border hover:bg-app-bg'
          }`}
        >
          Meine Tickets ({tickets.length})
        </button>
        <button 
          onClick={() => setSubTab('epics')}
          className={`text-[11px] font-mono px-3 py-1 rounded-pill border transition-all cursor-pointer ${
            subTab === 'epics' ? 'bg-[var(--text-primary)] text-white border-[#212529]' : 'bg-app-surface text-text-muted border-border hover:bg-app-bg'
          }`}
        >
          Epics
        </button>
      </div>

      {subTab === 'tickets' && (
        <div className="bg-app-surface border border-border rounded-[24px] overflow-hidden shadow-xs">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-app-bg text-[10px] font-mono font-bold text-text-muted border-b border-border">
                <th className="px-5 py-3">KEY</th>
                <th className="px-5 py-3">DESCRIPTION</th>
                <th className="px-5 py-3">EPIC</th>
                <th className="px-5 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-bg)]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-app-bg/50 transition-colors text-[12px]">
                  <td className="px-5 py-4 font-mono font-bold text-sherloq-primary">{t.id}</td>
                  <td className="px-5 py-4 font-medium text-text-primary">
                    <div className="flex items-center gap-1.5">
                      {t.priority === 'HIGH' && <span className="w-2 h-2 rounded-pill bg-[var(--icp-low)]" title="High Priority" />}
                      <span>{t.summary}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-muted">{t.epic}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-pill ${
                      t.status === 'DONE' ? 'bg-[var(--signal-success-bg)] text-signal-success' : t.status === 'IN_PROGRESS' ? 'bg-[var(--signal-warn-bg)] text-[#F59E0B]' : 'bg-[var(--signal-cold-bg)] text-signal-info'
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
          <div className="bg-app-surface border border-border rounded-[24px] p-5">
            <span className="text-[10px] font-mono text-text-muted font-bold block mb-1">EPIC NAME</span>
            <h3 className="text-[13px] font-bold text-text-primary">B2B Billing Revamp</h3>
            <p className="text-[11px] text-text-body mt-1.5 leading-relaxed">Integration automatisierter Kreditkartenzahlungen bei self-service Plan-Upgrades.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-text-muted">
              <span>2 Tasks verbleibend</span>
              <span>80% abgeschlossen</span>
            </div>
          </div>

          <div className="bg-app-surface border border-border rounded-[24px] p-5">
            <span className="text-[10px] font-mono text-text-muted font-bold block mb-1">EPIC NAME</span>
            <h3 className="text-[13px] font-bold text-text-primary">Core Design Refresh</h3>
            <p className="text-[11px] text-text-body mt-1.5 leading-relaxed">Systemweiter Launch des weichen, schwebenden Hyper-Modern Floating UI Themes.</p>
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-text-muted">
              <span>0 Tasks verbleibend</span>
              <span className="text-[var(--signal-success-text)] font-bold font-sans">100% abgeschlossen ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
