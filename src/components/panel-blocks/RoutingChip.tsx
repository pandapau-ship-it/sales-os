/**
 * RoutingChip — zeigt, wo ein Kontakt aktuell bearbeitet wird (K-3 Kontakte-Liste, „Routing"-Spalte).
 * Abgeleitet aus contact_status (kontakteMappers.routingFor). Klick → Sprung zum Ziel-Screen.
 * null-Routing → nichts (Honesty). Lucide-Icons, Tokens-only.
 */
import { Bot, Target, Sprout, ArrowRight, type LucideIcon } from "lucide-react";
import type { ContactRouting } from "@/lib/kontakteMappers";

const CFG: Record<ContactRouting, { label: string; icon: LucideIcon; path: string }> = {
  ai_sdr: { label: "In AI SDR", icon: Bot, path: "/app/ai-sdr" },
  hunter: { label: "In Hunter", icon: Target, path: "/app/hunter" },
  farmer: { label: "In Farmer", icon: Sprout, path: "/app/farmer" },
};

export default function RoutingChip({
  routing,
  onNavigate,
}: {
  routing: ContactRouting | null;
  onNavigate?: (path: string) => void;
}) {
  if (!routing) return null;
  const cfg = CFG[routing];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onNavigate?.(cfg.path); }}
      className="group/route inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11px] font-semibold text-text-body border border-border hover:border-[var(--sherloq-primary)] hover:text-[var(--sherloq-primary)] transition-colors w-fit cursor-pointer"
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
      <ArrowRight className="w-3 h-3 opacity-60 group-hover/route:translate-x-0.5 transition-transform" />
    </button>
  );
}
