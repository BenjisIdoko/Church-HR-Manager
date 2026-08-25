import { Command, Menu, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { AbsenceNotification } from "../AbsenceNotification";
import { Worker } from "../../types/models";

interface AppHeaderProps {
  user: {
    name: string;
    role: "superadmin" | "manager" | "member";
    email?: string;
  };
  workers?: Worker[];
  roleLabel: string;
  onOpenCommand: () => void;
  onOpenSidebar: () => void;
  onOpenLogout: () => void;
}

export function AppHeader({
  user,
  workers = [],
  roleLabel,
  onOpenCommand,
  onOpenSidebar,
  onOpenLogout,
}: AppHeaderProps) {
  const matchedWorker = workers.find(
    (w) =>
      ((user as any).workerId && (w.id === (user as any).workerId || (w as any).external_id === (user as any).workerId)) ||
      (user.email && w.email && user.email.toLowerCase() === w.email.toLowerCase()) ||
      (user.name && w.name && user.name.toLowerCase() === w.name.toLowerCase())
  );

  const profileImg = matchedWorker?.profileImage;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7e2d8] bg-[#fbf9f5]/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden text-[#78716c] hover:bg-[#eae4d7]"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 rounded-xl border border-[#e7e2d8] bg-[#faf7f2] px-3 py-1.5 text-xs text-[#78716c] hover:bg-[#eae4d7] transition-all shadow-2xs"
        >
          <Command className="h-3.5 w-3.5 text-[#a8a29e]" />
          <span>Quick actions & search...</span>
          <kbd className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-mono border border-[#e7e2d8] text-[#a8a29e]">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {user.role === "superadmin" && <AbsenceNotification />}
        <div className="hidden sm:flex items-center gap-2.5 border-l border-[#e7e2d8] pl-3">
          {profileImg ? (
            <img
              src={profileImg}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover border border-[#e7e2d8] shadow-2xs"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shadow-2xs tracking-wider">
              {initials}
            </div>
          )}

          <div className="text-right">
            <p className="text-xs font-semibold text-[#1c1917]">{user.name}</p>
            <p className="text-[10px] text-[#78716c] font-medium">{roleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenLogout}
            className="text-[#78716c] hover:bg-[#eae4d7] hover:text-[#1c1917] rounded-xl h-8 w-8 ml-1"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
