const { createClient } = require('@libsql/client');

// Turso (libSQL) connection. TURSO_DATABASE_URL / TURSO_AUTH_TOKEN must be set
// in the environment (locally via backend/.env, in production via the Vercel
// project's environment variables).
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function normalizeRows(result) {
  const { columns, rows } = result;
  return rows.map((row) => {
    const obj = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i]] = row[i];
    }
    return obj;
  });
}

// Mimics better-sqlite3's db.prepare(sql).get/.all/.run() shape, backed by
// the async Turso client, so call sites only need `await` added in front.
function prepare(sql) {
  return {
    async get(...args) {
      const result = await client.execute({ sql, args });
      const rows = normalizeRows(result);
      return rows[0];
    },
    async all(...args) {
      const result = await client.execute({ sql, args });
      return normalizeRows(result);
    },
    async run(...args) {
      const result = await client.execute({ sql, args });
      return {
        lastInsertRowid: result.lastInsertRowid !== undefined && result.lastInsertRowid !== null
          ? Number(result.lastInsertRowid)
          : undefined,
        changes: result.rowsAffected,
      };
    },
  };
}

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

let readyPromise = null;

// Runs schema creation / migrations / seeding exactly once per warm process
// (Vercel reuses the same container across requests within its lifetime).
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await client.execute('PRAGMA foreign_keys = ON');
      await client.executeMultiple(createTables);

      const workerColumnsResult = await client.execute('PRAGMA table_info(workers)');
      const workerColumns = normalizeRows(workerColumnsResult).map((col) => col.name);
      if (!workerColumns.includes('external_id')) {
        await client.execute('ALTER TABLE workers ADD COLUMN external_id TEXT');
      }
      await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_external_id ON workers(external_id)');
      await client.execute(`
        UPDATE workers
        SET external_id = 'LEGACY-' || substr('000' || id, -3, 3)
        WHERE external_id IS NULL OR trim(external_id) = ''
      `);

      const duplicateWorkersResult = await client.execute(`
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
      `);
      const duplicateWorkers = normalizeRows(duplicateWorkersResult);

      if (duplicateWorkers.length > 0) {
        const batchStatements = [];
        for (const pair of duplicateWorkers) {
          batchStatements.push({ sql: 'DELETE FROM attendance WHERE worker_id = ?', args: [pair.legacy_id] });
          batchStatements.push({ sql: 'DELETE FROM absences WHERE worker_id = ?', args: [pair.legacy_id] });
          batchStatements.push({ sql: 'DELETE FROM workers WHERE id = ?', args: [pair.legacy_id] });
        }
        await client.batch(batchStatements, 'write');
      }

      const courseCountResult = await client.execute('SELECT COUNT(*) as count FROM discipleship_courses');
      const courseCount = normalizeRows(courseCountResult)[0].count;
      if (courseCount === 0) {
        await client.executeMultiple(`
          INSERT INTO discipleship_courses (title, description, total_modules) VALUES
          ('Believers Foundation Class', 'Core doctrines, salvation, prayer, and bible study basics.', 4),
          ('Water Baptism Prep', 'Understanding baptism, covenant, and Christian discipleship.', 2),
          ('Workers Training Academy', 'Church department protocols, leadership standards, and ministry ethics.', 6),
          ('Leadership Excellence Course', 'Advanced pastoral care, cell leadership, and organizational management.', 8);
        `);
      }
    })().catch((error) => {
      readyPromise = null; // allow retry on the next request instead of caching a failure forever
      throw error;
    });
  }
  return readyPromise;
}

// Prepared statements for common operations. Every method is async now
// (backed by the Turso HTTP client) - callers must `await` these.
const statements = {
  // Users / Auth
  getUserByEmail: prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)'),
  getUserByIdentifier: prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(worker_id) = LOWER(?)'),
  getUserById: prepare('SELECT id, name, email, role, worker_id FROM users WHERE id = ?'),
  insertUser: prepare(`
    INSERT OR REPLACE INTO users (name, email, password_hash, role, worker_id)
    VALUES (?, LOWER(?), ?, ?, ?)
  `),
  getAllUsers: prepare('SELECT id, name, email, role, worker_id FROM users'),

  // Workers
  insertWorker: prepare(`
    INSERT OR REPLACE INTO workers (external_id, name, email, phone, dept, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  getAllWorkers: prepare('SELECT * FROM workers ORDER BY name'),
  getWorkerById: prepare('SELECT * FROM workers WHERE id = ?'),
  getWorkerByExternalId: prepare('SELECT * FROM workers WHERE external_id = ?'),
  updateWorker: prepare(`
    UPDATE workers
    SET name = ?, email = ?, phone = ?, dept = ?, role = ?, status = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteWorker: prepare('DELETE FROM workers WHERE id = ?'),
  renameDepartment: prepare(`
    UPDATE workers
    SET dept = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dept = ?
  `),

  // Attendance
  insertAttendance: prepare(`
    INSERT INTO attendance (worker_id, service, status, date)
    VALUES (?, ?, ?, ?)
  `),
  getAllAttendance: prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    ORDER BY a.date DESC, a.service
  `),
  getAttendanceByDate: prepare(`
    SELECT a.*, w.name, w.dept, w.external_id
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    WHERE a.date = ?
    ORDER BY a.service, w.name
  `),
  deleteAttendanceByDate: prepare('DELETE FROM attendance WHERE date = ?'),

  // KPIs
  getKPIs: prepare('SELECT * FROM kpis WHERE id = 1'),
  updateKPIs: prepare(`
    UPDATE kpis
    SET total_workers = ?, attendance_today = ?, absent_today = ?, last_sync = CURRENT_TIMESTAMP
    WHERE id = 1
  `),

  // Statistics
  getAttendanceStats: prepare(`
    SELECT
      COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as present,
      COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent,
      COUNT(*) as total
    FROM attendance
    WHERE date = ?
  `),
  getWorkerCount: prepare('SELECT COUNT(*) as count FROM workers WHERE status = ?'),

  // Absences
  insertAbsence: prepare(`
    INSERT INTO absences (worker_id, name, department, reason, other_reason, date_from, date_to, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getAllAbsences: prepare(`
    SELECT a.*, w.name as worker_name, w.dept as worker_dept
    FROM absences a
    LEFT JOIN workers w ON a.worker_id = w.id
    ORDER BY a.created_at DESC
  `),
  getAbsenceById: prepare('SELECT * FROM absences WHERE id = ?'),
  updateAbsenceStatus: prepare(`
    UPDATE absences
    SET status = ?
    WHERE id = ?
  `),

  // Clock-In Records
  insertClockIn: prepare(`
    INSERT INTO clock_in_records (worker_id, timestamp, type, latitude, longitude, distance_from_church, is_within_geofence, source, device_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getAllClockIns: prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    ORDER BY c.timestamp DESC
  `),
  getClockInsByDate: prepare(`
    SELECT c.*, w.name as worker_name, w.dept as worker_dept, w.external_id
    FROM clock_in_records c
    JOIN workers w ON c.worker_id = w.id
    WHERE DATE(c.timestamp) = ?
    ORDER BY c.timestamp DESC
  `),
  getClockInsByWorkerAndDate: prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = ?
    ORDER BY timestamp DESC
  `),
  getLatestClockInByWorker: prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `),
  getWorkerTodayClockIns: prepare(`
    SELECT *
    FROM clock_in_records
    WHERE worker_id = ? AND DATE(timestamp) = DATE('now')
    ORDER BY timestamp
  `),

  // Settings
  getSetting: prepare('SELECT value FROM settings WHERE key = ?'),
  getAllSettings: prepare('SELECT key, value FROM settings'),
  upsertSetting: prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `),

  // Visitors
  getAllVisitors: prepare(`
    SELECT v.*, w.name as assigned_worker_name
    FROM visitors v
    LEFT JOIN workers w ON v.assigned_to = w.id
    ORDER BY v.created_at DESC
  `),
  insertVisitor: prepare(`
    INSERT INTO visitors (name, email, phone, first_visit_date, assigned_to, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  updateVisitorStatus: prepare(`
    UPDATE visitors SET status = ?, assigned_to = ?, notes = ? WHERE id = ?
  `),
  deleteVisitor: prepare('DELETE FROM visitors WHERE id = ?'),
  insertVisitorFollowup: prepare(`
    INSERT INTO visitor_followups (visitor_id, caller_id, date, medium, feedback)
    VALUES (?, ?, ?, ?, ?)
  `),
  getVisitorFollowups: prepare(`
    SELECT f.*, w.name as caller_name
    FROM visitor_followups f
    LEFT JOIN workers w ON f.caller_id = w.id
    WHERE f.visitor_id = ?
    ORDER BY f.date DESC
  `),

  // Cell Groups
  getAllCellGroups: prepare(`
    SELECT g.*, w.name as leader_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM cell_groups g
    LEFT JOIN workers w ON g.leader_id = w.id
    ORDER BY g.name
  `),
  insertCellGroup: prepare(`
    INSERT INTO cell_groups (name, type, leader_id, meeting_day, location)
    VALUES (?, ?, ?, ?, ?)
  `),
  updateCellGroup: prepare(`
    UPDATE cell_groups SET name = ?, type = ?, leader_id = ?, meeting_day = ?, location = ? WHERE id = ?
  `),
  deleteCellGroup: prepare('DELETE FROM cell_groups WHERE id = ?'),
  getGroupMembers: prepare(`
    SELECT gm.*, w.name as worker_name, w.email, w.phone, w.dept
    FROM group_members gm
    JOIN workers w ON gm.worker_id = w.id
    WHERE gm.group_id = ?
    ORDER BY w.name
  `),
  addGroupMember: prepare(`
    INSERT OR REPLACE INTO group_members (group_id, worker_id, role)
    VALUES (?, ?, ?)
  `),
  removeGroupMember: prepare('DELETE FROM group_members WHERE group_id = ? AND worker_id = ?'),

  // Assets
  getAllAssets: prepare(`
    SELECT a.*, w.name as assigned_worker_name
    FROM assets a
    LEFT JOIN workers w ON a.assigned_to = w.id
    ORDER BY a.name
  `),
  insertAsset: prepare(`
    INSERT INTO assets (asset_tag, name, category, location, assigned_to, status, purchase_date, value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateAsset: prepare(`
    UPDATE assets SET name = ?, category = ?, location = ?, assigned_to = ?, status = ?, value = ? WHERE id = ?
  `),
  deleteAsset: prepare('DELETE FROM assets WHERE id = ?'),
  insertAssetMaintenance: prepare(`
    INSERT INTO asset_maintenance (asset_id, service_date, cost, performed_by, notes)
    VALUES (?, ?, ?, ?, ?)
  `),
  getAssetMaintenance: prepare('SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY service_date DESC'),

  // Discipleship LMS
  getAllDiscipleshipCourses: prepare('SELECT * FROM discipleship_courses ORDER BY id'),
  getMemberCourseProgress: prepare(`
    SELECT mc.*, c.title as course_title, c.description as course_description, c.total_modules
    FROM member_courses mc
    JOIN discipleship_courses c ON mc.course_id = c.id
    WHERE mc.worker_id = ?
  `),
  getAllMemberCourses: prepare(`
    SELECT mc.*, w.name as worker_name, c.title as course_title
    FROM member_courses mc
    JOIN workers w ON mc.worker_id = w.id
    JOIN discipleship_courses c ON mc.course_id = c.id
    ORDER BY w.name, c.id
  `),
  upsertMemberCourse: prepare(`
    INSERT INTO member_courses (worker_id, course_id, status, completion_date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(worker_id, course_id) DO UPDATE SET status = excluded.status, completion_date = excluded.completion_date
  `),

  // Service Plans (Planning Center Services)
  getAllServicePlans: prepare(`
    SELECT p.*, w.name as leader_name
    FROM service_plans p
    LEFT JOIN workers w ON p.leader_id = w.id
    ORDER BY p.date DESC
  `),
  insertServicePlan: prepare(`
    INSERT INTO service_plans (title, date, service_type, leader_id)
    VALUES (?, ?, ?, ?)
  `),
  updateServicePlan: prepare(`
    UPDATE service_plans SET title = ?, date = ?, service_type = ? WHERE id = ?
  `),
  deleteServicePlan: prepare('DELETE FROM service_plans WHERE id = ?'),
  getServiceItems: prepare('SELECT * FROM service_items WHERE plan_id = ? ORDER BY sequence'),
  insertServiceItem: prepare(`
    INSERT INTO service_items (plan_id, sequence, title, duration_minutes, leader_name, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  updateServiceItem: prepare(`
    UPDATE service_items SET title = ?, duration_minutes = ?, leader_name = ?, notes = ? WHERE id = ?
  `),
  deleteServiceItem: prepare('DELETE FROM service_items WHERE id = ?'),
  getServiceRoster: prepare(`
    SELECT r.*, w.name as worker_name, w.phone as worker_phone, w.email as worker_email
    FROM service_rosters r
    JOIN workers w ON r.worker_id = w.id
    WHERE r.plan_id = ?
    ORDER BY r.department, w.name
  `),
  insertServiceRoster: prepare(`
    INSERT INTO service_rosters (plan_id, department, worker_id, role_title, status)
    VALUES (?, ?, ?, ?, ?)
  `),
  deleteServiceRoster: prepare('DELETE FROM service_rosters WHERE id = ?'),

  // Church Events & Calendar (Planning Center Calendar)
  getAllChurchEvents: prepare(`
    SELECT e.*, w.name as organizer_name
    FROM church_events e
    LEFT JOIN workers w ON e.organizer_id = w.id
    ORDER BY e.event_date, e.start_time
  `),
  insertChurchEvent: prepare(`
    INSERT INTO church_events (title, description, event_date, start_time, end_time, room_location, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  deleteChurchEvent: prepare('DELETE FROM church_events WHERE id = ?'),

  // Kiosk Check-Ins (Planning Center Check-Ins)
  getAllKioskCheckins: prepare('SELECT * FROM kiosk_checkins ORDER BY checkin_time DESC'),
  insertKioskCheckin: prepare(`
    INSERT INTO kiosk_checkins (child_name, parent_name, parent_phone, department, security_code)
    VALUES (?, ?, ?, ?, ?)
  `),
  updateKioskCheckout: prepare(`
    UPDATE kiosk_checkins SET checkout_time = CURRENT_TIMESTAMP, status = 'checked-out' WHERE id = ?
  `),
};

// Escape hatch for raw multi-statement SQL (used by seed.js's demo-data
// wipe). Regular request-handling code should go through `statements`.
async function execRaw(sql) {
  await client.executeMultiple(sql);
}

module.exports = { statements, ensureReady, execRaw };
