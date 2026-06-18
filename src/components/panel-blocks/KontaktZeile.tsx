/**
 * KontaktZeile — interaktive Kontaktdaten-Leiste (Mail · Telefon · LinkedIn · Web).
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx: E-Mail/LinkedIn/Web inline
 * editierbar (EditableInline, Copy + Stift), Telefon via PhoneField (Favorit/Mehrfach).
 * Prop-driven — State + Toasts liegen beim Aufrufer.
 */
import { Fragment, type ReactNode } from "react";
import { Mail, Phone, Globe } from "lucide-react";
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
  onSaveField?: (field: ContactField, value: string) => void;
  onCopyField?: (field: ContactField) => void;
  onSetFavorite?: (id: string) => void;
  onUpdateNumber?: (id: string, number: string) => void;
  onCopyPhone?: () => void;
  onAddPhone?: () => void;
}

const PILL = "bg-app-surface border border-border-subtle rounded-full px-5 py-3 flex items-center gap-3 text-[12px] text-text-muted shadow-sm";
const LINK = "text-text-body hover:text-[var(--sherloq-primary)] transition-colors truncate";

/** Read-only Kontaktzeile (P2): nur vorhandene Werte, jeweils als Link; leer → unsichtbar. */
function KontaktZeileReadonly({ contact, phones }: { contact: { email: string; linkedin: string; web: string }; phones: PhoneEntry[] }) {
  const phone = phones.find((p) => p.favorite)?.number || phones[0]?.number || "";
  const items: ReactNode[] = [];
  if (contact.email) items.push(
    <span key="email" className="flex items-center gap-1.5 min-w-0">
      <Mail className="w-[13px] h-[13px] text-text-muted shrink-0" />
      <a href={`mailto:${contact.email}`} className={LINK}>{contact.email}</a>
    </span>);
  if (phone) items.push(
    <span key="phone" className="flex items-center gap-1.5 shrink-0">
      <Phone className="w-[13px] h-[13px] text-text-muted" />
      <a href={`tel:${phone.replace(/\s+/g, "")}`} className={LINK}>{phone}</a>
    </span>);
  if (contact.linkedin) items.push(
    <span key="linkedin" className="flex items-center gap-1.5 shrink-0">
      <LinkedinIcon className="w-[13px] h-[13px] text-text-muted" />
      <a href={`https://www.linkedin.com/${contact.linkedin.replace(/^\/+/, "")}`} target="_blank" rel="noopener noreferrer" className={LINK}>{contact.linkedin}</a>
    </span>);
  if (contact.web) items.push(
    <span key="web" className="flex items-center gap-1.5 shrink-0">
      <Globe className="w-[13px] h-[13px] text-text-muted" />
      <a href={`https://${contact.web.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className={LINK}>{contact.web}</a>
    </span>);

  if (items.length === 0) return null; // kein Kontaktweg vorhanden → ganze Zeile unsichtbar
  return (
    <div className={PILL}>
      {items.map((node, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="h-4 w-px bg-border shrink-0" />}
          {node}
        </Fragment>
      ))}
    </div>
  );
}

export default function KontaktZeile({
  contact, phones, readonly,
  onSaveField = () => {}, onCopyField = () => {}, onSetFavorite = () => {},
  onUpdateNumber = () => {}, onCopyPhone = () => {}, onAddPhone = () => {},
}: KontaktZeileProps) {
  if (readonly) return <KontaktZeileReadonly contact={contact} phones={phones} />;
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
