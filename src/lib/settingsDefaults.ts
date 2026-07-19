/**
 * settingsDefaults — Defaults & Whitelists für Settings SET-2 an EINER Stelle (Bauplan §7 Falle 3).
 *
 * Spiegel der DB-Whitelist in Migr. 073 (`update_general_settings`) — gemeinsam pflegen. Kein
 * verhaltenssteuernder Wert im [D51]-Sinn (reine UI-/Format-Präferenzen), aber zentral gehalten,
 * damit Merge-Lesen (getGeneralSettings) und die künftige UI dieselben Defaults nutzen.
 */

// ── Allgemein (org-weit, settings.general) ───────────────────────────────────
export interface GeneralSettings {
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
}

export const GENERAL_DEFAULTS: GeneralSettings = {
  language: "de",
  timezone: "Europe/Berlin",
  date_format: "DD.MM.YYYY",
  currency: "EUR",
};

export const ALLOWED_LANGUAGES = ["de", "en", "es"] as const;
export const ALLOWED_CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;
export const ALLOWED_DATE_FORMATS = ["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;

/** Merge: DB-Werte über die Defaults legen (fehlende Keys → Default). */
export function mergeGeneral(raw: Partial<GeneralSettings> | null | undefined): GeneralSettings {
  return { ...GENERAL_DEFAULTS, ...(raw ?? {}) };
}

// ── Mein Profil ──────────────────────────────────────────────────────────────
export const BOOKING_PROVIDERS = ["calendly", "cal_com", "google_calendar"] as const;
export type BookingProvider = (typeof BOOKING_PROVIDERS)[number];

export interface MyProfile {
  full_name: string | null;
  avatar_url: string | null;
  booking_provider: string | null;
  booking_link: string | null;
  signature: string | null;
  // Voice-Profil: kommt mit SET-KB-2/Onboarding (eigene Tabelle voice_profiles) — hier bewusst „Folgt".
}

// ── Ansicht (Navigation pro User) ────────────────────────────────────────────
// Rein visuell (NIE ein Recht). `settings` ist NIE ausblendbar. Ausgeblendetes bleibt per
// Deeplink/Chat erreichbar (die Sidebar filtert nur die Icon-Anzeige). Getrennt vom Org-Modul-System.
export const NAV_PREF_KEY = "nav.layout";

/** Kanonische, ausblendbare/sortierbare Nav-Einträge (Reihenfolge = Default). `settings` NICHT enthalten. */
export const NAV_HIDEABLE = ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] as const;

export interface NavPreferences {
  hidden: string[]; // ausgeblendete Routen (nie 'settings')
  order: string[];  // Reihenfolge der ausblendbaren Einträge
}

export const NAV_DEFAULTS: NavPreferences = { hidden: [], order: [...NAV_HIDEABLE] };

/** Merge + Reparatur: unbekannte/fehlende Einträge korrigieren, `settings` nie versteckt. */
export function mergeNav(raw: Partial<NavPreferences> | null | undefined): NavPreferences {
  const valid = new Set<string>(NAV_HIDEABLE);
  const hidden = (raw?.hidden ?? []).filter((r) => valid.has(r) && r !== "settings");
  // Reihenfolge: gespeicherte gültige zuerst, fehlende kanonisch anhängen (nie ein Eintrag verloren).
  const savedOrder = (raw?.order ?? []).filter((r) => valid.has(r));
  const order = [...savedOrder, ...NAV_HIDEABLE.filter((r) => !savedOrder.includes(r))];
  return { hidden, order };
}
