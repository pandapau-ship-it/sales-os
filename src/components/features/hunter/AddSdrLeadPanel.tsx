/**
 * AddSdrLeadPanel — Action-Side-Panel (580px) zum Anlegen eines SDR-Leads.
 * Felder: Anrede · Vorname/Nachname (getrennt) · Rolle (Combobox, frei) ·
 * Unternehmen (mit Bestands-Suche) · E-Mail · LinkedIn · Quelle · Telefonnummern
 * (Mobil/Geschäftlich/Privat, wie im Hunter-Panel) · Notizen.
 * NICHT erfasst: Lead-Heat (System berechnet) & KI-Kurzakte (KI befüllt nachträglich).
 */
import { useState } from "react";
import { Target, X, Check, Phone, Star, Plus, Trash2, Mail, Search, Building2 } from "lucide-react";
import ActionPanel from "@/components/panels/ActionPanel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import type { Lead } from "@/types";

// Bereits im System angelegte Unternehmen (Mock – käme später aus der DB)
const EXISTING_COMPANIES = [
  "LogixFlow GmbH", "CloudSphere AG", "DataPulse Corp", "Quantum Dynamics",
  "Growth Lab GmbH", "PayGuard AG", "Atrium Solutions", "Nexus Retail",
];
const ROLE_SUGGESTIONS = [
  "VP Sales", "Head of Sales", "Sales Director", "CRO", "CEO", "Founder",
  "Head of Business Development", "RevOps Manager", "SDR Lead", "Account Executive", "CMO",
];
const SOURCES = ["Manuell", "LinkedIn", "Sherloq Signal", "Empfehlung", "Event", "Website", "Kaltakquise"];
const ANREDEN = ["Herr", "Frau", "Divers"];
const PHONE_TYPES = ["Mobil", "Geschäftlich", "Privat"];

const FIELD =
  "w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const LABEL = "text-[11px] text-text-muted font-semibold block mb-1";

interface PhoneRow { id: number; type: string; number: string; favorite: boolean; }

interface AddSdrLeadPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}

export default function AddSdrLeadPanel({ open, onClose, onAdd }: AddSdrLeadPanelProps) {
  const [anrede, setAnrede] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [companyFocus, setCompanyFocus] = useState(false);
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [source, setSource] = useState("Manuell");
  const [phones, setPhones] = useState<PhoneRow[]>([{ id: 1, type: "Mobil", number: "", favorite: true }]);
  const [notes, setNotes] = useState("");

  const companyMatches = company.trim().length >= 1
    ? EXISTING_COMPANIES.filter((c) => c.toLowerCase().includes(company.trim().toLowerCase()) && c.toLowerCase() !== company.trim().toLowerCase())
    : [];
  const companyExists = EXISTING_COMPANIES.some((c) => c.toLowerCase() === company.trim().toLowerCase());

  const reset = () => {
    setAnrede(""); setVorname(""); setNachname(""); setRole(""); setCompany("");
    setEmail(""); setLinkedin(""); setSource("Manuell");
    setPhones([{ id: 1, type: "Mobil", number: "", favorite: true }]); setNotes("");
  };
  const close = () => onClose();

  const addPhone = () =>
    setPhones((p) => [...p, { id: Math.max(0, ...p.map((x) => x.id)) + 1, type: "Geschäftlich", number: "", favorite: false }]);
  const removePhone = (id: number) =>
    setPhones((p) => {
      const next = p.filter((x) => x.id !== id);
      if (next.length && !next.some((x) => x.favorite)) next[0].favorite = true;
      return [...next];
    });
  const setFav = (id: number) => setPhones((p) => p.map((x) => ({ ...x, favorite: x.id === id })));
  const patchPhone = (id: number, key: "type" | "number", val: string) =>
    setPhones((p) => p.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const canSubmit = (vorname.trim() && nachname.trim()) || linkedin.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const fullName = [vorname.trim(), nachname.trim()].filter(Boolean).join(" ") || linkedin.trim();
    const id = `lead-new-${Date.now()}`;
    const lead: Lead = {
      id,
      person: {
        id: `pers-new-${Date.now()}`,
        name: fullName,
        jobTitle: role.trim() || "Decision Maker",
        company: company.trim() || "—",
        initials: [vorname[0], nachname[0]].filter(Boolean).join("").toUpperCase() || "?",
      },
      kurzakte: "", // wird von der KI nachträglich befüllt
      fullTimeline: notes.trim() ? [notes.trim()] : ["Lead manuell angelegt."],
      engagementChain: ["LINKEDIN"],
      lastTouchpoints: [{ channel: "LINKEDIN", date: "gerade", sentiment: "neutral", summary: `Angelegt via ${source}` }],
      heatStatus: "WARM", // Heat wird vom System berechnet – Default neutral
      heatScore: 3,
      lastActivity: "Gerade eben",
      pipelineStage: "lead",
      contactEmail: email.trim() || "—",
    };
    onAdd(lead);
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
        <button type="button" onClick={close} aria-label="Schließen" className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5">

          {/* PERSON */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Person</p>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div>
                <label className={LABEL}>Anrede</label>
                <Select value={anrede || undefined} onValueChange={setAnrede}>
                  <SelectTrigger className="w-full rounded-[10px] border-border bg-app-bg text-[12px]">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANREDEN.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Vorname</label>
                  <input type="text" placeholder="Christian" value={vorname} onChange={(e) => setVorname(e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Nachname</label>
                  <input type="text" placeholder="Brand" value={nachname} onChange={(e) => setNachname(e.target.value)} className={FIELD} />
                </div>
              </div>
            </div>

            <div>
              <label className={LABEL}>Rolle</label>
              <input type="text" list="role-suggestions" placeholder="z. B. VP Sales (frei wählbar)" value={role} onChange={(e) => setRole(e.target.value)} className={FIELD} />
              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
          </section>

          {/* UNTERNEHMEN (mit Bestands-Suche) */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Unternehmen</p>
            <div className="relative">
              <label className={LABEL}>Firma</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Firma suchen oder neu eingeben…"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onFocus={() => setCompanyFocus(true)}
                  onBlur={() => setTimeout(() => setCompanyFocus(false), 120)}
                  className={`${FIELD} pl-9`}
                />
                {companyExists && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--icp-high)]">
                    <Check className="w-3 h-3" /> bestehend
                  </span>
                )}
              </div>
              {companyFocus && companyMatches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-app-surface border border-border rounded-[10px] shadow-lg z-30 overflow-hidden py-1 animate-fade-in">
                  <p className="px-3 py-1 text-[10px] text-text-muted font-semibold">Bereits angelegt</p>
                  {companyMatches.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setCompany(c); setCompanyFocus(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-body hover:bg-app-bg transition-colors text-left cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="font-medium">{c}</span>
                      <span className="ml-auto text-[10px] text-[var(--sherloq-primary)] font-semibold">auswählen</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* KONTAKT */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Kontakt</p>
            <div>
              <label className={LABEL}>E-Mail</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="email" placeholder="c.brand@firma.de" value={email} onChange={(e) => setEmail(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </div>
            <div>
              <label className={LABEL}>LinkedIn-URL</label>
              <div className="relative">
                <LinkedinIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="linkedin.com/in/…" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={`${FIELD} pl-9`} />
              </div>
            </div>

            {/* TELEFONNUMMERN */}
            <div>
              <label className={LABEL}>Telefonnummern</label>
              <div className="flex flex-col gap-2">
                {phones.map((ph) => (
                  <div key={ph.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFav(ph.id)}
                      aria-label="Als Favorit"
                      className={`w-9 h-9 shrink-0 rounded-[10px] border flex items-center justify-center transition-colors cursor-pointer ${ph.favorite ? "border-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "border-border text-text-muted hover:text-text-body"}`}
                    >
                      <Star className="w-3.5 h-3.5" fill={ph.favorite ? "currentColor" : "none"} />
                    </button>
                    <Select value={ph.type} onValueChange={(v) => patchPhone(ph.id, "type", v)}>
                      <SelectTrigger className="w-[130px] shrink-0 rounded-[10px] border-border bg-app-bg text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="tel" placeholder="+49 170 …" value={ph.number} onChange={(e) => patchPhone(ph.id, "number", e.target.value)} className={`${FIELD} pl-9`} />
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

          {/* META */}
          <section className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Einordnung</p>
            <div>
              <label className={LABEL}>Quelle</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full rounded-[10px] border-border bg-app-bg text-[12px] font-semibold text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={LABEL}>Notizen</label>
              <textarea placeholder="Kontext, nächste Schritte, Hinweise…" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-[12px] font-sans leading-relaxed p-3 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none resize-none transition-colors placeholder-[var(--text-muted)]" />
              <p className="text-[10px] text-text-muted mt-1">Lead-Heat &amp; KI-Kurzakte werden automatisch vom System ergänzt.</p>
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-border-subtle p-4 flex items-center justify-end gap-2 bg-app-surface">
          <button type="button" onClick={close} className="px-4 py-2 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
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
