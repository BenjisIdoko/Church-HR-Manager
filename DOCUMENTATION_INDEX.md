# Documentation Index

## 📚 Complete Documentation for Church HR Manager

This file serves as an index to all technical, operational, and architectural documentation for the Church HR Manager application.

---

## 🚀 Key Documentation Files

### 1. Main System Architecture & Setup Guide
**File**: [README.md](README.md)
- Complete technical stack & system architecture
- Installation, environment variable configuration, and database setup
- Authentication security model (bcrypt, JWT `httpOnly` cookie, CSRF token)
- Server-side Role-Based Access Control (RBAC)
- Geofence calculation & GPS tolerance buffer
- Data contract normalization (`camelCase` boundary mapping)

### 2. CSV Import & Data Filtering Guide
**File**: [QUICK_START.md](QUICK_START.md)
- 5-minute quick reference for bulk data imports
- CSV/Excel format requirements & sample templates
- Error validation rules & troubleshooting guide

---

## 📋 Repository Documentation Map

```
/Church HR Manager/
├── README.md                         ⭐ Main technical setup & security guide
├── QUICK_START.md                    📖 CSV import quick start reference
├── DOCUMENTATION_INDEX.md            📑 Documentation index
│
├── backend/
│   ├── server.js                     ⚙️ Express server & route registration
│   ├── database.js                   🗄️ SQLite database connection & schema
│   ├── seed.js                       🌱 Database seed script
│   └── tests/auth.test.js            🧪 Integration test suite
│
└── src/
    ├── App.tsx                       🚦 App routes & ProtectedRoute integration
    ├── hooks/                        ⚓ Domain hooks (useAuth, useWorkers, etc.)
    └── components/                   🎨 Presentational UI components
```
