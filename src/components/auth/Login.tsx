/**
 * Login — Platzhalter (Schritt 6). Der echte Login-Screen folgt in Schritt 10.
 *
 * Phase 0 ohne konfiguriertes Backend: direkt in die App (Dev-Bypass).
 */

import { Navigate } from "react-router-dom";
import { isSupabaseConfigured } from "@/lib/db";

export default function Login() {
  if (!isSupabaseConfigured()) return <Navigate to="/app/meintag" replace />;
  return (
    <div className="flex items-center justify-center h-screen text-text-muted text-sm">
      Login — wird in Schritt 10 gebaut
    </div>
  );
}
