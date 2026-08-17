import { useMemo, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Download, Edit3, ChevronUp, ChevronDown, RotateCcw, Clock2, Upload, Camera, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Worker } from "../types/models";
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
  onUpdateWorker: (updatedWorker: Worker) => Promise<void>;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeUpdateHistory = Array.isArray(updateHistory) ? updateHistory : [];

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...safeDepartments,
          ...safeWorkers.map((w) => w?.department).filter((d): d is string => Boolean(d)),
        ]),
      ),
    [safeDepartments, safeWorkers],
  );

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(safeWorkers.map((w) => w?.role).filter((r): r is string => Boolean(r))),
      ),
    [safeWorkers],
  );

  const query = searchQuery.trim().toLowerCase();

  const strictFiltered = safeWorkers.filter((worker) => {
    const matchesSearch =
      !query ||
      (worker.name || "").toLowerCase().includes(query) ||
      (worker.id || "").toLowerCase().includes(query) ||
      (worker.email || "").toLowerCase().includes(query) ||
      (worker.phone || "").toLowerCase().includes(query) ||
      (worker.department || "").toLowerCase().includes(query) ||
      (worker.role || "").toLowerCase().includes(query) ||
      (worker.status || "").toLowerCase().includes(query);

    const matchesDepartment =
      departmentFilter === "all" ||
      (worker.department || "").trim().toLowerCase() === departmentFilter.trim().toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (worker.status || "").trim().toLowerCase() === statusFilter.trim().toLowerCase();

    const matchesRole =
      roleFilter === "all" ||
      (worker.role || "").trim().toLowerCase() === roleFilter.trim().toLowerCase();

    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  const isGlobalFallback =
    query.length > 0 &&
    strictFiltered.length === 0 &&
    (departmentFilter !== "all" || roleFilter !== "all" || statusFilter !== "all");

  const globalFiltered = isGlobalFallback
    ? safeWorkers.filter((worker) => {
        return (
          (worker.name || "").toLowerCase().includes(query) ||
          (worker.id || "").toLowerCase().includes(query) ||
          (worker.email || "").toLowerCase().includes(query) ||
          (worker.phone || "").toLowerCase().includes(query) ||
          (worker.department || "").toLowerCase().includes(query) ||
          (worker.role || "").toLowerCase().includes(query) ||
          (worker.status || "").toLowerCase().includes(query)
        );
      })
    : [];

  const filteredWorkers = isGlobalFallback ? globalFiltered : strictFiltered;

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
      `volunteer-directory_${new Date().toISOString().split("T")[0]}`,
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

  const handleSaveWorker = async () => {
    if (selectedWorker) {
      try {
        await onUpdateWorker(selectedWorker);
        toast.success("Volunteer update saved and history recorded.");
        setSelectedWorker(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save volunteer update.");
      }
    }
  };

  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/upload-profile-image", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'Upload failed');
        }

        if (selectedWorker) {
          setSelectedWorker({ ...selectedWorker, profileImage: result.imageUrl });
        }
        toast.success("Profile image uploaded successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
      } finally {
        setUploading(false);
      }
    }
  };

  const hasActiveFilters = searchQuery !== "" || departmentFilter !== "all" || roleFilter !== "all" || statusFilter !== "all";
  const pageTitle = "Volunteer Directory";
  const pageDescription = "Search, filter and review volunteer records with change history in one place.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1>{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volunteer Overview</CardTitle>
          <CardDescription>
            Search, filter and review volunteer records with change history in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Input
                  placeholder="Search by name, ID, department, or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={searchQuery ? "pr-8" : ""}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
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

          {/* Global Search Fallback Banner */}
          {isGlobalFallback && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <span>
                No match in <strong>{departmentFilter !== "all" ? departmentFilter : "selected filter"}</strong>. Showing {filteredWorkers.length} matching volunteer(s) for "<strong>{searchQuery}</strong>" across all departments.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDepartmentFilter("all");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-amber-900 underline hover:bg-amber-100 shrink-0 text-xs"
              >
                Clear Department Filter
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No volunteers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        {worker.profileImage ? (
                          <img
                            src={worker.profileImage}
                            alt={worker.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
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
                          <Button variant="outline" size="sm" onClick={() => handleSelectWorker(worker)}>
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
                  <DialogTitle>Edit Volunteer Record</DialogTitle>
                  <DialogDescription>Update details for {selectedWorker.name}. Changes take effect immediately.</DialogDescription>
                </DialogHeader>
                <Card className="border-2 border-slate-200 shadow-sm">
                  <CardContent className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {selectedWorker.profileImage ? (
                          <img
                            src={selectedWorker.profileImage}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-4 border-slate-200"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-200">
                            <UserIcon className="h-10 w-10 text-slate-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors"
                          disabled={uploading}
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-center">
                        <Label htmlFor="edit-profile-image" className="text-base font-medium text-center">Profile Photo</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a profile picture (JPEG, PNG, GIF, or WebP, max 5MB)
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </Button>
                          {selectedWorker.profileImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedWorker({ ...selectedWorker, profileImage: '' })}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="edit-profile-image"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

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
                      <Button onClick={handleSaveWorker}>
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
                    {safeUpdateHistory.filter((entry) => entry.workerId === selectedWorker.id).slice(0, 5).map((entry, index) => (
                      <div key={index} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                          <span>{entry.timestamp}</span>
                          <Badge className="bg-slate-100 text-slate-700">{entry.changes}</Badge>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{entry.workerName}</p>
                      </div>
                    ))}
                    {safeUpdateHistory.filter((entry) => entry.workerId === selectedWorker.id).length === 0 && (
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
                {safeUpdateHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No update history recorded yet.</p>
                ) : (
                  safeUpdateHistory.map((entry, index) => (
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
