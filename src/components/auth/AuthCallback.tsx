/**
 * AuthCallback — Rückkehr-Route für Magic Link + OAuth ([D21]).
 *
 * Supabase verarbeitet die Session aus der URL automatisch (detectSessionInUrl
 * in db.ts). Diese Komponente wartet auf den Auth-State und leitet dann weiter:
 * Session vorhanden → /app/meintag, sonst zurück zum Login ("/").
 * Zeigt währenddessen nur einen kurzen Lade-Hinweis.
 */

import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const { t } = useTranslation();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
        <p className="text-[13px] text-text-muted">{t("login.callback")}</p>
      </div>
    );
  }

  return <Navigate to={session ? "/app/meintag" : "/"} replace />;
}
