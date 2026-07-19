/**
 * Login — Login-Screen ([D21]).
 *
 * Email + Passwort (primär) + Google/Microsoft SSO. Passwort-Feld mit Auge-Toggle.
 * "Passwort vergessen?" → Reset-Flow (Email → "Link senden" → Bestätigung).
 * Magic Link bewusst NICHT (B2B-Tool, tägliche Nutzung → zu viel Friction).
 * Phase 0 ohne Backend: Dev-Bypass direkt in die App. Alle Texte über i18n.
 */

import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithMicrosoft,
  resetPassword,
  authErrorKey,
  isAuthDevBypass,
} from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { GoogleIcon, MicrosoftIcon } from "@/components";

type Mode = "login" | "forgot" | "resetSent";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("login");

  // Ziel nach dem Login: der ursprünglich angeforderte Pfad (Deep-Link) oder Mein Tag.
  const from = (location.state as { from?: string } | null)?.from;
  const target = from && from.startsWith("/app") ? from : "/app/meintag";

  // Dev-Bypass (nur mit explizitem Flag) ODER bereits eingeloggt → direkt in die App.
  if (isAuthDevBypass()) return <Navigate to="/app/meintag" replace />;
  if (session) return <Navigate to={target} replace />;

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) {
        setError(t(authErrorKey(signInError)));
        return;
      }
      navigate(target, { replace: true });
    } catch {
      setError(t("login.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(t(authErrorKey(resetError)));
        return;
      }
      setMode("resetSent");
    } catch {
      setError(t("login.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  // SSO-Redirect-Flow. Bei Erfolg verlässt der Browser die Seite → kein State-Reset nötig.
  const onOAuth = async (fn: typeof signInWithGoogle) => {
    setError(null);
    try {
      const { error: oauthError } = await fn();
      if (oauthError) setError(t(authErrorKey(oauthError)));
    } catch {
      setError(t("login.errorNetwork"));
    }
  };

  const subtitle =
    mode === "login" ? t("login.subtitle")
    : mode === "forgot" ? t("login.resetSubtitle")
    : t("login.resetSentBody");
  const title = mode === "login" ? t("login.title") : t("login.resetTitle");

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
            <h1 className="text-[16px] font-semibold text-text-primary">{title}</h1>
            <p className="text-[12px] text-text-muted mt-0.5">{subtitle}</p>
          </div>
        </div>

        {mode === "resetSent" ? (
          /* Bestätigung nach Reset-Link-Versand */
          <div className="flex flex-col gap-4 items-center text-center">
            <p className="text-[13px] font-medium text-text-primary">{t("login.resetSentTitle")}</p>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className="text-[12px] font-medium text-sherloq-primary hover:opacity-80 transition-opacity cursor-pointer"
            >
              {t("login.backToLogin")}
            </button>
          </div>
        ) : mode === "forgot" ? (
          /* Passwort-vergessen-Formular */
          <form onSubmit={onReset} className="flex flex-col gap-3">
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

            {error && <p className="text-[12px] text-signal-urgent" role="alert">{error}</p>}

            <button type="submit" disabled={loading} className="sherloq-btn-primary w-full justify-center mt-1 disabled:opacity-60">
              {loading ? t("login.resetLoading") : t("login.resetSubmit")}
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className="text-[12px] font-medium text-text-muted hover:text-text-body transition-colors cursor-pointer text-center"
            >
              {t("login.backToLogin")}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={onLogin} className="flex flex-col gap-3">
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

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text-body">{t("login.password")}</span>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? t("login.hidePassword") : t("login.showPassword")}
                    data-tip={showPw ? t("login.hidePassword") : t("login.showPassword")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); }}
                className="text-[11px] font-medium text-sherloq-primary hover:opacity-80 transition-opacity cursor-pointer self-end -mt-1"
              >
                {t("login.forgot")}
              </button>

              {error && <p className="text-[12px] text-signal-urgent" role="alert">{error}</p>}

              <button type="submit" disabled={loading} className="sherloq-btn-primary w-full justify-center mt-1 disabled:opacity-60">
                {loading ? t("login.loading") : t("login.submit")}
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
              <button type="button" onClick={() => onOAuth(signInWithGoogle)} className="sherloq-btn-secondary w-full justify-center gap-2">
                <GoogleIcon className="w-4 h-4" />
                {t("login.google")}
              </button>
              <button type="button" onClick={() => onOAuth(signInWithMicrosoft)} className="sherloq-btn-secondary w-full justify-center gap-2">
                <MicrosoftIcon className="w-4 h-4" />
                {t("login.microsoft")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
