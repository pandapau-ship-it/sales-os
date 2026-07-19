/**
 * Protected — schützt /app ([D21] Login-Pflicht).
 *
 * Dev-Bypass NUR bei explizitem Flag (isAuthDevBypass). Ohne Session → Redirect auf Login (/),
 * dabei den Ziel-Pfad in `state.from` merken, damit Login danach dorthin zurückführt (Deep-Link).
 */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAuthDevBypass } from "@/lib/auth";

export function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (isAuthDevBypass()) return <>{children}</>;
  if (loading) return null;
  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
