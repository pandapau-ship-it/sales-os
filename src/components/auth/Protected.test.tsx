// @vitest-environment jsdom
/**
 * Protected + NotFoundRedirect ([D21] Login-Pflicht, Akzeptanz):
 * - Deep-Link ohne Session → Login, Ziel-Pfad in state.from gemerkt
 * - mit Session → Inhalt
 * - Dev-Bypass nur mit Flag
 * - unbekannte Route ohne Session → Login (NICHT /app) — DSGVO-kritisch
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

let mockSession: unknown = null;
let mockLoading = false;
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ session: mockSession, user: null, loading: mockLoading }),
}));

let mockBypass = false;
vi.mock("@/lib/auth", async (io) => {
  const actual = (await io()) as Record<string, unknown>;
  return { ...actual, isAuthDevBypass: () => mockBypass };
});

import { Protected } from "./Protected";
import { NotFoundRedirect } from "./NotFoundRedirect";

function LoginStub() {
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "none";
  return <div>LOGIN from={from}</div>;
}

function renderProtected(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<LoginStub />} />
        <Route path="/app/kontakte" element={<Protected><div>SECRET</div></Protected>} />
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => { cleanup(); mockSession = null; mockLoading = false; mockBypass = false; });

describe("Protected", () => {
  it("Deep-Link ohne Session → Login + state.from gemerkt", () => {
    renderProtected("/app/kontakte");
    expect(screen.getByText("LOGIN from=/app/kontakte")).toBeTruthy();
    expect(screen.queryByText("SECRET")).toBeNull();
  });
  it("mit Session → Inhalt", () => {
    mockSession = { user: {} };
    renderProtected("/app/kontakte");
    expect(screen.getByText("SECRET")).toBeTruthy();
  });
  it("Dev-Bypass AUS ist Default → Login erzwungen", () => {
    mockBypass = false;
    renderProtected("/app/kontakte");
    expect(screen.queryByText("SECRET")).toBeNull();
  });
  it("Dev-Bypass mit Flag → Inhalt ohne Session", () => {
    mockBypass = true;
    renderProtected("/app/kontakte");
    expect(screen.getByText("SECRET")).toBeTruthy();
  });
});

describe("NotFoundRedirect (Catch-all)", () => {
  it("unbekannte Route ohne Session → Login, NICHT /app", () => {
    renderProtected("/voellig/unbekannt");
    expect(screen.getByText(/LOGIN/)).toBeTruthy();
  });
});
