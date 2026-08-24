import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  Clock,
  UserPlus,
  Home,
  Package,
  GraduationCap,
  Music,
  Calendar,
  QrCode,
} from "lucide-react";
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
import { AppSidebar, NavGroup, NavItem } from "./layout/AppSidebar";
import { AppHeader } from "./layout/AppHeader";
import { MobileNav } from "./layout/MobileNav";
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
      <AppSidebar
        user={user}
        adminNavGroups={adminNavGroups}
        navItems={navItems}
        roleLabel={roleLabel}
        onOpenLogout={() => setShowLogoutDialog(true)}
      />

      <MobileNav
        user={user}
        adminNavGroups={adminNavGroups}
        navItems={navItems}
        mobileBottomTabs={mobileBottomTabs}
        sidebarOpen={sidebarOpen}
        roleLabel={roleLabel}
        onCloseSidebar={() => setSidebarOpen(false)}
        onOpenLogout={() => setShowLogoutDialog(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          user={user}
          workers={workers}
          roleLabel={roleLabel}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenLogout={() => setShowLogoutDialog(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 xl:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        workers={workers}
        userRole={user.role}
      />

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl border-[#e7e2d8]">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of Church HR Manager?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-[#e7e2d8]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl bg-[#dc2626] text-white hover:bg-[#b91c1c]"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
