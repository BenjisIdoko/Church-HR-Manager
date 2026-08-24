import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchServicePlans,
  fetchServiceItems,
  fetchServiceRoster,
  createServicePlan,
  updateServicePlan,
  deleteServicePlan,
  addServiceItem,
  updateServiceItem,
  deleteServiceItem,
  addServiceRoster,
  deleteServiceRoster,
  sendRosterReminder,
} from "../utils/api";
import { ServiceItem, ServicePlan, ServiceRoster, Worker } from "../types/models";
import { toast } from "sonner";
import { printReport } from "../utils/exportUtils";

export function useServicePlan() {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Plan Modals State
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceType, setServiceType] = useState("Sunday Glorious");

  // Item Modals State
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDuration, setItemDuration] = useState("10");
  const [itemLeader, setItemLeader] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // Roster Modal State
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [rosterDept, setRosterDept] = useState("Ushering");
  const [rosterWorkerId, setRosterWorkerId] = useState("");
  const [rosterRole, setRosterRole] = useState("Lead Volunteer");

  // Reminder & Bulletin Modals State
  const [reminderRoster, setReminderRoster] = useState<ServiceRoster | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

  // Queries
  const { data: plans = [], isLoading: loadingPlans } = useQuery<ServicePlan[]>({
    queryKey: ["servicePlans"],
    queryFn: fetchServicePlans,
  });

  const activePlanId = selectedPlanId ?? (plans.length > 0 ? plans[0].id : null);
  const activePlan = plans.find((p) => p.id === activePlanId) || null;

  const { data: serviceItems = [], isLoading: loadingItems } = useQuery<ServiceItem[]>({
    queryKey: ["serviceItems", activePlanId],
    queryFn: () => (activePlanId ? fetchServiceItems(activePlanId) : Promise.resolve([])),
    enabled: Boolean(activePlanId),
  });

  const { data: serviceRoster = [], isLoading: loadingRoster } = useQuery<ServiceRoster[]>({
    queryKey: ["serviceRoster", activePlanId],
    queryFn: () => (activePlanId ? fetchServiceRoster(activePlanId) : Promise.resolve([])),
    enabled: Boolean(activePlanId),
  });

  // Plan Mutations
  const createPlanMutation = useMutation({
    mutationFn: (payload: { title: string; date: string; serviceType: string }) => createServicePlan(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["servicePlans"] });
      if (res?.id) setSelectedPlanId(res.id);
      setIsPlanOpen(false);
      toast.success("Service plan created!");
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title: string; date: string; serviceType: string } }) =>
      updateServicePlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePlans"] });
      setIsPlanOpen(false);
      toast.success("Service plan updated!");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => deleteServicePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePlans"] });
      setSelectedPlanId(null);
      toast.success("Service plan deleted.");
    },
  });

  // Item Mutations
  const addItemMutation = useMutation({
    mutationFn: (payload: any) => addServiceItem(activePlanId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceItems", activePlanId] });
      setIsItemOpen(false);
      toast.success("Service item added!");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: any }) => updateServiceItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceItems", activePlanId] });
      setIsItemOpen(false);
      toast.success("Service item updated!");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteServiceItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceItems", activePlanId] });
      toast.success("Service item removed.");
    },
  });

  // Roster Mutations
  const addRosterMutation = useMutation({
    mutationFn: (payload: any) => addServiceRoster(activePlanId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRoster", activePlanId] });
      setIsRosterOpen(false);
      toast.success("Volunteer scheduled on roster!");
    },
  });

  const deleteRosterMutation = useMutation({
    mutationFn: (rosterId: number) => deleteServiceRoster(rosterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceRoster", activePlanId] });
      toast.success("Volunteer removed from roster.");
    },
  });

  const handleOpenNewPlan = () => {
    setEditingPlan(null);
    setPlanTitle("");
    setPlanDate(new Date().toISOString().split("T")[0]);
    setServiceType("Sunday Glorious");
    setIsPlanOpen(true);
  };

  const handleOpenEditPlan = (plan: ServicePlan) => {
    setEditingPlan(plan);
    setPlanTitle(plan.title);
    setPlanDate(plan.date);
    setServiceType(plan.serviceType || plan.service_type || "Sunday Glorious");
    setIsPlanOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) { toast.error("Plan title is required"); return; }

    const payload = { title: planTitle.trim(), date: planDate, serviceType };
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) { toast.error("Item title is required"); return; }
    if (!activePlanId) return;

    const payload = {
      sequence: editingItem ? editingItem.sequence : serviceItems.length + 1,
      title: itemTitle.trim(),
      durationMinutes: Number(itemDuration || 10),
      leaderName: itemLeader.trim() || null,
      notes: itemNotes.trim() || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ itemId: editingItem.id, payload });
    } else {
      addItemMutation.mutate(payload);
    }
  };

  const handleSaveRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterWorkerId) { toast.error("Please select a volunteer worker"); return; }
    if (!activePlanId) return;

    addRosterMutation.mutate({
      department: rosterDept,
      workerId: rosterWorkerId,
      roleTitle: rosterRole,
      status: "confirmed",
    });
  };

  return {
    plans,
    activePlan,
    activePlanId, setSelectedPlanId,
    serviceItems,
    serviceRoster,
    loadingPlans,
    loadingItems,
    loadingRoster,
    isPlanOpen, setIsPlanOpen,
    editingPlan,
    planTitle, setPlanTitle,
    planDate, setPlanDate,
    serviceType, setServiceType,
    isItemOpen, setIsItemOpen,
    editingItem, setEditingItem,
    itemTitle, setItemTitle,
    itemDuration, setItemDuration,
    itemLeader, setItemLeader,
    itemNotes, setItemNotes,
    isRosterOpen, setIsRosterOpen,
    rosterDept, setRosterDept,
    rosterWorkerId, setRosterWorkerId,
    rosterRole, setRosterRole,
    reminderRoster, setReminderRoster,
    isReminderOpen, setIsReminderOpen,
    isProgramModalOpen, setIsProgramModalOpen,
    handleOpenNewPlan,
    handleOpenEditPlan,
    handleSavePlan,
    handleSaveItem,
    handleSaveRoster,
    handleDeletePlan: (id: number) => deletePlanMutation.mutate(id),
    handleDeleteItem: (id: number) => deleteItemMutation.mutate(id),
    handleDeleteRoster: (id: number) => deleteRosterMutation.mutate(id),
  };
}
