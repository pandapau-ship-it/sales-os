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

// Passwort-Reset-Link kehrt auf die eigene Set-Password-Seite zurück (nicht /auth/callback):
// detectSessionInUrl etabliert dort die Recovery-Session, /reset zeigt das Neu-Setzen-Formular.
const resetUrl = () =>
  typeof window !== "undefined" ? `${window.location.origin}/reset` : undefined;

/**
 * isAuthDevBypass — Login-Pflicht NUR für lokalen, ausdrücklich eingeschalteten Dev-Betrieb umgehen.
 * Erfordert `import.meta.env.DEV` UND `VITE_DEV_AUTH_BYPASS === "true"` — beides. Ohne das Flag gilt
 * echte Login-Pflicht (auch env-los: dann bleibt man auf dem Login-Screen). Nie in Produktion aktiv
 * (import.meta.env.DEV ist im Build false). Zentrale Quelle für Protected/Login/Catch-all/Gate.
 */
export function isAuthDevBypass(): boolean {
  return import.meta.env.DEV === true && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
}

/** Email + Passwort Login. Wirft, wenn Supabase nicht konfiguriert ist. */
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.signInWithPassword({ email, password });
}

/** Passwort-Reset-Link an die Email senden (Rückkehr auf /reset zum Neu-Setzen). */
export async function resetPassword(email: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.resetPasswordForEmail(email, { redirectTo: resetUrl() });
}

/** Neues Passwort setzen (nach Recovery-Link). Erfordert die aktive Recovery-Session. */
export async function updatePassword(newPassword: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  }
  return client.auth.updateUser({ password: newPassword });
}

/**
 * authErrorKey — Supabase-Auth-Fehler auf eine verständliche i18n-Meldung mappen (statt EIN Textbaustein).
 * Unterscheidet: falsche Zugangsdaten · zu viele Versuche (Rate-Limit) · keine Verbindung · sonst generisch.
 * (Regel „Fehlerbehandlung aus User-Sicht": nie technischer Code, immer Handlung.)
 */
export function authErrorKey(
  err: { message?: string; status?: number; code?: string } | null | undefined,
): string {
  if (!err) return "login.errorGeneric";
  const code = (err.code ?? "").toLowerCase();
  const status = err.status ?? 0;
  const msg = (err.message ?? "").toLowerCase();
  if (status === 429 || code.includes("rate") || msg.includes("rate limit") || msg.includes("too many"))
    return "login.errorRate";
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed"))
    return "login.errorNetwork";
  if (code.includes("invalid_credentials") || msg.includes("invalid login") || msg.includes("invalid credentials"))
    return "login.errorCredentials";
  return "login.errorGeneric";
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

// ── 2FA / MFA (TOTP) — Supabase nativ ([D21] Scheibe 8) ──────────────────────

/**
 * getUserMfaStatus — ist ein TOTP-Faktor verifiziert eingerichtet?
 * Ohne Backend/Session → { enrolled: true } (Banner soll dann NICHT erscheinen).
 */
export async function getUserMfaStatus(): Promise<{ enrolled: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { enrolled: true };
  const { data, error } = await client.auth.mfa.listFactors();
  if (error || !data) return { enrolled: true }; // im Zweifel nicht nerven
  const totp = (data.totp ?? []).filter((f) => f.status === "verified");
  return { enrolled: totp.length > 0 };
}

/**
 * enrollMfaTotp — neuen TOTP-Faktor anlegen. Liefert factorId + QR-Code (data-URL SVG)
 * + Secret zum manuellen Eintippen. Wirft, wenn Auth nicht konfiguriert ist.
 */
export async function enrollMfaTotp(): Promise<{ factorId: string; qrCode: string; secret: string }> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  const { data, error } = await client.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) throw error ?? new Error("MFA-Enrollment fehlgeschlagen.");
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** verifyMfaTotp — 6-stelligen Code prüfen (Challenge + Verify in einem). */
export async function verifyMfaTotp(factorId: string, code: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Auth ist nicht konfiguriert (Supabase-Env fehlt).");
  return client.auth.mfa.challengeAndVerify({ factorId, code });
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
