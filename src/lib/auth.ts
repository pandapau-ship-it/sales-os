/**
 * auth.ts — Authentifizierung (Login, Logout, Session, User).
 *
 * Komponenten/Hooks nutzen NUR diese Funktionen — nie `supabase.auth` direkt
 * und nie `@supabase/supabase-js` importieren (Audit-Regel: nur in lib/).
 * Der Client kommt ausschließlich über getSupabaseClient() aus db.ts.
 *
 * Login ([D21]): Email + Passwort (primär) + Google/Microsoft SSO. Passwort-Reset
 * per Email-Link. Magic Link bewusst NICHT (B2B-Tool, tägliche Nutzung → zu viel
 * Friction). Env-tolerant: ohne konfigurierte Supabase-Env liefert
 * getSupabaseClient() null — dann werfen die Sign-in-Funktionen eine freundliche
 * Meldung, der Rest verhält sich „leer".
 */

import { getSupabaseClient } from "@/lib/db";
import type { Session, User } from "@supabase/supabase-js";

// Re-Export, damit Hooks/Komponenten die Typen nutzen können, ohne selbst
// aus @supabase/supabase-js zu importieren (Audit-Regel).
export type { Session, User };

// Login ([D21]): Email + Passwort (primär) + Google/Microsoft SSO. OAuth kehrt
// über /auth/callback zurück (detectSessionInUrl in db.ts liest die Session aus der URL).
const callbackUrl = () =>
  typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

/** Email + Passwort Login. Wirft, wenn Supabase nicht konfiguriert ist. */
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.signInWithPassword({ email, password });
}

/** Passwort-Reset-Link an die Email senden. */
export async function resetPassword(email: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl() });
}

/** Google SSO (Redirect-Flow). */
export async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl() },
  });
}

/** Microsoft SSO (Azure AD, Redirect-Flow). */
export async function signInWithMicrosoft() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.signInWithOAuth({
    provider: "azure",
    options: { redirectTo: callbackUrl() },
  });
}

/** Logout. No-op, wenn nicht konfiguriert. */
export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

/** Aktuelle Session oder null. */
export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session ?? null;
}

/** Aktueller Auth-User oder null. */
export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

/**
 * Auth-State-Listener. Gibt eine Unsubscribe-Funktion zurück.
 * Bei fehlender Konfiguration ein No-op-Unsubscribe.
 */
export function onAuthChange(
  callback: (session: Session | null) => void,
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) =>
    callback(session),
  );
  return () => data.subscription.unsubscribe();
}
