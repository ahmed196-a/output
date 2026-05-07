import { formatToUserTimezone, parseDateSafe as parseDate, formatDuration as calcDuration } from "./timezone";

export function formatDuration(durationSeconds: number): string {
  return calcDuration(durationSeconds);
}

export function formatDateTime(isoDate: string): string {
  return formatToUserTimezone(isoDate, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(isoDate: string): string {
  return formatToUserTimezone(isoDate, {
    dateStyle: "medium",
  });
}

// Export for use elsewhere
export { formatToUserTimezone, parseDate as parseDateSafe, calcDuration };
