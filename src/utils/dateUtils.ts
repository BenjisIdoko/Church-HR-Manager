/**
 * Parses a "YYYY-MM-DD" date string as a local-timezone Date instead of UTC,
 * avoiding the off-by-one-day shift `new Date("YYYY-MM-DD")` can produce in
 * timezones west of UTC. Falls back to `new Date(dateStr)` for any other format.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}
