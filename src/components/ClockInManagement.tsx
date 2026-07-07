import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { toast } from "sonner";
import { Clock, MapPin, Database } from "lucide-react";
import { getClockInSettings, updateClockInSettings, getClockInsByDate, ClockInSettings } from "../utils/api";
import { formatDistance, getCurrentLocation } from "../utils/clockInService";

const defaultSettings: ClockInSettings = {
  clock_in_portal_enabled: "true",
  clock_in_portal_name: "Church Clock-In Portal",
  clock_in_portal_description: "Use this portal to clock in and out when on church grounds.",
  church_latitude: "9.2109125",
  church_longitude: "7.395359375",
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

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const data = await getClockInsByDate(today);
        setRecords(Array.isArray(data) ? data : data ? [data] : []);
      } catch (error) {
        console.error(error);
      }
    };

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
        `Location captured${location.accuracy ? ` with about ${formatDistance(location.accuracy)} accuracy` : ""}. Save geofence settings to apply it.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to capture current location.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1>Clock-In Portal Management</h1>
        <p className="text-muted-foreground">
          Configure the employee clock-in portal, manage geofence details, and review recent clock-in activity.
        </p>
      </div>

      <Tabs defaultValue="portal" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portal">Portal Settings</TabsTrigger>
          <TabsTrigger value="geofence">Geofence</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="portal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Portal Settings
              </CardTitle>
              <CardDescription>
                Control member access, portal branding, and device import availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="portal-enabled">Portal Enabled</Label>
                    <Switch
                      checked={settings.clock_in_portal_enabled === "true"}
                      onCheckedChange={(value) => updateSetting("clock_in_portal_enabled", value ? "true" : "false")}
                      id="portal-enabled"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-import-enabled">Device Import</Label>
                  <Switch
                    checked={settings.device_import_enabled === "true"}
                    onCheckedChange={(value) => updateSetting("device_import_enabled", value ? "true" : "false")}
                    id="device-import-enabled"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-name">Portal Name</Label>
                  <Input
                    id="portal-name"
                    value={settings.clock_in_portal_name}
                    onChange={(e) => updateSetting("clock_in_portal_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-description">Portal Description</Label>
                  <Textarea
                    id="portal-description"
                    value={settings.clock_in_portal_description}
                    onChange={(e) => updateSetting("clock_in_portal_description", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Member portal link</p>
                <p className="text-sm text-muted-foreground">
                  The clock-in portal is available at{' '}
                  <span className="font-semibold">/clock-in</span> for authorized member users.
                </p>
              </div>

              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? "Saving settings..." : "Save Portal Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geofence">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Geofence Configuration
              </CardTitle>
              <CardDescription>
                Define the church location and radius used for clock-in validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="church-latitude">Latitude</Label>
                  <Input
                    id="church-latitude"
                    value={settings.church_latitude}
                    onChange={(e) => updateSetting("church_latitude", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="church-longitude">Longitude</Label>
                  <Input
                    id="church-longitude"
                    value={settings.church_longitude}
                    onChange={(e) => updateSetting("church_longitude", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-radius">Radius (meters)</Label>
                  <Input
                    id="geofence-radius"
                    type="number"
                    value={settings.geofence_radius_meters}
                    onChange={(e) => updateSetting("geofence_radius_meters", e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">How it works</p>
                <p className="text-sm text-muted-foreground">
                  Members must be within the configured geofence radius to clock in using the app. Device imports are not subject to live geofence checks.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For best results, open this page at the church auditorium, allow browser location access, then capture the current location below.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleUseCurrentLocation} disabled={locating || saving || loading}>
                  {locating ? "Capturing location..." : "Use Current Location"}
                </Button>
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? "Saving geofence..." : "Save Geofence Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> Recent Clock-In Activity
              </CardTitle>
              <CardDescription>
                Review today&apos;s clock-in and clock-out records from the member portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center py-6">
                        No clock-in activity found for today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.worker_name}</TableCell>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{record.distance_from_church?.toFixed(0)} m</TableCell>
                        <TableCell>{record.source}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
