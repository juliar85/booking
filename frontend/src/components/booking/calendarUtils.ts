export const SLOT_START_HOUR = 7;   // 07:00
export const SLOT_END_HOUR = 20;    // up to but not including 20:00
export const SLOTS_PER_HOUR = 4;
export const TOTAL_SLOTS = (SLOT_END_HOUR - SLOT_START_HOUR) * SLOTS_PER_HOUR; // 52

/** Convert a slot index (0-based) to a "HH:MM" time string. */
export function slotToTime(slotIndex: number): string {
  const totalMinutes = SLOT_START_HOUR * 60 + slotIndex * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Convert a "HH:MM" or "HH:MM:SS" time string to a slot index. */
export function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - SLOT_START_HOUR) * SLOTS_PER_HOUR + Math.floor(m / 15);
}

/** Format a Date as "YYYY-MM-DD". */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Get the Monday of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return an array of 7 Date objects for Mon–Sun of the week starting at `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Add `days` days to `date` and return a new Date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Format a Date as "Mon\n31 Mar" style for calendar column headers. */
export function formatDayHeader(date: Date): { weekday: string; dayMonth: string } {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return { weekday, dayMonth: `${day} ${month}` };
}

/** Format a week range as "31 Mar – 6 Apr 2026". */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startStr = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endStr = weekEnd.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

/** Convert a "HH:MM:SS" or "HH:MM" time to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Calculate the top offset (as a fraction 0–1) of a booking block within the grid,
 * relative to SLOT_START_HOUR..SLOT_END_HOUR.
 */
export function bookingTopFraction(startTime: string): number {
  const startMinutes = timeToMinutes(startTime) - SLOT_START_HOUR * 60;
  const totalMinutes = (SLOT_END_HOUR - SLOT_START_HOUR) * 60;
  return startMinutes / totalMinutes;
}

/**
 * Calculate the height fraction of a booking block within the grid.
 */
export function bookingHeightFraction(startTime: string, endTime: string): number {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const totalMinutes = (SLOT_END_HOUR - SLOT_START_HOUR) * 60;
  return duration / totalMinutes;
}

/** Check if two Date objects represent the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
