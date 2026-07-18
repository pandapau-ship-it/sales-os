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
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
// i18n-Init vor dem ersten Render (Default de).
import "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/db";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Login from "@/components/auth/Login";
import AuthCallback from "@/components/auth/AuthCallback";
import TeamSettings from "@/components/features/settings/TeamSettings";
import ScreenKontakte from "@/components/screens/ScreenKontakte";
import ScreenCompanies from "@/components/screens/ScreenCompanies";
import ScreenCompanyDetail from "@/components/screens/ScreenCompanyDetail";
import ScreenKontakteImport from "@/components/screens/ScreenKontakteImport";
import ScreenDuplicates from "@/components/screens/ScreenDuplicates";
import { MfaBanner } from "@/components";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import CommandPalette from "@/components/shared/CommandPalette";
import { ToastProvider } from "@/components/shared/Toast";
import TooltipLayer from "@/components/shared/TooltipLayer";
// Referenz-Wiring der fertigen Bestands-Screens mit Mock-Daten (temporär, Phase 2 ersetzt es).
import {
  MeinTagReference,
  HunterReference,
  FarmerReference,
} from "@/components/reference/ReferenceScreens";

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
  const { role } = useCurrentOrg(); // 2FA-Empfehlung nur für Owner/Admin (MfaBanner entscheidet selbst)

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
          <MfaBanner role={role} />
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipLayer />
        <BrowserRouter>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Import = fokussierter Vollbild-Wizard OHNE Sidebar → eigene Route außerhalb des AppLayout. */}
        <Route path="/app/kontakte/import" element={<Protected><ScreenKontakteImport /></Protected>} />
        {/* Duplikate verwalten = fokussierter Vollbild-Screen ohne Sidebar (K-6b). */}
        <Route path="/app/kontakte/duplicates" element={<Protected><ScreenDuplicates /></Protected>} />
        <Route
          path="/app"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="meintag" replace />} />
          <Route path="meintag" element={<MeinTagReference />} />
          <Route path="ai-sdr" element={<ComingSoon nameKey="nav.aisdr" />} />
          <Route path="hunter" element={<HunterReference />} />
          <Route path="farmer" element={<FarmerReference />} />
          <Route path="kontakte" element={<ScreenKontakte />} />
          <Route path="companies" element={<ScreenCompanies />} />
          <Route path="companies/:id" element={<ScreenCompanyDetail />} />
          <Route path="settings" element={<TeamSettings />} />
        </Route>
          <Route path="*" element={<Navigate to="/app/meintag" replace />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
