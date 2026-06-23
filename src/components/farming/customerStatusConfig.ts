/**
 * customerStatusConfig — Subscription-Status der Farmer-Kunden-Kachel (Flexibilitäts-Prinzip:
 * NIE hardcodiert in Komponenten). Heute lokales Mock-Config-Objekt, später aus settings (DB).
 * Keys = echter `Customer.sherloqStatus` (lowercase). Unbekannte Werte (z. B. trial) → grauer
 * Fallback mit dem Slug als Label → Erweiterung ohne Code-Change in den Komponenten.
 * Nur Token-Klassen (kein Hex), Icons nur Lucide.
 */
import { CheckCircle2, XCircle, Clock, type LucideIcon } from "lucide-react";

export interface CustomerStatusStyle {
  label: string;
  bg: string;     // Token-Klasse (bg-[var(--…)])
  text: string;   // Token-Klasse
  border: string; // Token-Klasse, nur /15 Opacity (CLAUDE Badge-Border-Regel)
  icon: LucideIcon;
}

// Subscription-Badge = Vertragsstatus: Lucide-Icon + rounded-[7px] + Border /15
// (bewusst anders als die HeatBadge-Pille: Dot + rounded-full, siehe CLAUDE.md).
export const CUSTOMER_STATUS_CONFIG: Record<string, CustomerStatusStyle> = {
  active: {
    label: "Aktiv",
    bg: "bg-[var(--signal-success-bg)]",
    text: "text-signal-success",
    border: "border-[var(--signal-success-text)]/15",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Gekündigt",
    bg: "bg-[var(--signal-urgent-bg)]",
    text: "text-signal-urgent",
    border: "border-[var(--signal-urgent-text)]/15",
    icon: XCircle,
  },
};

/** Neutraler Fallback für nicht konfigurierte Status (z. B. trial / trial_expired). */
const CUSTOMER_STATUS_FALLBACK: CustomerStatusStyle = {
  label: "—",
  bg: "bg-app-bg",
  text: "text-text-muted",
  border: "border-[var(--border-card)]/15",
  icon: Clock,
};

/** Status-Slug → Style. Unbekannt → grauer Fallback mit dem Slug als Label. */
export function resolveCustomerStatus(status: string | null | undefined): CustomerStatusStyle {
  const key = (status ?? "").toLowerCase();
  return CUSTOMER_STATUS_CONFIG[key] ?? { ...CUSTOMER_STATUS_FALLBACK, label: status || "—" };
}
