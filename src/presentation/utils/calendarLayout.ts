import type { WeekDay } from "@domain/entities/Subject";

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 22;
export const HOUR_HEIGHT = 64; // px per hour, drives card height & drag snapping
export const SNAP_MINUTES = 15;
/** Fixed column width so subject names have room to read (grid scrolls horizontally to fit 7). */
export const DAY_WIDTH = 132;
export const TIME_GUTTER_WIDTH = 44;
export const DAY_LABELS: Record<WeekDay, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};
export const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(GRID_START_HOUR * 60, Math.min(GRID_END_HOUR * 60, totalMinutes));
  const snapped = Math.round(clamped / SNAP_MINUTES) * SNAP_MINUTES;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Extra blank row, the same full HOUR_HEIGHT as every real hour row, added
 * above 7:00 and below 22:00 — breathing room so the first/last hour rows
 * don't sit flush against the screen edge. A thin sliver here (instead of a
 * full row) is what made those two rows look cut off/incomplete before.
 */
export const GRID_EDGE_PADDING = HOUR_HEIGHT;

export function minutesFromGridTop(offsetY: number): number {
  return GRID_START_HOUR * 60 + ((offsetY - GRID_EDGE_PADDING) / HOUR_HEIGHT) * 60;
}

export function yFromMinutes(minutes: number): number {
  return GRID_EDGE_PADDING + ((minutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

export function dayFromX(x: number, dayWidth: number): WeekDay {
  const index = Math.max(0, Math.min(6, Math.floor(x / dayWidth)));
  return WEEK_DAYS[index];
}

export const GRID_TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT + GRID_EDGE_PADDING * 2;
export const HOUR_MARKS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);
