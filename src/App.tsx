import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { AppLayout } from "./components/AppLayout";
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
import { Alert, AlertDescription } from "./components/ui/alert";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { fetchAttendance, fetchKpis, fetchWorkers, renameDepartment, saveWorker } from "./utils/api";
import { AttendanceRecord, User, Worker } from "./types/models";

interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

const DEFAULT_ADMIN_USER: User = {
  id: "u-admin",
  name: "Pastor David",
  email: "admin@churchhr.org",
  role: "superadmin",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("church_hr_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback if parsing fails
      }
    }
    return DEFAULT_ADMIN_USER;
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryEntry[]>([]);
  const [manualDepartments, setManualDepartments] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("church_hr_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("church_hr_user");
    }
  }, [currentUser]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set([
          ...(Array.isArray(manualDepartments) ? manualDepartments : []),
          ...(Array.isArray(workers) ? workers.map((worker) => worker?.department).filter((d): d is string => Boolean(d)) : []),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [manualDepartments, workers],
  );

  const loadAppData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);

    try {
      const [workersData, attendanceData, kpiData] = await Promise.all([
        fetchWorkers(),
        fetchAttendance(),
        fetchKpis(),
      ]);

      const safeWorkers = Array.isArray(workersData) ? workersData : [];
      setWorkers(safeWorkers);
      setAttendanceRecords(Array.isArray(attendanceData) ? attendanceData : []);
      setLastSync(kpiData?.lastSync || new Date().toISOString());

      const volunteerDepts = Array.from(
        new Set(safeWorkers.map((w) => w?.department).filter((d): d is string => Boolean(d)))
      );
      setManualDepartments((prev) => Array.from(new Set([...prev, ...volunteerDepts])));
    } catch (error) {
      console.warn("API load error, using cached/mock data:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadAppData();
  }, [loadAppData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateWorker = async (updatedWorker: Worker) => {
    const safeWorkers = Array.isArray(workers) ? workers : [];
    const previousWorker = safeWorkers.find((item) => item.id === updatedWorker.id);
    const persistedWorker = await saveWorker(updatedWorker);

    setWorkers((prev) => (Array.isArray(prev) ? prev : []).map((item) => (item.id === persistedWorker.id ? persistedWorker : item)));
    if (currentUser?.role === "member" && currentUser.workerId === persistedWorker.id) {
      setCurrentUser({ ...currentUser, name: persistedWorker.name, email: persistedWorker.email });
    }

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

  const handleAddDepartment = (department: string) => {
    const normalized = department.trim();
    if (!normalized) return;
    setManualDepartments((prev) => Array.from(new Set([...prev, normalized])));
  };

  const handleEditDepartment = async (oldDepartment: string, newDepartment: string) => {
    const oldNorm = oldDepartment.trim();
    const newNorm = newDepartment.trim();
    if (!newNorm || oldNorm.toLowerCase() === newNorm.toLowerCase()) return;

    await renameDepartment(oldNorm, newNorm);

    setManualDepartments((prev) =>
      Array.from(new Set(prev.map((d) => (d.toLowerCase() === oldNorm.toLowerCase() ? newNorm : d))))
    );

    setWorkers((prev) =>
      prev.map((w) => {
        if (w.department && w.department.toLowerCase() === oldNorm.toLowerCase()) {
          return { ...w, department: newNorm };
        }
        return w;
      })
    );
  };

  const handleRemoveDepartment = (department: string) => {
    setManualDepartments((prev) => prev.filter((d) => d.toLowerCase() !== department.toLowerCase()));
  };

  const handleUpdateProfile = async (updated: {
    name: string;
    email: string;
    phone: string;
    department?: string;
    departments?: string[];
    profileImage?: string;
  }) => {
    if (!currentUser) return;

    if (currentUser.role === "member" && currentUser.workerId) {
      const worker = workers.find((w) => w.id === currentUser.workerId);
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
      setCurrentUser((prev) => (prev ? { ...prev, name: updated.name, email: updated.email } : prev));
      return;
    }

    setCurrentUser((prev) => (prev ? { ...prev, name: updated.name, email: updated.email } : prev));
  };

  const renderPage = (content: React.ReactNode) => (
    <>
      {dataError ? (
        <Alert variant="destructive">
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      ) : null}
      {content}
    </>
  );

  return (
    <ErrorBoundary>
      <Router>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate
                to={
                  currentUser.role === "superadmin"
                    ? "/dashboard"
                    : currentUser.role === "manager"
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
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(
                  <AdminDashboard
                    workers={workers}
                    attendanceRecords={attendanceRecords}
                    lastSync={lastSync}
                    loading={loadingData}
                    onRefresh={loadAppData}
                  />,
                )}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/import"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<DataImportScreen onImportComplete={loadAppData} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/workers"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(
                  <MemberDirectory
                    workers={workers}
                    departments={departments}
                    updateHistory={updateHistory}
                    onUpdateWorker={handleUpdateWorker}
                  />,
                )}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/services"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<ServicePlanner workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/calendar"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<MasterCalendar workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/kiosk"
          element={
            currentUser ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<KioskCheckIn user={currentUser} workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/visitors"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<VisitorManagement workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/groups"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<CellGroupsManagement workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/assets"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<AssetManagementScreen workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/discipleship"
          element={
            currentUser?.role === "superadmin" || currentUser?.role === "manager" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<DiscipleshipTracker workers={workers} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/attendance"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<AttendanceOverview attendanceRecords={attendanceRecords} loading={loadingData} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/attendance/:workerId"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(
                  <AttendanceDetailView
                    workers={workers}
                    attendanceRecords={attendanceRecords}
                    loading={loadingData}
                  />,
                )}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<ReportsAnalytics attendanceRecords={attendanceRecords} loading={loadingData} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(
                  <Settings
                    departments={departments}
                    workers={workers}
                    onAddDepartment={handleAddDepartment}
                    onEditDepartment={handleEditDepartment}
                    onRemoveDepartment={handleRemoveDepartment}
                  />
                )}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clock-in-portal"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<ClockInManagement />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/member"
          element={
            currentUser?.role === "member" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(
                  <MemberDashboard
                    user={currentUser}
                    worker={workers.find((w) => w.id === currentUser.workerId)}
                    departments={departments}
                    onUpdateProfile={handleUpdateProfile}
                  />,
                )}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clock-in"
          element={
            currentUser?.role === "member" ? (
              <AppLayout user={currentUser} workers={workers} onLogout={handleLogout}>
                {renderPage(<ClockInScreen user={currentUser} />)}
              </AppLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      </Router>
    </ErrorBoundary>
  );
}
