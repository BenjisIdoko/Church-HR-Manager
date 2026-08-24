import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { FolderTree, Plus, Pencil, Trash2, Layers } from "lucide-react";
import { Badge } from "../ui/badge";

interface DepartmentSettingsTabProps {
  departments: string[];
  filteredDepartments: string[];
  newDepartment: string; setNewDepartment: (val: string) => void;
  departmentSearch: string; setDepartmentSearch: (val: string) => void;
  isEditDeptModalOpen: boolean; setIsEditDeptModalOpen: (open: boolean) => void;
  editDepartmentName: string; setEditDepartmentName: (val: string) => void;
  editingDepartment: string | null;
  onAddDepartmentSubmit: (e: React.FormEvent) => void;
  onOpenEditDepartment: (dept: string) => void;
  onSaveEditDepartment: (e: React.FormEvent) => void;
  onRemoveDepartmentClick: (dept: string) => void;
  getVolunteerCount: (dept: string) => number;
}

export function DepartmentSettingsTab({
  departments,
  filteredDepartments,
  newDepartment, setNewDepartment,
  departmentSearch, setDepartmentSearch,
  isEditDeptModalOpen, setIsEditDeptModalOpen,
  editDepartmentName, setEditDepartmentName,
  editingDepartment,
  onAddDepartmentSubmit,
  onOpenEditDepartment,
  onSaveEditDepartment,
  onRemoveDepartmentClick,
  getVolunteerCount,
}: DepartmentSettingsTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <FolderTree className="w-4 h-4" /> Ministry & Department Taxonomy
        </div>
        <CardTitle className="text-xl">Manage Active Church Departments</CardTitle>
        <CardDescription>
          Add, rename, or reorganize department structures for workforce allocation and roster assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onAddDepartmentSubmit} className="flex gap-2">
          <Input
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            placeholder="Enter new department name (e.g. Media & Technical)"
            className="flex-1"
          />
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </form>

        <div className="flex items-center justify-between gap-4">
          <Input
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            placeholder="Search departments..."
            className="max-w-xs"
          />
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredDepartments.length} of {departments.length} departments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDepartments.map((dept) => {
            const count = getVolunteerCount(dept);
            return (
              <div
                key={dept}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{dept}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{count} Active Volunteers</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenEditDepartment(dept)}
                    className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Edit department name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveDepartmentClick(dept)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Remove department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Department Modal */}
        <Dialog open={isEditDeptModalOpen} onOpenChange={setIsEditDeptModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" /> Rename Department
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={onSaveEditDepartment} className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Renaming <strong>{editingDepartment}</strong> will automatically update all associated volunteer profiles.
                </p>
                <Input
                  value={editDepartmentName}
                  onChange={(e) => setEditDepartmentName(e.target.value)}
                  placeholder="Department name"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDeptModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
