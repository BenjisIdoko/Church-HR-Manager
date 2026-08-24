import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users } from "lucide-react";
import { Worker } from "../types/models";
import { useWorkerDirectory, UpdateHistoryEntry } from "../hooks/useWorkerDirectory";
import { WorkerDirectoryFilters } from "./member-directory/WorkerDirectoryFilters";
import { WorkerTable } from "./member-directory/WorkerTable";
import { EditWorkerModal } from "./member-directory/EditWorkerModal";

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
  const dir = useWorkerDirectory({ workers, departments, updateHistory });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Volunteer Directory</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
              {dir.filteredWorkers.length} Volunteers
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Search, filter, and manage ministry volunteer profiles and department roster assignments.
          </p>
        </div>
      </div>

      <WorkerDirectoryFilters
        searchQuery={dir.searchQuery} setSearchQuery={dir.setSearchQuery}
        departmentFilter={dir.departmentFilter} setDepartmentFilter={dir.setDepartmentFilter}
        statusFilter={dir.statusFilter} setStatusFilter={dir.setStatusFilter}
        roleFilter={dir.roleFilter} setRoleFilter={dir.setRoleFilter}
        departmentOptions={dir.departmentOptions}
        roleOptions={dir.roleOptions}
        filteredWorkers={dir.filteredWorkers}
        onResetFilters={dir.handleResetFilters}
      />

      <WorkerTable
        workers={dir.paginatedWorkers}
        sortConfig={dir.sortConfig}
        editable={editable}
        onSort={dir.handleSort}
        onSelectWorker={dir.setSelectedWorker}
      />

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Rows per page:</span>
          <select
            value={dir.pageSize}
            onChange={(e) => dir.setPageSize(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 px-2 bg-white text-xs font-bold"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>
            Page {dir.currentPage} of {dir.totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => dir.setCurrentPage(1)}
            disabled={dir.currentPage === 1}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dir.setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={dir.currentPage === 1}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dir.setCurrentPage((p) => Math.min(dir.totalPages, p + 1))}
            disabled={dir.currentPage >= dir.totalPages}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dir.setCurrentPage(dir.totalPages)}
            disabled={dir.currentPage >= dir.totalPages}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <EditWorkerModal
        worker={dir.selectedWorker}
        departments={dir.departmentOptions}
        isOpen={Boolean(dir.selectedWorker)}
        onOpenChange={(open) => { if (!open) dir.setSelectedWorker(null); }}
        onUpdateWorker={onUpdateWorker}
      />
    </div>
  );
}
