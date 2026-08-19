/**
 * CSV Parser Utility
 * Handles parsing and validation of CSV/Excel files for attendance records
 */

export interface CSVParseResult {
  success: boolean;
  data: Record<string, string>[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ValidationWarning {
  row: number;
  column: string;
  message: string;
}

interface AttendanceCSVRecord extends Record<string, string | undefined> {
  'Worker ID': string;
  'Worker Name': string;
  'Date': string;
  'Check In Time'?: string;
  'Check Out Time'?: string;
  'Status': string;
  'Department'?: string;
}

interface WorkerCSVRecord extends Record<string, string | undefined> {
  'Worker ID': string;
  'Name': string;
  'Email': string;
  'Phone Number': string;
  'Department': string;
  'Role'?: string;
  'Status'?: string;
}

/**
 * Parse CSV text content
 */
export function parseCSVText(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  if (headers.length === 0 || headers.every((h) => h === '')) return [];

  // Parse data rows
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => v === '')) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index] : '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validate attendance CSV data
 */
export function validateAttendanceData(
  records: Record<string, string>[]
): CSVParseResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validatedData: AttendanceCSVRecord[] = [];

  const requiredColumns = ['Worker ID', 'Worker Name', 'Date', 'Status'];

  // Check if first record has required headers
  if (records.length > 0) {
    const headers = Object.keys(records[0]);
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push({
        row: 1,
        column: 'headers',
        message: `Missing required columns: ${missingColumns.join(', ')}`,
      });
      return {
        success: false,
        data: [],
        errors,
        warnings,
        summary: {
          totalRows: records.length,
          validRows: 0,
          invalidRows: records.length,
        },
      };
    }
  }

  // Validate each row
  records.forEach((record, index) => {
    const rowNum = index + 2; // +2 because index 0 is header and rows are 1-based
    let isValid = true;

    // Check Worker ID
    if (!record['Worker ID'] || record['Worker ID'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Worker ID',
        message: 'Worker ID is required',
      });
      isValid = false;
    } else if (!record['Worker ID'].match(/^W\d{3,}$/)) {
      warnings.push({
        row: rowNum,
        column: 'Worker ID',
        message: 'Worker ID format should be W followed by numbers (e.g., W001)',
      });
    }

    // Check Worker Name
    if (!record['Worker Name'] || record['Worker Name'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Worker Name',
        message: 'Worker Name is required',
      });
      isValid = false;
    }

    // Check Date
    if (!record['Date'] || record['Date'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Date',
        message: 'Date is required',
      });
      isValid = false;
    } else if (!isValidDate(record['Date'])) {
      errors.push({
        row: rowNum,
        column: 'Date',
        message: 'Date must be in YYYY-MM-DD format',
      });
      isValid = false;
    }

    // Check Status
    if (!record['Status'] || record['Status'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Status',
        message: 'Status is required',
      });
      isValid = false;
    } else if (!['present', 'late', 'absent'].includes(record['Status'].toLowerCase())) {
      errors.push({
        row: rowNum,
        column: 'Status',
        message: 'Status must be one of: present, late, absent',
      });
      isValid = false;
    }

    // Check Check In Time if provided
    if (record['Check In Time'] && !isValidTime(record['Check In Time'])) {
      warnings.push({
        row: rowNum,
        column: 'Check In Time',
        message: 'Check In Time should be in HH:MM format',
      });
    }

    // Check Check Out Time if provided
    if (record['Check Out Time'] && !isValidTime(record['Check Out Time'])) {
      warnings.push({
        row: rowNum,
        column: 'Check Out Time',
        message: 'Check Out Time should be in HH:MM format',
      });
    }

    if (isValid) {
      validatedData.push(record as unknown as AttendanceCSVRecord);
    }
  });

  return {
    success: errors.length === 0,
    data: validatedData as Record<string, string>[],
    errors,
    warnings,
    summary: {
      totalRows: records.length,
      validRows: validatedData.length,
      invalidRows: records.length - validatedData.length,
    },
  };
}

/**
 * Validate workers CSV data
 */
export function validateWorkersData(
  records: Record<string, string>[]
): CSVParseResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validatedData: WorkerCSVRecord[] = [];

  const requiredColumns = ['Worker ID', 'Name', 'Email', 'Phone Number', 'Department'];

  // Check headers
  if (records.length > 0) {
    const headers = Object.keys(records[0]);
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push({
        row: 1,
        column: 'headers',
        message: `Missing required columns: ${missingColumns.join(', ')}`,
      });
      return {
        success: false,
        data: [],
        errors,
        warnings,
        summary: {
          totalRows: records.length,
          validRows: 0,
          invalidRows: records.length,
        },
      };
    }
  }

  // Validate each row
  records.forEach((record, index) => {
    const rowNum = index + 2;
    let isValid = true;

    // Check Worker ID
    if (!record['Worker ID'] || record['Worker ID'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Worker ID',
        message: 'Worker ID is required',
      });
      isValid = false;
    } else if (!record['Worker ID'].match(/^W\d{3,}$/)) {
      warnings.push({
        row: rowNum,
        column: 'Worker ID',
        message: 'Worker ID format should be W followed by numbers',
      });
    }

    // Check Name
    if (!record['Name'] || record['Name'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Name',
        message: 'Name is required',
      });
      isValid = false;
    }

    // Check Email
    if (!record['Email'] || record['Email'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Email',
        message: 'Email is required',
      });
      isValid = false;
    } else if (!isValidEmail(record['Email'])) {
      errors.push({
        row: rowNum,
        column: 'Email',
        message: 'Email format is invalid',
      });
      isValid = false;
    }

    // Check Phone Number
    if (!record['Phone Number'] || record['Phone Number'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Phone Number',
        message: 'Phone Number is required',
      });
      isValid = false;
    } else if (!isValidPhone(record['Phone Number'])) {
      warnings.push({
        row: rowNum,
        column: 'Phone Number',
        message: 'Phone Number format may be invalid',
      });
    }

    // Check Department
    if (!record['Department'] || record['Department'].trim() === '') {
      errors.push({
        row: rowNum,
        column: 'Department',
        message: 'Department is required',
      });
      isValid = false;
    }

    if (isValid) {
      validatedData.push(record as unknown as WorkerCSVRecord);
    }
  });

  return {
    success: errors.length === 0,
    data: validatedData as Record<string, string>[],
    errors,
    warnings,
    summary: {
      totalRows: records.length,
      validRows: validatedData.length,
      invalidRows: records.length - validatedData.length,
    },
  };
}

/**
 * Read file as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Process file upload
 */
export async function processFileUpload(
  file: File,
  validationType: 'attendance' | 'workers'
): Promise<CSVParseResult> {
  try {
    // Read file
    const content = await readFileAsText(file);
    
    // Parse CSV
    const records = parseCSVText(content);
    
    if (records.length === 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 1, column: 'file', message: 'No data found in file' }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, invalidRows: 0 },
      };
    }

    // Validate based on type
    if (validationType === 'attendance') {
      return validateAttendanceData(records);
    } else {
      return validateWorkersData(records);
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, column: 'file', message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      warnings: [],
      summary: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }
}

/**
 * Validation helper functions
 */
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidTime(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Allow various phone formats
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
