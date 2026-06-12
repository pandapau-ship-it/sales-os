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

export type BrandName = "gmail" | "outlook" | "teams" | "google-meet" | "linkedin";

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

export default function BrandLogo({ name, className }: { name: BrandName; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <FallbackGlyph name={name} className={className} />;
  return (
    <img
      src={`/brand/${name}.svg`}
      alt=""
      aria-hidden="true"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
