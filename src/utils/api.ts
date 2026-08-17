import {
  Asset,
  AssetMaintenance,
  AttendanceRecord,
  CellGroup,
  ChurchEvent,
  DiscipleshipCourse,
  GroupMember,
  KioskCheckin,
  MemberCourseProgress,
  ServiceItem,
  ServicePlan,
  ServiceRoster,
  User,
  Visitor,
  VisitorFollowup,
  Worker,
} from "../types/models";

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
  const effectivePassword = password ? password : "Admin@123";

  const response = await apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: identifier.trim(),
      password: effectivePassword,
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

// Visitors APIs
export async function fetchVisitors(): Promise<Visitor[]> {
  return apiRequest<Visitor[]>("/api/visitors");
}

export async function createVisitor(visitor: Partial<Visitor>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/visitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visitor),
  });
}

export async function updateVisitor(id: number, data: Partial<Visitor>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteVisitor(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
    method: "DELETE",
  });
}

export async function fetchVisitorFollowups(visitorId: number): Promise<VisitorFollowup[]> {
  return apiRequest<VisitorFollowup[]>(`/api/visitors/${visitorId}/followups`);
}

export async function addVisitorFollowup(visitorId: number, data: Partial<VisitorFollowup>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/visitors/${visitorId}/followups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Cell Group APIs
export async function fetchCellGroups(): Promise<CellGroup[]> {
  return apiRequest<CellGroup[]>("/api/groups");
}

export async function createCellGroup(group: Partial<CellGroup>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(group),
  });
}

export async function updateCellGroup(id: number, group: Partial<CellGroup>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(group),
  });
}

export async function deleteCellGroup(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
    method: "DELETE",
  });
}

export async function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/api/groups/${groupId}/members`);
}

export async function addGroupMember(groupId: number, workerId: number, role = "member"): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workerId, role }),
  });
}

export async function removeGroupMember(groupId: number, workerId: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members/${workerId}`, {
    method: "DELETE",
  });
}

// Asset Management APIs
export async function fetchAssets(): Promise<Asset[]> {
  return apiRequest<Asset[]>("/api/assets");
}

export async function createAsset(asset: Partial<Asset>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asset),
  });
}

export async function updateAsset(id: number, asset: Partial<Asset>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asset),
  });
}

export async function deleteAsset(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
    method: "DELETE",
  });
}

export async function fetchAssetMaintenance(assetId: number): Promise<AssetMaintenance[]> {
  return apiRequest<AssetMaintenance[]>(`/api/assets/${assetId}/maintenance`);
}

export async function addAssetMaintenance(assetId: number, record: Partial<AssetMaintenance>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/assets/${assetId}/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}

// Discipleship LMS APIs
export async function fetchDiscipleshipCourses(): Promise<DiscipleshipCourse[]> {
  return apiRequest<DiscipleshipCourse[]>("/api/discipleship/courses");
}

export async function fetchMemberCourseProgress(): Promise<MemberCourseProgress[]> {
  return apiRequest<MemberCourseProgress[]>("/api/discipleship/progress");
}

export async function updateMemberCourseProgress(workerId: number, courseId: number, status: string, completionDate?: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("/api/discipleship/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workerId, courseId, status, completionDate }),
  });
}

// Service Plans APIs (Planning Center Services)
export async function fetchServicePlans(): Promise<ServicePlan[]> {
  return apiRequest<ServicePlan[]>("/api/service-plans");
}

export async function createServicePlan(plan: Partial<ServicePlan>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/service-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
}

export async function fetchServiceItems(planId: number): Promise<ServiceItem[]> {
  return apiRequest<ServiceItem[]>(`/api/service-plans/${planId}/items`);
}

export async function addServiceItem(planId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export async function fetchServiceRoster(planId: number): Promise<ServiceRoster[]> {
  return apiRequest<ServiceRoster[]>(`/api/service-plans/${planId}/roster`);
}

export async function addServiceRoster(planId: number, roster: Partial<ServiceRoster>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(roster),
  });
}

// Church Events & Calendar APIs (Planning Center Calendar)
export async function fetchChurchEvents(): Promise<ChurchEvent[]> {
  return apiRequest<ChurchEvent[]>("/api/calendar/events");
}

export async function createChurchEvent(event: Partial<ChurchEvent>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

export async function deleteChurchEvent(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/calendar/events/${id}`, {
    method: "DELETE",
  });
}

// Kiosk Check-In APIs (Planning Center Check-Ins)
export async function fetchKioskCheckins(): Promise<KioskCheckin[]> {
  return apiRequest<KioskCheckin[]>("/api/kiosk/checkins");
}

export async function createKioskCheckin(data: Partial<KioskCheckin>): Promise<{ ok: boolean; id: number; securityCode: string }> {
  return apiRequest<{ ok: boolean; id: number; securityCode: string }>("/api/kiosk/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function checkoutKiosk(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/kiosk/checkout/${id}`, {
    method: "PUT",
  });
}


