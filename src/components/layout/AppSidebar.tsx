import { Link, useLocation } from "react-router-dom";
import { HeartHandshake, LogOut } from "lucide-react";
import { Button } from "../ui/button";

export interface NavItem {
  path: string;
  icon: any;
  label: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AppSidebarProps {
  user: {
    name: string;
    role: "superadmin" | "manager" | "member";
    email?: string;
  };
  adminNavGroups: NavGroup[];
  navItems: NavItem[];
  roleLabel: string;
  onOpenLogout: () => void;
}

export function AppSidebar({
  user,
  adminNavGroups,
  navItems,
  roleLabel,
  onOpenLogout,
}: AppSidebarProps) {
  const location = useLocation();

  return (
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
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive ? "bg-white/20 text-white" : "bg-[#fbeee8] text-[#9a3412]"
                            }`}
                          >
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
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? "bg-white/20 text-white" : "bg-[#fbeee8] text-[#9a3412]"
                          }`}
                        >
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

      <div className="border-t border-[#e7e2d8] p-4 bg-[#f5f1e8]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1c1917] truncate max-w-[140px]">{user.name}</p>
            <p className="text-[11px] font-medium text-[#78716c]">{roleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenLogout}
            className="text-[#78716c] hover:bg-[#eae4d7] hover:text-[#1c1917] rounded-xl"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
