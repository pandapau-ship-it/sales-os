/**
 * CompanyAnlegenPanel — „Neue Company anlegen" (K-4a). Nutzt das BESTEHENDE Action-Panel-Muster
 * 1:1 wie `KontaktAnlegenPanel`/`AddSdrLeadPanel`: `panels/ActionPanel` (720px Sheet „drawer"),
 * Header h-[70px]/typo-card-title, `PanelField`-Wrapper, graue Feld-Füllung (`bg-app-bg`, `FIELD`),
 * Gradient-Submit im Footer. KEIN Eigenbau.
 *
 * Basis-Felder (K-4a): Name (Pflicht, einziges) · Domain · Branche · Größe. Weitere CRM-Felder
 * (Land/Website/LinkedIn/Umsatz/Subscription …) + Duplikat-Prüfung folgen mit K-4b/Datenqualität.
 * Enums zentral aus contactDetailFields (BRANCHE_OPTS/GROESSE_OPTS — Datenwerte, nicht übersetzt).
 * i18n: sichtbare Texte über t("companies.create.*").
 */
import { useState } from "react";
import { Building2, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import ActionPanel from "@/components/panels/ActionPanel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PanelField } from "@/components";
import { createCompany } from "@/lib/db";
import { BRANCHE_OPTS, GROESSE_OPTS } from "@/lib/contactDetailFields";
import { useToast } from "@/components/shared/toastContext";

const FIELD =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none transition-colors placeholder-[var(--text-muted)]";
const TRIGGER = "w-full rounded-[10px] border-border bg-app-bg text-[13px] font-semibold text-text-primary";

export default function CompanyAnlegenPanel({
  open, organizationId, onClose, onCreated,
}: {
  open: boolean;
  organizationId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <ActionPanel open={open} onClose={onClose}>
      {open && <AnlegenForm organizationId={organizationId} onClose={onClose} onCreated={onCreated} />}
    </ActionPanel>
  );
}

function AnlegenForm({
  organizationId, onClose, onCreated,
}: { organizationId: string; onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [sizeRange, setSizeRange] = useState("");
  const [saving, setSaving] = useState(false);

  const nameEmpty = name.trim().length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameEmpty || saving) return;
    setSaving(true);
    try {
      await createCompany(organizationId, {
        name: name.trim(),
        domain: domain.trim() || undefined,
        industry: industry || undefined,
        size_range: sizeRange || undefined,
      });
      toast(t("companies.create.savedToast", { name: name.trim() }), "success");
      onCreated();
    } catch {
      toast(t("companies.create.errorToast"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--sherloq-primary)]" />
          <h3 className="typo-card-title text-text-primary">{t("companies.create.title")}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label={t("common.close")} data-tip={t("common.close")} className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <PanelField label={t("companies.create.name")} required={nameEmpty}>
              <input type="text" autoFocus placeholder={t("companies.create.namePh")} value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
            </PanelField>
            <PanelField label={t("companies.create.domain")}>
              <input type="text" placeholder={t("companies.create.domainPh")} value={domain} onChange={(e) => setDomain(e.target.value)} className={FIELD} />
            </PanelField>
            <div className="grid grid-cols-2 gap-3">
              <PanelField label={t("companies.create.industry")}>
                <Select value={industry || undefined} onValueChange={setIndustry}>
                  <SelectTrigger className={TRIGGER}><SelectValue placeholder={t("companies.create.industryPh")} /></SelectTrigger>
                  <SelectContent>{BRANCHE_OPTS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </PanelField>
              <PanelField label={t("companies.create.size")}>
                <Select value={sizeRange || undefined} onValueChange={setSizeRange}>
                  <SelectTrigger className={TRIGGER}><SelectValue placeholder={t("companies.create.sizePh")} /></SelectTrigger>
                  <SelectContent>{GROESSE_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </PanelField>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-border-subtle p-4 flex items-center justify-end gap-2 bg-app-surface">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-[10px] border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer disabled:opacity-50">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={saving || nameEmpty} className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "var(--sherloq-gradient)" }}>
            <Check className="w-3.5 h-3.5" /> {t("companies.create.submit")}
          </button>
        </div>
      </form>
    </>
  );
}
