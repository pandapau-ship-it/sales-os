/**
 * Badge — einheitliches Status-Badge für alle Anzeigen.
 * Lucide-Icons (kein Emoji), Farben über Signal-Tokens (.pill-* Klassen).
 * Radius 7px (Badge-Ebene der Radius-Hierarchie).
 */

import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "success"
  | "warn"
  | "urgent"
  | "info"
  | "cold"
  | "teal"
  | "muted";

const PILL: Record<BadgeVariant, string> = {
  success: "pill-success",
  warn: "pill-warn",
  urgent: "pill-urgent",
  info: "pill-info",
  cold: "pill-cold",
  teal: "pill-teal",
  muted: "pill-muted",
};

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode; // Lucide-Komponente
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "muted", icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 w-fit rounded-[7px] border px-2.5 py-1 text-[11px] font-medium",
        PILL[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
