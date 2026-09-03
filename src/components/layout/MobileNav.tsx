import { Link, useLocation } from "react-router-dom";
import { X, HeartHandshake, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { NavGroup, NavItem } from "./AppSidebar";

interface MobileNavProps {
  user: {
    name: string;
    role: "superadmin" | "manager" | "member";
    email?: string;
  };
  adminNavGroups: NavGroup[];
  navItems: NavItem[];
  mobileBottomTabs: { path: string; icon: any; label: string }[];
  sidebarOpen: boolean;
  roleLabel: string;
  onCloseSidebar: () => void;
  onOpenLogout: () => void;
}

export function MobileNav({
  user,
  adminNavGroups,
  navItems,
  mobileBottomTabs,
  sidebarOpen,
  roleLabel,
  onCloseSidebar,
  onOpenLogout,
}: MobileNavProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs xl:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#faf7f2] border-r border-[#e7e2d8] transition-transform duration-300 xl:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-[#e7e2d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand-icon text-white shadow-xs">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1c1917]">Church HR</p>
              <p className="text-[10px] font-semibold text-[#4f46e5]">Ministry Suite</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseSidebar}
            className="text-[#78716c] hover:bg-[#eae4d7]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {user.role === "superadmin" ? (
            adminNavGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#989086]">
                  {group.title}
                </p>
                <nav className="mt-1.5 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onCloseSidebar}
                      >
                        <div
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                            isActive
                              ? "gradient-nav-active text-white font-semibold shadow-xs"
                              : "text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#78716c]"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))
          ) : (
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseSidebar}
                  >
                    <div
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "gradient-nav-active text-white font-semibold shadow-xs"
                          : "text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#78716c]"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="border-t border-[#e7e2d8] p-4 bg-[#f5f1e8] flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-semibold text-[#1c1917] truncate">{user.name}</p>
            <p className="text-[10px] text-[#78716c] font-medium truncate">{roleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenLogout}
            className="text-[#78716c] hover:bg-[#eae4d7] shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d8] bg-[#fbf9f5]/95 backdrop-blur-md xl:hidden pb-[env(safe-area-inset-bottom)]">
        <div
          className={`grid h-16 ${
            mobileBottomTabs.length === 3 ? "grid-cols-3" : "grid-cols-4"
          }`}
        >
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all ${
                  isActive ? "text-[#4f46e5] font-semibold" : "text-[#78716c]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#4f46e5]" : "text-[#78716c]"}`} />
                <span className="text-[10px] tracking-tight truncate max-w-full">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
