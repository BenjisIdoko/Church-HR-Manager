# CSV Parsing and Advanced Filtering/Sorting Guide

## Overview

This document describes the new CSV parsing functionality and advanced filtering/sorting capabilities added to the Church HR Manager application.

## Table of Contents

1. [CSV Parsing](#csv-parsing)
2. [Advanced Filtering](#advanced-filtering)
3. [Sorting Functionality](#sorting-functionality)
4. [Data Export](#data-export)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)

---

## CSV Parsing

### Features

The CSV parser (`src/utils/csvParser.ts`) provides:

- **CSV File Reading**: Reads and parses CSV files with proper quote handling
- **Data Validation**: Validates data against specific requirements for attendance and worker records
- **Error Detection**: Identifies and reports data validation errors
- **Warning Alerts**: Provides warnings for potentially problematic data
- **Detailed Feedback**: Returns comprehensive parsing results with row-level details

### Supported File Types

- `.csv` - Comma-separated values
- `.xlsx` - Microsoft Excel (parsed as text)
- `.xls` - Microsoft Excel legacy format (parsed as text)

### File Size Limits

- Maximum file size: **10MB**

### Attendance Data Format

**Required Columns:**
- `Worker ID` - Format: W followed by numbers (e.g., W001)
- `Worker Name` - Full name of the worker
- `Date` - Format: YYYY-MM-DD (e.g., 2025-01-16)
- `Status` - One of: `present`, `late`, `absent`

**Optional Columns:**
- `Check In Time` - Format: HH:MM (e.g., 09:30)
- `Check Out Time` - Format: HH:MM (e.g., 17:45)
- `Department` - Worker's department/ministry

**Example CSV:**
```csv
Worker ID,Worker Name,Date,Status,Check In Time,Check Out Time,Department
W001,John Doe,2025-01-16,present,09:00,17:00,Ushering
W002,Jane Smith,2025-01-16,late,09:45,17:00,Choir
W003,Mike Johnson,2025-01-16,absent,,, Media
```

### Workers List Format

**Required Columns:**
- `Worker ID` - Format: W followed by numbers (e.g., W001)
- `Name` - Full name
- `Email` - Valid email address
- `Phone Number` - At least 10 digits
- `Department` - Department/ministry name

**Optional Columns:**
- `Role` - Position/role in the organization
- `Status` - `active` or `inactive`

**Example CSV:**
```csv
Worker ID,Name,Email,Phone Number,Department,Role,Status
W001,John Doe,john.doe@church.com,09012345678,Ushering,Leader,active
W002,Jane Smith,jane.smith@church.com,08012345678,Choir,Member,active
```

### Validation Rules

#### Attendance Data Validation

1. **Worker ID**
   - Required: Yes
   - Format: Must match pattern `W\d{3,}` (e.g., W001, W0123)
   - Error: "Worker ID is required" or "Worker ID format should be W followed by numbers"

2. **Worker Name**
   - Required: Yes
   - Format: Non-empty string
   - Error: "Worker Name is required"

3. **Date**
   - Required: Yes
   - Format: YYYY-MM-DD
   - Error: "Date is required" or "Date must be in YYYY-MM-DD format"

4. **Status**
   - Required: Yes
   - Allowed Values: `present`, `late`, `absent` (case-insensitive)
   - Error: "Status is required" or "Status must be one of: present, late, absent"

5. **Check In Time** (Optional)
   - Format: HH:MM
   - Warning: "Check In Time should be in HH:MM format"

6. **Check Out Time** (Optional)
   - Format: HH:MM
   - Warning: "Check Out Time should be in HH:MM format"

#### Workers Data Validation

1. **Worker ID**
   - Required: Yes
   - Format: Must match pattern `W\d{3,}`
   - Error: "Worker ID is required"
   - Warning: "Worker ID format should be W followed by numbers"

2. **Name**
   - Required: Yes
   - Error: "Name is required"

3. **Email**
   - Required: Yes
   - Format: Valid email format
   - Error: "Email is required" or "Email format is invalid"

4. **Phone Number**
   - Required: Yes
   - Format: At least 10 digits
   - Warning: "Phone Number format may be invalid"

5. **Department**
   - Required: Yes
   - Error: "Department is required"

### Using the CSV Parser

#### In React Components

```typescript
import { processFileUpload, CSVParseResult } from "../utils/csvParser";

const handleValidate = async () => {
  try {
    const result = await processFileUpload(file, "attendance");
    
    if (result.success) {
      console.log("Valid records:", result.data);
      console.log("Summary:", result.summary);
    } else {
      console.log("Errors:", result.errors);
      console.log("Warnings:", result.warnings);
    }
  } catch (error) {
    console.error("Error processing file:", error);
  }
};
```

#### Processing Results

The `CSVParseResult` object contains:

```typescript
interface CSVParseResult {
  success: boolean;                      // True if no errors found
  data: Record<string, string>[];        // Valid records (objects)
  errors: ValidationError[];             // List of errors
  warnings: ValidationWarning[];         // List of warnings
  summary: {
    totalRows: number;                   // Total records in file
    validRows: number;                   // Records without errors
    invalidRows: number;                 // Records with errors
  };
}

interface ValidationError {
  row: number;                           // Row number (1-based)
  column: string;                        // Column name
  message: string;                       // Error description
}

interface ValidationWarning {
  row: number;                           // Row number (1-based)
  column: string;                        // Column name
  message: string;                       // Warning description
}
```

---

## Advanced Filtering

### Features

The table utilities module (`src/utils/tableUtils.ts`) provides sophisticated filtering capabilities:

- **Text Filtering**: Search with multiple operators (contains, equals, startsWith, endsWith)
- **Select Filtering**: Filter by predefined options
- **Date Filtering**: Match specific dates
- **Range Filtering**: Filter numeric values within ranges
- **Multiple Filters**: Combine multiple filters simultaneously
- **Search Query Parsing**: Parse natural language search queries

### Filter Types

#### Text Filter
```typescript
const filter = {
  name: {
    type: 'text',
    value: 'john',
    operator: 'contains'  // or 'equals', 'startsWith', 'endsWith'
  }
};
```

#### Select Filter
```typescript
const filter = {
  department: {
    type: 'select',
    value: ['Engineering', 'Sales']  // Multiple values or single string
  }
};
```

#### Date Filter
```typescript
const filter = {
  joinDate: {
    type: 'date',
    value: '2025-01-16'
  }
};
```

#### Range Filter
```typescript
const filter = {
  salary: {
    type: 'range',
    value: { min: 50000, max: 100000 }
  }
};
```

### Usage Examples

#### Basic Filtering

```typescript
import { filterData, FilterConfig } from "../utils/tableUtils";

const filters: FilterConfig = {
  status: { type: 'select', value: 'active' },
  department: { type: 'select', value: 'Engineering' }
};

const filtered = filterData(data, filters);
```

#### Combined Filtering

```typescript
const filters: FilterConfig = {
  searchText: {
    type: 'text',
    value: 'john',
    operator: 'contains'
  },
  department: {
    type: 'select',
    value: ['Engineering', 'Sales']
  },
  salary: {
    type: 'range',
    value: { min: 50000, max: 150000 }
  }
};

const filtered = filterData(data, filters);
```

#### Nested Property Filtering

```typescript
// Filter by nested properties using dot notation
const filters: FilterConfig = {
  'department.name': {
    type: 'select',
    value: 'Engineering'
  }
};

const filtered = filterData(data, filters);
```

---

## Sorting Functionality

### Features

- **Multi-column Sorting**: Sort by any column
- **Bi-directional Sorting**: Ascending and descending order
- **Smart Sorting**: Numeric, date, and string-aware sorting
- **Sort Toggling**: Click to cycle through sort directions

### Sort Configuration

```typescript
interface SortConfig {
  key: string;              // Column key to sort by
  direction: 'asc' | 'desc' | null;  // Sort direction
}
```

### Usage Examples

#### Basic Sorting

```typescript
import { sortData, SortConfig } from "../utils/tableUtils";

const sortConfig: SortConfig = {
  key: 'name',
  direction: 'asc'
};

const sorted = sortData(data, sortConfig);
```

#### Toggle Sort Direction

```typescript
import { toggleSortDirection } from "../utils/tableUtils";

const newDirection = toggleSortDirection(currentDirection);
// null -> 'asc' -> 'desc' -> null
```

#### Numeric Sorting

```typescript
const sortConfig: SortConfig = {
  key: 'salary',
  direction: 'desc'
};

// Automatically detects numeric values and sorts numerically
const sorted = sortData(salaryData, sortConfig);
```

#### Date Sorting

```typescript
const sortConfig: SortConfig = {
  key: 'joinDate',
  direction: 'asc'
};

// Automatically detects Date objects and sorts chronologically
const sorted = sortData(dateData, sortConfig);
```

---

## Data Export

### Features

- **CSV Export**: Export filtered/sorted data as CSV
- **Automatic Formatting**: Properly escapes special characters
- **Column Selection**: Choose which columns to export
- **File Naming**: Customizable filename generation
- **Browser Download**: Direct download without server

### Usage Examples

#### Export All Data

```typescript
import { exportToCSV } from "../utils/tableUtils";

exportToCSV(data, 'workers_export');
// Creates workers_export.csv
```

#### Export Selected Columns

```typescript
exportToCSV(
  data,
  'attendance_report',
  ['workerId', 'workerName', 'department', 'status']
);
```

#### Export with Date

```typescript
const filename = `attendance_${new Date().toISOString().split('T')[0]}`;
exportToCSV(filteredData, filename);
// Creates attendance_2025-01-16.csv
```

---

## Components Updated

### DataImportScreen

**New Features:**
- Toggle between Attendance and Workers import modes
- Real-time file validation with detailed feedback
- Error and warning display in tabbed interface
- Data preview before import
- Comprehensive format requirements documentation

**Props:** None

**State:**
- `file`: Current file being imported
- `status`: Import validation status
- `importType`: 'attendance' or 'workers'
- `parseResult`: Detailed CSV parsing results

### AttendanceOverview

**New Features:**
- Search by worker name or ID
- Advanced filtering: date, department, status
- Click-to-sort columns with visual indicators
- Summary statistics showing active filters
- Export filtered results to CSV
- Reset button to clear all filters

**Sort Indicators:**
- ⬆️ Ascending
- ⬇️ Descending
- No indicator: Not sorted

### WorkersDirectory

**New Features:**
- Enhanced search functionality
- Filter by department, role, and status
- Click-to-sort by any column
- Export worker list to CSV
- Display summary of results
- Clear filters button

**Sortable Columns:**
- Worker ID
- Name
- Email
- Department
- Role
- Status

### ReportsAnalytics

**New Features:**
- CSV export of filtered attendance data
- JSON export option
- Date range filters
- Department filtering

---

## API Reference

### CSV Parser Module (`csvParser.ts`)

#### `parseCSVText(content: string): Record<string, string>[]`
Parses raw CSV text content into an array of objects.

**Parameters:**
- `content`: Raw CSV text

**Returns:** Array of records (objects)

#### `validateAttendanceData(records): CSVParseResult`
Validates attendance records according to requirements.

**Parameters:**
- `records`: Array of parsed records

**Returns:** CSVParseResult object

#### `validateWorkersData(records): CSVParseResult`
Validates worker records according to requirements.

**Parameters:**
- `records`: Array of parsed records

**Returns:** CSVParseResult object

#### `processFileUpload(file, validationType): Promise<CSVParseResult>`
Complete file processing pipeline: read, parse, and validate.

**Parameters:**
- `file`: File object from input
- `validationType`: 'attendance' | 'workers'

**Returns:** Promise resolving to CSVParseResult

#### `readFileAsText(file: File): Promise<string>`
Reads file content as text.

**Parameters:**
- `file`: File object

**Returns:** Promise resolving to file content string

### Table Utils Module (`tableUtils.ts`)

#### `filterData<T>(data: T[], filters: FilterConfig): T[]`
Filters array based on multiple criteria.

**Parameters:**
- `data`: Array to filter
- `filters`: FilterConfig object

**Returns:** Filtered array

#### `sortData<T>(data: T[], sortConfig): T[]`
Sorts array based on sort configuration.

**Parameters:**
- `data`: Array to sort
- `sortConfig`: SortConfig object or null

**Returns:** Sorted array

#### `processTableData<T>(data, filters, sortConfig): T[]`
Combines filtering and sorting in one operation.

**Parameters:**
- `data`: Array to process
- `filters`: FilterConfig
- `sortConfig`: SortConfig or null

**Returns:** Filtered and sorted array

#### `exportToCSV<T>(data: T[], filename: string, columns?): void`
Exports data to CSV file.

**Parameters:**
- `data`: Array to export
- `filename`: Output filename (without .csv)
- `columns`: Optional array of column keys to include

**Returns:** void (triggers download)

#### `toggleSortDirection(currentDirection): SortDirection`
Cycles through sort directions.

**Parameters:**
- `currentDirection`: Current SortDirection

**Returns:** Next SortDirection in cycle

---

## Error Handling

### Common Errors and Solutions

#### "File size exceeds 10MB limit"
- **Cause**: Uploaded file is too large
- **Solution**: Reduce file size or split into multiple files

#### "Invalid file format. Please upload CSV or Excel files only."
- **Cause**: File extension is not .csv, .xlsx, or .xls
- **Solution**: Ensure file has correct extension

#### "Missing required columns"
- **Cause**: CSV doesn't have all required columns
- **Solution**: Review format requirements and add missing columns

#### "Date must be in YYYY-MM-DD format"
- **Cause**: Date format doesn't match expected pattern
- **Solution**: Use YYYY-MM-DD format (e.g., 2025-01-16)

#### "Status must be one of: present, late, absent"
- **Cause**: Status value is not valid
- **Solution**: Use only: present, late, or absent

---

## Performance Notes

- **CSV Parsing**: Efficient for files up to 10MB
- **Filtering**: O(n) complexity, scales well with large datasets
- **Sorting**: O(n log n) using native sort
- **Export**: Creates files in browser without server round-trip

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- IE 11: Not supported (uses modern APIs)

---

## Future Enhancements

- [ ] Bulk data validation with progress indication
- [ ] Custom validation rules per column
- [ ] Advanced date range filters (Last 30 days, etc.)
- [ ] Batch import with scheduled processing
- [ ] Data import history tracking
- [ ] Undo/Rollback functionality
- [ ] PDF export support
- [ ] Advanced chart customization
- [ ] Scheduled report generation

---

## Examples

### Complete Import Workflow

```typescript
// 1. User selects file
const file = fileInput.files[0];

// 2. Validate file
const result = await processFileUpload(file, 'attendance');

// 3. Check result
if (result.success) {
  // 4. Import data
  console.log(`Importing ${result.summary.validRows} records`);
  // Call API to save data
} else {
  // 5. Display errors
  result.errors.forEach(error => {
    console.log(`Row ${error.row}: ${error.message}`);
  });
}
```

### Complete Filter and Sort Workflow

```typescript
// 1. Define filters
const filters: FilterConfig = {
  department: { type: 'select', value: 'Engineering' },
  status: { type: 'select', value: 'active' },
  name: { type: 'text', value: 'john', operator: 'contains' }
};

// 2. Define sort
const sortConfig: SortConfig = {
  key: 'name',
  direction: 'asc'
};

// 3. Process data
const result = processTableData(workers, filters, sortConfig);

// 4. Export results
exportToCSV(result, 'filtered_workers_report');
```

---

## Support

For issues or questions, please refer to the main application documentation or contact the development team.
