import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ServiceItem, ServicePlan, ServiceRoster, Worker } from "../../types/models";
import { SearchableWorkerSelect } from "../SearchableWorkerSelect";
import { toast } from "sonner";
import { sendRosterReminder } from "../../utils/api";

interface PlanDialogsProps {
  workers: Worker[];
  // Plan Modal
  isPlanOpen: boolean; setIsPlanOpen: (open: boolean) => void;
  editingPlan: ServicePlan | null;
  planTitle: string; setPlanTitle: (val: string) => void;
  planDate: string; setPlanDate: (val: string) => void;
  serviceType: string; setServiceType: (val: string) => void;
  onSavePlan: (e: React.FormEvent) => void;
  // Item Modal
  isItemOpen: boolean; setIsItemOpen: (open: boolean) => void;
  editingItem: ServiceItem | null;
  itemTitle: string; setItemTitle: (val: string) => void;
  itemDuration: string; setItemDuration: (val: string) => void;
  itemLeader: string; setItemLeader: (val: string) => void;
  itemNotes: string; setItemNotes: (val: string) => void;
  onSaveItem: (e: React.FormEvent) => void;
  // Roster Modal
  isRosterOpen: boolean; setIsRosterOpen: (open: boolean) => void;
  rosterDept: string; setRosterDept: (val: string) => void;
  rosterWorkerId: string; setRosterWorkerId: (val: string) => void;
  rosterRole: string; setRosterRole: (val: string) => void;
  onSaveRoster: (e: React.FormEvent) => void;
  // Reminder Modal
  isReminderOpen: boolean; setIsReminderOpen: (open: boolean) => void;
  reminderRoster: ServiceRoster | null;
}

export function PlanDialogs({
  workers,
  isPlanOpen, setIsPlanOpen,
  editingPlan,
  planTitle, setPlanTitle,
  planDate, setPlanDate,
  serviceType, setServiceType,
  onSavePlan,
  isItemOpen, setIsItemOpen,
  editingItem,
  itemTitle, setItemTitle,
  itemDuration, setItemDuration,
  itemLeader, setItemLeader,
  itemNotes, setItemNotes,
  onSaveItem,
  isRosterOpen, setIsRosterOpen,
  rosterDept, setRosterDept,
  rosterWorkerId, setRosterWorkerId,
  rosterRole, setRosterRole,
  onSaveRoster,
  isReminderOpen, setIsReminderOpen,
  reminderRoster,
}: PlanDialogsProps) {
  const handleSendReminder = async (channel: "whatsapp" | "email" | "sms" | "all") => {
    if (!reminderRoster) return;
    try {
      await sendRosterReminder(reminderRoster, channel, planTitle || "Sunday Service", planDate || new Date().toISOString().split("T")[0]);
      toast.success(`Reminder sent via ${channel.toUpperCase()}!`);
      setIsReminderOpen(false);
    } catch {
      toast.error("Failed to send reminder.");
    }
  };

  return (
    <>
      {/* Plan Dialog */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Service Plan" : "Create New Service Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSavePlan} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Title</Label>
              <Input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder="e.g. Sunday Glorious Service" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold">
                  <option value="Sunday Glorious">Sunday Glorious</option>
                  <option value="Midweek Communion">Midweek Communion</option>
                  <option value="Night of Worship">Night of Worship</option>
                  <option value="Special Youth Summit">Special Youth Summit</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPlanOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Save Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service Segment" : "Add Service Segment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSaveItem} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Segment Title</Label>
              <Input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g. Praise & Worship" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input type="number" value={itemDuration} onChange={(e) => setItemDuration(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Segment Leader / Minister</Label>
                <Input value={itemLeader} onChange={(e) => setItemLeader(e.target.value)} placeholder="e.g. Pastor John" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes / Details</Label>
              <Textarea value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} rows={2} placeholder="Songs or instructions..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsItemOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Save Segment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Volunteer Worker</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSaveRoster} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Volunteer</Label>
              <SearchableWorkerSelect
                workers={workers}
                value={rosterWorkerId}
                onChange={(val) => setRosterWorkerId(val)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ministry Department</Label>
                <select value={rosterDept} onChange={(e) => setRosterDept(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold">
                  <option value="Ushering">Ushering</option>
                  <option value="Choir">Choir</option>
                  <option value="Technical">Technical</option>
                  <option value="Protocol">Protocol</option>
                  <option value="Intercessors">Intercessors</option>
                  <option value="Media">Media</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Roster Role</Label>
                <Input value={rosterRole} onChange={(e) => setRosterRole(e.target.value)} placeholder="e.g. Lead Usher" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRosterOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Schedule Worker</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Volunteer Shift Reminder</DialogTitle>
          </DialogHeader>
          {reminderRoster && (
            <div className="py-3 space-y-3 text-xs">
              <p>Send shift reminder to <strong>{reminderRoster.worker_name || reminderRoster.workerName}</strong> for <strong>{reminderRoster.department}</strong> roster ({reminderRoster.role_title || reminderRoster.roleTitle}).</p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button size="sm" onClick={() => handleSendReminder("email")} className="bg-indigo-600 hover:bg-indigo-700 text-white">Email</Button>
                <Button size="sm" onClick={() => handleSendReminder("sms")} className="bg-blue-600 hover:bg-blue-700 text-white">SMS</Button>
                <Button size="sm" onClick={() => handleSendReminder("whatsapp")} className="bg-emerald-600 hover:bg-emerald-700 text-white">WhatsApp</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
