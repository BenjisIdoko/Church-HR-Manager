import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Building, User, Upload, Save, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SettingsProps {
  departments: string[];
  onAddDepartment: (department: string) => void;
}

export function Settings({ departments, onAddDepartment }: SettingsProps) {
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [orgAddress, setOrgAddress] = useState("123 Business St, City, Country");
  const [adminName, setAdminName] = useState("Admin User");
  const [adminEmail, setAdminEmail] = useState("admin@acme.com");
  const [autoImport, setAutoImport] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newDepartment, setNewDepartment] = useState("");

  const handleSaveOrganization = () => {
    toast.success("Organization settings saved successfully");
  };

  const handleSaveAccount = () => {
    toast.success("Account settings saved successfully");
  };

  const handleSaveImport = () => {
    toast.success("Import settings saved successfully");
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) {
      toast.error("Please type a valid department name.");
      return;
    }
    onAddDepartment(newDepartment.trim());
    setNewDepartment("");
    toast.success("Department added successfully.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground">
          Manage your system preferences and department configuration.
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Update your organization details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-address">Address</Label>
                <Textarea
                  id="org-address"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-phone">Phone Number</Label>
                <Input
                  id="org-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-email">Organization Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  placeholder="contact@organization.com"
                />
              </div>

              <Separator />

              <Button onClick={handleSaveOrganization}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Management */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Departments
              </CardTitle>
              <CardDescription>
                Add and manage departments available in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="new-department">New Department</Label>
                  <Input
                    id="new-department"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Outreach"
                  />
                </div>
                <Button className="self-end" onClick={handleAddDepartment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>

              <div className="grid gap-2">
                {departments.map((department) => (
                  <div
                    key={department}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    {department}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Account Settings
              </CardTitle>
              <CardDescription>
                Manage your admin account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <Separator />

              <div>
                <Label>Change Password</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Update your password to keep your account secure.
                </p>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Current password"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Notifications</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about attendance.
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveAccount}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
