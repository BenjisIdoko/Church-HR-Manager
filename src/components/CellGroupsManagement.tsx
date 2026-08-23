import { useEffect, useState } from "react";
import { Home, Users, Plus, Trash2, MapPin, Calendar, UserCheck, ShieldCheck, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { CellGroup, GroupMember, Worker } from "../types/models";
import { addGroupMember, createCellGroup, deleteCellGroup, fetchCellGroups, fetchGroupMembers, removeGroupMember, updateCellGroup } from "../utils/api";
import { toast } from "sonner";
import { SearchableWorkerSelect } from "./SearchableWorkerSelect";

interface CellGroupsManagementProps {
  workers: Worker[];
}

export function CellGroupsManagement({ workers }: CellGroupsManagementProps) {
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Create/Edit Group Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CellGroup | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CellGroup["type"]>("cell");
  const [leaderId, setLeaderId] = useState("");
  const [meetingDay, setMeetingDay] = useState("Wednesday");
  const [location, setLocation] = useState("");

  // Members Modal State
  const [selectedGroup, setSelectedGroup] = useState<CellGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [newMemberWorkerId, setNewMemberWorkerId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"leader" | "assistant" | "member">("member");

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchCellGroups();
      setGroups(data);
    } catch {
      toast.error("Failed to load cell groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName("");
    setType("cell");
    setLeaderId("");
    setMeetingDay("Wednesday");
    setLocation("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: CellGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setType(group.type);
    setLeaderId(group.leader_id ? String(group.leader_id) : "");
    setMeetingDay(group.meeting_day);
    setLocation(group.location);
    setIsModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      toast.error("Name and Location are required");
      return;
    }

    const selectedLeader = workers.find((w) => String(w.id) === String(leaderId));
    const leaderName = selectedLeader?.name;
    const parsedLeaderId = leaderId
      ? !isNaN(Number(leaderId))
        ? Number(leaderId)
        : (selectedLeader as any)?.dbId || leaderId
      : undefined;

    try {
      if (editingGroup) {
        await updateCellGroup(editingGroup.id, {
          name,
          type,
          leader_id: parsedLeaderId as any,
          leader_name: leaderName,
          meeting_day: meetingDay,
          location,
        });
        toast.success("Group updated successfully");
      } else {
        await createCellGroup({
          name,
          type,
          leader_id: parsedLeaderId as any,
          leader_name: leaderName,
          meeting_day: meetingDay,
          location,
        });
        toast.success("New group created");
      }
      setIsModalOpen(false);
      void loadGroups();
    } catch {
      toast.error("Failed to save cell group");
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await deleteCellGroup(id);
      toast.success("Group deleted");
      void loadGroups();
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const handleOpenMembers = async (group: CellGroup) => {
    setSelectedGroup(group);
    setIsMembersOpen(true);
    try {
      const members = await fetchGroupMembers(group.id);
      setGroupMembers(members);
    } catch {
      toast.error("Failed to load group members");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newMemberWorkerId) {
      toast.error("Select a worker to add");
      return;
    }

    const selectedWorker = workers.find((w) => String(w.id) === String(newMemberWorkerId));
    const parsedWorkerId = !isNaN(Number(newMemberWorkerId))
      ? Number(newMemberWorkerId)
      : (selectedWorker as any)?.dbId || newMemberWorkerId;

    try {
      await addGroupMember(selectedGroup.id, parsedWorkerId, newMemberRole, selectedWorker);
      toast.success("Member added to group");
      const updated = await fetchGroupMembers(selectedGroup.id);
      setGroupMembers(updated);
      setNewMemberWorkerId("");
      void loadGroups();
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (workerId: number | string) => {
    if (!selectedGroup) return;
    try {
      await removeGroupMember(selectedGroup.id, workerId);
      toast.success("Member removed from group");
      const updated = await fetchGroupMembers(selectedGroup.id);
      setGroupMembers(updated);
      void loadGroups();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.leader_name && g.leader_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || g.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cell Groups & Ministry Units</h1>
          <p className="text-slate-500 text-sm">
            Manage house fellowship cells, departmental ministry teams, and leadership rosters.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Create New Group
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search group name, leader, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="all">All Group Types</option>
          <option value="cell">House Cell Groups</option>
          <option value="ministry">Ministry Units</option>
          <option value="committee">Committees</option>
        </select>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading cell groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
          No cell groups or ministry units found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold uppercase ${
                        group.type === "cell"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : group.type === "ministry"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      {group.type === "cell" ? "House Cell" : group.type === "ministry" ? "Ministry Unit" : "Committee"}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-slate-900 mt-2">{group.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(group)} className="h-8 px-2 text-xs">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteGroup(group.id)} className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Leader:</span>{" "}
                    {group.leader_name || "Unassigned"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Meeting Day:</span> {group.meeting_day}s
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Location:</span> {group.location}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {group.member_count || 0} Registered Members
                  </span>
                  <Button size="sm" onClick={() => handleOpenMembers(group)} variant="outline" className="text-xs h-8">
                    Manage Roster
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Group */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Cell Group" : "Create New Cell Group / Ministry"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGroup} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Group Name *</label>
              <Input placeholder="e.g. Grace House Cell #2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Group Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="cell">House Cell Group</option>
                  <option value="ministry">Ministry Unit</option>
                  <option value="committee">Special Committee</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Designated Leader</label>
                <SearchableWorkerSelect
                  workers={workers}
                  value={leaderId}
                  onChange={(val) => setLeaderId(val)}
                  placeholder="Search & select group leader..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Meeting Schedule</label>
                <select
                  value={meetingDay}
                  onChange={(e) => setMeetingDay(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Venue / Location *</label>
                <Input placeholder="e.g. 14 Allen Ave / Room 3" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Manage Roster */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Group Roster: {selectedGroup?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Form to add worker to group */}
            <form onSubmit={handleAddMember} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-800">Add Member to Group</p>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-2">
                  <SearchableWorkerSelect
                    workers={workers}
                    value={newMemberWorkerId}
                    onChange={(val) => setNewMemberWorkerId(val)}
                    placeholder="Search & select member..."
                    required
                  />
                </div>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded p-1.5"
                >
                  <option value="member">Member</option>
                  <option value="assistant">Assistant</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <Button type="submit" size="sm" className="w-full bg-slate-900 text-white text-xs">
                Add Worker to Roster
              </Button>
            </form>

            {/* Roster List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-700">Enrolled Members ({groupMembers.length})</p>
              {groupMembers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No members assigned to this group yet.</p>
              ) : (
                groupMembers.map((m) => (
                  <div key={m.worker_id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{m.worker_name}</p>
                      <p className="text-slate-500">{m.dept} • {m.phone || m.email || "No contact"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs uppercase bg-slate-50">
                        {m.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(m.worker_id)}
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
