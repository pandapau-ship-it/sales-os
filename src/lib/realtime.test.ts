import { describe, it, expect, vi, beforeEach } from "vitest";

// Regressionstest für den N-S2-Bugfix: zwei Subscriber (TopBar + ScreenNotifications) dürfen NICHT
// denselben Channel-Topic bekommen (sonst Supabase-Kollision → weiße Seite). Guard darf nie werfen.

interface FakeChannel {
  on: () => FakeChannel;
  subscribe: () => FakeChannel;
}
const makeChannel = (): FakeChannel => {
  const ch: FakeChannel = { on: () => ch, subscribe: () => ch };
  return ch;
};

const channelNames: string[] = [];
const removeChannel = vi.fn();
let clientMode: "ok" | "null" | "throw" = "ok";

vi.mock("@/lib/db", () => ({
  getSupabaseClient: () => {
    if (clientMode === "null") return null;
    return {
      channel: (name: string) => {
        channelNames.push(name);
        if (clientMode === "throw") throw new Error("realtime boom");
        return makeChannel();
      },
      removeChannel,
    };
  },
}));

import { subscribeToNotifications } from "./realtime";

describe("subscribeToNotifications — eindeutige Topics + Guard (N-S2 Bugfix)", () => {
  beforeEach(() => {
    channelNames.length = 0;
    clientMode = "ok";
    removeChannel.mockClear();
  });

  it("zwei Subscriptions → UNTERSCHIEDLICHE Topics (keine Kollision), kein Throw", () => {
    const u1 = subscribeToNotifications("user-1", () => {});
    const u2 = subscribeToNotifications("user-1", () => {});
    expect(channelNames).toHaveLength(2);
    expect(channelNames[0]).not.toBe(channelNames[1]); // der eigentliche Fix
    expect(channelNames[0].startsWith("notifications:user-1:")).toBe(true);
    expect(() => {
      u1();
      u2();
    }).not.toThrow();
    expect(removeChannel).toHaveBeenCalledTimes(2);
  });

  it("ohne Client (Demo/kein Login) → noop-unsub, kein Channel, kein Throw", () => {
    clientMode = "null";
    let unsub!: () => void;
    expect(() => {
      unsub = subscribeToNotifications("user-1", () => {});
    }).not.toThrow();
    expect(() => unsub()).not.toThrow();
    expect(channelNames).toHaveLength(0);
  });

  it("Realtime wirft beim Subscribe → gefangen, App bleibt stehen (noop-unsub)", () => {
    clientMode = "throw";
    let unsub!: () => void;
    expect(() => {
      unsub = subscribeToNotifications("user-1", () => {});
    }).not.toThrow();
    expect(() => unsub()).not.toThrow();
  });
});
