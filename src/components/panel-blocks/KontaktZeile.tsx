/**
 * KontaktZeile — interaktive Kontaktdaten-Leiste (Mail · Telefon · LinkedIn · Web).
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx: E-Mail/LinkedIn/Web inline
 * editierbar (EditableInline, Copy + Stift), Telefon via PhoneField (Favorit/Mehrfach).
 * Prop-driven — State + Toasts liegen beim Aufrufer.
 */
import { Fragment, useState, useRef, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Globe, Copy, Pencil, Check } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import EditableInline from "./EditableInline";
import PhoneField, { type Phone as PhoneEntry } from "./PhoneField";
import { isValidEmail, isValidUrl, normalizeUrl } from "@/lib/validation";

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
  /** Read-only Deep-Link: Stift öffnet die Vollansicht mit Fokus auf dieses Feld (statt Inline-Edit). */
  onEditField?: (field: ContactField) => void;
  onSetFavorite?: (id: string) => void;
  onUpdateNumber?: (id: string, number: string) => void;
  onCopyPhone?: () => void;
  onAddPhone?: () => void;
  onRemovePhone?: (id: string) => void;
  onUpdateLabel?: (id: string, label: string) => void;
  phoneTypes?: string[];
}

const PILL = "bg-app-surface border border-[var(--border-card)] rounded-full px-5 py-3 flex items-center gap-3 text-[12px] text-text-muted";
const LINK = "text-text-body hover:text-[var(--sherloq-primary)] transition-colors truncate";
// Hover-Aktionen (CLAUDE.md HOVER_ACTIONS-Muster, benannte Group pro Eintrag).
const HOVER_BTN = "opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition shrink-0";

type ReadItem = { key: string; Icon: ComponentType<{ className?: string }>; value: string; href: string; ext?: boolean };

/** Read-only Kontaktzeile (P2): nur vorhandene Werte als Link; Hover → Copy (echt) + Stift (P8, deaktiviert). */
function KontaktZeileReadonly({ contact, phones, onCopied, onSaveField, onSetFavorite, onUpdateNumber, onAddPhone, onRemovePhone, onUpdateLabel, phoneTypes }: { contact: { email: string; linkedin: string; web: string }; phones: PhoneEntry[]; onCopied?: () => void; onEditField?: (field: ContactField) => void; onSaveField?: (field: ContactField, value: string) => void; onSetFavorite?: (id: string) => void; onUpdateNumber?: (id: string, number: string) => void; onAddPhone?: () => void; onRemovePhone?: (id: string) => void; onUpdateLabel?: (id: string, label: string) => void; phoneTypes?: string[] }) {
  // Telefon im readonly: Popover immer. Schreiben (Favorit/Edit/Add/Löschen/Label) nur mit echten Handlern (PH3).
  const phonesEditable = !!(onSetFavorite || onUpdateNumber || onAddPhone);
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const doCopy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value); // reine Komfort-/Lese-Funktion, kein DB-Write
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
    onCopied?.();
  };

  // FIX 1: E-Mail/LinkedIn/Web INLINE editierbar (wie Telefon) — Klick auf Stift → Input direkt in der Zeile,
  // Enter/Blur speichert (onSaveField), Escape bricht ab. Validierung + Fehlertext direkt hier. Der Weg in die
  // Vollansicht bleibt zusätzlich über den Vollansicht-Pfeil im Panel-Header (kein doppelter Button hier).
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const skipSaveRef = useRef(false);
  const FIELD_VALIDATE: Record<string, ((v: string) => boolean) | undefined> = {
    email: isValidEmail,
    web: (v) => isValidUrl(normalizeUrl(v)),
    linkedin: undefined,
  };
  const FIELD_ERROR: Record<string, string> = {
    email: "Bitte eine gültige E-Mail eingeben (mit @).",
    web: "Bitte eine gültige Adresse eingeben (mit https://).",
    linkedin: "",
  };
  const beginEdit = (key: string, value: string) => { setDraft(value); setInvalid(false); setEditKey(key); };
  const cancelEdit = () => { setEditKey(null); setInvalid(false); };
  const saveEdit = (key: string) => {
    const v = draft.trim();
    const validate = FIELD_VALIDATE[key];
    if (v !== "" && validate && !validate(v)) { setInvalid(true); return; } // ungültig → Hinweis, Edit bleibt offen
    onSaveField?.(key as ContactField, v); // leer erlaubt (Feld leeren); Caller → updateContact/updateCompany
    setEditKey(null); setInvalid(false);
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
        // Telefon: PhoneField (readonly) → Popover mit allen Nummern (Anrufen/Kopieren, Favorit statisch).
        if (it.key === "phone") {
          return (
            <Fragment key={it.key}>
              {i > 0 && <span className="h-4 w-px bg-border shrink-0" />}
              <span className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-[13px] h-[13px] text-text-muted shrink-0" />
                <PhoneField
                  readonly={!phonesEditable}
                  phones={phones}
                  onSetFavorite={onSetFavorite}
                  onUpdateNumber={onUpdateNumber}
                  onAdd={onAddPhone}
                  onRemove={onRemovePhone}
                  onUpdateLabel={onUpdateLabel}
                  types={phoneTypes}
                  onCopy={() => onCopied?.()}
                />
              </span>
            </Fragment>
          );
        }
        return (
          <Fragment key={it.key}>
            {i > 0 && <span className="h-4 w-px bg-border shrink-0" />}
            <span className="group/item flex items-center gap-1.5 min-w-0">
              <Icon className="w-[13px] h-[13px] text-text-muted shrink-0" />
              {editKey === it.key ? (
                <span className="relative inline-flex items-center">
                  <input
                    autoFocus
                    type={it.key === "email" ? "email" : "text"}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); if (invalid) setInvalid(false); }}
                    onBlur={() => { if (skipSaveRef.current) { skipSaveRef.current = false; cancelEdit(); return; } saveEdit(it.key); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                      if (e.key === "Escape") { e.preventDefault(); skipSaveRef.current = true; e.currentTarget.blur(); }
                    }}
                    className={`w-[190px] max-w-full rounded-[8px] border bg-app-bg px-2.5 py-1 text-[12px] font-semibold text-text-primary outline-none ${invalid ? "border-[var(--signal-urgent-text)]" : "border-[var(--sherloq-primary)]"}`}
                  />
                  {invalid && <span className="absolute top-full left-0 mt-1 text-[10px] font-semibold text-[var(--signal-urgent-text)] whitespace-nowrap">{FIELD_ERROR[it.key]}</span>}
                </span>
              ) : (
                <>
                  <a href={it.href} {...(it.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={LINK}>{it.value}</a>
                  {/* Copy — voll funktionsfähig (Clipboard) */}
                  <button
                    onClick={() => doCopy(it.key, it.value)}
                    aria-label={t("hunter.panel.copy")} data-tip={t("hunter.panel.copy")}
                    className={`${HOVER_BTN} text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer`}
                  >
                    {copied === it.key ? <Check className="w-3 h-3 text-[var(--sherloq-primary)]" /> : <Copy className="w-3 h-3" />}
                  </button>
                  {/* Bearbeiten — INLINE direkt in der Zeile (Stift). Nur wenn Schreib-Handler da ist (kein toter Button). */}
                  {onSaveField && (
                    <button
                      onClick={() => beginEdit(it.key, it.value)}
                      aria-label={t("hunter.common.edit")} data-tip={t("hunter.common.edit")}
                      className={`${HOVER_BTN} text-text-muted hover:text-[var(--sherloq-primary)] cursor-pointer`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

export default function KontaktZeile({
  contact, phones, readonly, onCopied,
  onSaveField = () => {}, onCopyField = () => {}, onEditField, onSetFavorite,
  onUpdateNumber, onCopyPhone = () => {}, onAddPhone, onRemovePhone, onUpdateLabel, phoneTypes,
}: KontaktZeileProps) {
  // readonly-Zeile: Telefon-Popover bleibt; Schreiben nur, wenn echte Phone-Handler übergeben werden (PH3).
  if (readonly) return <KontaktZeileReadonly contact={contact} phones={phones} onCopied={onCopied} onEditField={onEditField} onSaveField={onSaveField} onSetFavorite={onSetFavorite} onUpdateNumber={onUpdateNumber} onAddPhone={onAddPhone} onRemovePhone={onRemovePhone} onUpdateLabel={onUpdateLabel} phoneTypes={phoneTypes} />;
  return (
    <div className="bg-app-surface border border-[var(--border-card)] rounded-full px-5 py-3 flex items-center justify-between gap-3 text-[12px] text-text-muted">
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
          onRemove={onRemovePhone}
          onUpdateLabel={onUpdateLabel}
          types={phoneTypes}
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
