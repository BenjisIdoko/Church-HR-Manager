import React from "react";
import { Navigate } from "react-router-dom";
import { User, UserRole } from "../types/models";
import { AppLayout } from "./AppLayout";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  user: User | null;
  loadingSession?: boolean;
  allow?: UserRole[];
  workers?: any[];
  onLogout?: () => Promise<void>;
  children: React.ReactNode;
  withLayout?: boolean;
}

export function ProtectedRoute({
  user,
  loadingSession = false,
  allow,
  workers = [],
  onLogout,
  children,
  withLayout = true,
}: ProtectedRouteProps) {
  if (loadingSession && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allow && allow.length > 0 && !allow.includes(user.role)) {
    const defaultRoute =
      user.role === "superadmin"
        ? "/dashboard"
        : user.role === "manager"
        ? "/workers"
        : "/member";

    return <Navigate to={defaultRoute} replace />;
  }

  if (withLayout && onLogout) {
    return (
      <AppLayout user={user} workers={workers} onLogout={onLogout}>
        {children}
      </AppLayout>
    );
  }

  return <>{children}</>;
}
