/**
 * ProvisioningGate — eingeloggt, aber KEIN public.users-Datensatz ([D21], invite-only).
 *
 * Erscheint, wenn eine Session existiert, der User aber keiner Organisation zugeordnet ist
 * (getUserOrgRole → null). Zwei Fälle: (a) SSO-Erstlogin OHNE gültige Einladung (invite-only:
 * `handle_new_user` legt bewusst keine Org an) → „Zugang nur auf Einladung"; (b) seltener
 * Provisioning-Fehler. Statt still auf die Demo-Org auszuweichen (verschleiert das Problem)
 * wird es sichtbar gemacht — plus Logout, um die verwaiste Session sauber zu beenden.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { signOut } from "@/lib/auth";

export default function ProvisioningGate() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const doLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="sherloq-card w-full max-w-[400px] p-7 flex flex-col items-center gap-4 text-center">
        <div className="w-11 h-11 rounded-[12px] bg-[var(--signal-warn-bg)] flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[var(--signal-warn-text)]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-[16px] font-semibold text-text-primary">{t("auth.inviteOnlyTitle")}</h1>
          <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{t("auth.inviteOnlyBody")}</p>
        </div>
        <button type="button" onClick={doLogout} className="sherloq-btn-secondary w-full justify-center">
          {t("auth.logout")}
        </button>
      </div>
    </div>
  );
}
