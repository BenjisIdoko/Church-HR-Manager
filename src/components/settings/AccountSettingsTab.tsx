import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User, Save, Lock, Mail } from "lucide-react";

interface AccountSettingsTabProps {
  adminName: string; setAdminName: (val: string) => void;
  adminEmail: string; setAdminEmail: (val: string) => void;
  currentPassword: string; setCurrentPassword: (val: string) => void;
  newPassword: string; setNewPassword: (val: string) => void;
  confirmPassword: string; setConfirmPassword: (val: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export function AccountSettingsTab({
  adminName, setAdminName,
  adminEmail, setAdminEmail,
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  onSave,
}: AccountSettingsTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <User className="w-4 h-4" /> Admin Account Credentials
        </div>
        <CardTitle className="text-xl">Super Admin Credentials & Security</CardTitle>
        <CardDescription>
          Update your administrator name, contact email, and account password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Administrator Full Name</Label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Login Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Password Security Updates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Save className="w-4 h-4" /> Save Account Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
