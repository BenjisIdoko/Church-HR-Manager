import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { User as UserIcon, Save, ShieldCheck, Plus, X, Building2 } from "lucide-react";
import { toast } from "sonner";
import { User, Worker } from "../types/models";

interface MemberDashboardProps {
  user: User;
  worker?: Worker;
  departments?: string[];
  onUpdateProfile: (updated: { name: string; email: string; phone: string; department?: string; departments?: string[] }) => Promise<void>;
}

const DEFAULT_DEPARTMENTS = [
  "Intercessors",
  "Hospitality",
  "Greeters",
  "Ushers",
  "Media",
  "Response Team",
  "Creative Team",
  "Protocol",
  "Logistics",
  "Finance",
  "Welfare",
  "Sanctuary",
  "Events/Program",
  "TCC/Ushafa Children",
];

export function MemberDashboard({ user, worker, departments = DEFAULT_DEPARTMENTS, onUpdateProfile }: MemberDashboardProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(worker?.phone ?? "");
  
  // Parse initial departments list
  const initialDepts = worker?.department
    ? worker.department.split(",").map((d) => d.trim()).filter(Boolean)
    : [];
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    initialDepts.length > 0 ? Array.from(new Set(initialDepts)) : ["General Workforce"]
  );
  const [customDept, setCustomDept] = useState("");

  const handleAddDept = (deptName: string) => {
    const trimmed = deptName.trim();
    if (!trimmed) return;
    if (!selectedDepts.includes(trimmed)) {
      setSelectedDepts([...selectedDepts, trimmed]);
    }
    setCustomDept("");
  };

  const handleRemoveDept = (deptName: string) => {
    if (selectedDepts.length <= 1) {
      toast.error("You must belong to at least one department.");
      return;
    }
    setSelectedDepts(selectedDepts.filter((d) => d !== deptName));
  };

  const handleSave = async () => {
    try {
      const departmentString = selectedDepts.join(", ");
      await onUpdateProfile({
        name,
        email,
        phone,
        department: departmentString,
        departments: selectedDepts,
      });
      toast.success("Your profile and department details have been updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update your profile.");
    }
  };

  const allAvailableDepts = Array.from(new Set([...departments, ...DEFAULT_DEPARTMENTS]));

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1917]">Volunteer Profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your contact details and active department assignments.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-[#c85a32] text-white hover:bg-[#b04b27] self-start sm:self-auto">
          <Link to="/clock-in">Clock In Now</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#c85a32] p-3 text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal & Workforce Profile</CardTitle>
              <CardDescription>You can update your name, email, phone number, and assigned departments.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-name" className="text-xs font-semibold uppercase text-slate-600">Full Name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email" className="text-xs font-semibold uppercase text-slate-600">Email Address</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-phone" className="text-xs font-semibold uppercase text-slate-600">Phone Number</Label>
              <Input
                id="member-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role" className="text-xs font-semibold uppercase text-slate-600">System Role</Label>
              <Input id="member-role" value={worker?.role ?? "Member"} disabled className="bg-slate-50 text-slate-500 rounded-xl" />
            </div>
          </div>

          {/* Multi-Department Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#c85a32]" />
                <Label className="text-xs font-semibold uppercase text-slate-700">Assigned Department(s)</Label>
              </div>
              <span className="text-xs text-slate-500">Volunteers can belong to multiple departments</span>
            </div>

            {/* Active Selected Departments */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[48px] items-center">
              {selectedDepts.map((dept) => (
                <Badge
                  key={dept}
                  className="bg-[#c85a32] text-white hover:bg-[#b04b27] px-3 py-1 text-xs flex items-center gap-1.5 rounded-lg shadow-2xs"
                >
                  <span>{dept}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDept(dept)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                    title="Remove department"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Department Picker & Add Custom */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Add to another department:</p>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableDepts
                  .filter((d) => !selectedDepts.includes(d))
                  .map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleAddDept(dept)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-[#fbeee8] hover:border-[#c85a32] hover:text-[#c85a32] text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {dept}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Or type custom department name..."
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDept(customDept);
                    }
                  }}
                  className="text-xs rounded-xl border-slate-200"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddDept(customDept)}
                  disabled={!customDept.trim()}
                  className="rounded-xl shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Your contact info and department assignments update live across church records.
            </p>
            <Button onClick={handleSave} className="bg-[#c85a32] text-white hover:bg-[#b04b27] rounded-xl px-6">
              <Save className="h-4 w-4 mr-2" />
              Save Profile Updates
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500 p-3 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Security & Authorization</CardTitle>
              <CardDescription>Super admins have administrative oversight while members manage their own contact profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600 leading-relaxed">
            As a volunteer, you have full control over updating your email address, phone number, and active department assignments. Deleting worker history is restricted to Super Admin access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
