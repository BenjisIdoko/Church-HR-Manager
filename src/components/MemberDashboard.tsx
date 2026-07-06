import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { User as UserIcon, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { User, Worker } from "../types/models";

interface MemberDashboardProps {
  user: User;
  worker?: Worker;
  onUpdateProfile: (updated: { name: string; email: string; phone: string }) => Promise<void>;
}

export function MemberDashboard({ user, worker, onUpdateProfile }: MemberDashboardProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(worker?.phone ?? "");

  const handleSave = async () => {
    try {
      await onUpdateProfile({ name, email, phone });
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update your profile.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Member Profile</h1>
          <p className="text-muted-foreground">
            Update your personal details. Changes are saved and cannot delete member records.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/clock-in">Clock In Now</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Only update your details; deleting records is restricted.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-name">Full name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email address</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-phone">Phone number</Label>
              <Input
                id="member-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-department">Department</Label>
              <Input
                id="member-department"
                value={worker?.department ?? "N/A"}
                disabled
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="member-role">Role</Label>
              <Input id="member-role" value={worker?.role ?? "Member"} disabled />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                As a member, you can update your details, but deletion rights are restricted.
              </p>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500 p-3 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security Notice</CardTitle>
              <CardDescription>Record deletion is restricted to super admin only.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Your account can update personal details and stay connected to church HR records. If you need a department or role change, please contact your super admin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
