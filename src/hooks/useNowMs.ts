import { useSyncExternalStore } from "react";

/**
 * Wall-clock time is external mutable state: reading `Date.now()` while rendering
 * makes a component non-idempotent, because two renders of the same props can
 * disagree (react-hooks/purity). Exposing it as an external store keeps render pure
 * and lets React re-render deliberately when the value moves on.
 *
 * Side effect worth having: relative labels ("vor X Tagen") now advance on their own
 * instead of freezing at the value they had when the component happened to mount.
 */

// Relative labels in this app are day-grained, so a minute of drift is invisible.
// Shorter ticks would only buy re-renders nobody can see.
const TICK_MS = 60_000;

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // One shared interval for every consumer — a timer per component would scale
  // with list length (Hunter/Farmer render hundreds of cards).
  if (timer === null) {
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// Must stay referentially stable between ticks, or React re-renders forever.
function getSnapshot(): number {
  return now;
}

// Server render has no clock to subscribe to; the mount tick corrects it.
function getServerSnapshot(): number {
  return now;
}

/** Current epoch milliseconds, safe to read during render. Updates once a minute. */
export function useNowMs(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
