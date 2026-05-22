export interface Worker {
  id: string;
  name: string;
  department: string;
  role: string;
  status: "active" | "inactive";
  email: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "superadmin" | "manager" | "member";
  workerId?: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  department: string;
  date: string;
  status: "present" | "late" | "absent";
}
