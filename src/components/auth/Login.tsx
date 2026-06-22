/**
 * Login — passwortloser Login-Screen ([D21]).
 *
 * Magic Link (primär, signInWithMagicLink) + Google/Microsoft SSO (Redirect).
 * Kein Passwort mehr. Zwei Zustände: Formular → nach Magic-Link-Versand
 * Bestätigung ("Postfach prüfen") mit "Anderen Link anfordern".
 * Phase 0 ohne Backend: Dev-Bypass direkt in die App. Alle Texte über i18n.
 */

import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  signInWithMagicLink,
  signInWithGoogle,
  signInWithMicrosoft,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { GoogleIcon, MicrosoftIcon } from "@/components";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Phase 0 ohne Backend → direkt in die App (Dev-Bypass).
  if (!isSupabaseConfigured()) return <Navigate to="/app/meintag" replace />;

  const onMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: otpError } = await signInWithMagicLink(email);
      if (otpError) {
        setError(t("login.error"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  // SSO-Redirect-Flow. Bei Erfolg verlässt der Browser die Seite → kein State-Reset nötig.
  const onOAuth = async (fn: typeof signInWithGoogle) => {
    setError(null);
    try {
      const { error: oauthError } = await fn();
      if (oauthError) setError(t("login.error"));
    } catch {
      setError(t("login.error"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="sherloq-card w-full max-w-[380px] p-7 flex flex-col gap-5">
        {/* Logo + Titel */}
        <div className="flex flex-col items-center gap-3">
          <div
            style={{ width: 40, height: 40, background: "var(--sherloq-primary)", borderRadius: "var(--radius-btn)" }}
            className="flex items-center justify-center"
          >
            <span className="text-on-accent font-semibold text-base leading-none">S</span>
          </div>
          <div className="text-center">
            <h1 className="text-[16px] font-semibold text-text-primary">{t("login.title")}</h1>
            <p className="text-[12px] text-text-muted mt-0.5">
              {sent ? t("login.sentBody") : t("login.subtitle")}
            </p>
          </div>
        </div>

        {sent ? (
          /* Bestätigung nach Magic-Link-Versand */
          <div className="flex flex-col gap-4 items-center text-center">
            <p className="text-[13px] font-medium text-text-primary">{t("login.sentTitle")}</p>
            <button
              type="button"
              onClick={() => { setSent(false); setError(null); }}
              className="text-[12px] font-medium text-sherloq-primary hover:opacity-80 transition-opacity cursor-pointer"
            >
              {t("login.resend")}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={onMagicLink} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text-body">{t("login.email")}</span>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                />
              </label>

              {error && (
                <p className="text-[12px] text-signal-urgent" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="sherloq-btn-primary w-full justify-center mt-1 disabled:opacity-60"
              >
                {loading ? t("login.magicLoading") : t("login.magicSubmit")}
              </button>
            </form>

            {/* Trennlinie "oder" */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-text-muted">{t("login.or")}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* SSO */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onOAuth(signInWithGoogle)}
                className="sherloq-btn-secondary w-full justify-center gap-2"
              >
                <GoogleIcon className="w-4 h-4" />
                {t("login.google")}
              </button>
              <button
                type="button"
                onClick={() => onOAuth(signInWithMicrosoft)}
                className="sherloq-btn-secondary w-full justify-center gap-2"
              >
                <MicrosoftIcon className="w-4 h-4" />
                {t("login.microsoft")}
              </button>
            </div>

            <p className="text-[11px] text-text-muted text-center">{t("login.hint")}</p>
          </>
        )}
      </div>
    </div>
  );
}
