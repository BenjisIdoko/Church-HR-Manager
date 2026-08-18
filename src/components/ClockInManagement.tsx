import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { toast } from "sonner";
import { Clock, MapPin, Database, Sparkles, Navigation, Save, RefreshCw, CheckCircle2, Shield } from "lucide-react";
import { getClockInSettings, updateClockInSettings, getClockInsByDate, ClockInSettings } from "../utils/api";
import { formatDistance, getCurrentLocation } from "../utils/clockInService";

const defaultSettings: ClockInSettings = {
  clock_in_portal_enabled: "true",
  clock_in_portal_name: "Church Clock-In Portal",
  clock_in_portal_description: "Use this portal to clock in and out when on church grounds.",
  church_latitude: "9.0765",
  church_longitude: "7.3986",
  geofence_radius_meters: "200",
  device_import_enabled: "true",
};

export function ClockInManagement() {
  const [settings, setSettings] = useState<ClockInSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState("portal");
  const [records, setRecords] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getClockInSettings();
        setSettings({ ...defaultSettings, ...response.settings });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load clock-in settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const loadRecords = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await getClockInsByDate(today);
      setRecords(Array.isArray(data) ? data : data ? [data] : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSave = async () => {
    const validationError = validateSettings(settings);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await updateClockInSettings(settings);
      setSettings(response.settings);
      toast.success(response.message || "Clock-in settings updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof ClockInSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocation();
      setSettings((prev) => ({
        ...prev,
        church_latitude: location.latitude.toFixed(6),
        church_longitude: location.longitude.toFixed(6),
      }));
      toast.success(
        `Location captured${location.accuracy ? ` (accuracy: ~${formatDistance(location.accuracy)})` : ""}. Save geofence settings to apply.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to capture current location.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-hero-card p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">Clock-In Portal Management</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e0e7ff] px-3 py-0.5 text-xs font-semibold text-[#3730a3]">
              <Sparkles className="h-3.5 w-3.5 text-[#4f46e5]" /> Geofence & Hardware
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716c]">
            Configure member portal parameters, auditorium GPS geofence boundaries, and monitor live attendance logs.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl font-bold text-xs shadow-xs shrink-0"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving Changes..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="portal" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="portal" className="rounded-lg text-xs font-semibold">Portal Configuration</TabsTrigger>
          <TabsTrigger value="geofence" className="rounded-lg text-xs font-semibold">GPS Geofence</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-xs font-semibold">Live Activity</TabsTrigger>
        </TabsList>

        {/* Portal Settings Tab */}
        <TabsContent value="portal" className="mt-3">
          <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#4f46e5]" />
                <CardTitle className="text-base font-bold text-[#1c1917]">Member Access & Branding</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Manage whether members can clock in from their phones and customize portal title text.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <Label htmlFor="portal-enabled" className="text-sm font-bold text-[#1c1917]">Enable Member Clock-In</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Allows members to check in via /clock-in</p>
                  </div>
                  <Switch
                    checked={settings.clock_in_portal_enabled === "true"}
                    onCheckedChange={(val) => updateSetting("clock_in_portal_enabled", val ? "true" : "false")}
                    id="portal-enabled"
                  />
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <Label htmlFor="device-import-enabled" className="text-sm font-bold text-[#1c1917]">Enable Hardware Device Import</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Allows importing device CSV logs</p>
                  </div>
                  <Switch
                    checked={settings.device_import_enabled === "true"}
                    onCheckedChange={(val) => updateSetting("device_import_enabled", val ? "true" : "false")}
                    id="device-import-enabled"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-name" className="text-xs font-semibold uppercase text-slate-600">Portal Display Name</Label>
                  <Input
                    id="portal-name"
                    value={settings.clock_in_portal_name}
                    onChange={(e) => updateSetting("clock_in_portal_name", e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-[#4f46e5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portal-description" className="text-xs font-semibold uppercase text-slate-600">Portal Description</Label>
                  <Textarea
                    id="portal-description"
                    value={settings.clock_in_portal_description}
                    onChange={(e) => updateSetting("clock_in_portal_description", e.target.value)}
                    rows={3}
                    className="rounded-xl border-slate-200 focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#4f46e5]/30 bg-[#e0e7ff]/30 p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#4f46e5] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#3730a3]">Member Direct Link</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Authorized members can access their clock-in screen directly at <span className="font-mono font-bold text-[#4f46e5]">/clock-in</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geofence Configuration Tab */}
        <TabsContent value="geofence" className="mt-3">
          <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#4f46e5]" />
                <CardTitle className="text-base font-bold text-[#1c1917]">GPS Coordinates & Radius</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Set exact auditorium GPS latitude and longitude coordinates for mobile location verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="church-latitude" className="text-xs font-semibold uppercase text-slate-600">Latitude</Label>
                  <Input
                    id="church-latitude"
                    value={settings.church_latitude}
                    onChange={(e) => updateSetting("church_latitude", e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-[#4f46e5] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="church-longitude" className="text-xs font-semibold uppercase text-slate-600">Longitude</Label>
                  <Input
                    id="church-longitude"
                    value={settings.church_longitude}
                    onChange={(e) => updateSetting("church_longitude", e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-[#4f46e5] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-radius" className="text-xs font-semibold uppercase text-slate-600">Radius Threshold (meters)</Label>
                  <Input
                    id="geofence-radius"
                    type="number"
                    value={settings.geofence_radius_meters}
                    onChange={(e) => updateSetting("geofence_radius_meters", e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-[#4f46e5] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-xs font-bold text-[#1c1917]">Live Location Capture</p>
                <p className="text-xs text-slate-500">
                  Stand inside the church auditorium on your mobile or laptop, click <strong>"Capture Current GPS Coordinates"</strong>, and save settings.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={locating || saving || loading}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 text-xs"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1.5 text-[#4f46e5]" />
                  {locating ? "Capturing Location..." : "Capture Current GPS Coordinates"}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs font-bold"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? "Saving..." : "Save Geofence Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Activity Log Tab */}
        <TabsContent value="activity" className="mt-3">
          <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#4f46e5]" />
                  <CardTitle className="text-base font-bold text-[#1c1917]">Today's Activity Log</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadRecords} className="rounded-xl border-slate-200 text-xs">
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-[#4f46e5]" /> Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-700 uppercase">Volunteer</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 uppercase">Action</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 uppercase">Timestamp</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 uppercase">Proximity</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700 uppercase">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-slate-500 text-center py-8 text-xs">
                          No clock-in activity recorded for today yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record, i) => (
                        <TableRow key={record.id || i} className="hover:bg-slate-50/60">
                          <TableCell className="text-xs font-bold text-[#1c1917]">{record.worker_name || record.name || "Volunteer"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              record.type === "clock-in" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {record.type === "clock-in" ? "Clock-In" : "Clock-Out"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">
                            {new Date(record.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">
                            {record.distance_from_church !== undefined ? `${record.distance_from_church?.toFixed(0)}m` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 capitalize">{record.source || "web"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function validateSettings(settings: ClockInSettings): string | null {
  const latitude = Number(settings.church_latitude);
  const longitude = Number(settings.church_longitude);
  const radius = Number(settings.geofence_radius_meters);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return "Church latitude must be a number between -90 and 90.";
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return "Church longitude must be a number between -180 and 180.";
  }

  if (!Number.isFinite(radius) || radius <= 0 || radius > 10000) {
    return "Geofence radius must be greater than 0 and no more than 10,000 meters.";
  }

  return null;
}
