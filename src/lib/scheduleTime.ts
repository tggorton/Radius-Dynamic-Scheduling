/*
 * Time-of-day text for the schedule editor's time field. Pure — no React.
 *
 * Works only on wall-clock strings ("HH:mm", 24-hour), never on instants, so
 * nothing here touches the browser's timezone (D21).
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** "21:30" → "9:30 PM". Returns "" for an empty or malformed value. */
export const formatTime12 = (hhmm: string): string => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "";
  const h = Number(m[1]);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
};

/**
 * Lenient parse of what a person types: "9:30 PM", "9:30pm", "930pm", "9 pm",
 * "21:30", "2130", "9". Without AM/PM the value is read as 24-hour, so "9"
 * is 9:00 AM and "21:30" is 9:30 PM. Returns "HH:mm" or null.
 */
export const parseTimeInput = (raw: string): string | null => {
  const s = raw.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, "");
  if (!s) return null;
  const m = /^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const mi = m[2] === undefined ? 0 : Number(m[2]);
  const ap = m[3];
  if (mi > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    const pm = ap.startsWith("p");
    h = h % 12 + (pm ? 12 : 0);
  } else if (h > 23) {
    return null;
  }
  return `${pad(h)}:${pad(mi)}`;
};

/**
 * The pick list: every 15 minutes from 12:00 AM to 11:45 PM, plus 11:59 PM
 * for end-of-day ends. A finite list — it stops at both ends rather than
 * looping like the browser's native time picker.
 */
export const TIME_OPTIONS: string[] = [
  ...Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`),
  "23:59",
];
