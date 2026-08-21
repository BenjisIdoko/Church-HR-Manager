import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Calendar,
  Filter,
  Eye,
  Download,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  UserCheck,
} from "lucide-react";
import { AttendanceRecord } from "../types/models";
import { useNavigate } from "react-router-dom";
import { sortData, SortConfig, exportToCSV } from "../utils/tableUtils";
import { DatePicker } from "./ui/date-picker";
import { toast } from "sonner";

interface AttendanceOverviewProps {
  attendanceRecords: AttendanceRecord[];
  loading?: boolean;
}

export function AttendanceOverview({ attendanceRecords, loading = false }: AttendanceOverviewProps) {
  const navigate = useNavigate();
  const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];

  const latestDate = useMemo(
    () => safeRecords.reduce((latest, record) => (record.date > latest ? record.date : latest), ""),
    [safeRecords]
  );

  const [dateFilter, setDateFilter] = useState(latestDate || new Date().toISOString().split("T")[0]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  useEffect(() => {
    if (latestDate) {
      setDateFilter((current) => (safeRecords.some((record) => record.date === current) ? current : latestDate));
    }
  }, [safeRecords, latestDate]);

  const departments = useMemo(
    () => Array.from(new Set(safeRecords.map((r) => r.department))).filter(Boolean).sort(),
    [safeRecords]
  );

  // Apply filters
  const filteredRecords = useMemo(() => {
    return safeRecords.filter((record) => {
      const matchesDate = record.date === dateFilter;
      const matchesDepartment = departmentFilter === "all" || record.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesSearch =
        record.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.workerId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDate && matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [safeRecords, dateFilter, departmentFilter, statusFilter, searchQuery]);

  // Apply sorting
  const sortedRecords = useMemo(() => sortData(filteredRecords, sortConfig), [filteredRecords, sortConfig]);

  // Summary Metrics for currently selected date filter
  const dateRecords = useMemo(
    () => safeRecords.filter((r) => r.date === dateFilter),
    [safeRecords, dateFilter]
  );
  const totalDateExpected = dateRecords.length;
  const datePresent = dateRecords.filter((r) => r.status === "present").length;
  const dateLate = dateRecords.filter((r) => r.status === "late").length;
  const dateAbsent = dateRecords.filter((r) => r.status === "absent").length;

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 inline ml-1 text-indigo-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 inline ml-1 text-indigo-600" />
    );
  };

  const handleExport = () => {
    if (sortedRecords.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }
    exportToCSV(sortedRecords, `attendance_${dateFilter}`, ["workerId", "workerName", "department", "status"]);
    toast.success("Attendance records exported successfully!");
  };

  const handleReset = () => {
    setSearchQuery("");
    setDateFilter(latestDate || new Date().toISOString().split("T")[0]);
    setDepartmentFilter("all");
    setStatusFilter("all");
    setSortConfig(null);
    toast.info("Attendance filters reset.");
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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Worker Attendance Overview</h1>
          <p className="text-slate-500 text-sm">
            {loading ? "Loading attendance records from database..." : "View, filter, and track volunteer attendance logs for Thursday & Sunday worship services."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} className="border-slate-300 text-slate-700 text-xs font-semibold gap-1.5 hover:bg-slate-100">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </Button>
          <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Executive Daily Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Expected</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalDateExpected}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{dateFilter}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Present On-Time</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{datePresent}</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">
                {totalDateExpected > 0 ? Math.round((datePresent / totalDateExpected) * 100) : 0}% Turnout
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
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{dateLate}</p>
              <p className="text-[10px] text-amber-700 font-medium mt-1">
                {totalDateExpected > 0 ? Math.round((dateLate / totalDateExpected) * 100) : 0}% Late Rate
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
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Absentees</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{dateAbsent}</p>
              <p className="text-[10px] text-rose-700 font-medium mt-1">
                {totalDateExpected > 0 ? Math.round((dateAbsent / totalDateExpected) * 100) : 0}% Absent Rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Parameters Card */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 pb-2 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" /> Filter & Search Attendance Logs
            </span>
            <Badge variant="outline" className="text-xs bg-slate-50">
              Showing {sortedRecords.length} of {safeRecords.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search by worker name or ID (e.g. Samuel, W001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Service Date</label>
              <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Filter by date..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Department</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Attendance Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present (On-Time)</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th
                  className="p-3 cursor-pointer hover:bg-slate-100/80 transition-colors w-24"
                  onClick={() => handleSort("workerId")}
                >
                  Worker ID {getSortIcon("workerId")}
                </th>
                <th
                  className="p-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  onClick={() => handleSort("workerName")}
                >
                  Volunteer Name {getSortIcon("workerName")}
                </th>
                <th
                  className="p-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  onClick={() => handleSort("department")}
                >
                  Department {getSortIcon("department")}
                </th>
                <th
                  className="p-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status {getSortIcon("status")}
                </th>
                <th
                  className="p-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  Service Date {getSortIcon("date")}
                </th>
                <th className="p-3 text-right">View History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No attendance records found matching selected date or filters.
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record) => {
                  const dateObj = new Date(record.date);
                  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                  return (
                    <tr
                      key={record.id}
                      onClick={() => navigate(`/attendance/${record.workerId}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-mono font-bold text-indigo-700">{record.workerId}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {record.workerName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{record.workerName}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[10px]">
                          {record.department}
                        </Badge>
                      </td>
                      <td className="p-3">{getStatusBadge(record.status)}</td>
                      <td className="p-3">
                        <span className="font-mono text-slate-800">{record.date}</span>{" "}
                        <span className="text-[10px] text-slate-400 font-semibold uppercase ml-1">({dayName})</span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/attendance/${record.workerId}`);
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Attendance History"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>Showing {sortedRecords.length} of {attendanceRecords.length} records</span>
          {sortConfig && (
            <span className="font-semibold text-slate-700">
              Sorted by: <span className="capitalize text-indigo-600">{sortConfig.key}</span> ({sortConfig.direction})
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
