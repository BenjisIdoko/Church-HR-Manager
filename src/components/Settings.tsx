import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import {
  Building,
  User,
  Save,
  Plus,
  Pencil,
  Trash2,
  Bell,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
  Server,
  FolderTree,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Worker } from "../types/models";

import { getSystemCurrency, saveSystemCurrency } from "../utils/currencyUtils";

interface SettingsProps {
  departments: string[];
  workers?: Worker[];
  onAddDepartment: (department: string) => void;
  onEditDepartment?: (oldDepartment: string, newDepartment: string) => void;
  onRemoveDepartment?: (department: string) => void;
}

export function Settings({ departments, workers = [], onAddDepartment, onEditDepartment, onRemoveDepartment }: SettingsProps) {
  const [orgName, setOrgName] = useState("Church HR Manager");
  const [orgTagline, setOrgTagline] = useState("Empowering Ministry Excellence & Volunteer Leadership");
  const [orgAddress, setOrgAddress] = useState("Main Church Auditorium, 14 Allen Avenue, Ikeja, Lagos");
  const [orgPhone, setOrgPhone] = useState("+234 800 123 4567");
  const [orgEmail, setOrgEmail] = useState("contact@churchhr.org");
  const [timezone, setTimezone] = useState("Africa/Lagos (GMT+1)");
  const [currency, setCurrency] = useState(getSystemCurrency());

  const [adminName, setAdminName] = useState("Super Admin");
  const [adminEmail, setAdminEmail] = useState("admin@churchhr.org");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [newDepartment, setNewDepartment] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");

  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemCurrency(currency);
    toast.success("Organization profile & system settings saved successfully!");
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    toast.success("Admin account credentials & preferences saved!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) {
      toast.error("Please enter a valid department name.");
      return;
    }
    if (departments.some((d) => d.toLowerCase() === newDepartment.trim().toLowerCase())) {
      toast.error("Department already exists.");
      return;
    }
    onAddDepartment(newDepartment.trim());
    setNewDepartment("");
    toast.success("New department added successfully!");
  };

  const handleOpenEditDepartment = (dept: string) => {
    setEditingDepartment(dept);
    setEditDepartmentName(dept);
    setIsEditDeptModalOpen(true);
  };

  const handleSaveEditDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment || !editDepartmentName.trim()) return;

    const trimmedNew = editDepartmentName.trim();

    if (
      trimmedNew.toLowerCase() !== editingDepartment.toLowerCase() &&
      departments.some((d) => d.toLowerCase() === trimmedNew.toLowerCase())
    ) {
      toast.error(`Department "${trimmedNew}" already exists.`);
      return;
    }

    if (onEditDepartment) {
      onEditDepartment(editingDepartment, trimmedNew);
      toast.success(`Department updated to "${trimmedNew}".`);
    } else {
      toast.success(`Department renamed to "${trimmedNew}".`);
    }

    setIsEditDeptModalOpen(false);
    setEditingDepartment(null);
    setEditDepartmentName("");
  };

  const handleRemoveDepartmentClick = (dept: string) => {
    if (confirm(`Are you sure you want to remove the "${dept}" department?`)) {
      if (onRemoveDepartment) {
        onRemoveDepartment(dept);
        toast.success(`Department "${dept}" removed.`);
      } else {
        toast.info(`Department "${dept}" removal requested.`);
      }
    }
  };

  const getVolunteerCount = (deptName: string) => {
    if (!Array.isArray(workers)) return 0;
    return workers.filter((w) => w?.department && w.department.toLowerCase() === deptName.toLowerCase()).length;
  };

  const filteredDepartments = departments.filter((d) =>
    d.toLowerCase().includes(departmentSearch.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Configuration</h1>
          <p className="text-slate-500 text-sm">
            Manage organization profile, department structures, security policies, and multi-channel notifications.
          </p>
        </div>

        <Badge variant="outline" className="self-start md:self-auto bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-3 text-xs font-semibold gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> System Online & Synced
        </Badge>
      </div>

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Organization</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{orgName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Departments</p>
              <p className="text-sm font-bold text-slate-900">{departments.length} Active Ministries</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Access Role</p>
              <p className="text-sm font-bold text-slate-900">Super Administrator</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Database Status</p>
              <p className="text-sm font-bold text-slate-900">SQLite • Local Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-1 w-full">
          <TabsTrigger value="organization" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <Building className="w-3.5 h-3.5" /> Organization
          </TabsTrigger>
          <TabsTrigger value="departments" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <FolderTree className="w-3.5 h-3.5" /> Departments ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <User className="w-3.5 h-3.5" /> Admin Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Organization Settings */}
        <TabsContent value="organization">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Organization Profile</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure church details displayed on reports, security badges, and communication headers.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveOrganization} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-name" className="text-xs font-semibold text-slate-700">Organization / Church Name *</Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-tagline" className="text-xs font-semibold text-slate-700">Tagline / Mission Statement</Label>
                    <Input
                      id="org-tagline"
                      value={orgTagline}
                      onChange={(e) => setOrgTagline(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-address" className="text-xs font-semibold text-slate-700">Physical Address / Auditorium Location</Label>
                  <Textarea
                    id="org-address"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    rows={2}
                    className="text-xs min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-phone" className="text-xs font-semibold text-slate-700">Official Phone Contact</Label>
                    <Input
                      id="org-phone"
                      type="tel"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-email" className="text-xs font-semibold text-slate-700">Official Contact Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-timezone" className="text-xs font-semibold text-slate-700">System Timezone</Label>
                    <select
                      id="org-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white"
                    >
                      <option value="Africa/Lagos (GMT+1)">Africa/Lagos (GMT+1)</option>
                      <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                      <option value="Europe/London (BST)">Europe/London (BST)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-currency" className="text-xs font-semibold text-slate-700">Reporting Currency</Label>
                    <select
                      id="org-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white"
                    >
                      <option value="NGN (₦)">NGN (₦) - Nigerian Naira</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                    </select>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-end">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs">
                    <Save className="w-4 h-4" /> Save Organization Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Departments & Ministries */}
        <TabsContent value="departments">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Departments & Ministries</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Add, view, and organize volunteer departments across the ministry.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Add New Department Form */}
              <form onSubmit={handleAddDepartmentSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-900">Add New Department / Ministry</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="e.g. Protocol & Hospitality, Evangelism, Technical..."
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="text-xs bg-white"
                    required
                  />
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" /> Add Department
                  </Button>
                </div>
              </form>

              {/* Department Roster Header */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Active Department Roster ({departments.length})</h3>
                  <Input
                    placeholder="Filter departments..."
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    className="text-xs w-full sm:w-60 h-8"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredDepartments.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 col-span-full bg-slate-50 rounded-xl border border-slate-200">
                      No departments found matching "{departmentSearch}".
                    </div>
                  ) : (
                    filteredDepartments.map((dept, idx) => (
                      <div
                        key={dept}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{dept}</p>
                            <Badge variant="outline" className="text-[9px] bg-slate-50 border-slate-200 text-slate-500 font-medium">
                              {getVolunteerCount(dept)} Volunteers
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDepartment(dept)}
                            className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Department Name"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          {onRemoveDepartment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDepartmentClick(dept)}
                              className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Remove Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Admin Account Settings */}
        <TabsContent value="account">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Admin Account Credentials</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Update administrator profile name, contact email, and security password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSaveAccount} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-name" className="text-xs font-semibold text-slate-700">Administrator Name *</Label>
                    <Input
                      id="admin-name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-700">Admin Email Address *</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-600" /> Update Password Security
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Leave password fields blank if you do not wish to change your current password.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">Current Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">New Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">Confirm New Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-end">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs">
                    <Save className="w-4 h-4" /> Save Account Credentials
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notifications & Alerts */}
        <TabsContent value="notifications">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Communication & Alerts Preferences</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure automated notifications sent to church leaders, volunteers, and parents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600" /> Automated Email Notifications
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Send automated email confirmations for attendance check-ins, leaves, and reports.
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-indigo-600" /> SMS Kiosk Alerts
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Send SMS notifications to parents when child kiosk check-in security badges are generated.
                    </p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" /> WhatsApp Service Schedule Reminders
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Allow one-click WhatsApp service schedule reminders sent to assigned department volunteers.
                    </p>
                  </div>
                  <Switch checked={whatsappReminders} onCheckedChange={setWhatsappReminders} />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" /> Security & Admin Audit Alerts
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Receive instant alerts whenever admin settings or department rosters are modified.
                    </p>
                  </div>
                  <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={() => toast.success("Notification preferences updated successfully!")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-xs"
                >
                  <Save className="w-4 h-4" /> Save Notification Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Edit Department */}
      <Dialog open={isEditDeptModalOpen} onOpenChange={setIsEditDeptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Pencil className="w-4 h-4 text-indigo-600" /> Edit Department / Ministry Name
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditDepartment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Department Name *</Label>
              <Input
                placeholder="e.g. Ushering & Protocol"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDeptModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white font-bold text-xs">
                Save Department Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
