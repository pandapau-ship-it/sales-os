import { useState, useEffect } from 'react';
import {
  X, Check,
  LayoutDashboard, Activity, MessageSquare, CheckSquare, CreditCard, BarChart3, FileText,
  Mail,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Avatar from '@/components/shared/Avatar';
import {
  AktiveSignale, AktivitaetsVerlauf, FarmerActionDrawer, HeatBadge, KommunikationKompakt,
  KommunikationVerlauf, KontaktZeile, NotizenListe, OffeneTasks, PanelTabs, SubscriptionBadge,
  SubscriptionBox, TasksListe, UsageBox,
} from '@/components';
import type { SubscriptionData, UsageData, FarmerActionData } from '@/components';
import type { Lead, Customer } from '@/types';
import type { CommunicationView } from '@/lib/hunterMappers';

/**
 * FarmerSidepanel — Info-Panel für Bestandskunden (Farmer, `contact_status='kunde'`), [D33].
 * Schlanke Farmer-Hülle, die die HunterSidepanel-Struktur 1:1 übernimmt (Header/Tabs/Footer +
 * Full-Bleed-Invariante aus `ui/sheet.tsx`), aber Farmer-Inhalte zeigt. Bewusst eine EIGENE
 * Komponente (kein `mode`-Flag am HunterSidepanel) — sie komponiert dieselben prop-driven
 * panel-blocks. Ersetzt langfristig den Alt-`CustomerDrawer` (font-mono, kein typo-Kanon).
 *
 * SLICE 1: Hülle + wiederverwendbare Tabs (Aktivität/Kommunikation/Tasks/Notizen 1:1; Übersicht
 * mit AktiveSignale/OffeneTasks/KommunikationKompakt). Daten sind MOCK (Honesty: kein DB-Wiring).
 * SLICE 2: Subscription-/Usage-Tab, Usage-Schnellhinweis, echte Farmer-Signal-Logik (Churn/Upsell/
 * Wird kalt). Verdrahtung (CustomerDrawer → FarmerSidepanel) = späterer Slice.
 */

// ── MOCK (Slice 1) — echte Werte kommen mit dem Farmer-DB-Wiring (TanStack Query) ───────────
// Übersicht braucht etwas Inhalt für die Slice-1-Abnahme; die Blöcke sind 1:1 die Hunter-Blöcke.
// IDs/Titel match die Follow-up-Karten (ScreenFarming dueTaskCards: fdt-1/fdt-2), damit der
// „Ansehen"-Deeplink (highlightId) im Tasks-Tab eine echte Row trifft → aufklappen + Flash.
const MOCK_TASKS = [
  { id: 'fdt-1', title: 'Quartals-Business-Review terminieren', due_at: new Date(Date.now() + 86_400_000).toISOString(), channel: 'meeting' },
  { id: 'fdt-2', title: 'Onboarding-Status nachfassen', due_at: new Date(Date.now() - 86_400_000).toISOString(), channel: 'email' },
];
const MOCK_COMMS: CommunicationView[] = [
  { id: 'fc-1', channel: 'email', direction: 'inbound', occurredAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), note: 'Enterprise-Infomaterial angefragt' },
  { id: 'fc-2', channel: 'meeting', direction: 'outbound', occurredAt: new Date(Date.now() - 40 * 86_400_000).toISOString(), note: 'Review-Termin nach 30 Tagen' },
  { id: 'fc-3', channel: 'linkedin', direction: 'inbound', occurredAt: new Date(Date.now() - 55 * 86_400_000).toISOString() },
];

type FarmerTab = 'overview' | 'activity' | 'communication' | 'tasks' | 'subscription' | 'usage' | 'notes';

export default function FarmerSidepanel({ person: personProp, onClose, initialTab = null, initialTaskId = null }: { person: Lead | Customer | null; onClose: () => void; initialTab?: FarmerTab | null; initialTaskId?: string | null }) {
  const [activeTab, setActiveTab] = useState<FarmerTab>(initialTab ?? 'overview');
  const [actionSignal, setActionSignal] = useState<FarmerActionData | null>(null); // [D34] Farmer Action Panel
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 1800); };

  // Open-State von der Prop; Inhalt aus gehaltener Kopie, damit das Panel während der
  // Ausfahr-Animation (person→null) nicht leer wird (gleiches Muster wie HunterSidepanel/CustomerDrawer).
  const [display, setDisplay] = useState<Lead | Customer | null>(personProp);
  useEffect(() => {
    if (personProp) { setDisplay(personProp); setActiveTab(initialTab ?? 'overview'); }
  }, [personProp, initialTab]);
  const isOpen = personProp !== null;
  const person = display;

  // Header-Quellen aus dem Mock-Kontakt (Slice 1). Farmer = Kunde → Subscription-Status statt Stage.
  const customer = person as Customer | null;
  const subscriptionStatus = customer?.sherloqStatus ?? null;

  // MOCK (Slice 2) — echte Werte kommen mit dem Farmer-DB-Wiring. HONESTY: nur befüllte Felder rendern.
  const mockSubscription: SubscriptionData = {
    plan: customer?.subscriptionPlan,
    status: subscriptionStatus ?? undefined,
    mrr: '2.000 €', arr: '24.000 €',
    activeSince: '01.03.2026', nextPayment: '01.07.2026',
    cancellationPeriod: '3 Monate zum Laufzeitende', nrr: '112 %',
  };
  const mockUsage: UsageData = {
    lastLogin: customer?.lastLogin, lastUsage: customer?.lastLogin,
    profilesAdded: customer?.profilesAdded != null ? { value: customer.profilesAdded.toLocaleString('de-DE'), trend: '+12%' } : undefined,
    messages: { value: '1.240', trend: '+8%' },
    enrichments: { used: 8500, limit: 10000 },
    onboarding: 'Abgeschlossen',
  };

  const identityBlock = person && (
    <div className="flex items-center gap-4 min-w-0">
      <Avatar name={person.person.name} src={person.person.avatarUrl} size={64} className="shadow-sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">{person.person.name}</h1>
          {person.icpScore != null && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
              ICP: {person.icpScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
          {person.person.jobTitle && <span>{person.person.jobTitle}</span>}
          {person.person.jobTitle && person.person.company && <span className="text-icon-muted">•</span>}
          {person.person.company && (
            <>
              <span className="px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-on-accent text-[9px] font-bold">{person.person.company.charAt(0).toUpperCase()}</span>
              <span className="font-semibold text-text-body">{person.person.company}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Rechts auf Namens-Höhe: Vertrag (SubscriptionBadge) · Heat — analog Hunter (Status · Heat).
  const statusBadges = person && (
    <>
      {subscriptionStatus && (
        <div className="flex flex-col items-center">
          <span className="typo-section-label text-text-muted mb-2">Vertrag</span>
          <SubscriptionBadge status={subscriptionStatus} />
        </div>
      )}
      {person.heatStatus && (
        <div className="flex flex-col items-center">
          <span className="typo-section-label text-text-muted mb-2">Heat</span>
          <HeatBadge status={person.heatStatus} />
        </div>
      )}
    </>
  );

  // Slice-1-Mock: alle vier Kontaktwege (E-Mail · Telefon · LinkedIn · Website), damit die
  // KontaktZeile wie bei Hunter vollständig rendert. Echte Werte kommen mit dem Farmer-DB-Wiring.
  const mockPhones = [{ id: 'fp-1', type: 'Geschäftlich', number: '+49 89 1234 5678', favorite: true }];
  const contactPill = person && (
    <KontaktZeile
      readonly
      onCopied={() => showToast('Kopiert ✓')}
      contact={{
        email: person.contactEmail ?? '',
        linkedin: `in/${person.person.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
        web: `${(customer?.person.company ?? 'example').toLowerCase().replace(/[^a-z]+/g, '')}.com`,
      }}
      phones={mockPhones}
      onCopyField={() => showToast('Kopiert ✓')}
    />
  );

  const tabNav = (
    <PanelTabs
      tabs={[
        { id: 'overview', label: 'Übersicht', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: 'activity', label: 'Aktivität', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'communication', label: 'Kommunikation', icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
        { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-3.5 h-3.5" /> },
        { id: 'usage', label: 'Usage', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notizen', icon: <FileText className="w-3.5 h-3.5" /> },
      ]}
      active={activeTab}
      onChange={(id) => setActiveTab(id as FarmerTab)}
    />
  );

  const tabContent = person && (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-7 animate-fade-in">
          {/* Farmer-Signale [D33] (Slice 2, Mock): Churn Risk · Upsell · Kunde wird kalt.
              Echte Score-/Signal-Logik kommt mit dem DB-Wiring; CTAs → Action-Panel [D34]. */}
          <AktiveSignale
            churnRisk
            upsell
            goingCold
            cancelled
            onChurn={() => setActionSignal({
              kind: 'churn_risk', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
              churnScore: 78, lastLoginDays: 21, usageDropPct: 40,
            })}
            onUpsell={() => setActionSignal({
              kind: 'upsell_potential', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, icpScore: person.icpScore,
              seatUtilizationPct: 92, featureUsageUp: true, nps: 9,
            })}
            onCold={() => setActionSignal({
              kind: 'going_cold', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, lastContactDays: 18,
            })}
            onCancelled={() => setActionSignal({
              kind: 'cancelled', name: person.person.name, company: person.person.company,
              avatarUrl: person.person.avatarUrl, cancelledDate: '31.07.2026', cancelReason: 'Budget gestrichen',
            })}
          />
          <OffeneTasks
            taskRows={MOCK_TASKS}
            onAdd={() => setActiveTab('tasks')}
            onOpenTasks={() => setActiveTab('tasks')}
            onEditTask={() => setActiveTab('tasks')}
            onComplete={() => showToast('Task erledigt ✓')}
            onDelete={() => showToast('Task gelöscht')}
          />
          <KommunikationKompakt items={MOCK_COMMS} onShowAll={() => setActiveTab('communication')} />
          {/* Usage-Schnellhinweis (Vorgeschmack auf den Usage-Tab). */}
          <UsageBox variant="compact" data={mockUsage} onShowAll={() => setActiveTab('usage')} />
        </div>
      )}

      {activeTab === 'activity' && <AktivitaetsVerlauf rows={[]} />}

      {activeTab === 'communication' && (
        <KommunikationVerlauf items={MOCK_COMMS} onLog={() => showToast('Kontakt protokollieren — folgt')} />
      )}

      {activeTab === 'tasks' && (
        <TasksListe
          onToast={showToast}
          highlightId={initialTaskId}
          taskRows={MOCK_TASKS}
          contactName={person.person.name}
          onCreate={() => showToast('Task gespeichert ✓')}
          onComplete={() => showToast('Task erledigt ✓')}
          onDelete={() => showToast('Task gelöscht')}
        />
      )}

      {activeTab === 'subscription' && <div className="animate-fade-in"><SubscriptionBox data={mockSubscription} /></div>}
      {activeTab === 'usage' && <div className="animate-fade-in"><UsageBox variant="full" data={mockUsage} /></div>}

      {activeTab === 'notes' && (
        <NotizenListe
          onToast={showToast}
          noteRows={[]}
          onCreate={() => showToast('Notiz gespeichert ✓')}
          onUpdate={() => showToast('Notiz gespeichert ✓')}
          onDelete={() => showToast('Notiz gelöscht')}
        />
      )}
    </>
  );

  // Footer-Quick-Actions: Task · Mail (disabled) · Notiz. Mail nutzt das Haus-Disabled-Muster
  // (HunterCard/LeadListRow-Mail): opacity-40 + cursor-not-allowed + data-tip „Folgt mit Nango-Anbindung".
  // Aktionen Slice 1 = Tab-Wechsel; Send-Aktionen folgen mit Action-Panels [D34] / Sending-Layer.
  const ACTIONS: { icon: typeof CheckSquare; label: string; onClick?: () => void; disabled?: boolean; tip?: string }[] = [
    { icon: CheckSquare, label: 'Task', onClick: () => setActiveTab('tasks') },
    { icon: Mail, label: 'Mail', disabled: true, tip: 'Folgt mit Nango-Anbindung' },
    { icon: FileText, label: 'Notiz', onClick: () => setActiveTab('notes') },
  ];
  const btn = "px-3.5 py-2 border border-border text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm flex items-center justify-center gap-1.5";
  const btnActive = "hover:bg-app-bg cursor-pointer hover:-translate-y-0.5";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  const panelBody = person && (
    <>
      {/* Fixer weißer Panel-Kopf; grauer `main` scrollt darunter. Die EINE Trennlinie sitzt als
          `border-y` am grauen `main` (nicht an Header/Footer) — Full-Bleed-Invariante (CLAUDE.md). */}
      <header className="pt-7 px-7 bg-app-surface items-start relative z-10 shrink-0">
        <div className="flex items-start justify-between gap-6">
          {identityBlock}
          <div className="flex items-start gap-6 shrink-0">
            <div className="hidden md:flex items-start gap-7">{statusBadges}</div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">{contactPill}</div>
        <div className="mt-6">{tabNav}</div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-7 space-y-7 bg-app-bg border-y border-border-subtle custom-scrollbar pb-28">
        {tabContent}
      </main>

      <footer className="px-4 py-2.5 bg-app-surface shrink-0 flex items-center justify-between gap-2 relative z-10">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={a.disabled}
              data-tip={a.tip}
              className={cn(btn, a.disabled ? btnDisabled : btnActive)}
            >
              <Icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          );
        })}
      </footer>
    </>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side="drawer"
          className="flex flex-col gap-0 h-full font-sans overflow-hidden p-0 bg-app-surface"
          style={{ width: 820, maxWidth: '95vw' }}
        >
          {panelBody}
        </SheetContent>
      </Sheet>

      {/* [D34] Farmer Action Panel — Churn Risk / Kunde wird kalt. Renderer = ChatActionPanel (unverändert).
          KI-Felder NULL → „Folgt"-Platzhalter; Buttons (Task/Snooze/Senden) erscheinen mit Draft ([D5]). */}
      <FarmerActionDrawer
        signal={actionSignal}
        onClose={() => setActionSignal(null)}
        onCreateTask={() => { setActionSignal(null); setActiveTab('tasks'); showToast('Task erstellt ✓'); }}
        onWinbackCall={() => showToast('Anruf protokolliert ✓')}
        onSnooze={() => showToast('Auf später verschoben')}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-[12px] shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
