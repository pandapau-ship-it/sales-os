/**
 * PublicPlaceholder — reservierte ÖFFENTLICHE Routen ([D21]).
 *
 * Diese Pfade werden von Personen OHNE Account aufgerufen und dürfen NIE hinter Login liegen.
 * Die eigentlichen Seiten entstehen mit ihren Modulen:
 *   - /invite/:token   → Einladungs-Annahme + Passwort setzen (mit [D29] Mailversand)
 *   - /unsubscribe      → DSGVO-Abmeldung (mit dem Sending-Layer)
 * Bis dahin steht hier ein neutraler Platzhalter — Zweck: das Routen-MUSTER von Anfang an korrekt
 * (explizit + öffentlich + VOR dem Catch-all). Text über i18n, kein Account-Kontext.
 */
import { useTranslation } from "react-i18next";

export default function PublicPlaceholder({ titleKey, bodyKey }: { titleKey: string; bodyKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="sherloq-card w-full max-w-[380px] p-7 flex flex-col items-center gap-3 text-center">
        <div
          style={{ width: 40, height: 40, background: "var(--sherloq-primary)", borderRadius: "var(--radius-btn)" }}
          className="flex items-center justify-center"
        >
          <span className="text-on-accent font-semibold text-base leading-none">S</span>
        </div>
        <h1 className="text-[16px] font-semibold text-text-primary">{t(titleKey)}</h1>
        <p className="text-[12px] text-text-muted">{t(bodyKey)}</p>
      </div>
    </div>
  );
}
