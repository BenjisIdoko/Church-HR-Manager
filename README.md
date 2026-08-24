# Church HR Manager

A production-ready, secure HR, volunteer management, attendance, clock-in, discipleship, and asset tracking web application built for church administration.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Lucide Icons, TanStack Query (`@tanstack/react-query`).
- **Backend**: Node.js, Express, `better-sqlite3` (SQLite), `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `helmet`, `express-rate-limit`.
- **Testing**: Node.js built-in test runner (`node --test`), TypeScript static typechecking (`tsc --noEmit`).

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 2. Install Dependencies
```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
npm --prefix backend install
```

### 3. Environment Configuration
Copy the sample environment file in `backend/`:
```bash
cp backend/.env.example backend/.env
```

Key environment variables in `backend/.env`:
- `PORT`: Server port (default: `5000`)
- `JWT_SECRET`: Secret key for signing JWT cookies (Change in production!)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (default: `http://localhost:5173`)
- `NODE_ENV`: Application environment (`development` or `production`)

Key frontend environment variable:
- `VITE_ENABLE_MOCK_DATA`: Set to `"true"` to enable fallback mock arrays for offline dev testing (default: `"false"`).

### 4. Database Setup & Seeding
Initialize the SQLite database (`backend/church_hr.db`) and seed default admin accounts and initial church data:
```bash
npm run setup-db
```

Default Admin Credentials:
- **Identifier**: `superadmin@churchhr.org` (or `ADMIN-001`)
- **Password**: `Admin123!` (Password hashes stored with `bcrypt`)

### 5. Running the Application
Run both backend and Vite dev servers concurrently:
```bash
npm run dev
```
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:5000`

---

## 🔒 Security & Authentication Architecture

### 1. Backdoor Password Elimination & Hashing
- Removed all hardcoded plain-text backdoor password checks (`Admin@123`, `admin`).
- User passwords are generated and verified using `bcryptjs` with standard salt rounds.

### 2. Secure Cookie Sessions & CSRF Token Defense
- Authentication tokens are issued as `httpOnly`, `sameSite=strict` cookies (`church_hr_session`), preventing JavaScript access (XSS defense).
- Mutating API endpoints require a valid double-submit CSRF token passed in the `X-CSRF-Token` request header.

### 3. Server-Side Role-Based Access Control (RBAC)
- All `/api/*` routes require active session verification via `requireRole(...roles)` middleware.
- Role Hierarchy: `superadmin` > `manager` > `member`.
- Deny-by-default policy enforces strict authorization regardless of client-side UI states.

### 4. Request Normalization & Data Contracts
- Express middleware automatically normalizes incoming request payload keys from `snake_case` to `camelCase`, enforcing clean TypeScript data contracts at the API boundary.

---

## 📍 GPS Geofencing & Clock-In Calculation

- Clock-in verification calculates real-time distance using the Haversine formula against auditorium GPS coordinates (`church_latitude`, `church_longitude`).
- **Geofence Radius & GPS Buffer**: Combines `geofence_radius_meters` (base radius, e.g. 200m) with `geofence_tolerance_meters` (configurable GPS drift buffer, default 50m) to accurately compute the effective geofence boundary without arbitrary hidden constants.

---

## 🧪 Testing & Code Verification

Run backend integration and security tests:
```bash
npm test
```

Run TypeScript static analysis and typechecking:
```bash
npm run typecheck
```
