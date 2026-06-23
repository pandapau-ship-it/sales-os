/**
 * AddSdrLeadPanel — Side-Panel zum Anlegen eines SDR-Leads (Design).
 * Shell: panels/ActionPanel (50vw Sheet „drawer"). Nur Tokens aus index.css.
 * Progressive Disclosure:
 *   Stufe 1 (immer sichtbar, Pflicht): Vorname/Nachname · E-Mail ODER LinkedIn · Firma
 *   Stufe 2 (aufklappbar): Anrede · Rolle · Telefon · Owner · Quelle · Stage · Notizen
 *   Stufe 3 (optional): „+ Deal hinzufügen" → NewDealCard
 * Komponiert aus panel-blocks/: PanelField · PhoneNumbersField · NewDealCard.
 */
import { useState } from "react";
import { Target, X, Search, Mail, Info, Check, ChevronDown, Plus } from "lucide-react";
import ActionPanel from "@/components/panels/ActionPanel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { useToast } from "@/components/shared/Toast";
import { NewDealCard, PanelField, PhoneNumbersField } from '@/components';
import type { DealDraft, PhoneRow } from '@/components';
import type { Lead } from "@/types";

const ANREDEN = ["Herr", "Frau", "Dr.", "Prof."];
const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];
const SOURCES = ["Manuell", "Import", "Sherloq", "LinkedIn"];
const STAGES: { id: Lead["pipelineStage"]; label: string }[] = [
  { id: "lead", label: "Backlog" },
  { id: "pipeline", label: "Demo vereinbart" },
  { id: "signal", label: "Follow-up offen" },
  { id: "sequence", label: "Onboarding offen" },
  { id: "trial", label: "Free Trial" },
];
const EMPTY_DEAL: DealDraft = { name: "", product: "", value: "", owner: "", arr: "", mrr: "", close: "" };

const FIELD =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const TRIGGER = "w-full rounded-[10px] border-border bg-app-bg text-[13px] font-semibold text-text-primary";

interface AddSdrLeadPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (lead: Lead) => void;
}

export default function AddSdrLeadPanel({ open, onClose, onAdd }: AddSdrLeadPanelProps) {
  const { toast } = useToast();

  // Stufe 1 (Pflicht)
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [company, setCompany] = useState("");
  // Stufe 2 (aufklappbar)
  const [showMore, setShowMore] = useState(false);
  const [anrede, setAnrede] = useState("");
  const [role, setRole] = useState("");
  const [phones, setPhones] = useState<PhoneRow[]>([{ id: 1, type: "Mobil", number: "", primary: true }]);
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState("Manuell");
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  // Stufe 3 (optionaler Deal)
  const [showDeal, setShowDeal] = useState(false);
  const [deal, setDeal] = useState<DealDraft>(EMPTY_DEAL);

  const reset = () => {
    setVorname(""); setNachname(""); setEmail(""); setLinkedin(""); setCompany("");
    setShowMore(false); setAnrede(""); setRole(""); setPhones([{ id: 1, type: "Mobil", number: "", primary: true }]);
    setOwner(""); setSource("Manuell"); setStage(""); setNotes("");
    setShowDeal(false); setDeal(EMPTY_DEAL);
  };

  const canSubmit = Boolean(owner && vorname.trim() && nachname.trim() && (email.trim() || linkedin.trim()) && company.trim());
  const dealHint = stage !== "" && !showDeal; // Stage gewählt, aber noch kein Deal

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd?.({
      id: `lead-new-${Date.now()}`,
      person: {
        id: `pers-new-${Date.now()}`,
        name: `${vorname.trim()} ${nachname.trim()}`.trim(),
        jobTitle: role.trim() || "Decision Maker",
        company: company.trim(),
        initials: [vorname[0], nachname[0]].filter(Boolean).join("").toUpperCase() || "?",
      },
      kurzakte: "",
      fullTimeline: notes.trim() ? [notes.trim()] : ["Lead manuell angelegt."],
      engagementChain: ["LINKEDIN"],
      lastTouchpoints: [{ channel: "LINKEDIN", date: "gerade", sentiment: "neutral", summary: `Angelegt via ${source}` }],
      heatStatus: "WARM",
      heatScore: 3,
      lastActivity: "Gerade eben",
      pipelineStage: (stage || "lead") as Lead["pipelineStage"],
      contactEmail: email.trim() || linkedin.trim(),
      dealValue: showDeal && deal.value ? Number(deal.value) : undefined,
    });
    toast("Lead angelegt ✓");
    reset();
    onClose();
  };

  return (
    <ActionPanel open={open} onClose={onClose}>
      {/* HEADER */}
      <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--sherloq-primary)]" />
          <h3 className="typo-card-title text-text-primary">SDR Lead hinzufügen</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Schließen" data-tip="Schließen" className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">

          {/* STUFE 1 — Pflicht, immer sichtbar */}
          <section className="flex flex-col gap-3">
            <PanelField label="Owner" required>
              <Select value={owner || undefined} onValueChange={setOwner}>
                <SelectTrigger className={TRIGGER}><SelectValue placeholder="Zuständig…" /></SelectTrigger>
                <SelectContent>{OWNERS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </PanelField>

            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Vorname" required>
                <input type="text" placeholder="Christian" value={vorname} onChange={(e) => setVorname(e.target.value)} className={FIELD} />
              </PanelField>
              <PanelField label="Nachname" required>
                <input type="text" placeholder="Brand" value={nachname} onChange={(e) => setNachname(e.target.value)} className={FIELD} />
              </PanelField>
            </div>

            {/* E-Mail ODER LinkedIn — eines genügt */}
            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">
                E-Mail oder LinkedIn<span className="text-[var(--signal-danger-text)]"> *</span>
                <span className="font-normal text-text-muted"> — eines genügt</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="email" placeholder="c.brand@firma.de" value={email} onChange={(e) => setEmail(e.target.value)} className={`${FIELD} pl-9`} />
                </div>
                <div className="relative">
                  <LinkedinIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" placeholder="linkedin.com/in/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={`${FIELD} pl-9`} />
                </div>
              </div>
            </div>

            <PanelField label="Firma" required>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Firma suchen oder neu eingeben..." value={company} onChange={(e) => setCompany(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </PanelField>
          </section>

          {/* STUFE 2 — aufklappbar */}
          <div className="flex flex-col">
            <button type="button" onClick={() => setShowMore((v) => !v)} className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showMore ? "rotate-180" : ""}`} />
              Weitere Details
            </button>
            <div className={`grid transition-all duration-300 ease-out ${showMore ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <PanelField label="Anrede">
                      <Select value={anrede || "none"} onValueChange={(v) => setAnrede(v === "none" ? "" : v)}>
                        <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"><span className="text-text-muted">—</span></SelectItem>
                          {ANREDEN.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </PanelField>
                    <PanelField label="Rolle">
                      <input type="text" placeholder="z.B. VP Sales (frei wählbar)" value={role} onChange={(e) => setRole(e.target.value)} className={FIELD} />
                    </PanelField>
                  </div>

                  <PanelField label="Telefonnummern">
                    <PhoneNumbersField value={phones} onChange={setPhones} />
                  </PanelField>

                  <div className="grid grid-cols-2 gap-3">
                    <PanelField label="Quelle">
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </PanelField>
                    <PanelField label="Pipeline-Stage">
                      <Select value={stage || "none"} onValueChange={(v) => setStage(v === "none" ? "" : v)}>
                        <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"><span className="text-text-muted">— Keine Stage</span></SelectItem>
                          {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </PanelField>
                  </div>

                  <PanelField label="Notizen">
                    <textarea rows={3} placeholder="Kontext, nächste Schritte, Hinweise..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-[13px] font-sans leading-relaxed p-3 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none resize-none transition-colors placeholder-[var(--text-muted)]" />
                  </PanelField>
                </div>
              </div>
            </div>
          </div>

          {/* STUFE 3 — optionaler Deal */}
          <section className="flex flex-col gap-3">
            {showDeal ? (
              <NewDealCard deal={deal} onChange={(p) => setDeal((d) => ({ ...d, ...p }))} owners={OWNERS} onRemove={() => setShowDeal(false)} />
            ) : (
              <button type="button" onClick={() => setShowDeal(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-[var(--sherloq-primary)] text-[12px] font-bold text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Deal hinzufügen
              </button>
            )}
          </section>
        </div>

        {/* HINWEIS-BANNER — Stage gewählt, aber kein Deal */}
        {dealHint && (
          <div className="shrink-0 px-4 pt-3">
            <div className="flex items-start gap-2 p-3 rounded-[10px] bg-[var(--signal-info-bg)] border border-[var(--border-card)]">
              <Info className="w-4 h-4 shrink-0 mt-px text-[var(--signal-teal-text)]" />
              <p className="text-[11px] font-semibold leading-relaxed text-[var(--signal-teal-text)]">
                Fast geschafft — füge einen Deal hinzu oder speichere ohne Deal.
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="shrink-0 border-t border-border-subtle p-4 flex items-center justify-end gap-2 bg-app-surface">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
            Abbrechen
          </button>
          <button type="submit" disabled={!canSubmit} className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--sherloq-gradient)" }}>
            <Check className="w-3.5 h-3.5" /> Lead anlegen
          </button>
        </div>
      </form>
    </ActionPanel>
  );
}
