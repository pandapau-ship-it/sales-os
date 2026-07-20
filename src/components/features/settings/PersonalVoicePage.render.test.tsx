// @vitest-environment jsdom
/**
 * Personal Voice (Slice 2/3). Prüft die Zusagen dieses Slices am gerenderten UI:
 * fünf Kanäle (inkl. email) · durchgehend sichtbare Eingabefelder (kein Read-Mode) ·
 * EIN Schreibweg (updateVoiceProfile mit shallow patch je Feld) · KI-Aktionen sichtbar
 * aber „Folgt" (kein Fake) · echte Profil-Vorschau · Vollständigkeits-Ring aus derselben
 * Registry · KEIN primary_channel-UI (bewusst weggelassen).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => {
  const t = (k: string, o?: Record<string, unknown>) =>
    o && typeof o === "object" ? `${k}:${JSON.stringify(o)}` : k;
  return { useTranslation: () => ({ t }) };
});
vi.mock("@/hooks/useCurrentOrg", () => ({
  useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false, provisioningError: false }),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }),
}));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const updateVoiceProfile = vi.fn((_patch: unknown) => Promise.resolve());

let VOICE: Record<string, unknown> = {};
const PROFILE = { full_name: "Oliver Sand", email: "oliver@sherloq.io", avatar_url: null };

vi.mock("@/lib/db", () => ({
  getMyVoiceProfile: () => Promise.resolve(VOICE),
  getMyProfile: () => Promise.resolve(PROFILE),
  updateVoiceProfile: (patch: unknown) => updateVoiceProfile(patch),
}));

import PersonalVoicePage from "./PersonalVoicePage";

const EMPTY: Record<string, unknown> = {
  overview: {}, post: {}, comment: {}, dm: {}, email: {}, primary_channel: "email",
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PersonalVoicePage />
    </QueryClientProvider>,
  );
}

beforeEach(() => { VOICE = { ...EMPTY }; });
afterEach(() => { cleanup(); updateVoiceProfile.mockClear(); });

describe("PersonalVoicePage", () => {
  it("zeigt fünf Kanäle als Tabs — inkl. email (die 5. Ergänzung)", async () => {
    renderPage();
    await screen.findByText("voice.tab.overview");
    for (const tab of ["overview", "post", "comment", "dm", "email"]) {
      expect(screen.getByText(`voice.tab.${tab}`), tab).toBeTruthy();
    }
  });

  it("Overview-Felder sind BEIM LADEN als input/textarea da — kein Read-Mode, kein Klick nötig", async () => {
    renderPage();
    const bio = await screen.findByLabelText("voice.overview.bio.label");
    expect(bio.tagName.toLowerCase()).toBe("textarea");
    expect(screen.getByLabelText("voice.overview.tone.label")).toBeTruthy();
    expect(screen.getByLabelText("voice.overview.style.label")).toBeTruthy();
    expect(screen.getByLabelText("voice.overview.themes.label")).toBeTruthy();
  });

  it("Feld speichern läuft über EINEN Schreibweg — shallow patch { overview: { bio } }", async () => {
    renderPage();
    const bio = await screen.findByLabelText("voice.overview.bio.label");
    fireEvent.change(bio, { target: { value: "Ich baue Sales-Tools." } });
    fireEvent.blur(bio);
    await waitFor(() =>
      expect(updateVoiceProfile).toHaveBeenCalledWith({ overview: { bio: "Ich baue Sales-Tools." } }),
    );
  });

  it("Kanal-Tab (post) zeigt die Kanalfelder inkl. Aufmacher + Do's/Don'ts; Save patcht nur diesen Kanal", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("voice.tab.post"));
    const samples = await screen.findByLabelText("voice.field.samples.label");
    expect(samples.tagName.toLowerCase()).toBe("textarea");
    // Geteilte Feld-Labels (Schreibstil/Aufmacher) + zwei Do's/Don'ts-Teile
    expect(screen.getByLabelText("voice.field.writingStyle.label")).toBeTruthy();
    expect(screen.getByLabelText("voice.field.hooks.label")).toBeTruthy();
    expect(screen.getByLabelText("voice.field.dosAlways.label")).toBeTruthy();
    expect(screen.getByLabelText("voice.field.dosNever.label")).toBeTruthy();
    fireEvent.change(samples, { target: { value: "Beispiel-Post" } });
    fireEvent.blur(samples);
    await waitFor(() =>
      expect(updateVoiceProfile).toHaveBeenCalledWith({ post: { samples: "Beispiel-Post" } }),
    );
  });

  it("Do's & Don'ts = zwei benannte Teile DESSELBEN Feldes — Save schickt das ganze {always,never}-Objekt", async () => {
    VOICE = { ...EMPTY, post: { dos_donts: { always: "A" } } };
    renderPage();
    fireEvent.click(await screen.findByText("voice.tab.post"));
    const never = await screen.findByLabelText("voice.field.dosNever.label");
    fireEvent.change(never, { target: { value: "N" } });
    fireEvent.blur(never);
    // „immer" (A) bleibt erhalten, weil der Save das volle dos_donts-Objekt schickt (kein Datenverlust).
    await waitFor(() =>
      expect(updateVoiceProfile).toHaveBeenCalledWith({ post: { dos_donts: { always: "A", never: "N" } } }),
    );
  });

  it("leeres Feld lässt sich leer speichern (kein Pflichtfeld-Zwang)", async () => {
    VOICE = { ...EMPTY, overview: { bio: "alt" } };
    renderPage();
    const bio = await screen.findByDisplayValue("alt");
    fireEvent.change(bio, { target: { value: "" } });
    fireEvent.blur(bio);
    await waitFor(() => expect(updateVoiceProfile).toHaveBeenCalledWith({ overview: { bio: "" } }));
  });

  it("KI-Aktionen sind sichtbar, aber Folgt (disabled) - kein Fake, keine simulierte Analyse", async () => {
    renderPage();
    // Voice Trainer: ZWEI Knöpfe (Analysieren + Chat-Einrichtung), beide Folgt/disabled
    const trainer = await screen.findByLabelText("voice.trainerCta");
    expect((trainer as HTMLButtonElement).disabled).toBe(true);
    const chatSetup = screen.getByLabelText("voice.trainerChatCta");
    expect((chatSetup as HTMLButtonElement).disabled).toBe(true);
    const aiButtons = screen.getAllByLabelText(/company\.aiSuggest/);
    expect(aiButtons.length).toBeGreaterThan(0);
    expect(aiButtons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    // „So klingt das" lebt in den Kanal-Tabs (Live-Beispiel je Kanal) — dort ebenfalls Folgt.
    fireEvent.click(screen.getByText("voice.tab.post"));
    const soundsLike = await screen.findByLabelText("voice.soundsLike");
    expect((soundsLike as HTMLButtonElement).disabled).toBe(true);
  });

  it("Feld-KI-Knöpfe tragen den Teal-Pill-Kanon (AI_PILL_PENDING)", async () => {
    renderPage();
    const pill = (await screen.findAllByLabelText(/company\.aiSuggest/))[0];
    expect(pill.className).toContain("signal-teal-bg");
    expect(pill.className).toContain("rounded-full");
    expect(pill.className).toContain("cursor-not-allowed");
  });

  it("Voice-Trainer-Aktionen sind ECHTE Buttons (gefüllt + hell, rounded-full), disabled/Folgt — kein AI-Pill", async () => {
    renderPage();
    const primary = await screen.findByLabelText("voice.trainerCta");
    const secondary = screen.getByLabelText("voice.trainerChatCta");
    expect(primary.className).toContain("rounded-full");
    expect(primary.className).not.toContain("signal-teal-bg");   // kein AI-Pill mehr
    expect(primary.className).toContain("bg-sherloq-primary");    // gefüllter Haupt-Button
    expect(secondary.className).toContain("bg-[var(--on-accent)]"); // heller Zweit-Button
    expect((primary as HTMLButtonElement).disabled).toBe(true);  // bleibt „Folgt" (Honesty)
    expect((secondary as HTMLButtonElement).disabled).toBe(true);
  });

  it("Kanäle-Karte hat oben rechts einen KI-Ausfüllen-Knopf (Folgt/disabled, wie Produkte)", async () => {
    renderPage();
    const fill = await screen.findByLabelText("voice.aiFillAll");
    expect((fill as HTMLButtonElement).disabled).toBe(true);
    expect(fill.className).toContain("signal-teal-bg"); // AI-Pill-Kanon
  });

  it("Beispiele steht GANZ UNTEN im Kanal-Tab (nach Das machst du nie)", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("voice.tab.post"));
    const never = await screen.findByText("voice.field.dosNever.label");
    const samples = screen.getByText("voice.field.samples.label");
    // samples kommt im DOM NACH „Das machst du nie".
    expect(never.compareDocumentPosition(samples) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Profil-Vorschau nutzt ECHTE Daten (kein Mock-Profil)", async () => {
    renderPage();
    expect(await screen.findByText("Oliver Sand")).toBeTruthy();
    expect(screen.getByText("oliver@sherloq.io")).toBeTruthy();
    // Referenz-Mock darf nicht durchsickern.
    expect(document.body.textContent).not.toContain("Felix Brandt");
  });

  it("KEIN primary_channel-Auswahlfeld (bewusst weggelassen)", async () => {
    renderPage();
    await screen.findByLabelText("voice.overview.bio.label");
    expect(document.body.textContent).not.toContain("primary_channel");
    expect(screen.queryByText(/primary.?channel/i)).toBeNull();
  });

  it("Vollständigkeits-Ring: leeres Profil weist auf das wichtigste Feld hin (voiceBio)", async () => {
    renderPage();
    expect(await screen.findByText("company.hint.voiceBio")).toBeTruthy();
    // Ring als progressbar vorhanden (regelbasiert, aus derselben Registry).
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("Voice-Felder nutzen den grauen FIELD-Kanon, nicht den weißen shadcn-Default", async () => {
    renderPage();
    const bio = await screen.findByLabelText("voice.overview.bio.label");
    expect(bio.className).toContain("bg-app-bg");
    expect(bio.className).not.toContain("bg-app-surface");
  });
});
