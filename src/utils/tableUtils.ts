/**
 * Table Utilities
 * Advanced sorting and filtering functionality for data tables
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  [key: string]: {
    type: 'text' | 'select' | 'date' | 'range';
    value: string | string[] | { min: number; max: number };
    operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  };
}

/**
 * Sort array of objects by specified key
 */
export function sortData<T extends Record<string, any>>(
  data: T[],
  sortConfig: SortConfig | null
): T[] {
  if (!sortConfig || !sortConfig.direction) {
    return [...data];
  }

  const sorted = [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortConfig.key);
    const bValue = getNestedValue(b, sortConfig.key);

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Sort based on type
    let comparison = 0;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Filter array of objects based on multiple criteria
 */
export function filterData<T extends Record<string, any>>(
  data: T[],
  filters: FilterConfig
): T[] {
  const filterEntries = Object.entries(filters);

  if (filterEntries.length === 0) {
    return data;
  }

  return data.filter((item) => {
    return filterEntries.every(([key, filter]) => {
      const value = getNestedValue(item, key);

      if (value === null || value === undefined) {
        return false;
      }

      switch (filter.type) {
        case 'text':
          return matchTextFilter(
            value,
            filter.value as string,
            filter.operator || 'contains'
          );

        case 'select':
          return matchSelectFilter(
            value,
            filter.value as string | string[]
          );

        case 'date':
          return matchDateFilter(value, filter.value as string);

        case 'range':
          return matchRangeFilter(
            value,
            filter.value as { min: number; max: number }
          );

        default:
          return true;
      }
    });
  });
}

/**
 * Combine sorting and filtering
 */
export function processTableData<T extends Record<string, any>>(
  data: T[],
  filters: FilterConfig,
  sortConfig: SortConfig | null
): T[] {
  const filtered = filterData(data, filters);
  return sortData(filtered, sortConfig);
}

/**
 * Get value from nested object path
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Match text filter
 */
function matchTextFilter(
  value: any,
  filterValue: string,
  operator: string
): boolean {
  const valueStr = String(value).toLowerCase();
  const filterStr = filterValue.toLowerCase();

  if (!filterStr) return true;

  switch (operator) {
    case 'contains':
      return valueStr.includes(filterStr);
    case 'equals':
      return valueStr === filterStr;
    case 'startsWith':
      return valueStr.startsWith(filterStr);
    case 'endsWith':
      return valueStr.endsWith(filterStr);
    default:
      return valueStr.includes(filterStr);
  }
}

/**
 * Match select filter
 */
function matchSelectFilter(value: any, filterValue: string | string[]): boolean {
  const values = Array.isArray(filterValue) ? filterValue : [filterValue];
  if (values.length === 0) return true;
  if (values.includes('all')) return true;

  return values.includes(String(value));
}

/**
 * Match date filter
 */
function matchDateFilter(value: any, filterValue: string): boolean {
  if (!filterValue) return true;

  const valueDate = new Date(value);
  const filterDate = new Date(filterValue);

  if (isNaN(valueDate.getTime()) || isNaN(filterDate.getTime())) {
    return false;
  }

  // Compare dates (ignore time)
  return (
    valueDate.toISOString().split('T')[0] ===
    filterDate.toISOString().split('T')[0]
  );
}

/**
 * Match range filter
 */
function matchRangeFilter(
  value: any,
  range: { min: number; max: number }
): boolean {
  const numValue = Number(value);
  if (isNaN(numValue)) return false;

  return numValue >= range.min && numValue <= range.max;
}

/**
 * Toggle sort direction
 */
export function toggleSortDirection(
  currentDirection: SortDirection
): SortDirection {
  if (currentDirection === null || currentDirection === 'desc') {
    return 'asc';
  }
  if (currentDirection === 'asc') {
    return 'desc';
  }
  return null;
}

/**
 * Get sort icon direction
 */
export function getSortIcon(direction: SortDirection): string {
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
  return 'unsorted';
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = columns || (Object.keys(data[0]) as (keyof T)[]);

  // Create CSV header
  const header = keys.map((key) => escapeCSVField(String(key))).join(',');

  // Create CSV rows
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        return escapeCSVField(String(value ?? ''));
      })
      .join(',')
  );

  // Combine and create blob
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Escape CSV field values
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Parse search query into filters
 */
export function parseSearchQuery(query: string): FilterConfig {
  const filters: FilterConfig = {};

  if (!query.trim()) {
    return filters;
  }

  // Handle simple key:value pairs like "dept:Engineering"
  const pairs = query.match(/(\w+):([^\s]+)/g) || [];
  pairs.forEach((pair) => {
    const [key, value] = pair.split(':');
    filters[key] = {
      type: 'select',
      value: value,
    };
  });

  return filters;
}

/**
 * Format table statistics
 */
export interface TableStats {
  totalRows: number;
  filteredRows: number;
  selectedRows: number;
  hiddenRows: number;
}

export function calculateStats(
  totalData: any[],
  filteredData: any[],
  selectedIndices: Set<number> = new Set()
): TableStats {
  return {
    totalRows: totalData.length,
    filteredRows: filteredData.length,
    selectedRows: selectedIndices.size,
    hiddenRows: totalData.length - filteredData.length,
  };
}
