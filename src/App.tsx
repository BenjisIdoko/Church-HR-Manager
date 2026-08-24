import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboard } from "./components/AdminDashboard";
import { MemberDirectory } from "./components/MemberDirectory";
import { MemberDashboard } from "./components/MemberDashboard";
import { ClockInScreen } from "./components/ClockInScreen";
import { ClockInManagement } from "./components/ClockInManagement";
import { DataImportScreen } from "./components/DataImportScreen";
import { AttendanceOverview } from "./components/AttendanceOverview";
import { AttendanceDetailView } from "./components/AttendanceDetailView";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { Settings } from "./components/Settings";
import { VisitorManagement } from "./components/VisitorManagement";
import { CellGroupsManagement } from "./components/CellGroupsManagement";
import { AssetManagementScreen } from "./components/AssetManagementScreen";
import { DiscipleshipTracker } from "./components/DiscipleshipTracker";
import { ServicePlanner } from "./components/ServicePlanner";
import { MasterCalendar } from "./components/MasterCalendar";
import { KioskCheckIn } from "./components/KioskCheckIn";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import { useWorkers } from "./hooks/useWorkers";
import { queryClient } from "./lib/queryClient";
import { Worker, User } from "./types/models";

interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

export default function App() {
  const { user, loadingSession, login, logout } = useAuth();
  const { workers, attendanceRecords, lastSync, isLoading: loadingData, updateWorker, renameDepartment, refreshAll } = useWorkers(Boolean(user));

  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryEntry[]>([]);
  const [manualDepartments, setManualDepartments] = useState<string[]>([]);

  const departments = Array.from(
    new Set([
      ...manualDepartments,
      ...workers.map((w) => w?.department).filter((d): d is string => Boolean(d)),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const handleLogin = (loggedUser: User) => {
    if (loggedUser) {
      localStorage.setItem("church_hr_user", JSON.stringify(loggedUser));
      queryClient.setQueryData(["auth", "me"], loggedUser);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleUpdateWorker = async (updatedWorker: Worker) => {
    const previousWorker = workers.find((w) => w.id === updatedWorker.id);
    const persistedWorker = await updateWorker(updatedWorker);

    if (previousWorker) {
      const changes = [
        previousWorker.name !== persistedWorker.name ? "name" : null,
        previousWorker.email !== persistedWorker.email ? "email" : null,
        previousWorker.phone !== persistedWorker.phone ? "phone" : null,
        previousWorker.department !== persistedWorker.department ? "department" : null,
        previousWorker.role !== persistedWorker.role ? "role" : null,
        previousWorker.status !== persistedWorker.status ? "status" : null,
      ]
        .filter(Boolean)
        .join(", ");

      if (changes) {
        setUpdateHistory((prev) => [
          {
            workerId: persistedWorker.id,
            workerName: persistedWorker.name,
            timestamp: new Date().toLocaleString(),
            changes,
          },
          ...prev,
        ]);
      }
    }
  };

  const handleAddDepartment = (dept: string) => {
    const norm = dept.trim();
    if (norm) setManualDepartments((prev) => Array.from(new Set([...prev, norm])));
  };

  const handleEditDepartment = async (oldDept: string, newDept: string) => {
    await renameDepartment({ oldDept, newDept });
    setManualDepartments((prev) =>
      Array.from(new Set(prev.map((d) => (d.toLowerCase() === oldDept.toLowerCase() ? newDept : d))))
    );
  };

  const handleRemoveDepartment = (dept: string) => {
    setManualDepartments((prev) => prev.filter((d) => d.toLowerCase() !== dept.toLowerCase()));
  };

  const handleUpdateProfile = async (updated: {
    name: string;
    email: string;
    phone: string;
    department?: string;
    departments?: string[];
    profileImage?: string;
  }) => {
    if (!user) return;
    if (user.role === "member" && user.workerId) {
      const worker = workers.find((w) => w.id === user.workerId);
      if (worker) {
        await handleUpdateWorker({
          ...worker,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          department: updated.department ?? worker.department,
          departments: updated.departments ?? worker.departments,
          profileImage: updated.profileImage ?? worker.profileImage,
        });
      }
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "superadmin"
                      ? "/dashboard"
                      : user.role === "manager"
                      ? "/workers"
                      : "/member"
                  }
                  replace
                />
              ) : (
                <LoginForm onLogin={handleLogin} workers={workers} />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <AdminDashboard
                  workers={workers}
                  attendanceRecords={attendanceRecords}
                  lastSync={lastSync}
                  loading={loadingData}
                  onRefresh={refreshAll}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/import"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <DataImportScreen onImportComplete={refreshAll} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workers"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <MemberDirectory
                  workers={workers}
                  departments={departments}
                  updateHistory={updateHistory}
                  onUpdateWorker={handleUpdateWorker}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <ServicePlanner workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <MasterCalendar workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kiosk"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager", "member"]} workers={workers} onLogout={handleLogout}>
                <KioskCheckIn user={user} workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitors"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <VisitorManagement workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <CellGroupsManagement workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <AssetManagementScreen workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discipleship"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin", "manager"]} workers={workers} onLogout={handleLogout}>
                <DiscipleshipTracker workers={workers} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <AttendanceOverview attendanceRecords={attendanceRecords} loading={loadingData} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/:workerId"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <AttendanceDetailView workers={workers} attendanceRecords={attendanceRecords} loading={loadingData} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <ReportsAnalytics attendanceRecords={attendanceRecords} loading={loadingData} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <Settings
                  departments={departments}
                  workers={workers}
                  onAddDepartment={handleAddDepartment}
                  onEditDepartment={handleEditDepartment}
                  onRemoveDepartment={handleRemoveDepartment}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clock-in-portal"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["superadmin"]} workers={workers} onLogout={handleLogout}>
                <ClockInManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/member"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["member"]} workers={workers} onLogout={handleLogout}>
                <MemberDashboard
                  user={user!}
                  worker={workers.find((w) => w.id === user?.workerId)}
                  departments={departments}
                  onUpdateProfile={handleUpdateProfile}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clock-in"
            element={
              <ProtectedRoute user={user} loadingSession={loadingSession} allow={["member"]} workers={workers} onLogout={handleLogout}>
                <ClockInScreen user={user!} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </ErrorBoundary>
  );
}
