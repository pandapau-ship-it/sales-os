// @vitest-environment jsdom
/**
 * CommandPalette / Cmd+K: filtert NUR nach Firmen-Entitlement (nicht-gebuchte Module werden nicht
 * angeboten) — aber NICHT nach der persönlichen hidden-Pref (Ausgeblendetes bleibt per Cmd+K erreichbar).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
let activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
vi.mock("@/hooks/useModules", () => ({ useModules: () => ({ hasModule: (m: string) => activeModules.has(m) }) }));

// cmdk/Radix-Dialog rendert in jsdom instabil (OOM) — Primitive leichtgewichtig stubben.
// Testziel ist der Entitlement-Filter auf navItems, nicht die cmdk-Engine.
type Kids = { children?: React.ReactNode };
vi.mock("@/components/ui/command", () => ({
  CommandDialog: ({ open, children }: Kids & { open?: boolean }) => (open ? <div>{children}</div> : null),
  CommandInput: () => <input />,
  CommandList: ({ children }: Kids) => <div>{children}</div>,
  CommandEmpty: ({ children }: Kids) => <div>{children}</div>,
  CommandGroup: ({ children }: Kids) => <div>{children}</div>,
  CommandItem: ({ children }: Kids) => <div>{children}</div>,
}));

import CommandPalette from "./CommandPalette";

afterEach(() => { cleanup(); activeModules = new Set(["ai_sdr", "hunter", "farmer"]); });

describe("CommandPalette Entitlement-Filter", () => {
  it("bietet gebuchte Module an (farmer sichtbar bei vollem Plan)", async () => {
    render(<CommandPalette open onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByText("nav.farmer")).toBeTruthy());
    expect(screen.getByText("nav.meintag")).toBeTruthy();
  });

  it("nicht gebuchtes Modul (farmer) wird NICHT angeboten", async () => {
    activeModules = new Set(["ai_sdr", "hunter"]);
    render(<CommandPalette open onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByText("nav.meintag")).toBeTruthy());
    expect(screen.queryByText("nav.farmer")).toBeNull();
    // kontakte/companies (kein Modul) bleiben immer erreichbar
    expect(screen.getByText("nav.kontakte")).toBeTruthy();
  });
});
