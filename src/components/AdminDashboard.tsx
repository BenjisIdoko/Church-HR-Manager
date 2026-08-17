import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Users,
  UserCheck,
  UserX,
  Upload,
  Heart,
  TrendingUp,
  QrCode,
  HeartHandshake,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { AttendanceRecord, Worker } from "../types/models";

interface AdminDashboardProps {
  workers: Worker[];
  attendanceRecords: AttendanceRecord[];
  lastSync: string | null;
  loading?: boolean;
  onRefresh: () => void | Promise<void>;
}

function getLatestAttendanceDate(attendanceRecords: AttendanceRecord[]) {
  return attendanceRecords.reduce((latest, record) => {
    return record.date > latest ? record.date : latest;
  }, "");
}

export function AdminDashboard({
  workers,
  attendanceRecords,
  lastSync,
  loading = false,
  onRefresh,
}: AdminDashboardProps) {
  const navigate = useNavigate();
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAttendanceRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];

  const activeWorkers = safeWorkers.filter((worker) => worker.status === "active");
  const latestDate = getLatestAttendanceDate(safeAttendanceRecords);
  const latestRecords = latestDate ? safeAttendanceRecords.filter((record) => record.date === latestDate) : [];
  const presentToday = latestRecords.filter((record) => record.status === "present").length;
  const lateToday = latestRecords.filter((record) => record.status === "late").length;
  const absentToday = latestRecords.filter((record) => record.status === "absent").length;
  const attendanceRate =
    activeWorkers.length > 0 ? Math.round(((presentToday + lateToday) / activeWorkers.length) * 100) : 0;
  const departmentCount = new Set(safeWorkers.map((worker) => worker.department)).size;

  const trendData = Array.from(new Set(safeAttendanceRecords.map((record) => record.date)))
    .sort((a, b) => a.localeCompare(b))
    .slice(-7)
    .map((date) => {
      const recordsForDate = safeAttendanceRecords.filter((record) => record.date === date);
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        present: recordsForDate.filter((record) => record.status === "present" || record.status === "late").length,
        absent: recordsForDate.filter((record) => record.status === "absent").length,
      };
    });

  const overviewCards = [
    {
      title: "Volunteers",
      value: activeWorkers.length,
      trend: "Active Team",
      subtitle: `Across ${departmentCount} ministry teams`,
      badgeColor: "bg-[#fbeee8] text-[#9a3412]",
      iconBg: "bg-[#c85a32] text-white shadow-xs",
      icon: Users,
    },
    {
      title: "Present Today",
      value: presentToday,
      trend: `${attendanceRate}% rate`,
      subtitle: `${presentToday + lateToday} checked in for service`,
      badgeColor: "bg-[#ecfdf5] text-[#047857]",
      iconBg: "bg-[#2e7d32] text-white shadow-xs",
      icon: UserCheck,
    },
    {
      title: "Monitored Check-Ins",
      value: lateToday,
      trend: "Gentle Reminder",
      subtitle: latestDate ? `Service: ${new Date(latestDate).toLocaleDateString()}` : "No synced records",
      badgeColor: "bg-[#fffbeb] text-[#b45309]",
      iconBg: "bg-[#d97706] text-white shadow-xs",
      icon: Clock,
    },
    {
      title: "Care & Follow-Up",
      value: absentToday,
      trend: "Pastoral Action",
      subtitle: "Requires team outreach & grace",
      badgeColor: "bg-[#fef2f2] text-[#b91c1c]",
      iconBg: "bg-[#dc2626] text-white shadow-xs",
      icon: UserX,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#e7e2d8] p-6 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">Ministry & Care Overview</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fbeee8] px-3 py-1 text-xs font-semibold text-[#9a3412]">
              <Heart className="h-3.5 w-3.5 fill-[#c85a32] text-[#c85a32]" /> Active Fellowship
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716c]">
            Shepherding our servant leaders, coordinating service roles, and caring for team well-being.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/kiosk")}
            variant="outline"
            className="border-[#e7e2d8] text-[#1c1917] hover:bg-[#f4f1ea] font-medium text-xs rounded-xl"
          >
            <QrCode className="h-4 w-4 mr-1.5 text-[#c85a32]" />
            Launch Kiosk
          </Button>

          <Button
            onClick={() => navigate("/import")}
            className="bg-[#c85a32] hover:bg-[#b54f2a] text-white font-medium text-xs rounded-xl shadow-xs transition-all"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import Roster CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="border border-[#e7e2d8] bg-white shadow-2xs hover:shadow-xs transition-all rounded-2xl overflow-hidden"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78716c]">
                    {card.title}
                  </span>
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight text-[#1c1917]">
                    {card.value}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${card.badgeColor}`}>
                    <TrendingUp className="h-3 w-3" />
                    {card.trend}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#78716c] font-medium">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart & Live Status Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Trend Chart */}
        <Card className="lg:col-span-2 border border-[#e7e2d8] bg-white shadow-2xs rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-[#1c1917]">
                Attendance & Care History
              </CardTitle>
              <CardDescription className="text-xs text-[#78716c]">
                Weekly participation trends across services and cell groups
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#c85a32]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c85a32]" /> Present
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#dc2626]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" /> Follow-up Needed
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c85a32" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#c85a32" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E2D8" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#78716c", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#78716c", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e7e2d8",
                      borderRadius: "12px",
                      color: "#1c1917",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#c85a32"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAbsent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sync & Activity Status Card */}
        <Card className="border border-[#e7e2d8] bg-white shadow-2xs rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-[#1c1917]">
                  Database & System Care
                </CardTitle>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A7C59] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4A7C59]"></span>
                </span>
              </div>
              <CardDescription className="text-xs text-[#78716c]">
                Live Cloud Sync Active
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-[#e7e2d8] bg-[#fbf9f5] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716c] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#4A7C59]" /> Connection
                  </span>
                  <span className="font-semibold text-[#1c1917]">Online & Healthy</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716c]">Last Record Refresh</span>
                  <span className="font-medium text-[#1c1917]">
                    {lastSync ? new Date(lastSync).toLocaleTimeString() : "Synchronized"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#1c1917]">Daily Ministry Summary</p>
                <p className="text-xs text-[#78716c] leading-relaxed">
                  {loading
                    ? "Refreshing live operational records..."
                    : `${presentToday + lateToday} servant leaders signed in today. ${absentToday} care reminders active.`}
                </p>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              onClick={() => void onRefresh()}
              disabled={loading}
              className="w-full bg-[#1c1917] hover:bg-[#292524] text-white text-xs font-semibold rounded-xl py-2.5 transition-all shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Sync Database Now"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}


