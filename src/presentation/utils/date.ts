/** ISO "YYYY-MM-DD" <-> Date, using local date parts (never UTC) to avoid off-by-one-day shifts. */

export function isoDateToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTH_LABELS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

const MONTH_LABELS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatIsoDateShort(iso: string): string {
  const date = isoDateToLocalDate(iso);
  return `${date.getDate()} ${MONTH_LABELS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthYear(date: Date): string {
  const label = MONTH_LABELS_LONG[date.getMonth()];
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${date.getFullYear()}`;
}

export interface MonthGridCell {
  iso: string;
  day: number;
  isCurrentMonth: boolean;
}

/** Monday-first 6x7 grid covering the given month, padded with adjacent-month days. */
export function getMonthGrid(reference: Date): MonthGridCell[][] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekdayMondayFirst = (firstOfMonth.getDay() + 6) % 7; // JS: 0=Sun..6=Sat -> 0=Mon..6=Sun

  const gridStart = new Date(year, month, 1 - firstWeekdayMondayFirst);

  const weeks: MonthGridCell[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const days: MonthGridCell[] = [];
    for (let day = 0; day < 7; day++) {
      days.push({ iso: localDateToIsoDate(cursor), day: cursor.getDate(), isCurrentMonth: cursor.getMonth() === month });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}
