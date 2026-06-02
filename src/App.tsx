/**
 * App.tsx — root component, wires all screens + state together.
 * State lives here; screens receive only what they need via props.
 */

import { useState } from "react";
import {
  INITIAL_LEADS,
  INITIAL_CUSTOMERS,
  INITIAL_PRIORITIES,
  INITIAL_APPOINTMENTS,
  INITIAL_TASKS,
  INITIAL_ALERT_BANNERS,
  INITIAL_MARKETING_IDEAS,
} from "@/data";
import type {
  Lead,
  Customer,
  TaskItemType,
  PriorityItemType,
  AppointmentItemType,
  AlertBannerType,
  LinkedInPostIdea,
} from "@/types";

// Layout
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";

// Shared
import CommandPalette from "@/components/shared/CommandPalette";
import CustomerDrawer from "@/components/shared/CustomerDrawer";

// Screens
import ScreenMyDay from "@/components/screens/ScreenMyDay";
import ScreenHunting from "@/components/screens/ScreenHunting";
import ScreenFarming from "@/components/screens/ScreenFarming";
import ScreenMarketing from "@/components/screens/ScreenMarketing";
import ScreenSherloqSystem from "@/components/screens/ScreenSherloqSystem";
import ScreenJira from "@/components/screens/Jira";

import {
  Settings as SettingsIcon,
  Brain,
  X,
} from "lucide-react";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState("meintag");
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Domain states
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [tasks, setTasks] = useState<TaskItemType[]>(INITIAL_TASKS);
  const [priorities, setPriorities] =
    useState<PriorityItemType[]>(INITIAL_PRIORITIES);
  const [alerts, setAlerts] = useState<AlertBannerType[]>(
    INITIAL_ALERT_BANNERS,
  );
  const [appointments, _setAppointments] =
    useState<AppointmentItemType[]>(INITIAL_APPOINTMENTS);
  const [marketingIdeas, setMarketingIdeas] = useState<LinkedInPostIdea[]>(
    INITIAL_MARKETING_IDEAS,
  );

  // Progressive disclosure drawer (Level 3)
  const [selectedPerson, setSelectedPerson] = useState<Lead | Customer | null>(
    null,
  );
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);

  // Combined people list for search
  const allPeople = [
    ...leads.map((l) => ({ ...l, type: "lead" })),
    ...customers.map((c) => ({ ...c, type: "customer" })),
  ];

  const handleSelectPerson = (person: Lead | Customer) => {
    setSelectedPerson(person);
    setSelectedCommId(null);
  };

  const handlePersonSelectById = (id: string) => {
    setSelectedCommId(null);
    const foundLead = leads.find((l) => l.id === id);
    if (foundLead) { setSelectedPerson(foundLead); return; }
    const foundCust = customers.find((c) => c.id === id);
    if (foundCust) { setSelectedPerson(foundCust); }
  };

  const handleSelectCommunication = (personId: string, tpId: string) => {
    handlePersonSelectById(personId);
    setSelectedCommId(tpId);
  };

  const handleCloseDrawer = () => {
    setSelectedPerson(null);
    setSelectedCommId(null);
  };

  // State mutations
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    );
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      setPriorities((prev) => prev.filter((p) => p.id !== "prio-1"));
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleUpdateLeadStage = (leadId: string, newStage: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, pipelineStage: newStage as Lead["pipelineStage"] } : l,
      ),
    );
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    const newTask: TaskItemType = {
      id: `task-gen-${Date.now()}`,
      person: newLead.person,
      title: `Erstkontakt mit ${newLead.person.name} vertiefen`,
      isOverdue: false,
      recommendedChannel: "LINKEDIN",
      suggestedMessage: `Hallo ${newLead.person.name},\n\nvielen Dank für das Aufnehmen der Verbindung.`,
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpgradeSubscription = (
    custId: string,
    newPlan: "Growth" | "Enterprise",
  ) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === custId ? { ...c, subscriptionPlan: newPlan } : c,
      ),
    );
  };

  const handlePublishPost = (id: string, text: string) => {
    setMarketingIdeas((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, draft: text, status: "published" } : i,
      ),
    );
    alert("Post wurde eingeplant!");
  };

  return (
    <div
      id="app-root"
      className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
        darkMode
          ? "bg-[#1A1D20] text-[#E9ECEF] dark-theme"
          : "bg-[#F8F9FA] text-[#495057]"
      }`}
    >
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #DEE2E6; border-radius: 10px; }
        .dark-theme .bg-white { background-color: #24272A !important; }
        .dark-theme .bg-[#F8F9FA] { background-color: #1A1D20 !important; }
        .dark-theme .text-[#212529] { color: #F1F3F5 !important; }
        .dark-theme .text-[#495057] { color: #CED4DA !important; }
      `}</style>

      {/* TOP NAV */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* COMMAND PALETTE */}
      <CommandPalette
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allPeople={allPeople}
        onSearchSelect={handleSelectPerson}
        showModal={showCommandPalette}
        setShowModal={setShowCommandPalette}
      />

      {/* BODY */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSearch={() => setShowCommandPalette(true)}
        />

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300">
          {activeTab === "meintag" && (
            <ScreenMyDay
              priorities={priorities}
              appointments={appointments}
              tasks={tasks}
              alerts={alerts}
              onPersonSelect={handlePersonSelectById}
              onToggleTask={handleToggleTask}
              onResolveAlert={handleResolveAlert}
              leads={leads}
              customers={customers}
            />
          )}
          {activeTab === "hunting" && (
            <ScreenHunting
              leads={leads}
              onSelectLead={handleSelectPerson}
              onUpdateLeadStage={handleUpdateLeadStage}
              onAddLead={handleAddLead}
              onSelectCommunication={handleSelectCommunication}
            />
          )}
          {activeTab === "farming" && (
            <ScreenFarming
              customers={customers}
              onSelectCustomer={handleSelectPerson}
              onUpgradeSubscription={handleUpgradeSubscription}
              onSelectCommunication={handleSelectCommunication}
            />
          )}
          {activeTab === "marketing" && (
            <ScreenMarketing
              ideas={marketingIdeas}
              onPublishPost={handlePublishPost}
            />
          )}
          {activeTab === "system" && <ScreenSherloqSystem />}
          {activeTab === "jira" && <ScreenJira />}
        </main>
      </div>

      {/* CUSTOMER DRAWER (Level 3) */}
      {selectedPerson && (
        <CustomerDrawer
          person={selectedPerson}
          initialExpandedCommId={selectedCommId}
          onClose={handleCloseDrawer}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-[440px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-[#868E96] hover:text-[#212529] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-[14px] font-bold text-[#212529] uppercase tracking-wider font-mono flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[#175253]" />
              Sales OS Systemkonfiguration
            </h3>
            <div className="mt-4 flex flex-col gap-3.5">
              <div className="bg-[#ECFEF9] border border-[#125455]/10 p-4 rounded-[16px]">
                <div className="flex items-center gap-2 text-[#125455] font-semibold text-[12px]">
                  <Brain className="w-4 h-4" />
                  <span>Design Token System</span>
                </div>
                <p className="text-[11px] text-[#495057] mt-1.5 leading-relaxed">
                  shadcn/ui + Tailwind CSS v4 + CSS Variables. Alle Tokens in src/index.css.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="sherloq-btn-primary w-full justify-center"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
