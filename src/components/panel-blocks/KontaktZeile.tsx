/**
 * KontaktZeile — interaktive Kontaktdaten-Leiste (Mail · Telefon · LinkedIn · Web).
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx: E-Mail/LinkedIn/Web inline
 * editierbar (EditableInline, Copy + Stift), Telefon via PhoneField (Favorit/Mehrfach).
 * Prop-driven — State + Toasts liegen beim Aufrufer.
 */
import { Mail, Phone, Globe } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import EditableInline from "./EditableInline";
import PhoneField, { type Phone as PhoneEntry } from "./PhoneField";

type ContactField = "email" | "linkedin" | "web";

interface KontaktZeileProps {
  contact: { email: string; linkedin: string; web: string };
  phones: PhoneEntry[];
  onSaveField: (field: ContactField, value: string) => void;
  onCopyField: (field: ContactField) => void;
  onSetFavorite: (id: string) => void;
  onUpdateNumber: (id: string, number: string) => void;
  onCopyPhone: () => void;
  onAddPhone: () => void;
}

export default function KontaktZeile({
  contact, phones, onSaveField, onCopyField, onSetFavorite, onUpdateNumber, onCopyPhone, onAddPhone,
}: KontaktZeileProps) {
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
