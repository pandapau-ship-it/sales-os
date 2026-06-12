/**
 * App.tsx — Root + Routing (Phase 0 Fundament).
 *
 * Layout-Shell (Sidebar + TopBar) unter /app, Platzhalter-Screens (ComingSoon)
 * für alle Hauptbereiche. Login unter "/". Protected Route schützt /app — in
 * Phase 0 ohne konfiguriertes Supabase-Backend greift ein Dev-Bypass, damit die
 * Shell nutzbar ist; mit Backend wird echte Auth erzwungen.
 */

import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
// i18n-Init vor dem ersten Render (Default de).
import "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/db";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Login from "@/components/auth/Login";
import CommandPalette from "@/components/shared/CommandPalette";
import { ToastProvider } from "@/components/shared/Toast";

/** Platzhalter-Screen für alles, was noch nicht gebaut ist. */
function ComingSoon({ nameKey }: { nameKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full text-text-muted text-sm">
      {t(nameKey)} — {t("common.comingSoon")}
    </div>
  );
}

/** Layout-Shell: TopBar oben, Sidebar links, Screen im Outlet. */
function AppLayout() {
  const [showPalette, setShowPalette] = useState(false);

  // Globaler Cmd/Ctrl+K Shortcut öffnet die Command Palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-app-bg text-text-body font-sans">
      <TopBar onOpenCommandPalette={() => setShowPalette(true)} />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={showPalette} onOpenChange={setShowPalette} />
    </div>
  );
}

/** Schützt /app. Phase 0 ohne Backend: Dev-Bypass (kein Gate). */
function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (!isSupabaseConfigured()) return <>{children}</>;
  if (loading) return null;
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/app"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="meintag" replace />} />
          <Route path="meintag" element={<ComingSoon nameKey="nav.meintag" />} />
          <Route path="ai-sdr" element={<ComingSoon nameKey="nav.aisdr" />} />
          <Route path="hunter" element={<ComingSoon nameKey="nav.hunter" />} />
          <Route path="farmer" element={<ComingSoon nameKey="nav.farmer" />} />
          <Route path="kontakte" element={<ComingSoon nameKey="nav.kontakte" />} />
          <Route path="companies" element={<ComingSoon nameKey="nav.companies" />} />
          <Route path="settings" element={<ComingSoon nameKey="nav.settings" />} />
        </Route>
          <Route path="*" element={<Navigate to="/app/meintag" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
