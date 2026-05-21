const express = require('express')
const cors = require('cors')
const path = require('path')
const { statements } = require('./database')
const jibbleService = require('./jibbleService')

const app = express()

app.use(cors())
app.use(express.json())

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '../frontend')))

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

function findOrCreateWorker(externalId, name, dept) {
  const existing = statements.getWorkerByExternalId.get(externalId);
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
  const { username, password } = req.body
  if (username === 'admin' && password === 'password') {
    return res.json({ ok: true, user: { name: 'Administrator' }, token: 'fake-jwt-token' })
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
    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
})

app.get('/api/attendance', (req, res) => {
  try {
    const attendance = statements.getAllAttendance.all();
    // Transform to match frontend expectations
    const transformed = attendance.map(record => ({
      id: record.id,
      workerId: record.worker_id,
      name: record.name,
      dept: record.dept,
      service: record.service,
      status: record.status,
      date: record.date
    }));
    res.json(transformed);
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
    res.json(results);
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
