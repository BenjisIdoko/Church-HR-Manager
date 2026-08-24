import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Bell, ShieldCheck, Mail, Phone } from "lucide-react";

interface NotificationSettingsTabProps {
  emailNotifications: boolean; setEmailNotifications: (val: boolean) => void;
  smsNotifications: boolean; setSmsNotifications: (val: boolean) => void;
  whatsappReminders: boolean; setWhatsappReminders: (val: boolean) => void;
  securityAlerts: boolean; setSecurityAlerts: (val: boolean) => void;
}

export function NotificationSettingsTab({
  emailNotifications, setEmailNotifications,
  smsNotifications, setSmsNotifications,
  whatsappReminders, setWhatsappReminders,
  securityAlerts, setSecurityAlerts,
}: NotificationSettingsTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Bell className="w-4 h-4" /> Multi-Channel Communication Rules
        </div>
        <CardTitle className="text-xl">Notification & Reminder Dispatch</CardTitle>
        <CardDescription>
          Configure broadcast channels for volunteer shift reminders, visitor follow-up prompts, and security alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900">Email Shift & Roster Notifications</Label>
              <p className="text-xs text-slate-500">Dispatch automated emails to volunteers when scheduled on Sunday rosters.</p>
            </div>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900">SMS Reminders (Twilio Gateway)</Label>
              <p className="text-xs text-slate-500">Send instant SMS reminders 2 hours before scheduled church services.</p>
            </div>
          </div>
          <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900">WhatsApp Ministry Broadcasts</Label>
              <p className="text-xs text-slate-500">Enable WhatsApp API integration for cell group leaders & department notifications.</p>
            </div>
          </div>
          <Switch checked={whatsappReminders} onCheckedChange={setWhatsappReminders} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900">Security & Backdoor Login Alerts</Label>
              <p className="text-xs text-slate-500">Receive instant alerts on failed login attempts or role elevation events.</p>
            </div>
          </div>
          <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
        </div>
      </CardContent>
    </Card>
  );
}
