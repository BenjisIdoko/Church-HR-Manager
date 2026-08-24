import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Building, User, Bell, FolderTree, CheckCircle2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Worker } from "../types/models";
import { useSettings } from "../hooks/useSettings";
import { OrgSettingsTab } from "./settings/OrgSettingsTab";
import { DepartmentSettingsTab } from "./settings/DepartmentSettingsTab";
import { AccountSettingsTab } from "./settings/AccountSettingsTab";
import { NotificationSettingsTab } from "./settings/NotificationSettingsTab";

interface SettingsProps {
  departments: string[];
  workers?: Worker[];
  onAddDepartment: (department: string) => void;
  onEditDepartment?: (oldDepartment: string, newDepartment: string) => void;
  onRemoveDepartment?: (department: string) => void;
}

export function Settings({
  departments,
  workers = [],
  onAddDepartment,
  onEditDepartment,
  onRemoveDepartment,
}: SettingsProps) {
  const s = useSettings({
    departments,
    workers,
    onAddDepartment,
    onEditDepartment,
    onRemoveDepartment,
  });

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
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Organization</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{s.orgName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
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

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admin User</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{s.adminName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notifications</p>
              <p className="text-sm font-bold text-slate-900">SMS / Email Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="departments" className="rounded-lg gap-2 text-xs font-semibold">
            <FolderTree className="w-4 h-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="organization" className="rounded-lg gap-2 text-xs font-semibold">
            <Building className="w-4 h-4" /> Church Info
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg gap-2 text-xs font-semibold">
            <User className="w-4 h-4" /> Account & Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-2 text-xs font-semibold">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentSettingsTab
            departments={departments}
            filteredDepartments={s.filteredDepartments}
            newDepartment={s.newDepartment}
            setNewDepartment={s.setNewDepartment}
            departmentSearch={s.departmentSearch}
            setDepartmentSearch={s.setDepartmentSearch}
            isEditDeptModalOpen={s.isEditDeptModalOpen}
            setIsEditDeptModalOpen={s.setIsEditDeptModalOpen}
            editDepartmentName={s.editDepartmentName}
            setEditDepartmentName={s.setEditDepartmentName}
            editingDepartment={s.editingDepartment}
            onAddDepartmentSubmit={s.handleAddDepartmentSubmit}
            onOpenEditDepartment={s.handleOpenEditDepartment}
            onSaveEditDepartment={s.handleSaveEditDepartment}
            onRemoveDepartmentClick={s.handleRemoveDepartmentClick}
            getVolunteerCount={s.getVolunteerCount}
          />
        </TabsContent>

        <TabsContent value="organization">
          <OrgSettingsTab
            orgName={s.orgName} setOrgName={s.setOrgName}
            orgTagline={s.orgTagline} setOrgTagline={s.setOrgTagline}
            orgAddress={s.orgAddress} setOrgAddress={s.setOrgAddress}
            orgPhone={s.orgPhone} setOrgPhone={s.setOrgPhone}
            orgEmail={s.orgEmail} setOrgEmail={s.setOrgEmail}
            timezone={s.timezone} setTimezone={s.setTimezone}
            currency={s.currency} setCurrency={s.setCurrency}
            onSave={s.handleSaveOrganization}
          />
        </TabsContent>

        <TabsContent value="account">
          <AccountSettingsTab
            adminName={s.adminName} setAdminName={s.setAdminName}
            adminEmail={s.adminEmail} setAdminEmail={s.setAdminEmail}
            currentPassword={s.currentPassword} setCurrentPassword={s.setCurrentPassword}
            newPassword={s.newPassword} setNewPassword={s.setNewPassword}
            confirmPassword={s.confirmPassword} setConfirmPassword={s.setConfirmPassword}
            onSave={s.handleSaveAccount}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsTab
            emailNotifications={s.emailNotifications} setEmailNotifications={s.setEmailNotifications}
            smsNotifications={s.smsNotifications} setSmsNotifications={s.setSmsNotifications}
            whatsappReminders={s.whatsappReminders} setWhatsappReminders={s.setWhatsappReminders}
            securityAlerts={s.securityAlerts} setSecurityAlerts={s.setSecurityAlerts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
