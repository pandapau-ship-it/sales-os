/**
 * Avatar — Initialen-Fallback, optional Bild.
 * Größen: sm (28px) / md (36px) / lg (44px) — oder beliebige Pixelzahl (z.B. 40).
 * Form: rounded-full (Avatare sind app-weit rund — Kacheln, Panels, TopBar, Sidebar).
 * Kaputte Bild-URLs (onError) fallen automatisch auf Initialen zurück.
 */

import { useState } from "react";
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
  size?: AvatarSize | number;
  className?: string;
}

export default function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const px = typeof size === "number" ? size : PX[size];
  const font = typeof size === "number" ? "text-[13px]" : FONT[size];
  const showImg = Boolean(src) && !errored;
  return (
    <div
      style={{ width: px, height: px }}
      className={cn(
        "rounded-full overflow-hidden shrink-0 flex items-center justify-center select-none",
        "bg-sherloq-primary text-on-accent font-semibold",
        font,
        className,
      )}
      aria-label={name}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
