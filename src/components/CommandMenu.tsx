import { useEffect, useState } from "react";
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
import { Worker } from "../types/models";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
  workers?: Worker[];
}

function VolunteerAvatar({ name, profileImage }: { name: string; profileImage?: string }) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "W";

  if (profileImage && !imgError) {
    return (
      <img
        src={profileImage}
        alt={name}
        className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-200"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-indigo-200">
      {initials}
    </div>
  );
}

export function CommandMenu({ open, onOpenChange, userRole = "superadmin", workers = [] }: CommandMenuProps) {
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

  const handleSelectVolunteer = (worker: Worker) => {
    onOpenChange(false);
    navigate(`/workers?search=${encodeURIComponent(worker.name)}`);
  };

  const pages = [
    { title: "Ministry Overview", icon: LayoutDashboard, path: "/dashboard", roles: ["superadmin"] },
    { title: "Service Planner", icon: Music, path: "/services", roles: ["superadmin", "manager"] },
    { title: "Church Calendar", icon: Calendar, path: "/calendar", roles: ["superadmin", "manager"] },
    { title: "Kiosk Check-In", icon: QrCode, path: "/kiosk", roles: ["superadmin", "manager", "member"] },
    { title: "Volunteer Directory", icon: Users, path: "/workers", roles: ["superadmin", "manager"] },
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
  const safeWorkers = Array.isArray(workers) ? workers : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search volunteers by name, department, phone or email (⌘K)..." />
      <CommandList>
        <CommandEmpty>No matching records or pages found.</CommandEmpty>
        
        {/* Volunteer Directory Search Items */}
        {(userRole === "superadmin" || userRole === "manager") && safeWorkers.length > 0 && (
          <>
            <CommandGroup heading="Volunteers & Workforce">
              {safeWorkers.slice(0, 80).map((worker) => (
                <CommandItem
                  key={worker.id}
                  onSelect={() => handleSelectVolunteer(worker)}
                  className="flex items-center justify-between cursor-pointer py-2 px-3 hover:bg-slate-100/80 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <VolunteerAvatar name={worker.name} profileImage={worker.profileImage} />
                    <span className="font-semibold text-slate-900 text-xs truncate">{worker.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium shrink-0 ml-2">{worker.department}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Ministry Pages">
          {allowedPages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.path} onSelect={() => handleSelect(page.path)} className="cursor-pointer py-2 px-3 hover:bg-slate-100/80 rounded-lg">
                <Icon className="mr-2.5 h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-900 text-xs">{page.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Care & Quick Actions">
          <CommandItem onSelect={() => handleSelect("/kiosk")} className="cursor-pointer py-2 px-3 hover:bg-slate-100/80 rounded-lg">
            <QrCode className="mr-2.5 h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-900 text-xs">Launch Kiosk Check-In</span>
          </CommandItem>
          {userRole === "superadmin" && (
            <CommandItem onSelect={() => handleSelect("/import")} className="cursor-pointer py-2 px-3 hover:bg-slate-100/80 rounded-lg">
              <Upload className="mr-2.5 h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-900 text-xs">Import Roster CSV Data</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
