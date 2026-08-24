import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, RotateCcw, Download } from "lucide-react";
import { exportToCSV } from "../../utils/tableUtils";
import { Worker } from "../../types/models";

interface WorkerDirectoryFiltersProps {
  searchQuery: string; setSearchQuery: (val: string) => void;
  departmentFilter: string; setDepartmentFilter: (val: string) => void;
  statusFilter: string; setStatusFilter: (val: string) => void;
  roleFilter: string; setRoleFilter: (val: string) => void;
  departmentOptions: string[];
  roleOptions: string[];
  filteredWorkers: Worker[];
  onResetFilters: () => void;
}

export function WorkerDirectoryFilters({
  searchQuery, setSearchQuery,
  departmentFilter, setDepartmentFilter,
  statusFilter, setStatusFilter,
  roleFilter, setRoleFilter,
  departmentOptions,
  roleOptions,
  filteredWorkers,
  onResetFilters,
}: WorkerDirectoryFiltersProps) {
  const handleExportCSV = () => {
    const csvData = filteredWorkers.map((w) => ({
      ID: w.id,
      Name: w.name,
      Email: w.email,
      Phone: w.phone,
      Department: Array.isArray(w.departments) ? w.departments.join("; ") : w.department,
      Role: w.role,
      Status: w.status,
    }));
    exportToCSV(csvData, `volunteer-directory-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search volunteer name, email, ID..."
            className="pl-10 h-10 rounded-xl text-xs"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="all">All Departments</option>
          {departmentOptions.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="all">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="h-10 rounded-xl text-xs font-semibold gap-1 text-slate-600"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      <Button
        onClick={handleExportCSV}
        variant="outline"
        size="sm"
        className="h-10 rounded-xl text-xs font-semibold gap-2 text-slate-700 border-slate-200"
      >
        <Download className="w-4 h-4" /> Export CSV
      </Button>
    </div>
  );
}
