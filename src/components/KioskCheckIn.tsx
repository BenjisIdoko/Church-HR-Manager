import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, Phone, Baby, Search, CheckCircle, LogOut, QrCode } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { KioskCheckin } from "../types/models";
import { checkoutKiosk, createKioskCheckin, fetchKioskCheckins } from "../utils/api";
import { toast } from "sonner";

export function KioskCheckIn() {
  const [checkins, setCheckins] = useState<KioskCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Kiosk Form State
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [department, setDepartment] = useState("Junior Church");

  // Security Badge Result Modal
  const [lastCheckin, setLastCheckin] = useState<{ childName: string; securityCode: string; department: string } | null>(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  const loadCheckins = async () => {
    try {
      setLoading(true);
      const data = await fetchKioskCheckins();
      setCheckins(data);
    } catch {
      toast.error("Failed to load kiosk check-ins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCheckins();
  }, []);

  const handleKioskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !parentName || !parentPhone) {
      toast.error("Child name, Parent name, and Phone are required");
      return;
    }

    try {
      const res = await createKioskCheckin({
        child_name: childName,
        parent_name: parentName,
        parent_phone: parentPhone,
        department,
      });

      toast.success("Child checked in successfully!");
      setLastCheckin({
        childName,
        securityCode: res.securityCode,
        department,
      });
      setIsBadgeOpen(true);

      setChildName("");
      setParentName("");
      setParentPhone("");
      void loadCheckins();
    } catch {
      toast.error("Failed to complete check-in");
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await checkoutKiosk(id);
      toast.success("Child checked out safely");
      void loadCheckins();
    } catch {
      toast.error("Failed to complete check-out");
    }
  };

  const activeCheckins = checkins.filter((c) => c.status === "checked-in");
  const filteredCheckins = checkins.filter((c) =>
    c.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.security_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parent_phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Child & Self-Service Kiosk Check-In</h1>
          <p className="text-slate-500 text-sm">
            Self-service check-in station for Children's Ministry with parent-child security codes.
          </p>
        </div>
      </div>

      {/* Main Kiosk Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Touch Kiosk Station */}
        <Card className="border-slate-200 shadow-md bg-gradient-to-b from-slate-900 to-slate-950 text-white lg:col-span-1">
          <CardHeader className="p-6 pb-2 text-center border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <Baby className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Self-Service Check-In Station</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Check in child for Children's Church & receive security tag.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleKioskSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Child Full Name *</label>
                <Input
                  placeholder="e.g. Samuel Johnson"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Parent / Guardian Name *</label>
                <Input
                  placeholder="e.g. Mrs. Sarah Johnson"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Parent Phone Number *</label>
                <Input
                  placeholder="08012345678"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Children Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-md p-2 text-xs"
                >
                  <option value="Toddlers (0-3 yrs)">Toddlers (0-3 yrs)</option>
                  <option value="Junior Church (4-8 yrs)">Junior Church (4-8 yrs)</option>
                  <option value="Teens Ministry (9-14 yrs)">Teens Ministry (9-14 yrs)</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-sm mt-2">
                Generate Security Tag & Check In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Active Check-ins Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search child name, parent phone, or security code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="ml-3 font-semibold text-xs text-slate-600">
              Active: <span className="text-indigo-600 font-bold">{activeCheckins.length} Children</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading check-ins...</div>
            ) : filteredCheckins.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No children checked in at kiosk.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Security Code</th>
                      <th className="p-4">Child Name</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Parent / Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredCheckins.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-xs text-indigo-600">{c.security_code}</td>
                        <td className="p-4 font-semibold text-slate-900">{c.child_name}</td>
                        <td className="p-4 text-xs text-slate-600">{c.department}</td>
                        <td className="p-4 text-xs text-slate-700">
                          {c.parent_name} <br />
                          <span className="text-slate-400 font-mono">{c.parent_phone}</span>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={`text-xs capitalize ${
                              c.status === "checked-in"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          {c.status === "checked-in" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckout(c.id)}
                              className="text-xs h-8 text-slate-700 hover:bg-slate-100"
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1" /> Safe Check-Out
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Checked Out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Printable Parent Security Badge */}
      <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Parent-Child Security Badge</DialogTitle>
          </DialogHeader>

          {lastCheckin ? (
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 my-2 border border-slate-800 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Security Pick-Up Code</p>
                <p className="text-3xl font-mono font-extrabold text-indigo-400 tracking-widest mt-1">
                  {lastCheckin.securityCode}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 text-xs space-y-1 text-slate-300">
                <p><span className="font-bold text-white">Child:</span> {lastCheckin.childName}</p>
                <p><span className="font-bold text-white">Dept:</span> {lastCheckin.department}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsBadgeOpen(false)} className="w-full bg-slate-900 text-white">
              Done & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
