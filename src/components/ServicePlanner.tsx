import { useEffect, useState } from "react";
import { Music, Clock, Users, Plus, Calendar, CheckCircle2, UserCheck, Play, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ServiceItem, ServicePlan, ServiceRoster, Worker } from "../types/models";
import { addServiceItem, addServiceRoster, createServicePlan, fetchServiceItems, fetchServicePlans, fetchServiceRoster } from "../utils/api";
import { toast } from "sonner";

interface ServicePlannerProps {
  workers: Worker[];
}

export function ServicePlanner({ workers }: ServicePlannerProps) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceRoster, setServiceRoster] = useState<ServiceRoster[]>([]);
  const [loading, setLoading] = useState(true);

  // New Plan Modal
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceType, setServiceType] = useState("Sunday Glorious");

  // New Item Modal
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDuration, setItemDuration] = useState("10");
  const [itemLeader, setItemLeader] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // New Roster Modal
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [rosterDept, setRosterDept] = useState("Ushering");
  const [rosterWorkerId, setRosterWorkerId] = useState("");
  const [rosterRole, setRosterRole] = useState("Lead Volunteer");

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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle) {
      toast.error("Plan title is required");
      return;
    }
    try {
      const res = await createServicePlan({
        title: planTitle,
        date: planDate,
        service_type: serviceType,
      });
      toast.success("Service plan created!");
      setIsPlanOpen(false);
      setPlanTitle("");
      const updatedPlans = await fetchServicePlans();
      setPlans(updatedPlans);
      const created = updatedPlans.find((p) => p.id === res.id) || { id: res.id, title: planTitle, date: planDate, service_type: serviceType };
      setSelectedPlan(created as any);
    } catch {
      toast.error("Failed to create plan");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !itemTitle) return;

    try {
      await addServiceItem(selectedPlan.id, {
        sequence: serviceItems.length + 1,
        title: itemTitle,
        duration_minutes: Number(itemDuration),
        leader_name: itemLeader,
        notes: itemNotes,
      });
      toast.success("Service item added");
      setIsItemOpen(false);
      setItemTitle("");
      setItemNotes("");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to add service item");
    }
  };

  const handleAddRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !rosterWorkerId) return;

    try {
      await addServiceRoster(selectedPlan.id, {
        department: rosterDept,
        worker_id: Number(rosterWorkerId),
        role_title: rosterRole,
        status: "confirmed",
      });
      toast.success("Volunteer scheduled for service");
      setIsRosterOpen(false);
      setRosterWorkerId("");
      void loadPlanDetails(selectedPlan.id);
    } catch {
      toast.error("Failed to schedule volunteer");
    }
  };

  const totalDuration = serviceItems.reduce((sum, item) => sum + item.duration_minutes, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Worship Service Order & Rostering</h1>
          <p className="text-slate-500 text-sm">
            Plan order of service timelines, allotted minutes, sermon outlines, and schedule volunteer rosters.
          </p>
        </div>
        <Button onClick={() => setIsPlanOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Create Service Plan
        </Button>
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
                      <span className={`text-xs font-mono ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {plan.date}
                      </span>
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
              {/* Active Plan Overview */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 mb-1">
                      {selectedPlan.service_type} • {selectedPlan.date}
                    </Badge>
                    <CardTitle className="text-xl font-bold text-slate-900">{selectedPlan.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Est. Duration</p>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
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
                      <Button size="sm" onClick={() => setIsItemOpen(true)} variant="outline" className="text-xs h-8">
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
                          <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                {item.leader_name ? (
                                  <p className="text-slate-500">Lead: {item.leader_name}</p>
                                ) : null}
                                {item.notes ? <p className="text-slate-400 italic mt-0.5">{item.notes}</p> : null}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-white text-slate-700 font-mono text-xs">
                              {item.duration_minutes} Mins
                            </Badge>
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
                      <Button size="sm" onClick={() => setIsRosterOpen(true)} variant="outline" className="text-xs h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Volunteer
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {serviceRoster.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-4 col-span-2 text-center bg-slate-50 rounded-xl border border-slate-200">
                          No volunteers scheduled for this service date yet.
                        </p>
                      ) : (
                        serviceRoster.map((r) => (
                          <div key={r.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <Badge variant="outline" className="text-[10px] uppercase bg-slate-50 mb-1">
                                {r.department}
                              </Badge>
                              <p className="font-semibold text-slate-900">{r.worker_name}</p>
                              <p className="text-slate-500">{r.role_title}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] capitalize">
                              {r.status}
                            </Badge>
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

      {/* Modal: Create Service Plan */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Service Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Plan Title *</label>
              <Input placeholder="e.g. Sunday Glorious Service" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Service Date</label>
                <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} required />
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
              <Button type="submit" className="bg-slate-900 text-white">Create Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Service Item */}
      <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service Order Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Item Title / Activity *</label>
              <Input placeholder="e.g. Praise & Worship Session" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Allotted Minutes</label>
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
              <Button type="submit" className="bg-slate-900 text-white">Add Item</Button>
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
              <select
                value={rosterWorkerId}
                onChange={(e) => setRosterWorkerId(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                required
              >
                <option value="">Select Worker...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Duty / Role Title</label>
              <Input placeholder="e.g. Head Usher / Sound Operator" value={rosterRole} onChange={(e) => setRosterRole(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRosterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">Schedule Volunteer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
