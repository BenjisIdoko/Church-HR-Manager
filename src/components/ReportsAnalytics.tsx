import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, Calendar, BarChart3, PieChart as PieChartIcon, FileJson } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { mockAttendanceRecords } from "../utils/mockData";
import { exportToCSV } from "../utils/tableUtils";

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)'];

export function ReportsAnalytics() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const departments = Array.from(new Set(mockAttendanceRecords.map((r) => r.department)));

  // Filter records by date range and department
  const filteredRecords = mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const matchesDate = recordDate >= start && recordDate <= end;
    const matchesDepartment =
      departmentFilter === "all" || record.department === departmentFilter;
    return matchesDate && matchesDepartment;
  });

  // Attendance rate by status
  const statusData = [
    {
      name: "Present",
      value: filteredRecords.filter((r) => r.status === "present").length,
    },
    {
      name: "Late",
      value: filteredRecords.filter((r) => r.status === "late").length,
    },
    {
      name: "Absent",
      value: filteredRecords.filter((r) => r.status === "absent").length,
    },
  ];

  // Department-wise attendance
  const departmentData = departments.map((dept) => {
    const deptRecords = filteredRecords.filter((r) => r.department === dept);
    const present = deptRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const absent = deptRecords.filter((r) => r.status === "absent").length;
    return {
      name: dept,
      present,
      absent,
    };
  });

  // Service trend (Thursdays and Sundays only)
  const weeklyTrend = [];
  const endDateObj = new Date(endDate);
  let daysChecked = 0;
  let servicesFound = 0;
  const maxServices = 12;
  
  while (servicesFound < maxServices && daysChecked < 90) {
    const date = new Date(endDateObj);
    date.setDate(date.getDate() - daysChecked);
    const dayOfWeek = date.getDay();
    
    if (date < new Date(startDate)) break;
    
    // Only include Sundays (0) and Thursdays (4)
    if (dayOfWeek === 0 || dayOfWeek === 4) {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const serviceRecords = filteredRecords.filter((r) => r.date === dateStr);
      
      weeklyTrend.unshift({
        week: `${dayName} ${dateLabel}`,
        present: serviceRecords.filter((r) => r.status === "present").length,
        late: serviceRecords.filter((r) => r.status === "late").length,
        absent: serviceRecords.filter((r) => r.status === "absent").length,
      });
      servicesFound++;
    }
    daysChecked++;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and analyze attendance reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>
            Select date range and filters for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
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
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={() => exportToCSV(filteredRecords, `attendance_report_${startDate}_to_${endDate}`)}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
            <Button variant="outline">
              <FileJson className="h-4 w-4 mr-2" />
              Export to JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Attendance Status Distribution
            </CardTitle>
            <CardDescription>
              Overall attendance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Attendance</CardTitle>
            <CardDescription>
              Compare attendance across ministries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={11}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="present" 
                  fill="hsl(142, 76%, 36%)" 
                  name="Present"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="absent" 
                  fill="hsl(0, 84%, 60%)" 
                  name="Absent"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Attendance Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Service Attendance Trend
            </CardTitle>
            <CardDescription>
              Attendance patterns for Thursday and Sunday services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="present" 
                  fill="hsl(142, 76%, 36%)"
                  name="Present"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="late" 
                  fill="hsl(45, 93%, 47%)"
                  name="Late"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="absent" 
                  fill="hsl(0, 84%, 60%)"
                  name="Absent"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
