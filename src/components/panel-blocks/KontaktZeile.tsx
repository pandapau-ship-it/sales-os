/**
 * KontaktZeile — interaktive Kontaktdaten-Leiste (Mail · Telefon · LinkedIn · Web).
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx: E-Mail/LinkedIn/Web inline
 * editierbar (EditableInline, Copy + Stift), Telefon via PhoneField (Favorit/Mehrfach).
 * Prop-driven — State + Toasts liegen beim Aufrufer.
 */
import { Fragment, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Globe, Copy, Pencil, Check } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import EditableInline from "./EditableInline";
import PhoneField, { type Phone as PhoneEntry } from "./PhoneField";

type ContactField = "email" | "linkedin" | "web";

interface KontaktZeileProps {
  contact: { email: string; linkedin: string; web: string };
  phones: PhoneEntry[];
  /** P2 read-only: nur vorhandene Werte als Links (mailto/tel/href), fehlende ausgeblendet,
   *  kein Inline-Edit (das kommt mit P8). */
  readonly?: boolean;
  /** Read-only Copy-Feedback (Toast beim Aufrufer); echter Clipboard-Write passiert intern. */
  onCopied?: () => void;
  onSaveField?: (field: ContactField, value: string) => void;
  onCopyField?: (field: ContactField) => void;
  onSetFavorite?: (id: string) => void;
  onUpdateNumber?: (id: string, number: string) => void;
  onCopyPhone?: () => void;
  onAddPhone?: () => void;
}

const PILL = "bg-app-surface border border-border-subtle rounded-full px-5 py-3 flex items-center gap-3 text-[12px] text-text-muted shadow-sm";
const LINK = "text-text-body hover:text-[var(--sherloq-primary)] transition-colors truncate";
// Hover-Aktionen (CLAUDE.md HOVER_ACTIONS-Muster, benannte Group pro Eintrag).
const HOVER_BTN = "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition shrink-0";

type ReadItem = { key: string; Icon: ComponentType<{ className?: string }>; value: string; href: string; ext?: boolean };

/** Read-only Kontaktzeile (P2): nur vorhandene Werte als Link; Hover → Copy (echt) + Stift (P8, deaktiviert). */
function KontaktZeileReadonly({ contact, phones, onCopied }: { contact: { email: string; linkedin: string; web: string }; phones: PhoneEntry[]; onCopied?: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const doCopy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value); // reine Komfort-/Lese-Funktion, kein DB-Write
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
    onCopied?.();
  };

  const phone = phones.find((p) => p.favorite)?.number || phones[0]?.number || "";
  const items: ReadItem[] = [];
  if (contact.email) items.push({ key: "email", Icon: Mail, value: contact.email, href: `mailto:${contact.email}` });
  if (phone) items.push({ key: "phone", Icon: Phone, value: phone, href: `tel:${phone.replace(/\s+/g, "")}` });
  if (contact.linkedin) items.push({ key: "linkedin", Icon: LinkedinIcon, value: contact.linkedin, href: `https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, "")}`, ext: true });
  if (contact.web) items.push({ key: "web", Icon: Globe, value: contact.web, href: `https://${contact.web.replace(/^https?:\/\//, "")}`, ext: true });

  if (items.length === 0) return null; // kein Kontaktweg vorhanden → ganze Zeile unsichtbar
  return (
    <div className={PILL}>
      {items.map((it, i) => {
        const Icon = it.Icon;
        return (
          <Fragment key={it.key}>
            {i > 0 && <span className="h-4 w-px bg-border shrink-0" />}
            <span className="group/item flex items-center gap-1.5 min-w-0">
              <Icon className="w-[13px] h-[13px] text-text-muted shrink-0" />
              <a href={it.href} {...(it.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={LINK}>{it.value}</a>
              {/* Copy — voll funktionsfähig (Clipboard) */}
              <button
                onClick={() => doCopy(it.key, it.value)}
                aria-label={t("hunter.panel.copy")} data-tip={t("hunter.panel.copy")}
                className={`${HOVER_BTN} text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer`}
              >
                {copied === it.key ? <Check className="w-3 h-3 text-[var(--sherloq-primary)]" /> : <Copy className="w-3 h-3" />}
              </button>
              {/* Bearbeiten — sichtbar, aber deaktiviert (echtes Edit kommt mit P8) */}
              <button
                disabled
                aria-label={t("hunter.panel.editComing")} data-tip={t("hunter.panel.editComing")}
                className={`${HOVER_BTN} text-text-muted cursor-not-allowed`}
              >
                <Pencil className="w-3 h-3 opacity-40" />
              </button>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

export default function KontaktZeile({
  contact, phones, readonly, onCopied,
  onSaveField = () => {}, onCopyField = () => {}, onSetFavorite = () => {},
  onUpdateNumber = () => {}, onCopyPhone = () => {}, onAddPhone = () => {},
}: KontaktZeileProps) {
  if (readonly) return <KontaktZeileReadonly contact={contact} phones={phones} onCopied={onCopied} />;
  return (
    <div className="bg-app-surface border border-border-subtle rounded-full px-5 py-3 flex items-center justify-between gap-3 text-[12px] text-text-muted shadow-sm">
      <span className="flex items-center gap-1.5 min-w-0">
        <Mail className="w-[13px] h-[13px] text-text-muted shrink-0" />
        <EditableInline label="E-Mail" type="email" value={contact.email} onSave={(v) => onSaveField('email', v)} onCopy={() => onCopyField('email')} />
      </span>
      <span className="h-4 w-px bg-border shrink-0"></span>
      <span className="flex items-center gap-1.5 shrink-0">
        <Phone className="w-[13px] h-[13px] text-text-muted" />
        <PhoneField
          phones={phones}
          onSetFavorite={onSetFavorite}
          onUpdateNumber={onUpdateNumber}
          onCopy={onCopyPhone}
          onAdd={onAddPhone}
        />
      </span>
      <span className="h-4 w-px bg-border shrink-0"></span>
      <span className="flex items-center gap-1.5 shrink-0">
        <LinkedinIcon className="w-[13px] h-[13px] text-text-muted" />
        <EditableInline label="LinkedIn" value={contact.linkedin} href={`https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, '')}`} onSave={(v) => onSaveField('linkedin', v)} onCopy={() => onCopyField('linkedin')} />
      </span>
      <span className="h-4 w-px bg-border shrink-0"></span>
      <span className="flex items-center gap-1.5 shrink-0">
        <Globe className="w-[13px] h-[13px] text-text-muted" />
        <EditableInline label="Webadresse" value={contact.web} href={`https://${contact.web.replace(/^https?:\/\//, '')}`} onSave={(v) => onSaveField('web', v)} onCopy={() => onCopyField('web')} />
      </span>
    </div>
  );
}
