// @vitest-environment jsdom
/**
 * PersonalSettings (SET-2 UI): drei Reiter, Default „Mein Profil", Wechsel funktioniert.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: "de" } }) }));
vi.mock("./MyProfileTab", () => ({ default: () => <div>PROFILE_TAB</div> }));
vi.mock("./AppearanceTab", () => ({ default: () => <div>APPEARANCE_TAB</div> }));
vi.mock("./SecurityTab", () => ({ default: () => <div>SECURITY_TAB</div> }));
vi.mock("@/components", () => ({
  PanelTabs: ({ tabs, onChange }: { tabs: { id: string; label: string }[]; onChange: (id: string) => void }) => (
    <div>{tabs.map((t) => <button key={t.id} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>
  ),
}));

import PersonalSettings from "./PersonalSettings";

afterEach(cleanup);

describe("PersonalSettings", () => {
  it("Default zeigt Mein Profil", () => {
    render(<PersonalSettings />);
    expect(screen.getByText("PROFILE_TAB")).toBeTruthy();
    expect(screen.queryByText("APPEARANCE_TAB")).toBeNull();
  });

  it("Wechsel auf Ansicht + Sicherheit", () => {
    render(<PersonalSettings />);
    fireEvent.click(screen.getByText("personal.tabAppearance"));
    expect(screen.getByText("APPEARANCE_TAB")).toBeTruthy();
    fireEvent.click(screen.getByText("personal.tabSecurity"));
    expect(screen.getByText("SECURITY_TAB")).toBeTruthy();
  });
});
