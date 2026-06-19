/**
 * Avatar — die EINZIGE Avatar-Primitive der App. Bild (optional) mit automatischem
 * Fallback auf Initialen (helle Teal-Fläche + Teal-Initialen, app-weit einheitlich).
 * Nur Parameter unterscheiden die Vorkommen:
 *   - `size`: sm/md/lg (28/36/44) ODER beliebige Pixelzahl (Schrift skaliert mit).
 *   - `radius`: ohne Angabe Kreis (rounded-full); mit Wert = abgerundetes Quadrat (px).
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
  /** Eckenradius in px → abgerundetes Quadrat. Ohne Angabe: Kreis. */
  radius?: number;
  className?: string;
}

export default function Avatar({ name, src, size = "md", radius, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const isNumeric = typeof size === "number";
  const px = isNumeric ? (size as number) : PX[size as AvatarSize];
  // Schrift: bei benannten Größen feste Klasse, bei Pixel-Größen proportional skaliert.
  const fontClass = isNumeric ? "" : FONT[size as AvatarSize];
  const showImg = Boolean(src) && !errored;
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: radius ?? 9999,
        ...(isNumeric ? { fontSize: Math.round(px * 0.36) } : {}),
      }}
      className={cn(
        "overflow-hidden shrink-0 flex items-center justify-center select-none",
        // Fallback (ohne Bild): helle Teal-Fläche + Teal-Initialen — app-weit einheitlich.
        "bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] font-semibold",
        fontClass,
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
