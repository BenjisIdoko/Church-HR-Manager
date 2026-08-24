import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Building, Save, Globe, Mail, Phone, MapPin, Sparkles } from "lucide-react";

interface OrgSettingsTabProps {
  orgName: string; setOrgName: (val: string) => void;
  orgTagline: string; setOrgTagline: (val: string) => void;
  orgAddress: string; setOrgAddress: (val: string) => void;
  orgPhone: string; setOrgPhone: (val: string) => void;
  orgEmail: string; setOrgEmail: (val: string) => void;
  timezone: string; setTimezone: (val: string) => void;
  currency: string; setCurrency: (val: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export function OrgSettingsTab({
  orgName, setOrgName,
  orgTagline, setOrgTagline,
  orgAddress, setOrgAddress,
  orgPhone, setOrgPhone,
  orgEmail, setOrgEmail,
  timezone, setTimezone,
  currency, setCurrency,
  onSave,
}: OrgSettingsTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Building className="w-4 h-4" /> Organization Information
        </div>
        <CardTitle className="text-xl">Church Details & Locale</CardTitle>
        <CardDescription>
          Update your church's official name, address, contact details, and currency configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Church / Ministry Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Church HR Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgTagline">Motto / Tagline</Label>
              <Input
                id="orgTagline"
                value={orgTagline}
                onChange={(e) => setOrgTagline(e.target.value)}
                placeholder="Empowering Ministry Excellence"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgAddress">Headquarters Address</Label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Textarea
                id="orgAddress"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                rows={2}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgPhone">Official Phone Number</Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="orgPhone"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgEmail">Administrative Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="orgEmail"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">System Currency Symbol</Label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="₦"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Save className="w-4 h-4" /> Save Organization Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
