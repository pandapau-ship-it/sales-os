/**
 * MfaBanner — empfiehlt Owner/Admin beim Login die 2FA-Einrichtung ([D21] Scheibe 8).
 *
 * Erscheint nur, wenn: role ∈ {owner, admin} · 2FA NICHT eingerichtet (useMfaStatus) ·
 * nicht (temporär) ausgeblendet (localStorage `mfa_banner_dismissed_until`). Kein Zwang —
 * „Später" (+7 Tage) / „Nicht mehr erinnern" (+365 Tage). „2FA einrichten" öffnet den
 * TOTP-Setup-Dialog (QR scannen → 6-stelligen Code bestätigen, Supabase MFA nativ).
 * Props: `role` (owner|admin|member|viewer|…).
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { useMfaStatus } from "@/hooks/useMfaStatus";
import { enrollMfaTotp, verifyMfaTotp } from "@/lib/auth";
import { useToast } from "@/components/shared/Toast";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const DISMISS_KEY = "mfa_banner_dismissed_until";
const DAY_MS = 86_400_000;

function isDismissed(): boolean {
  const v = localStorage.getItem(DISMISS_KEY);
  if (!v) return false;
  const until = new Date(v).getTime();
  return !Number.isNaN(until) && until > Date.now();
}

export default function MfaBanner({ role }: { role: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { enrolled, loading, refetch } = useMfaStatus();

  const [dismissed, setDismissed] = useState(isDismissed);
  const [open, setOpen] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const eligibleRole = role === "owner" || role === "admin";
  if (!eligibleRole || loading || enrolled || dismissed) return null;

  const snooze = (days: number) => {
    localStorage.setItem(DISMISS_KEY, new Date(Date.now() + days * DAY_MS).toISOString());
    setDismissed(true);
  };

  const startSetup = async () => {
    setOpen(true);
    setCode("");
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    try {
      const f = await enrollMfaTotp();
      setFactorId(f.factorId);
      setQrCode(f.qrCode);
      setSecret(f.secret);
    } catch {
      setOpen(false);
      toast(t("mfa.enrollError"), "error");
    }
  };

  const confirm = async () => {
    if (!factorId || code.trim().length < 6) return;
    setBusy(true);
    try {
      const { error } = await verifyMfaTotp(factorId, code.trim());
      if (error) { toast(t("mfa.wrongCode"), "error"); return; }
      toast(t("mfa.success"));
      setOpen(false);
      refetch(); // enrolled → true → Banner verschwindet dauerhaft
    } catch {
      toast(t("mfa.wrongCode"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-[12px] border border-[var(--signal-warn-text)]/30 bg-[var(--signal-warn-bg)] px-5 py-4 mb-4">
        <ShieldAlert className="w-6 h-6 text-[var(--signal-warn-text)] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="typo-card-title text-text-primary">{t("mfa.bannerTitle")}</p>
          <p className="typo-subline text-text-muted mt-0.5">{t("mfa.bannerBody")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={startSetup} className="sherloq-btn-primary">{t("mfa.setup")}</button>
          <button
            onClick={() => snooze(7)}
            className="px-3 py-1.5 rounded-[10px] text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer"
          >
            {t("mfa.later")}
          </button>
        </div>
        <button
          onClick={() => snooze(365)}
          className="text-[11px] font-medium text-text-muted hover:text-text-body transition-colors cursor-pointer shrink-0"
        >
          {t("mfa.never")}
        </button>
      </div>

      {/* TOTP-Setup-Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mfa.setupTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-text-body">{t("mfa.setupHint")}</p>
            {qrCode ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrCode} alt="QR" className="w-44 h-44 rounded-[8px] bg-app-surface" />
                {secret && (
                  <span className="text-[12px] text-text-muted text-center select-all break-all">{secret}</span>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-text-muted">{t("common.loading")}</p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-body">{t("mfa.codeLabel")}</span>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
            </label>
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="sherloq-btn-secondary">
                {t("mfa.cancel")}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy || !factorId || code.trim().length < 6}
                className="sherloq-btn-primary disabled:opacity-60"
              >
                {busy ? t("mfa.verifying") : t("mfa.confirm")}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
