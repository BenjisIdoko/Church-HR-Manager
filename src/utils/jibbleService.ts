/**
 * Jibble Time & Attendance API Integration
 * Connects Church HR Manager to Jibble for real-time attendance tracking
 */

// Jibble API Configuration
const JIBBLE_API_BASE = process.env.REACT_APP_JIBBLE_API_URL || "https://api.jibble.io/v1";
const JIBBLE_API_KEY = process.env.REACT_APP_JIBBLE_API_KEY || "";

// Jibble API Response Interfaces
interface JibbleTimestamp {
  date: string;
  time: string;
  timezone: string;
}

interface JibbleEmployee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  status: "active" | "inactive";
}

interface JibbleCheckIn {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: JibbleTimestamp;
  type: "check-in" | "check-out";
  location?: {
    latitude: number;
    longitude: number;
  };
  ipAddress?: string;
}

interface JibbleAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIns: JibbleCheckIn[];
  status: "present" | "absent" | "late" | "half-day";
  totalHours?: number;
  notes?: string;
}

// API Error Handler
class JibbleAPIError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
    this.name = "JibbleAPIError";
  }
}

/**
 * Make authenticated requests to Jibble API
 */
async function jibbleRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  if (!JIBBLE_API_KEY) {
    throw new Error("Jibble API key not configured. Set REACT_APP_JIBBLE_API_KEY environment variable.");
  }

  const url = `${JIBBLE_API_BASE}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${JIBBLE_API_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new JibbleAPIError(
        response.status,
        error.message || `Jibble API Error: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof JibbleAPIError) throw error;
    throw new Error(`Jibble API request failed: ${(error as Error).message}`);
  }
}

/**
 * Fetch all employees from Jibble
 */
export async function getJibbleEmployees(): Promise<JibbleEmployee[]> {
  try {
    const response = await jibbleRequest("/employees");
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch Jibble employees:", error);
    return [];
  }
}

/**
 * Fetch attendance records for a specific date range
 */
export async function getJibbleAttendance(
  startDate: string,
  endDate: string
): Promise<JibbleAttendance[]> {
  try {
    const response = await jibbleRequest(
      `/attendance?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch Jibble attendance:", error);
    return [];
  }
}

/**
 * Fetch attendance for a specific employee
 */
export async function getEmployeeAttendance(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<JibbleAttendance[]> {
  try {
    const response = await jibbleRequest(
      `/attendance?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch attendance for employee ${employeeId}:`, error);
    return [];
  }
}

/**
 * Get real-time employee status (check-in/check-out status)
 */
export async function getEmployeeStatus(employeeId: string): Promise<{
  isCheckedIn: boolean;
  lastCheckIn?: JibbleCheckIn;
  lastCheckOut?: JibbleCheckIn;
}> {
  try {
    const response = await jibbleRequest(`/employees/${employeeId}/status`);
    return response.data || { isCheckedIn: false };
  } catch (error) {
    console.error(`Failed to fetch status for employee ${employeeId}:`, error);
    return { isCheckedIn: false };
  }
}

/**
 * Get attendance summary/statistics
 */
export async function getAttendanceSummary(
  startDate: string,
  endDate: string
): Promise<{
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}> {
  try {
    const response = await jibbleRequest(
      `/attendance/summary?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      attendanceRate: 0,
    };
  } catch (error) {
    console.error("Failed to fetch attendance summary:", error);
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      attendanceRate: 0,
    };
  }
}

/**
 * Get department-wise attendance statistics
 */
export async function getDepartmentAttendance(
  department: string,
  startDate: string,
  endDate: string
): Promise<JibbleAttendance[]> {
  try {
    const response = await jibbleRequest(
      `/attendance?department=${department}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch attendance for department ${department}:`, error);
    return [];
  }
}

/**
 * Convert Jibble attendance format to internal AttendanceRecord format
 */
export function convertJibbleToAttendanceRecord(
  jibbleAttendance: JibbleAttendance,
  department?: string
) {
  return {
    id: jibbleAttendance.id,
    workerId: jibbleAttendance.employeeId,
    workerName: jibbleAttendance.employeeName,
    department: department || "Unknown",
    date: jibbleAttendance.date,
    status: jibbleAttendance.status as "present" | "absent" | "late",
    totalHours: jibbleAttendance.totalHours || 0,
  };
}

/**
 * Health check - verify API connection
 */
export async function checkJibbleConnection(): Promise<boolean> {
  try {
    const response = await jibbleRequest("/health");
    return response.status === "ok";
  } catch (error) {
    console.error("Jibble API connection failed:", error);
    return false;
  }
}

export type { JibbleEmployee, JibbleAttendance, JibbleCheckIn };
