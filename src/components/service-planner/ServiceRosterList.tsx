import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, Plus, Trash2, Send } from "lucide-react";
import { ServiceRoster } from "../../types/models";

interface ServiceRosterListProps {
  roster: ServiceRoster[];
  loading: boolean;
  onOpenAddRoster: () => void;
  onDeleteRoster: (id: number) => void;
  onOpenReminder: (roster: ServiceRoster) => void;
}

export function ServiceRosterList({
  roster,
  loading,
  onOpenAddRoster,
  onDeleteRoster,
  onOpenReminder,
}: ServiceRosterListProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Ministry Roster & Volunteer Assignments
          </h3>
          <p className="text-xs text-slate-500 font-medium">{roster.length} scheduled volunteers</p>
        </div>
        <Button
          size="sm"
          onClick={onOpenAddRoster}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Schedule Volunteer
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-xs">Loading volunteer roster...</div>
      ) : roster.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
          No volunteers scheduled for this service yet. Click "Schedule Volunteer" to add team members.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roster.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-xs"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{entry.workerName}</p>
                <p className="text-xs text-slate-500">{entry.department} • <strong className="text-slate-700">{entry.roleTitle}</strong></p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenReminder(entry)}
                  className="text-xs font-semibold gap-1 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Send className="w-3 h-3" /> Remind
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDeleteRoster(entry.id)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
