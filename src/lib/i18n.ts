/**
 * i18n.ts — single entry point for internationalisation (i18next + react-i18next).
 *
 * Architecture rules (see CLAUDE.md → "Internationalisierung (i18n)"):
 * - Every UI string (labels, buttons, menus, errors, tooltips, system text) lives
 *   in src/locales/<lng>.json — NEVER hardcoded in JSX.
 * - Default language is German ("de"); EN/ES fall back to DE until translated.
 * - User-entered content (contacts, notes, messages) is NEVER translated — only
 *   system UI. Such content must therefore never be routed through t().
 * - The chosen language is persisted in localStorage under "language".
 *
 * Resources are imported statically (bundled JSON), so there is no async load and
 * no React Suspense boundary is required.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";

export const SUPPORTED_LANGUAGES = ["de", "en", "es"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "de";
const STORAGE_KEY = "language";

/** Reads the persisted language, falling back to the default when unset/invalid. */
export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(stored as Language)
    ? (stored as Language)
    : DEFAULT_LANGUAGE;
}

/** Switches language app-wide and persists the choice. Single mutation point. */
export function setLanguage(lng: Language): void {
  localStorage.setItem(STORAGE_KEY, lng);
  void i18n.changeLanguage(lng);
}

void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
  },
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  // React already escapes output → disable i18next's own escaping.
  interpolation: { escapeValue: false },
  // Bundled resources load synchronously; no Suspense needed.
  react: { useSuspense: false },
  returnNull: false,
});

export default i18n;
