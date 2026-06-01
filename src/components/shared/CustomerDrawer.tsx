/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  Link2,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Video,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Activity,
  Bookmark,
} from "lucide-react";
import type {
  Lead,
  Customer,
  CommunicationChannel,
  EngagementTouchpoint,
} from "@/types";
import { getHeatColor } from "@/lib/heatUtils";

interface CustomerDrawerProps {
  person: Lead | Customer | null;
  initialExpandedCommId?: string | null;
  onClose: () => void;
}

export default function CustomerDrawer({
  person,
  initialExpandedCommId,
  onClose,
}: CustomerDrawerProps) {
  const [expandedComm, setExpandedComm] = useState<Record<number, boolean>>({});
  const commSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialExpandedCommId) {
      // Extract the last part of the ID after the last hyphen (which is the index from CommunicationChain)
      const parts = initialExpandedCommId.split('-');
      const indexStr = parts[parts.length - 1];
      const indexNum = parseInt(indexStr, 10);

      let targetId = 1;
      // Reverse map the index roughly to 1, 2, 3 for the demo data
      // e.g. lowest index = oldest = item 3
      if (indexNum === 0 || indexNum === 1) targetId = 3;
      else if (indexNum === 2 || indexNum === 3) targetId = 2;
      else targetId = 1;

      setExpandedComm({ [targetId]: true });
      
      // small delay to allow render before scrolling
      setTimeout(() => {
        commSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [initialExpandedCommId]);

  if (!person) return null;

  const isCustomer = "sherloqStatus" in person;
  const castedCustomer = person as Customer;
  const lead = person as Lead;

  // getHeatColor imported from @/lib/heatUtils — single source of truth

  const heatStatusStr = person.heatStatus || "COLD";
  const heatSettings = getHeatColor(heatStatusStr);

  return (
    <div className="fixed inset-0 bg-[#495057]/20 backdrop-blur-sm z-50 flex justify-end font-sans transition-opacity animate-fade-in pr-2 py-2">
      <div
        className="w-full max-w-[850px] h-full bg-[#F4F5F7] shadow-2xl flex flex-col relative overflow-hidden animate-slide-left rounded-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button floating top right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-app-surface border border-border rounded-pill hover:bg-gray-50 flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer transition-all z-20 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="p-8 pb-12 w-full mx-auto flex flex-col gap-6">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-2 mt-4 pr-12">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-[14px] bg-sherloq-primary text-white flex items-center justify-center font-sans font-bold text-[20px]">
                    {person.person.initials}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-extrabold text-text-primary font-sans tracking-tight leading-none">
                      {person.person.name}
                    </h2>
                    <div className="bg-[var(--signal-success-bg)] text-signal-success border border-[var(--signal-success-text)]/20 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
                      ICP: 87
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-body text-[12px] mt-2">
                    <span className="font-medium">
                      {person.person.jobTitle}
                    </span>
                    <span className="text-icon-muted">•</span>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-[var(--text-primary)] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-[4px] font-bold">
                        {person.person.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-text-primary">
                        {person.person.company}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-icon-muted uppercase tracking-wider font-mono">
                    STATUS
                  </span>
                  <div className="bg-[var(--signal-success-bg)] text-signal-success pl-2 pr-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-pill bg-[var(--signal-success-text)]"></span>
                    Aktiv
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-icon-muted uppercase tracking-wider font-mono">
                    HEAT
                  </span>
                  <div
                    className={`px-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5 border ${heatSettings.bg} ${heatSettings.text} ${heatSettings.border}`}
                  >
                    <span style={{ color: heatSettings.dot, fontSize: 8, lineHeight: 1 }}>●</span>
                    {heatSettings.label}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-icon-muted uppercase tracking-wider font-mono">
                    STAGE
                  </span>
                  <div className="bg-app-bg border border-border text-text-body px-4 py-1.5 rounded-pill text-[12px] font-semibold shadow-sm">
                    {lead.pipelineStage === "pipeline" ? "Demo" : "Lead"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Bar (White Pill) */}
            <div className="bg-app-surface border border-border rounded-[14px] px-8 py-5 flex items-center justify-between text-[12px] text-text-body font-medium shadow-card w-full">
              <div className="flex items-center gap-2.5 hover:text-text-primary cursor-pointer transition-colors flex-1 justify-center border-r border-border-subtle last:border-0 pl-0">
                <Mail className="w-4 h-4 text-icon-muted" />
                {person.contactEmail || "max@firma.com"}
              </div>
              <div className="flex items-center gap-2.5 hover:text-text-primary cursor-pointer transition-colors flex-1 justify-center border-r border-border-subtle last:border-0">
                <Phone className="w-4 h-4 text-icon-muted" />
                +49 123 456789
              </div>
              <div className="flex items-center gap-2.5 hover:text-text-primary cursor-pointer transition-colors flex-1 justify-center border-r border-border-subtle last:border-0">
                <Link2 className="w-4 h-4 text-icon-muted" />
                in/max
              </div>
              <div className="flex items-center gap-2.5 hover:text-text-primary cursor-pointer transition-colors flex-1 justify-center border-r border-border-subtle last:border-0">
                <Globe className="w-4 h-4 text-icon-muted" />
                firma.com
              </div>
            </div>

              {/* Layout varies based on Hunting vs Farming */}
              {!isCustomer ? (
                // --- HUNTING LAYOUT (Single Column, full width) ---
                <div className="flex flex-col gap-6 mt-2">
                  {/* Kurzakte */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      KURZAKTE
                    </h3>
                    <p className="text-[12px] text-text-primary leading-[1.6]">
                      {person.kurzakte ||
                        "Hat Budget-Freeze bis Q3 bestätigt. Trotzdem starkes Interesse an Feature Y. Persönlichkeit: Blau — analytisch, braucht Zahlen. Buying Signal: hat nach Pricing gefragt. Objection: Timing. Next Step: ROI-Dokument schicken."}
                    </p>
                  </div>

                  {/* Deal Setup */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-6">
                      DEAL SETUP
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-7 gap-x-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          STAGE
                        </span>
                        <span className="text-[13px] font-bold text-text-primary">
                          Demo vereinbart
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          PROBABILITY
                        </span>
                        <span className="text-[13px] font-bold text-text-primary">
                          {lead.pipelineProgress || 60}%
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          ARR
                        </span>
                        <span className="text-[13px] font-bold text-signal-success">
                          {lead.dealValue ? `${lead.dealValue.toLocaleString("de-DE")} EUR` : '24.000 EUR'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          MRR
                        </span>
                        <span className="text-[13px] font-bold text-text-primary">
                          {lead.dealValue ? `${(lead.dealValue / 12).toLocaleString("de-DE")} EUR` : '2.000 EUR'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          LAUFZEIT
                        </span>
                        <span className="text-[13px] font-bold text-text-primary">
                          12 Monate
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">
                          IN STAGE SEIT
                        </span>
                        <span className="text-[13px] font-bold text-[#E53E3E] flex items-center gap-1.5 bg-[#FFF5F5] px-2 py-0.5 rounded-md -ml-2">
                          8 Tagen{" "}
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Offene Tasks */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      OFFENE TASKS
                    </h3>
                    <div className="flex flex-col gap-3">
                      {/* Task 1 - Overdue/Urgent */}
                      <div className="bg-[#FFF5F5] border border-[#FFE3E3] rounded-[12px] p-4 flex items-start gap-4 cursor-pointer hover:shadow-xs transition-shadow">
                        <div className="w-7 h-7 rounded-pill bg-app-surface border border-[#FF8787] flex items-center justify-center mt-0.5 shrink-0 text-[#E03131]">
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-[#C92A2A]">
                            ROI-Dokument senden
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E03131] mt-0.5">
                            Heute fällig <span className="text-[#FFA8A8]">·</span>{" "}
                            <span className="flex items-center gap-1 text-text-muted font-medium">
                              <Mail className="w-3 h-3 text-icon-muted" /> Email
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Task 2 - Normal */}
                      <div className="bg-app-bg border border-border rounded-[12px] p-4 flex items-start gap-4 cursor-pointer hover:shadow-xs transition-shadow">
                        <div className="w-7 h-7 rounded-pill bg-app-surface border-2 border-[#DEE2E6] flex items-center justify-center mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-text-primary">
                            Follow-up Call buchen
                          </span>
                          <span className="text-[11px] font-medium text-text-muted mt-0.5">
                            In 3 Tagen
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Sequence */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono">
                        ACTIVE SEQUENCE
                      </h3>
                      <div className="bg-[var(--sherloq-light)] text-signal-success font-bold text-[10px] px-2.5 py-1 rounded-md">
                        Schritt 3 von 5
                      </div>
                    </div>
                    {/* Visual Stepper */}
                    <div className="relative flex items-center justify-between px-2 mt-4 pb-2">
                      {/* Background Line */}
                      <div className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-[2px] bg-[var(--border)] z-0" />
                      {/* Active Line (up to step 3) */}
                      <div className="absolute left-[8%] right-[50%] top-1/2 -translate-y-1/2 h-[2px] bg-[var(--signal-success-text)] z-0" />
                      <div className="relative z-10 w-9 h-9 rounded-pill bg-[var(--signal-success-text)] flex items-center justify-center text-white border-2 border-white shadow-sm cursor-pointer">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="relative z-10 w-9 h-9 rounded-pill bg-[var(--signal-success-text)] flex items-center justify-center text-white border-2 border-white shadow-sm cursor-pointer"></div>
                      <div className="relative z-10 w-10 h-10 rounded-pill bg-app-surface border-[2.5px] border-[var(--signal-success-text)] flex items-center justify-center text-signal-success shadow-sm cursor-pointer">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="relative z-10 w-4 h-4 rounded-pill border-[3.5px] border-white bg-[#DEE2E6] shadow-sm cursor-pointer"></div>
                      <div className="relative z-10 w-9 h-9 rounded-pill bg-border-subtle border-2 border-white flex items-center justify-center text-icon-muted cursor-pointer">
                        <Phone className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- FARMING LAYOUT (Single Column Flow) ---
                <div className="flex flex-col gap-6 mt-2">
                  {/* Kurzakte */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      KURZAKTE
                    </h3>
                    <ul className="flex flex-col gap-3 text-[13px] text-text-body leading-relaxed">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                        Gute Nutzung der Core-Features, aber noch kein Setup der neuen Analytics-Dashboards.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                        NPS Score ist bei 8 - zufrieden, aber noch kein aktiver Promoter.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                        Zusätzliches Potenzial für 5 weitere Seats im Bereich Marketing vorhanden.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                        Next Step: Quarterly Review einstellen und Expansions-Optionen besprechen.
                      </li>
                    </ul>
                  </div>

                  {/* Sherloq Usage */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      SHERLOQ USAGE
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Last Login</span>
                        <span className="text-[13px] font-bold text-text-primary">{castedCustomer.lastLogin || 'vor 2 Tagen'}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Last Usage</span>
                        <span className="text-[13px] font-bold text-text-primary">Heute</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Profiles added</span>
                        <div className="flex items-center">
                          <span className="text-[13px] font-bold text-text-primary">{castedCustomer.profilesAdded || 142}</span>
                          <span className="text-signal-success text-[10px] font-semibold ml-1.5">+12%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Messages generiert</span>
                        <div className="flex items-center">
                          <span className="text-[13px] font-bold text-text-primary">89</span>
                          <span className="text-signal-urgent text-[10px] font-semibold ml-1.5">-4%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Enrichments</span>
                        <div className="flex items-center">
                          <span className="text-[13px] font-bold text-signal-urgent">8.500 / 10k (85%) ⚠️</span>
                          <span className="text-signal-success text-[10px] font-semibold ml-1.5">+7%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Posts generiert</span>
                        <div className="flex items-center">
                          <span className="text-[13px] font-bold text-text-primary">12</span>
                          <span className="text-signal-success text-[10px] font-semibold ml-1.5">+24%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Onboarding</span>
                        <span className="text-[13px] font-bold text-signal-success flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Abgeschlossen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      SUBSCRIPTION
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Plan</span>
                        <span className="text-[13px] font-bold text-text-primary">{castedCustomer.subscriptionPlan}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Status</span>
                        <span className="text-[13px] font-bold text-signal-success">Aktiv ✅</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Aktiv seit</span>
                        <span className="text-[13px] font-bold text-text-primary">01.10.2025</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-icon-muted font-mono tracking-wider">Nächste Zahlung</span>
                        <span className="text-[13px] font-bold text-text-primary">01.10.2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Churn Risk */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card bg-gradient-to-r from-white to-app-bg">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      CHURN RISK
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-[var(--signal-success-bg)] text-signal-success font-bold text-[13px] px-3 py-1.5 rounded-md flex items-center gap-1.5">
                          Low ✅
                        </div>
                      </div>
                      <p className="text-[13px] text-text-body leading-relaxed">
                        Kunde nutzt die Plattform täglich und hat das Onboarding erfolgreich abgeschlossen. Alle Core-Features werden regelmäßig von den aktiven Usern eingesetzt. Kein Anzeichen für Abwanderung.
                      </p>
                    </div>
                  </div>

                  {/* Upsell Potential */}
                  {castedCustomer.upsellOpportunity && (
                    <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card border-l-4 border-l-[#10B981]">
                      <h3 className="text-[10px] font-bold text-signal-success uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                        UPSELL POTENTIAL
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-[var(--signal-success-bg)] text-signal-success font-bold text-[13px] px-3 py-1.5 rounded-md flex items-center gap-1.5">
                            ⬆️ {castedCustomer.upsellOpportunity.potential}
                          </div>
                        </div>
                        <p className="text-[13px] text-text-body leading-relaxed">
                          <strong>Warum Upsell erkannt:</strong> {castedCustomer.upsellOpportunity.description}
                        </p>
                        <div className="bg-app-bg border border-border rounded-[12px] p-4 text-[13px] font-medium text-text-primary">
                          <strong>Konkreter Vorschlag:</strong> {castedCustomer.upsellOpportunity.value}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Offene Tasks */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      OFFENE TASKS
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="bg-app-bg border border-border rounded-[12px] p-4 flex items-start gap-4 cursor-pointer hover:shadow-xs transition-shadow">
                        <div className="w-7 h-7 rounded-pill bg-app-surface border-2 border-[#DEE2E6] flex items-center justify-center mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-text-primary">
                            Quarterly Review vorbereiten
                          </span>
                          <span className="text-[11px] font-medium text-text-muted mt-0.5">
                            In 5 Tagen
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Aktionen */}
                  <div className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card">
                    <h3 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                      AKTIONEN
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <button className="bg-app-surface border border-border text-text-body text-[12px] font-semibold px-4 py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center gap-2 shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Task
                      </button>
                      <button className="bg-app-surface border border-border text-text-body text-[12px] font-semibold px-4 py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center gap-2 shadow-sm">
                        <Mail className="w-3.5 h-3.5" /> Mail
                      </button>
                      <button className="bg-app-surface border border-border text-text-body text-[12px] font-semibold px-4 py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center gap-2 shadow-sm">
                        <Link2 className="w-3.5 h-3.5" /> LinkedIn
                      </button>
                      <button className="bg-app-surface border border-border text-text-body text-[12px] font-semibold px-4 py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center gap-2 shadow-sm">
                        <Bookmark className="w-3.5 h-3.5" /> Notiz
                      </button>
                      <button className="bg-app-surface border border-border text-text-body text-[12px] font-semibold px-4 py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center gap-2 shadow-sm">
                        <Activity className="w-3.5 h-3.5" /> Usage ansehen
                      </button>
                    </div>
                  </div>
                </div>
              )}


            {/* Kommunikation - FULL WIDTH */}
            <div ref={commSectionRef} className="bg-app-surface border border-border rounded-[14px] p-6 shadow-card w-full mt-2">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  KOMMUNIKATION
                </h3>
                <div className="bg-[var(--signal-cold-bg)] text-signal-cold rounded-pill px-2.5 py-0.5 text-[10px] font-bold tracking-wide">
                  KLICKBAR
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Item 1 */}
                <div className="flex flex-col border-b border-border-subtle pb-6 last:border-0 last:pb-0">
                  <div
                    className="flex items-start gap-4 group cursor-pointer"
                    onClick={() =>
                      setExpandedComm((prev) => ({ ...prev, 1: !prev[1] }))
                    }
                  >
                    <div className="w-12 h-12 rounded-card overflow-hidden shrink-0 shadow-sm border border-border">
                      <img
                        src="/teams.jpeg"
                        alt="Teams"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1 pr-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[14px] font-bold text-text-primary">
                          Discovery Call & Demo
                        </span>
                        <span className="text-[11px] text-icon-muted font-medium">
                          vor 5 Tagen
                        </span>
                      </div>
                      <p
                        className={`text-[13px] text-text-muted mt-1 ${!expandedComm[1] ? "line-clamp-2" : ""}`}
                      >
                        Kunde zeigte starkes Interesse an Feature Y,
                        Budget-Freeze bis Q3 angesprochen...
                      </p>
                      <div className="flex items-center gap-1.5 text-icon-muted text-[11px] font-medium mt-2">
                        {expandedComm[1] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>Klicken zum Lesen</span>
                      </div>
                    </div>
                  </div>

                  {expandedComm[1] && (
                    <div className="ml-16 mt-4 bg-app-bg rounded-[16px] p-5">
                      <h4 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                        VOLLSTÄNDIGES TRANSCRIPT
                      </h4>
                      <div className="text-[13px] text-text-primary leading-relaxed space-y-4">
                        <p>
                          <strong>Max (Kunde):</strong> Ja, also das Feature Y
                          sieht wirklich sehr gut aus, das würde uns bei der
                          aktuellen BDR Ramp-Up Time enorm helfen.
                        </p>
                        <p>
                          <strong>Du:</strong> Perfekt, genau dafür haben wir es
                          entwickelt. Wie sieht es denn budgetär aus für dieses
                          Quartal?
                        </p>
                        <p>
                          <strong>Max (Kunde):</strong> Da müssen wir schauen.
                          Wir haben aktuell einen Budget-Freeze bis Q3, aber ich
                          spreche intern mal, ob wir da eine Ausnahme für ein
                          Pilot-Projekt machen können.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Item 2 */}
                <div className="flex flex-col border-b border-border-subtle pb-6 last:border-0 last:pb-0">
                  <div
                    className="flex items-start gap-4 group cursor-pointer"
                    onClick={() =>
                      setExpandedComm((prev) => ({ ...prev, 2: !prev[2] }))
                    }
                  >
                    <div className="w-12 h-12 rounded-card overflow-hidden shrink-0 shadow-sm border border-border">
                      <img
                        src="/microsoft-outlook-2025.jpg"
                        alt="Outlook"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1 pr-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[14px] font-bold text-text-primary">
                          Angebot gesendet: ROI-Dokument
                        </span>
                        <span className="text-[11px] text-icon-muted font-medium">
                          vor 8 Tagen
                        </span>
                      </div>
                      <p
                        className={`text-[13px] text-text-muted mt-1 ${!expandedComm[2] ? "line-clamp-2" : ""}`}
                      >
                        Hallo Max, anbei wie besprochen das ROI-Dokument für
                        Sherloq Enterprise...
                      </p>
                      <div className="flex items-center gap-1.5 text-icon-muted text-[11px] font-medium mt-2">
                        {expandedComm[2] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>Klicken zum Lesen</span>
                      </div>
                    </div>
                  </div>

                  {expandedComm[2] && (
                    <div className="ml-16 mt-4 bg-app-bg rounded-[16px] p-5">
                      <h4 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                        VOLLSTÄNDIGE EMAIL
                      </h4>
                      <div className="text-[13px] text-text-primary leading-relaxed space-y-4">
                        <p>Hallo Max,</p>
                        <p>
                          anbei wie besprochen das ROI-Dokument für Sherloq
                          Enterprise. Basierend auf euren 20 neuen AMs in Q2
                          ergibt sich ein ROI von ca. 340% im ersten Jahr.
                        </p>
                        <p>Ich freue mich auf dein Feedback.</p>
                        <p>Beste Grüße</p>
                      </div>

                      <div className="flex items-center gap-2 mt-6">
                        <div className="bg-[#FFF4E6] text-[#DD6B20] px-3 py-1 rounded-pill text-[11px] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Keine Antwort
                        </div>
                      </div>
                      <button className="mt-4 bg-app-surface border border-border text-text-primary font-bold text-[13px] px-5 py-2.5 rounded-card shadow-sm hover:bg-gray-50 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-text-muted" />
                        Email öffnen
                      </button>
                    </div>
                  )}
                </div>

                {/* Item 3 */}
                <div className="flex flex-col pb-2">
                  <div
                    className="flex items-start gap-4 group cursor-pointer"
                    onClick={() =>
                      setExpandedComm((prev) => ({ ...prev, 3: !prev[3] }))
                    }
                  >
                    <div className="w-12 h-12 rounded-card overflow-hidden shrink-0 shadow-sm border border-border p-1.5">
                      <img
                        src="/Link2.avif"
                        alt="LinkedIn"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col flex-1 pr-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[14px] font-bold text-text-primary">
                          LinkedIn Nachricht
                        </span>
                        <span className="text-[11px] text-icon-muted font-medium">
                          vor 12 Tagen
                        </span>
                      </div>
                      <p
                        className={`text-[13px] text-text-muted mt-1 ${!expandedComm[3] ? "line-clamp-2" : ""}`}
                      >
                        Danke für die Vernetzung, Max. Klasse was ihr bei
                        PayGuard aufbaut...
                      </p>
                      <div className="flex items-center gap-1.5 text-icon-muted text-[11px] font-medium mt-2">
                        {expandedComm[3] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>Klicken zum Lesen</span>
                      </div>
                    </div>
                  </div>

                  {expandedComm[3] && (
                    <div className="ml-16 mt-4 bg-app-bg rounded-[16px] p-5">
                      <h4 className="text-[10px] font-bold text-icon-muted uppercase tracking-wider font-mono mb-4">
                        VOLLSTÄNDIGE NACHRICHT
                      </h4>
                      <div className="text-[13px] text-text-primary leading-relaxed space-y-4">
                        <p>Danke für die Vernetzung, Max.</p>
                        <p>
                          Klasse, was ihr bei PayGuard aufbaut. Euer neues
                          Feature Payment-Routing klingt extrem spannend. Können
                          wir uns nächste Woche mal austauschen, wie ihr aktuell
                          das BDR Ramp-up für eure neuen AMs meistert?
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
