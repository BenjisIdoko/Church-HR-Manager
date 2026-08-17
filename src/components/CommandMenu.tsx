import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Music,
  Calendar,
  QrCode,
  Upload,
  Users,
  UserPlus,
  Home,
  Package,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Clock,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
}

export function CommandMenu({ open, onOpenChange, userRole = "superadmin" }: CommandMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const pages = [
    { title: "Ministry Overview", icon: LayoutDashboard, path: "/dashboard", roles: ["superadmin"] },
    { title: "Service Planner", icon: Music, path: "/services", roles: ["superadmin", "manager"] },
    { title: "Church Calendar", icon: Calendar, path: "/calendar", roles: ["superadmin", "manager"] },
    { title: "Kiosk Check-In", icon: QrCode, path: "/kiosk", roles: ["superadmin", "manager", "member"] },
    { title: "Servant Directory", icon: Users, path: "/workers", roles: ["superadmin", "manager"] },
    { title: "Visitors & Hospitality", icon: UserPlus, path: "/visitors", roles: ["superadmin", "manager"] },
    { title: "Cell Groups & Care", icon: Home, path: "/groups", roles: ["superadmin", "manager"] },
    { title: "Asset Management", icon: Package, path: "/assets", roles: ["superadmin", "manager"] },
    { title: "Discipleship LMS", icon: GraduationCap, path: "/discipleship", roles: ["superadmin", "manager"] },
    { title: "Attendance Records", icon: ClipboardList, path: "/attendance", roles: ["superadmin"] },
    { title: "Ministry Analytics", icon: BarChart3, path: "/reports", roles: ["superadmin"] },
    { title: "Clock-In Portal", icon: Clock, path: "/clock-in-portal", roles: ["superadmin"] },
    { title: "Import Records", icon: Upload, path: "/import", roles: ["superadmin"] },
    { title: "Settings", icon: SettingsIcon, path: "/settings", roles: ["superadmin"] },
  ];

  const allowedPages = pages.filter((p) => p.roles.includes(userRole));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search servant leaders, pages, or care tasks (⌘K)..." />
      <CommandList>
        <CommandEmpty>No matching records or pages found.</CommandEmpty>
        <CommandGroup heading="Ministry Pages">
          {allowedPages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.path} onSelect={() => handleSelect(page.path)}>
                <Icon className="mr-2.5 h-4 w-4 text-[#c85a32]" />
                <span className="font-medium text-[#1c1917]">{page.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Care & Quick Actions">
          <CommandItem onSelect={() => handleSelect("/kiosk")}>
            <QrCode className="mr-2.5 h-4 w-4 text-[#2e7d32]" />
            <span className="font-medium text-[#1c1917]">Launch Kiosk Check-In</span>
          </CommandItem>
          {userRole === "superadmin" && (
            <CommandItem onSelect={() => handleSelect("/import")}>
              <Upload className="mr-2.5 h-4 w-4 text-[#d97706]" />
              <span className="font-medium text-[#1c1917]">Import Roster CSV Data</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

