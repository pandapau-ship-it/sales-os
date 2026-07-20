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
import { isAuthDevBypass } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Login from "@/components/auth/Login";
import AuthCallback from "@/components/auth/AuthCallback";
import ResetPassword from "@/components/auth/ResetPassword";
import PublicPlaceholder from "@/components/auth/PublicPlaceholder";
import ProvisioningGate from "@/components/auth/ProvisioningGate";
import { Protected } from "@/components/auth/Protected";
import { NotFoundRedirect } from "@/components/auth/NotFoundRedirect";
import SettingsShell from "@/components/features/settings/SettingsShell";
import PersonalSettings from "@/components/features/settings/PersonalSettings";
import ScreenKontakte from "@/components/screens/ScreenKontakte";
import ScreenCompanies from "@/components/screens/ScreenCompanies";
import ScreenCompanyDetail from "@/components/screens/ScreenCompanyDetail";
import ScreenKontakteImport from "@/components/screens/ScreenKontakteImport";
import ScreenDuplicates from "@/components/screens/ScreenDuplicates";
import ScreenNotifications from "@/components/screens/ScreenNotifications";
import { MfaBanner } from "@/components";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { setLastSeen } from "@/lib/db";
import CommandPalette from "@/components/shared/CommandPalette";
import { ToastProvider } from "@/components/shared/Toast";
import TooltipLayer from "@/components/shared/TooltipLayer";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
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
  const { role, provisioningError } = useCurrentOrg(); // 2FA-Empfehlung nur für Owner/Admin (MfaBanner entscheidet selbst)
  const { user } = useAuth();

  // „Zuletzt aktiv" einmal pro Session setzen (Team-Seite zeigt es; ohne Session serverseitig No-op).
  useEffect(() => {
    if (user?.id) void setLastSeen();
  }, [user?.id]);

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

  // Eingeloggt, aber keiner Org zugeordnet (invite-only / Provisioning-Fehler) → sichtbares Gate
  // statt still auf die Demo-Org auszuweichen. Im Dev-Bypass unterdrückt. (Nach allen Hooks.)
  if (provisioningError && !isAuthDevBypass()) return <ProvisioningGate />;

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

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipLayer />
        <BrowserRouter>
        <Routes>
        {/* ── ÖFFENTLICHE Routen (kein Login) — MÜSSEN vor dem Catch-all stehen (CLAUDE.md-Regel) ── */}
        <Route path="/" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset" element={<ResetPassword />} />
        {/* Reservierte öffentliche Pfade — Seiten folgen mit ihren Modulen ([D29] / Sending-Layer). */}
        <Route path="/invite/:token" element={<PublicPlaceholder titleKey="auth.invitePlaceholderTitle" bodyKey="auth.invitePlaceholderBody" />} />
        <Route path="/unsubscribe" element={<PublicPlaceholder titleKey="auth.unsubPlaceholderTitle" bodyKey="auth.unsubPlaceholderBody" />} />
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
          <Route path="settings" element={<SettingsShell />} />
          <Route path="profil" element={<PersonalSettings />} />
          <Route path="notifications" element={<ScreenNotifications />} />
        </Route>
          {/* Catch-all: unbekannt + nicht eingeloggt → Login (/), sonst App. Nie blind auf /app. */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
