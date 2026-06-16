import { useState, useEffect } from 'react';
import {
  ArrowUpRight, ArrowLeft, X, Mail, Phone, Clock, Check,
  ChevronDown, Plus,
  StickyNote, User, Building2, Tag, CheckCircle2
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import LinkedinIcon from '@/components/shared/LinkedinIcon';
import Avatar from '@/components/shared/Avatar';
import { ActiveSequenceChain, AktiveSignale, AktivitaetsVerlauf, DealSetup, DetailField, DetailPhoneList, DetailSection, HeatBadge, KiKurzakte, KommunikationPreview, KommunikationVerlauf, KontaktZeile, NotizenListe, OffeneTasks, PanelTabs, StageBadge, StatusBadge, TasksListe } from '@/components';

/** Kanonische Default-Stages (Spec §3.2) — bis zum DB-Wiring dokumentierter Fallback. */
const PIPELINE_STAGES = ['Backlog', 'Demo vereinbart', 'Follow-up offen', 'Onboarding offen', 'Free Trial', 'Gewonnen'];

/** Mock-Defaults für die vom User editierbaren Felder (kein System-Wert). */
const DEFAULT_CONTACT = {
  email: 'c.brand@logixflow.de',
  linkedin: 'in/christianbrand',
  web: 'logixflow.de',
};

/** Mehrere Telefonnummern — Favorit erscheint inline, Rest im Popover. Reihenfolge stabil. */
interface Phone { id: string; type: string; number: string; favorite: boolean }
const DEFAULT_PHONES: Phone[] = [
  { id: 'p1', type: 'Mobil', number: '+49 170 1234567', favorite: true },
  { id: 'p2', type: 'Geschäftlich', number: '+49 89 9876543', favorite: false },
  { id: 'p3', type: 'Privat', number: '+49 30 5551234', favorite: false },
];
const DEFAULT_KURZAKTE = [
  'Refactoring der Outreach-Struktur gestartet — sucht aktiv ein Tool zur Senkung der SDR Ramp-Up-Time.',
  'Persönlichkeit: analytisch & datengetrieben — reagiert auf klare ROI-Argumentation, wenig Smalltalk.',
  'Objection: Budget-Freeze bis Q3 — echter Einwand, kein Vorwand. Der ROI-Case ist der Hebel.',
  'Buying Signal: Demo sehr positiv, fragte nach Implementierungs-Zeitplan. Abschluss realistisch ab Q4.',
];

// EditableInline → panel-blocks/EditableInline (importiert). PhoneField → panel-blocks/PhoneField.

/**
 * HunterSidepanel — Info Panel (§22.1, 820px). Nutzt dieselbe Sheet-„drawer"-Shell
 * wie CustomerDrawer / die Action-Panels: schwebendes, abgerundetes Panel rechts mit
 * identischer Slide-in/-out-Animation (kein Inline-Layout, überlagert die Liste).
 * `person = null` → geschlossen; Inhalt rendert aus einer gehaltenen Kopie, damit das
 * Panel während der Ausfahr-Animation nicht leer wird.
 */
/** Dropdown-Optionen für die Detail-Felder (Vollansicht). Spiegeln die CRM-Felder
 *  aus CLAUDE.md → „KONTAKTE / COMPANIES". Später aus settings/Enums geladen. */
const ANREDE_OPTS = ['Herr', 'Frau', 'Divers'];
const SENIORITY_OPTS = ['C-Level', 'VP', 'Director', 'Manager', 'IC', 'Founder'];
const SPRACHE_OPTS = ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Andere'];
const LAND_OPTS = ['Deutschland', 'Österreich', 'Schweiz', 'Andere'];
const BRANCHE_OPTS = ['SaaS', 'Fintech', 'E-Commerce', 'Healthcare', 'Industrie', 'Andere'];
const GROESSE_OPTS = ['1–10', '11–50', '51–200', '201–500', '500+'];
const LEAD_STATUS_OPTS = ['Lead', 'Qualified Lead', 'Marketing Qualified Lead (MQL)', 'Sales Qualified Lead (SQL)', 'Customer', 'Churned'];

const DEFAULT_DETAILS = {
  anrede: 'Herr', vorname: 'Christian', nachname: 'Brand',
  jobtitel: 'VP of Sales EMEA', seniority: 'VP', abteilung: 'Sales',
  sprache: 'Deutsch', stadt: 'München', land: 'Deutschland', twitter: '',
  firma: 'LogixFlow GmbH', branche: 'SaaS', groesse: '51–200',
  domain: 'logixflow.de', firmaStadt: 'München', firmaLand: 'Deutschland',
  leadStatus: 'Sales Qualified Lead (SQL)', icp: '87',
  tags: 'Enterprise · ROI-Fokus · Outreach', owner: 'Oliver Prossi',
  notiz: 'Budget-Freeze bis Q3 — der ROI-Case ist der Hebel. Demo lief sehr positiv, Abschluss ab Q4 realistisch.',
};

// DetailField · DetailSection · StatusBadge · DetailPhoneList → ausgelagert nach
// src/components/panel-blocks/ (siehe Imports). Hier nur noch deren Komposition.

export default function HunterSidepanel({ person: personProp, onClose, onExit, variant = 'panel' }: { person: any; onClose: () => void; onExit?: () => void; variant?: 'panel' | 'full' }) {
  const [activeTab, setActiveTab] = useState(variant === 'full' ? 'details' : 'overview');
  const [showVollansicht, setShowVollansicht] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vom User editierbare Felder (kein System-Wert) — lokaler Mock-State.
  const [stage, setStage] = useState<string>('');
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [phones, setPhones] = useState<Phone[]>(DEFAULT_PHONES);
  const [kurzakte, setKurzakte] = useState<string[]>(DEFAULT_KURZAKTE);
  const [details, setDetails] = useState(DEFAULT_DETAILS);
  const setDetail = (k: keyof typeof DEFAULT_DETAILS, v: string) => { setDetails((d) => ({ ...d, [k]: v })); showToast('Gespeichert'); };

  // Open-State von der Prop; Inhalt aus gehaltener Kopie (wie CustomerDrawer).
  const [display, setDisplay] = useState<any>(personProp);
  useEffect(() => {
    if (personProp) {
      setDisplay(personProp);
      // Editierbare Felder beim Öffnen auf den Stand des Kontakts zurücksetzen.
      setStage(personProp.stage || 'Demo vereinbart');
      setContact(DEFAULT_CONTACT);
      setPhones(DEFAULT_PHONES);
      setKurzakte(DEFAULT_KURZAKTE);
      setDetails(DEFAULT_DETAILS);
    }
  }, [personProp]);
  const isOpen = personProp !== null;
  const person = display;


  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Aktions-Buttons (Task/Mail/LinkedIn/Notiz) — einmal definiert, je Layout anders gerendert.
  const ACTIONS = [
    { icon: Plus, label: 'Task', toast: 'Task Aktion gestartet' },
    { icon: Mail, label: 'Mail', toast: 'Mail Aktion gestartet' },
    { icon: LinkedinIcon, label: 'LinkedIn', toast: 'LinkedIn Aktion gestartet' },
    { icon: StickyNote, label: 'Notiz', toast: 'Notiz Aktion gestartet' },
  ];
  const renderActions = (btnClass: string) =>
    ACTIONS.map((a) => {
      const Icon = a.icon;
      return (
        <button key={a.label} onClick={() => showToast(a.toast)} className={btnClass}>
          <Icon className="w-3.5 h-3.5" /> {a.label}
        </button>
      );
    });

  // Wiederverwendbare Inhalts-Fragmente — identisch in Panel (820px) und Vollansicht (Seite).
  const identityBlock = (
    <div className="flex items-center gap-4 min-w-0">
      <Avatar name={person?.name || "Christian Brand"} src={person?.avatarUrl} size={64} className="shadow-sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">
            {person?.name || "Dr. Christian Brand"}
          </h1>
          <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
            ICP: 87
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
          <span>{person?.title || "VP of Sales EMEA"}</span>
          <span className="text-icon-muted">•</span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-on-accent text-[9px] font-bold">L</span>
          <span className="font-semibold text-text-body">{person?.company || "LogixFlow GmbH"}</span>
        </div>
      </div>
    </div>
  );

  const statusBadgesInner = (
    <>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Status</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-extrabold leading-none">
          <span className="w-2 h-2 rounded-full bg-[var(--signal-success-text)]"></span>
          Aktiv
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Heat</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-extrabold leading-none">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--icp-high)] opacity-90 shadow-sm"></span>
          Aktiv
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Stage</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-1.5 rounded-full bg-app-surface border border-border text-text-body text-[12px] font-extrabold leading-none shadow-sm hover:border-[var(--sherloq-primary)] hover:text-[var(--sherloq-primary)] transition-colors cursor-pointer flex items-center gap-1.5">
              {stage}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {PIPELINE_STAGES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => { setStage(s); showToast(`Stage geändert zu „${s}"`); }}
                className="cursor-pointer text-[13px] font-semibold"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s === stage ? 'bg-[var(--sherloq-primary)]' : 'bg-[var(--border-strong)]'}`} />
                {s}
                {s === stage && <Check className="w-3.5 h-3.5 ml-auto text-[var(--sherloq-primary)]" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  const FIELD_LABEL: Record<'email' | 'linkedin' | 'web', string> = { email: 'E-Mail', linkedin: 'LinkedIn', web: 'Webadresse' };
  const contactPill = (
    <KontaktZeile
      contact={contact}
      phones={phones}
      onSaveField={(f, v) => { setContact((c) => ({ ...c, [f]: v })); showToast(`${FIELD_LABEL[f]} gespeichert`); }}
      onCopyField={(f) => showToast(`${FIELD_LABEL[f]} kopiert`)}
      onSetFavorite={(id) => { setPhones((prev) => prev.map((p) => ({ ...p, favorite: p.id === id }))); showToast('Favorit-Nummer gesetzt'); }}
      onUpdateNumber={(id, number) => { setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, number } : p))); showToast('Nummer gespeichert'); }}
      onCopyPhone={() => showToast('Telefon kopiert')}
      onAddPhone={() => showToast('Weitere Nummer hinzugefügt')}
    />
  );

  const tabNav = (
    <PanelTabs
      tabs={[
        { id: 'overview', label: 'Übersicht' },
        { id: 'communication', label: 'Kommunikation' },
        { id: 'activity', label: 'Aktivität' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'notes', label: 'Notizen' },
      ]}
      active={activeTab}
      onChange={setActiveTab}
    />
  );

  const tabContent = person && (
        <>

        {activeTab === 'overview' && (
          <div className="space-y-7 animate-fade-in">
            <KiKurzakte items={kurzakte} onSave={(lines) => { setKurzakte(lines); showToast('KI Kurzakte gespeichert'); }} />

            <AktiveSignale onAction={(key) => { if (key === 'stagniert') showToast('Next Step geöffnet'); else if (key === 'keine_task') showToast('Task anlegen gestartet'); else setActiveTab('communication'); }} />

            <DealSetup stage={stage} />

            <OffeneTasks onAdd={() => showToast('Neue Task angelegt')} />

            <ActiveSequenceChain />

            <KommunikationPreview onShowAll={() => setActiveTab('communication')} />

          </div>
        )}

        {activeTab === 'communication' && (
          <KommunikationVerlauf />
        )}

        {activeTab === 'activity' && (
          <AktivitaetsVerlauf />
        )}

        {activeTab === 'tasks' && (
          <TasksListe onToast={showToast} />
        )}

        {activeTab === 'notes' && (
          <NotizenListe onToast={showToast} />
        )}

        </>
  );

  // Details-Tab (nur Vollansicht) — alle Kontakt-/Firmen-/CRM-Felder (CLAUDE.md → CRM FELDER),
  // editierbar (Standard) bzw. readonly (System). Bündelt was bei „+ SDR Lead" erfassbar ist.
  const PHONE_TYPES = ['Mobil', 'Geschäftlich', 'Privat', 'Weitere'];
  const addPhone = () => {
    setPhones((prev) => {
      const maxId = prev.reduce((m, p) => Math.max(m, parseInt(p.id.replace(/\D/g, '')) || 0), 0);
      return [...prev, { id: 'p' + (maxId + 1), type: 'Weitere', number: '', favorite: prev.length === 0 }];
    });
  };
  const setFavoritePhone = (id: string) => { setPhones((prev) => prev.map((p) => ({ ...p, favorite: p.id === id }))); showToast('Favorit-Nummer gesetzt'); };
  const updatePhone = (id: string, patch: Partial<Phone>) => setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePhone = (id: string) => {
    setPhones((prev) => {
      let next = prev.filter((p) => p.id !== id);
      if (next.length && !next.some((p) => p.favorite)) next = next.map((p, i) => (i === 0 ? { ...p, favorite: true } : p));
      return next;
    });
    showToast('Nummer entfernt');
  };
  const detailsContent = person && (
    <div className="space-y-5 animate-fade-in">
      <DetailSection title="Person" icon={User}>
        <DetailField label="Anrede" value={details.anrede} options={ANREDE_OPTS} onSelect={(v) => setDetail('anrede', v)} />
        <DetailField label="Sprache" value={details.sprache} options={SPRACHE_OPTS} onSelect={(v) => setDetail('sprache', v)} />
        <DetailField label="Vorname" value={details.vorname} onSave={(v) => setDetail('vorname', v)} />
        <DetailField label="Nachname" value={details.nachname} onSave={(v) => setDetail('nachname', v)} />
        <DetailField label="Jobtitel" value={details.jobtitel} onSave={(v) => setDetail('jobtitel', v)} />
        <DetailField label="Seniority" value={details.seniority} options={SENIORITY_OPTS} onSelect={(v) => setDetail('seniority', v)} />
        <DetailField label="Abteilung" value={details.abteilung} onSave={(v) => setDetail('abteilung', v)} />
        <DetailField label="Standort / Stadt" value={details.stadt} onSave={(v) => setDetail('stadt', v)} />
        <DetailField label="Land" value={details.land} options={LAND_OPTS} onSelect={(v) => setDetail('land', v)} />
        <DetailField label="Twitter / X" value={details.twitter} onSave={(v) => setDetail('twitter', v)} />

        {/* Kontaktdaten — in dezenter grauer Sub-Kachel (nur dieser Bereich grau) */}
        <div className="sm:col-span-2 bg-app-bg rounded-[10px] p-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailField label="E-Mail" type="email" copyable value={contact.email} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, email: v })); showToast('Gespeichert'); }} />
            <DetailField label="LinkedIn" copyable value={contact.linkedin} href={`https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, linkedin: v })); showToast('Gespeichert'); }} />
            <DetailField label="Webadresse" copyable value={contact.web} href={`https://${contact.web.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => { setContact((c) => ({ ...c, web: v })); showToast('Gespeichert'); }} />
          </div>
          <div className="mt-5">
            <DetailPhoneList
              phones={phones}
              types={PHONE_TYPES}
              onSetFavorite={setFavoritePhone}
              onUpdate={updatePhone}
              onAdd={addPhone}
              onRemove={removePhone}
              onCopy={() => showToast('Kopiert ✓')}
            />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Firma" icon={Building2}>
        <DetailField label="Firma" value={details.firma} onSave={(v) => setDetail('firma', v)} />
        <DetailField label="Branche" value={details.branche} options={BRANCHE_OPTS} onSelect={(v) => setDetail('branche', v)} />
        <DetailField label="Unternehmensgröße" value={details.groesse} options={GROESSE_OPTS} onSelect={(v) => setDetail('groesse', v)} />
        <DetailField label="Domain" copyable value={details.domain} href={`https://${details.domain.replace(/^https?:\/\//, '')}`} onCopy={() => showToast('Kopiert ✓')} onSave={(v) => setDetail('domain', v)} />
        <DetailField label="Stadt / HQ" value={details.firmaStadt} onSave={(v) => setDetail('firmaStadt', v)} />
        <DetailField label="Land" value={details.firmaLand} options={LAND_OPTS} onSelect={(v) => setDetail('firmaLand', v)} />
      </DetailSection>

      <DetailSection title="Klassifizierung" icon={Tag}>
        <DetailField label="Lead Status" value={details.leadStatus} options={LEAD_STATUS_OPTS} onSelect={(v) => setDetail('leadStatus', v)} />
        <DetailField label="ICP Score" value={details.icp} onSave={(v) => setDetail('icp', v)} />
        <DetailField label="Owner" value={details.owner} onSave={(v) => setDetail('owner', v)} />
        <DetailField label="Tags" value={details.tags} onSave={(v) => setDetail('tags', v)} />

        {/* System-gesetzte Status → read-only Badges (keine Input-Felder) */}
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-1.5">Contact Status</div>
          <StageBadge stage="Pipeline" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-1.5">Heat Status</div>
          <HeatBadge status="engaged" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-1.5">E-Mail verifiziert</div>
          <StatusBadge tone="success" icon={CheckCircle2} label="Verifiziert" />
        </div>
      </DetailSection>

      <DetailSection title="Notizen" icon={StickyNote} cols={1}>
        <textarea
          value={details.notiz}
          onChange={(e) => setDetails((d) => ({ ...d, notiz: e.target.value }))}
          onBlur={() => showToast('Notiz gespeichert')}
          rows={4}
          placeholder="Kontext, nächste Schritte, Hinweise…"
          className="w-full bg-transparent border border-transparent hover:border-border focus:border-[var(--sherloq-primary)] focus:bg-app-surface rounded-[10px] p-3 text-[13px] text-text-primary leading-relaxed outline-none resize-none transition-colors placeholder-[var(--text-muted)]"
        />
      </DetailSection>

      {/* System-Felder ganz unten, zusammengeklappt by default */}
      <DetailSection title="System" icon={Clock} collapsible defaultCollapsed>
        <DetailField label="Lead-Quelle" value="Manuell" readonly />
        <DetailField label="Erstellt am" value="12. März 2026" readonly />
        <DetailField label="Letzter Kontakt" value="vor 2 Tagen · E-Mail" readonly />
        <DetailField label="Letzte Antwort" value="vor 5 Tagen" readonly />
        <DetailField label="Enrichment-Quelle" value="Surfe" readonly />
        <DetailField label="CRM ID" value="HS-48213" readonly />
      </DetailSection>
    </div>
  );

  const panelBtn = "px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 flex items-center justify-center gap-1.5";
  const fullBtn = "px-4 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 flex items-center justify-center gap-1.5";

  // Panel-Variante — 820px Sheet (Layout unverändert).
  const panelBody = person && (
    <>
      <header className="p-7 pb-0 bg-app-surface items-start relative z-10 border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between gap-6">
          {identityBlock}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowVollansicht(true)} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute top-[58px] right-[58px] flex items-start gap-7 hidden md:flex">
          {statusBadgesInner}
        </div>

        <div className="mt-10">{contactPill}</div>
        <div className="mt-6">{tabNav}</div>
      </header>

      <main className="flex-1 overflow-y-auto p-7 space-y-7 bg-app-bg custom-scrollbar pb-28">
        {tabContent}
      </main>

      <footer className="p-4 border-t border-border-subtle bg-app-surface shrink-0 flex items-center justify-between gap-2 shadow-sm relative z-10">
        {renderActions(panelBtn)}
      </footer>
    </>
  );

  // Voll-Variante — echte Seite. Die gesamte Seite scrollt (ein Scroll-Container);
  // nur Topbar und Tab-Leiste bleiben per sticky oben stehen. Kein Panel-Inner-Scroll.
  const FULL_TABS = [
    { id: 'details', label: 'Details' },
    { id: 'overview', label: 'Übersicht' },
    { id: 'communication', label: 'Kommunikation' },
    { id: 'activity', label: 'Aktivität' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'notes', label: 'Notizen' },
  ];
  const fullBody = person && (
    <div className="fixed inset-0 z-[120] bg-app-bg font-sans overflow-y-auto animate-fade-in">
      {/* Steuer-Zeile — ← zurück zum Panel, ✕ schließt ganz. Kein Balken, scrollt mit. */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-5 flex items-center justify-between">
        <button onClick={onClose} aria-label="Zurück" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <button onClick={() => (onExit ?? onClose)()} aria-label="Schließen" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-app-surface transition-colors cursor-pointer">
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Hero — randlos direkt in die Seite integriert (keine Kachel) */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-3 pb-7">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {identityBlock}
          <div className="flex items-start gap-7 shrink-0">
            {statusBadgesInner}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-7">
          {renderActions(fullBtn)}
        </div>
      </div>

      {/* Tabs — sticky am oberen Rand, über die volle Breite */}
      <div className="sticky top-0 z-20 bg-app-bg border-b border-border-subtle">
        <nav className="max-w-[1100px] mx-auto px-5 sm:px-10 flex flex-nowrap gap-8 overflow-x-auto scrollbar-none">
          {FULL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-[13px] font-bold transition-colors shrink-0 ${activeTab === tab.id ? 'text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-text-body'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute left-0 right-0 bottom-0 bg-[var(--sherloq-primary)] rounded-t-full" style={{ height: '2px' }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Inhalt — scrollt mit der Seite */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-8">
        {activeTab === 'details' ? detailsContent : tabContent}
      </div>
    </div>
  );

  return (
    <>
    {variant === 'full' ? fullBody : (
      <Sheet open={isOpen && !showVollansicht} onOpenChange={(open) => { if (!open && !showVollansicht) onClose(); }}>
        <SheetContent
          side="drawer"
          className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
          style={{ width: 820, maxWidth: "95vw" }}
        >
          {panelBody}
        </SheetContent>
      </Sheet>
    )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {variant !== 'full' && showVollansicht && (
        <HunterSidepanel person={display} onClose={() => setShowVollansicht(false)} onExit={onClose} variant="full" />
      )}
    </>
  );
}
