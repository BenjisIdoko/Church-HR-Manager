import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { AttendanceRecord, Worker } from "../utils/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { exportToCSV } from "../utils/tableUtils";

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
    .slice(0, 30);

  if (!worker) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Worker not found</p>
        <Button className="mt-4" onClick={() => navigate("/attendance")}>
          Back to Attendance
        </Button>
      </div>
    );
  }

  const totalDays = workerRecords.length;
  const presentDays = workerRecords.filter((r) => r.status === "present").length;
  const lateDays = workerRecords.filter((r) => r.status === "late").length;
  const absentDays = workerRecords.filter((r) => r.status === "absent").length;

  const summaryData = [
    { name: "Present", value: presentDays, fill: "hsl(142, 76%, 36%)" },
    { name: "Late", value: lateDays, fill: "hsl(45, 93%, 47%)" },
    { name: "Absent", value: absentDays, fill: "hsl(0, 84%, 60%)" },
  ];

  const handleExport = () => {
    const exportData = workerRecords.map((record) => ({
      "Worker ID": record.workerId,
      "Date": new Date(record.date).toLocaleDateString(),
      "Day": new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
      "Status": record.status.charAt(0).toUpperCase() + record.status.slice(1),
    }));
    
    exportToCSV(exportData, `${worker.name}_attendance`);
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/attendance")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{worker.name}</h1>
            <p className="text-sm text-muted-foreground">
              {worker.id} / {worker.role}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} className="bg-cyan-500 hover:bg-cyan-600">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{lateDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absentDays}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>
            Overview of attendance status distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {loading ? "Loading attendance history..." : `All attendance records for ${worker.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Worker ID</TableHead>
                  <TableHead className="font-semibold">Day of Service</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  workerRecords.map((record) => {
                    const date = new Date(record.date);
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.workerId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{dayOfWeek}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
