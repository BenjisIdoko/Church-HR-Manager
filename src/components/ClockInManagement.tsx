import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Clock, MapPin, Database } from "lucide-react";
import { useClockInManagement } from "../hooks/useClockInManagement";
import { GeofenceFormCard } from "./clock-in-management/GeofenceFormCard";
import { ClockInLogsTable } from "./clock-in-management/ClockInLogsTable";

export function ClockInManagement() {
  const m = useClockInManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clock-In & Geofence Portal</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
              GPS Enforcement
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Configure auditorium GPS boundary, tolerance buffers, and audit daily volunteer clock-in logs.
          </p>
        </div>
      </div>

      <Tabs value={m.activeTab} onValueChange={m.setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="portal" className="rounded-lg gap-2 text-xs font-semibold">
            <MapPin className="w-4 h-4" /> Geofence Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg gap-2 text-xs font-semibold">
            <Database className="w-4 h-4" /> Clock-In Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portal">
          <GeofenceFormCard
            initialSettings={m.settings}
            saving={m.saving}
            locating={m.locating}
            onSave={m.saveSettings}
            onFetchCurrentLocation={m.handleFetchCurrentLocation}
          />
        </TabsContent>

        <TabsContent value="logs">
          <ClockInLogsTable
            records={m.records}
            loading={m.loadingRecords}
            selectedDate={m.selectedDate}
            setSelectedDate={m.setSelectedDate}
            searchQuery={m.searchQuery}
            setSearchQuery={m.setSearchQuery}
            geofenceFilter={m.geofenceFilter}
            setGeofenceFilter={m.setGeofenceFilter}
            onRefresh={m.refetchRecords}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
