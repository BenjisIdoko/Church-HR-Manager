import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, Phone, Baby, Search, CheckCircle, LogOut, QrCode, Printer, Lock, Sparkles, LayoutList, Monitor, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { KioskCheckin, User, Worker } from "../types/models";
import { checkoutKiosk, createKioskCheckin, fetchKioskCheckins } from "../utils/api";
import { toast } from "sonner";
import { printReport } from "../utils/exportUtils";

interface KioskCheckInProps {
  user?: User | null;
  workers?: Worker[];
}

export function KioskCheckIn({ user, workers = [] }: KioskCheckInProps) {
  const isAdmin = user?.role === "superadmin" || user?.role === "manager";

  // Mode: "kiosk" (Full-Screen User Check-In Form) vs "admin" (Roster & Search View)
  const [viewMode, setViewMode] = useState<"kiosk" | "admin">(isAdmin ? "admin" : "kiosk");

  const [checkins, setCheckins] = useState<KioskCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Kiosk Form State
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState(user?.name || "");
  const [parentPhone, setParentPhone] = useState("");
  const [department, setDepartment] = useState("Junior Church (4-8 yrs)");

  // Security Badge Result Modal
  const [lastCheckin, setLastCheckin] = useState<{
    childName: string;
    parentName: string;
    parentPhone: string;
    securityCode: string;
    department: string;
    timestamp: string;
  } | null>(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  // Auto-populate parent details from logged-in user profile
  useEffect(() => {
    if (user && user.name) {
      setParentName(user.name);
      // Look up phone from matching worker profile if available
      const matchedWorker = workers.find(
        (w) => w.id === user.workerId || w.email.toLowerCase() === user.email.toLowerCase()
      );
      if (matchedWorker?.phone && !parentPhone) {
        setParentPhone(matchedWorker.phone);
      }
    }
  }, [user, workers]);

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

    if (!childName.trim()) {
      toast.error("Child name is required");
      return;
    }
    if (!parentName.trim()) {
      toast.error("Parent/Guardian name is required");
      return;
    }
    if (!parentPhone.trim()) {
      toast.error("Parent phone number is required");
      return;
    }

    // Security Validation: Enforce logged-in user identity for non-admin accounts
    if (user && !isAdmin) {
      const normalizedUser = user.name.trim().toLowerCase();
      const normalizedInput = parentName.trim().toLowerCase();
      
      if (normalizedInput !== normalizedUser) {
        toast.error(
          `Security Lock: You are logged in as "${user.name}". Parent/Guardian name must match your authenticated user profile to prevent checking in someone else's child.`
        );
        setParentName(user.name);
        return;
      }
    }

    try {
      const res = await createKioskCheckin({
        child_name: childName.trim(),
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim(),
        department,
      });

      const generatedCode = res?.securityCode || `TAG-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setLastCheckin({
        childName: childName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        securityCode: generatedCode,
        department,
        timestamp,
      });
      setIsBadgeOpen(true);
      toast.success("Child checked in! Printable security tag generated.");

      // Clear child input, preserve parent identity for user
      setChildName("");
      if (!user) {
        setParentName("");
        setParentPhone("");
      }
      void loadCheckins();
    } catch (error) {
      console.error("Check-in error:", error);
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

  const getQRCodeUrl = (code: string, child: string, parent: string, phone: string, dept: string, timestamp: string) => {
    const qrData = `TAG:${code}|CHILD:${child}|PARENT:${parent}|PHONE:${phone}|DEPT:${dept}|TIME:${timestamp}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
  };

  const handlePrintBadge = () => {
    if (!lastCheckin) return;
    const qrUrl = getQRCodeUrl(
      lastCheckin.securityCode,
      lastCheckin.childName,
      lastCheckin.parentName,
      lastCheckin.parentPhone,
      lastCheckin.department,
      lastCheckin.timestamp
    );

    const htmlContent = `
      <div style="text-align: center; border: 3px double #4f46e5; padding: 24px; border-radius: 20px; background-color: #ffffff; max-width: 420px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background-color: #4f46e5; color: #ffffff; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px;">CHURCH CHILDREN'S MINISTRY</h2>
          <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Parent-Child Security Pick-Up Tag</p>
        </div>
        
        <div style="background-color: #0f172a; color: #818cf8; font-size: 38px; font-family: monospace; font-weight: 900; letter-spacing: 6px; padding: 16px; border-radius: 14px; margin: 16px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          ${lastCheckin.securityCode}
        </div>

        <div style="margin: 16px 0; text-align: center;">
          <img src="${qrUrl}" alt="Scannable Security Tag QR Code" width="180" height="180" style="border: 4px solid #f1f5f9; border-radius: 12px; padding: 6px; background: #ffffff; margin: 0 auto;" />
        </div>
        <p style="font-size: 10px; color: #64748b; margin-top: -8px; font-weight: 600;">Scan QR code with camera app or kiosk scanner to verify</p>

        <table style="width: 100%; text-align: left; font-size: 13px; border-collapse: collapse; margin-top: 16px; background-color: #f8fafc; border-radius: 10px; padding: 8px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #475569;">Child Name:</td><td style="padding: 8px; font-weight: 800; color: #0f172a; font-size: 15px;">${lastCheckin.childName}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #475569;">Authenticated Parent:</td><td style="padding: 8px; font-weight: 600; color: #0f172a;">${lastCheckin.parentName} (${lastCheckin.parentPhone})</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #475569;">Department:</td><td style="padding: 8px; color: #4f46e5; font-weight: 600;">${lastCheckin.department}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Issued Time:</td><td style="padding: 8px; color: #0f172a; font-family: monospace;">${lastCheckin.timestamp}</td></tr>
        </table>

        <div style="margin-top: 20px; font-size: 11px; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 8px; font-weight: 600;">
          ⚠️ SECURITY REQUIRED: Parents must present this tag or QR code to claim child after service.
        </div>
      </div>
    `;
    printReport(`Security_Tag_${lastCheckin.securityCode}`, htmlContent);
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
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Children's Ministry Kiosk</h1>
            <p className="text-xs text-slate-500">
              {viewMode === "kiosk" ? "Self-service check-in station for parents & children" : "Admin security management & active check-in roster"}
            </p>
          </div>
        </div>

        {/* View Switcher Button */}
        <div className="flex items-center gap-2">
          {viewMode === "kiosk" ? (
            <Button
              onClick={() => setViewMode("admin")}
              variant="outline"
              size="sm"
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
            >
              <LayoutList className="w-4 h-4 mr-1.5" /> Switch to Admin Roster
            </Button>
          ) : (
            <Button
              onClick={() => setViewMode("kiosk")}
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              <Monitor className="w-4 h-4 mr-1.5" /> Full-Screen Self-Service Mode
            </Button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Full-Screen Self-Service Check-In Station for Users/Parents */}
      {viewMode === "kiosk" && (
        <div className="w-full max-w-4xl mx-auto">
          <Card className="border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4 text-center border-b border-slate-800/80 bg-slate-950/40">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Baby className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Self-Service Check-In Station
              </CardTitle>
              <CardDescription className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                Enter your child's details to generate a scannable & printable security tag for pick-up.
              </CardDescription>

              {user && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Authenticated User Account: <span className="text-white font-bold">{user.name}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 sm:p-10 space-y-6">
              <form onSubmit={handleKioskSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Child Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Baby className="w-4 h-4 text-indigo-400" /> Child Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Samuel Johnson"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 h-12 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  {/* Parent Full Name (Validated with User Account) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-400" /> Parent / Guardian Name *
                      </span>
                      {user && !isAdmin && (
                        <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Account Locked
                        </span>
                      )}
                    </label>
                    <Input
                      placeholder="e.g. Mrs. Sarah Johnson"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      readOnly={Boolean(user && !isAdmin)}
                      className={`bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 h-12 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        user && !isAdmin ? "opacity-80 cursor-not-allowed bg-slate-900/90 text-indigo-200 font-semibold" : ""
                      }`}
                      required
                    />
                    {user && !isAdmin && (
                      <p className="text-[11px] text-slate-400">
                        * Automatically validated against your authenticated profile ({user.name}) for security.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Parent Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-indigo-400" /> Parent Phone Number *
                    </label>
                    <Input
                      placeholder="e.g. 08012345678"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 h-12 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  {/* Children Department Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Children Ministry Department *
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Toddlers (0-3 yrs)">Toddlers Nursery (0 - 3 yrs)</option>
                      <option value="Junior Church (4-8 yrs)">Junior Church (4 - 8 yrs)</option>
                      <option value="Teens Ministry (9-14 yrs)">Teens Ministry (9 - 14 yrs)</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold h-14 text-base rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-6 h-6" />
                  Generate Printable & Scannable Security Tag
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-800/60 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Security verification is enforced. Security code or QR tag must be presented to collect child.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW MODE 2: Admin Roster & Search View for Staff / Admins */}
      {viewMode === "admin" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <Input
                placeholder="Search child name, parent phone, or security code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm h-10 border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-slate-700">
              Active Check-Ins: <span className="text-indigo-600 font-extrabold text-sm">{activeCheckins.length} Children</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading active kiosk roster...</div>
            ) : filteredCheckins.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">No active check-ins found.</p>
                <p className="text-xs text-slate-400">Use self-service kiosk mode to check in children.</p>
              </div>
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
                        <td className="p-4 font-mono font-extrabold text-xs text-indigo-600">
                          <span className="bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
                            {c.security_code}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{c.child_name}</td>
                        <td className="p-4 text-xs text-slate-600">{c.department}</td>
                        <td className="p-4 text-xs text-slate-700">
                          <span className="font-semibold">{c.parent_name}</span> <br />
                          <span className="text-slate-500 font-mono">{c.parent_phone}</span>
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
                              className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
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
      )}

      {/* Modal: Parent-Child Security Badge Result (Printable & Scannable QR) */}
      <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
        <DialogContent className="sm:max-w-md text-center p-6 border-slate-800 bg-slate-950 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-extrabold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Parent-Child Security Pick-Up Tag
            </DialogTitle>
          </DialogHeader>

          {lastCheckin ? (
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 my-2 border border-slate-800 shadow-2xl">
              {/* Scannable QR Code */}
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto border-2 border-indigo-500/40">
                <img
                  src={getQRCodeUrl(
                    lastCheckin.securityCode,
                    lastCheckin.childName,
                    lastCheckin.parentName,
                    lastCheckin.parentPhone,
                    lastCheckin.department,
                    lastCheckin.timestamp
                  )}
                  alt="Scannable Security Tag QR Code"
                  width={160}
                  height={160}
                  className="rounded-xl mx-auto"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-semibold">
                Scan QR Code with mobile camera or scanner to verify pick-up tag.
              </p>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">SECURITY PICK-UP TAG CODE</p>
                <div className="text-4xl font-mono font-black text-indigo-400 tracking-widest mt-1 bg-slate-950 py-3 rounded-xl border border-indigo-500/40 shadow-lg">
                  {lastCheckin.securityCode}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs space-y-2 text-slate-300 text-left bg-slate-950/60 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Child Name:</span>
                  <span className="font-bold text-white text-sm">{lastCheckin.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Authenticated Parent:</span>
                  <span className="text-white font-semibold">{lastCheckin.parentName} ({lastCheckin.parentPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Department:</span>
                  <span className="text-indigo-300 font-semibold">{lastCheckin.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Check-In Time:</span>
                  <span className="text-slate-300 font-mono">{lastCheckin.timestamp}</span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={handlePrintBadge} variant="outline" className="w-full sm:w-1/2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950">
              <Printer className="w-4 h-4 mr-2" /> Print Security Tag
            </Button>
            <Button onClick={() => setIsBadgeOpen(false)} className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
              <CheckCircle className="w-4 h-4 mr-2" /> Done & Next Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
