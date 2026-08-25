import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Baby, UserCheck, Phone, ShieldCheck } from "lucide-react";

interface KioskFormCardProps {
  childName: string; setChildName: (val: string) => void;
  parentName: string; setParentName: (val: string) => void;
  parentPhone: string; setParentPhone: (val: string) => void;
  department: string; setDepartment: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function KioskFormCard({
  childName, setChildName,
  parentName, setParentName,
  parentPhone, setParentPhone,
  department, setDepartment,
  submitting,
  onSubmit,
}: KioskFormCardProps) {
  return (
    <Card className="border-indigo-100 shadow-xl bg-white/95 backdrop-blur-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Baby className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Express Child Check-In</CardTitle>
            <CardDescription className="text-indigo-200">
              Register child arrival & generate secure pickup verification code.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Baby className="w-4 h-4 text-indigo-600" /> Child's Full Name
            </label>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Samuel Chukwuemeka"
              className="h-12 text-base rounded-xl border-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Parent / Guardian Name
              </label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent's Name"
                className="h-12 text-base rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-600" /> Guardian Phone Number
              </label>
              <Input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="h-12 text-base rounded-xl border-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Junior Department Class
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 px-3.5 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Toddler Care (0-3 yrs)">Toddler Care (0-3 yrs)</option>
              <option value="Junior Church (4-8 yrs)">Junior Church (4-8 yrs)</option>
              <option value="Pre-Teens Class (9-12 yrs)">Pre-Teens Class (9-12 yrs)</option>
              <option value="Teens Church (13-17 yrs)">Teens Church (13-17 yrs)</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm sm:text-base md:text-lg rounded-2xl shadow-lg shadow-indigo-200 transition-all gap-1.5 sm:gap-2 px-3 sm:px-4"
          >
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            {submitting ? (
              <span className="whitespace-nowrap">Processing Check-In...</span>
            ) : (
              <span className="whitespace-nowrap">
                Complete Check-In<span className="hidden sm:inline"> &amp; Get Badge</span>
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
