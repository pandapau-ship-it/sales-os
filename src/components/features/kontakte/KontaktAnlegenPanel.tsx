/**
 * KontaktAnlegenPanel — „Neuen Kontakt anlegen" (K-3). Nutzt das BESTEHENDE Action-Panel-Muster
 * 1:1 wie `AddSdrLeadPanel` (Hunter → „SDR Lead hinzufügen"): `panels/ActionPanel` (720px Sheet
 * „drawer"), Header h-[70px]/typo-card-title, `PanelField`-Wrapper, graue Feld-Füllung (`bg-app-bg`,
 * `FIELD`), Gradient-Submit im Footer. KEIN Eigenbau — Single Source der Panel-/Feld-Optik.
 *
 * Pflicht (K1, validateContactRequired): (Vorname+Nachname) ODER LinkedIn-URL.
 * Live-Duplikat (K2, findDuplicates, onBlur E-Mail/LinkedIn/Name+Company):
 *  - HARD (sicher, E-Mail/LinkedIn exakt) → rote Inline-Meldung + Speichern deaktiviert.
 *  - SOFT (möglich, Name+Company) → gelber Banner, Speichern bleibt aktiv.
 * Anlegen: findOrCreateCompany + createContact (lead_source=manual, Owner via K9). Alles echt.
 */
import { useState } from "react";
import { UserPlus, X, Mail, Search, Check, AlertTriangle } from "lucide-react";
import ActionPanel from "@/components/panels/ActionPanel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { PanelField } from "@/components";
import { validateContactRequired } from "@/lib/contactValidation";
import { findDuplicates, createContact, findOrCreateCompany } from "@/lib/db";
import { SENIORITY_OPTS } from "@/lib/contactDetailFields";
import { useToast } from "@/components/shared/toastContext";

// Feld-Optik = Kanon aus AddSdrLeadPanel: graue Füllung (bg-app-bg), 10px Radius.
const FIELD =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const TRIGGER = "w-full rounded-[10px] border-border bg-app-bg text-[13px] font-semibold text-text-primary";

type DupState = { level: "sicher" | "moeglich"; matchType: string } | null;

export default function KontaktAnlegenPanel({
  open,
  organizationId,
  createdBy,
  onClose,
  onCreated,
}: {
  open: boolean;
  organizationId: string;
  createdBy: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <ActionPanel open={open} onClose={onClose}>
      {open && <AnlegenForm organizationId={organizationId} createdBy={createdBy} onClose={onClose} onCreated={onCreated} />}
    </ActionPanel>
  );
}

function AnlegenForm({
  organizationId, createdBy, onClose, onCreated,
}: { organizationId: string; createdBy: string | null; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [seniority, setSeniority] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [dup, setDup] = useState<DupState>(null);
  const [saving, setSaving] = useState(false);

  const req = validateContactRequired({ first_name: firstName, last_name: lastName, linkedin_url: linkedin });
  const invalidReq = touched && !req.ok;
  const hardDup = dup?.level === "sicher";

  // Duplikat-Check (K2) — org-gescopt, gegen die aktuellen Eingaben.
  const checkDup = async () => {
    if (!firstName && !lastName && !email && !linkedin) { setDup(null); return; }
    const hit = await findDuplicates(
      { email: email || null, linkedin_url: linkedin || null, first_name: firstName || null, last_name: lastName || null, company_name: company || null },
      organizationId,
    );
    setDup(hit ? { level: hit.level, matchType: hit.matchType } : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!req.ok || hardDup) return;
    setSaving(true);
    try {
      const company_id = company.trim() ? await findOrCreateCompany(organizationId, company) : null;
      await createContact(organizationId, {
        first_name: firstName, last_name: lastName, linkedin_url: linkedin, email,
        job_title: jobTitle, seniority, company_id, notes,
      }, createdBy);
      toast("Kontakt angelegt ✓", "success");
      onCreated();
    } catch {
      toast("Konnte gerade nicht anlegen — nochmal versuchen", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* HEADER — identisch zu AddSdrLeadPanel */}
      <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[var(--sherloq-primary)]" />
          <h3 className="typo-card-title text-text-primary">Neuen Kontakt anlegen</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Schließen" data-tip="Schließen" className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">

          {/* Soft-Match-Banner (möglich, Name+Company) */}
          {dup?.level === "moeglich" && (
            <div className="flex items-start gap-2 p-3 rounded-[10px] bg-[var(--signal-warn-bg)] border border-[var(--border-card)]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px text-[var(--signal-warn-text)]" />
              <p className="text-[11px] font-semibold leading-relaxed text-[var(--signal-warn-text)]">
                Mögliches Duplikat (gleicher Name + Firma). Du kannst trotzdem anlegen.
              </p>
            </div>
          )}

          {/* Pflicht: Name */}
          <section className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Vorname" required={invalidReq}>
                <input type="text" placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={checkDup} className={FIELD} />
              </PanelField>
              <PanelField label="Nachname" required={invalidReq}>
                <input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={checkDup} className={FIELD} />
              </PanelField>
            </div>

            {/* E-Mail ODER LinkedIn — eines genügt */}
            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">
                E-Mail oder LinkedIn{invalidReq && <span className="text-[var(--signal-urgent-text)]"> *</span>}
                <span className="font-normal text-text-muted"> — Name oder LinkedIn genügt</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={checkDup} className={`${FIELD} pl-9 ${hardDup ? "border-[var(--signal-urgent-text)]" : ""}`} />
                </div>
                <div className="relative">
                  <LinkedinIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" placeholder="linkedin.com/in/…" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} onBlur={checkDup} className={`${FIELD} pl-9 ${hardDup ? "border-[var(--signal-urgent-text)]" : ""}`} />
                </div>
              </div>
              {hardDup && (
                <p className="mt-1.5 text-[12px] text-signal-urgent flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Kontakt existiert bereits ({dup?.matchType === "email" ? "gleiche E-Mail" : "gleiche LinkedIn-URL"}).
                </p>
              )}
            </div>

            <PanelField label="Firma">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Firma suchen oder neu eingeben…" value={company} onChange={(e) => setCompany(e.target.value)} onBlur={checkDup} className={`${FIELD} pl-9`} />
              </div>
            </PanelField>

            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Jobtitel">
                <input type="text" placeholder="z.B. CEO" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={FIELD} />
              </PanelField>
              <PanelField label="Seniority">
                <Select value={seniority || undefined} onValueChange={setSeniority}>
                  <SelectTrigger className={TRIGGER}><SelectValue placeholder="Auswählen…" /></SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PanelField>
            </div>

            <PanelField label="Notizen">
              <textarea rows={3} placeholder="Kontext, nächste Schritte, Hinweise…" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-[13px] font-sans leading-relaxed p-3 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none resize-none transition-colors placeholder-[var(--text-muted)]" />
            </PanelField>
          </section>
        </div>

        {/* FOOTER — identisch zu AddSdrLeadPanel */}
        <div className="shrink-0 border-t border-border-subtle p-4 flex items-center justify-end gap-2 bg-app-surface">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer disabled:opacity-50">
            Abbrechen
          </button>
          <button type="submit" disabled={saving || hardDup} className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--sherloq-gradient)" }}>
            <Check className="w-3.5 h-3.5" /> Kontakt anlegen
          </button>
        </div>
      </form>
    </>
  );
}
