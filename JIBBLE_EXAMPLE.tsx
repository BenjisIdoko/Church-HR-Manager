/**
 * EXAMPLE: Updated AttendanceOverview Component using Jibble Integration
 * 
 * This is a reference implementation showing how to update your existing
 * components to use the new Jibble integration with fallback to mock data.
 * 
 * To use this, replace your current AttendanceOverview.tsx with this code,
 * or merge the key changes with your existing implementation.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Filter, Eye, Download, ChevronUp, ChevronDown, RotateCcw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sortData, SortConfig, exportToCSV } from "../utils/tableUtils";
import { useAttendance } from "../utils/attendanceHooks"; // NEW: Import Jibble hook

export function AttendanceOverviewWithJibble() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // NEW: Use Jibble integration hook with fallback to mock data
  const attendance = useAttendance(dateFilter, dateFilter, {
    useJibble: true,
    fallbackToMock: true,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // If no records, calculate departments from available data
  const departments = Array.from(
    new Set((attendance.records || []).map((r: any) => r.department || "Unknown"))
  );

  // Apply filters
  const filteredRecords = (attendance.records || []).filter((record: any) => {
    const matchesDepartment = departmentFilter === "all" || record.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesSearch =
      (record.workerName || record.employeeName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (record.workerId || record.employeeId || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesDepartment && matchesStatus && matchesSearch;
  });

  // Apply sorting
  const sortedRecords = sortData(filteredRecords, sortConfig);

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else if (sortConfig.direction === "desc") {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const handleExport = () => {
    exportToCSV(
      sortedRecords,
      `attendance_${dateFilter}`,
      ["workerId", "workerName", "department", "status", "totalHours"]
    );
  };

  const handleReset = () => {
    setSearchQuery("");
    setDateFilter(new Date().toISOString().split('T')[0]);
    setDepartmentFilter("all");
    setStatusFilter("all");
    setSortConfig(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-600">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-600">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-600">Absent</Badge>;
      case "half-day":
        return <Badge className="bg-blue-600">Half-day</Badge>;
      default:
        return <Badge className="bg-gray-600">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1>Attendance Overview</h1>
          <p className="text-muted-foreground">
            View and filter worker attendance records
          </p>
          {/* NEW: Show data source indicator */}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={
                attendance.source === "jibble"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }
            >
              {attendance.source === "jibble" ? "📊 Jibble" : "📋 Mock Data"}
            </Badge>
            {attendance.lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated: {attendance.lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* NEW: Show error message if any */}
      {attendance.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Connection Notice</p>
            <p className="text-sm text-yellow-800">{attendance.error}</p>
            <p className="text-xs text-yellow-700 mt-1">Showing fallback data while reconnecting...</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records ({sortedRecords.length} of {attendance.records.length})
          </CardTitle>
          <CardDescription>Filter, search, and sort attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search by name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {attendance.loading && (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading attendance data...</div>
            </div>
          )}

          {/* Attendance Table */}
          {!attendance.loading && (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted">
                      Worker ID {getSortIcon("workerId")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted">
                      Name {getSortIcon("workerName")}
                    </TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted">
                      Status {getSortIcon("status")}
                    </TableHead>
                    {/* NEW: Show hours if available from Jibble */}
                    {attendance.source === "jibble" && (
                      <TableHead>Hours Worked</TableHead>
                    )}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRecords.map((record: any) => (
                      <TableRow key={record.id || `${record.workerId}-${record.date}`}>
                        <TableCell className="font-medium">
                          {record.workerId || record.employeeId}
                        </TableCell>
                        <TableCell>{record.workerName || record.employeeName}</TableCell>
                        <TableCell>{record.department || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        {attendance.source === "jibble" && (
                          <TableCell>{record.totalHours?.toFixed(2) || "N/A"} hrs</TableCell>
                        )}
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/attendance/${record.workerId || record.employeeId}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>Showing {sortedRecords.length} of {attendance.records.length} records</div>
            {sortConfig && <div>Sorted by: {sortConfig.key} ({sortConfig.direction})</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
