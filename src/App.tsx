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
import { Toaster } from "./components/ui/sonner";
import { Alert, AlertDescription } from "./components/ui/alert";
import { fetchAttendance, fetchKpis, fetchWorkers, saveWorker } from "./utils/api";
import { AttendanceRecord, User, Worker } from "./types/models";

interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryEntry[]>([]);
  const [manualDepartments, setManualDepartments] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const departments = useMemo(
    () =>
      Array.from(new Set([...manualDepartments, ...workers.map((worker) => worker.department)])).sort((a, b) =>
        a.localeCompare(b),
      ),
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

      setWorkers(workersData);
      setAttendanceRecords(attendanceData);
      setLastSync(kpiData.lastSync);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Failed to load application data.");
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
    const previousWorker = workers.find((item) => item.id === updatedWorker.id);
    const persistedWorker = await saveWorker(updatedWorker);

    setWorkers((prev) => prev.map((item) => (item.id === persistedWorker.id ? persistedWorker : item)));
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

  const handleUpdateProfile = async (updated: { name: string; email: string; phone: string }) => {
    if (!currentUser) return;

    if (currentUser.role === "member" && currentUser.workerId) {
      const worker = workers.find((w) => w.id === currentUser.workerId);
      if (worker) {
        await handleUpdateWorker({ ...worker, name: updated.name, email: updated.email, phone: updated.phone });
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
          path="/attendance"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
                {renderPage(<Settings departments={departments} onAddDepartment={handleAddDepartment} />)}
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
                {renderPage(
                  <MemberDashboard
                    user={currentUser}
                    worker={workers.find((w) => w.id === currentUser.workerId)}
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
              <AppLayout user={currentUser} onLogout={handleLogout}>
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
  );
}
