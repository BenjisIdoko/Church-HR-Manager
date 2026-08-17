import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { MapPin, Clock, AlertCircle, CheckCircle, Loader, Calendar } from "lucide-react";
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
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>({
    latitude: CHURCH_LOCATION.latitude,
    longitude: CHURCH_LOCATION.longitude,
    radiusMeters: GEOFENCE_RADIUS_METERS,
  });
  const [portalEnabled, setPortalEnabled] = useState(true);

  // Fetch initial clock status
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
      return;
    }

    if (distance === null) {
      setError("Unable to determine your location. Please ensure location services are enabled.");
      return;
    }

    if (!portalEnabled) {
      setError("Clock-in portal is currently disabled.");
      return;
    }

    if (!isWithin) {
      setError(`You are ${formatDistance(distance)} from the church. You must be within ${geofenceConfig.radiusMeters} meters to clock in.`);
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
        notes: `${type} via mobile app`,
      });

      if (response.ok) {
        setSuccess(response.message);
        // Refresh clock status
        const updatedStatus = await getWorkerClockStatus(user.workerId);
        setClockStatus(updatedStatus);
      } else {
        setError(response.message || "Failed to record clock in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record clock in");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const statusColor = isWithin ? "text-green-600" : "text-red-600";
  const statusBg = isWithin ? "bg-green-50" : "bg-red-50";

  const serviceInfo = getServiceDayInfo();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Clock In/Out</h1>
        <p className="text-muted-foreground">
          Check in when you arrive at church for Thursday & Sunday services
        </p>
      </div>

      {/* Service Schedule Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${serviceInfo.isServiceDay ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'}`}>
        <Calendar className={`h-6 w-6 shrink-0 ${serviceInfo.isServiceDay ? 'text-emerald-600' : 'text-indigo-600'}`} />
        <div>
          <p className="font-semibold text-sm">Service Days: Thursdays & Sundays</p>
          <p className="text-xs mt-0.5 opacity-90">
            {serviceInfo.isServiceDay
              ? `🟢 Today is a Service Day (${serviceInfo.serviceName}). Attendance recording is active.`
              : `ℹ️ Today is a Non-Service Day. Service attendance is recorded on Thursdays and Sundays.`}
          </p>
        </div>
      </div>

      {/* Location Status Card */}
      <Card className={statusBg}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className={`w-5 h-5 ${statusColor}`} />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Distance from Church</p>
              <p className={`text-2xl font-bold ${statusColor}`}>
                {distance !== null ? formatDistance(distance) : "Loading..."}
              </p>
              {accuracy !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  GPS accuracy: approximately {formatDistance(accuracy)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={isWithin ? "bg-green-600" : "bg-red-600"}>
                {isWithin ? `Within ${geofenceConfig.radiusMeters}m` : "Out of Range"}
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Clock In/Out Button */}
      <Card>
        <CardHeader>
          <CardTitle>Clock In/Out</CardTitle>
          <CardDescription>
            {clockStatus?.isClockedIn ? "You are currently clocked in" : "You are not clocked in"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clockStatus && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="text-lg font-semibold">
                    {clockStatus.isClockedIn ? "Clocked In" : "Clocked Out"}
                  </p>
                  {clockStatus.lastRecord && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Last {clockStatus.lastRecord.type === "clock-in" ? "clocked in" : "clocked out"}:{" "}
                      {formatTime(clockStatus.lastRecord.timestamp)}
                    </p>
                  )}
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          )}

          <Button
            onClick={handleClockInOut}
            disabled={loading || !portalEnabled || !isWithin || distance === null}
            size="lg"
            className="w-full"
            variant={clockStatus?.isClockedIn ? "destructive" : "default"}
          >
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Processing..." : clockStatus?.isClockedIn ? "Clock Out" : "Clock In"}
          </Button>

          {!isWithin && distance !== null && (
            <p className="text-sm text-amber-600 text-center">
              Move closer to the church to clock in (within {geofenceConfig.radiusMeters} meters)
            </p>
          )}

          {!portalEnabled && (
            <p className="text-sm text-red-600 text-center">
              Clock-in portal is currently disabled by an administrator.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Records */}
      {clockStatus && clockStatus.todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Records</CardTitle>
            <CardDescription>{formatDate(clockStatus.todayRecords[0].timestamp)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clockStatus.todayRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatTime(record.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === "clock-in" ? "default" : "secondary"}>
                        {record.type === "clock-in" ? "In" : "Out"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDistance(record.distance_from_church)}</TableCell>
                    <TableCell className="capitalize">{record.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Church Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Church Location</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Auditorium Latitude:</strong> {geofenceConfig.latitude}
          </p>
          <p>
            <strong>Auditorium Longitude:</strong> {geofenceConfig.longitude}
          </p>
          <p>
            <strong>Allowed Radius (m):</strong> {geofenceConfig.radiusMeters}
          </p>
          <p>
            <strong>Service Start Time:</strong> {SERVICE_START_TIME}
          </p>
          <p>
            <strong>Late Arrival Grace (minutes):</strong> {LATE_ARRIVAL_GRACE_MINUTES}
          </p>
          <p>
            <strong>Note:</strong> Make sure location services are enabled on your device for accurate clock in/out recording.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
