import { useEffect, useState } from "react";
import { Music, Clock, Users, Plus, Calendar, CheckCircle2, UserCheck, Play, Sparkles, Pencil, Trash2, Send, Mail, MessageSquare, Phone, Bell, Share2, AlertCircle, FileText, Printer, Copy } from "lucide-react";
import { DatePicker } from "./ui/date-picker";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ServiceItem, ServicePlan, ServiceRoster, Worker } from "../types/models";
import {
  addServiceItem,
  addServiceRoster,
  createServicePlan,
  deleteServiceItem,
  deleteServicePlan,
  deleteServiceRoster,
  fetchServiceItems,
  fetchServicePlans,
  fetchServiceRoster,
  sendRosterReminder,
  updateServiceItem,
  updateServicePlan,
} from "../utils/api";
import { toast } from "sonner";
import { printReport } from "../utils/exportUtils";
import { SearchableWorkerSelect } from "./SearchableWorkerSelect";

interface ServicePlannerProps {
  workers: Worker[];
}

export function ServicePlanner({ workers }: ServicePlannerProps) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceRoster, setServiceRoster] = useState<ServiceRoster[]>([]);
  const [loading, setLoading] = useState(true);

  // New & Edit Plan Modal
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceType, setServiceType] = useState("Sunday Glorious");

  // New & Edit Item Modal
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDuration, setItemDuration] = useState("10");
  const [itemLeader, setItemLeader] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // New Roster Modal
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [rosterDept, setRosterDept] = useState("Ushering");
  const [rosterWorkerId, setRosterWorkerId] = useState("");
  const [rosterRole, setRosterRole] = useState("Lead Volunteer");

  // Reminder Modal State
  const [reminderRoster, setReminderRoster] = useState<ServiceRoster | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Service Program Bulletin Modal State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchServicePlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]);
      }
    } catch {
      toast.error("Failed to load service plans");
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (planId: number) => {
    try {
      const [items, roster] = await Promise.all([
        fetchServiceItems(planId),
        fetchServiceRoster(planId),
      ]);
      setServiceItems(items);
      setServiceRoster(roster);
    } catch {
      toast.error("Failed to load service plan breakdown");
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      void loadPlanDetails(selectedPlan.id);
    }
  }, [selectedPlan]);

  // Open Create Plan Modal
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanTitle("");
    setPlanDate(new Date().toISOString().split("T")[0]);
    setServiceType("Sunday Glorious");
    setIsPlanOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: ServicePlan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPlan(plan);
    setPlanTitle(plan.title);
    setPlanDate(plan.date);
    setServiceType(plan.service_type);
    setIsPlanOpen(true);
  };

  // Save (Create or Update) Service Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) {
      toast.error("Plan title is required");
      return;
    }

    try {
      if (editingPlan) {
        await updateServicePlan(editingPlan.id, {
          title: planTitle.trim(),
          date: planDate,
          service_type: serviceType,
        });
        toast.success("Service plan updated!");
      } else {
        const res = await createServicePlan({
          title: planTitle.trim(),
          date: planDate,
          service_type: serviceType,
        });
        toast.success("Service plan created!");
        const updatedPlans = await fetchServicePlans();
        const created = updatedPlans.find((p) => p.id === res.id) || {
          id: res.id,
          title: planTitle.trim(),
          date: planDate,
          service_type: serviceType,
        };
        setSelectedPlan(created as ServicePlan);
      }

      setIsPlanOpen(false);
      setEditingPlan(null);
      setPlanTitle("");
      const updatedPlans = await fetchServicePlans();
      setPlans(updatedPlans);
      if (editingPlan && selectedPlan?.id === editingPlan.id) {
        const updatedSelected = updatedPlans.find((p) => p.id === editingPlan.id);
        if (updatedSelected) setSelectedPlan(updatedSelected);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save service plan");
    }
  };

  // Delete Plan
  const handleDeletePlan = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this service plan?")) return;

    try {
      await deleteServicePlan(id);
      toast.success("Service plan removed");
      const updated = await fetchServicePlans();
      setPlans(updated);
      if (selectedPlan?.id === id) {
        setSelectedPlan(updated.length > 0 ? updated[0] : null);
      }
    } catch {
      toast.error("Failed to delete service plan");
    }
  };

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemTitle("");
    setItemDuration("10");
    setItemLeader("");
    setItemNotes("");
    setIsItemOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item: ServiceItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemDuration(String(item.duration_minutes));
    setItemLeader(item.leader_name || "");
    setItemNotes(item.notes || "");
    setIsItemOpen(true);
  };

  // Save (Create or Update) Service Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !itemTitle.trim()) return;

    try {
      if (editingItem) {
        await updateServiceItem(editingItem.id, {
          title: itemTitle.trim(),
          duration_minutes: Number(itemDuration) || 10,
          leader_name: itemLeader.trim(),
          notes: itemNotes.trim(),
        });
        toast.success("Service order item updated!");
      } else {
        await addServiceItem(selectedPlan.id, {
          sequence: serviceItems.length + 1,
          title: itemTitle.trim(),
          duration_minutes: Number(itemDuration) || 10,
          leader_name: itemLeader.trim(),
          notes: itemNotes.trim(),
        });
        toast.success("Service item added to order!");
      }

      setIsItemOpen(false);
      setEditingItem(null);
      setItemTitle("");
      setItemNotes("");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to save service item");
    }
  };

  // Delete Service Item
  const handleDeleteItem = async (itemId: number) => {
    if (!selectedPlan) return;
    try {
      await deleteServiceItem(itemId);
      toast.success("Service item removed");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to remove service item");
    }
  };

  // Add Roster Entry
  const handleAddRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !rosterWorkerId) return;

    const matchedWorker = workers.find((w) => String(w.id) === String(rosterWorkerId));

    try {
      await addServiceRoster(selectedPlan.id, {
        department: rosterDept,
        worker_id: Number(rosterWorkerId) || 1,
        worker_name: matchedWorker?.name || "Volunteer",
        role_title: rosterRole.trim() || "Volunteer",
        status: "confirmed",
      });
      toast.success("Volunteer scheduled for service!");
      setIsRosterOpen(false);
      setRosterWorkerId("");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to schedule volunteer");
    }
  };

  // Delete Roster Entry
  const handleDeleteRoster = async (rosterId: number) => {
    if (!selectedPlan) return;
    try {
      await deleteServiceRoster(rosterId);
      toast.success("Scheduled volunteer removed");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to remove volunteer");
    }
  };

  // Dispatch Reminder via Channel (WhatsApp / Email / SMS / All)
  const handleDispatchReminder = async (roster: ServiceRoster, channel: "whatsapp" | "email" | "sms" | "all") => {
    if (!selectedPlan) return;

    const matchedWorker = workers.find((w) => String(w.id) === String(roster.worker_id) || w.name === roster.worker_name);
    const targetPhone = matchedWorker?.phone || roster.worker_phone || "+2348000000000";
    const targetEmail = matchedWorker?.email || roster.worker_email || "volunteer@churchhr.org";
    const cleanPhone = targetPhone.replace(/\D/g, "");

    const messageText = `Hello ${roster.worker_name}, this is a reminder from Church Management. You are scheduled for:
Role: ${roster.role_title} (${roster.department})
Service: ${selectedPlan.title} (${selectedPlan.service_type})
Date: ${selectedPlan.date}
Please confirm your attendance. God bless you!`;

    if (channel === "whatsapp") {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, "_blank");
      toast.success(`WhatsApp reminder opened for ${roster.worker_name}`);
    } else if (channel === "email") {
      const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(`Service Schedule Reminder: ${selectedPlan.title}`)}&body=${encodeURIComponent(messageText)}`;
      window.open(mailtoUrl, "_blank");
      toast.success(`Email reminder client opened for ${roster.worker_name}`);
    } else if (channel === "sms") {
      const smsUrl = `sms:${targetPhone}?body=${encodeURIComponent(messageText)}`;
      window.open(smsUrl, "_blank");
      toast.success(`SMS reminder composer opened for ${roster.worker_name}`);
    } else {
      await sendRosterReminder(roster, "all", selectedPlan.title, selectedPlan.date);
      toast.success(`Multi-channel reminders (Email, SMS & WhatsApp) dispatched to ${roster.worker_name}!`);
    }

    setIsReminderOpen(false);
  };

  // Bulk Remind All Volunteers for Selected Plan
  const handleRemindAllVolunteers = async () => {
    if (!selectedPlan || serviceRoster.length === 0) {
      toast.error("No volunteers scheduled to send reminders to.");
      return;
    }

    let count = 0;
    for (const r of serviceRoster) {
      await sendRosterReminder(r, "all", selectedPlan.title, selectedPlan.date);
      count++;
    }
    toast.success(`Sent automated service reminders via Email, SMS & WhatsApp to all ${count} scheduled volunteers!`);
  };

  const totalDuration = serviceItems.reduce((sum, item) => sum + item.duration_minutes, 0);

  // Generate Text Bulletin for Sharing
  const generateTextBulletin = () => {
    if (!selectedPlan) return "";
    let text = `📜 *CHURCH WORSHIP SERVICE PROGRAM BULLETIN*\n`;
    text += `*${selectedPlan.title}*\n`;
    text += `📅 Date: ${selectedPlan.date} | Service Type: ${selectedPlan.service_type}\n`;
    text += `⏱️ Total Duration: ${totalDuration} Minutes\n\n`;

    text += `🎵 *ORDER OF SERVICE:*\n`;
    if (serviceItems.length === 0) {
      text += `No activities added.\n`;
    } else {
      serviceItems.forEach((item, idx) => {
        text += `${idx + 1}. *${item.title}* (${item.duration_minutes} Mins)`;
        if (item.leader_name) text += ` - Lead: ${item.leader_name}`;
        if (item.notes) text += `\n   _${item.notes}_`;
        text += `\n`;
      });
    }

    if (serviceRoster.length > 0) {
      text += `\n👥 *SCHEDULED VOLUNTEER ROSTER:*\n`;
      serviceRoster.forEach((r) => {
        text += `• ${r.worker_name} (${r.department}): ${r.role_title}\n`;
      });
    }

    text += `\n✨ _We look forward to a glorious worship experience together!_`;
    return text;
  };

  // Print Service Event Program Bulletin
  const handlePrintProgram = () => {
    if (!selectedPlan) return;

    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 720px; margin: 0 auto; border: 2px solid #e2e8f0; padding: 36px; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 3px double #4f46e5; padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; letter-spacing: 1px;">CHURCH WORSHIP SERVICE PROGRAM BULLETIN</h2>
          <h3 style="margin: 8px 0 0 0; color: #0f172a; font-size: 20px; font-weight: 700;">${selectedPlan.title}</h3>
          <p style="margin: 6px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">
            Date: <strong>${selectedPlan.date}</strong> &nbsp;|&nbsp; Type: <strong>${selectedPlan.service_type}</strong> &nbsp;|&nbsp; Est. Duration: <strong>${totalDuration} Minutes</strong>
          </p>
        </div>

        <h3 style="color: #1e1b4b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 16px; margin-bottom: 14px;">ORDER OF SERVICE TIMELINE</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px; text-align: center; width: 40px;">#</th>
              <th style="padding: 10px;">Activity / Service Item</th>
              <th style="padding: 10px;">Minister / Leader</th>
              <th style="padding: 10px; text-align: right;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${
              serviceItems.length === 0
                ? `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No items in order of service</td></tr>`
                : serviceItems
                    .map(
                      (item, i) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #4f46e5;">${i + 1}</td>
                <td style="padding: 10px;">
                  <strong style="color: #0f172a; font-size: 14px;">${item.title}</strong>
                  ${item.notes ? `<br/><span style="color: #64748b; font-size: 12px; font-style: italic;">${item.notes}</span>` : ''}
                </td>
                <td style="padding: 10px; color: #334155; font-weight: 500;">${item.leader_name || '-'}</td>
                <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${item.duration_minutes} Mins</td>
              </tr>
            `
                    )
                    .join('')
            }
          </tbody>
        </table>

        <h3 style="color: #1e1b4b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 16px; margin-bottom: 14px;">SCHEDULED VOLUNTEER & MINISTER ROSTER</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px;">Department</th>
              <th style="padding: 10px;">Assigned Person</th>
              <th style="padding: 10px;">Role / Duty Title</th>
              <th style="padding: 10px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              serviceRoster.length === 0
                ? `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No volunteers scheduled yet</td></tr>`
                : serviceRoster
                    .map(
                      (r) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #475569;">${r.department}</td>
                <td style="padding: 10px; font-weight: bold; color: #0f172a;">${r.worker_name}</td>
                <td style="padding: 10px; color: #334155;">${r.role_title}</td>
                <td style="padding: 10px; text-align: right; color: #166534; font-weight: bold;">Confirmed</td>
              </tr>
            `
                    )
                    .join('')
            }
          </tbody>
        </table>

        <div style="margin-top: 32px; padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center; font-size: 12px; color: #64748b; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: 700; color: #4f46e5; font-size: 14px;">Welcome to Worship!</p>
          <p style="margin: 4px 0 0 0;">God bless you as we celebrate His presence together.</p>
        </div>
      </div>
    `;
    printReport(`Service_Program_Bulletin_${selectedPlan.date}`, htmlContent);
  };

  const handleShareWhatsApp = () => {
    const text = generateTextBulletin();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    toast.success("WhatsApp bulletin share link generated!");
  };

  const handleCopyBulletin = () => {
    const text = generateTextBulletin();
    void navigator.clipboard.writeText(text);
    toast.success("Service program bulletin copied to clipboard!");
  };

  const handleNativeShare = async () => {
    const text = generateTextBulletin();
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedPlan?.title || "Service Program Bulletin",
          text,
        });
        toast.success("Service program bulletin shared successfully!");
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyBulletin();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Worship Service Order & Rostering</h1>
          <p className="text-slate-500 text-sm">
            Plan order of service timelines, allotted minutes, sermon outlines, and generate shareable & printable event bulletins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">

          {selectedPlan && serviceRoster.length > 0 && (
            <Button onClick={handleRemindAllVolunteers} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold gap-2">
              <Bell className="w-4 h-4 text-indigo-600" /> Remind Volunteers
            </Button>
          )}
          <Button onClick={handleOpenCreatePlan} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold">
            <Plus className="w-4 h-4" /> Create Service Plan
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Service Plans List */}
        <Card className="border-slate-200 shadow-sm bg-white lg:col-span-1">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Service Plans</span>
              <Badge variant="outline" className="text-xs bg-slate-50">{plans.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-400 p-4 text-center">Loading plans...</p>
            ) : plans.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No service plans created yet.</p>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow"
                        : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`text-[10px] uppercase font-bold ${
                          isSelected ? "bg-white/20 text-white border-transparent" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {plan.service_type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-mono ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {plan.date}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEditPlan(plan, e)}
                          className={`h-6 w-6 p-0 hover:bg-white/20 ${isSelected ? "text-slate-300 hover:text-white" : "text-slate-400 hover:text-indigo-600"}`}
                          title="Edit Service Plan"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeletePlan(e, plan.id)}
                          className={`h-6 w-6 p-0 hover:bg-rose-500/20 ${isSelected ? "text-slate-300 hover:text-white" : "text-slate-400 hover:text-rose-600"}`}
                          title="Delete Service Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mt-2 line-clamp-1">{plan.title}</h4>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Order of Service & Roster Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPlan ? (
            <>
              {/* Active Plan Overview Header */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {selectedPlan.service_type} • {selectedPlan.date}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditPlan(selectedPlan)}
                        className="h-6 text-[10px] px-2 border-slate-200 text-slate-600 hover:bg-slate-50 gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit Plan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsProgramModalOpen(true)}
                        className="h-6 text-[10px] px-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 font-semibold"
                      >
                        <FileText className="w-3 h-3" /> Program Bulletin
                      </Button>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">{selectedPlan.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Est. Duration</p>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-1 justify-end">
                      <Clock className="w-4 h-4 text-slate-400" /> {totalDuration} Mins
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-6">
                  {/* Order of Service Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-indigo-600" /> Service Order Breakdown ({serviceItems.length} Items)
                      </h3>
                      <Button size="sm" onClick={handleOpenCreateItem} variant="outline" className="text-xs h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Service Item
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {serviceItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                          No service items added yet. Click "Add Service Item" to build the order of service.
                        </p>
                      ) : (
                        serviceItems.map((item, idx) => (
                          <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                {item.leader_name ? (
                                  <p className="text-slate-600 font-medium">Minister/Lead: {item.leader_name}</p>
                                ) : null}
                                {item.notes ? <p className="text-slate-400 italic mt-0.5">{item.notes}</p> : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-white text-slate-700 font-mono text-xs">
                                {item.duration_minutes} Mins
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditItem(item)}
                                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60"
                                title="Edit Service Item"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Service Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Scheduled Department Rosters */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" /> Scheduled Volunteer Roster ({serviceRoster.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => setIsRosterOpen(true)} variant="outline" className="text-xs h-8">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Volunteer
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {serviceRoster.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-4 col-span-2 text-center bg-slate-50 rounded-xl border border-slate-200">
                          No volunteers scheduled for this service date yet.
                        </p>
                      ) : (
                        serviceRoster.map((r) => (
                          <div key={r.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm hover:border-slate-300 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] uppercase bg-slate-50">
                                  {r.department}
                                </Badge>
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] capitalize">
                                  {r.status}
                                </Badge>
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{r.worker_name}</p>
                              <p className="text-slate-500 font-medium">{r.role_title}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              {/* Reminder Dispatch Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReminderRoster(r);
                                  setIsReminderOpen(true);
                                }}
                                className="h-7 text-[11px] px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold gap-1"
                              >
                                <Bell className="w-3 h-3" /> Remind
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRoster(r.id)}
                                className="h-6 text-[10px] px-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
              Select or create a service plan to begin worship planning.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Service Plan */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Service Plan" : "Create New Service Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Plan Title *</label>
              <Input placeholder="e.g. Sunday Glorious Service" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Service Date</label>
                <DatePicker value={planDate} onChange={setPlanDate} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="Sunday Glorious">Sunday Glorious Service</option>
                  <option value="Midweek Exposition">Thursday Midweek Service</option>
                  <option value="Youth Impact">Youth Impact Convention</option>
                  <option value="Special Service">Special Thanksgiving</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPlanOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white font-bold">
                {editingPlan ? "Save Changes" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create / Edit Service Item */}
      <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service Order Item" : "Add Service Order Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Item Title / Activity *</label>
              <Input placeholder="e.g. Praise & Worship Session" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Allotted Minutes *</label>
                <Input type="number" placeholder="15" value={itemDuration} onChange={(e) => setItemDuration(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Leader / Minister Name</label>
                <Input placeholder="e.g. Pastor Mark" value={itemLeader} onChange={(e) => setItemLeader(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Notes / Scripture Texts / Songs</label>
              <textarea
                placeholder="e.g. Hymns 104 & 202, text: Psalm 23..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white font-bold">
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Schedule Volunteer */}
      <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Volunteer Roster</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRoster} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Department</label>
              <select
                value={rosterDept}
                onChange={(e) => setRosterDept(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="Ushering">Ushering Department</option>
                <option value="Choir">Choir & Music Team</option>
                <option value="Media & Tech">Media & Technical</option>
                <option value="Security">Security & Logistics</option>
                <option value="Children Ministry">Children Ministry</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Worker *</label>
              <SearchableWorkerSelect
                workers={workers}
                value={rosterWorkerId}
                onChange={(val) => setRosterWorkerId(val)}
                placeholder="Search & select volunteer..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Duty / Role Title</label>
              <Input placeholder="e.g. Head Usher / Sound Operator" value={rosterRole} onChange={(e) => setRosterRole(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRosterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white font-bold">Schedule Volunteer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Multi-Channel Reminder Dispatcher */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-slate-900">
              <Bell className="w-5 h-5 text-indigo-600" /> Send Service Schedule Reminder
            </DialogTitle>
          </DialogHeader>

          {reminderRoster && selectedPlan ? (
            <div className="space-y-4 py-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 text-slate-700">
                <p><span className="font-bold text-slate-900">Assigned Person:</span> {reminderRoster.worker_name}</p>
                <p><span className="font-bold text-slate-900">Duty Role:</span> {reminderRoster.role_title} ({reminderRoster.department})</p>
                <p><span className="font-bold text-slate-900">Service Plan:</span> {selectedPlan.title} ({selectedPlan.date})</p>
              </div>

              <p className="text-xs font-semibold text-slate-600">Select notification channel to send reminder:</p>

              <div className="grid grid-cols-1 gap-2.5">
                <Button
                  onClick={() => handleDispatchReminder(reminderRoster, "whatsapp")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 h-11 text-xs"
                >
                  <MessageSquare className="w-4 h-4" /> Send via WhatsApp
                </Button>

                <Button
                  onClick={() => handleDispatchReminder(reminderRoster, "email")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 h-11 text-xs"
                >
                  <Mail className="w-4 h-4" /> Send via Email
                </Button>

                <Button
                  onClick={() => handleDispatchReminder(reminderRoster, "sms")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 h-11 text-xs"
                >
                  <Phone className="w-4 h-4" /> Send via SMS
                </Button>

                <Button
                  onClick={() => handleDispatchReminder(reminderRoster, "all")}
                  variant="outline"
                  className="border-slate-800 text-slate-900 font-extrabold flex items-center justify-center gap-2 h-11 text-xs hover:bg-slate-100"
                >
                  <Send className="w-4 h-4 text-slate-800" /> Dispatch All Channels (Automated)
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsReminderOpen(false)} variant="ghost" className="text-xs text-slate-500">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Service Event Program Bulletin (Printable & Shareable) */}
      <Dialog open={isProgramModalOpen} onOpenChange={setIsProgramModalOpen}>
        <DialogContent className="sm:max-w-2xl text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
              <FileText className="w-5 h-5 text-indigo-600" /> Worship Service Program Bulletin
            </DialogTitle>
          </DialogHeader>

          {selectedPlan ? (
            <div className="space-y-6 py-3">
              {/* Program Preview Card */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="text-center border-b border-slate-800 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xs uppercase font-extrabold text-indigo-400 tracking-widest">
                    Church Worship Service Program Bulletin
                  </h2>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedPlan.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Date: <span className="text-white font-mono">{selectedPlan.date}</span> &nbsp;|&nbsp; Type:{" "}
                    <span className="text-white">{selectedPlan.service_type}</span> &nbsp;|&nbsp; Est. Duration:{" "}
                    <span className="text-indigo-300 font-bold">{totalDuration} Mins</span>
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-indigo-400" /> Order of Service Timeline
                  </h4>
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80 max-h-[220px] overflow-y-auto">
                    {serviceItems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 text-center">No items added to service order.</p>
                    ) : (
                      serviceItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-white">{item.title}</p>
                              {item.leader_name ? <p className="text-[11px] text-slate-400">Lead: {item.leader_name}</p> : null}
                              {item.notes ? <p className="text-[10px] text-slate-500 italic">{item.notes}</p> : null}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-slate-950 border-slate-700 text-indigo-300 font-mono text-[10px]">
                            {item.duration_minutes} Mins
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Scheduled Roster */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" /> Scheduled Ministers & Volunteers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    {serviceRoster.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 col-span-2 text-center">No volunteers scheduled yet.</p>
                    ) : (
                      serviceRoster.map((r) => (
                        <div key={r.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/50 text-xs">
                          <p className="font-bold text-white">{r.worker_name}</p>
                          <p className="text-[10px] text-indigo-300 font-medium">{r.role_title} ({r.department})</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Share & Print Action Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sharing & Export Actions:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button onClick={handlePrintProgram} className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 h-11 text-xs">
                    <Printer className="w-4 h-4" /> Print Program Bulletin
                  </Button>

                  <Button onClick={handleShareWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 h-11 text-xs">
                    <MessageSquare className="w-4 h-4" /> Share to WhatsApp
                  </Button>

                  <Button onClick={handleCopyBulletin} variant="outline" className="border-slate-300 text-slate-800 font-semibold gap-2 h-11 text-xs hover:bg-slate-100">
                    <Copy className="w-4 h-4 text-slate-600" /> Copy Text Bulletin
                  </Button>

                  <Button onClick={handleNativeShare} variant="outline" className="border-indigo-200 text-indigo-700 font-semibold gap-2 h-11 text-xs hover:bg-indigo-50">
                    <Share2 className="w-4 h-4 text-indigo-600" /> Native Share / Export
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button onClick={() => setIsProgramModalOpen(false)} variant="outline" className="w-full sm:w-auto text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
