# Jibble Integration Setup Guide

## Overview
This guide helps you connect your Church HR Manager to Jibble for real-time attendance tracking.

## Prerequisites
- Active Jibble account (https://www.jibble.io)
- Jibble API credentials
- Manager/Admin access to your Jibble account

## Step 1: Get Jibble API Credentials

1. **Log in to Jibble Dashboard**
   - Go to https://www.jibble.io
   - Sign in with your credentials

2. **Access API Settings**
   - Go to Settings → Integrations → API
   - Copy your API Key

3. **Generate API Token**
   - If using OAuth, generate an access token from Settings → Developers
   - Keep this token secure

## Step 2: Configure Environment Variables

Create a `.env` file in the root of your project (if not exists):

```env
# Jibble Configuration
REACT_APP_JIBBLE_API_URL=https://api.jibble.io/v1
REACT_APP_JIBBLE_API_KEY=your_api_key_here
REACT_APP_JIBBLE_ENABLED=true
REACT_APP_ATTENDANCE_SYNC_INTERVAL=300000
```

### Environment Variables Explained

- `REACT_APP_JIBBLE_API_URL`: Jibble API endpoint (default: https://api.jibble.io/v1)
- `REACT_APP_JIBBLE_API_KEY`: Your Jibble API key (get from Settings → API)
- `REACT_APP_JIBBLE_ENABLED`: Toggle Jibble integration on/off
- `REACT_APP_ATTENDANCE_SYNC_INTERVAL`: How often to sync data (milliseconds)

## Step 3: Install Dependencies

No additional npm packages needed! The integration uses native `fetch` API.

## Step 4: Enable Jibble in Your App

Update `src/App.tsx`:

```typescript
// Add to your App component
import { checkJibbleConnection } from "./utils/jibbleService";

export default function App() {
  useEffect(() => {
    // Verify Jibble connection on app load
    if (process.env.REACT_APP_JIBBLE_ENABLED === "true") {
      checkJibbleConnection().then((connected) => {
        if (connected) {
          console.log("✓ Jibble connected successfully");
        } else {
          console.warn("⚠ Jibble connection failed - using mock data");
        }
      });
    }
  }, []);

  // ... rest of your app
}
```

## Step 5: Use Jibble Data in Components

### Example: AttendanceOverview Component

```typescript
import { getJibbleAttendance } from "../utils/jibbleService";

export function AttendanceOverview() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const jibbleData = await getJibbleAttendance(today, today);
      setRecords(jibbleData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading attendance data...</div>;
  // ... rest of component
}
```

## Jibble API Endpoints

### Available Functions

1. **Get Employees**
   ```typescript
   const employees = await getJibbleEmployees();
   ```

2. **Get Attendance Records**
   ```typescript
   const attendance = await getJibbleAttendance("2026-04-01", "2026-04-30");
   ```

3. **Get Employee Attendance**
   ```typescript
   const empAttendance = await getEmployeeAttendance("emp-id", "2026-04-01", "2026-04-30");
   ```

4. **Get Real-time Status**
   ```typescript
   const status = await getEmployeeStatus("emp-id");
   // Returns: { isCheckedIn: boolean, lastCheckIn?, lastCheckOut? }
   ```

5. **Get Attendance Summary**
   ```typescript
   const summary = await getAttendanceSummary("2026-04-01", "2026-04-30");
   // Returns: totalEmployees, presentToday, absentToday, etc.
   ```

6. **Get Department Attendance**
   ```typescript
   const deptAttendance = await getDepartmentAttendance("Sales", "2026-04-01", "2026-04-30");
   ```

## Jibble Data Format Reference

### Attendance Record
```json
{
  "id": "att-123",
  "employeeId": "emp-456",
  "employeeName": "John Smith",
  "date": "2026-04-30",
  "status": "present",
  "checkIns": [
    {
      "id": "ci-789",
      "timestamp": {
        "date": "2026-04-30",
        "time": "09:00:00",
        "timezone": "UTC"
      },
      "type": "check-in"
    },
    {
      "id": "co-790",
      "timestamp": {
        "date": "2026-04-30",
        "time": "17:30:00",
        "timezone": "UTC"
      },
      "type": "check-out"
    }
  ],
  "totalHours": 8.5
}
```

### Employee Object
```json
{
  "id": "emp-456",
  "name": "John Smith",
  "email": "john@church.com",
  "phone": "+1-234-567-8900",
  "designation": "Leader",
  "department": "Ushering",
  "status": "active"
}
```

## Mapping Jibble Status to App Status

| Jibble Status | App Status | Description |
|---|---|---|
| `present` | `present` | Employee checked in on time |
| `late` | `late` | Employee checked in after work start time |
| `absent` | `absent` | No check-in record |
| `half-day` | `present` | Worked partial day |

## Fallback Strategy

If Jibble API fails:
1. Check internet connection
2. Verify API key is valid
3. Ensure employee data is synced in Jibble
4. The app will automatically fall back to mock data

To enable fallback:

```typescript
import { mockAttendanceRecords } from "../utils/mockData";
import { getJibbleAttendance } from "../utils/jibbleService";

async function fetchAttendance(date) {
  try {
    const jibbleData = await getJibbleAttendance(date, date);
    return jibbleData.length > 0 ? jibbleData : mockAttendanceRecords;
  } catch (error) {
    console.warn("Jibble failed, using mock data:", error);
    return mockAttendanceRecords;
  }
}
```

## Sync Frequency Recommendations

| Data Type | Recommended Interval |
|---|---|
| Real-time status | 1-2 minutes (60,000-120,000 ms) |
| Daily attendance | 5-10 minutes (300,000-600,000 ms) |
| Reports | On-demand or hourly |
| Employee list | Daily or on-demand |

## Troubleshooting

### "Jibble API connection failed"
- Check if `REACT_APP_JIBBLE_API_KEY` is set correctly
- Verify API key hasn't expired
- Check firewall/CORS settings

### No attendance data appearing
- Ensure employees have checked in on Jibble
- Verify date range is correct
- Check if department names match between Jibble and app

### API Rate Limiting
- Jibble has rate limits (typically 1000 requests/hour)
- Implement caching to reduce requests
- Increase sync interval if hitting limits

## Sample Configuration

Here's a complete example setup:

```typescript
// src/config/jibbleConfig.ts
export const jibbleConfig = {
  apiKey: process.env.REACT_APP_JIBBLE_API_KEY || "",
  apiUrl: process.env.REACT_APP_JIBBLE_API_URL || "https://api.jibble.io/v1",
  enabled: process.env.REACT_APP_JIBBLE_ENABLED === "true",
  syncInterval: parseInt(process.env.REACT_APP_ATTENDANCE_SYNC_INTERVAL || "300000"),
};

// Usage
import { jibbleConfig } from "./config/jibbleConfig";

if (jibbleConfig.enabled) {
  setInterval(() => {
    // Sync attendance data
  }, jibbleConfig.syncInterval);
}
```

## Security Notes

- **Never** commit API keys to version control
- Use environment variables or secure vault (AWS Secrets, HashiCorp Vault)
- Restrict API key to read-only access if possible
- Rotate API keys periodically
- Use HTTPS only for API calls

## Next Steps

1. Create .env file with your Jibble credentials
2. Test Jibble connection: `npm run dev`
3. Monitor browser console for connection status
4. Update components to use Jibble data
5. Enable automatic sync

## Support

For Jibble API issues:
- https://jibble.io/help
- https://api.jibble.io/docs

For Church HR Manager integration issues:
- Check component error logs
- Verify environment variables
- Test API connectivity with curl
