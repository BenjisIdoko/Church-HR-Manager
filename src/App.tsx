import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { AppLayout } from "./components/AppLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { MemberDirectory } from "./components/MemberDirectory";
import { MemberDashboard } from "./components/MemberDashboard";
import { DataImportScreen } from "./components/DataImportScreen";
import { AttendanceOverview } from "./components/AttendanceOverview";
import { AttendanceDetailView } from "./components/AttendanceDetailView";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { Settings } from "./components/Settings";
import { Toaster } from "./components/ui/sonner";
import {
  mockWorkers,
  mockDepartments,
  User,
  Worker,
} from "./utils/mockData";

interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-100">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1640963269654-3fe248c5fba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjA0MjI3OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [departments, setDepartments] = useState<string[]>(mockDepartments);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryEntry[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    const previousWorker = workers.find((item) => item.id === updatedWorker.id);
    setWorkers((prev) => prev.map((item) => (item.id === updatedWorker.id ? updatedWorker : item)));
    if (currentUser?.role === "member" && currentUser.workerId === updatedWorker.id) {
      setCurrentUser({ ...currentUser, name: updatedWorker.name, email: updatedWorker.email });
    }

    if (previousWorker) {
      const changes = [
        previousWorker.name !== updatedWorker.name ? "name" : null,
        previousWorker.email !== updatedWorker.email ? "email" : null,
        previousWorker.phone !== updatedWorker.phone ? "phone" : null,
        previousWorker.department !== updatedWorker.department ? "department" : null,
        previousWorker.role !== updatedWorker.role ? "role" : null,
        previousWorker.status !== updatedWorker.status ? "status" : null,
      ]
        .filter(Boolean)
        .join(", ");

      if (changes) {
        setUpdateHistory((prev) => [
          {
            workerId: updatedWorker.id,
            workerName: updatedWorker.name,
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
    setDepartments((prev) => Array.from(new Set([...prev, normalized])));
  };

  const handleUpdateProfile = (updated: { name: string; email: string; phone: string }) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, name: updated.name, email: updated.email } : prev));

    if (currentUser.role === "member" && currentUser.workerId) {
      const worker = workers.find((w) => w.id === currentUser.workerId);
      if (worker) {
        handleUpdateWorker({ ...worker, name: updated.name, email: updated.email, phone: updated.phone });
      }
    }
  };

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
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser?.role === "superadmin" ? (
              <AppLayout user={currentUser} onLogout={handleLogout}>
                <AdminDashboard />
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
                <DataImportScreen />
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
                <MemberDirectory
                  workers={workers}
                  departments={departments}
                  updateHistory={updateHistory}
                  onUpdateWorker={handleUpdateWorker}
                />
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
                <AttendanceOverview />
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
                <AttendanceDetailView />
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
                <ReportsAnalytics />
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
                <Settings departments={departments} onAddDepartment={handleAddDepartment} />
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
                <MemberDashboard
                  user={currentUser}
                  worker={workers.find((w) => w.id === currentUser.workerId)}
                  onUpdateProfile={handleUpdateProfile}
                />
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
