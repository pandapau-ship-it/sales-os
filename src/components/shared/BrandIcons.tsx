/**
 * BrandIcons — vereinfachte, eigenständige Marken-Glyphen für Kommunikationskanäle.
 * Jedes Icon ist eine gerundete Marken-Kachel (Markenfarbe aus index.css-Tokens) mit
 * weißem Symbol — KEINE 1:1-Logo-Reproduktion, nur eine erkennbare Kanal-Kennzeichnung.
 * Farben kommen ausschließlich aus CSS-Tokens (kein Hex hier → Dark-Mode-/Audit-sicher).
 * lucide-react liefert diese Marken nicht, daher inline (wie LinkedinIcon).
 */
interface BrandIconProps {
  className?: string;
}

/** Gmail — rotes Tile, weißer „M"-Umschlag. */
export function GmailIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--brand-gmail)" />
      <path d="M6 9.2V16h2v-3.9l4 2.9 4-2.9V16h2V9.2l-6 4.3L6 9.2Z" fill="var(--on-accent)" />
    </svg>
  );
}

/** Outlook — blaues Tile, weißer Umschlag (Linien-Stil). */
export function OutlookIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--brand-outlook)" />
      <rect x="6.5" y="8" width="11" height="8" rx="1.4" fill="none" stroke="var(--on-accent)" strokeWidth="1.6" />
      <path d="m6.9 9.2 5.1 3.3 5.1-3.3" fill="none" stroke="var(--on-accent)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Microsoft Teams — lila Tile, weißes „T" mit Personen-Punkt. */
export function TeamsIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--channel-teams)" />
      <circle cx="15.5" cy="8" r="1.7" fill="var(--on-accent)" />
      <path d="M7 8h7v2.1h-2.45V17H9.45v-6.9H7V8Z" fill="var(--on-accent)" />
    </svg>
  );
}

/** Google (Auth) — blaues Tile, weißes „G". */
export function GoogleIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--brand-google)" />
      <path
        d="M12 8.2c1.05 0 1.99.36 2.73 1.07l1.45-1.45A6 6 0 1 0 18 12c0-.4-.04-.79-.11-1.16H12v2.2h3.36a2.9 2.9 0 0 1-1.25 1.9 3.5 3.5 0 0 1-1.9.53 3.5 3.5 0 1 1 0-7Z"
        fill="var(--on-accent)"
      />
    </svg>
  );
}

/** Microsoft (Auth) — graphit Tile, weißes 2×2-Fenster-Raster. */
export function MicrosoftIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--brand-microsoft)" />
      <rect x="7" y="7" width="4.2" height="4.2" fill="var(--on-accent)" />
      <rect x="12.8" y="7" width="4.2" height="4.2" fill="var(--on-accent)" />
      <rect x="7" y="12.8" width="4.2" height="4.2" fill="var(--on-accent)" />
      <rect x="12.8" y="12.8" width="4.2" height="4.2" fill="var(--on-accent)" />
    </svg>
  );
}

/** Google Meet — grünes Tile, weiße Videokamera. */
export function GoogleMeetIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--brand-meet)" />
      <path
        d="M7 9.6c0-.6.5-1.1 1.1-1.1h4.4c.6 0 1.1.5 1.1 1.1v1.1l2.7-1.8c.4-.3 1 0 1 .5v5.2c0 .5-.6.8-1 .5L13.6 13.3v1.1c0 .6-.5 1.1-1.1 1.1H8.1c-.6 0-1.1-.5-1.1-1.1V9.6Z"
        fill="var(--on-accent)"
      />
    </svg>
  );
}
