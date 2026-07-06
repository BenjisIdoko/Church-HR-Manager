import { AttendanceRecord, User, Worker } from "../types/models";

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

interface LoginResponse {
  ok: boolean;
  user: User;
}

interface UpdateWorkerResponse {
  ok: boolean;
  worker: Worker;
}

interface KpiResponse {
  totalWorkers: number;
  attendanceToday: number;
  absent: number;
  lastSync: string;
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  let payload: T | ApiErrorPayload;

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message =
      (payload as ApiErrorPayload).message ||
      (payload as ApiErrorPayload).error ||
      "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function loginUser(identifier: string, password: string): Promise<User> {
  // Validate inputs before sending
  if (!identifier || !identifier.trim()) {
    throw new Error("Username or email is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  const response = await apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: identifier.trim(),
      password,
    }),
  });

  return response.user;
}

export async function fetchWorkers(): Promise<Worker[]> {
  return apiRequest<Worker[]>("/api/workers");
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  return apiRequest<AttendanceRecord[]>("/api/attendance");
}

export async function fetchKpis(): Promise<KpiResponse> {
  return apiRequest<KpiResponse>("/api/kpis");
}

export async function saveWorker(worker: Worker): Promise<Worker> {
  const response = await apiRequest<UpdateWorkerResponse>(`/api/workers/${encodeURIComponent(worker.id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(worker),
  });

  return response.worker;
}

// Clock-In System APIs
export interface ClockInRequest {
  workerId: string;
  type: "clock-in" | "clock-out";
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface ClockInResponse {
  ok: boolean;
  id: number;
  message: string;
  clockInRecord?: {
    id: number;
    workerId: string;
    workerName: string;
    type: string;
    timestamp: string;
    distance: number;
    isWithinGeofence: boolean;
  };
}

export async function recordClockIn(data: ClockInRequest): Promise<ClockInResponse> {
  return apiRequest<ClockInResponse>("/api/clock-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export interface ClockInRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_dept: string;
  external_id: string;
  timestamp: string;
  type: string;
  latitude: number;
  longitude: number;
  distance_from_church: number;
  is_within_geofence: number;
  source: string;
  device_id?: string;
  notes?: string;
}

export async function getClockInsByDate(date: string): Promise<ClockInRecord[]> {
  return apiRequest<ClockInRecord[]>(`/api/clock-in/date/${date}`);
}

export interface WorkerClockStatus {
  workerId: string;
  workerName: string;
  isClockedIn: boolean;
  todayRecords: ClockInRecord[];
  lastRecord?: ClockInRecord;
}

export async function getWorkerClockStatus(workerId: string): Promise<WorkerClockStatus> {
  return apiRequest<WorkerClockStatus>(`/api/clock-in/status/${workerId}`);
}

export interface DeviceImportRequest {
  records: Array<{
    workerId: string;
    timestamp: string;
    type: "clock-in" | "clock-out";
    deviceId?: string;
  }>;
}

export async function importDeviceClockInRecords(data: DeviceImportRequest): Promise<{ ok: boolean; message: string; imported: number }> {
  return apiRequest<{ ok: boolean; message: string; imported: number }>("/api/clock-in/import-device", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export interface ClockInSettings {
  clock_in_portal_enabled: string;
  clock_in_portal_name: string;
  clock_in_portal_description: string;
  church_latitude: string;
  church_longitude: string;
  geofence_radius_meters: string;
  device_import_enabled: string;
}

export async function getClockInSettings(): Promise<{ ok: boolean; settings: ClockInSettings }> {
  return apiRequest<{ ok: boolean; settings: ClockInSettings }>("/api/clock-in/settings");
}

export async function updateClockInSettings(settings: Partial<ClockInSettings>): Promise<{ ok: boolean; message: string; settings: ClockInSettings }> {
  return apiRequest<{ ok: boolean; message: string; settings: ClockInSettings }>("/api/clock-in/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
}
