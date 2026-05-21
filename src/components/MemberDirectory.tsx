import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Download, Edit3, ChevronUp, ChevronDown, RotateCcw, Clock2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Worker } from "../utils/mockData";
import { sortData, SortConfig, exportToCSV } from "../utils/tableUtils";

interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

interface MemberDirectoryProps {
  workers: Worker[];
  departments: string[];
  updateHistory: UpdateHistoryEntry[];
  onUpdateWorker: (worker: Worker) => void;
  editable?: boolean;
}

export function MemberDirectory({
  workers,
  departments,
  updateHistory,
  onUpdateWorker,
  editable = true,
}: MemberDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const departmentOptions = useMemo(
    () => Array.from(new Set([...departments, ...workers.map((w) => w.department)])),
    [departments, workers],
  );

  const roleOptions = useMemo(() => Array.from(new Set(workers.map((w) => w.role))), [workers]);

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = departmentFilter === "all" || worker.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
    const matchesRole = roleFilter === "all" || worker.role === roleFilter;

    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  const sortedWorkers = sortData(filteredWorkers, sortConfig);

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else if (sortConfig.direction === "desc") {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const handleExport = () => {
    exportToCSV(
      sortedWorkers,
      `workers-directory_${new Date().toISOString().split("T")[0]}`,
      ["id", "name", "email", "department", "role", "status"],
    );
  };

  const handleReset = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setRoleFilter("all");
    setSortConfig(null);
  };

  const handleSave = () => {
    if (!selectedWorker) return;
    onUpdateWorker(selectedWorker);
    toast.success("Worker update saved and history recorded.");
    setSelectedWorker(null);
  };

  const handleStartEdit = (worker: Worker) => {
    setSelectedWorker(worker);
  };

  const pageTitle = "Workers Directory";
  const pageDescription = "Search, filter and review worker records with change history in one place.";
  const sectionTitle = "Directory Overview";
  const sectionDescription = "Search, filter and review worker records with change history in one place.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1>{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory Overview</CardTitle>
          <CardDescription>
            Search, filter and review worker records with change history in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by name, ID, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge className="bg-slate-100 text-slate-700">Showing {sortedWorkers.length} of {workers.length}</Badge>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("id")}>Worker ID{getSortIcon("id")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("name")}>Name{getSortIcon("name")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("email")}>Email{getSortIcon("email")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("department")}>Department{getSortIcon("department")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("role")}>Role{getSortIcon("role")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("status")}>Status{getSortIcon("status")}</TableHead>
                  {editable && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No workers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.id}</TableCell>
                      <TableCell>{worker.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{worker.email}</TableCell>
                      <TableCell>{worker.department}</TableCell>
                      <TableCell>{worker.role}</TableCell>
                      <TableCell>
                        <Badge className={worker.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                          {worker.status}
                        </Badge>
                      </TableCell>
                      {editable && (
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleStartEdit(worker)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {editable && selectedWorker && (
            <Dialog open={Boolean(selectedWorker)} onOpenChange={(open) => !open && setSelectedWorker(null)}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Member</DialogTitle>
                  <DialogDescription>Update the selected member details in a modal window.</DialogDescription>
                </DialogHeader>
                <Card className="border-2 border-slate-200 shadow-sm">
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={selectedWorker.name}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={selectedWorker.email}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Select
                          value={selectedWorker.department}
                          onValueChange={(value) => setSelectedWorker({ ...selectedWorker, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentOptions.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={selectedWorker.role}
                          onValueChange={(value) => setSelectedWorker({ ...selectedWorker, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={selectedWorker.phone}
                          onChange={(e) => setSelectedWorker({ ...selectedWorker, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          value={selectedWorker.status}
                          onValueChange={(value) => setSelectedWorker({ ...selectedWorker, status: value as Worker["status"] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedWorker(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </CardContent>
                </Card>

                <Card className="mt-6 border-2 border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Update</CardTitle>
                    <CardDescription>
                      Inline history shows the changes for this member.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {updateHistory.filter((entry) => entry.workerId === selectedWorker.id).slice(0, 5).map((entry, index) => (
                      <div key={index} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                          <span>{entry.timestamp}</span>
                          <Badge className="bg-slate-100 text-slate-700">{entry.changes}</Badge>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{entry.workerName}</p>
                      </div>
                    ))}
                    {updateHistory.filter((entry) => entry.workerId === selectedWorker.id).length === 0 && (
                      <p className="text-sm text-slate-500">No history tracked yet for this member.</p>
                    )}
                  </CardContent>
                </Card>
              </DialogContent>
            </Dialog>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock2 className="h-5 w-5 text-slate-700" />
                  <div>
                    <CardTitle>Update History</CardTitle>
                    <CardDescription>
                      Track all member record changes in chronological order.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No update history recorded yet.</p>
                ) : (
                  updateHistory.map((entry, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                        <span>{entry.timestamp}</span>
                        <Badge className="bg-slate-100 text-slate-700">{entry.workerName}</Badge>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">Updated fields: {entry.changes}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
