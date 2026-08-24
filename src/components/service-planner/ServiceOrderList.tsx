import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Music, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { ServiceItem } from "../../types/models";

interface ServiceOrderListProps {
  items: ServiceItem[];
  loading: boolean;
  onOpenAddItem: () => void;
  onOpenEditItem: (item: ServiceItem) => void;
  onDeleteItem: (id: number) => void;
}

export function ServiceOrderList({
  items,
  loading,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteItem,
}: ServiceOrderListProps) {
  const totalDuration = items.reduce(
    (sum, item) => sum + (item.durationMinutes ?? item.duration_minutes ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-600" /> Order of Service Flow
          </h3>
          <p className="text-xs text-slate-500 font-medium">Total estimated duration: {totalDuration} mins</p>
        </div>
        <Button
          size="sm"
          onClick={onOpenAddItem}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Service Segment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-xs">Loading order of service items...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
          No service items added yet. Click "Add Service Segment" to build your program flow.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const duration = item.durationMinutes ?? item.duration_minutes ?? 0;
            const leader = item.leaderName || item.leader_name;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    {leader && (
                      <p className="text-xs text-slate-500">Leader: <strong>{leader}</strong></p>
                    )}
                    {item.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">{item.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {duration} mins
                  </Badge>
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onOpenEditItem(item)}
                      className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDeleteItem(item.id)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
