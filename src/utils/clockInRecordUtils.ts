/**
 * Clock-in records can arrive with different field-name casing/shape
 * depending on the source (live API vs. cached localStorage fallback).
 * This normalizes the "is the record within the geofence" flag across
 * every variant seen in the codebase.
 */
export function isRecordWithinGeofence(record: Record<string, unknown>): boolean {
  const isWithinRaw =
    record.is_within_geofence !== undefined
      ? record.is_within_geofence
      : record.isWithinGeofence !== undefined
      ? record.isWithinGeofence
      : record.withinGeofence ?? record.within_geofence;
  return Boolean(isWithinRaw);
}
