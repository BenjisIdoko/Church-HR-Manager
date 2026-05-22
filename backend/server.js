const express = require('express')
const cors = require('cors')
const path = require('path')
const { statements } = require('./database')
const jibbleService = require('./jibbleService')

const app = express()
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
  const { username, email, password } = req.body || {}
  const identifier = String(username || email || '').trim().toLowerCase()

  const matchedUser = demoUsers.find((user) => {
    return (user.email.toLowerCase() === identifier || user.name.toLowerCase() === identifier) && user.password === password
  })

  if (matchedUser) {
    const { password: _password, ...safeUser } = matchedUser
    return res.json({ ok: true, user: safeUser })
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
  const { name, email, phone, department, role, status } = req.body || {};

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
      existing.id,
    );

    const updated = statements.getWorkerByExternalId.get(workerId);
    res.json({ ok: true, worker: formatWorker(updated) });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ ok: false, message: 'Failed to update worker.' });
  }
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

app.post('/api/jibble/import', async (req, res) => {
  const { startDate, endDate } = req.body || {}
  const today = new Date().toISOString().split('T')[0]
  const start = String(startDate || today).trim()
  const end = String(endDate || start).trim()

  if (!start || !end) {
    return res.status(400).json({ ok: false, message: 'startDate and endDate are required' })
  }

  try {
    const records = await jibbleService.getJibbleAttendance(start, end)

    if (!Array.isArray(records) || records.length === 0) {
      return res.json({
        ok: true,
        imported: 0,
        message: 'No Jibble attendance records found for the selected range.',
      })
    }

    const mappedRecords = records.map((record) => ({
      'Worker ID': record.employeeId,
      'Worker Name': record.employeeName,
      'Department': 'Jibble',
      'Service': 'Jibble Attendance',
      'Status': record.status,
      'Date': record.date,
    }))

    importAttendance(mappedRecords)
    updateKPIs()
    const kpis = statements.getKPIs.get()

    return res.json({
      ok: true,
      imported: mappedRecords.length,
      lastSync: kpis.last_sync,
      kpis: {
        totalWorkers: kpis.total_workers,
        attendanceToday: kpis.attendance_today,
        absent: kpis.absent_today,
      }
    })
  } catch (error) {
    console.error('Error importing from Jibble:', error)
    res.status(500).json({ ok: false, message: error instanceof Error ? error.message : 'Failed to import from Jibble' })
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

// Export endpoints (mock)
app.get('/api/export/pdf', (req, res) => {
  res.set('Content-Type', 'application/pdf')
  res.send('%PDF-1.4\n% Mock PDF content for prototype')
})

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Backend started on http://localhost:${port}`))
