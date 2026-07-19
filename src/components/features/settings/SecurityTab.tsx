/**
 * SecurityTab — Settings → Persönlich → Sicherheit (SET-2 UI).
 *
 * Passwort ändern: aktuelles PW wird per Re-Auth (signInWithEmail) VERIFIZIERT (Entscheidung D —
 * Supabase updateUser prüft es nicht), dann updatePassword. Einziger expliziter Speichern-Button.
 * „Angemeldet über": read-only Anzeige der echten verbundenen Provider (getUserIdentities). Kein Mock.
 */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signInWithEmail, updatePassword, getUserIdentities } from "@/lib/auth";
import { SettingsCard, GoogleIcon, MicrosoftIcon } from "@/components";
import { Input } from "@/components/ui/input";

const MIN_PW_LEN = 8;

const SSO: { provider: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { provider: "google", label: "Google Workspace", Icon: GoogleIcon },
  { provider: "azure", label: "Microsoft 365", Icon: MicrosoftIcon },
];

function PwInput({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <label className="typo-field-label text-text-muted block">{label}</label>
      <div className="relative">
        <Input type={show ? "text" : "password"} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" />
        <button
          type="button" onClick={onToggle}
          aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
          data-tip={show ? t("login.hidePassword") : t("login.showPassword")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SecurityTab() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showK, setShowK] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const identitiesQuery = useQuery({
    enabled: !!user?.id,
    queryKey: ["identities", user?.id],
    queryFn: getUserIdentities,
    staleTime: 5 * 60_000,
  });
  const identities = identitiesQuery.data ?? [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setDone(false);
    if (next.length < MIN_PW_LEN) { setError(t("personal.security.pwTooShort")); return; }
    if (next !== confirm) { setError(t("personal.security.pwMismatch")); return; }
    if (!user?.email) { setError(t("login.errorGeneric")); return; }
    setBusy(true);
    try {
      // Aktuelles Passwort verifizieren (Re-Auth) — Supabase prüft es bei updateUser nicht.
      const { error: reauthErr } = await signInWithEmail(user.email, current);
      if (reauthErr) { setError(t("personal.security.pwWrong")); return; }
      const { error: upErr } = await updatePassword(next);
      if (upErr) { setError(t("login.errorGeneric")); return; }
      setCurrent(""); setNext(""); setConfirm(""); setDone(true);
    } catch {
      setError(t("login.errorNetwork"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SettingsCard title={t("personal.security.pwTitle")} description={t("personal.security.pwDesc")} saved={done ? "saved" : null}>
        <form onSubmit={submit} className="space-y-4">
          <PwInput label={t("personal.security.currentPw")} value={current} onChange={setCurrent} show={showC} onToggle={() => setShowC((v) => !v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PwInput label={t("personal.security.newPw")} value={next} onChange={setNext} show={showN} onToggle={() => setShowN((v) => !v)} />
            <PwInput label={t("personal.security.confirmPw")} value={confirm} onChange={setConfirm} show={showK} onToggle={() => setShowK((v) => !v)} />
          </div>
          {error && <p className="text-[12px] text-signal-urgent" role="alert">{error}</p>}
          <div className="pt-1">
            <button type="submit" disabled={busy || !current || !next} className="sherloq-btn-primary justify-center disabled:opacity-60">
              {busy ? t("personal.security.pwSaving") : t("personal.security.pwSave")}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title={t("personal.security.ssoTitle")} description={t("personal.security.ssoDesc")}>
        <div className="space-y-3">
          {SSO.map(({ provider, label, Icon }) => {
            const connected = identities.includes(provider);
            return (
              <div key={provider} className={`flex items-center justify-between p-4 border border-border rounded-[12px] ${connected ? "bg-app-bg" : "bg-app-surface opacity-70"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-app-surface border border-border rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="typo-card-title text-text-primary leading-none mb-1">{label}</h4>
                    <p className="text-[12px] text-text-muted">
                      {connected ? user?.email ?? t("personal.security.connected") : t("personal.security.notConnected")}
                    </p>
                  </div>
                </div>
                {connected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full typo-chip bg-[var(--signal-teal-bg)] text-[var(--signal-teal-text)]">
                    <Check className="w-3.5 h-3.5" />
                    {t("personal.security.connected")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
