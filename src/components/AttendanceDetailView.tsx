import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Download, Calendar, CheckCircle2, Clock, XCircle, User, Award } from "lucide-react";
import { AttendanceRecord, Worker } from "../types/models";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { exportToCSV } from "../utils/tableUtils";
import { parseLocalDate } from "../utils/dateUtils";
import { toast } from "sonner";

interface AttendanceDetailViewProps {
  workers: Worker[];
  attendanceRecords: AttendanceRecord[];
  loading?: boolean;
}

export function AttendanceDetailView({
  workers,
  attendanceRecords,
  loading = false,
}: AttendanceDetailViewProps) {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const worker = workers.find((w) => w.id === workerId);
  const workerRecords = attendanceRecords
    .filter((r) => r.workerId === workerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  if (!worker) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto my-8 p-6 space-y-4">
        <p className="text-slate-500 text-sm font-semibold">Volunteer Worker record not found in system.</p>
        <Button className="bg-slate-900 text-white font-bold text-xs" onClick={() => navigate("/attendance")}>
          Back to Attendance Overview
        </Button>
      </div>
    );
  }

  const totalDays = workerRecords.length;
  const presentDays = workerRecords.filter((r) => r.status === "present").length;
  const lateDays = workerRecords.filter((r) => r.status === "late").length;
  const absentDays = workerRecords.filter((r) => r.status === "absent").length;

  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  const summaryData = [
    { name: "Present", value: presentDays, color: "#10b981" },
    { name: "Late", value: lateDays, color: "#f59e0b" },
    { name: "Absent", value: absentDays, color: "#f43f5e" },
  ];

  const handleExport = () => {
    if (workerRecords.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }

    const exportData = workerRecords.map((record) => ({
      "Worker ID": record.workerId,
      "Worker Name": worker.name,
      "Department": worker.department,
      "Date": record.date,
      "Day": parseLocalDate(record.date).toLocaleDateString("en-US", { weekday: "long" }),
      "Status": record.status.toUpperCase(),
    }));

    exportToCSV(exportData, `${worker.name.replace(/\s+/g, "_")}_attendance_history`);
    toast.success(`Exported attendance history for ${worker.name}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] uppercase font-bold">Present</Badge>;
      case "late":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] uppercase font-bold">Late</Badge>;
      case "absent":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] uppercase font-bold">Absent</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Navigation & Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/attendance")}
            className="h-9 w-9 text-slate-600 border-slate-300 hover:bg-slate-100 shrink-0"
            title="Back to Attendance Overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{worker.name}</h1>
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-xs">
                {worker.department}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Worker ID: <span className="font-mono font-semibold text-slate-700">{worker.id}</span> &nbsp;•&nbsp; Role:{" "}
              <span className="font-semibold text-slate-700">{worker.role}</span>
            </p>
          </div>
        </div>

        <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs shadow-sm self-start md:self-auto">
          <Download className="w-4 h-4" /> Export Worker Attendance
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Services Tracked</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalDays}</p>
              <p className="text-[10px] text-slate-400 mt-1">Logged attendance history</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Present On-Time</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{presentDays}</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">
                {totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0}% Punctuality Rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{lateDays}</p>
              <p className="text-[10px] text-amber-700 font-medium mt-1">
                {totalDays > 0 ? Math.round((lateDays / totalDays) * 100) : 0}% Late Rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Absences</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{absentDays}</p>
              <p className="text-[10px] text-rose-700 font-medium mt-1">
                {totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0}% Absent Rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Summary Chart */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 pb-2 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Attendance Distribution Overview</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Punctuality breakdown for {worker.name} across worship services
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={summaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                <YAxis allowDecimals={false} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", borderColor: "#cbd5e1" }} />
                <Bar dataKey="value" name="Service Count" radius={[6, 6, 0, 0]}>
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Service Attendance History Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Service Attendance History</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {loading ? "Loading attendance records..." : `Detailed service logs for ${worker.name}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Worker ID</th>
                <th className="p-3">Service Date</th>
                <th className="p-3">Day of Week</th>
                <th className="p-3 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workerRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No attendance records found for this volunteer.
                  </td>
                </tr>
              ) : (
                workerRecords.map((record, idx) => {
                  const dateObj = parseLocalDate(record.date);
                  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{record.workerId}</td>
                      <td className="p-3 font-mono text-slate-900 font-semibold">{record.date}</td>
                      <td className="p-3 text-slate-600 font-medium">{dayName}</td>
                      <td className="p-3 text-right">{getStatusBadge(record.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
