/**
 * KontaktAnlegenPanel — „Neuen Kontakt anlegen" (K-3 CP4). Rechtes Sheet.
 *
 * Pflicht (K1, validateContactRequired): (Vorname+Nachname) ODER LinkedIn-URL — amber-Hinweis.
 * Live-Duplikat (K2, findDuplicates, onBlur E-Mail/LinkedIn/Name+Company):
 *  - HARD (sicher, E-Mail/LinkedIn exakt) → rote Inline-Meldung + Speichern deaktiviert.
 *  - SOFT (möglich, Name+Company) → gelber Banner, Speichern bleibt aktiv.
 * Anlegen: findOrCreateCompany + createContact (lead_source=manual, Owner via K9). Alles echt.
 */
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { validateContactRequired } from "@/lib/contactValidation";
import { findDuplicates, createContact, findOrCreateCompany } from "@/lib/db";
import { SENIORITY_OPTS } from "@/lib/contactDetailFields";
import { useToast } from "@/components/shared/toastContext";

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
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" style={{ width: 560, maxWidth: "95vw" }} className="p-0 gap-0 flex flex-col h-full">
        {open && <AnlegenForm organizationId={organizationId} createdBy={createdBy} onClose={onClose} onCreated={onCreated} />}
      </SheetContent>
    </Sheet>
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

  const save = async () => {
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

  const label = "typo-field-label text-text-muted mb-1 block";
  const input = "w-full px-3.5 py-2.5 rounded-[8px] border bg-app-surface outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] text-text-body";

  return (
    <>
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-card)] shrink-0">
        <h2 className="text-[18px] font-extrabold text-text-primary">Neuen Kontakt anlegen</h2>
        <button onClick={onClose} aria-label="Schließen" data-tip="Schließen" className="w-8 h-8 rounded-full hover:bg-app-bg flex items-center justify-center text-text-muted cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      {/* Soft-Match-Banner (möglich, Name+Company) */}
      {dup?.level === "moeglich" && (
        <div className="mx-6 mt-4 px-3.5 py-2.5 rounded-[10px] bg-[var(--signal-warn-bg)] border border-[var(--color-warning-soft)]/25 flex items-start gap-2 text-[12px] text-text-body">
          <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
          <span>Mögliches Duplikat (gleicher Name + Firma). Du kannst trotzdem anlegen.</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Vorname{invalidReq && <span className="text-[var(--color-warning)]"> *</span>}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={checkDup} placeholder="z.B. Jane" className={`${input} ${invalidReq ? "border-[var(--color-warning-soft)]" : "border-border"}`} />
          </div>
          <div>
            <label className={label}>Nachname{invalidReq && <span className="text-[var(--color-warning)]"> *</span>}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={checkDup} placeholder="z.B. Doe" className={`${input} ${invalidReq ? "border-[var(--color-warning-soft)]" : "border-border"}`} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-widest"><span className="flex-1 h-px bg-border" />oder<span className="flex-1 h-px bg-border" /></div>

        <div>
          <label className={label}>LinkedIn-URL{invalidReq && <span className="text-[var(--color-warning)]"> *</span>}</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} onBlur={checkDup} placeholder="https://linkedin.com/in/…" className={`${input} ${invalidReq ? "border-[var(--color-warning-soft)]" : "border-border"}`} />
        </div>

        <div>
          <label className={label}>E-Mail</label>
          <input value={email} onChange={(e) => { setEmail(e.target.value); }} onBlur={checkDup} placeholder="name@company.com" className={`${input} ${hardDup ? "border-[var(--signal-urgent-text)]" : "border-border"}`} />
          {hardDup && (
            <p className="mt-1.5 text-[12px] text-signal-urgent flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Kontakt existiert bereits ({dup?.matchType === "email" ? "gleiche E-Mail" : "gleiche LinkedIn-URL"}).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Jobtitel</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="z.B. CEO" className={`${input} border-border`} />
          </div>
          <div>
            <label className={label}>Seniority</label>
            <Select value={seniority || undefined} onValueChange={setSeniority}>
              <SelectTrigger className="w-full rounded-[8px] border-border bg-app-surface text-[13px] text-text-body"><SelectValue placeholder="Auswählen…" /></SelectTrigger>
              <SelectContent>
                {SENIORITY_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className={label}>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} onBlur={checkDup} placeholder="Unternehmen suchen oder anlegen" className={`${input} border-border`} />
        </div>

        <div>
          <label className={label}>Notizen</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Zusätzliche Infos zum Kontakt…" className={`${input} border-border resize-none`} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-card)] shrink-0">
        <button onClick={onClose} disabled={saving} className="sherloq-btn-secondary disabled:opacity-50">Abbrechen</button>
        <button onClick={save} disabled={saving || hardDup} className="sherloq-btn-primary disabled:opacity-50 disabled:cursor-default">Kontakt anlegen</button>
      </div>
    </>
  );
}
