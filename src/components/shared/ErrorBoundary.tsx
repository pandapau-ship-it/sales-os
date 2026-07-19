/**
 * ErrorBoundary — EINE globale Boundary ganz oben im App-Baum (App.tsx). Fängt Render-/Lifecycle-
 * Fehler und zeigt eine freundliche Fallback-UI statt einer weißen Seite. Bewusst minimal:
 * kein Per-Route-Aufwand, keine verschachtelten Boundaries.
 *
 * Logging: vorerst NUR Konsole (keine Sentry-Integration jetzt — kommt mit Betrieb B-1).
 */
import { Component, type ReactNode, type ErrorInfo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-6">
      <div className="max-w-sm text-center">
        <h1 className="typo-card-title text-text-primary mb-2">{t("errors.boundary.title")}</h1>
        <p className="typo-subline text-text-muted mb-5">{t("errors.boundary.body")}</p>
        <Button className="rounded-[10px]" onClick={() => window.location.reload()}>
          {t("errors.boundary.reload")}
        </Button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // TODO(B-1): an lib/monitoring.ts anklemmen (Sentry o.ä.), sobald Betrieb B-1 existiert.
    // Bis dahin bewusst nur Konsole — kein stiller Verlust, keine externe Abhängigkeit.
    console.error("ErrorBoundary caught:", error, info);
  }

  render(): ReactNode {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
