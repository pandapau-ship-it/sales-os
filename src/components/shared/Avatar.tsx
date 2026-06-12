/**
 * Avatar — Initialen-Fallback, optional Bild.
 * Größen: sm (28px) / md (36px) / lg (44px).
 * Form: rounded-[10px] (Avatar-Ebene der Radius-Hierarchie, CLAUDE.md) —
 * konsistent mit den Avataren in TopBar/Sidebar.
 */

import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 44 };
const FONT: Record<AvatarSize, string> = {
  sm: "text-[10px]",
  md: "text-[12px]",
  lg: "text-[14px]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

export default function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = PX[size];
  return (
    <div
      style={{ width: px, height: px }}
      className={cn(
        "rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center select-none",
        "bg-sherloq-primary text-white font-semibold",
        FONT[size],
        className,
      )}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
