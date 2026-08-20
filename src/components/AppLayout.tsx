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
  UserPlus,
  Home,
  Package,
  GraduationCap,
  Music,
  Calendar,
  QrCode,
  HeartHandshake,
  Command,
  MoreHorizontal,
  ChevronRight,
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

interface NavGroup {
  title: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Ministry Overview" },
      { path: "/reports", icon: BarChart3, label: "Ministry Analytics" },
    ],
  },
  {
    title: "People & Care",
    items: [
      { path: "/workers", icon: Users, label: "Volunteer Directory" },
      { path: "/visitors", icon: UserPlus, label: "Visitors & Care", badge: "Care" },
      { path: "/groups", icon: Home, label: "Cell Groups & Care" },
      { path: "/discipleship", icon: GraduationCap, label: "Discipleship LMS" },
    ],
  },
  {
    title: "Services & Events",
    items: [
      { path: "/services", icon: Music, label: "Service Planner" },
      { path: "/calendar", icon: Calendar, label: "Church Calendar" },
      { path: "/kiosk", icon: QrCode, label: "Kiosk Check-In" },
    ],
  },
  {
    title: "Operations",
    items: [
      { path: "/attendance", icon: ClipboardList, label: "Attendance Records" },
      { path: "/assets", icon: Package, label: "Asset Management" },
      { path: "/import", icon: Upload, label: "Import Records" },
    ],
  },
  {
    title: "Admin",
    items: [
      { path: "/clock-in-portal", icon: Clock, label: "Clock-In Portal" },
      { path: "/settings", icon: SettingsIcon, label: "Settings" },
    ],
  },
];

const adminNavItems: NavItem[] = adminNavGroups.flatMap((group) => group.items);

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
  { path: "/visitors", icon: UserPlus, label: "Visitors & Care" },
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

  // Define Quick Access Tabs for Mobile Bottom Bar
  const mobileBottomTabs =
    user.role === "superadmin"
      ? [
          { path: "/dashboard", icon: LayoutDashboard, label: "Overview" },
          { path: "/services", icon: Music, label: "Services" },
          { path: "/workers", icon: Users, label: "Volunteers" },
          { path: "/reports", icon: BarChart3, label: "Analytics" },
        ]
      : user.role === "manager"
      ? [
          { path: "/services", icon: Music, label: "Services" },
          { path: "/calendar", icon: Calendar, label: "Calendar" },
          { path: "/workers", icon: Users, label: "Volunteers" },
          { path: "/visitors", icon: UserPlus, label: "Visitors" },
        ]
      : [
          { path: "/member", icon: Users, label: "Profile" },
          { path: "/clock-in", icon: Clock, label: "Clock In" },
          { path: "/kiosk", icon: QrCode, label: "Kiosk" },
        ];

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
          {user.role === "superadmin" ? (
            adminNavGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#989086]">
                  {group.title}
                </p>
                <nav className="mt-2 space-y-1">
                  {group.items.map((item) => {
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
            ))
          ) : (
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
          )}
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

      {/* Mobile Drawer Overlay & Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#faf7f2] border-r border-[#e7e2d8] p-5 flex flex-col shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e7e2d8]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand-icon text-white font-bold shadow-sm">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#1c1917]">Church HR</p>
                  <p className="text-[10px] font-semibold text-[#4f46e5]">Ministry Suite</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 text-slate-500 hover:bg-slate-200/60 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Current User Card */}
            <div className="my-4 p-3 bg-white border border-[#e7e2d8] rounded-xl flex items-center gap-3 shadow-2xs">
              <div className="h-9 w-9 rounded-lg gradient-brand-icon text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium capitalize">{roleLabel}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {user.role === "superadmin" ? (
                adminNavGroups.map((group) => (
                  <div key={group.title}>
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <div
                              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                                isActive
                                  ? "gradient-nav-active text-white font-semibold shadow-xs"
                                  : "text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge ? (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#fbeee8] text-[#9a3412]"}`}>
                                  {item.badge}
                                </span>
                              ) : (
                                <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white/70" : "text-slate-300"}`} />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ministry Navigation
                  </p>
                  <div className="space-y-1">
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
                            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                              isActive
                                ? "gradient-nav-active text-white font-semibold shadow-xs"
                                : "text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge ? (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#fbeee8] text-[#9a3412]"}`}>
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white/70" : "text-slate-300"}`} />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Sign Out */}
            <div className="pt-4 mt-auto border-t border-[#e7e2d8]">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 border-[#e7e2d8] text-rose-700 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs rounded-xl py-2.5"
                onClick={() => {
                  setSidebarOpen(false);
                  setShowLogoutDialog(true);
                }}
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                <span>Sign Out Account</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[#e7e2d8]/80 gradient-header px-3 sm:px-6 py-2.5 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-xl">
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-[#57534e] hover:bg-[#f4f1ea] rounded-xl h-9 w-9"
                onClick={() => setSidebarOpen(true)}
                title="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Quick Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCommandOpen(true)}
                className="sm:hidden text-[#57534e] hover:bg-[#f4f1ea] rounded-xl h-9 w-9"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
              </Button>

              <button
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-3 w-full max-w-md rounded-xl border border-[#e7e2d8] bg-[#fbf9f5] px-3 py-1.5 text-xs text-[#78716c] hover:border-[#d6cebf] transition-colors shadow-2xs"
              >
                <Search className="h-3.5 w-3.5 text-[#989086]" />
                <span className="flex-1 text-left font-normal truncate">Search volunteers, teams, or care notes...</span>
                <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-[#e7e2d8] bg-white px-1.5 text-[10px] font-semibold text-[#78716c] shrink-0">
                  <Command className="h-2.5 w-2.5" /> K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <AbsenceNotification />

              <div className="h-5 w-px bg-[#e7e2d8] mx-0.5" />

              <div className="flex items-center gap-2 pl-0.5">
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
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl gradient-brand-icon text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
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

        {/* Page Content Container - includes bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto p-3 sm:p-6 xl:p-8 bg-[#fbf9f5] pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (Visible on mobile/tablet screens < xl) */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e7e2d8] shadow-lg px-2 py-1 flex items-center justify-around">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link key={tab.path} to={tab.path} className="flex-1 text-center py-1">
              <div
                className={`flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? "text-[#4f46e5] font-bold" : "text-[#78716c] font-medium hover:text-[#1c1917]"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-[#e0e7ff] text-[#4f46e5]" : ""}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-[64px]">{tab.label}</span>
              </div>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-1 text-center py-1 flex flex-col items-center justify-center gap-0.5 text-[#78716c] font-medium hover:text-[#1c1917]"
        >
          <div className="p-1.5 rounded-xl transition-all hover:bg-slate-100">
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>

      {/* Command Palette */}
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} userRole={user.role} workers={workers} />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white border border-[#e7e2d8] rounded-2xl max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1917] font-bold">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-[#78716c] text-xs">
              Are you sure you want to sign out? You will need to log in again to access the Church HR portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#f4f1ea] text-[#1c1917] border-0 hover:bg-[#e7e2d8] rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
