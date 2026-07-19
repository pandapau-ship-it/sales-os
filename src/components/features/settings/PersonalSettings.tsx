/**
 * PersonalSettings — gebündelter „Persönlich"-Bereich hinter dem Avatar-Dropdown (SET-2 UI).
 *
 * Drei interne Reiter (Mein Profil / Ansicht / Sicherheit) — KEINE Punkte in der Haupt-Settings-Nav
 * (Struktur-Korrektur, settings_bauplan §5). Route `/app/profil` innerhalb des AppLayout (Entscheidung E).
 * Tab-Muster = geteiltes `PanelTabs`. Alle Inhalte an echte SET-2-Backend-Functions gebunden.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, LayoutTemplate, ShieldCheck } from "lucide-react";
import { PanelTabs } from "@/components";
import MyProfileTab from "./MyProfileTab";
import AppearanceTab from "./AppearanceTab";
import SecurityTab from "./SecurityTab";

type Tab = "profile" | "appearance" | "security";

export default function PersonalSettings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("profile");

  const tabs = [
    { id: "profile", label: t("personal.tabProfile"), icon: <User className="w-4 h-4" /> },
    { id: "appearance", label: t("personal.tabAppearance"), icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: "security", label: t("personal.tabSecurity"), icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full">
      <h1 className="typo-page-title text-text-primary mb-1">{t("personal.title")}</h1>
      <p className="typo-subline text-text-muted mb-6">{t("personal.subtitle")}</p>

      <div className="border-b border-border mb-6">
        <PanelTabs tabs={tabs} active={tab} onChange={(id) => setTab(id as Tab)} />
      </div>

      {tab === "profile" && <MyProfileTab />}
      {tab === "appearance" && <AppearanceTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}
