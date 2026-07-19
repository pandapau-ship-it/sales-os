/**
 * ResetPassword — Abschluss des Passwort-Reset-Flows ([D21]).
 *
 * Der Reset-Link (Email) führt hierher; detectSessionInUrl (db.ts) etabliert die Recovery-Session.
 * Diese Seite zeigt das „neues Passwort setzen"-Formular (Passwort + Bestätigung), ruft updatePassword
 * und leitet danach in die App. Ohne gültige Recovery-Session → freundlicher „Link ungültig/abgelaufen"-
 * Hinweis + zurück zum Login. Öffentliche Route (vor dem Catch-all). Alle Texte über i18n.
 */
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword, isAuthDevBypass } from "@/lib/auth";
import { Input } from "@/components/ui/input";

const MIN_PW_LEN = 8; // Client-Mindestlänge (spiegelt die Supabase-Auth-Policy)

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthDevBypass()) return <Navigate to="/app/meintag" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
        <p className="text-[13px] text-text-muted">{t("login.callback")}</p>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PW_LEN) { setError(t("login.resetNewTooShort")); return; }
    if (password !== confirm) { setError(t("login.resetNewMismatch")); return; }
    setBusy(true);
    try {
      const { error: upErr } = await updatePassword(password);
      if (upErr) { setError(t("login.errorGeneric")); return; }
      navigate("/app/meintag", { replace: true });
    } catch {
      setError(t("login.errorNetwork"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="sherloq-card w-full max-w-[380px] p-7 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <div
            style={{ width: 40, height: 40, background: "var(--sherloq-primary)", borderRadius: "var(--radius-btn)" }}
            className="flex items-center justify-center"
          >
            <span className="text-on-accent font-semibold text-base leading-none">S</span>
          </div>
          <div className="text-center">
            <h1 className="text-[16px] font-semibold text-text-primary">{t("login.resetNewTitle")}</h1>
            <p className="text-[12px] text-text-muted mt-0.5">
              {session ? t("login.resetNewSubtitle") : t("login.resetInvalidBody")}
            </p>
          </div>
        </div>

        {!session ? (
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="text-[12px] font-medium text-sherloq-primary hover:opacity-80 transition-opacity cursor-pointer text-center"
          >
            {t("login.backToLogin")}
          </button>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-body">{t("login.resetNewPassword")}</span>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-body">{t("login.resetNewConfirm")}</span>
              <Input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
              />
            </label>

            {error && <p className="text-[12px] text-signal-urgent" role="alert">{error}</p>}

            <button type="submit" disabled={busy} className="sherloq-btn-primary w-full justify-center mt-1 disabled:opacity-60">
              {busy ? t("login.resetNewLoading") : t("login.resetNewSubmit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
