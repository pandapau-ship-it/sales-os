/**
 * NotFoundRedirect — Catch-all für unbekannte Pfade ([D21]).
 *
 * WICHTIG (DSGVO-/Zugriffs-Sicherheit): unbekannt + NICHT eingeloggt → Login (/), NICHT /app.
 * Öffentliche Routen (z.B. /reset, /invite/:token, /unsubscribe) MÜSSEN als EXPLIZITE Routen VOR
 * dem Catch-all stehen — nie dem Catch-all überlassen (sonst würde ein externer Klick ins Login
 * umgeleitet). Siehe CLAUDE.md „GLOBALE REGEL — Öffentliche Routen".
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAuthDevBypass } from "@/lib/auth";

export function NotFoundRedirect() {
  const { session, loading } = useAuth();
  if (isAuthDevBypass()) return <Navigate to="/app/meintag" replace />;
  if (loading) return null;
  return <Navigate to={session ? "/app/meintag" : "/"} replace />;
}
