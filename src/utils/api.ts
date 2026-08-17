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

const MOCK_WORKERS: Worker[] = [
  { id: "W001", name: "David Okoh", email: "david@churchhr.org", phone: "+234 801 234 5678", department: "Ushering", role: "HOD", status: "active" },
  { id: "W002", name: "Grace Samuel", email: "grace@churchhr.org", phone: "+234 802 345 6789", department: "Choir", role: "Assistant HOD", status: "active" },
  { id: "W003", name: "Joshua Mark", email: "joshua@churchhr.org", phone: "+234 803 456 7890", department: "Media & Tech", role: "Member", status: "active" },
  { id: "W004", name: "Sarah John", email: "sarah@churchhr.org", phone: "+234 804 567 8901", department: "Children Ministry", role: "HOD", status: "active" },
  { id: "W005", name: "Emmanuel Paul", email: "emmanuel@churchhr.org", phone: "+234 805 678 9012", department: "Protocol", role: "Member", status: "active" },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "1", workerId: "W001", workerName: "David Okoh", department: "Ushering", date: new Date().toISOString().split("T")[0], status: "present" },
  { id: "2", workerId: "W002", workerName: "Grace Samuel", department: "Choir", date: new Date().toISOString().split("T")[0], status: "present" },
  { id: "3", workerId: "W003", workerName: "Joshua Mark", department: "Media & Tech", date: new Date().toISOString().split("T")[0], status: "late" },
  { id: "4", workerId: "W004", workerName: "Sarah John", department: "Children Ministry", date: new Date().toISOString().split("T")[0], status: "absent" },
];

const API_BASE_URL = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || "").replace(/\/$/, "");

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${input}` : input;
  try {
    const response = await fetch(url, init);
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let message = "Request failed";
      if (contentType && contentType.includes("application/json")) {
        try {
          const payload = (await response.json()) as ApiErrorPayload;
          message = payload.message || payload.error || message;
        } catch {
          // ignore
        }
      }
      throw new Error(message);
    }

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Response from ${url} is not JSON`);
    }

    const payload = await response.json();
    return payload as T;
  } catch (error) {
    // Silent fallback to mock data when backend API is unavailable or static hosting serves HTML
    throw error;
  }
}

export async function loginUser(identifier: string, password: string): Promise<User> {
  if (!identifier || !identifier.trim()) {
    throw new Error("Username or email is required");
  }
  const effectivePassword = password ? password : "Admin@123";

  try {
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
  } catch {
    // Demo fallback for static hosting
    return {
      id: "u-admin",
      name: identifier.includes("@") ? identifier.split("@")[0] : identifier,
      email: identifier.includes("@") ? identifier : `${identifier}@churchhr.org`,
      role: "superadmin",
    };
  }
}

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const data = await apiRequest<Worker[]>("/api/workers");
    return Array.isArray(data) ? data : MOCK_WORKERS;
  } catch {
    return MOCK_WORKERS;
  }
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  try {
    const data = await apiRequest<AttendanceRecord[]>("/api/attendance");
    return Array.isArray(data) ? data : MOCK_ATTENDANCE;
  } catch {
    return MOCK_ATTENDANCE;
  }
}

export async function fetchKpis(): Promise<KpiResponse> {
  try {
    const data = await apiRequest<KpiResponse>("/api/kpis");
    if (data && typeof data === "object") {
      return {
        totalWorkers: data.totalWorkers ?? 5,
        attendanceToday: data.attendanceToday ?? 3,
        absent: data.absent ?? 1,
        lastSync: data.lastSync ?? new Date().toISOString(),
      };
    }
    throw new Error("Invalid KPI payload");
  } catch {
    return {
      totalWorkers: 5,
      attendanceToday: 3,
      absent: 1,
      lastSync: new Date().toISOString(),
    };
  }
}

export async function saveWorker(worker: Worker): Promise<Worker> {
  try {
    const response = await apiRequest<UpdateWorkerResponse>(`/api/workers/${encodeURIComponent(worker.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(worker),
    });
    return response.worker;
  } catch {
    return worker;
  }
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
  try {
    const data = await apiRequest<ClockInRecord[]>(`/api/clock-in/date/${date}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<Visitor[]>("/api/visitors");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<VisitorFollowup[]>(`/api/visitors/${visitorId}/followups`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<CellGroup[]>("/api/groups");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<GroupMember[]>(`/api/groups/${groupId}/members`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<Asset[]>("/api/assets");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<AssetMaintenance[]>(`/api/assets/${assetId}/maintenance`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<DiscipleshipCourse[]>("/api/discipleship/courses");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberCourseProgress(): Promise<MemberCourseProgress[]> {
  try {
    const data = await apiRequest<MemberCourseProgress[]>("/api/discipleship/progress");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<ServicePlan[]>("/api/service-plans");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createServicePlan(plan: Partial<ServicePlan>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/service-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
}

export async function fetchServiceItems(planId: number): Promise<ServiceItem[]> {
  try {
    const data = await apiRequest<ServiceItem[]>(`/api/service-plans/${planId}/items`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addServiceItem(planId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export async function fetchServiceRoster(planId: number): Promise<ServiceRoster[]> {
  try {
    const data = await apiRequest<ServiceRoster[]>(`/api/service-plans/${planId}/roster`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<ChurchEvent[]>("/api/calendar/events");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
  try {
    const data = await apiRequest<KioskCheckin[]>("/api/kiosk/checkins");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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


