/**
 * Clock-In System with Geolocation
 * Allows workers to clock in/out when within the configured geofence radius (default 200 meters)
 */

// Default church / auditorium location. Admins can override this in Clock-In Management.
export const CHURCH_LOCATION = {
  latitude: 9.0765,
  longitude: 7.3986,
  name: "696W+VG, Ushapa 901101, Federal Capital Territory, Nigeria",
};

// Geofence radius in meters (allowed radius)
export const GEOFENCE_RADIUS_METERS = 200;

// Service schedule constants & helpers (Thursday & Sunday services)
export const SERVICE_START_TIME = "09:00"; // formatted HH:MM
export const LATE_ARRIVAL_GRACE_MINUTES = 15; // minutes after service start considered 'on time'
export const SERVICE_DAYS_LABEL = "Thursdays & Sundays";

/**
 * Returns true if the given date falls on a service day (Thursday = 4, Sunday = 0).
 */
export function isServiceDay(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 4;
}

/**
 * Returns details about the service day status for a given date.
 */
export function getServiceDayInfo(date: Date = new Date()): {
  isServiceDay: boolean;
  serviceName: string;
} {
  const day = date.getDay();
  if (day === 0) {
    return { isServiceDay: true, serviceName: "Sunday Celebration Service" };
  }
  if (day === 4) {
    return { isServiceDay: true, serviceName: "Thursday Midweek Service" };
  }
  return { isServiceDay: false, serviceName: "Non-Service Day (Services on Thursday & Sunday)" };
}

export interface ClockInRecord {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  type: "clock-in" | "clock-out";
  latitude: number;
  longitude: number;
  distanceFromChurch: number;
  isWithinGeofence: boolean;
  source: "app" | "device";
  deviceId?: string;
  notes?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface WorkerClockStatus {
  workerId: string;
  workerName: string;
  isClockedIn: boolean;
  lastClockIn?: string;
  lastClockOut?: string;
  hoursWorkedToday: number;
  todayRecords: ClockInRecord[];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a location is within the geofence
 */
export function isWithinGeofence(
  location: LocationCoordinates,
  config: GeofenceConfig = {
    latitude: CHURCH_LOCATION.latitude,
    longitude: CHURCH_LOCATION.longitude,
    radiusMeters: GEOFENCE_RADIUS_METERS,
  }
): {
  isWithin: boolean;
  distance: number;
} {
  const distance = calculateDistance(location, {
    latitude: config.latitude,
    longitude: config.longitude,
  });
  return {
    isWithin: distance <= config.radiusMeters,
    distance,
  };
}

function isAllowedGeolocationContext(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function getGeolocationContextError(): string {
  return "Geolocation requires HTTPS outside localhost. Deploy the test app on an HTTPS host before testing location clock-in.";
}

/**
 * Get current geolocation from browser
 */
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!isAllowedGeolocationContext()) {
      reject(new Error(getGeolocationContextError()));
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied. Please enable location access."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out."));
            break;
          default:
            reject(new Error("Unable to retrieve your location"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Calculate hours worked between two timestamps
 */
export function calculateHoursWorked(clockInTime: string, clockOutTime: string): number {
  const clockIn = new Date(clockInTime);
  const clockOut = new Date(clockOutTime);
  const diffMs = clockOut.getTime() - clockIn.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Check if worker is currently within geofence using continuous updates
 */
export function watchLocation(
  onLocationUpdate: (data: {
    location: LocationCoordinates;
    isWithinGeofence: boolean;
    distance: number;
  }) => void,
  onError: (error: string) => void,
  config?: GeofenceConfig
): number | null {
  if (!isAllowedGeolocationContext()) {
    onError(getGeolocationContextError());
    return null;
  }

  if (!navigator.geolocation) {
    onError("Geolocation is not supported by your browser");
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      const { isWithin, distance } = isWithinGeofence(location, config);
      onLocationUpdate({ location, isWithinGeofence: isWithin, distance });
    },
    (error) => {
      let message = "Unable to retrieve location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location unavailable";
          break;
        case error.TIMEOUT:
          message = "Location request timeout";
          break;
      }
      onError(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );

  return watchId;
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}
