/**
 * Date and Time utilities for StudyPal Planning Engine
 */

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isWeekend(dateStr: string): boolean {
  const day = parseDate(dateStr).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  duration: number; // minutes
}

/**
 * Generates available session time slots for a day
 */
export function generateDaySlots(
  preferredStart: string,
  preferredEnd: string,
  maxHours: number,
  sessionLength: number,
  breakDuration: number
): ITimeSlot[] {
  const slots: ITimeSlot[] = [];
  const startMinutes = timeToMinutes(preferredStart);
  const endMinutes = timeToMinutes(preferredEnd);
  const maxStudyMinutes = maxHours * 60;

  let currentStart = startMinutes;
  let accumulatedStudyTime = 0;

  while (
    currentStart + sessionLength <= endMinutes &&
    accumulatedStudyTime + sessionLength <= maxStudyMinutes
  ) {
    const slotEnd = currentStart + sessionLength;
    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(slotEnd),
      duration: sessionLength
    });

    accumulatedStudyTime += sessionLength;
    currentStart = slotEnd + breakDuration;
  }

  return slots;
}

export function getDayOfWeekName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = parseDate(dateStr).getDay();
  return days[dayIndex] || 'Day';
}

