/**
 * AktivitaetsVerlauf — Aktivität-Tab (820px-Panel + Vollansicht): historischer Zeitstrahl.
 * Aktuell Platzhalter/Empty-State (CRM-Sync folgt). Kanonischer Stand aus HunterSidepanel.tsx.
 */
import { Clock } from "lucide-react";

export default function AktivitaetsVerlauf() {
  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">Historischer Zeitstrahl</span>
      <div className="bg-app-surface rounded-[12px] p-8 border border-border shadow-sm text-center text-xs text-text-muted py-14">
        <Clock className="w-7 h-7 mx-auto mb-3 text-icon-muted" />
        Hier werden alle CRM-Aktivitäten aus HubSpot, Outlook und LinkedIn synchronisiert.
      </div>
    </div>
  );
}
