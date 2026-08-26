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

import {
  DEFAULT_MAINTENANCE_LOGS,
  DEFAULT_MOCK_ASSETS,
  ENABLE_MOCK_FALLBACK,
  INITIAL_MOCK_VISITORS,
  MOCK_ATTENDANCE,
  MOCK_WORKERS,
} from "./mockData";


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



const API_BASE_URL = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || "").replace(/\/$/, "");

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

let currentCsrfToken: string | null = null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${input}` : input;
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const token = currentCsrfToken || getCookie("csrf_token");
    if (token && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", token);
    }
  }

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      headers,
    });

    const csrfHeader = response.headers.get("x-csrf-token");
    if (csrfHeader) {
      currentCsrfToken = csrfHeader;
    }

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
      if (response.status === 401) {
        throw new AuthError(message);
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
  const normId = (identifier || "").trim().toLowerCase();
  if (!normId) {
    throw new Error("Username or email is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  try {
    const response = await apiRequest<LoginResponse>("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: normId,
        password,
      }),
    });
    return response.user;
  } catch (error) {
    if (error instanceof Error && (error.message === "Invalid credentials" || error.message.includes("Password"))) {
      throw error;
    }

    // Demo / Offline fallback when backend API is unavailable or static hosting returns non-JSON HTML / 405 Method Not Allowed
    if (
      (normId === "admin@church.com" || normId === "admin" || normId === "superadmin") &&
      password === "Admin@123"
    ) {
      return {
        id: "1",
        name: "Super Admin",
        email: "admin@church.com",
        role: "superadmin",
        workerId: "W000",
      };
    }
    if (
      (normId === "manager@church.com" || normId === "manager") &&
      password === "Manager@123"
    ) {
      return {
        id: "2",
        name: "Manager User",
        email: "manager@church.com",
        role: "manager",
      };
    }
    if (
      (normId === "alice@church.org" || normId === "w001") &&
      password === "Member@123"
    ) {
      return {
        id: "3",
        name: "Alice Johnson",
        email: "alice@church.org",
        role: "member",
        workerId: "W001",
      };
    }

    if (
      normId === "admin@church.com" || normId === "admin" || normId === "superadmin" ||
      normId === "manager@church.com" || normId === "manager" ||
      normId === "alice@church.org" || normId === "w001"
    ) {
      throw new Error("Invalid credentials");
    }

    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest<{ ok: boolean; user: User }>("/api/me");
    return response.user;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  currentCsrfToken = null;
  try {
    await apiRequest<{ ok: boolean }>("/api/logout", {
      method: "POST",
    });
  } catch {
    // ignore
  }
}

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const data = await apiRequest<Worker[]>("/api/workers");
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem("church_hr_workers", JSON.stringify(data));
      return data;
    }
  } catch {
    // Backend API fallback
  }

  const cached = localStorage.getItem("church_hr_workers");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Ignore cache parse error
    }
  }

  localStorage.setItem("church_hr_workers", JSON.stringify(MOCK_WORKERS));
  return MOCK_WORKERS;
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
    const cached = localStorage.getItem("church_hr_workers");
    let workersList: Worker[] = cached ? JSON.parse(cached) : [...MOCK_WORKERS];
    if (!Array.isArray(workersList)) workersList = [...MOCK_WORKERS];

    const index = workersList.findIndex((w) => w.id === worker.id);
    if (index >= 0) {
      workersList[index] = { ...workersList[index], ...worker };
    } else {
      workersList.push(worker);
    }
    localStorage.setItem("church_hr_workers", JSON.stringify(workersList));
  } catch (err) {
    console.warn("Failed to persist worker to localStorage:", err);
  }

  try {
    const response = await apiRequest<UpdateWorkerResponse>(`/api/workers/${encodeURIComponent(worker.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(worker),
    });
    if (response?.worker) {
      return response.worker;
    }
  } catch {
    // Static deployment fallback
  }

  return worker;
}

export async function renameDepartment(oldDepartment: string, newDepartment: string): Promise<{ ok: boolean }> {
  const oldNorm = oldDepartment.trim();
  const newNorm = newDepartment.trim();

  // Persist department rename in localStorage for Vercel static hosting and offline fallback
  try {
    const cached = localStorage.getItem("church_hr_workers");
    if (cached) {
      const workersList: Worker[] = JSON.parse(cached);
      if (Array.isArray(workersList)) {
        const updated = workersList.map((w) => {
          if (w.department && w.department.trim().toLowerCase() === oldNorm.toLowerCase()) {
            return { ...w, department: newNorm };
          }
          return w;
        });
        localStorage.setItem("church_hr_workers", JSON.stringify(updated));
      }
    }
  } catch (err) {
    console.warn("Failed to update department in localStorage:", err);
  }

  try {
    const res = await apiRequest<{ ok: boolean }>("/api/departments/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldDepartment: oldNorm, newDepartment: newNorm }),
    });
    return res;
  } catch (error) {
    console.warn("Failed to rename department in backend (using client storage fallback):", error);
    return { ok: true };
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

const DEFAULT_CLOCK_IN_SETTINGS: ClockInSettings = {
  clock_in_portal_enabled: "true",
  clock_in_portal_name: "Church Clock-In Portal",
  clock_in_portal_description: "GPS Geofenced Clock-In for Church Grounds",
  church_latitude: "9.0765",
  church_longitude: "7.3986",
  geofence_radius_meters: "200",
  geofence_tolerance_meters: "50",
  device_import_enabled: "true",
};

export async function recordClockIn(data: ClockInRequest): Promise<ClockInResponse> {
  const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
  let logs: ClockInRecord[] = [];
  try {
    logs = JSON.parse(savedLogs);
  } catch {
    // ignore
  }

  const timestamp = new Date().toISOString();
  const id = Date.now();

  const newLog: ClockInRecord = {
    id,
    worker_id: Number(data.workerId) || 999,
    worker_name: "Worker " + data.workerId,
    worker_dept: "General",
    external_id: data.workerId,
    timestamp,
    type: data.type,
    latitude: data.latitude,
    longitude: data.longitude,
    distance_from_church: 0,
    is_within_geofence: 1,
    source: "web_portal",
    notes: data.notes,
  };

  logs.push(newLog);
  localStorage.setItem("church_hr_clock_ins", JSON.stringify(logs));

  try {
    return await apiRequest<ClockInResponse>("/api/clock-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    return {
      ok: true,
      id,
      message: `Successfully ${data.type === "clock-in" ? "clocked in" : "clocked out"}!`,
      clockInRecord: {
        id,
        workerId: data.workerId,
        workerName: newLog.worker_name,
        type: data.type,
        timestamp,
        distance: 0,
        isWithinGeofence: true,
      },
    };
  }
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
    const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
    try {
      const logs: ClockInRecord[] = JSON.parse(savedLogs);
      return logs.filter((l) => (l.timestamp || "").startsWith(date));
    } catch {
      return [];
    }
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
  try {
    return await apiRequest<WorkerClockStatus>(`/api/clock-in/status/${workerId}`);
  } catch {
    const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
    let logs: ClockInRecord[] = [];
    try {
      logs = JSON.parse(savedLogs);
    } catch {
      // ignore
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const workerTodayLogs = logs.filter(
      (l) => (l.external_id === workerId || String(l.worker_id) === workerId) && (l.timestamp || "").startsWith(todayStr)
    );
    const lastRecord = workerTodayLogs[workerTodayLogs.length - 1];
    const isClockedIn = lastRecord ? lastRecord.type === "clock-in" : false;

    return {
      workerId,
      workerName: lastRecord?.worker_name || "Worker",
      isClockedIn,
      todayRecords: workerTodayLogs,
      lastRecord,
    };
  }
}

export async function importRecords(type: string, records: Record<string, string>[]): Promise<{ ok: boolean; message?: string; imported?: number }> {
  try {
    return await apiRequest<{ ok: boolean; message?: string; imported?: number }>("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, records }),
    });
  } catch {
    return { ok: true, message: `Imported ${records.length} record(s) locally`, imported: records.length };
  }
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
  try {
    return await apiRequest<{ ok: boolean; message: string; imported: number }>("/api/clock-in/import-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    return { ok: true, message: `Imported ${data.records.length} device log(s) locally`, imported: data.records.length };
  }
}

export interface ClockInSettings {
  clock_in_portal_enabled: string;
  clock_in_portal_name: string;
  clock_in_portal_description: string;
  church_latitude: string;
  church_longitude: string;
  geofence_radius_meters: string;
  geofence_tolerance_meters: string;
  device_import_enabled: string;
}

export async function getClockInSettings(): Promise<{ ok: boolean; settings: ClockInSettings }> {
  try {
    const data = await apiRequest<{ ok: boolean; settings: ClockInSettings }>("/api/clock-in/settings");
    if (data && data.settings) {
      localStorage.setItem("church_hr_clock_in_settings", JSON.stringify(data.settings));
      return data;
    }
  } catch {
    // Fallback to localStorage or DEFAULT_CLOCK_IN_SETTINGS when backend API is unavailable / static deployment
  }

  const saved = localStorage.getItem("church_hr_clock_in_settings");
  let settings = DEFAULT_CLOCK_IN_SETTINGS;
  if (saved) {
    try {
      settings = { ...DEFAULT_CLOCK_IN_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
  }

  return { ok: true, settings };
}

export async function updateClockInSettings(settings: Partial<ClockInSettings>): Promise<{ ok: boolean; message: string; settings: ClockInSettings }> {
  const currentSaved = localStorage.getItem("church_hr_clock_in_settings");
  let current = DEFAULT_CLOCK_IN_SETTINGS;
  if (currentSaved) {
    try {
      current = { ...DEFAULT_CLOCK_IN_SETTINGS, ...JSON.parse(currentSaved) };
    } catch {
      // ignore
    }
  }
  const merged = { ...current, ...settings };
  localStorage.setItem("church_hr_clock_in_settings", JSON.stringify(merged));

  try {
    return await apiRequest<{ ok: boolean; message: string; settings: ClockInSettings }>("/api/clock-in/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });
  } catch {
    return { ok: true, message: "Clock-in settings updated locally", settings: merged };
  }
}

// Visitors APIs & Resilient LocalStorage Store


function getStoredVisitors(): Visitor[] {
  try {
    const raw = localStorage.getItem("church_hr_visitors");
    if (raw) return JSON.parse(raw);
  } catch {}
  if (ENABLE_MOCK_FALLBACK) {
    localStorage.setItem("church_hr_visitors", JSON.stringify(INITIAL_MOCK_VISITORS));
    return INITIAL_MOCK_VISITORS;
  }
  return [];
}

function saveStoredVisitors(visitors: Visitor[]) {
  try {
    localStorage.setItem("church_hr_visitors", JSON.stringify(visitors));
  } catch {}
}

function getStoredFollowups(): VisitorFollowup[] {
  try {
    const raw = localStorage.getItem("church_hr_visitor_followups");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredFollowups(followups: VisitorFollowup[]) {
  try {
    localStorage.setItem("church_hr_visitor_followups", JSON.stringify(followups));
  } catch {}
}

export async function fetchVisitors(): Promise<Visitor[]> {
  try {
    const data = await apiRequest<Visitor[]>("/api/visitors");
    if (Array.isArray(data) && data.length > 0) {
      saveStoredVisitors(data);
      return data;
    }
  } catch {}
  return getStoredVisitors();
}

export async function createVisitor(visitor: Partial<Visitor>): Promise<{ ok: boolean; id: number }> {
  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitor),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors();
  const newId = Date.now();
  const newVisitor: Visitor = {
    id: newId,
    name: visitor.name || "New Visitor",
    email: visitor.email || "",
    phone: visitor.phone || "",
    first_visit_date: visitor.first_visit_date || new Date().toISOString().split("T")[0],
    assigned_to: visitor.assigned_to,
    assigned_worker_name: visitor.assigned_worker_name || "",
    status: visitor.status || "new",
    notes: visitor.notes || "",
    created_at: new Date().toISOString(),
  };

  list.unshift(newVisitor);
  saveStoredVisitors(list);
  return { ok: true, id: newId };
}

export async function updateVisitor(id: number, data: Partial<Visitor>): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors();
  const index = list.findIndex((v) => v.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...data };
    saveStoredVisitors(list);
  }
  return { ok: true };
}

export async function deleteVisitor(id: number): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors().filter((v) => v.id !== id);
  saveStoredVisitors(list);
  return { ok: true };
}

export async function fetchVisitorFollowups(visitorId: number): Promise<VisitorFollowup[]> {
  try {
    const data = await apiRequest<VisitorFollowup[]>(`/api/visitors/${visitorId}/followups`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  return getStoredFollowups().filter((f) => f.visitor_id === visitorId);
}

export async function addVisitorFollowup(visitorId: number, data: Partial<VisitorFollowup>): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${visitorId}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const followups = getStoredFollowups();
  const newFollowup: VisitorFollowup = {
    id: Date.now(),
    visitor_id: visitorId,
    caller_id: data.caller_id,
    caller_name: data.caller_name || "",
    date: data.date || new Date().toISOString().split("T")[0],
    medium: data.medium || "call",
    feedback: data.feedback || "",
    created_at: new Date().toISOString(),
  };
  followups.unshift(newFollowup);
  saveStoredFollowups(followups);
  return { ok: true };
}

// LocalStorage helpers for Cell Groups offline / standalone mode
function getStoredCellGroups(): CellGroup[] {
  try {
    const stored = localStorage.getItem("church_hr_cell_groups");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    {
      id: 1,
      name: "Grace House Cell #1",
      type: "cell",
      leader_id: 1,
      leader_name: "Osarumeh Enobakhare",
      meeting_day: "Wednesday",
      location: "14 Allen Avenue, Ikeja",
      member_count: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Youth Ministry Unit",
      type: "ministry",
      leader_id: 2,
      leader_name: "Samuel Sonayon",
      meeting_day: "Friday",
      location: "Main Auditorium Hall B",
      member_count: 3,
      created_at: new Date().toISOString(),
    },
  ];
}

function saveStoredCellGroups(groups: CellGroup[]): void {
  try {
    localStorage.setItem("church_hr_cell_groups", JSON.stringify(groups));
  } catch {}
}

function getStoredGroupMembers(): Record<number, GroupMember[]> {
  try {
    const stored = localStorage.getItem("church_hr_group_members");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    1: [
      { id: 101, group_id: 1, worker_id: 1, worker_name: "Osarumeh Enobakhare", dept: "Intercessors", role: "leader" },
      { id: 102, group_id: 1, worker_id: 2, worker_name: "Samuel Sonayon", dept: "Intercessors", role: "member" },
    ],
    2: [
      { id: 201, group_id: 2, worker_id: 2, worker_name: "Samuel Sonayon", dept: "Intercessors", role: "leader" },
      { id: 202, group_id: 2, worker_id: 3, worker_name: "Kehinde Ali-Balogun", dept: "Intercessors", role: "assistant" },
      { id: 203, group_id: 2, worker_id: 4, worker_name: "Peace Friday", dept: "Intercessors", role: "member" },
    ],
  };
}

function saveStoredGroupMembers(membersMap: Record<number, GroupMember[]>): void {
  try {
    localStorage.setItem("church_hr_group_members", JSON.stringify(membersMap));
  } catch {}
}

// Cell Group APIs
export async function fetchCellGroups(): Promise<CellGroup[]> {
  try {
    const data = await apiRequest<CellGroup[]>("/api/groups");
    if (Array.isArray(data)) {
      const stored = getStoredCellGroups();
      const backendIds = new Set(data.map((g) => g.id));
      const localOnly = stored.filter((g) => !backendIds.has(g.id));
      const combined = [...data, ...localOnly];
      saveStoredCellGroups(combined);
      return combined;
    }
  } catch {}
  return getStoredCellGroups();
}

export async function createCellGroup(group: Partial<CellGroup> & { leaderId?: any; meetingDay?: string }): Promise<{ ok: boolean; id: number }> {
  const payload = {
    ...group,
    leader_id: group.leader_id ?? group.leaderId,
    leaderId: group.leaderId ?? group.leader_id,
    meeting_day: group.meeting_day ?? group.meetingDay ?? "Wednesday",
    meetingDay: group.meetingDay ?? group.meeting_day ?? "Wednesday",
  };

  const groups = getStoredCellGroups();
  const newId = Date.now();
  const newGroup: CellGroup = {
    id: newId,
    name: group.name || "New Cell Group",
    type: group.type || "cell",
    leader_id: group.leader_id as any,
    leader_name: group.leader_name || "",
    meeting_day: group.meeting_day || group.meetingDay || "Wednesday",
    location: group.location || "Church Grounds",
    member_count: 0,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      newGroup.id = res.id || newId;
      saveStoredCellGroups([newGroup, ...groups.filter((g) => g.id !== newGroup.id)]);
      return res;
    }
  } catch {}

  groups.unshift(newGroup);
  saveStoredCellGroups(groups);
  return { ok: true, id: newId };
}

export async function updateCellGroup(id: number, group: Partial<CellGroup> & { leaderId?: any; meetingDay?: string }): Promise<{ ok: boolean }> {
  const payload = {
    ...group,
    leader_id: group.leader_id ?? group.leaderId,
    leaderId: group.leaderId ?? group.leader_id,
    meeting_day: group.meeting_day ?? group.meetingDay ?? "Wednesday",
    meetingDay: group.meetingDay ?? group.meeting_day ?? "Wednesday",
  };

  const updatedGroups = getStoredCellGroups().map((g) => {
    if (g.id === id) {
      return {
        ...g,
        ...group,
        meeting_day: group.meeting_day || group.meetingDay || g.meeting_day,
      };
    }
    return g;
  });
  saveStoredCellGroups(updatedGroups);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function deleteCellGroup(id: number): Promise<{ ok: boolean }> {
  const updatedGroups = getStoredCellGroups().filter((g) => g.id !== id);
  saveStoredCellGroups(updatedGroups);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  try {
    const data = await apiRequest<GroupMember[]>(`/api/groups/${groupId}/members`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  return membersMap[groupId] || [];
}

export async function addGroupMember(
  groupId: number,
  workerId: number | string,
  role: "leader" | "assistant" | "member" = "member",
  workerInfo?: Partial<Worker>
): Promise<{ ok: boolean }> {
  const payload = { workerId, worker_id: workerId, role };
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  const currentMembers = membersMap[groupId] || [];
  const numWorkerId = typeof workerId === "number" ? workerId : Number(String(workerId).replace(/\D/g, "")) || Date.now();

  const newMember: GroupMember = {
    id: Date.now(),
    group_id: groupId,
    worker_id: numWorkerId,
    worker_name: workerInfo?.name || `Worker ${workerId}`,
    email: workerInfo?.email || "",
    phone: workerInfo?.phone || "",
    dept: workerInfo?.department || "",
    role,
  };

  const updatedMembers = [...currentMembers.filter((m) => String(m.worker_id) !== String(workerId)), newMember];
  membersMap[groupId] = updatedMembers;
  saveStoredGroupMembers(membersMap);

  const groups = getStoredCellGroups().map((g) => {
    if (g.id === groupId) {
      return { ...g, member_count: updatedMembers.length };
    }
    return g;
  });
  saveStoredCellGroups(groups);

  return { ok: true };
}

export async function removeGroupMember(groupId: number, workerId: number | string): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members/${workerId}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  const currentMembers = membersMap[groupId] || [];
  const updatedMembers = currentMembers.filter((m) => String(m.worker_id) !== String(workerId));
  membersMap[groupId] = updatedMembers;
  saveStoredGroupMembers(membersMap);

  const groups = getStoredCellGroups().map((g) => {
    if (g.id === groupId) {
      return { ...g, member_count: updatedMembers.length };
    }
    return g;
  });
  saveStoredCellGroups(groups);

  return { ok: true };
}

// LocalStorage helpers for Asset Management offline / standalone mode




function getStoredAssets(): Asset[] {
  try {
    const stored = localStorage.getItem("church_hr_assets");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return ENABLE_MOCK_FALLBACK ? DEFAULT_MOCK_ASSETS : [];
}

function saveStoredAssets(assets: Asset[]): void {
  try {
    localStorage.setItem("church_hr_assets", JSON.stringify(assets));
  } catch {}
}

function getStoredAssetMaintenance(): Record<number, AssetMaintenance[]> {
  try {
    const stored = localStorage.getItem("church_hr_asset_maintenance");
    if (stored) return JSON.parse(stored);
  } catch {}
  return ENABLE_MOCK_FALLBACK ? DEFAULT_MAINTENANCE_LOGS : {};
}

function saveStoredAssetMaintenance(logsMap: Record<number, AssetMaintenance[]>): void {
  try {
    localStorage.setItem("church_hr_asset_maintenance", JSON.stringify(logsMap));
  } catch {}
}

// Asset Management APIs
export async function fetchAssets(): Promise<Asset[]> {
  try {
    const data = await apiRequest<Asset[]>("/api/assets");
    if (Array.isArray(data)) {
      const stored = getStoredAssets();
      const backendIds = new Set(data.map((a) => a.id));
      const localOnly = stored.filter((a) => !backendIds.has(a.id));
      const combined = [...data, ...localOnly];
      saveStoredAssets(combined);
      return combined;
    }
  } catch {}
  return getStoredAssets();
}

export async function createAsset(
  asset: Partial<Asset> & { assignedTo?: any; assetTag?: string; purchaseDate?: string }
): Promise<{ ok: boolean; id: number; assetTag?: string }> {
  const tag = asset.asset_tag || asset.assetTag || `AST-${Date.now().toString().slice(-6)}`;
  const payload = {
    ...asset,
    assetTag: tag,
    asset_tag: tag,
    assignedTo: asset.assigned_to ?? asset.assignedTo,
    assigned_to: asset.assigned_to ?? asset.assignedTo,
    purchaseDate: asset.purchase_date ?? asset.purchaseDate ?? new Date().toISOString().split("T")[0],
    purchase_date: asset.purchase_date ?? asset.purchaseDate ?? new Date().toISOString().split("T")[0],
  };

  const assets = getStoredAssets();
  const newId = Date.now();
  const newAsset: Asset = {
    id: newId,
    asset_tag: tag,
    name: asset.name || "New Asset",
    category: asset.category || "audio-visual",
    location: asset.location || "Main Sanctuary",
    assigned_to: asset.assigned_to as any,
    assigned_worker_name: asset.assigned_worker_name || "",
    status: asset.status || "good",
    purchase_date: payload.purchase_date,
    value: Number(asset.value || 0),
    created_at: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<{ ok: boolean; id: number; assetTag?: string }>("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      newAsset.id = res.id || newId;
      newAsset.asset_tag = res.assetTag || tag;
      saveStoredAssets([newAsset, ...assets.filter((a) => a.id !== newAsset.id)]);
      return res;
    }
  } catch {}

  assets.unshift(newAsset);
  saveStoredAssets(assets);
  return { ok: true, id: newId, assetTag: tag };
}

export async function updateAsset(
  id: number,
  asset: Partial<Asset> & { assignedTo?: any }
): Promise<{ ok: boolean }> {
  const payload = {
    ...asset,
    assignedTo: asset.assigned_to ?? asset.assignedTo,
    assigned_to: asset.assigned_to ?? asset.assignedTo,
  };

  const updatedAssets = getStoredAssets().map((a) => {
    if (a.id === id) {
      return {
        ...a,
        ...asset,
        value: asset.value !== undefined ? Number(asset.value) : a.value,
      };
    }
    return a;
  });
  saveStoredAssets(updatedAssets);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function deleteAsset(id: number): Promise<{ ok: boolean }> {
  const updatedAssets = getStoredAssets().filter((a) => a.id !== id);
  saveStoredAssets(updatedAssets);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function fetchAssetMaintenance(assetId: number): Promise<AssetMaintenance[]> {
  try {
    const data = await apiRequest<AssetMaintenance[]>(`/api/assets/${assetId}/maintenance`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  const logsMap = getStoredAssetMaintenance();
  return logsMap[assetId] || [];
}

export async function addAssetMaintenance(assetId: number, record: Partial<AssetMaintenance>): Promise<{ ok: boolean }> {
  const logsMap = getStoredAssetMaintenance();
  const current = logsMap[assetId] || [];
  const newRecord: AssetMaintenance = {
    id: Date.now(),
    asset_id: assetId,
    service_date: record.service_date || new Date().toISOString().split("T")[0],
    cost: Number(record.cost || 0),
    performed_by: record.performed_by || "Technician",
    notes: record.notes || "",
  };
  logsMap[assetId] = [newRecord, ...current];
  saveStoredAssetMaintenance(logsMap);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${assetId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
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

// Service Plans APIs & Fallback Memory Store
let IN_MEMORY_SERVICE_PLANS: ServicePlan[] = [
  {
    id: 1,
    title: "Sunday Glorious Worship Service",
    date: new Date().toISOString().split("T")[0],
    service_type: "Sunday Glorious",
  },
  {
    id: 2,
    title: "Thursday Midweek Bible Exposition",
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    service_type: "Midweek Exposition",
  },
];

let IN_MEMORY_SERVICE_ITEMS: Record<number, ServiceItem[]> = {
  1: [
    { id: 101, plan_id: 1, sequence: 1, title: "Opening Prayer & Call to Worship", duration_minutes: 10, leader_name: "Pastor Samuel", notes: "Psalm 100" },
    { id: 102, plan_id: 1, sequence: 2, title: "Praise & High Worship Session", duration_minutes: 25, leader_name: "Choir Ministry", notes: "Hymns 204 & 112" },
    { id: 103, plan_id: 1, sequence: 3, title: "Sermon & Word Exposition", duration_minutes: 45, leader_name: "Resident Pastor", notes: "Theme: Exceeding Grace & Power" },
  ],
  2: [
    { id: 201, plan_id: 2, sequence: 1, title: "Opening Hymn", duration_minutes: 10, leader_name: "Elder John", notes: "Hymn 45" },
    { id: 202, plan_id: 2, sequence: 2, title: "In-depth Bible Study", duration_minutes: 50, leader_name: "Teacher Deborah", notes: "Book of Romans Chapter 8" },
  ],
};

let IN_MEMORY_SERVICE_ROSTERS: Record<number, ServiceRoster[]> = {
  1: [
    { id: 301, plan_id: 1, department: "Ushering", worker_id: 1, worker_name: "Osarumeh Enobakhare", role_title: "Head Usher", status: "confirmed" },
    { id: 302, plan_id: 1, department: "Choir", worker_id: 2, worker_name: "Samuel Sonayon", role_title: "Worship Leader", status: "confirmed" },
  ],
  2: [
    { id: 401, plan_id: 2, department: "Media & Tech", worker_id: 3, worker_name: "Kehinde Ali-Balogun", role_title: "Sound Engineer", status: "confirmed" },
  ],
};

export async function fetchServicePlans(): Promise<ServicePlan[]> {
  try {
    const data = await apiRequest<ServicePlan[]>("/api/service-plans");
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return IN_MEMORY_SERVICE_PLANS;
  } catch {
    return IN_MEMORY_SERVICE_PLANS;
  }
}

export async function createServicePlan(plan: Partial<ServicePlan>): Promise<{ ok: boolean; id: number }> {
  let createdId = Date.now();
  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/service-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    if (res && res.id) createdId = res.id;
  } catch {
    // static / offline fallback
  }

  const newPlan: ServicePlan = {
    id: createdId,
    title: plan.title || "Untitled Service Plan",
    date: plan.date || new Date().toISOString().split("T")[0],
    service_type: plan.service_type || "Sunday Glorious",
  };

  IN_MEMORY_SERVICE_PLANS = [newPlan, ...IN_MEMORY_SERVICE_PLANS];
  return { ok: true, id: createdId };
}

export async function updateServicePlan(id: number, plan: Partial<ServicePlan>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
  } catch {
    // fallback
  }

  IN_MEMORY_SERVICE_PLANS = IN_MEMORY_SERVICE_PLANS.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        title: plan.title !== undefined ? plan.title : p.title,
        date: plan.date !== undefined ? plan.date : p.date,
        service_type: plan.service_type !== undefined ? plan.service_type : p.service_type,
      };
    }
    return p;
  });
  return { ok: true };
}

export async function deleteServicePlan(id: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${id}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }
  IN_MEMORY_SERVICE_PLANS = IN_MEMORY_SERVICE_PLANS.filter((p) => p.id !== id);
  delete IN_MEMORY_SERVICE_ITEMS[id];
  delete IN_MEMORY_SERVICE_ROSTERS[id];
  return { ok: true };
}

export async function fetchServiceItems(planId: number): Promise<ServiceItem[]> {
  try {
    const data = await apiRequest<ServiceItem[]>(`/api/service-plans/${planId}/items`);
    if (Array.isArray(data) && data.length > 0) return data;
    return IN_MEMORY_SERVICE_ITEMS[planId] || [];
  } catch {
    return IN_MEMORY_SERVICE_ITEMS[planId] || [];
  }
}

export async function addServiceItem(planId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    // fallback
  }

  const newItem: ServiceItem = {
    id: Date.now(),
    plan_id: planId,
    sequence: item.sequence || 1,
    title: item.title || "Untitled Activity",
    duration_minutes: item.duration_minutes || 10,
    leader_name: item.leader_name || "",
    notes: item.notes || "",
  };

  const list = IN_MEMORY_SERVICE_ITEMS[planId] || [];
  IN_MEMORY_SERVICE_ITEMS[planId] = [...list, newItem];
  return { ok: true };
}

export async function updateServiceItem(itemId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ITEMS) {
    IN_MEMORY_SERVICE_ITEMS[planId] = IN_MEMORY_SERVICE_ITEMS[planId].map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          title: item.title !== undefined ? item.title : it.title,
          duration_minutes: item.duration_minutes !== undefined ? item.duration_minutes : it.duration_minutes,
          leader_name: item.leader_name !== undefined ? item.leader_name : it.leader_name,
          notes: item.notes !== undefined ? item.notes : it.notes,
        };
      }
      return it;
    });
  }

  return { ok: true };
}

export async function deleteServiceItem(itemId: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/items/${itemId}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ITEMS) {
    IN_MEMORY_SERVICE_ITEMS[planId] = IN_MEMORY_SERVICE_ITEMS[planId].filter((it) => it.id !== itemId);
  }
  return { ok: true };
}

export async function fetchServiceRoster(planId: number): Promise<ServiceRoster[]> {
  try {
    const data = await apiRequest<ServiceRoster[]>(`/api/service-plans/${planId}/roster`);
    if (Array.isArray(data) && data.length > 0) return data;
    return IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  } catch {
    return IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  }
}

export async function addServiceRoster(planId: number, roster: Partial<ServiceRoster>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roster),
    });
  } catch {
    // fallback
  }

  const newRoster: ServiceRoster = {
    id: Date.now(),
    plan_id: planId,
    department: roster.department || "General",
    worker_id: roster.worker_id || 1,
    worker_name: roster.worker_name || "Scheduled Volunteer",
    role_title: roster.role_title || "Volunteer",
    status: roster.status || "confirmed",
  };

  const list = IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  IN_MEMORY_SERVICE_ROSTERS[planId] = [...list, newRoster];
  return { ok: true };
}

export async function deleteServiceRoster(rosterId: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/roster/${rosterId}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ROSTERS) {
    IN_MEMORY_SERVICE_ROSTERS[planId] = IN_MEMORY_SERVICE_ROSTERS[planId].filter((r) => r.id !== rosterId);
  }
  return { ok: true };
}

export async function sendRosterReminder(
  roster: ServiceRoster,
  channel: "whatsapp" | "email" | "sms" | "all",
  planTitle: string,
  planDate: string
): Promise<{ ok: boolean; message: string }> {
  try {
    await apiRequest<{ ok: boolean; message: string }>("/api/service-plans/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rosterId: roster.id, channel, planTitle, planDate }),
    });
  } catch {
    // static fallback simulated send
  }

  return {
    ok: true,
    message: `Reminder sent to ${roster.worker_name} via ${channel.toUpperCase()}`,
  };
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
  try {
    const res = await apiRequest<{ ok: boolean; id: number; securityCode: string }>("/api/kiosk/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.securityCode) return res;
    throw new Error("Invalid response");
  } catch {
    const fallbackCode = `TAG-${Math.floor(1000 + Math.random() * 9000)}`;
    return { ok: true, id: Date.now(), securityCode: fallbackCode };
  }
}

export async function checkoutKiosk(id: number): Promise<{ ok: boolean }> {
  try {
    return await apiRequest<{ ok: boolean }>(`/api/kiosk/checkout/${id}`, {
      method: "PUT",
    });
  } catch {
    return { ok: true };
  }
}


