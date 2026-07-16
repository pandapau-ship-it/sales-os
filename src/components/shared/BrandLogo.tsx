/**
 * BrandLogo — lädt ein statisches Kanal-Logo aus `public/brand/<name>.svg`
 * (z. B. das offizielle Marken-SVG) und zeigt es als <img>. Fehlt die Datei,
 * wird automatisch auf den eingebauten, tokensicheren Glyph (BrandIcons /
 * LinkedinIcon) zurückgefallen — so bricht nichts, bevor die offiziellen
 * Assets hinterlegt sind. Dateien austauschen → siehe public/brand/README.md.
 */
import { useState } from "react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { GmailIcon, OutlookIcon, TeamsIcon, GoogleMeetIcon } from "@/components/shared/BrandIcons";
import type { BrandName } from "@/lib/brand";

/** Eingebauter Fallback-Glyph je Kanal (gerundete Marken-Kachel). */
function FallbackGlyph({ name, className }: { name: BrandName; className?: string }) {
  switch (name) {
    case "gmail":
      return <GmailIcon className={className} />;
    case "outlook":
      return <OutlookIcon className={className} />;
    case "teams":
      return <TeamsIcon className={className} />;
    case "google-meet":
      return <GoogleMeetIcon className={className} />;
    case "linkedin":
      return (
        <span className={`inline-flex items-center justify-center bg-[var(--channel-linkedin)] text-on-accent ${className ?? ""}`}>
          <LinkedinIcon className="w-1/2 h-1/2" />
        </span>
      );
  }
}

/**
 * @param className  Größe/Rundung (z. B. `w-11 h-11 rounded-[12px]`).
 * @param tile       Logo zentriert auf einer sauberen Surface-Kachel rendern —
 *                   für die meist transparenten Original-Logos (Gmail/Outlook/Meet),
 *                   damit sie in Light- UND Dark-Mode konsistent als Karte sitzen.
 */
export default function BrandLogo({
  name, className, tile = false,
}: { name: BrandName; className?: string; tile?: boolean }) {
  const [failed, setFailed] = useState(false);
  const inner = failed ? (
    <FallbackGlyph name={name} className={tile ? "w-3/4 h-3/4" : className} />
  ) : (
    <img
      src={`/brand/${name}.svg`}
      alt=""
      aria-hidden="true"
      className={tile ? "w-3/4 h-3/4 object-contain" : className}
      onError={() => setFailed(true)}
    />
  );
  if (tile) {
    return (
      <span className={`inline-flex items-center justify-center bg-app-surface border border-border ${className ?? ""}`}>
        {inner}
      </span>
    );
  }
  return inner;
}
