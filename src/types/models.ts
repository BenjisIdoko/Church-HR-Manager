export interface Worker {
  id: string;
  name: string;
  department: string;
  departments?: string[];
  role: string;
  status: "active" | "inactive";
  email: string;
  phone: string;
  profileImage?: string;
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

export interface Visitor {
  id: number;
  name: string;
  email?: string;
  phone: string;
  first_visit_date: string;
  assigned_to?: number | string;
  assigned_worker_name?: string;
  status: "new" | "contacted" | "visited" | "integrated" | "dropped";
  notes?: string;
  created_at?: string;
}

export interface VisitorFollowup {
  id: number;
  visitor_id: number;
  caller_id?: number | string;
  caller_name?: string;
  date: string;
  medium: "call" | "sms" | "whatsapp" | "in-person";
  feedback: string;
  created_at?: string;
}

export interface CellGroup {
  id: number;
  name: string;
  type: "cell" | "ministry" | "committee";
  leader_id?: number;
  leader_name?: string;
  meeting_day: string;
  location: string;
  member_count?: number;
  created_at?: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  worker_id: number;
  worker_name: string;
  email?: string;
  phone?: string;
  dept?: string;
  role: "leader" | "assistant" | "member";
}

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category: "audio-visual" | "musical-instrument" | "furniture" | "vehicle" | "facility";
  location: string;
  assigned_to?: number;
  assigned_worker_name?: string;
  status: "good" | "needs-repair" | "damaged" | "disposed";
  purchase_date?: string;
  value: number;
  created_at?: string;
}

export interface AssetMaintenance {
  id: number;
  asset_id: number;
  service_date: string;
  cost: number;
  performed_by: string;
  notes?: string;
}

export interface DiscipleshipCourse {
  id: number;
  title: string;
  description?: string;
  total_modules: number;
}

export interface MemberCourseProgress {
  id: number;
  worker_id: number;
  worker_name?: string;
  course_id: number;
  course_title?: string;
  status: "enrolled" | "in-progress" | "completed";
  completion_date?: string;
}

export interface ServicePlan {
  id: number;
  title: string;
  date: string;
  service_type: string;
  leader_id?: number;
  leader_name?: string;
  created_at?: string;
}

export interface ServiceItem {
  id: number;
  plan_id: number;
  sequence: number;
  title: string;
  duration_minutes: number;
  leader_name?: string;
  notes?: string;
}

export interface ServiceRoster {
  id: number;
  plan_id: number;
  department: string;
  worker_id: number;
  worker_name?: string;
  worker_phone?: string;
  role_title: string;
  status: "confirmed" | "pending" | "declined";
}

export interface ChurchEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  room_location: string;
  organizer_id?: number;
  organizer_name?: string;
  created_at?: string;
}

export interface KioskCheckin {
  id: number;
  child_name: string;
  parent_name: string;
  parent_phone: string;
  department: string;
  security_code: string;
  checkin_time: string;
  checkout_time?: string;
  status: "checked-in" | "checked-out";
}


