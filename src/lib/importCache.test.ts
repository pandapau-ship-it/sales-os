import { describe, it, expect } from "vitest";
import { importInvalidationKeys } from "./importCache";

describe("importInvalidationKeys", () => {
  const org = "org-123";

  it("invalidiert Kontakte-Liste, Companies-Liste UND Dedup-Universum nach einem Import", () => {
    const keys = importInvalidationKeys(org);
    expect(keys).toContainEqual(["kontakte", org]);
    expect(keys).toContainEqual(["companies", org]);
    expect(keys).toContainEqual(["dedupUniverse", org]);
  });

  it("scopt jeden Key auf die Organisation (Multi-Tenant-Cache-Isolation)", () => {
    for (const key of importInvalidationKeys(org)) {
      expect(key[1]).toBe(org);
    }
  });

  it("enthält KEINEN Key ohne org-Scope (sonst Cross-Tenant-Refetch)", () => {
    for (const key of importInvalidationKeys(org)) {
      expect(key).toHaveLength(2);
    }
  });
});
