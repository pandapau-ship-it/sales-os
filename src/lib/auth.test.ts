import { describe, it, expect, vi } from "vitest";

// auth.ts zieht lib/db (Supabase-Init) — für den reinen Mapper-Test stubben (kein Client nötig).
vi.mock("@/lib/db", () => ({ getSupabaseClient: () => null }));

import { authErrorKey } from "./auth";

describe("authErrorKey — differenzierte Login-Fehler ([D21] WOW 3)", () => {
  it("Rate-Limit → login.errorRate (Status 429 oder Text)", () => {
    expect(authErrorKey({ status: 429 })).toBe("login.errorRate");
    expect(authErrorKey({ message: "Rate limit exceeded" })).toBe("login.errorRate");
    expect(authErrorKey({ message: "Too many requests" })).toBe("login.errorRate");
  });
  it("Netzwerk → login.errorNetwork", () => {
    expect(authErrorKey({ message: "Failed to fetch" })).toBe("login.errorNetwork");
    expect(authErrorKey({ message: "Load failed" })).toBe("login.errorNetwork");
  });
  it("falsche Zugangsdaten → login.errorCredentials", () => {
    expect(authErrorKey({ code: "invalid_credentials" })).toBe("login.errorCredentials");
    expect(authErrorKey({ message: "Invalid login credentials" })).toBe("login.errorCredentials");
  });
  it("sonst/leer → generisch (nie technischer Code)", () => {
    expect(authErrorKey(null)).toBe("login.errorGeneric");
    expect(authErrorKey({ message: "irgendwas unbekanntes" })).toBe("login.errorGeneric");
  });
});
