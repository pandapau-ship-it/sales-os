/**
 * useLanguage — read + switch the active UI language.
 *
 * Thin wrapper over react-i18next so components never import i18next directly.
 * Persistence + the actual switch live in lib/i18n.ts (single mutation point).
 *
 * Usage:
 *   const { language, setLanguage, languages } = useLanguage();
 */

import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  setLanguage,
  type Language,
} from "@/lib/i18n";

export function useLanguage(): {
  language: Language;
  setLanguage: (lng: Language) => void;
  languages: typeof SUPPORTED_LANGUAGES;
} {
  const { i18n } = useTranslation();
  const current = i18n.language as Language;
  const language = SUPPORTED_LANGUAGES.includes(current)
    ? current
    : DEFAULT_LANGUAGE;

  return { language, setLanguage, languages: SUPPORTED_LANGUAGES };
}
