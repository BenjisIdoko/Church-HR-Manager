import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Users, UserCheck, UserX, Upload, BarChart3 } from "lucide-react";
import { getAttendanceStats, getAttendanceTrend } from "../utils/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const navigate = useNavigate();
  const stats = getAttendanceStats();
  const trendData = getAttendanceTrend();
  const lastSync = new Date().toLocaleString();

  const overviewCards = [
    {
      title: "Total Workers",
      value: 248,
      subtitle: "Across 7 departments",
      color: "from-[#fce4d6] to-[#fdf1eb]",
      iconBg: "bg-white/80",
      icon: Users,
      iconClass: "text-[#d97741]",
    },
    {
      title: "Present Today",
      value: 224,
      subtitle: "90.3% attendance rate",
      color: "from-[#d9e8f6] to-[#eaf4fb]",
      iconBg: "bg-white/80",
      icon: UserCheck,
      iconClass: "text-[#3e8bba]",
    },
    {
      title: "Late Today",
      value: 28,
      subtitle: "11% of present",
      color: "from-[#f0d9f6] to-[#f8eafb]",
      iconBg: "bg-white/80",
      icon: Upload,
      iconClass: "text-[#9333ea]",
    },
    {
      title: "Absent Today",
      value: 24,
      subtitle: "Follow-up recommended",
      color: "from-[#d9f0e6] to-[#eaf8f1]",
      iconBg: "bg-white/80",
      icon: UserX,
      iconClass: "text-[#16a34a]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A modern view of church HR attendance, schedules, and team activity.
          </p>
        </div>
        <Button onClick={() => navigate("/import")} className="bg-[#ea6a47] hover:bg-[#d85a37] text-white shadow-md hover:shadow-lg transition-all duration-200"> 
          <Upload className="h-4 w-4 mr-2" />
          Import Attendance Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={`overflow-hidden border-0 bg-gradient-to-br ${card.color} shadow-md hover:shadow-lg transition-shadow duration-200`}>
              <CardContent className="space-y-4 text-slate-950 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                      {card.title}
                    </p>
                    <p className="mt-4 text-4xl font-semibold">{card.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${card.iconBg} ${card.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm text-slate-600">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
        <div className="space-y-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Attendance Trend</CardTitle>
              <CardDescription>
                Last 7 days · all services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData.slice(-7)} margin={{ top: 16, right: 24, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, borderColor: '#E2E8F0' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12 }} />
                    <Bar dataKey="present" fill="#3e8bba" name="Present" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 rounded-[32px] border-0 bg-[#1f2756]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-slate-300">All services combined</CardDescription>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Connected
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-8 py-8">
              <div className="space-y-4">
                <p className="font-medium text-white">Attendance synced from Jibble</p>
                <p className="text-sm leading-6 text-slate-300">
                  224 workers checked in across the 1st Service. 28 marked late, 24 absent.
                </p>
                <div className="rounded-3xl bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
                    <span>Last sync</span>
                    <span>2 minutes ago</span>
                  </div>
                </div>
              </div>
              <Button className="w-full justify-center bg-[#ea6a47] hover:bg-[#d85a37] text-white shadow-md hover:shadow-lg transition-all duration-200">
                Sync now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
