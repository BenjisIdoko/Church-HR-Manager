import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  Clock,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  UserPlus,
  Home,
  Package,
  GraduationCap,
  Music,
  Calendar,
  QrCode,
  HeartHandshake,
  Command,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AbsenceNotification } from "./AbsenceNotification";
import { CommandMenu } from "./CommandMenu";
import { Worker } from "../types/models";

interface AppLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    role: "superadmin" | "manager" | "member";
    email?: string;
  };
  workers?: Worker[];
  onLogout: () => void;
}

interface NavItem {
  path: string;
  icon: any;
  label: string;
  badge?: string;
}

const adminNavItems: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Ministry Overview" },
  { path: "/services", icon: Music, label: "Service Planner" },
  { path: "/calendar", icon: Calendar, label: "Church Calendar" },
  { path: "/kiosk", icon: QrCode, label: "Kiosk Check-In" },
  { path: "/workers", icon: Users, label: "Volunteer Directory" },
  { path: "/visitors", icon: UserPlus, label: "Visitors & Hospitality", badge: "Care" },
  { path: "/groups", icon: Home, label: "Cell Groups & Care" },
  { path: "/discipleship", icon: GraduationCap, label: "Discipleship LMS" },
  { path: "/assets", icon: Package, label: "Asset Management" },
  { path: "/attendance", icon: ClipboardList, label: "Attendance Records" },
  { path: "/reports", icon: BarChart3, label: "Ministry Analytics" },
  { path: "/clock-in-portal", icon: Clock, label: "Clock-In Portal" },
  { path: "/import", icon: Upload, label: "Import Records" },
  { path: "/settings", icon: SettingsIcon, label: "Settings" },
];

const memberNavItems: NavItem[] = [
  { path: "/member", icon: Users, label: "My Profile" },
  { path: "/clock-in", icon: Clock, label: "Clock In" },
  { path: "/kiosk", icon: QrCode, label: "Kiosk Check-In" },
];

const managerNavItems: NavItem[] = [
  { path: "/services", icon: Music, label: "Service Planner" },
  { path: "/calendar", icon: Calendar, label: "Church Calendar" },
  { path: "/kiosk", icon: QrCode, label: "Kiosk Check-In" },
  { path: "/workers", icon: Users, label: "Volunteer Directory" },
  { path: "/visitors", icon: UserPlus, label: "Visitors & Hospitality" },
  { path: "/groups", icon: Home, label: "Cell Groups & Care" },
  { path: "/assets", icon: Package, label: "Asset Management" },
  { path: "/discipleship", icon: GraduationCap, label: "Discipleship LMS" },
];

export function AppLayout({ children, user, workers = [], onLogout }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const navItems =
    user.role === "superadmin"
      ? adminNavItems
      : user.role === "manager"
      ? managerNavItems
      : memberNavItems;

  const roleLabel =
    user.role === "superadmin" ? "Super Admin" : user.role === "manager" ? "Manager" : "Member";

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf9f5] text-[#1c1917] font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden xl:flex xl:flex-col w-72 border-r border-[#e7e2d8] bg-[#faf7f2] shadow-xs">
        <div className="px-6 py-6 border-b border-[#e7e2d8]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand-icon text-white shadow-md">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-[#1c1917]">
                Church HR
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-[#4f46e5]">
                Ministry & Care Suite
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#989086]">
              Ministry Navigation
            </p>
            <nav className="mt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "gradient-nav-active text-white font-semibold shadow-xs"
                          : "text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#78716c]"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#fbeee8] text-[#9a3412]"}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#e7e2d8]">
          <Button
            variant="outline"
            className="w-full justify-between border-[#e7e2d8] text-[#57534e] hover:bg-[#fbeee8] hover:text-[#9a3412] hover:border-[#fcd34d] transition-colors rounded-xl"
            onClick={() => setShowLogoutDialog(true)}
          >
            <span className="text-xs font-semibold">Sign Out</span>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-[#1c1917]/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#faf7f2] border-r border-[#e7e2d8] p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand-icon text-white font-bold">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <p className="text-base font-bold text-[#1c1917]">Church HR</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="mt-6 space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "gradient-nav-active text-white font-semibold"
                          : "text-[#57534e] hover:bg-[#f4f1ea]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[#e7e2d8]/80 gradient-header px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-[#57534e]"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Quick Search Button (Mobile icon + Desktop bar) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCommandOpen(true)}
                className="sm:hidden text-[#57534e]"
                title="Search (⌘K)"
              >
                <Search className="h-5 w-5" />
              </Button>

              <button
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-3 w-full max-w-md rounded-xl border border-[#e7e2d8] bg-[#fbf9f5] px-3.5 py-2 text-xs text-[#78716c] hover:border-[#d6cebf] transition-colors shadow-2xs"
              >
                <Search className="h-4 w-4 text-[#989086]" />
                <span className="flex-1 text-left font-normal truncate">Search volunteers, teams, or care notes...</span>
                <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-[#e7e2d8] bg-white px-1.5 text-[10px] font-semibold text-[#78716c] shrink-0">
                  <Command className="h-2.5 w-2.5" /> K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <AbsenceNotification />

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-[#57534e] hover:bg-[#f4f1ea]"
              >
                <Bell className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-[#e7e2d8] mx-0.5 sm:mx-1" />

              <div className="flex items-center gap-2 sm:gap-3 pl-1">
                {(() => {
                  const userEmail = user.email || "";
                  const currentUserWorker = workers.find(
                    (w) => (userEmail && w.email.toLowerCase() === userEmail.toLowerCase()) || (user as any).workerId === w.id
                  );
                  const profileImage = currentUserWorker?.profileImage;
                  return profileImage ? (
                    <img
                      src={profileImage}
                      alt={user.name}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover shadow-xs border border-[#e7e2d8]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl gradient-brand-icon text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {user.name.charAt(0) || "U"}
                    </div>
                  );
                })()}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-[#1c1917] leading-tight max-w-[160px] truncate">{user.name}</p>
                  <p className="text-[10px] font-medium text-[#78716c] capitalize leading-tight">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 xl:p-8 bg-[#fbf9f5]">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} userRole={user.role} workers={workers} />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white border border-[#e7e2d8] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1917] font-bold">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-[#78716c]">
              Are you sure you want to sign out? You will need to log in again to access the Church HR portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#f4f1ea] text-[#1c1917] border-0 hover:bg-[#e7e2d8] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


