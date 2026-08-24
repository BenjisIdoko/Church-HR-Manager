import { Button } from "../ui/button";
import { Plus, Calendar, Music, Pencil, Trash2 } from "lucide-react";
import { ServicePlan } from "../../types/models";

interface ServicePlanSidebarProps {
  plans: ServicePlan[];
  activePlanId: number | null;
  onSelectPlan: (id: number) => void;
  onOpenNewPlan: () => void;
  onOpenEditPlan: (plan: ServicePlan) => void;
  onDeletePlan: (id: number) => void;
}

export function ServicePlanSidebar({
  plans,
  activePlanId,
  onSelectPlan,
  onOpenNewPlan,
  onOpenEditPlan,
  onDeletePlan,
}: ServicePlanSidebarProps) {
  return (
    <div className="w-full lg:w-80 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" /> Service Plans
        </h2>
        <Button
          size="sm"
          onClick={onOpenNewPlan}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 rounded-xl"
        >
          <Plus className="w-4 h-4" /> New Plan
        </Button>
      </div>

      <div className="space-y-2">
        {plans.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
            No service plans found. Click "New Plan" to create one.
          </div>
        ) : (
          plans.map((plan) => {
            const isActive = plan.id === activePlanId;
            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white border-slate-200 hover:border-indigo-300 text-slate-900"
                }`}
              >
                <div className="space-y-1">
                  <p className="font-bold text-sm leading-tight line-clamp-1">{plan.title}</p>
                  <div className="flex items-center gap-2 text-[11px] opacity-90">
                    <span className="font-semibold">{plan.date}</span>
                    <span>•</span>
                    <span>{plan.serviceType}</span>
                  </div>
                </div>

                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-white" : "text-slate-500"}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenEditPlan(plan); }}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Edit Plan"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete plan "${plan.title}"?`)) onDeletePlan(plan.id);
                    }}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
