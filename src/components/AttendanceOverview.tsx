import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Filter, Eye, Download, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { mockAttendanceRecords } from "../utils/mockData";
import { useNavigate } from "react-router-dom";
import { filterData, sortData, SortConfig, exportToCSV } from "../utils/tableUtils";

export function AttendanceOverview() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const departments = Array.from(new Set(mockAttendanceRecords.map((r) => r.department)));

  // Apply filters
  const filteredRecords = mockAttendanceRecords.filter((record) => {
    const matchesDate = record.date === dateFilter;
    const matchesDepartment = departmentFilter === "all" || record.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesSearch =
      record.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.workerId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDate && matchesDepartment && matchesStatus && matchesSearch;
  });

  // Apply sorting
  const sortedRecords = sortData(filteredRecords, sortConfig);

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      // Toggle sort direction
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else if (sortConfig.direction === "desc") {
        setSortConfig(null);
      }
    } else {
      // New sort column
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
      ["workerId", "workerName", "department", "status"]
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
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Attendance Overview</h1>
          <p className="text-muted-foreground">
            View and filter worker attendance records
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records ({sortedRecords.length} of {mockAttendanceRecords.length})</CardTitle>
          <CardDescription>
            Filter, search, and sort attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by worker name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
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

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("workerId")}>
                    Worker ID {getSortIcon("workerId")}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("workerName")}>
                    Name {getSortIcon("workerName")}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("department")}>
                    Department {getSortIcon("department")}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("status")}>
                    Status {getSortIcon("status")}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("date")}>
                    Date {getSortIcon("date")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No attendance records found for selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRecords.map((record) => (
                    <TableRow 
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/attendance/${record.workerId}`)}
                    >
                      <TableCell className="font-medium">{record.workerId}</TableCell>
                      <TableCell>{record.workerName}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/attendance/${record.workerId}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>Showing {sortedRecords.length} of {mockAttendanceRecords.length} records</div>
            {sortConfig && (
              <div>Sorted by: {sortConfig.key} ({sortConfig.direction})</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
