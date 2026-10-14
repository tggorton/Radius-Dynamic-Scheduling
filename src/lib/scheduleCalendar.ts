/*
 * Month-grid math for the schedule date dropdown. Pure — no React.
 *
 * Works purely on calendar dates ("YYYY-MM-DD"), never instants, so it uses
 * only Date.UTC and getUTC* — both independent of the browser's zone (D21).
 */

const pad = (n: number) => String(n).padStart(2, "0");

export interface YearMonth {
  y: number;
  /** 1–12 */
  m: number;
}

export const parseIsoDate = (iso: string): { y: number; m: number; d: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) } : null;
};

export const isoDate = (y: number, m: number, d: number): string => `${y}-${pad(m)}-${pad(d)}`;

export const shiftMonth = ({ y, m }: YearMonth, delta: number): YearMonth => {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
};

const utcFormat = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" });
const MONTH_FMT = utcFormat({ month: "long", year: "numeric" });
const DATE_FMT = utcFormat({ month: "short", day: "numeric", year: "numeric" });

/** "October 2026" */
export const formatMonth = ({ y, m }: YearMonth): string => MONTH_FMT.format(Date.UTC(y, m - 1, 1));

/** "YYYY-MM-DD" → "Oct 1, 2026" (a calendar date, so no zone applies). */
export const formatIsoDate = (iso: string): string => {
  const p = parseIsoDate(iso);
  return p ? DATE_FMT.format(Date.UTC(p.y, p.m - 1, p.d)) : "";
};

export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Six Sunday-first weeks covering the month; days outside it are null. */
export const monthGrid = ({ y, m }: YearMonth): (string | null)[][] => {
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < 42; i++) {
    const d = i - firstDow + 1;
    cells.push(d >= 1 && d <= days ? isoDate(y, m, d) : null);
  }
  return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
};
