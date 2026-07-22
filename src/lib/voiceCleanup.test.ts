import { describe, it, expect } from "vitest";
import { FIELD_IMPORTANCE } from "./fieldImportance";
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";

/**
 * Guard für [D-voice-altfelder-cleanup] (Migr. 085): die alten Voice-Sammel-Keys
 * `sentence_style`/`hooks` (Kanäle) und `themes` (overview) sind endgültig entfernt.
 * Diese Tests verhindern ein stilles Wieder-Einführen in Registry und i18n. Die DB-seitige
 * Ablehnung durch update_voice_profile wird zusätzlich remote per DO-Block verifiziert.
 */
describe("Voice-Altfelder-Cleanup (085) — Registry", () => {
  it("fieldImportance enthält KEINE alten Voice-Pfade mehr (sentence_style/hooks/themes)", () => {
    const badPaths = FIELD_IMPORTANCE.filter(
      (e) =>
        e.path === "voice.overview.themes" ||
        /^voice\.(post|comment|dm|email)\.(sentence_style|hooks)$/.test(e.path),
    );
    expect(badPaths).toEqual([]);
  });

  it("fieldImportance nutzt KEINE der entfernten Hint-Keys mehr", () => {
    const dead = new Set(["voiceThemes", "voiceHooks", "voiceSentenceStyle"]);
    expect(FIELD_IMPORTANCE.filter((e) => dead.has(e.hintKey))).toEqual([]);
  });
});

describe("Voice-Altfelder-Cleanup (085) — i18n de/en/es", () => {
  const locales = { de, en, es } as Record<string, Record<string, unknown>>;

  it("tote Voice-Keys sind in ALLEN drei Sprachen entfernt", () => {
    for (const [lang, d] of Object.entries(locales)) {
      const voice = d.voice as { field: Record<string, unknown>; overview: Record<string, unknown> };
      const hint = (d.company as { hint: Record<string, unknown> }).hint;
      expect(voice.field.writingStyle, `${lang} voice.field.writingStyle`).toBeUndefined();
      expect(voice.field.hooks, `${lang} voice.field.hooks`).toBeUndefined();
      expect(voice.overview.themes, `${lang} voice.overview.themes`).toBeUndefined();
      expect(hint.voiceThemes, `${lang} hint.voiceThemes`).toBeUndefined();
      expect(hint.voiceHooks, `${lang} hint.voiceHooks`).toBeUndefined();
      expect(hint.voiceSentenceStyle, `${lang} hint.voiceSentenceStyle`).toBeUndefined();
    }
  });

  it("die neuen Ersatz-Keys sind weiterhin in ALLEN drei Sprachen vorhanden", () => {
    for (const [lang, d] of Object.entries(locales)) {
      const voice = d.voice as { field: Record<string, unknown>; overview: Record<string, unknown> };
      const hint = (d.company as { hint: Record<string, unknown> }).hint;
      expect(voice.overview.coreTopics, `${lang} voice.overview.coreTopics`).toBeDefined();
      expect(voice.field.sentenceStructure, `${lang} voice.field.sentenceStructure`).toBeDefined();
      expect(voice.field.hookStrategies, `${lang} voice.field.hookStrategies`).toBeDefined();
      expect(hint.voiceCoreTopics, `${lang} hint.voiceCoreTopics`).toBeDefined();
      expect(hint.voiceSentenceStructure, `${lang} hint.voiceSentenceStructure`).toBeDefined();
    }
  });
});
