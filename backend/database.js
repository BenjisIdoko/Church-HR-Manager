const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = process.env.DB_PATH || path.join(__dirname, 'church_hr.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = `
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
INSERT OR IGNORE INTO settings (key, value) VALUES ('device_import_enabled', 'true');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_workers_dept ON workers(dept);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_clock_in_worker_id ON clock_in_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_timestamp ON clock_in_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_clock_in_date ON clock_in_records(DATE(timestamp));
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

// Prepared statements for common operations
const statements = {
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
    SET name = ?, email = ?, phone = ?, dept = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP
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
};

module.exports = { db, statements };
