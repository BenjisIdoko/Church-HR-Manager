import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { formatDistance } from "../../utils/clockInService";
import { isRecordWithinGeofence } from "../../utils/clockInRecordUtils";

interface ClockInLogsTableProps {
  records: any[];
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  geofenceFilter: "all" | "in-range" | "out-of-range";
  setGeofenceFilter: (filter: "all" | "in-range" | "out-of-range") => void;
  onRefresh: () => void;
}

export function ClockInLogsTable({
  records,
  loading,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
  geofenceFilter,
  setGeofenceFilter,
  onRefresh,
}: ClockInLogsTableProps) {
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.workerName || r.worker_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.department || r.worker_dept || "").toLowerCase().includes(searchQuery.toLowerCase());

    const isWithin = isRecordWithinGeofence(r);

    if (geofenceFilter === "in-range") return matchesSearch && isWithin;
    if (geofenceFilter === "out-of-range") return matchesSearch && !isWithin;
    return matchesSearch;
  });

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 h-10 rounded-xl text-xs font-semibold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              className="h-10 w-10 rounded-xl"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search volunteer name..."
                className="pl-9 h-10 rounded-xl text-xs"
              />
            </div>

            <select
              value={geofenceFilter}
              onChange={(e) => setGeofenceFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="all">All Logs</option>
              <option value="in-range">In Geofence</option>
              <option value="out-of-range">Out of Range</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Loading clock-in logs...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">No clock-in records found for {selectedDate}.</div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Volunteer</TableHead>
                  <TableHead className="font-bold text-slate-700">Department</TableHead>
                  <TableHead className="font-bold text-slate-700">Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
                  <TableHead className="font-bold text-slate-700">GPS Distance</TableHead>
                  <TableHead className="font-bold text-slate-700">Geofence Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r, i) => {
                  const name = r.workerName || r.worker_name || "Unknown Volunteer";
                  const dept = r.department || r.worker_dept || "General";
                  const type = r.type || "clock-in";
                  const time = new Date(r.timestamp || r.created_at).toLocaleTimeString();
                  const dist = r.distance_from_church ?? r.distance ?? r.distanceMeters ?? r.distance_meters;
                  const isWithin = isRecordWithinGeofence(r);

                  return (
                    <TableRow key={r.id || i} className="hover:bg-slate-50/80">
                      <TableCell className="font-bold text-slate-900">{name}</TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">{dept}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs font-semibold ${
                            type === "clock-in"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">{time}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        {dist !== undefined && dist !== null ? formatDistance(Number(dist)) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${
                            isWithin
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isWithin ? "In Range" : "Out of Range"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
