/**
 * ReferenceScreens — die fertig designten Bestands-Screens als visuelle Referenz,
 * verdrahtet mit Mock-Daten (lib/db Stubs) + CustomerDrawer (Side Panel).
 *
 * TEMPORÄR (Phase 0/1): ersetzt die ComingSoon-Platzhalter für Mein Tag / Hunter /
 * Farmer, damit die Kontakte-Kacheln, aufklappbaren Bereiche und Side Panels
 * sichtbar bleiben. In Phase 2 werden diese Screens sauber mit echten Supabase-
 * Daten neu verbunden — dann wird diese Datei abgelöst.
 *
 * Berührt KEINE Phase-0-Komponente (Sidebar/TopBar/Panel-Shells/CommandPalette/Login).
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLeads,
  getCustomers,
  getTasks,
  getPriorities,
  getAppointments,
  getAlerts,
  getContacts,
  getDeals,
  getPipelineSettings,
  updateLeadStage as dbUpdateLeadStage,
  setTaskCompleted as dbSetTaskCompleted,
  createLead as dbCreateLead,
  upgradeSubscription as dbUpgradeSubscription,
} from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/org";
import { contactRowToLead, dealToPipelineRow } from "@/lib/hunterMappers";
import type {
  Lead,
  Customer,
  TaskItemType,
  PriorityItemType,
  AppointmentItemType,
  AlertBannerType,
} from "@/types";
import ScreenMyDay from "@/components/screens/ScreenMyDay";
import ScreenHunting from "@/components/screens/ScreenHunting";
import ScreenFarming from "@/components/screens/ScreenFarming";
import CustomerDrawer from "@/components/shared/CustomerDrawer";

/** Lädt Mock-Daten + hält Drawer-State + Mutations-Handler (lokal, nur Referenz). */
function useReferenceState() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<TaskItemType[]>([]);
  const [priorities, setPriorities] = useState<PriorityItemType[]>([]);
  const [alerts, setAlerts] = useState<AlertBannerType[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItemType[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Lead | Customer | null>(null);
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getLeads(),
      getCustomers(),
      getTasks(),
      getPriorities(),
      getAlerts(),
      getAppointments(),
    ]).then(([l, c, t, p, a, ap]) => {
      if (!active) return;
      setLeads(l);
      setCustomers(c);
      setTasks(t);
      setPriorities(p);
      setAlerts(a);
      setAppointments(ap);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectPerson = (person: Lead | Customer) => {
    setSelectedPerson(person);
    setSelectedCommId(null);
  };
  const selectById = (id: string) => {
    setSelectedCommId(null);
    const foundLead = leads.find((l) => l.id === id);
    if (foundLead) {
      setSelectedPerson(foundLead);
      return;
    }
    const foundCust = customers.find((c) => c.id === id);
    if (foundCust) setSelectedPerson(foundCust);
  };
  const selectCommunication = (personId: string, tpId: string) => {
    selectById(personId);
    setSelectedCommId(tpId);
  };
  const closeDrawer = () => {
    setSelectedPerson(null);
    setSelectedCommId(null);
  };

  const toggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const next = task ? !task.completed : true;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    void dbSetTaskCompleted(taskId, next);
  };
  const resolveAlert = (alertId: string) =>
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  const updateLeadStage = (leadId: string, newStage: string) => {
    const stage = newStage as Lead["pipelineStage"];
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pipelineStage: stage } : l)));
    void dbUpdateLeadStage(leadId, stage);
  };
  const addLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    void dbCreateLead(newLead);
  };
  const upgradeSubscription = (custId: string, newPlan: "Growth" | "Enterprise") => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === custId ? { ...c, subscriptionPlan: newPlan } : c)),
    );
    void dbUpgradeSubscription(custId, newPlan);
  };

  return {
    leads,
    customers,
    tasks,
    priorities,
    alerts,
    appointments,
    selectedPerson,
    selectedCommId,
    selectPerson,
    selectById,
    selectCommunication,
    closeDrawer,
    toggleTask,
    resolveAlert,
    updateLeadStage,
    addLead,
    upgradeSubscription,
  };
}

type RefState = ReturnType<typeof useReferenceState>;

function Drawer({ s }: { s: RefState }) {
  return (
    <CustomerDrawer
      person={s.selectedPerson}
      initialExpandedCommId={s.selectedCommId}
      onClose={s.closeDrawer}
    />
  );
}

export function MeinTagReference() {
  const s = useReferenceState();
  return (
    <>
      <ScreenMyDay
        priorities={s.priorities}
        appointments={s.appointments}
        tasks={s.tasks}
        alerts={s.alerts}
        onPersonSelect={s.selectById}
        onToggleTask={s.toggleTask}
        onResolveAlert={s.resolveAlert}
        leads={s.leads}
        customers={s.customers}
      />
      <Drawer s={s} />
    </>
  );
}

export function HunterReference() {
  const s = useReferenceState();
  // Slice 1 (Read-only): echte org-gescopte Kontakte → Leads-Tab. Andere Tabs
  // bleiben auf Mock (s.leads). organization_id IMMER im Query-Key.
  const leadsQuery = useQuery({
    queryKey: ["contacts", DEMO_ORGANIZATION_ID],
    queryFn: () => getContacts(DEMO_ORGANIZATION_ID),
  });
  const leadsData = leadsQuery.data?.map(contactRowToLead);
  // Slice A: Pipeline-Listenansicht — geteilte Queries (Slice B Kanban erbt sie).
  const dealsQuery = useQuery({
    queryKey: ["deals", DEMO_ORGANIZATION_ID],
    queryFn: () => getDeals(DEMO_ORGANIZATION_ID),
  });
  const stagesQuery = useQuery({
    queryKey: ["pipelineStages", DEMO_ORGANIZATION_ID],
    queryFn: () => getPipelineSettings(DEMO_ORGANIZATION_ID),
  });
  const stageNameBySlug = Object.fromEntries(
    (stagesQuery.data ?? []).map((stage) => [stage.slug, stage.name]),
  );
  const dealsData = dealsQuery.data?.map((deal) => dealToPipelineRow(deal, stageNameBySlug));
  return (
    <>
      <ScreenHunting
        leads={s.leads}
        leadsData={leadsData}
        leadsLoading={leadsQuery.isLoading}
        leadsError={leadsQuery.isError}
        dealsData={dealsData}
        dealsLoading={dealsQuery.isLoading || stagesQuery.isLoading}
        dealsError={dealsQuery.isError || stagesQuery.isError}
        pipelineStages={stagesQuery.data ?? []}
        onSelectLead={s.selectPerson}
        onUpdateLeadStage={s.updateLeadStage}
        onAddLead={s.addLead}
        onSelectCommunication={s.selectCommunication}
      />
      <Drawer s={s} />
    </>
  );
}

export function FarmerReference() {
  const s = useReferenceState();
  return (
    <>
      <ScreenFarming
        customers={s.customers}
        onSelectCustomer={s.selectPerson}
        onUpgradeSubscription={s.upgradeSubscription}
        onSelectCommunication={s.selectCommunication}
      />
      <Drawer s={s} />
    </>
  );
}
