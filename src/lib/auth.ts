/**
 * auth.ts — Authentifizierung (Login, Logout, Session, User).
 *
 * Komponenten/Hooks nutzen NUR diese Funktionen — nie `supabase.auth` direkt
 * und nie `@supabase/supabase-js` importieren (Audit-Regel: nur in lib/).
 * Der Client kommt ausschließlich über getSupabaseClient() aus db.ts.
 *
 * Passwortlos ([D21]): Magic Link (signInWithMagicLink) + Google/Microsoft SSO —
 * kein Passwort-Login. Env-tolerant: ohne konfigurierte Supabase-Env liefert
 * getSupabaseClient() null — dann werfen die Sign-in-Funktionen eine freundliche
 * Meldung, der Rest verhält sich „leer".
 */

import { getSupabaseClient } from "@/lib/db";
import type { Session, User } from "@supabase/supabase-js";

// Re-Export, damit Hooks/Komponenten die Typen nutzen können, ohne selbst
// aus @supabase/supabase-js zu importieren (Audit-Regel).
export type { Session, User };

// Passwortlosser Login ([D21]): Magic Link (primär) + Google/Microsoft SSO.
// Kein Passwort-Login mehr. OAuth + Magic Link kehren über /auth/callback zurück
// (detectSessionInUrl in db.ts liest die Session aus der URL).
const callbackUrl = () =>
  typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

/** Magic Link (OTP) an die Email senden. Wirft, wenn Supabase nicht konfiguriert ist. */
export async function signInWithMagicLink(email: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl() },
  });
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
