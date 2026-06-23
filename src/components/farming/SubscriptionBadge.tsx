/**
 * SubscriptionBadge — Vertragsstatus-Pille der Farmer-Kacheln. Form 1:1 wie HeatBadge
 * (rounded-full · kein Border · text-[12px] font-medium), einziger Unterschied: Lucide-Icon
 * (Vertragsstatus) statt Dot (Aktivitätslevel). Stil/Icon kommen aus customerStatusConfig
 * (Flexibilitäts-Prinzip, nie hardcodiert). Genutzt im Farmer-Signals-Tab via HunterCard-statusBadge-Slot.
 */
import { cn } from "@/lib/utils";
import { resolveCustomerStatus } from "./customerStatusConfig";

export default function SubscriptionBadge({ status }: { status: string | null | undefined }) {
  const cfg = resolveCustomerStatus(status);
  const Icon = cfg.icon;
  return (
    <div
      className={cn(
        "px-2.5 py-1 rounded-full text-[12px] font-medium flex items-center gap-1.5 w-fit whitespace-nowrap",
        cfg.bg,
        cfg.text,
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </div>
  );
}
