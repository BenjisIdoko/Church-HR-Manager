import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Search, LogOut, CheckCircle2 } from "lucide-react";
import { KioskCheckin } from "../../types/models";

interface KioskAdminRosterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredCheckins: KioskCheckin[];
  loading: boolean;
  onCheckout: (id: number) => void;
}

export function KioskAdminRoster({
  searchQuery,
  setSearchQuery,
  filteredCheckins,
  loading,
  onCheckout,
}: KioskAdminRosterProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by child, parent, or code..."
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Showing {filteredCheckins.length} active check-ins
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading kiosk check-ins...</div>
      ) : filteredCheckins.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No active check-ins found</p>
          <p className="text-xs text-slate-500 mt-1">Children checked in today will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCheckins.map((checkin) => {
            const childName = checkin.childName || checkin.child_name || "Unknown Child";
            const parentName = checkin.parentName || checkin.parent_name || "Guardian";
            const parentPhone = checkin.parentPhone || checkin.parent_phone || "";
            const securityCode = checkin.securityCode || checkin.security_code || "";
            const checkinTimeStr = checkin.checkinTime || checkin.checkin_time || new Date().toISOString();

            return (
              <Card
                key={checkin.id}
                className={`border transition-all shadow-xs ${
                  checkin.status === "checked-out"
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{childName}</h3>
                      <p className="text-xs font-semibold text-indigo-600">{checkin.department}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                        checkin.status === "checked-out"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}
                    >
                      {securityCode}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <p>
                      Guardian: <strong className="text-slate-900">{parentName}</strong> ({parentPhone})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Check-in time: {new Date(checkinTimeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {checkin.status === "checked-out" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Checked Out
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCheckout(checkin.id)}
                        className="w-full text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 gap-1.5 rounded-xl"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Safely Check Out
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
