import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User, Edit3, Save } from "lucide-react";
import { Worker } from "../../types/models";
import { toast } from "sonner";

interface EditWorkerModalProps {
  worker: Worker | null;
  departments: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateWorker: (worker: Worker) => Promise<void>;
}

export function EditWorkerModal({
  worker,
  departments,
  isOpen,
  onOpenChange,
  onUpdateWorker,
}: EditWorkerModalProps) {
  const [formState, setFormState] = useState<Worker | null>(worker);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormState(worker);
  }, [worker]);

  if (!formState) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateWorker(formState);
      toast.success(`Updated profile for ${formState.name}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to update worker profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" /> Edit Volunteer Profile ({formState.id})
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formState.phone || ""}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Primary Department</Label>
              <select
                id="department"
                value={formState.department}
                onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Member Status</Label>
              <select
                id="status"
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-semibold">
              <Save className="w-4 h-4" /> {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
