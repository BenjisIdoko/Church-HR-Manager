import { useEffect, useState } from "react";
import { GraduationCap, CheckCircle2, Clock, BookOpen, Search, UserCheck, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { DiscipleshipCourse, MemberCourseProgress, Worker } from "../types/models";
import { fetchDiscipleshipCourses, fetchMemberCourseProgress, updateMemberCourseProgress } from "../utils/api";
import { toast } from "sonner";
import { SearchableWorkerSelect } from "./SearchableWorkerSelect";

interface DiscipleshipTrackerProps {
  workers: Worker[];
}

export function DiscipleshipTracker({ workers }: DiscipleshipTrackerProps) {
  const [courses, setCourses] = useState<DiscipleshipCourse[]>([]);
  const [progressList, setProgressList] = useState<MemberCourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  // Enroll modal state
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollWorkerId, setEnrollWorkerId] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrollStatus, setEnrollStatus] = useState<MemberCourseProgress["status"]>("in-progress");

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, progressData] = await Promise.all([
        fetchDiscipleshipCourses(),
        fetchMemberCourseProgress(),
      ]);
      setCourses(coursesData);
      setProgressList(progressData);
    } catch {
      toast.error("Failed to load discipleship data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleEnrollOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollWorkerId || !enrollCourseId) {
      toast.error("Select worker and course");
      return;
    }

    // Resolve worker ID (whether numeric ID or external_id string e.g. "W001")
    let targetWorkerDbId: number | null = Number(enrollWorkerId);
    if (isNaN(targetWorkerDbId)) {
      const found = workers.find(
        (w) => w.id === enrollWorkerId || (w as any).external_id === enrollWorkerId
      );
      if (found) {
        // If DB worker ID exists on found object
        targetWorkerDbId = Number((found as any).db_id || (found as any).dbId || found.id);
      }
    }

    if (!targetWorkerDbId || isNaN(targetWorkerDbId)) {
      toast.error("Invalid worker selection. Please re-select a worker.");
      return;
    }

    try {
      await updateMemberCourseProgress(
        targetWorkerDbId,
        Number(enrollCourseId),
        enrollStatus,
        enrollStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined
      );
      toast.success("Discipleship progress updated");
      setIsEnrollOpen(false);
      void loadData();
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const handleQuickStatusToggle = async (workerId: number, courseId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "in-progress" : "completed";
    try {
      await updateMemberCourseProgress(
        workerId,
        courseId,
        nextStatus,
        nextStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined
      );
      toast.success(`Marked as ${nextStatus}`);
      void loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalCompletions = progressList.filter((p) => p.status === "completed").length;
  const inProgressCount = progressList.filter((p) => p.status === "in-progress" || p.status === "enrolled").length;

  const filteredProgress = progressList.filter((p) => {
    const workerName = p.worker_name || (p as any).workerName || "";
    const courseTitle = p.course_title || (p as any).courseTitle || "";
    const courseIdVal = p.course_id ?? (p as any).courseId;

    const matchesSearch =
      (workerName && workerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (courseTitle && courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourse = selectedCourseFilter === "all" || String(courseIdVal) === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discipleship & Worker LMS</h1>
          <p className="text-slate-500 text-sm">
            Track believer foundation classes, water baptism, and leadership academy course completions.
          </p>
        </div>
        <Button onClick={() => setIsEnrollOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Enroll / Update Progress
        </Button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {courses.map((course) => {
          const completedInCourse = progressList.filter(
            (p) => (p.course_id === course.id || (p as any).courseId === course.id) && p.status === "completed"
          ).length;
          return (
            <Card key={course.id} className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                    {course.total_modules} Modules
                  </Badge>
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">{course.title}</CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Graduates:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {completedInCourse} Workers
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Active Course Enrollments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressCount} Enrolled Workers</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Total Graduation Certificates Issued</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalCompletions} Completed Courses</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search worker name or course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={selectedCourseFilter}
          onChange={(e) => setSelectedCourseFilter(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="all">All Courses Catalog</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading progress matrix...</div>
        ) : filteredProgress.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No discipleship records matching search filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Church Worker</th>
                  <th className="p-4">Discipleship Course</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Completion Date</th>
                  <th className="p-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProgress.map((item) => (
                  <tr key={`${item.worker_id}-${item.course_id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{item.worker_name}</td>
                    <td className="p-4 text-xs font-medium text-slate-700">{item.course_title}</td>
                    <td className="p-4">
                      <Badge
                        className={`text-xs capitalize ${
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : item.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {item.status === "completed" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{item.completion_date || "In Progress"}</td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant={item.status === "completed" ? "outline" : "default"}
                        onClick={() => handleQuickStatusToggle(item.worker_id, item.course_id, item.status)}
                        className={`text-xs h-8 ${item.status !== "completed" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      >
                        {item.status === "completed" ? "Mark Incomplete" : "Mark Completed"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Enroll / Update Progress */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Worker or Update Course Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnrollOrUpdate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Church Worker *</label>
              <SearchableWorkerSelect
                workers={workers}
                value={enrollWorkerId}
                onChange={(val) => setEnrollWorkerId(val)}
                placeholder="Search & select volunteer..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Discipleship Course *</label>
              <select
                value={enrollCourseId}
                onChange={(e) => setEnrollCourseId(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                required
              >
                <option value="">Select Course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.total_modules} Modules)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Course Progress Status</label>
              <select
                value={enrollStatus}
                onChange={(e) => setEnrollStatus(e.target.value as any)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="enrolled">Enrolled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Graduated / Completed</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEnrollOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">Save Progress</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
