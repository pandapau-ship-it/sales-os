/**
 * AddSdrLeadPanel — Side-Panel zum Anlegen eines SDR-Leads (Design).
 * Shell: panels/ActionPanel (50vw Sheet „drawer"). Nur Tokens aus index.css.
 * Sektionen: Person · Unternehmen · Kontakt · Einordnung · Deal.
 * Pflicht: Vorname, Nachname, E-Mail, Owner. Speichern → Toast „Lead angelegt ✓".
 */
import { useState } from "react";
import { Target, X, Search, Mail, Phone, Star, Plus, Trash2, Briefcase, Euro, Calendar, Info, Check } from "lucide-react";
import ActionPanel from "@/components/panels/ActionPanel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { useToast } from "@/components/shared/Toast";
import type { Lead } from "@/types";

const ANREDEN = ["Herr", "Frau", "Dr.", "Prof."];
const PHONE_TYPES = ["Mobil", "Büro", "Direkt"];
const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];
const SOURCES = ["Manuell", "Import", "Sherloq", "LinkedIn"];
const STAGES: { id: Lead["pipelineStage"]; label: string }[] = [
  { id: "lead", label: "Backlog" },
  { id: "pipeline", label: "Demo vereinbart" },
  { id: "signal", label: "Follow-up offen" },
  { id: "sequence", label: "Onboarding offen" },
  { id: "trial", label: "Free Trial" },
];

const FIELD =
  "w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const FIELD_SURFACE =
  "w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-surface border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const TRIGGER = "w-full rounded-[10px] border-border bg-app-bg text-[12px] font-semibold text-text-primary";
const LABEL = "text-[11px] text-text-muted font-semibold block mb-1";
const Req = () => <span className="text-[var(--signal-danger-text)]"> *</span>;

interface PhoneRow { id: number; type: string; number: string; primary: boolean; }

interface AddSdrLeadPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (lead: Lead) => void;
}

export default function AddSdrLeadPanel({ open, onClose, onAdd }: AddSdrLeadPanelProps) {
  const { toast } = useToast();

  // Person
  const [anrede, setAnrede] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [role, setRole] = useState("");
  // Unternehmen
  const [company, setCompany] = useState("");
  // Kontakt
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phones, setPhones] = useState<PhoneRow[]>([{ id: 1, type: "Mobil", number: "", primary: true }]);
  // Einordnung
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState("Manuell");
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  // Deal
  const [showDeal, setShowDeal] = useState(true);
  const [dealValue, setDealValue] = useState("");
  const [dealOwner, setDealOwner] = useState("");
  const [dealArr, setDealArr] = useState("");
  const [dealMrr, setDealMrr] = useState("");
  const [dealClose, setDealClose] = useState("");

  const reset = () => {
    setAnrede(""); setVorname(""); setNachname(""); setRole(""); setCompany("");
    setEmail(""); setLinkedin(""); setPhones([{ id: 1, type: "Mobil", number: "", primary: true }]);
    setOwner(""); setSource("Manuell"); setStage(""); setNotes("");
    setShowDeal(true); setDealValue(""); setDealOwner(""); setDealArr(""); setDealMrr(""); setDealClose("");
  };

  const addPhone = () =>
    setPhones((p) => [...p, { id: Math.max(0, ...p.map((x) => x.id)) + 1, type: "Büro", number: "", primary: false }]);
  const removePhone = (id: number) =>
    setPhones((p) => {
      const next = p.filter((x) => x.id !== id);
      if (next.length && !next.some((x) => x.primary)) next[0].primary = true;
      return [...next];
    });
  const setPrimary = (id: number) => setPhones((p) => p.map((x) => ({ ...x, primary: x.id === id })));
  const patchPhone = (id: number, key: "type" | "number", val: string) =>
    setPhones((p) => p.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const canSubmit = Boolean(vorname.trim() && nachname.trim() && email.trim() && owner);
  const stageHint = stage === ""; // Hinweis sichtbar, solange keine Stage gewählt

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const fullName = `${vorname.trim()} ${nachname.trim()}`.trim();
    onAdd?.({
      id: `lead-new-${Date.now()}`,
      person: {
        id: `pers-new-${Date.now()}`,
        name: fullName,
        jobTitle: role.trim() || "Decision Maker",
        company: company.trim() || "—",
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
      contactEmail: email.trim(),
      dealValue: showDeal && dealValue ? Number(dealValue) : undefined,
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
          <h3 className="text-[15px] font-bold text-text-primary">SDR Lead hinzufügen</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Schließen" className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">

          {/* PERSON */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Person</p>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div>
                <label className={LABEL}>Anrede</label>
                <Select value={anrede || "none"} onValueChange={(v) => setAnrede(v === "none" ? "" : v)}>
                  <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-text-muted">—</span></SelectItem>
                    {ANREDEN.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Vorname<Req /></label>
                  <input type="text" placeholder="Christian" value={vorname} onChange={(e) => setVorname(e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Nachname<Req /></label>
                  <input type="text" placeholder="Brand" value={nachname} onChange={(e) => setNachname(e.target.value)} className={FIELD} />
                </div>
              </div>
            </div>
            <div>
              <label className={LABEL}>Rolle</label>
              <input type="text" placeholder="z.B. VP Sales (frei wählbar)" value={role} onChange={(e) => setRole(e.target.value)} className={FIELD} />
            </div>
          </section>

          {/* UNTERNEHMEN */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Unternehmen</p>
            <div>
              <label className={LABEL}>Firma</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Firma suchen oder neu eingeben..." value={company} onChange={(e) => setCompany(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </div>
          </section>

          {/* KONTAKT */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Kontakt</p>
            <div>
              <label className={LABEL}>E-Mail<Req /></label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="email" placeholder="c.brand@firma.de" value={email} onChange={(e) => setEmail(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </div>
            <div>
              <label className={LABEL}>LinkedIn-URL</label>
              <div className="relative">
                <LinkedinIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="linkedin.com/in/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </div>
            {/* TELEFONNUMMERN */}
            <div>
              <label className={LABEL}>Telefonnummern</label>
              <div className="flex flex-col gap-2">
                {phones.map((ph) => (
                  <div key={ph.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => setPrimary(ph.id)} aria-label="Primär markieren"
                      className={`w-9 h-9 shrink-0 rounded-[10px] border flex items-center justify-center transition-colors cursor-pointer ${ph.primary ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border text-text-muted hover:text-text-body"}`}>
                      <Star className="w-3.5 h-3.5" fill={ph.primary ? "currentColor" : "none"} />
                    </button>
                    <Select value={ph.type} onValueChange={(v) => patchPhone(ph.id, "type", v)}>
                      <SelectTrigger className="w-[120px] shrink-0 rounded-[10px] border-border bg-app-bg text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PHONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="tel" placeholder="+49 170 ..." value={ph.number} onChange={(e) => patchPhone(ph.id, "number", e.target.value)} className={`${FIELD} pl-9`} />
                    </div>
                    {phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(ph.id)} aria-label="Nummer entfernen" className="w-9 h-9 shrink-0 rounded-[10px] text-text-muted hover:text-[var(--signal-danger-text)] hover:bg-app-bg flex items-center justify-center transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPhone} className="self-start inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 transition-opacity cursor-pointer mt-0.5">
                  <Plus className="w-3.5 h-3.5" /> Nummer hinzufügen
                </button>
              </div>
            </div>
          </section>

          {/* EINORDNUNG */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Einordnung</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Owner<Req /></label>
                <Select value={owner || undefined} onValueChange={setOwner}>
                  <SelectTrigger className={TRIGGER}><SelectValue placeholder="Zuständig…" /></SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={LABEL}>Quelle</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Pipeline-Stage</label>
              <Select value={stage || "none"} onValueChange={(v) => setStage(v === "none" ? "" : v)}>
                <SelectTrigger className={TRIGGER}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none"><span className="text-text-muted">— Keine Stage</span></SelectItem>
                  {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={LABEL}>Notizen</label>
              <textarea rows={3} placeholder="Kontext, nächste Schritte, Hinweise..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-[12px] font-sans leading-relaxed p-3 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none resize-none transition-colors placeholder-[var(--text-muted)]" />
            </div>
          </section>

          {/* DEAL */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Deal</p>
            {showDeal ? (
              <div className="rounded-[12px] border border-border bg-app-bg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[var(--sherloq-primary)]" />
                    <span className="text-[12px] font-bold text-text-primary">Neuer Deal</span>
                  </div>
                  <button type="button" onClick={() => setShowDeal(false)} className="text-[11px] font-semibold text-text-muted hover:text-[var(--signal-danger-text)] transition-colors cursor-pointer">
                    entfernen
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Wert / Betrag</label>
                    <div className="relative">
                      <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="number" min="0" step="100" placeholder="25000" value={dealValue} onChange={(e) => setDealValue(e.target.value)} className={`${FIELD_SURFACE} pl-9`} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Owner</label>
                    <Select value={dealOwner || undefined} onValueChange={setDealOwner}>
                      <SelectTrigger className="w-full rounded-[10px] border-border bg-app-surface text-[12px]"><SelectValue placeholder="Zuständig…" /></SelectTrigger>
                      <SelectContent>
                        {OWNERS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>ARR <span className="font-normal text-text-muted">(optional)</span></label>
                    <div className="relative">
                      <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="number" min="0" step="100" placeholder="12000" value={dealArr} onChange={(e) => setDealArr(e.target.value)} className={`${FIELD_SURFACE} pl-9`} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>MRR <span className="font-normal text-text-muted">(optional)</span></label>
                    <div className="relative">
                      <Euro className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="number" min="0" step="100" placeholder="1000" value={dealMrr} onChange={(e) => setDealMrr(e.target.value)} className={`${FIELD_SURFACE} pl-9`} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Abschluss-Datum (erwartet)</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="date" value={dealClose} onChange={(e) => setDealClose(e.target.value)} className={`${FIELD_SURFACE} pl-9 pr-3 text-text-body`} />
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowDeal(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-dashed border-border text-[12px] font-semibold text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer">
                <Briefcase className="w-4 h-4" /> Deal anlegen
              </button>
            )}
          </section>
        </div>

        {/* HINWEIS-BANNER (über Footer) */}
        {stageHint && (
          <div className="shrink-0 px-4 pt-3">
            <div className="flex items-start gap-2 p-3 rounded-[10px] bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)]">
              <Info className="w-4 h-4 shrink-0 mt-px text-[var(--signal-teal-text)]" />
              <p className="text-[11px] font-semibold leading-relaxed text-[var(--signal-teal-text)]">
                Fast geschafft — wähle oben die Pipeline-Stage, in der dieser Deal starten soll, dann kannst du speichern.
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
