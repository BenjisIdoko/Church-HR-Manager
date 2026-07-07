const { db, statements } = require('./database');

// Seed initial data
const seedData = async () => {
  try {
    if (process.env.LOAD_SAMPLE_DATA !== 'true') {
      statements.updateKPIs.run(0, 0, 0);
      console.log('Sample data loading skipped. Set LOAD_SAMPLE_DATA=true to seed demo records.');
      return;
    }

    console.log('Seeding database with sample data...');

    db.exec(`
      DELETE FROM clock_in_records;
      DELETE FROM attendance;
      DELETE FROM absences;
      DELETE FROM workers;
      DELETE FROM sqlite_sequence WHERE name IN ('workers', 'attendance', 'absences', 'clock_in_records');
    `);

    const demoSettings = {
      clock_in_portal_enabled: 'true',
      clock_in_portal_name: 'Church Clock-In Portal',
      clock_in_portal_description: 'Use this portal to clock in and out when on church grounds.',
      church_latitude: '9.0765',
      church_longitude: '7.3986',
      geofence_radius_meters: '200',
      device_import_enabled: 'true',
    };

    for (const [key, value] of Object.entries(demoSettings)) {
      statements.upsertSetting.run(key, value);
    }

    // Insert sample workers
    const workers = [
      { externalId: 'W001', name: 'Alice Johnson', email: 'alice@church.org', phone: '555-0101', dept: 'Music', role: 'Leader', status: 'Active' },
      { externalId: 'W002', name: 'Ben Carter', email: 'ben@church.org', phone: '555-0102', dept: 'Children', role: 'Volunteer', status: 'Active' },
      { externalId: 'W003', name: 'Clara Yu', email: 'clara@church.org', phone: '555-0103', dept: 'Maintenance', role: 'Staff', status: 'On Leave' },
      { externalId: 'W004', name: 'David Wilson', email: 'david@church.org', phone: '555-0104', dept: 'Ushering', role: 'Volunteer', status: 'Active' },
      { externalId: 'W005', name: 'Emma Davis', email: 'emma@church.org', phone: '555-0105', dept: 'Choir', role: 'Member', status: 'Active' },
      { externalId: 'W006', name: 'Frank Miller', email: 'frank@church.org', phone: '555-0106', dept: 'Youth', role: 'Leader', status: 'Active' },
      { externalId: 'W007', name: 'Grace Lee', email: 'grace@church.org', phone: '555-0107', dept: 'Outreach', role: 'Coordinator', status: 'Active' },
      { externalId: 'W008', name: 'Henry Brown', email: 'henry@church.org', phone: '555-0108', dept: 'Music', role: 'Member', status: 'Active' }
    ];

    // Insert sample workers and collect their IDs
    const insertedWorkers = [];
    for (const worker of workers) {
      const result = statements.insertWorker.run(
        worker.externalId,
        worker.name,
        worker.email,
        worker.phone,
        worker.dept,
        worker.role,
        worker.status
      );
      insertedWorkers.push({ ...worker, id: result.lastInsertRowid });
    }

    console.log(`Inserted ${insertedWorkers.length} workers`);

    // Generate attendance data for the last 30 days
    const services = ['Sunday Service', 'Thursday Service', 'Wednesday Service'];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Different attendance rates for different days
      const attendanceRate = dayOfWeek === 0 ? 0.90 : dayOfWeek === 4 ? 0.70 : 0.60;
      const lateRate = 0.15;

      for (const worker of insertedWorkers) {
        for (const service of services) {
          const rand = Math.random();
          let status = 'Absent';

          if (rand < attendanceRate) {
            status = Math.random() < lateRate ? 'Late' : 'Present';
          }

          statements.insertAttendance.run(
            worker.id,
            service,
            status,
            dateStr
          );
        }
      }
    }

    console.log('Generated attendance data for 30 days');

    // Update KPIs
    const workerCount = statements.getWorkerCount.get('Active').count;
    const todayStr = today.toISOString().split('T')[0];
    const todayStats = statements.getAttendanceStats.get(todayStr);

    statements.updateKPIs.run(
      workerCount,
      todayStats.present,
      todayStats.absent
    );

    console.log('Sample database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedData().then(() => {
    console.log('Seeding complete');
    process.exit(0);
  });
}

module.exports = { seedData };
