const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Use an isolated test database
const testDbPath = path.join(__dirname, 'test_auth.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test-jwt-secret';

const { statements } = require('../database');
const bcrypt = require('bcryptjs');

// Seed test users
const testPassword = 'SecurePassword123!';
const hashedPassword = bcrypt.hashSync(testPassword, 10);

statements.insertUser.run('Test Admin', 'admin@test.com', hashedPassword, 'superadmin', 'W000');
statements.insertUser.run('Test Manager', 'manager@test.com', hashedPassword, 'manager', 'W002');
statements.insertUser.run('Test Member', 'member@test.com', hashedPassword, 'member', 'W001');

// Import Express server app
const http = require('http');

test('Authentication Flow and Security Hardening', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    delete require.cache[require.resolve('../server')];
    const serverApp = require('../server');
    await new Promise((resolve) => {
      server = http.createServer(serverApp);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  async function getAuthDetails(identifier) {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: testPassword }),
    });
    const cookieHeader = res.headers.getSetCookie ? res.headers.getSetCookie().join('; ') : res.headers.get('set-cookie');
    const csrfToken = res.headers.get('x-csrf-token');
    return { cookieHeader, csrfToken };
  }

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  await t.test('POST /api/login fails with empty password', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: '' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
  });

  await t.test('POST /api/login rejects backdoor passwords ("Admin@123" / "admin")', async () => {
    const resBackdoor1 = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: 'Admin@123' }),
    });
    assert.equal(resBackdoor1.status, 401);

    const resBackdoor2 = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: 'admin' }),
    });
    assert.equal(resBackdoor2.status, 401);
  });

  await t.test('POST /api/login succeeds with correct password and sets httpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: testPassword }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.user.email, 'admin@test.com');
    assert.equal(body.user.role, 'superadmin');
    assert.equal(body.user.password_hash, undefined);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header should be present');
    assert.ok(setCookie.includes('token='), 'Cookie should contain token');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Cookie should be httpOnly');
  });

  await t.test('POST /api/login supports worker_id lookup', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'W001', password: testPassword }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.user.email, 'member@test.com');
  });

  await t.test('GET /api/me works with valid cookie and fails without', async () => {
    // 1. Unauthenticated request
    const unauthRes = await fetch(`${baseUrl}/api/me`);
    assert.equal(unauthRes.status, 401);

    // 2. Authenticate to get cookie
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: testPassword }),
    });
    const cookieHeader = loginRes.headers.get('set-cookie');

    // 3. Authenticated request with cookie header
    const authRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(authRes.status, 200);
    const body = await authRes.json();
    assert.equal(body.ok, true);
    assert.equal(body.user.email, 'admin@test.com');
  });

  await t.test('POST /api/logout clears session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/logout`, { method: 'POST' });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header should be present on logout');
  });

  await t.test('RBAC Middleware enforces role permissions and CSRF protection', async () => {
    const memberAuth = await getAuthDetails('member@test.com');
    const managerAuth = await getAuthDetails('manager@test.com');
    const adminAuth = await getAuthDetails('admin@test.com');

    // Unauthenticated access returns 401
    const unauthRes = await fetch(`${baseUrl}/api/workers`);
    assert.equal(unauthRes.status, 401);

    // Member access to member route succeeds
    const memberRes = await fetch(`${baseUrl}/api/workers`, { headers: { Cookie: memberAuth.cookieHeader } });
    assert.equal(memberRes.status, 200);

    // Member access to manager route fails with 403
    const memberToManagerRes = await fetch(`${baseUrl}/api/visitors`, { headers: { Cookie: memberAuth.cookieHeader } });
    assert.equal(memberToManagerRes.status, 403);

    // Member access to superadmin route fails with 403
    const memberToAdminRes = await fetch(`${baseUrl}/api/departments/rename`, {
      method: 'PUT',
      headers: {
        Cookie: memberAuth.cookieHeader,
        'Content-Type': 'application/json',
        'X-CSRF-Token': memberAuth.csrfToken,
      },
      body: JSON.stringify({ oldDepartment: 'General', newDepartment: 'Main' }),
    });
    assert.equal(memberToAdminRes.status, 403);

    // Manager access to manager route succeeds
    const managerRes = await fetch(`${baseUrl}/api/visitors`, { headers: { Cookie: managerAuth.cookieHeader } });
    assert.equal(managerRes.status, 200);

    // Manager access to superadmin route fails with 403
    const managerToAdminRes = await fetch(`${baseUrl}/api/departments/rename`, {
      method: 'PUT',
      headers: {
        Cookie: managerAuth.cookieHeader,
        'Content-Type': 'application/json',
        'X-CSRF-Token': managerAuth.csrfToken,
      },
      body: JSON.stringify({ oldDepartment: 'General', newDepartment: 'Main' }),
    });
    assert.equal(managerToAdminRes.status, 403);

    // Superadmin access to superadmin route fails if CSRF token is missing (403)
    const adminMissingCsrfRes = await fetch(`${baseUrl}/api/departments/rename`, {
      method: 'PUT',
      headers: { Cookie: adminAuth.cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldDepartment: 'General', newDepartment: 'Main' }),
    });
    assert.equal(adminMissingCsrfRes.status, 403);

    // Superadmin access to superadmin route succeeds with valid CSRF token
    const adminRes = await fetch(`${baseUrl}/api/departments/rename`, {
      method: 'PUT',
      headers: {
        Cookie: adminAuth.cookieHeader,
        'Content-Type': 'application/json',
        'X-CSRF-Token': adminAuth.csrfToken,
      },
      body: JSON.stringify({ oldDepartment: 'General', newDepartment: 'Main' }),
    });
    assert.equal(adminRes.status, 200);

    // Member attempting to forge role via custom headers is strictly rejected with 403
    const forgedHeaderRes = await fetch(`${baseUrl}/api/departments/rename`, {
      method: 'PUT',
      headers: {
        Cookie: memberAuth.cookieHeader,
        'Content-Type': 'application/json',
        'X-CSRF-Token': memberAuth.csrfToken,
        'X-User-Role': 'superadmin',
        'X-Admin': 'true',
      },
      body: JSON.stringify({ oldDepartment: 'General', newDepartment: 'Main' }),
    });
    assert.equal(forgedHeaderRes.status, 403);

    // Unmapped API route returns 404
    const notFoundRes = await fetch(`${baseUrl}/api/nonexistent-endpoint`, { headers: { Cookie: adminAuth.cookieHeader } });
    assert.equal(notFoundRes.status, 404);
  });

  await t.test('Geofence clock-in calculates boundary using radius + configurable tolerance', async () => {
    const adminRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@test.com', password: testPassword }),
    });
    const adminCookie = adminRes.headers.get('set-cookie');

    // 1. Fetch settings
    const settingsRes = await fetch(`${baseUrl}/api/clock-in/settings`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(settingsRes.status, 200);
    const settingsBody = await settingsRes.json();
    assert.equal(settingsBody.settings.geofence_tolerance_meters, '50');

    // 2. Clock-in beyond radius + tolerance (200m + 50m = 250m threshold) fails
    const clockInFarRes = await fetch(`${baseUrl}/api/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'W001',
        latitude: 9.0800,
        longitude: 7.3986,
        type: 'clock-in',
      }),
    });
    assert.equal(clockInFarRes.status, 400);
    const farBody = await clockInFarRes.json();
    assert.equal(farBody.ok, false);
    assert.ok(farBody.message.includes('Allowed: 200m + 50m GPS tolerance'));
  });

  await t.test('Security Baseline: Helmet headers are present', async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  await t.test('Data Contract: Request body normalization maps snake_case keys to camelCase', async () => {
    const managerAuth = await getAuthDetails('manager@test.com');
    const groupRes = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: {
        Cookie: managerAuth.cookieHeader,
        'Content-Type': 'application/json',
        'X-CSRF-Token': managerAuth.csrfToken,
      },
      body: JSON.stringify({
        name: 'Test Snake Group',
        type: 'cell',
        leader_id: 'W001',
        meeting_day: 'Friday',
        location: 'Abuja Central',
      }),
    });
    assert.equal(groupRes.status, 200);
    const body = await groupRes.json();
    assert.equal(body.ok, true);
    assert.ok(body.id > 0);
  });
});
