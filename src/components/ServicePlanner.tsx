import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Music, Printer, Calendar } from "lucide-react";
import { Worker } from "../types/models";
import { useServicePlan } from "../hooks/useServicePlan";
import { ServicePlanSidebar } from "./service-planner/ServicePlanSidebar";
import { ServiceOrderList } from "./service-planner/ServiceOrderList";
import { ServiceRosterList } from "./service-planner/ServiceRosterList";
import { PlanDialogs } from "./service-planner/PlanDialogs";
import { printReport } from "../utils/exportUtils";

interface ServicePlannerProps {
  workers: Worker[];
}

export function ServicePlanner({ workers }: ServicePlannerProps) {
  const p = useServicePlan();

  const handlePrintProgram = () => {
    if (!p.activePlan) return;
    const html = `
      <div style="font-family: sans-serif; padding: 24px;">
        <h1 style="margin: 0; color: #4f46e5;">${p.activePlan.title}</h1>
        <p style="color: #6b7280;">Date: ${p.activePlan.date} • Type: ${p.activePlan.serviceType}</p>
        <hr style="margin: 16px 0;" />
        <h2>Order of Service Flow</h2>
        <ol>
          ${p.serviceItems.map((item) => `<li><strong>${item.title}</strong> (${item.durationMinutes ?? item.duration_minutes ?? 0} mins) - Leader: ${item.leaderName || item.leader_name || "N/A"}</li>`).join("")}
        </ol>
        <h2>Scheduled Volunteer Roster</h2>
        <ul>
          ${p.serviceRoster.map((r) => `<li><strong>${r.workerName}</strong> - ${r.department} (${r.roleTitle})</li>`).join("")}
        </ul>
      </div>
    `;
    printReport(`ServiceProgram-${p.activePlan.title}`, html);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planning Center Services</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
              Service Planner
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Orchestrate Sunday liturgy flow, schedule department volunteers, and dispatch reminders.
          </p>
        </div>

        {p.activePlan && (
          <Button
            onClick={handlePrintProgram}
            variant="outline"
            size="sm"
            className="self-start md:self-auto rounded-xl text-xs font-semibold gap-2 border-slate-200 text-slate-700"
          >
            <Printer className="w-4 h-4" /> Print Service Bulletin
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Plan Navigator */}
        <ServicePlanSidebar
          plans={p.plans}
          activePlanId={p.activePlanId}
          onSelectPlan={p.setSelectedPlanId}
          onOpenNewPlan={p.handleOpenNewPlan}
          onOpenEditPlan={p.handleOpenEditPlan}
          onDeletePlan={p.handleDeletePlan}
        />

        {/* Right Main Content: Active Plan Details */}
        <div className="flex-1 space-y-6">
          {p.activePlan ? (
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <ServiceOrderList
                  items={p.serviceItems}
                  loading={p.loadingItems}
                  onOpenAddItem={() => { p.setEditingItem(null); p.setItemTitle(""); p.setItemDuration("10"); p.setItemLeader(""); p.setItemNotes(""); p.setIsItemOpen(true); }}
                  onOpenEditItem={(item) => { p.setEditingItem(item); p.setItemTitle(item.title); p.setItemDuration(String(item.durationMinutes)); p.setItemLeader(item.leaderName || ""); p.setItemNotes(item.notes || ""); p.setIsItemOpen(true); }}
                  onDeleteItem={p.handleDeleteItem}
                />

                <ServiceRosterList
                  roster={p.serviceRoster}
                  loading={p.loadingRoster}
                  onOpenAddRoster={() => p.setIsRosterOpen(true)}
                  onDeleteRoster={p.handleDeleteRoster}
                  onOpenReminder={(roster) => { p.setReminderRoster(roster); p.setIsReminderOpen(true); }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-sm">
              Select or create a service plan to begin organizing order of service and volunteer rosters.
            </div>
          )}
        </div>
      </div>

      <PlanDialogs
        workers={workers}
        isPlanOpen={p.isPlanOpen} setIsPlanOpen={p.setIsPlanOpen}
        editingPlan={p.editingPlan}
        planTitle={p.planTitle} setPlanTitle={p.setPlanTitle}
        planDate={p.planDate} setPlanDate={p.setPlanDate}
        serviceType={p.serviceType} setServiceType={p.setServiceType}
        onSavePlan={p.handleSavePlan}
        isItemOpen={p.isItemOpen} setIsItemOpen={p.setIsItemOpen}
        editingItem={p.editingItem}
        itemTitle={p.itemTitle} setItemTitle={p.setItemTitle}
        itemDuration={p.itemDuration} setItemDuration={p.setItemDuration}
        itemLeader={p.itemLeader} setItemLeader={p.setItemLeader}
        itemNotes={p.itemNotes} setItemNotes={p.setItemNotes}
        onSaveItem={p.handleSaveItem}
        isRosterOpen={p.isRosterOpen} setIsRosterOpen={p.setIsRosterOpen}
        rosterDept={p.rosterDept} setRosterDept={p.setRosterDept}
        rosterWorkerId={p.rosterWorkerId} setRosterWorkerId={p.setRosterWorkerId}
        rosterRole={p.rosterRole} setRosterRole={p.setRosterRole}
        onSaveRoster={p.handleSaveRoster}
        isReminderOpen={p.isReminderOpen} setIsReminderOpen={p.setIsReminderOpen}
        reminderRoster={p.reminderRoster}
      />
    </div>
  );
}
