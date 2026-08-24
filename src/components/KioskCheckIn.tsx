import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LayoutList, Monitor, ShieldCheck } from "lucide-react";
import { User, Worker } from "../types/models";
import { useKioskCheckIn } from "../hooks/useKioskCheckIn";
import { KioskFormCard } from "./kiosk/KioskFormCard";
import { KioskAdminRoster } from "./kiosk/KioskAdminRoster";
import { KioskBadgeDialog } from "./kiosk/KioskBadgeDialog";

interface KioskCheckInProps {
  user?: User | null;
  workers?: Worker[];
}

export function KioskCheckIn({ user, workers = [] }: KioskCheckInProps) {
  const k = useKioskCheckIn({ user, workers });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planning Center Check-Ins</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
              Kids Kiosk
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Self-service child check-in & admin pickup verification system.
          </p>
        </div>

        {k.isAdmin && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Button
              size="sm"
              variant={k.viewMode === "kiosk" ? "default" : "ghost"}
              onClick={() => k.setViewMode("kiosk")}
              className={`rounded-lg text-xs font-bold gap-1.5 ${k.viewMode === "kiosk" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Kiosk View
            </Button>
            <Button
              size="sm"
              variant={k.viewMode === "admin" ? "default" : "ghost"}
              onClick={() => k.setViewMode("admin")}
              className={`rounded-lg text-xs font-bold gap-1.5 ${k.viewMode === "admin" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Admin Roster
            </Button>
          </div>
        )}
      </div>

      {k.viewMode === "kiosk" ? (
        <div className="max-w-xl mx-auto py-4">
          <KioskFormCard
            childName={k.childName} setChildName={k.setChildName}
            parentName={k.parentName} setParentName={k.setParentName}
            parentPhone={k.parentPhone} setParentPhone={k.setParentPhone}
            department={k.department} setDepartment={k.setDepartment}
            submitting={k.submitting}
            onSubmit={k.handleKioskSubmit}
          />
        </div>
      ) : (
        <KioskAdminRoster
          searchQuery={k.searchQuery}
          setSearchQuery={k.setSearchQuery}
          filteredCheckins={k.filteredCheckins}
          loading={k.loading}
          onCheckout={k.handleCheckout}
        />
      )}

      <KioskBadgeDialog
        isOpen={k.isBadgeOpen}
        onOpenChange={k.setIsBadgeOpen}
        lastCheckin={k.lastCheckin}
        onPrintBadge={k.handlePrintBadge}
      />
    </div>
  );
}
