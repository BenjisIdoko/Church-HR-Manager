import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { MapPin, Clock, AlertCircle, CheckCircle, Loader, Calendar, ShieldCheck, Navigation, Radio, Compass } from "lucide-react";
import { User } from "../types/models";
import {
  getCurrentLocation,
  formatDistance,
  watchLocation,
  stopWatchingLocation,
  CHURCH_LOCATION,
  GEOFENCE_RADIUS_METERS,
  SERVICE_START_TIME,
  LATE_ARRIVAL_GRACE_MINUTES,
  GeofenceConfig,
  getServiceDayInfo,
} from "../utils/clockInService";
import { getClockInSettings, recordClockIn, getWorkerClockStatus, WorkerClockStatus } from "../utils/api";
import { toast } from "sonner";

interface ClockInScreenProps {
  user: User;
}

function parseGeofenceNumber(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ClockInScreen({ user }: ClockInScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isWithin, setIsWithin] = useState(false);
  const [clockStatus, setClockStatus] = useState<WorkerClockStatus | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>({
    latitude: CHURCH_LOCATION.latitude,
    longitude: CHURCH_LOCATION.longitude,
    radiusMeters: GEOFENCE_RADIUS_METERS,
  });
  const [portalEnabled, setPortalEnabled] = useState(true);

  // Live Digital Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial clock status & settings
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const settingsResponse = await getClockInSettings();
        const settings = settingsResponse.settings;
        setPortalEnabled(settings.clock_in_portal_enabled === "true");
        setGeofenceConfig({
          latitude: parseGeofenceNumber(settings.church_latitude, CHURCH_LOCATION.latitude),
          longitude: parseGeofenceNumber(settings.church_longitude, CHURCH_LOCATION.longitude),
          radiusMeters: parseGeofenceNumber(settings.geofence_radius_meters, GEOFENCE_RADIUS_METERS),
        });

        if (user.workerId) {
          const status = await getWorkerClockStatus(user.workerId);
          setClockStatus(status);
        }
      } catch (err) {
        console.error("Failed to fetch clock status:", err);
      }
    };

    fetchStatus();
  }, [user.workerId]);

  // Start watching location
  useEffect(() => {
    const watchId = watchLocation(
      (data) => {
        setDistance(data.distance);
        setAccuracy(data.location.accuracy ?? null);
        setIsWithin(data.isWithinGeofence);
      },
      (err) => {
        setError(err);
      },
      geofenceConfig
    );

    return () => {
      if (watchId !== null) {
        stopWatchingLocation(watchId);
      }
    };
  }, [geofenceConfig]);

  const handleClockInOut = async () => {
    if (!user.workerId) {
      setError("User worker ID not found");
      toast.error("User worker ID not found");
      return;
    }

    if (distance === null) {
      setError("Unable to determine your location. Please enable browser location services.");
      toast.error("Unable to determine your location.");
      return;
    }

    if (!portalEnabled) {
      setError("Clock-in portal is currently disabled by administrators.");
      toast.error("Clock-in portal is currently disabled.");
      return;
    }

    if (!isWithin) {
      const msg = `You are ${formatDistance(distance)} from church grounds. You must be within ${geofenceConfig.radiusMeters}m to clock in.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const location = await getCurrentLocation();
      const type = clockStatus?.isClockedIn ? "clock-out" : "clock-in";

      const response = await recordClockIn({
        workerId: user.workerId,
        type,
        latitude: location.latitude,
        longitude: location.longitude,
        notes: `${type} via member web app`,
      });

      if (response.ok) {
        setSuccess(response.message);
        toast.success(response.message);
        const updatedStatus = await getWorkerClockStatus(user.workerId);
        setClockStatus(updatedStatus);
      } else {
        setError(response.message || "Failed to record clock in");
        toast.error(response.message || "Failed to record clock in");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record clock in";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  };

  const serviceInfo = getServiceDayInfo();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-hero-card p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">Volunteer Clock-In Portal</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e0e7ff] px-3 py-0.5 text-xs font-semibold text-[#3730a3]">
              <Radio className="h-3.5 w-3.5 text-[#4f46e5] animate-pulse" /> Live Geofence
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716c]">
            Record your presence when arriving on church auditorium grounds for Thursday & Sunday services.
          </p>
        </div>

        {/* Live Digital Clock Badge */}
        <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
          <div className="p-2 bg-[#4f46e5]/10 text-[#4f46e5] rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-[#1c1917] tracking-wider font-mono">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">{formatDate(currentTime.toISOString())}</p>
          </div>
        </div>
      </div>

      {/* Service Schedule Banner */}
      <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${serviceInfo.isServiceDay ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950' : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${serviceInfo.isServiceDay ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Service Schedule: Thursdays & Sundays</p>
            <p className="text-xs opacity-90 mt-0.5">
              {serviceInfo.isServiceDay
                ? `🟢 Today is a Service Day (${serviceInfo.serviceName}). Attendance recording is active.`
                : `ℹ️ Today is a Non-Service Day. Official service attendance records populate on Thursdays and Sundays.`}
            </p>
          </div>
        </div>
        <Badge className={serviceInfo.isServiceDay ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}>
          {serviceInfo.isServiceDay ? "Active Day" : "Off-Day"}
        </Badge>
      </div>

      {/* Primary Action Hero Card */}
      <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden text-center">
        <CardContent className="p-8 space-y-6">
          {/* Main Tactile Action Button */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              {/* Outer Pulse Rings */}
              {isWithin && portalEnabled && !loading && (
                <span className="absolute -inset-3 rounded-full bg-[#4f46e5]/20 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={handleClockInOut}
                disabled={loading || !portalEnabled || !isWithin || distance === null}
                className={`relative h-44 w-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  clockStatus?.isClockedIn
                    ? "bg-gradient-to-br from-rose-500 to-red-600 border-rose-300 text-white shadow-rose-500/30 hover:from-rose-600 hover:to-red-700"
                    : isWithin
                    ? "bg-gradient-to-br from-[#4f46e5] to-[#2563eb] border-indigo-300 text-white shadow-[#4f46e5]/40 hover:from-[#4338ca] hover:to-[#1d4ed8] scale-105"
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader className="h-10 w-10 animate-spin text-white" />
                ) : clockStatus?.isClockedIn ? (
                  <>
                    <Clock className="h-10 w-10 mb-1" />
                    <span className="text-lg font-extrabold uppercase tracking-wider">Clock Out</span>
                    <span className="text-[10px] opacity-80 mt-0.5">End Service Duty</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-10 w-10 mb-1" />
                    <span className="text-lg font-extrabold uppercase tracking-wider">Clock In</span>
                    <span className="text-[10px] opacity-80 mt-0.5">Record Arrival</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Guidance Message */}
            <div className="max-w-md space-y-1">
              <p className="text-sm font-bold text-[#1c1917]">
                {clockStatus?.isClockedIn ? "You are currently Clocked In" : "Ready to Clock In"}
              </p>
              <p className="text-xs text-slate-500">
                {!portalEnabled
                  ? "Portal is disabled by administration."
                  : !isWithin && distance !== null
                  ? `Move closer to church grounds (${formatDistance(distance)} away, threshold: ${geofenceConfig.radiusMeters}m).`
                  : distance === null
                  ? "Acquiring GPS satellite position..."
                  : "You are on church grounds. Tap above to register your timestamp."}
              </p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <Alert variant="destructive" className="max-w-lg mx-auto rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="max-w-lg mx-auto rounded-xl border-emerald-200 bg-emerald-50 text-emerald-900">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs font-semibold ml-1">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GPS Location & Distance Gauge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Geofence Proximity Card */}
        <Card className="border-0 shadow-xs bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#4f46e5]" />
                <CardTitle className="text-sm font-bold text-[#1c1917]">GPS Geofence Proximity</CardTitle>
              </div>
              <Badge className={isWithin ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}>
                {isWithin ? "In Range" : "Out of Range"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Distance from Church:</span>
              <span className={`font-bold text-base ${isWithin ? "text-emerald-600" : "text-rose-600"}`}>
                {distance !== null ? formatDistance(distance) : "Calculating..."}
              </span>
            </div>

            {/* Visual Distance Gauge Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 transition-all duration-500 rounded-full ${
                    isWithin ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, distance !== null ? (distance / (geofenceConfig.radiusMeters * 2)) * 100 : 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0m (Auditorium)</span>
                <span>Allowed: {geofenceConfig.radiusMeters}m</span>
              </div>
            </div>

            {accuracy !== null && (
              <p className="text-[11px] text-slate-400">
                Device GPS accuracy: ±{formatDistance(accuracy)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location Specs Card */}
        <Card className="border-0 shadow-xs bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#4f46e5]" />
              <CardTitle className="text-sm font-bold text-[#1c1917]">Auditorium Geofence Specs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Auditorium Latitude:</span>
              <span className="font-mono text-slate-800">{geofenceConfig.latitude}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Auditorium Longitude:</span>
              <span className="font-mono text-slate-800">{geofenceConfig.longitude}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Service Start Time:</span>
              <span className="font-semibold text-slate-800">{SERVICE_START_TIME}</span>
            </div>
            <div className="flex justify-between">
              <span>Late Grace Window:</span>
              <span className="font-semibold text-slate-800">{LATE_ARRIVAL_GRACE_MINUTES} mins</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Clock-In Records Table */}
      {clockStatus && clockStatus.todayRecords.length > 0 && (
        <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[#1c1917]">Today's Activity Log</CardTitle>
              <span className="text-xs text-slate-500">{formatDate(clockStatus.todayRecords[0].timestamp)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-700 uppercase">Timestamp</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 uppercase">Action</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 uppercase">Distance</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 uppercase">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clockStatus.todayRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-xs font-mono font-bold text-[#1c1917]">
                        {formatTime(record.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.type === "clock-in"
                              ? "bg-emerald-100 text-emerald-700 font-bold"
                              : "bg-rose-100 text-rose-700 font-bold"
                          }
                        >
                          {record.type === "clock-in" ? "Clock-In" : "Clock-Out"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDistance(record.distance_from_church)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 capitalize">{record.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
