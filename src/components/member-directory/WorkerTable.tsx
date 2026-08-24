import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit3, ChevronUp, ChevronDown, User as UserIcon } from "lucide-react";
import { Worker } from "../../types/models";
import { SortConfig } from "../../utils/tableUtils";

interface WorkerTableProps {
  workers: Worker[];
  sortConfig: SortConfig | null;
  editable: boolean;
  onSort: (key: string) => void;
  onSelectWorker: (worker: Worker) => void;
}

export function WorkerTable({
  workers,
  sortConfig,
  editable,
  onSort,
  onSelectWorker,
}: WorkerTableProps) {
  const renderSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead
              onClick={() => onSort("name")}
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Volunteer Name {renderSortIndicator("name")}
            </TableHead>
            <TableHead
              onClick={() => onSort("id")}
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Worker ID {renderSortIndicator("id")}
            </TableHead>
            <TableHead
              onClick={() => onSort("department")}
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Department {renderSortIndicator("department")}
            </TableHead>
            <TableHead
              onClick={() => onSort("role")}
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Role {renderSortIndicator("role")}
            </TableHead>
            <TableHead
              onClick={() => onSort("status")}
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Status {renderSortIndicator("status")}
            </TableHead>
            <TableHead className="font-bold text-slate-700">Contact Email</TableHead>
            {editable && <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                No volunteer workers found matching the selected criteria.
              </TableCell>
            </TableRow>
          ) : (
            workers.map((worker) => {
              const depts = Array.isArray(worker.departments)
                ? worker.departments
                : (worker.department || "").split(",").map((d) => d.trim()).filter(Boolean);

              return (
                <TableRow key={worker.id} className="hover:bg-slate-50/80">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {worker.profileImage ? (
                          <img src={worker.profileImage} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{worker.name}</p>
                        <p className="text-[11px] text-slate-500">{worker.phone || "No phone"}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    {worker.id}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {depts.map((d, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-indigo-50/60 text-indigo-700 border-indigo-200 text-[11px] font-semibold"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-slate-700">
                    {worker.role || "Member"}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs font-bold ${
                        worker.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {worker.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 font-mono">
                    {worker.email}
                  </TableCell>

                  {editable && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectWorker(worker)}
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg p-0"
                        title="Edit volunteer profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
