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
  password: string;
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

const defaultDepartments = [
  "Ushering",
  "Choir",
  "Media",
  "Security",
  "Children Ministry",
  "Youth Ministry",
  "Evangelism",
  "Welfare",
  "Protocol",
];

// Generate 156 workers
const generateWorkers = (): Worker[] => {
  const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Mary", "Daniel", "Jennifer", "William", "Patricia", "Richard", "Linda", "Joseph", "Barbara", "Thomas", "Elizabeth", "Charles", "Susan", "Christopher", "Jessica", "Matthew", "Karen", "Anthony", "Nancy", "Mark", "Betty", "Donald", "Margaret", "Steven", "Sandra", "Paul", "Ashley", "Andrew", "Kimberly", "Joshua", "Kenneth", "Donna", "Kevin", "Michelle", "Brian", "Carol", "George", "Amanda", "Edward", "Melissa"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
  
  const departments = defaultDepartments;
  const roles = ["Leader", "Assistant", "Member", "Coordinator", "Volunteer"];
  
  const workers: Worker[] = [];
  
  for (let i = 1; i <= 156; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const department = departments[(i - 1) % departments.length];
    const role = roles[(i - 1) % roles.length];
    
    workers.push({
      id: `W${String(i).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      department,
      role,
      status: i <= 150 ? "active" : "inactive",
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@church.com`,
      phone: `+1 (555) ${String(1000000 + i).slice(1)}`,
    });
  }
  
  return workers;
};

export const mockUsers: User[] = [
  {
    id: "U000",
    name: "Super Admin",
    email: "admin@church.com",
    password: "Admin@123",
    role: "superadmin",
  },
  {
    id: "U001",
    name: "John Smith",
    email: "john.smith@church.com",
    password: "Member@123",
    role: "member",
    workerId: "W001",
  },
  {
    id: "U002",
    name: "Manager User",
    email: "manager@church.com",
    password: "Manager@123",
    role: "manager",
  },
];

export const mockDepartments = [...defaultDepartments];

export const mockWorkers: Worker[] = generateWorkers();

export const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    
    // Only generate records for Sundays (0) and Thursdays (4)
    if (dayOfWeek !== 0 && dayOfWeek !== 4) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    const isSunday = dayOfWeek === 0;
    
    mockWorkers.forEach((worker, idx) => {
      if (worker.status === "inactive") return;
      
      const random = Math.random();
      let status: "present" | "late" | "absent";
      
      // Sundays: ~90% attendance (140 out of 156)
      // Thursdays: ~45% attendance (70 out of 156)
      const attendanceThreshold = isSunday ? 0.90 : 0.45;
      
      if (random > attendanceThreshold) {
        status = "absent";
      } else if (random > attendanceThreshold - 0.05) {
        status = "late";
      } else {
        status = "present";
      }
      
      records.push({
        id: `A${i}-${idx}`,
        workerId: worker.id,
        workerName: worker.name,
        department: worker.department,
        date: dateStr,
        status,
      });
    });
  }
  
  return records;
};

export const mockAttendanceRecords = generateMockAttendance();

export const getAttendanceStats = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  const activeWorkers = mockWorkers.filter(w => w.status === "active").length;
  
  // Check if today is a service day (Sunday or Thursday)
  let todayRecords = mockAttendanceRecords.filter(r => r.date === todayStr);
  let presentToday = 0;
  let absentToday = 0;
  let attendanceRate = 0;
  
  if (dayOfWeek === 0 || dayOfWeek === 4) {
    // Today is a service day
    presentToday = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
    absentToday = activeWorkers - presentToday;
    attendanceRate = activeWorkers > 0 ? Math.round((presentToday / activeWorkers) * 100) : 0;
  } else {
    // Not a service day, show last service stats
    for (let i = 1; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const checkDay = date.getDay();
      
      if (checkDay === 0 || checkDay === 4) {
        const dateStr = date.toISOString().split('T')[0];
        todayRecords = mockAttendanceRecords.filter(r => r.date === dateStr);
        presentToday = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
        absentToday = activeWorkers - presentToday;
        attendanceRate = activeWorkers > 0 ? Math.round((presentToday / activeWorkers) * 100) : 0;
        break;
      }
    }
  }
  
  return {
    totalWorkers: activeWorkers,
    presentToday,
    absentToday,
    attendanceRate,
  };
};

export const getAttendanceTrend = () => {
  const trend = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find the last 8 service days (Thursdays and Sundays)
  let daysChecked = 0;
  let servicesFound = 0;
  
  while (servicesFound < 8 && daysChecked < 90) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysChecked);
    const dayOfWeek = date.getDay();
    
    // Only include Sundays (0) and Thursdays (4)
    if (dayOfWeek === 0 || dayOfWeek === 4) {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayRecords = mockAttendanceRecords.filter(r => r.date === dateStr);
      const present = dayRecords.filter(r => r.status === "present" || r.status === "late").length;
      const absent = dayRecords.filter(r => r.status === "absent").length;
      
      trend.unshift({
        date: `${dayName} ${dateLabel}`,
        present,
        absent,
        total: present + absent,
      });
      servicesFound++;
    }
    daysChecked++;
  }
  
  return trend;
};
