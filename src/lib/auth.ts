/**
 * auth.ts — Authentifizierung (Login, Logout, Session, User).
 *
 * Komponenten nutzen NUR diese Funktionen — nie supabase.auth direkt.
 * Holt den Client ausschließlich über getSupabaseClient() aus db.ts.
 *
 * STATUS: Phase 5 noch nicht gestartet → Stubs. Beim Supabase-Einbau werden
 * nur die Körper ersetzt (z.B. getSupabaseClient().auth.signInWithPassword …).
 */

// import { getSupabaseClient } from "@/lib/db";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  organizationId: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

/** Email + Passwort Login. Phase 5: getSupabaseClient().auth.signInWithPassword. */
export async function login(_email: string, _password: string): Promise<AuthSession> {
  throw new Error("Auth ist noch nicht konfiguriert (Phase 5).");
}

/** Logout. Phase 5: getSupabaseClient().auth.signOut. */
export async function logout(): Promise<void> {
  return Promise.resolve();
}

/** Aktuelle Session oder null. Phase 5: getSupabaseClient().auth.getSession. */
export async function getSession(): Promise<AuthSession | null> {
  return Promise.resolve(null);
}

/** Aktueller User oder null. Phase 5: aus Session + users-Tabelle. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return Promise.resolve(null);
}

/**
 * Auth-State-Listener. Gibt eine Unsubscribe-Funktion zurück.
 * Phase 5: getSupabaseClient().auth.onAuthStateChange.
 */
export function onAuthChange(_callback: (session: AuthSession | null) => void): () => void {
  return () => {};
}
