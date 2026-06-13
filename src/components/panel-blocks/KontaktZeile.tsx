/**
 * KontaktZeile — Kontaktdaten-Leiste (Mail · Telefon · LinkedIn · Web).
 * Präsentations-Block, extrahiert aus shared/HunterSidepanel.tsx. Interaktives
 * Inline-Edit / Mehrfach-Nummern lebt (noch) im HunterSidepanel; hier die Struktur.
 */
import { Mail, Phone, Globe } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

interface KontaktZeileProps {
  email: string;
  phone: string;
  linkedin: string;
  web: string;
}

export default function KontaktZeile({ email, phone, linkedin, web }: KontaktZeileProps) {
  return (
    <div className="bg-app-surface border border-border-subtle rounded-full px-5 py-3 flex items-center justify-start gap-4 text-[12px] text-text-muted shadow-sm">
      <span className="flex items-center gap-1.5 shrink-0"><Mail className="w-[13px] h-[13px] text-text-muted shrink-0" /><span className="truncate">{email}</span></span>
      <span className="h-4 w-px bg-border shrink-0" />
      <span className="flex items-center gap-1.5 shrink-0"><Phone className="w-[13px] h-[13px] text-text-muted" />{phone}</span>
      <span className="h-4 w-px bg-border shrink-0" />
      <span className="flex items-center gap-1.5 shrink-0"><LinkedinIcon className="w-[13px] h-[13px] text-text-muted" />{linkedin}</span>
      <span className="h-4 w-px bg-border shrink-0" />
      <span className="flex items-center gap-1.5 shrink-0"><Globe className="w-[13px] h-[13px] text-text-muted" />{web}</span>
    </div>
  );
}
