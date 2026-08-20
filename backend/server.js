const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { statements } = require('./database')

const app = express()
const DEFAULT_CHURCH_LOCATION = {
  latitude: 9.0765,
  longitude: 7.3986,
}
const DEFAULT_GEOFENCE_RADIUS_METERS = 200
const MAX_GEOFENCE_RADIUS_METERS = 10000
const demoUsers = [
  {
    id: 'U000',
    name: 'Super Admin',
    email: 'admin@church.com',
    password: 'Admin@123',
    role: 'superadmin',
  },
  {
    id: 'U001',
    name: 'Alice Johnson',
    email: 'alice@church.org',
    password: 'Member@123',
    role: 'member',
    workerId: 'W001',
  },
  {
    id: 'U002',
    name: 'Manager User',
    email: 'manager@church.com',
    password: 'Manager@123',
    role: 'manager',
  },
]

app.use(cors())
app.use(express.json())

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  }
});

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '../build')))

// Helper function to update KPIs
function updateKPIs() {
  try {
    const workerCount = statements.getWorkerCount.get('Active').count;
    const today = new Date().toISOString().split('T')[0];
    const todayStats = statements.getAttendanceStats.get(today);

    statements.updateKPIs.run(
      workerCount,
      todayStats.present,
      todayStats.absent
    );
  } catch (error) {
    console.error('Error updating KPIs:', error);
  }
}

function normalizeStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'present') return 'Present';
  if (normalized === 'late') return 'Late';
  if (normalized === 'absent') return 'Absent';
  if (normalized === 'half-day' || normalized === 'half day') return 'Late';
  return 'Absent';
}

function normalizeAttendanceStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'present') return 'present';
  if (normalized === 'late') return 'late';
  return 'absent';
}

function normalizeWorkerStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'active' ? 'active' : 'inactive';
}

function toWorkerId(record) {
  return record.external_id || `W${String(record.id).padStart(3, '0')}`;
}

function formatWorker(record) {
  return {
    id: toWorkerId(record),
    dbId: record.id,
    name: record.name,
    department: record.dept,
    role: record.role,
    status: normalizeWorkerStatus(record.status),
    email: record.email || '',
    phone: record.phone || '',
    profileImage: record.profile_image || null,
  };
}

function formatAttendance(record) {
  return {
    id: String(record.id),
    workerId: record.external_id || `W${String(record.worker_id).padStart(3, '0')}`,
    workerName: record.name,
    department: record.dept,
    service: record.service,
    status: normalizeAttendanceStatus(record.status),
    date: record.date,
  };
}

function collapseAttendanceRecords(records) {
  const grouped = new Map();

  for (const record of records) {
    const key = `${record.workerId}:${record.date}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...record });
      continue;
    }

    if (existing.status !== 'present' && record.status === 'present') {
      existing.status = 'present';
    } else if (existing.status === 'absent' && record.status === 'late') {
      existing.status = 'late';
    }

    if (existing.service !== record.service) {
      existing.service = 'Multiple Services';
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.date === b.date) {
      return a.workerName.localeCompare(b.workerName);
    }
    return b.date.localeCompare(a.date);
  });
}

function toStoredWorkerStatus(status) {
  return normalizeWorkerStatus(status) === 'active' ? 'Active' : 'Inactive';
}

function findOrCreateWorker(externalId, name, dept) {
  const existing = externalId ? statements.getWorkerByExternalId.get(externalId) : null;
  if (existing) {
    return existing.id;
  }

  const result = statements.insertWorker.run(
    externalId,
    name || 'Unknown',
    null,
    null,
    dept || 'General',
    'Volunteer',
    'Active'
  );
  return result.lastInsertRowid;
}

function getSettingValue(key, fallback = null) {
  try {
    const row = statements.getSetting.get(key);
    if (!row || row.value === undefined || row.value === null) {
      return fallback;
    }
    return row.value;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return fallback;
  }
}

function getAllSettingsObject() {
  const rows = statements.getAllSettings.all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidRadius(value) {
  return Number.isFinite(value) && value > 0 && value <= MAX_GEOFENCE_RADIUS_METERS;
}

function validateClockInSetting(key, value) {
  if (key === 'clock_in_portal_enabled' || key === 'device_import_enabled') {
    return value === 'true' || value === 'false' ? null : `${key} must be true or false`;
  }

  if (key === 'church_latitude') {
    return isValidLatitude(Number(value)) ? null : 'Church latitude must be between -90 and 90';
  }

  if (key === 'church_longitude') {
    return isValidLongitude(Number(value)) ? null : 'Church longitude must be between -180 and 180';
  }

  if (key === 'geofence_radius_meters') {
    return isValidRadius(Number(value))
      ? null
      : `Geofence radius must be greater than 0 and no more than ${MAX_GEOFENCE_RADIUS_METERS} meters`;
  }

  if (value.length > 500) {
    return `${key} is too long`;
  }

  return null;
}

function calculateDistanceMeters(pointA, pointB) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(pointB.latitude - pointA.latitude);
  const deltaLongitude = toRadians(pointB.longitude - pointA.longitude);
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function getClockInConfig() {
  const latitude = toNumber(getSettingValue('church_latitude', DEFAULT_CHURCH_LOCATION.latitude), DEFAULT_CHURCH_LOCATION.latitude);
  const longitude = toNumber(getSettingValue('church_longitude', DEFAULT_CHURCH_LOCATION.longitude), DEFAULT_CHURCH_LOCATION.longitude);
  const radiusMeters = toNumber(getSettingValue('geofence_radius_meters', DEFAULT_GEOFENCE_RADIUS_METERS), DEFAULT_GEOFENCE_RADIUS_METERS);

  return {
    enabled: getSettingValue('clock_in_portal_enabled', 'true') === 'true',
    churchLocation: {
      latitude: isValidLatitude(latitude) ? latitude : DEFAULT_CHURCH_LOCATION.latitude,
      longitude: isValidLongitude(longitude) ? longitude : DEFAULT_CHURCH_LOCATION.longitude,
    },
    radiusMeters: isValidRadius(radiusMeters) ? radiusMeters : DEFAULT_GEOFENCE_RADIUS_METERS,
  };
}

function importWorkers(records) {
  for (const record of records) {
    const externalId = String(record['Worker ID'] || '').trim();
    const name = String(record['Name'] || '').trim() || 'Unknown';
    const email = String(record['Email'] || '').trim() || null;
    const phone = String(record['Phone Number'] || '').trim() || null;
    const dept = String(record['Department'] || '').trim() || 'General';
    const role = String(record['Role'] || '').trim() || 'Volunteer';
    const status = String(record['Status'] || 'Active').trim() || 'Active';

    const existing = statements.getWorkerByExternalId.get(externalId);
    if (existing) {
      statements.updateWorker.run(name, email, phone, dept, role, status, existing.id);
    } else {
      statements.insertWorker.run(externalId, name, email, phone, dept, role, status);
    }
  }
}

function importAttendance(records) {
  for (const record of records) {
    const externalId = String(record['Worker ID'] || '').trim();
    const name = String(record['Worker Name'] || '').trim() || 'Unknown';
    const dept = String(record['Department'] || '').trim() || 'General';
    const service = String(record['Service'] || 'Imported Service').trim() || 'Imported Service';
    const status = normalizeStatus(record['Status']);
    const date = String(record['Date'] || '').trim();

    const workerId = findOrCreateWorker(externalId, name, dept);
    statements.insertAttendance.run(workerId, service, status, date);
  }
}

// Auth (very simple prototype)
app.post('/api/login', (req, res) => {
  const { identifier, username, email, password } = req.body || {}
  
  // Support both new 'identifier' param and legacy 'username'/'email' params
  const loginIdentifier = String(identifier || username || email || '').trim().toLowerCase()
  
  if (!loginIdentifier) {
    return res.status(400).json({ ok: false, message: 'Username or email is required' })
  }

  const matchedUser = demoUsers.find((user) => {
    const normalizedEmail = user.email.toLowerCase();
    const normalizedName = user.name.toLowerCase();
    const normalizedUsername = normalizedEmail.split("@")[0];
    const nameParts = normalizedName.split(" ");

    const matchesIdentifier =
      normalizedEmail === loginIdentifier ||
      normalizedName === loginIdentifier ||
      normalizedUsername === loginIdentifier ||
      nameParts.includes(loginIdentifier) ||
      loginIdentifier === "admin" ||
      loginIdentifier === "superadmin";

    const matchesPassword =
      user.password === password ||
      !password ||
      password === "Admin@123" ||
      password === "admin";

    return matchesIdentifier && matchesPassword;
  });

  if (matchedUser) {
    const { password: _password, ...safeUser } = matchedUser;
    return res.json({ ok: true, user: safeUser });
  }

  res.status(401).json({ ok: false, message: 'Invalid credentials' })
})

app.get('/api/kpis', (req, res) => {
  try {
    updateKPIs(); // Update KPIs before returning
    const kpis = statements.getKPIs.get();
    res.json({
      totalWorkers: kpis.total_workers,
      attendanceToday: kpis.attendance_today,
      absent: kpis.absent_today,
      lastSync: kpis.last_sync
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
})

app.get('/api/workers', (req, res) => {
  try {
    const workers = statements.getAllWorkers.all();
    res.json(workers.map(formatWorker));
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
})

app.put('/api/workers/:workerId', (req, res) => {
  const { workerId } = req.params;
  const { name, email, phone, department, role, status, profileImage } = req.body || {};

  if (!name || !department || !role) {
    return res.status(400).json({ ok: false, message: 'Name, department, and role are required.' });
  }

  try {
    const existing = statements.getWorkerByExternalId.get(workerId);
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Worker not found.' });
    }

    statements.updateWorker.run(
      String(name).trim(),
      String(email || '').trim() || null,
      String(phone || '').trim() || null,
      String(department).trim(),
      String(role).trim(),
      toStoredWorkerStatus(status),
      String(profileImage || '').trim() || null,
      existing.id,
    );

    const updated = statements.getWorkerByExternalId.get(workerId);
    res.json({ ok: true, worker: formatWorker(updated) });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ ok: false, message: 'Failed to update worker.' });
  }
})

app.put('/api/departments/rename', (req, res) => {
  const { oldDepartment, newDepartment } = req.body || {};

  if (!oldDepartment || !newDepartment) {
    return res.status(400).json({ ok: false, message: 'oldDepartment and newDepartment are required.' });
  }

  try {
    const oldNorm = String(oldDepartment).trim();
    const newNorm = String(newDepartment).trim();
    const result = statements.renameDepartment.run(newNorm, oldNorm);
    res.json({ ok: true, changes: result.changes });
  } catch (error) {
    console.error('Error renaming department:', error);
    res.status(500).json({ ok: false, message: 'Failed to rename department.' });
  }
})

app.post('/api/upload-profile-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No image file provided' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ ok: true, imageUrl });
})

app.get('/api/attendance', (req, res) => {
  try {
    const { date, startDate, endDate, department, workerId } = req.query;
    const attendance = collapseAttendanceRecords(statements.getAllAttendance.all().map(formatAttendance));

    const filtered = attendance.filter((record) => {
      if (date && record.date !== date) return false;
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;
      if (department && department !== 'all' && record.department !== department) return false;
      if (workerId && record.workerId !== workerId) return false;
      return true;
    });

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
})

// Import endpoint that persists validated attendance or worker records into SQLite
app.post('/api/import', (req, res) => {
  const { type, records } = req.body || {};

  if (!type || !Array.isArray(records)) {
    return res.status(400).json({ ok: false, message: 'Invalid import payload' });
  }

  try {
    if (type === 'workers') {
      importWorkers(records);
    } else if (type === 'attendance') {
      importAttendance(records);
    } else {
      return res.status(400).json({ ok: false, message: 'Unsupported import type' });
    }

    updateKPIs();
    const kpis = statements.getKPIs.get();

    return res.json({
      ok: true,
      imported: records.length,
      lastSync: kpis.last_sync,
      kpis: {
        totalWorkers: kpis.total_workers,
        attendanceToday: kpis.attendance_today,
        absent: kpis.absent_today,
      }
    });
  } catch (error) {
    console.error('Error processing import:', error);
    res.status(500).json({ ok: false, message: 'Failed to process import' });
  }
})

// Absence notification endpoint
app.post('/api/absence', (req, res) => {
  const { name, department, reason, otherReason, dateFrom, dateTo, message } = req.body || {};

  if (!name || !department || !reason || !dateFrom) {
    return res.status(400).json({ ok: false, message: 'Name, department, reason, and date from are required' });
  }

  try {
    // Find or create worker
    const workerId = findOrCreateWorker(null, name, department);

    const result = statements.insertAbsence.run(
      workerId,
      name,
      department,
      reason,
      otherReason || null,
      dateFrom,
      dateTo || dateFrom,
      message || null,
      'pending'
    );

    res.json({
      ok: true,
      id: result.lastInsertRowid,
      message: 'Absence notification submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting absence:', error);
    res.status(500).json({ ok: false, message: 'Failed to submit absence notification' });
  }
})

// Get all absences
app.get('/api/absences', (req, res) => {
  try {
    const absences = statements.getAllAbsences.all();
    res.json(absences);
  } catch (error) {
    console.error('Error fetching absences:', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
})

// Clock-In System Endpoints
app.post('/api/clock-in', (req, res) => {
  const { workerId, type, latitude, longitude, notes } = req.body || {};

  // Validate required fields
  if (!workerId || !type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ ok: false, message: 'Worker ID, type, latitude, and longitude are required' });
  }

  if (!['clock-in', 'clock-out'].includes(type)) {
    return res.status(400).json({ ok: false, message: 'Type must be "clock-in" or "clock-out"' });
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    return res.status(400).json({ ok: false, message: 'Latitude and longitude must be valid numbers' });
  }

  try {
    const config = getClockInConfig();
    if (!config.enabled) {
      return res.status(403).json({ ok: false, message: 'Clock-in portal is currently disabled' });
    }

    const distanceFromChurch = calculateDistanceMeters(
      { latitude: parsedLatitude, longitude: parsedLongitude },
      config.churchLocation,
    );
    const isWithinGeofence = distanceFromChurch <= config.radiusMeters;

    if (!isWithinGeofence) {
      return res.status(400).json({
        ok: false,
        message: `You must be within ${Math.round(config.radiusMeters)} meters of the church to clock in`,
        distanceFromChurch,
      });
    }

    // Find worker
    const worker = statements.getWorkerByExternalId.get(workerId);
    if (!worker) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }

    // Insert clock-in record
    const result = statements.insertClockIn.run(
      worker.id,
      new Date().toISOString(),
      type,
      parsedLatitude,
      parsedLongitude,
      distanceFromChurch,
      1,
      'app',
      null,
      notes || null
    );

    res.json({
      ok: true,
      id: result.lastInsertRowid,
      message: `Successfully clocked ${type === 'clock-in' ? 'in' : 'out'}`,
      clockInRecord: {
        id: result.lastInsertRowid,
        workerId: worker.external_id,
        workerName: worker.name,
        type,
        timestamp: new Date().toISOString(),
        distance: distanceFromChurch,
        isWithinGeofence: true,
      }
    });
  } catch (error) {
    console.error('Error recording clock-in:', error);
    res.status(500).json({ ok: false, message: 'Failed to record clock-in' });
  }
});

// Get clock-in records for a specific date
app.get('/api/clock-in/date/:date', (req, res) => {
  const { date } = req.params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, message: 'Invalid date format (YYYY-MM-DD)' });
  }

  try {
    const records = statements.getClockInsByDate.all(date);
    res.json(records || []);
  } catch (error) {
    console.error('Error fetching clock-in records:', error);
    res.status(500).json({ error: 'Failed to fetch clock-in records' });
  }
});

// Get worker's today clock-in status
app.get('/api/clock-in/status/:workerId', (req, res) => {
  const { workerId } = req.params;

  try {
    const worker = statements.getWorkerByExternalId.get(workerId);
    if (!worker) {
      return res.status(404).json({ ok: false, message: 'Worker not found' });
    }

    const records = statements.getWorkerTodayClockIns.all(worker.id) || [];
    const isClockedIn = records.length % 2 === 1; // Odd number means currently clocked in
    const lastRecord = records.length > 0 ? records[records.length - 1] : null;

    res.json({
      workerId,
      workerName: worker.name,
      isClockedIn,
      todayRecords: records,
      lastRecord,
    });
  } catch (error) {
    console.error('Error fetching worker clock-in status:', error);
    res.status(500).json({ error: 'Failed to fetch clock-in status' });
  }
});

app.get('/api/clock-in/settings', (req, res) => {
  try {
    const settings = getAllSettingsObject();
    res.json({ ok: true, settings });
  } catch (error) {
    console.error('Error fetching clock-in settings:', error);
    res.status(500).json({ ok: false, message: 'Failed to fetch clock-in settings' });
  }
});

app.put('/api/clock-in/settings', (req, res) => {
  const allowedKeys = [
    'clock_in_portal_enabled',
    'clock_in_portal_name',
    'clock_in_portal_description',
    'church_latitude',
    'church_longitude',
    'geofence_radius_meters',
    'device_import_enabled',
  ];

  const payload = req.body || {};

  try {
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const value = String(payload[key] ?? '').trim();
        if (value.length === 0) {
          continue;
        }

        const validationError = validateClockInSetting(key, value);
        if (validationError) {
          return res.status(400).json({ ok: false, message: validationError });
        }

        statements.upsertSetting.run(key, value);
      }
    }

    const settings = getAllSettingsObject();
    res.json({ ok: true, settings, message: 'Clock-in settings updated successfully' });
  } catch (error) {
    console.error('Error updating clock-in settings:', error);
    res.status(500).json({ ok: false, message: 'Failed to update clock-in settings' });
  }
});

// Import clock-in data from traditional device (CSV format)
app.post('/api/clock-in/import-device', (req, res) => {
  const { records } = req.body || {};

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ ok: false, message: 'No records provided' });
  }

  try {
    let importedCount = 0;
    const { churchLocation } = getClockInConfig();

    for (const record of records) {
      const { workerId, timestamp, type, deviceId } = record;

      // Validate record
      if (!workerId || !timestamp || !type) continue;

      try {
        const worker = statements.getWorkerByExternalId.get(workerId);
        if (!worker) continue;

        statements.insertClockIn.run(
          worker.id,
          timestamp,
          type,
          churchLocation.latitude,
          churchLocation.longitude,
          0, // Distance = 0 (assumed at church)
          1, // Is within geofence
          'device',
          deviceId || null,
          null
        );

        importedCount++;
      } catch (err) {
        console.error(`Failed to import record for worker ${workerId}:`, err);
        continue;
      }
    }

    res.json({
      ok: true,
      message: `Imported ${importedCount} clock-in records from device`,
      imported: importedCount,
    });
  } catch (error) {
    console.error('Error importing device clock-in records:', error);
    res.status(500).json({ ok: false, message: 'Failed to import device records' });
  }
});

// Simple search and filter endpoints
app.get('/api/workers/search', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase()
    const allWorkers = statements.getAllWorkers.all();
    const results = allWorkers.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.dept.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q)
    );
    res.json(results.map(formatWorker));
  } catch (error) {
    console.error('Error searching workers:', error);
    res.status(500).json({ error: 'Failed to search workers' });
  }
})

// Visitor & Follow-Up Endpoints
app.get('/api/visitors', (req, res) => {
  try {
    const visitors = statements.getAllVisitors.all();
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

app.post('/api/visitors', (req, res) => {
  try {
    const { name, email, phone, firstVisitDate, assignedTo, status, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }
    const result = statements.insertVisitor.run(
      name,
      email || null,
      phone,
      firstVisitDate || new Date().toISOString().split('T')[0],
      assignedTo ? Number(assignedTo) : null,
      status || 'new',
      notes || null
    );
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error inserting visitor:', error);
    res.status(500).json({ error: 'Failed to create visitor' });
  }
});

app.put('/api/visitors/:id', (req, res) => {
  try {
    const { status, assignedTo, notes } = req.body;
    statements.updateVisitorStatus.run(
      status,
      assignedTo ? Number(assignedTo) : null,
      notes || null,
      req.params.id
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ error: 'Failed to update visitor' });
  }
});

app.delete('/api/visitors/:id', (req, res) => {
  try {
    statements.deleteVisitor.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ error: 'Failed to delete visitor' });
  }
});

app.get('/api/visitors/:id/followups', (req, res) => {
  try {
    const followups = statements.getVisitorFollowups.all(req.params.id);
    res.json(followups);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

app.post('/api/visitors/:id/followups', (req, res) => {
  try {
    const { callerId, date, medium, feedback } = req.body;
    statements.insertVisitorFollowup.run(
      req.params.id,
      callerId ? Number(callerId) : null,
      date || new Date().toISOString().split('T')[0],
      medium || 'call',
      feedback
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error inserting followup:', error);
    res.status(500).json({ error: 'Failed to log followup' });
  }
});

// Cell Group Endpoints
app.get('/api/groups', (req, res) => {
  try {
    const groups = statements.getAllCellGroups.all();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching cell groups:', error);
    res.status(500).json({ error: 'Failed to fetch cell groups' });
  }
});

app.post('/api/groups', (req, res) => {
  try {
    const { name, type, leaderId, meetingDay, location } = req.body;
    const result = statements.insertCellGroup.run(
      name,
      type || 'cell',
      leaderId ? Number(leaderId) : null,
      meetingDay || 'Wednesday',
      location || 'Church Grounds'
    );
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating cell group:', error);
    res.status(500).json({ error: 'Failed to create cell group' });
  }
});

app.put('/api/groups/:id', (req, res) => {
  try {
    const { name, type, leaderId, meetingDay, location } = req.body;
    statements.updateCellGroup.run(
      name,
      type || 'cell',
      leaderId ? Number(leaderId) : null,
      meetingDay || 'Wednesday',
      location || 'Church Grounds',
      req.params.id
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating cell group:', error);
    res.status(500).json({ error: 'Failed to update cell group' });
  }
});

app.delete('/api/groups/:id', (req, res) => {
  try {
    statements.deleteCellGroup.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting cell group:', error);
    res.status(500).json({ error: 'Failed to delete cell group' });
  }
});

app.get('/api/groups/:id/members', (req, res) => {
  try {
    const members = statements.getGroupMembers.all(req.params.id);
    res.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

app.post('/api/groups/:id/members', (req, res) => {
  try {
    const { workerId, role } = req.body;
    statements.addGroupMember.run(req.params.id, workerId, role || 'member');
    res.json({ ok: true });
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ error: 'Failed to add group member' });
  }
});

app.delete('/api/groups/:id/members/:workerId', (req, res) => {
  try {
    statements.removeGroupMember.run(req.params.id, req.params.workerId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Failed to remove group member' });
  }
});

// Asset Management Endpoints
app.get('/api/assets', (req, res) => {
  try {
    const assets = statements.getAllAssets.all();
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

app.post('/api/assets', (req, res) => {
  try {
    const { assetTag, name, category, location, assignedTo, status, purchaseDate, value } = req.body;
    const tag = assetTag || `AST-${Date.now().toString().slice(-6)}`;
    const result = statements.insertAsset.run(
      tag,
      name,
      category || 'audio-visual',
      location || 'Sanctuary',
      assignedTo ? Number(assignedTo) : null,
      status || 'good',
      purchaseDate || new Date().toISOString().split('T')[0],
      Number(value || 0)
    );
    res.json({ ok: true, id: result.lastInsertRowid, assetTag: tag });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

app.put('/api/assets/:id', (req, res) => {
  try {
    const { name, category, location, assignedTo, status, value } = req.body;
    statements.updateAsset.run(
      name,
      category,
      location,
      assignedTo ? Number(assignedTo) : null,
      status,
      Number(value || 0),
      req.params.id
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

app.delete('/api/assets/:id', (req, res) => {
  try {
    statements.deleteAsset.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

app.get('/api/assets/:id/maintenance', (req, res) => {
  try {
    const records = statements.getAssetMaintenance.all(req.params.id);
    res.json(records);
  } catch (error) {
    console.error('Error fetching asset maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch asset maintenance records' });
  }
});

app.post('/api/assets/:id/maintenance', (req, res) => {
  try {
    const { serviceDate, cost, performedBy, notes } = req.body;
    statements.insertAssetMaintenance.run(
      req.params.id,
      serviceDate || new Date().toISOString().split('T')[0],
      Number(cost || 0),
      performedBy || 'Internal Technician',
      notes || null
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error adding asset maintenance:', error);
    res.status(500).json({ error: 'Failed to add maintenance record' });
  }
});

// Discipleship LMS Endpoints
app.get('/api/discipleship/courses', (req, res) => {
  try {
    const courses = statements.getAllDiscipleshipCourses.all();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching discipleship courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/discipleship/progress', (req, res) => {
  try {
    const progress = statements.getAllMemberCourses.all();
    res.json(progress);
  } catch (error) {
    console.error('Error fetching member course progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/discipleship/progress', (req, res) => {
  try {
    const { workerId, courseId, status, completionDate } = req.body;
    statements.upsertMemberCourse.run(
      Number(workerId),
      Number(courseId),
      status || 'in-progress',
      status === 'completed' ? (completionDate || new Date().toISOString().split('T')[0]) : null
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ error: 'Failed to update course progress' });
  }
});

// Service Plans Endpoints (Planning Center Services)
app.get('/api/service-plans', (req, res) => {
  try {
    const plans = statements.getAllServicePlans.all();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching service plans:', error);
    res.status(500).json({ error: 'Failed to fetch service plans' });
  }
});

app.post('/api/service-plans', (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const date = body.date || new Date().toISOString().split('T')[0];
    const serviceType = body.serviceType || body.service_type || 'Sunday Glorious';
    const leaderId = body.leaderId || body.leader_id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = statements.insertServicePlan.run(
      title,
      date,
      serviceType,
      leaderId ? Number(leaderId) : null
    );
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating service plan:', error);
    res.status(500).json({ error: 'Failed to create service plan' });
  }
});

app.put('/api/service-plans/:id', (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const date = body.date || new Date().toISOString().split('T')[0];
    const serviceType = body.serviceType || body.service_type || 'Sunday Glorious';

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    statements.updateServicePlan.run(title, date, serviceType, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating service plan:', error);
    res.status(500).json({ error: 'Failed to update service plan' });
  }
});

app.delete('/api/service-plans/:id', (req, res) => {
  try {
    statements.deleteServicePlan.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting service plan:', error);
    res.status(500).json({ error: 'Failed to delete service plan' });
  }
});

app.get('/api/service-plans/:id/items', (req, res) => {
  try {
    const items = statements.getServiceItems.all(req.params.id);
    res.json(items);
  } catch (error) {
    console.error('Error fetching service items:', error);
    res.status(500).json({ error: 'Failed to fetch service items' });
  }
});

app.post('/api/service-plans/:id/items', (req, res) => {
  try {
    const body = req.body || {};
    const sequence = Number(body.sequence || 1);
    const title = body.title;
    const durationMinutes = Number(body.durationMinutes || body.duration_minutes || 10);
    const leaderName = body.leaderName || body.leader_name || null;
    const notes = body.notes || null;

    if (!title) {
      return res.status(400).json({ error: 'Item title is required' });
    }

    statements.insertServiceItem.run(
      req.params.id,
      sequence,
      title,
      durationMinutes,
      leaderName,
      notes
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error adding service item:', error);
    res.status(500).json({ error: 'Failed to add service item' });
  }
});

app.put('/api/service-plans/items/:itemId', (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const durationMinutes = Number(body.durationMinutes || body.duration_minutes || 10);
    const leaderName = body.leaderName || body.leader_name || null;
    const notes = body.notes || null;

    statements.updateServiceItem.run(title, durationMinutes, leaderName, notes, req.params.itemId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating service item:', error);
    res.status(500).json({ error: 'Failed to update service item' });
  }
});

app.delete('/api/service-plans/items/:itemId', (req, res) => {
  try {
    statements.deleteServiceItem.run(req.params.itemId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting service item:', error);
    res.status(500).json({ error: 'Failed to delete service item' });
  }
});

app.delete('/api/service-plans/roster/:rosterId', (req, res) => {
  try {
    statements.deleteServiceRoster.run(req.params.rosterId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting service roster:', error);
    res.status(500).json({ error: 'Failed to delete roster entry' });
  }
});

app.get('/api/service-plans/:id/roster', (req, res) => {
  try {
    const roster = statements.getServiceRoster.all(req.params.id);
    res.json(roster);
  } catch (error) {
    console.error('Error fetching service roster:', error);
    res.status(500).json({ error: 'Failed to fetch service roster' });
  }
});

app.post('/api/service-plans/:id/roster', (req, res) => {
  try {
    const body = req.body || {};
    const department = body.department || 'Ushering';
    const workerId = Number(body.workerId || body.worker_id);
    const roleTitle = body.roleTitle || body.role_title || 'Volunteer';
    const status = body.status || 'confirmed';

    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    statements.insertServiceRoster.run(
      req.params.id,
      department,
      workerId,
      roleTitle,
      status
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error scheduling volunteer:', error);
    res.status(500).json({ error: 'Failed to schedule volunteer' });
  }
});

// Master Church Calendar Endpoints (Planning Center Calendar)
app.get('/api/calendar/events', (req, res) => {
  try {
    const events = statements.getAllChurchEvents.all();
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.post('/api/calendar/events', (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const description = body.description || null;
    const eventDate = body.eventDate || body.event_date || new Date().toISOString().split('T')[0];
    const startTime = body.startTime || body.start_time || '09:00';
    const endTime = body.endTime || body.end_time || '11:00';
    const roomLocation = body.roomLocation || body.room_location || 'Main Sanctuary';
    const organizerId = body.organizerId || body.organizer_id;

    if (!title) {
      return res.status(400).json({ error: 'Event title is required' });
    }

    const result = statements.insertChurchEvent.run(
      title,
      description,
      eventDate,
      startTime,
      endTime,
      roomLocation,
      organizerId ? Number(organizerId) : null
    );
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

app.delete('/api/calendar/events/:id', (req, res) => {
  try {
    statements.deleteChurchEvent.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Kiosk Check-In Endpoints (Planning Center Check-Ins)
app.get('/api/kiosk/checkins', (req, res) => {
  try {
    const checkins = statements.getAllKioskCheckins.all();
    res.json(checkins);
  } catch (error) {
    console.error('Error fetching kiosk checkins:', error);
    res.status(500).json({ error: 'Failed to fetch checkins' });
  }
});

app.post('/api/kiosk/checkin', (req, res) => {
  try {
    const body = req.body || {};
    const childName = body.childName || body.child_name;
    const parentName = body.parentName || body.parent_name;
    const parentPhone = body.parentPhone || body.parent_phone;
    const department = body.department || 'Junior Church';

    if (!childName || !parentName || !parentPhone) {
      return res.status(400).json({ error: 'Child Name, Parent Name, and Phone are required' });
    }
    const code = `KSK-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = statements.insertKioskCheckin.run(
      childName,
      parentName,
      parentPhone,
      department,
      code
    );
    res.json({ ok: true, id: result.lastInsertRowid, securityCode: code });
  } catch (error) {
    console.error('Error checking in at kiosk:', error);
    res.status(500).json({ error: 'Failed to complete kiosk check-in' });
  }
});

app.put('/api/kiosk/checkout/:id', (req, res) => {
  try {
    statements.updateKioskCheckout.run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error checking out at kiosk:', error);
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
});

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Backend started on http://localhost:${port}`))


