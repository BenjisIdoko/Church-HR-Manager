import { AttendanceRecord, User, Worker } from "./mockData";

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
  const response = await apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: identifier,
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
