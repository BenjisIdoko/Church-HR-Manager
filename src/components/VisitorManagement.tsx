import { useEffect, useState } from "react";
import { UserCheck, PhoneCall, UserPlus, Search, Filter, MessageSquare, Plus, Trash2, Calendar, User as UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Visitor, VisitorFollowup, Worker } from "../types/models";
import { addVisitorFollowup, createVisitor, deleteVisitor, fetchVisitorFollowups, fetchVisitors, updateVisitor } from "../utils/api";
import { toast } from "sonner";
import { SearchableWorkerSelect } from "./SearchableWorkerSelect";
import { DatePicker } from "./ui/date-picker";

interface VisitorManagementProps {
  workers: Worker[];
}

const STATUS_COLUMNS: Array<{ id: Visitor["status"]; title: string; color: string }> = [
  { id: "new", title: "New First-Timers", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "contacted", title: "Contacted / Called", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  { id: "visited", title: "Pastoral Visit", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  { id: "integrated", title: "Integrated / Joined", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  { id: "dropped", title: "Inactive / Dropped", color: "bg-slate-500/10 text-slate-700 border-slate-200" },
];

export function VisitorManagement({ workers }: VisitorManagementProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [followups, setFollowups] = useState<VisitorFollowup[]>([]);
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newAssigned, setNewAssigned] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Followup form state
  const [followupCaller, setFollowupCaller] = useState("");
  const [followupMedium, setFollowupMedium] = useState<"call" | "sms" | "whatsapp" | "in-person">("call");
  const [followupFeedback, setFollowupFeedback] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchVisitors();
      setVisitors(data);
    } catch {
      toast.error("Failed to load visitors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      toast.error("Name and Phone are required");
      return;
    }

    const assignedWorker = workers.find((w) => w.id === newAssigned);

    try {
      await createVisitor({
        name: newName,
        email: newEmail,
        phone: newPhone,
        first_visit_date: newDate,
        assigned_to: newAssigned || undefined,
        assigned_worker_name: assignedWorker ? assignedWorker.name : undefined,
        notes: newNotes,
        status: "new",
      });
      toast.success("First-timer registered successfully!");
      setIsAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewNotes("");
      setNewAssigned("");
      void loadData();
    } catch {
      toast.error("Failed to register visitor");
    }
  };

  const handleStatusChange = async (visitorId: number, newStatus: Visitor["status"]) => {
    try {
      await updateVisitor(visitorId, { status: newStatus });
      toast.success("Visitor status updated");
      setVisitors((prev) =>
        prev.map((v) => (v.id === visitorId ? { ...v, status: newStatus } : v))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this visitor record?")) return;
    try {
      await deleteVisitor(id);
      toast.success("Visitor record deleted");
      void loadData();
    } catch {
      toast.error("Failed to delete visitor");
    }
  };

  const handleOpenFollowups = async (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsFollowupOpen(true);
    try {
      const logs = await fetchVisitorFollowups(visitor.id);
      setFollowups(logs);
    } catch {
      toast.error("Failed to load followup logs");
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor || !followupFeedback) {
      toast.error("Feedback notes are required");
      return;
    }

    const callerObj = workers.find((w) => w.id === followupCaller);

    try {
      await addVisitorFollowup(selectedVisitor.id, {
        caller_id: followupCaller || undefined,
        caller_name: callerObj ? callerObj.name : undefined,
        medium: followupMedium,
        feedback: followupFeedback,
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Follow-up call logged");
      setFollowupFeedback("");
      const updatedLogs = await fetchVisitorFollowups(selectedVisitor.id);
      setFollowups(updatedLogs);
    } catch {
      toast.error("Failed to log follow-up");
    }
  };

  const filteredVisitors = visitors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone.includes(searchQuery) ||
    (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">First-Timers & Visitor Follow-Up</h1>
          <p className="text-slate-500 text-sm">
            Track new church visitors, assign pastoral follow-up care, and monitor integration into ministries.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Register First-Timer
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Total First-Timers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{visitors.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Pending Contact</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {visitors.filter((v) => v.status === "new").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Pastoral Visits</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {visitors.filter((v) => v.status === "visited").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Successfully Joined</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {visitors.filter((v) => v.status === "integrated").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <Input
          placeholder="Search by visitor name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none text-sm"
        />
      </div>

      {/* Kanban Pipeline Columns */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading visitor records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colVisitors = filteredVisitors.filter((v) => v.status === col.id);
            return (
              <div key={col.id} className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between px-2 py-1 mb-3">
                  <span className="font-semibold text-xs text-slate-700">{col.title}</span>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700 rounded-full px-2 py-0 text-xs">
                    {colVisitors.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colVisitors.map((visitor) => (
                    <Card key={visitor.id} className="border-slate-200 shadow-sm hover:shadow transition-shadow bg-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{visitor.name}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> {visitor.first_visit_date}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(visitor.id)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Delete Visitor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <p>📱 {visitor.phone}</p>
                          {visitor.email ? <p>✉️ {visitor.email}</p> : null}
                          {visitor.assigned_worker_name ? (
                            <p className="text-slate-500 font-medium">👤 Assigned: {visitor.assigned_worker_name}</p>
                          ) : null}
                        </div>

                        {visitor.notes ? (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                            "{visitor.notes}"
                          </p>
                        ) : null}

                        {/* Status Select */}
                        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                          <select
                            value={visitor.status}
                            onChange={(e) => handleStatusChange(visitor.id, e.target.value as Visitor["status"])}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none w-full"
                          >
                            <option value="new">Mark New</option>
                            <option value="contacted">Mark Contacted</option>
                            <option value="visited">Mark Visited</option>
                            <option value="integrated">Mark Integrated</option>
                            <option value="dropped">Mark Dropped</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFollowups(visitor)}
                            className="h-7 text-xs px-2"
                            title="Followup Logs"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register First-Timer */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New First-Timer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVisitor} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name *</label>
              <Input placeholder="e.g. John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                <Input placeholder="08012345678" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <Input placeholder="john@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">First Visit Date</label>
                <DatePicker value={newDate} onChange={setNewDate} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Assign Follow-Up Worker</label>
                <SearchableWorkerSelect
                  workers={workers}
                  value={newAssigned}
                  onChange={(val) => setNewAssigned(val)}
                  placeholder="Search & select follow-up worker..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Initial Comments / Prayer Request</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Invited by Sister Mary, seeking prayer for family..."
                className="w-full border border-slate-300 rounded-md p-2 text-xs min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">Save Visitor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Followup Logs */}
      <Dialog open={isFollowupOpen} onOpenChange={setIsFollowupOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Follow-Up Activity: {selectedVisitor?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Form to add followup log */}
            <form onSubmit={handleAddFollowup} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-800">Log New Contact Activity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={followupMedium}
                  onChange={(e) => setFollowupMedium(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded p-1.5"
                >
                  <option value="call">Phone Call</option>
                  <option value="sms">SMS Message</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="in-person">In-Person Visit</option>
                </select>
                <SearchableWorkerSelect
                  workers={workers}
                  value={followupCaller}
                  onChange={(val) => setFollowupCaller(val)}
                  placeholder="Search caller/worker..."
                />
              </div>
              <textarea
                placeholder="Write call feedback or response..."
                value={followupFeedback}
                onChange={(e) => setFollowupFeedback(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 min-h-[60px]"
                required
              />
              <Button type="submit" size="sm" className="w-full bg-slate-900 text-white text-xs">
                Log Follow-Up Activity
              </Button>
            </form>

            {/* Logs List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-700">Previous Logged Contacts ({followups.length})</p>
              {followups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No contact logs recorded yet.</p>
              ) : (
                followups.map((f) => (
                  <div key={f.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>{f.medium.toUpperCase()} • {f.date}</span>
                      <span>By: {f.caller_name || "Staff"}</span>
                    </div>
                    <p className="text-slate-800">{f.feedback}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
