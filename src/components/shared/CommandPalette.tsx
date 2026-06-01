import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Compass,
  Sun,
  Target,
  Sprout,
  Megaphone,
  Terminal,
  FileText,
  CheckCircle,
  Briefcase,
  Plus,
  ArrowRight,
  User,
} from "lucide-react";

interface CommandPaletteProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allPeople: any[];
  onSearchSelect: (person: any) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export default function CommandPalette({
  activeTab,
  setActiveTab,
  allPeople,
  onSearchSelect,
  showModal,
  setShowModal,
}: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowModal(true);
      }
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowModal]);

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchTerm("");
    }
  }, [showModal]);

  const filteredPeople =
    searchTerm.trim() === ""
      ? []
      : allPeople.filter(
          (p) =>
            p.person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.person.company.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  const quickNav = [
    { id: "meintag", label: "Mein Tag", icon: <Sun className="w-4 h-4" /> },
    { id: "hunting", label: "Hunter", icon: <Target className="w-4 h-4" /> },
    { id: "farming", label: "Farmer", icon: <Sprout className="w-4 h-4" /> },
    { id: "marketing", label: "Marketing", icon: <Megaphone className="w-4 h-4" /> },
    { id: "jira", label: "Jira", icon: <Terminal className="w-4 h-4" /> },
    { id: "system", label: "Sherloq System", icon: <Compass className="w-4 h-4" /> },
  ].filter((n) => n.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const quickActions = [
    { id: "new_contact", label: "Neuer Kontakt", icon: <Plus className="w-5 h-5" /> },
    { id: "new_company", label: "Neue Company", icon: <Plus className="w-5 h-5" /> },
    { id: "new_deal", label: "Neuer Deal", icon: <Plus className="w-5 h-5" /> },
    { id: "new_task", label: "Task erledigen", icon: <CheckCircle className="w-5 h-5" /> },
  ].filter((n) => n.label.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50 transition-all shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)]"
      onClick={() => setShowModal(false)}
    >
      <div
        className="w-full max-w-[600px] bg-app-surface rounded-[24px] shadow-2xl overflow-hidden p-0 transform transition-all border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Suchen nach Entitäten, Navigation oder Aktionen..."
            className="w-full font-sans text-[16px] text-text-primary bg-transparent focus:outline-none placeholder-text-muted font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <kbd className="text-[10px] font-mono bg-app-bg border border-border text-text-muted px-1.5 py-0.5 rounded shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Scrollable Results Area */}
        <div className="max-h-[400px] overflow-y-auto px-2 py-2 flex flex-col gap-4">
          {/* Quick Nav */}
          {quickNav.length > 0 && (
            <div className="flex flex-col">
              <div className="px-4 py-2 text-[10px] font-bold font-mono text-text-muted uppercase tracking-wider">
                Navigation
              </div>
              {quickNav.map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveTab(nav.id);
                    setShowModal(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 mx-2 rounded-[12px] hover:bg-app-bg transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-pill bg-[var(--sherloq-light)] text-sherloq-primary flex items-center justify-center">
                    {nav.icon}
                  </div>
                  <span className="text-[14px] font-medium text-text-primary font-sans">
                    {nav.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-icon-muted ml-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="flex flex-col mt-2">
              <div className="px-5 py-2 text-[12px] font-bold font-sans text-text-muted uppercase tracking-wider">
                Schnellaktionen
              </div>
              {quickActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => {
                    // Quick Action placeholder
                    setShowModal(false);
                  }}
                  className={`group flex items-center gap-4 px-4 py-3 pb-3 mx-2 rounded-[16px] transition-all cursor-pointer text-left focus:bg-app-bg ${
                    index === 0 ? "bg-app-bg" : "hover:bg-app-bg"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors ${
                      index === 0
                        ? "bg-sherloq-dark text-white"
                        : "bg-border-strong text-text-body group-hover:bg-sherloq-dark group-hover:text-white"
                    }`}
                  >
                    {action.icon}
                  </div>
                  <span className="text-[15px] font-semibold tracking-tight text-text-primary font-sans">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Entities (People/Companies) */}
          {searchTerm.trim() !== "" && (
            <div className="flex flex-col">
              <div className="px-4 py-2 text-[10px] font-bold font-mono text-text-muted uppercase tracking-wider">
                Kontakte & Firmen
              </div>
              {filteredPeople.length > 0 ? (
                filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => {
                      onSearchSelect(person);
                      setShowModal(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 mx-2 rounded-[12px] hover:bg-app-bg transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      {person.person.avatarUrl ? (
                        <img src={person.person.avatarUrl} alt={person.person.name} className="w-10 h-10 rounded-pill object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-pill bg-sherloq-primary text-white flex items-center justify-center font-sans font-medium text-[13px] shadow-sm">
                          {person.person.initials}
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] font-medium text-text-primary">
                          {person.person.name}
                        </span>
                        <span className="text-[12px] text-text-muted">
                          {person.person.company} · {person.person.jobTitle}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-3 py-1 rounded-pill font-bold uppercase ${
                        person.sherloqStatus
                          ? "bg-[var(--sherloq-light)] text-sherloq-primary"
                          : "bg-border-subtle text-text-body"
                      }`}
                    >
                      {person.sherloqStatus ? "Farmer" : "Hunter"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-6 py-4 text-text-muted text-[13px] font-sans">
                  Keine Kontakte für "{searchTerm}" gefunden.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-3 border-t border-border bg-app-bg text-text-muted text-[11px] font-mono gap-4">
          <div className="flex items-center gap-1">
            <kbd className="bg-app-surface border border-border rounded px-1 min-w-[18px] text-center shadow-sm">
              ↑
            </kbd>
            <kbd className="bg-app-surface border border-border rounded px-1 min-w-[18px] text-center shadow-sm">
              ↓
            </kbd>
            <span>Navigieren</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-app-surface border border-border rounded px-1 min-w-[18px] text-center shadow-sm">
              ↵
            </kbd>
            <span>Auswählen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
