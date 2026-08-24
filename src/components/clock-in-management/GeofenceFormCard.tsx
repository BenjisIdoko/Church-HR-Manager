import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { MapPin, Navigation, Save, Shield } from "lucide-react";
import { ClockInSettings } from "../../utils/api";
import { validateSettings } from "../../hooks/useClockInManagement";
import { toast } from "sonner";

interface GeofenceFormCardProps {
  initialSettings: ClockInSettings;
  saving: boolean;
  locating: boolean;
  onSave: (settings: ClockInSettings) => void;
  onFetchCurrentLocation: (currentSettings: ClockInSettings, updateForm: (updated: ClockInSettings) => void) => void;
}

export function GeofenceFormCard({
  initialSettings,
  saving,
  locating,
  onSave,
  onFetchCurrentLocation,
}: GeofenceFormCardProps) {
  const [formState, setFormState] = useState<ClockInSettings>(initialSettings);

  useEffect(() => {
    setFormState(initialSettings);
  }, [initialSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateSettings(formState);
    if (err) {
      toast.error(err);
      return;
    }
    onSave(formState);
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <MapPin className="w-4 h-4" /> GPS Geofence & Location Enforcement
        </div>
        <CardTitle className="text-xl">Auditorium Geofence Boundary</CardTitle>
        <CardDescription>
          Set exact GPS coordinates and acceptable radius for volunteer attendance clock-ins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <Label className="text-sm font-bold text-slate-900">Enable Mobile Clock-In Portal</Label>
              <p className="text-xs text-slate-500">Allow volunteers to clock in via GPS geofence on mobile browser.</p>
            </div>
            <Switch
              checked={formState.clock_in_portal_enabled === "true"}
              onCheckedChange={(checked) =>
                setFormState({ ...formState, clock_in_portal_enabled: checked ? "true" : "false" })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portalName">Portal Display Title</Label>
              <Input
                id="portalName"
                value={formState.clock_in_portal_name}
                onChange={(e) => setFormState({ ...formState, clock_in_portal_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalDescription">User Instructions</Label>
              <Textarea
                id="portalDescription"
                value={formState.clock_in_portal_description}
                onChange={(e) => setFormState({ ...formState, clock_in_portal_description: e.target.value })}
                rows={1}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" /> Center Coordinates & Radius
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locating}
                onClick={() => onFetchCurrentLocation(formState, setFormState)}
                className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                {locating ? "Acquiring GPS..." : "Use Current GPS Position"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lat" className="text-xs text-slate-700">Latitude</Label>
                <Input
                  id="lat"
                  value={formState.church_latitude}
                  onChange={(e) => setFormState({ ...formState, church_latitude: e.target.value })}
                  className="bg-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lng" className="text-xs text-slate-700">Longitude</Label>
                <Input
                  id="lng"
                  value={formState.church_longitude}
                  onChange={(e) => setFormState({ ...formState, church_longitude: e.target.value })}
                  className="bg-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="radius" className="text-xs text-slate-700">Geofence Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={formState.geofence_radius_meters}
                  onChange={(e) => setFormState({ ...formState, geofence_radius_meters: e.target.value })}
                  className="bg-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tolerance" className="text-xs text-slate-700 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-600" /> GPS Drift Buffer (meters)
                </Label>
                <Input
                  id="tolerance"
                  type="number"
                  value={formState.geofence_tolerance_meters}
                  onChange={(e) => setFormState({ ...formState, geofence_tolerance_meters: e.target.value })}
                  className="bg-white font-mono text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-indigo-700 font-medium">
              Enforced Geofence Boundary: <strong>{Number(formState.geofence_radius_meters) || 200}m</strong> base radius + <strong>{Number(formState.geofence_tolerance_meters) || 50}m</strong> GPS drift buffer = <strong>{(Number(formState.geofence_radius_meters) || 200) + (Number(formState.geofence_tolerance_meters) || 50)}m</strong> maximum allowed distance (enforced across client & backend API).
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Configuration..." : "Save Geofence Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
