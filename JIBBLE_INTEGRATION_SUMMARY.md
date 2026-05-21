# Jibble Integration Summary

## 🎯 What's Been Added

Your Church HR Manager now has complete Jibble integration support. Here's what you can do:

### 1. **Jibble API Service** (`src/utils/jibbleService.ts`)
   - Full REST API wrapper for Jibble
   - Functions to fetch employees, attendance, status, and summaries
   - Automatic error handling and fallback support
   - Type definitions for all Jibble data structures

### 2. **Custom React Hooks** (`src/utils/attendanceHooks.ts`)
   - `useAttendance()` - Fetch attendance records
   - `useAttendanceSummary()` - Get attendance statistics
   - `useEmployeeStatus()` - Real-time check-in/out status
   - `useDepartmentAttendance()` - Department-specific attendance
   - All hooks support Jibble + mock data fallback

### 3. **Setup Documentation** (`JIBBLE_INTEGRATION.md`)
   - Step-by-step setup guide
   - Environment variable configuration
   - API endpoint reference
   - Data format specifications
   - Troubleshooting guide

### 4. **Integration Example** (`JIBBLE_EXAMPLE.tsx`)
   - Reference implementation for updated components
   - Shows how to use the new hooks
   - Includes Jibble data source indicator
   - Demonstrates error handling and loading states

---

## 🚀 Quick Start

### Step 1: Get Your Jibble API Credentials

1. Go to https://www.jibble.io
2. Log in to your account
3. Navigate to Settings → Integrations → API
4. Copy your API Key

### Step 2: Create `.env` File

In the root of your project, create a `.env` file:

```env
REACT_APP_JIBBLE_API_URL=https://api.jibble.io/v1
REACT_APP_JIBBLE_API_KEY=your_api_key_here
REACT_APP_JIBBLE_ENABLED=true
REACT_APP_ATTENDANCE_SYNC_INTERVAL=300000
```

### Step 3: Rebuild Your App

```bash
npm run build
```

or for development:

```bash
npm run dev
```

### Step 4: Update Your Components

Replace your current attendance components with Jibble-integrated versions:

```typescript
// Before (using mock data)
import { mockAttendanceRecords } from "../utils/mockData";

export function AttendanceOverview() {
  const records = mockAttendanceRecords;
  // ...
}
```

```typescript
// After (using Jibble)
import { useAttendance } from "../utils/attendanceHooks";

export function AttendanceOverview() {
  const attendance = useAttendance(startDate, endDate, {
    useJibble: true,
    fallbackToMock: true,
  });
  const records = attendance.records;
  // ...
}
```

---

## 📊 Available Functions

### Fetch Attendance Data

```typescript
import { useAttendance } from "../utils/attendanceHooks";

// In your component
const attendance = useAttendance("2026-04-01", "2026-04-30", {
  useJibble: true,
  fallbackToMock: true,
  refetchInterval: 300000, // 5 minutes
});

// Access data
console.log(attendance.records);     // Array of attendance records
console.log(attendance.loading);     // boolean
console.log(attendance.error);       // string or null
console.log(attendance.source);      // "jibble" or "mock"
```

### Get Attendance Summary

```typescript
import { useAttendanceSummary } from "../utils/attendanceHooks";

const summary = useAttendanceSummary("2026-04-01", "2026-04-30", {
  useJibble: true,
  refetchInterval: 300000,
});

// Returns
{
  totalEmployees: 156,
  presentToday: 120,
  absentToday: 36,
  lateToday: 8,
  attendanceRate: 77
}
```

### Monitor Employee Real-Time Status

```typescript
import { useEmployeeStatus } from "../utils/attendanceHooks";

const status = useEmployeeStatus("employee-id-123", 60000); // Check every minute

if (status.isCheckedIn) {
  console.log("Employee is currently checked in");
  console.log("Last check-in:", status.lastCheckIn);
}
```

### Get Department Attendance

```typescript
import { useDepartmentAttendance } from "../utils/attendanceHooks";

const deptData = useDepartmentAttendance(
  "Ushering",
  "2026-04-01",
  "2026-04-30",
  {
    useJibble: true,
    fallbackToMock: true,
  }
);

console.log(deptData.records); // Only Ushering department records
```

---

## 🔧 Component Update Guide

### Update AttendanceOverview

1. Open `src/components/AttendanceOverview.tsx`
2. Add import: `import { useAttendance } from "../utils/attendanceHooks";`
3. Replace mock data with hook:
   ```typescript
   const attendance = useAttendance(dateFilter, dateFilter, {
     useJibble: true,
     fallbackToMock: true,
     refetchInterval: 300000,
   });
   const records = attendance.records;
   ```
4. Add loading state check: `if (attendance.loading) return <div>Loading...</div>;`
5. Update filters to use `attendance.records` instead of `mockAttendanceRecords`

### Update AttendanceDetailView

1. Open `src/components/AttendanceDetailView.tsx`
2. Replace `mockAttendanceRecords` with:
   ```typescript
   const { records } = useAttendance(startDate, endDate);
   const workerRecords = records.filter(r => r.workerId === workerId);
   ```

### Update ReportsAnalytics

1. Open `src/components/ReportsAnalytics.tsx`
2. Replace mock data with `useAttendance()` hook
3. Use returned records for all calculations and charts

### Update AdminDashboard

1. Open `src/components/AdminDashboard.tsx`
2. Import: `import { useAttendanceSummary } from "../utils/attendanceHooks";`
3. Replace `getAttendanceStats()` with:
   ```typescript
   const stats = useAttendanceSummary(today, today, { useJibble: true });
   ```

---

## 🛠️ Troubleshooting

### Issue: "Jibble API key not configured"

**Solution:**
- Check `.env` file exists
- Verify `REACT_APP_JIBBLE_API_KEY` is set correctly
- Restart your dev server after changing `.env`
- Make sure key is valid on Jibble dashboard

### Issue: No attendance data appearing

**Solution:**
- Verify employees have checked in on Jibble
- Check date range is correct
- Ensure `REACT_APP_JIBBLE_ENABLED=true` in `.env`
- Check browser console for errors
- Verify API key has necessary permissions

### Issue: Slow data loading

**Solution:**
- Increase `refetchInterval` to reduce API calls
- Implement data caching
- Check your internet connection
- Verify Jibble API isn't rate-limited

### Issue: Using mock data instead of Jibble

**Check:**
1. Is `REACT_APP_JIBBLE_ENABLED=true`?
2. Is API key valid?
3. Check browser console for error messages
4. The system falls back to mock data intentionally if Jibble fails

---

## 📈 Data Sync Intervals

Recommended sync frequencies:

| Use Case | Interval | Example |
|---|---|---|
| Real-time dashboard | 1-2 min | 60,000 - 120,000 ms |
| Daily attendance check | 5-10 min | 300,000 - 600,000 ms |
| Hourly reports | 1 hour | 3,600,000 ms |
| Startup only | 0 (no auto-refresh) | 0 |

---

## 🔐 Security Best Practices

1. **Never commit `.env` to git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   ```

2. **Use secure credential storage**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Vercel Environment Variables (if deployed)

3. **Rotate API keys regularly**
   - Change key every 90 days
   - Use multiple keys for different environments

4. **Restrict API key permissions**
   - Read-only access for production
   - Specific scopes for each key

---

## 📝 Integration Checklist

- [ ] Created `.env` file with Jibble credentials
- [ ] Verified API key works with test call
- [ ] Updated `AttendanceOverview.tsx` to use hooks
- [ ] Updated `AttendanceDetailView.tsx` to use hooks
- [ ] Updated `ReportsAnalytics.tsx` to use hooks
- [ ] Updated `AdminDashboard.tsx` to use hooks
- [ ] Tested with real Jibble data
- [ ] Verified fallback to mock data works
- [ ] Set appropriate sync intervals
- [ ] Added error handling/user feedback
- [ ] Tested on production build

---

## 🎓 Example: Full Component Update

Here's a complete example of updating AttendanceOverview:

```typescript
import { useAttendance } from "../utils/attendanceHooks";
import { AlertCircle } from "lucide-react";

export function AttendanceOverview() {
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Fetch attendance with Jibble + fallback
  const attendance = useAttendance(dateFilter, dateFilter, {
    useJibble: true,
    fallbackToMock: true,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (attendance.loading) {
    return <div>Loading attendance data...</div>;
  }

  return (
    <div>
      {/* Show error if any */}
      {attendance.error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {attendance.error}
        </div>
      )}

      {/* Show data source */}
      <Badge>
        {attendance.source === "jibble" ? "Jibble" : "Mock Data"}
      </Badge>

      {/* Display your attendance records */}
      {attendance.records.map((record) => (
        <div key={record.id}>
          {record.workerName || record.employeeName} - {record.status}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔗 Resources

- **Jibble API Docs**: https://api.jibble.io/docs
- **Jibble Help**: https://jibble.io/help
- **Environment Variables**: https://create-react-app.dev/docs/adding-custom-environment-variables/

---

## 📞 Support

For issues with:

- **Jibble Integration**: Check `JIBBLE_INTEGRATION.md`
- **React Hooks**: See `src/utils/attendanceHooks.ts` comments
- **Component Updates**: Reference `JIBBLE_EXAMPLE.tsx`
- **Jibble API**: https://api.jibble.io/docs

---

## ✅ You're All Set!

Your Church HR Manager is now ready to use Jibble for attendance tracking. The system will:

✓ Fetch real attendance data from Jibble
✓ Fall back to mock data if Jibble is unavailable
✓ Auto-sync data at your configured intervals
✓ Show which data source is being used
✓ Handle errors gracefully

Start updating your components and enjoy real-time attendance tracking!
