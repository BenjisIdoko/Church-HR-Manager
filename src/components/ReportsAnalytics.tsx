import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  FileJson,
  Printer,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Badge } from "./ui/badge";
import { Worker, AttendanceRecord } from "../types/models";
import { downloadCSV, printReport } from "../utils/exportUtils";
import { DatePicker } from "./ui/date-picker";
import { toast } from "sonner";

const DONUT_COLORS = ["#10b981", "#f59e0b", "#f43f5e"]; // Emerald, Amber, Rose

interface ReportsAnalyticsProps {
  attendanceRecords: AttendanceRecord[];
  loading?: boolean;
}

export function ReportsAnalytics({ attendanceRecords, loading = false }: ReportsAnalyticsProps) {
  const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];

  const latestDate = useMemo(
    () => safeRecords.reduce((latest, record) => (record.date > latest ? record.date : latest), ""),
    [safeRecords]
  );

  const defaultStartDate = useMemo(() => {
    if (!latestDate) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const start = new Date(latestDate);
    start.setDate(start.getDate() - 30);
    return start.toISOString().split("T")[0];
  }, [latestDate]);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(latestDate || new Date().toISOString().split("T")[0]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  useEffect(() => {
    if (latestDate) {
      setEndDate((prev) => (prev ? prev : latestDate));
      setStartDate((prev) => (prev ? prev : defaultStartDate));
    }
  }, [defaultStartDate, latestDate]);

  const departments = useMemo(
    () => Array.from(new Set(safeRecords.map((r) => r.department))).filter(Boolean).sort(),
    [safeRecords]
  );

  // Quick Preset Filters
  const handleApplyPreset = (preset: "7days" | "30days" | "month" | "all") => {
    const end = latestDate || new Date().toISOString().split("T")[0];
    setEndDate(end);
    if (preset === "7days") {
      const d = new Date(end);
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split("T")[0]);
    } else if (preset === "30days") {
      const d = new Date(end);
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const d = new Date(end);
      d.setDate(1);
      setStartDate(d.toISOString().split("T")[0]);
    } else {
      const earliest = safeRecords.reduce((oldest, r) => (!oldest || r.date < oldest ? r.date : oldest), "");
      setStartDate(earliest || "2026-01-01");
    }
    toast.info(`Applied ${preset} date range filter`);
  };

  // Filter records by date range and department
  const filteredRecords = useMemo(() => {
    return safeRecords.filter((record) => {
      const recordDate = record.date;
      const matchesDate = recordDate >= startDate && recordDate <= endDate;
      const matchesDepartment = departmentFilter === "all" || record.department === departmentFilter;
      return matchesDate && matchesDepartment;
    });
  }, [safeRecords, startDate, endDate, departmentFilter]);

  // Executive Summary Metrics
  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === "present").length;
  const lateCount = filteredRecords.filter((r) => r.status === "late").length;
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length;

  const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;
  const punctualityRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Find Top Performing Department
  const topDepartment = useMemo(() => {
    if (departments.length === 0 || safeRecords.length === 0) return { name: "N/A", rate: 0 };
    let bestDept = "N/A";
    let bestRate = -1;

    departments.forEach((dept) => {
      const deptRecs = filteredRecords.filter((r) => r.department === dept);
      if (deptRecs.length > 0) {
        const attended = deptRecs.filter((r) => r.status === "present" || r.status === "late").length;
        const rate = Math.round((attended / deptRecs.length) * 100);
        if (rate > bestRate) {
          bestRate = rate;
          bestDept = dept;
        }
      }
    });
    return { name: bestDept, rate: bestRate >= 0 ? bestRate : 0 };
  }, [departments, filteredRecords, safeRecords]);

  // Export CSV
  const handleCSVExport = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records available in current filter to export.");
      return;
    }
    downloadCSV(`attendance_report_${startDate}_to_${endDate}.csv`, filteredRecords as any);
    toast.success("CSV attendance report downloaded!");
  };

  // Export JSON
  const handleJSONExport = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records available in current filter to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_report_${startDate}_to_${endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON attendance data downloaded!");
  };

  // Print Executive PDF Report
  const handlePrintPDF = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records available to generate report.");
      return;
    }

    const rowsHtml = filteredRecords
      .slice(0, 100)
      .map(
        (r, i) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px; text-align: center; font-weight: bold;">${i + 1}</td>
        <td style="padding: 8px; font-weight: bold; color: #0f172a;">${r.workerName}</td>
        <td style="padding: 8px; color: #475569;">${r.department}</td>
        <td style="padding: 8px; font-family: monospace;">${r.date}</td>
        <td style="padding: 8px; text-align: right;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; ${
            r.status === "present"
              ? "background: #dcfce7; color: #15803d;"
              : r.status === "late"
              ? "background: #fef3c7; color: #b45309;"
              : "background: #ffe4e6; color: #be123c;"
          }">${r.status}</span>
        </td>
      </tr>
    `
      )
      .join("");

    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 760px; margin: 0 auto; border: 2px solid #e2e8f0; padding: 32px; border-radius: 16px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 3px double #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #4f46e5; font-size: 22px; font-weight: 800; letter-spacing: 1px;">CHURCH ATTENDANCE & HR EXECUTIVE REPORT</h2>
          <p style="margin: 6px 0 0 0; color: #64748b; font-size: 13px;">
            Reporting Period: <strong>${startDate}</strong> to <strong>${endDate}</strong> &nbsp;|&nbsp; Department: <strong>${departmentFilter.toUpperCase()}</strong>
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; text-align: center;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Logs</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${totalRecords}</p>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Turnout Rate</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #166534;">${attendanceRate}%</p>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Punctuality Score</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #4f46e5;">${punctualityRate}%</p>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Top Ministry</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">${topDepartment.name}</p>
          </div>
        </div>

        <h3 style="color: #1e1b4b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 15px; margin-bottom: 12px;">ATTENDANCE LOG BREAKDOWN</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px; text-align: center; width: 35px;">#</th>
              <th style="padding: 8px;">Volunteer Worker</th>
              <th style="padding: 8px;">Department</th>
              <th style="padding: 8px;">Service Date</th>
              <th style="padding: 8px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    printReport(`Executive_Attendance_Report_${startDate}_to_${endDate}`, htmlContent);
  };

  // Status Pie Data
  const statusData = [
    { name: "Present", value: presentCount },
    { name: "Late", value: lateCount },
    { name: "Absent", value: absentCount },
  ];

  // Department-wise attendance comparison
  const departmentData = useMemo(() => {
    return departments.map((dept) => {
      const deptRecords = filteredRecords.filter((r) => r.department === dept);
      const present = deptRecords.filter((r) => r.status === "present").length;
      const late = deptRecords.filter((r) => r.status === "late").length;
      const absent = deptRecords.filter((r) => r.status === "absent").length;
      return {
        name: dept.length > 14 ? `${dept.slice(0, 12)}...` : dept,
        fullName: dept,
        present,
        late,
        absent,
      };
    });
  }, [departments, filteredRecords]);

  // Service trend (Thursdays and Sundays)
  const weeklyTrend = useMemo(() => {
    const trend = [];
    const endDateObj = new Date(endDate);
    let daysChecked = 0;
    let servicesFound = 0;
    const maxServices = 12;

    while (servicesFound < maxServices && daysChecked < 90) {
      const date = new Date(endDateObj);
      date.setDate(date.getDate() - daysChecked);
      const dayOfWeek = date.getDay();

      if (date < new Date(startDate)) break;

      if (dayOfWeek === 0 || dayOfWeek === 4) {
        const dateStr = date.toISOString().split("T")[0];
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const serviceRecords = filteredRecords.filter((r) => r.date === dateStr);

        trend.unshift({
          service: `${dayName} ${dateLabel}`,
          present: serviceRecords.filter((r) => r.status === "present").length,
          late: serviceRecords.filter((r) => r.status === "late").length,
          absent: serviceRecords.filter((r) => r.status === "absent").length,
          total: serviceRecords.length,
        });
        servicesFound++;
      }
      daysChecked++;
    }
    return trend;
  }, [startDate, endDate, filteredRecords]);

  // Filtered Table Records
  const searchedTableRecords = useMemo(() => {
    if (!tableSearch.trim()) return filteredRecords.slice(0, 50);
    const q = tableSearch.toLowerCase().trim();
    return filteredRecords.filter(
      (r) => r.workerName.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
    );
  }, [filteredRecords, tableSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm">
            {loading ? "Loading attendance analytics from database..." : "Analyze volunteer turnout rates, punctuality scores, and department metrics."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handlePrintPDF} className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs shadow-sm">
            <Printer className="w-4 h-4" /> Print / Export PDF
          </Button>

          <Button onClick={handleCSVExport} variant="outline" className="border-slate-300 text-slate-800 font-semibold gap-1.5 text-xs hover:bg-slate-100">
            <Download className="w-3.5 h-3.5 text-slate-600" /> Export CSV
          </Button>

          <Button onClick={handleJSONExport} variant="outline" className="border-slate-300 text-slate-800 font-semibold gap-1.5 text-xs hover:bg-slate-100">
            <FileJson className="w-3.5 h-3.5 text-slate-600" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Filter Parameters Card */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 pb-2 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" /> Report Parameters & Filters
            </CardTitle>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
              <Button onClick={() => handleApplyPreset("7days")} variant="outline" size="sm" className="h-7 text-[11px] px-2.5 bg-slate-50">
                7 Days
              </Button>
              <Button onClick={() => handleApplyPreset("30days")} variant="outline" size="sm" className="h-7 text-[11px] px-2.5 bg-slate-50">
                30 Days
              </Button>
              <Button onClick={() => handleApplyPreset("month")} variant="outline" size="sm" className="h-7 text-[11px] px-2.5 bg-slate-50">
                This Month
              </Button>
              <Button onClick={() => handleApplyPreset("all")} variant="outline" size="sm" className="h-7 text-[11px] px-2.5 bg-slate-50">
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Start Date</Label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Select start date..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">End Date</Label>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Filter Department</Label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Executive Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Attendance Logs</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalRecords}</p>
              <p className="text-[10px] text-slate-400 mt-1">Filtered service records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance Turnout</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{attendanceRate}%</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">Present & Late combined</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Punctuality Score</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{punctualityRate}%</p>
              <p className="text-[10px] text-slate-400 mt-1">{presentCount} On-Time arrivals</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Ministry</p>
              <p className="text-base font-extrabold text-slate-900 mt-1 line-clamp-1">{topDepartment.name}</p>
              <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 mt-1 font-bold">
                {topDepartment.rate}% Attendance Rate
              </Badge>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Attendance Status Distribution (Donut Chart) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" /> Attendance Status Distribution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Turnout ratio breakdown across present, late, and absent logs
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex flex-col items-center">
            {totalRecords === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-400 italic">
                No attendance logs found in selected date range.
              </div>
            ) : (
              <div className="w-full h-[260px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val} Volunteers`, "Count"]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", borderColor: "#cbd5e1" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900">{attendanceRate}%</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Turnout</span>
                </div>
              </div>
            )}

            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present ({presentCount})
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Late ({lateCount})
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent ({absentCount})
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department-wise Attendance Breakdown */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Ministry Department Comparison
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Compare present vs late vs absent counts per department
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            {departmentData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-400 italic">
                No department records available.
              </div>
            ) : (
              <div className="w-full h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} fontSize={10} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", borderColor: "#cbd5e1" }}
                      labelFormatter={(label) => {
                        const match = departmentData.find((d) => d.name === label);
                        return match?.fullName || label;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Attendance Trend */}
        <Card className="border-slate-200 shadow-sm bg-white lg:col-span-2">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Service Attendance & Turnout Trend
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Attendance turnout for Sunday Worship and Thursday Midweek services
              </CardDescription>
            </div>

            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
              Last {weeklyTrend.length} Services
            </Badge>
          </CardHeader>

          <CardContent className="p-4">
            {weeklyTrend.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-slate-400 italic">
                No service trends available in selected range.
              </div>
            ) : (
              <div className="w-full h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="service" angle={-30} textAnchor="end" interval={0} fontSize={10} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px", borderColor: "#cbd5e1" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="present" name="Present On-Time" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" name="Late Arrivals" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Attendance Records Table */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Detailed Attendance Logs</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Showing filtered logs from {startDate} to {endDate}
            </CardDescription>
          </div>

          <Input
            placeholder="Search by worker name or department..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="text-xs w-full sm:w-64 h-8"
          />
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Volunteer Worker</th>
                <th className="p-3">Department</th>
                <th className="p-3">Service Date</th>
                <th className="p-3 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchedTableRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No attendance records found matching your filters.
                  </td>
                </tr>
              ) : (
                searchedTableRecords.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{r.workerName}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[10px]">
                        {r.department}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{r.date}</td>
                    <td className="p-3 text-right">
                      <Badge
                        className={`text-[10px] uppercase font-bold ${
                          r.status === "present"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : r.status === "late"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
