/**
 * Login — funktionaler Login-Screen (Schritt 10).
 *
 * Email + Passwort → signIn() (lib/auth → Supabase). Loading-State, Inline-Fehler,
 * nach Erfolg redirect zu /app/meintag. Alle Texte über i18n.
 * Phase 0 ohne konfiguriertes Backend: Dev-Bypass direkt in die App.
 * Finales Design folgt mit dem Login-Design-Ordner.
 */

import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signIn } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/db";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 0 ohne Backend → direkt in die App (Dev-Bypass).
  if (!isSupabaseConfigured()) return <Navigate to="/app/meintag" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(t("login.error"));
        return;
      }
      navigate("/app/meintag", { replace: true });
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
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
            <p className="text-[12px] text-text-muted mt-0.5">{t("login.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.passwordPlaceholder")}
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
            {loading ? t("login.loading") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
