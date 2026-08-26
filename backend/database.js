const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = process.env.DB_PATH || path.join(__dirname, 'church_hr.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  worker_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dept TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  profile_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  reason TEXT NOT NULL,
  other_reason TEXT,
  date_from DATE NOT NULL,
  date_to DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- KPIs table for caching computed values
CREATE TABLE IF NOT EXISTS kpis (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_workers INTEGER DEFAULT 0,
  attendance_today INTEGER DEFAULT 0,
  absent_today INTEGER DEFAULT 0,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for system configuration and clock-in portal management
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clock-In Records table for geolocation-based attendance
CREATE TABLE IF NOT EXISTS clock_in_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  timestamp DATETIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('clock-in', 'clock-out')),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  distance_from_church REAL NOT NULL,
  is_within_geofence INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'device')),
  device_id TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- Insert default KPI record if it doesn't exist
INSERT OR IGNORE INTO kpis (id, total_workers, attendance_today, absent_today) VALUES (1, 0, 0, 0);

-- Insert default settings if they do not exist
INSERT OR IGNORE INTO settings (key, value) VALUES ('clock_in_portal_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('clock_in_portal_name', 'Church Clock-In Portal');
INSERT OR IGNORE INTO settings (key, value) VALUES ('clock_in_portal_description', 'Use this portal to clock in and out when on church grounds.');
INSERT OR IGNORE INTO settings (key, value) VALUES ('church_latitude', '9.0765');
INSERT OR IGNORE INTO settings (key, value) VALUES ('church_longitude', '7.3986');
INSERT OR IGNORE INTO settings (key, value) VALUES ('geofence_radius_meters', '200');
INSERT OR IGNORE INTO settings (key, value) VALUES ('geofence_tolerance_meters', '50');
INSERT OR IGNORE INTO settings (key, value) VALUES ('device_import_enabled', 'true');

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  first_visit_date DATE NOT NULL,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'integrated', 'dropped')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES workers (id) ON DELETE SET NULL
);

-- Visitor Followups table
CREATE TABLE IF NOT EXISTS visitor_followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id INTEGER NOT NULL,
  caller_id INTEGER,
  date DATE NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('call', 'sms', 'whatsapp', 'in-person')),
  feedback TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE,
  FOREIGN KEY (caller_id) REFERENCES workers (id) ON DELETE SET NULL
);

-- Cell Groups table
CREATE TABLE IF NOT EXISTS cell_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cell' CHECK (type IN ('cell', 'ministry', 'committee')),
  leader_id INTEGER,
  meeting_day TEXT NOT NULL DEFAULT 'Wednesday',
  location TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES workers (id) ON DELETE SET NULL
);

-- Group Members junction table
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'assistant', 'member')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, worker_id),
  FOREIGN KEY (group_id) REFERENCES cell_groups (id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('audio-visual', 'musical-instrument', 'furniture', 'vehicle', 'facility')),
  location TEXT NOT NULL,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'good' CHECK (status IN ('good', 'needs-repair', 'damaged', 'disposed')),
  purchase_date DATE,
  value REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES workers (id) ON DELETE SET NULL
);

-- Asset Maintenance table
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  service_date DATE NOT NULL,
  cost REAL DEFAULT 0,
  performed_by TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE
);

-- Discipleship Courses table
CREATE TABLE IF NOT EXISTS discipleship_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  total_modules INTEGER NOT NULL DEFAULT 4,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Member Courses progress table
CREATE TABLE IF NOT EXISTS member_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in-progress', 'completed')),
  completion_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(worker_id, course_id),
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES discipleship_courses (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_workers_dept ON workers(dept);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_clock_in_worker_id ON clock_in_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_timestamp ON clock_in_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_clock_in_date ON clock_in_records(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_assigned_to ON visitors(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cell_groups_leader ON cell_groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- Service Plans table (Planning Center Services)
CREATE TABLE IF NOT EXISTS service_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Sunday Glorious',
  leader_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES workers (id) ON DELETE SET NULL
);

-- Service Items table (Order of service breakdown)
CREATE TABLE IF NOT EXISTS service_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  leader_name TEXT,
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES service_plans (id) ON DELETE CASCADE
);

-- Service Rosters table (Department volunteer scheduling)
CREATE TABLE IF NOT EXISTS service_rosters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  department TEXT NOT NULL,
  worker_id INTEGER NOT NULL,
  role_title TEXT NOT NULL DEFAULT 'Volunteer',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'declined')),
  FOREIGN KEY (plan_id) REFERENCES service_plans (id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- Church Events & Calendar table (Planning Center Calendar)
CREATE TABLE IF NOT EXISTS church_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '11:00',
  room_location TEXT NOT NULL DEFAULT 'Main Sanctuary',
  organizer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES workers (id) ON DELETE SET NULL
);

-- Kiosk Check-Ins table (Planning Center Check-Ins)
CREATE TABLE IF NOT EXISTS kiosk_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Junior Church',
  security_code TEXT NOT NULL,
  checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  checkout_time DATETIME,
  status TEXT NOT NULL DEFAULT 'checked-in' CHECK (status IN ('checked-out', 'checked-in'))
);

CREATE INDEX IF NOT EXISTS idx_service_plans_date ON service_plans(date);
CREATE INDEX IF NOT EXISTS idx_church_events_date ON church_events(event_date);
CREATE INDEX IF NOT EXISTS idx_kiosk_checkins_status ON kiosk_checkins(status);
`;

try {
  db.exec(createTables);
  console.log('Database tables created successfully');
} catch (error) {
  console.error('Error creating database tables:', error);
  process.exit(1);
}

// Ensure existing schema includes external_id for worker mapping
const workerColumns = db.prepare("PRAGMA table_info(workers)").all().map((col) => col.name);
if (!workerColumns.includes('external_id')) {
  db.exec('ALTER TABLE workers ADD COLUMN external_id TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_external_id ON workers(external_id)');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_external_id ON workers(external_id)');
db.exec(`
  UPDATE workers
  SET external_id = 'LEGACY-' || substr('000' || id, -3, 3)
  WHERE external_id IS NULL OR trim(external_id) = ''
`);

const duplicateWorkers = db.prepare(`
  SELECT
    legacy.id AS legacy_id,
    canonical.id AS canonical_id
  FROM workers legacy
  JOIN workers canonical
    ON canonical.external_id NOT LIKE 'LEGACY-%'
   AND legacy.external_id LIKE 'LEGACY-%'
   AND lower(legacy.name) = lower(canonical.name)
   AND lower(COALESCE(legacy.email, '')) = lower(COALESCE(canonical.email, ''))
   AND lower(COALESCE(legacy.phone, '')) = lower(COALESCE(canonical.phone, ''))
   AND lower(legacy.dept) = lower(canonical.dept)
   AND lower(legacy.role) = lower(canonical.role)
   AND lower(legacy.status) = lower(canonical.status)
`).all();

if (duplicateWorkers.length > 0) {
  const removeDuplicateWorkers = db.transaction((pairs) => {
    for (const pair of pairs) {
      db.prepare('DELETE FROM attendance WHERE worker_id = ?').run(pair.legacy_id);
      db.prepare('DELETE FROM absences WHERE worker_id = ?').run(pair.legacy_id);
      db.prepare('DELETE FROM workers WHERE id = ?').run(pair.legacy_id);
    }
  });

  removeDuplicateWorkers(duplicateWorkers);
}

// Seed default discipleship courses if empty
const courseCount = db.prepare('SELECT COUNT(*) as count FROM discipleship_courses').get().count;
if (courseCount === 0) {
  db.exec(`
    INSERT INTO discipleship_courses (title, description, total_modules) VALUES
    ('Believers Foundation Class', 'Core doctrines, salvation, prayer, and bible study basics.', 4),
    ('Water Baptism Prep', 'Understanding baptism, covenant, and Christian discipleship.', 2),
    ('Workers Training Academy', 'Church department protocols, leadership standards, and ministry ethics.', 6),
    ('Leadership Excellence Course', 'Advanced pastoral care, cell leadership, and organizational management.', 8);
  `);
}

// Prepared statements for common operations
const statements = {
  // Users / Auth
  getUserByEmail: db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)'),
  getUserByIdentifier: db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(worker_id) = LOWER(?)'),
  getUserById: db.prepare('SELECT id, name, email, role, worker_id FROM users WHERE id = ?'),
  insertUser: db.prepare(`
    INSERT OR REPLACE INTO users (name, email, password_hash, role, worker_id)
    VALUES (?, LOWER(?), ?, ?, ?)
  `),
  getAllUsers: db.prepare('SELECT id, name, email, role, worker_id FROM users'),

  // Workers
  insertWorker: db.prepare(`
    INSERT OR REPLACE INTO workers (external_id, name, email, phone, dept, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  getAllWorkers: db.prepare('SELECT * FROM workers ORDER BY name'),

  getWorkerById: db.prepare('SELECT * FROM workers WHERE id = ?'),

  getWorkerByExternalId: db.prepare('SELECT * FROM workers WHERE external_id = ?'),

  updateWorker: db.prepare(`
    UPDATE workers
    SET name = ?, email = ?, phone = ?, dept = ?, role = ?, status = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteWorker: db.prepare('DELETE FROM workers WHERE id = ?'),

  renameDepartment: db.prepare(`
    UPDATE workers
    SET dept = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dept = ?
  `),

  // Attendance
  insertAttendance: db.prepare(`
    INSERT INTO attendance (worker_id, service, status, date)
    VALUES (?, ?, ?, ?)
  `),

  getAllAttendance: db.prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    ORDER BY a.date DESC, a.service
  `),

  getAttendanceByDate: db.prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    WHERE a.date = ?
    ORDER BY a.service, w.name
  `),

  deleteAttendanceByDate: db.prepare('DELETE FROM attendance WHERE date = ?'),

  // KPIs
  getKPIs: db.prepare('SELECT * FROM kpis WHERE id = 1'),

  updateKPIs: db.prepare(`
    UPDATE kpis
    SET total_workers = ?, attendance_today = ?, absent_today = ?, last_sync = CURRENT_TIMESTAMP
    WHERE id = 1
  `),

  // Statistics
  getAttendanceStats: db.prepare(`
    SELECT
      COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as present,
      COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent,
      COUNT(*) as total
    FROM attendance
    WHERE date = ?
  `),

  getWorkerCount: db.prepare('SELECT COUNT(*) as count FROM workers WHERE status = ?'),

  // Absences
  insertAbsence: db.prepare(`
    INSERT INTO absences (worker_id, name, department, reason, other_reason, date_from, date_to, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getAllAbsences: db.prepare(`
    SELECT a.*, w.name as worker_name, w.dept as worker_dept
    FROM absences a
    LEFT JOIN workers w ON a.worker_id = w.id
    ORDER BY a.created_at DESC
  `),

  getAbsenceById: db.prepare('SELECT * FROM absences WHERE id = ?'),

  updateAbsenceStatus: db.prepare(`
    UPDATE absences
    SET status = ?
    WHERE id = ?
  `),

  // Clock-In Records
  insertClockIn: db.prepare(`
    INSERT INTO clock_in_records (worker_id, timestamp, type, latitude, longitude, distance_from_church, is_within_geofence, source, device_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getAllClockIns: db.prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    ORDER BY c.timestamp DESC
  `),

  getClockInsByDate: db.prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    WHERE DATE(c.timestamp) = ?
    ORDER BY c.timestamp DESC
  `),

  getClockInsByWorkerAndDate: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = ?
    ORDER BY timestamp DESC
  `),

  getLatestClockInByWorker: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `),

  getWorkerTodayClockIns: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = DATE('now')
    ORDER BY timestamp
  `),

  // Settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  getAllSettings: db.prepare('SELECT key, value FROM settings'),
  upsertSetting: db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `),

  // Visitors
  getAllVisitors: db.prepare(`
    SELECT v.*, w.name as assigned_worker_name
    FROM visitors v
    LEFT JOIN workers w ON v.assigned_to = w.id
    ORDER BY v.created_at DESC
  `),

  insertVisitor: db.prepare(`
    INSERT INTO visitors (name, email, phone, first_visit_date, assigned_to, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  updateVisitorStatus: db.prepare(`
    UPDATE visitors SET status = ?, assigned_to = ?, notes = ? WHERE id = ?
  `),

  deleteVisitor: db.prepare('DELETE FROM visitors WHERE id = ?'),

  insertVisitorFollowup: db.prepare(`
    INSERT INTO visitor_followups (visitor_id, caller_id, date, medium, feedback)
    VALUES (?, ?, ?, ?, ?)
  `),

  getVisitorFollowups: db.prepare(`
    SELECT f.*, w.name as caller_name
    FROM visitor_followups f
    LEFT JOIN workers w ON f.caller_id = w.id
    WHERE f.visitor_id = ?
    ORDER BY f.date DESC
  `),

  // Cell Groups
  getAllCellGroups: db.prepare(`
    SELECT g.*, w.name as leader_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM cell_groups g
    LEFT JOIN workers w ON g.leader_id = w.id
    ORDER BY g.name
  `),

  insertCellGroup: db.prepare(`
    INSERT INTO cell_groups (name, type, leader_id, meeting_day, location)
    VALUES (?, ?, ?, ?, ?)
  `),

  updateCellGroup: db.prepare(`
    UPDATE cell_groups SET name = ?, type = ?, leader_id = ?, meeting_day = ?, location = ? WHERE id = ?
  `),

  deleteCellGroup: db.prepare('DELETE FROM cell_groups WHERE id = ?'),

  getGroupMembers: db.prepare(`
    SELECT gm.*, w.name as worker_name, w.email, w.phone, w.dept
    FROM group_members gm
    JOIN workers w ON gm.worker_id = w.id
    WHERE gm.group_id = ?
    ORDER BY w.name
  `),

  addGroupMember: db.prepare(`
    INSERT OR REPLACE INTO group_members (group_id, worker_id, role)
    VALUES (?, ?, ?)
  `),

  removeGroupMember: db.prepare('DELETE FROM group_members WHERE group_id = ? AND worker_id = ?'),

  // Assets
  getAllAssets: db.prepare(`
    SELECT a.*, w.name as assigned_worker_name
    FROM assets a
    LEFT JOIN workers w ON a.assigned_to = w.id
    ORDER BY a.name
  `),

  insertAsset: db.prepare(`
    INSERT INTO assets (asset_tag, name, category, location, assigned_to, status, purchase_date, value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateAsset: db.prepare(`
    UPDATE assets SET name = ?, category = ?, location = ?, assigned_to = ?, status = ?, value = ? WHERE id = ?
  `),

  deleteAsset: db.prepare('DELETE FROM assets WHERE id = ?'),
  // Workers
  insertWorker: db.prepare(`
    INSERT INTO workers (external_id, name, email, phone, dept, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  getAllWorkers: db.prepare('SELECT * FROM workers ORDER BY name'),

  getWorkerById: db.prepare('SELECT * FROM workers WHERE id = ?'),

  getWorkerByExternalId: db.prepare('SELECT * FROM workers WHERE external_id = ?'),

  updateWorker: db.prepare(`
    UPDATE workers
    SET name = ?, email = ?, phone = ?, dept = ?, role = ?, status = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deleteWorker: db.prepare('DELETE FROM workers WHERE id = ?'),

  // Attendance
  insertAttendance: db.prepare(`
    INSERT INTO attendance (worker_id, service, status, date)
    VALUES (?, ?, ?, ?)
  `),

  getAllAttendance: db.prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    ORDER BY a.date DESC, a.service
  `),

  getAttendanceByDate: db.prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    WHERE a.date = ?
    ORDER BY a.service, w.name
  `),

  deleteAttendanceByDate: db.prepare('DELETE FROM attendance WHERE date = ?'),

  // KPIs
  getKPIs: db.prepare('SELECT * FROM kpis WHERE id = 1'),

  updateKPIs: db.prepare(`
    UPDATE kpis
    SET total_workers = ?, attendance_today = ?, absent_today = ?, last_sync = CURRENT_TIMESTAMP
    WHERE id = 1
  `),

  // Statistics
  getAttendanceStats: db.prepare(`
    SELECT
      COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as present,
      COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent,
      COUNT(*) as total
    FROM attendance
    WHERE date = ?
  `),

  getWorkerCount: db.prepare('SELECT COUNT(*) as count FROM workers WHERE status = ?'),

  // Absences
  insertAbsence: db.prepare(`
    INSERT INTO absences (worker_id, name, department, reason, other_reason, date_from, date_to, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getAllAbsences: db.prepare(`
    SELECT a.*, w.name as worker_name, w.dept as worker_dept
    FROM absences a
    LEFT JOIN workers w ON a.worker_id = w.id
    ORDER BY a.created_at DESC
  `),

  getAbsenceById: db.prepare('SELECT * FROM absences WHERE id = ?'),

  updateAbsenceStatus: db.prepare(`
    UPDATE absences
    SET status = ?
    WHERE id = ?
  `),

  // Clock-In Records
  insertClockIn: db.prepare(`
    INSERT INTO clock_in_records (worker_id, timestamp, type, latitude, longitude, distance_from_church, is_within_geofence, source, device_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getAllClockIns: db.prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    ORDER BY c.timestamp DESC
  `),

  getClockInsByDate: db.prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    WHERE DATE(c.timestamp) = ?
    ORDER BY c.timestamp DESC
  `),

  getClockInsByWorkerAndDate: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = ?
    ORDER BY timestamp DESC
  `),

  getLatestClockInByWorker: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `),

  getWorkerTodayClockIns: db.prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = DATE('now')
    ORDER BY timestamp
  `),

  // Settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  getAllSettings: db.prepare('SELECT key, value FROM settings'),
  upsertSetting: db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `),

  // Visitors
  getAllVisitors: db.prepare(`
    SELECT v.*, w.name as assigned_worker_name
    FROM visitors v
    LEFT JOIN workers w ON v.assigned_to = w.id
    ORDER BY v.created_at DESC
  `),

  insertVisitor: db.prepare(`
    INSERT INTO visitors (name, email, phone, first_visit_date, assigned_to, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  updateVisitorStatus: db.prepare(`
    UPDATE visitors SET status = ?, assigned_to = ?, notes = ? WHERE id = ?
  `),

  deleteVisitor: db.prepare('DELETE FROM visitors WHERE id = ?'),

  insertVisitorFollowup: db.prepare(`
    INSERT INTO visitor_followups (visitor_id, caller_id, date, medium, feedback)
    VALUES (?, ?, ?, ?, ?)
  `),

  getVisitorFollowups: db.prepare(`
    SELECT f.*, w.name as caller_name
    FROM visitor_followups f
    LEFT JOIN workers w ON f.caller_id = w.id
    WHERE f.visitor_id = ?
    ORDER BY f.date DESC
  `),

  // Cell Groups
  getAllCellGroups: db.prepare(`
    SELECT g.*, w.name as leader_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM cell_groups g
    LEFT JOIN workers w ON g.leader_id = w.id
    ORDER BY g.name
  `),

  insertCellGroup: db.prepare(`
    INSERT INTO cell_groups (name, type, leader_id, meeting_day, location)
    VALUES (?, ?, ?, ?, ?)
  `),

  updateCellGroup: db.prepare(`
    UPDATE cell_groups SET name = ?, type = ?, leader_id = ?, meeting_day = ?, location = ? WHERE id = ?
  `),

  deleteCellGroup: db.prepare('DELETE FROM cell_groups WHERE id = ?'),

  getGroupMembers: db.prepare(`
    SELECT gm.*, w.name as worker_name, w.email, w.phone, w.dept
    FROM group_members gm
    JOIN workers w ON gm.worker_id = w.id
    WHERE gm.group_id = ?
    ORDER BY w.name
  `),

  addGroupMember: db.prepare(`
    INSERT OR REPLACE INTO group_members (group_id, worker_id, role)
    VALUES (?, ?, ?)
  `),

  removeGroupMember: db.prepare('DELETE FROM group_members WHERE group_id = ? AND worker_id = ?'),

  // Assets
  getAllAssets: db.prepare(`
    SELECT a.*, w.name as assigned_worker_name
    FROM assets a
    LEFT JOIN workers w ON a.assigned_to = w.id
    ORDER BY a.name
  `),

  insertAsset: db.prepare(`
    INSERT INTO assets (asset_tag, name, category, location, assigned_to, status, purchase_date, value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateAsset: db.prepare(`
    UPDATE assets SET name = ?, category = ?, location = ?, assigned_to = ?, status = ?, value = ? WHERE id = ?
  `),

  deleteAsset: db.prepare('DELETE FROM assets WHERE id = ?'),

  insertAssetMaintenance: db.prepare(`
    INSERT INTO asset_maintenance (asset_id, service_date, cost, performed_by, notes)
    VALUES (?, ?, ?, ?, ?)
  `),

  getAssetMaintenance: db.prepare('SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY service_date DESC'),

  // Discipleship LMS
  getAllDiscipleshipCourses: db.prepare('SELECT * FROM discipleship_courses ORDER BY id'),

  getMemberCourseProgress: db.prepare(`
    SELECT mc.*, c.title as course_title, c.description as course_description, c.total_modules
    FROM member_courses mc
    JOIN discipleship_courses c ON mc.course_id = c.id
    WHERE mc.worker_id = ?
  `),

  getAllMemberCourses: db.prepare(`
    SELECT mc.*, w.name as worker_name, c.title as course_title
    FROM member_courses mc
    JOIN workers w ON mc.worker_id = w.id
    JOIN discipleship_courses c ON mc.course_id = c.id
    ORDER BY w.name, c.id
  `),

  upsertMemberCourse: db.prepare(`
    INSERT INTO member_courses (worker_id, course_id, status, completion_date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(worker_id, course_id) DO UPDATE SET status = excluded.status, completion_date = excluded.completion_date
  `),

  // Service Plans (Planning Center Services)
  getAllServicePlans: db.prepare(`
    SELECT p.*, w.name as leader_name
    FROM service_plans p
    LEFT JOIN workers w ON p.leader_id = w.id
    ORDER BY p.date DESC
  `),

  insertServicePlan: db.prepare(`
    INSERT INTO service_plans (title, date, service_type, leader_id)
    VALUES (?, ?, ?, ?)
  `),

  updateServicePlan: db.prepare(`
    UPDATE service_plans SET title = ?, date = ?, service_type = ? WHERE id = ?
  `),

  deleteServicePlan: db.prepare('DELETE FROM service_plans WHERE id = ?'),

  getServiceItems: db.prepare('SELECT * FROM service_items WHERE plan_id = ? ORDER BY sequence'),

  insertServiceItem: db.prepare(`
    INSERT INTO service_items (plan_id, sequence, title, duration_minutes, leader_name, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  updateServiceItem: db.prepare(`
    UPDATE service_items SET title = ?, duration_minutes = ?, leader_name = ?, notes = ? WHERE id = ?
  `),

  deleteServiceItem: db.prepare('DELETE FROM service_items WHERE id = ?'),

  getServiceRoster: db.prepare(`
    SELECT r.*, w.name as worker_name, w.phone as worker_phone, w.email as worker_email
    FROM service_rosters r
    JOIN workers w ON r.worker_id = w.id
    WHERE r.plan_id = ?
    ORDER BY r.department, w.name
  `),

  insertServiceRoster: db.prepare(`
    INSERT INTO service_rosters (plan_id, department, worker_id, role_title, status)
    VALUES (?, ?, ?, ?, ?)
  `),

  deleteServiceRoster: db.prepare('DELETE FROM service_rosters WHERE id = ?'),

  // Church Events & Calendar (Planning Center Calendar)
  getAllChurchEvents: db.prepare(`
    SELECT e.*, w.name as organizer_name
    FROM church_events e
    LEFT JOIN workers w ON e.organizer_id = w.id
    ORDER BY e.event_date, e.start_time
  `),

  insertChurchEvent: db.prepare(`
    INSERT INTO church_events (title, description, event_date, start_time, end_time, room_location, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  deleteChurchEvent: db.prepare('DELETE FROM church_events WHERE id = ?'),

  // Kiosk Check-Ins (Planning Center Check-Ins)
  getAllKioskCheckins: db.prepare('SELECT * FROM kiosk_checkins ORDER BY checkin_time DESC'),

  insertKioskCheckin: db.prepare(`
    INSERT INTO kiosk_checkins (child_name, parent_name, parent_phone, department, security_code)
    VALUES (?, ?, ?, ?, ?)
  `),

  updateKioskCheckout: db.prepare(`
    UPDATE kiosk_checkins SET checkout_time = CURRENT_TIMESTAMP, status = 'checked-out' WHERE id = ?
  `),
};

module.exports = { db, statements };

