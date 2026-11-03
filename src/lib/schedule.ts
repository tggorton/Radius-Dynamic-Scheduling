import type {
  AdminStatus,
  RunningEvaluation,
  Schedule,
} from "../types";
import { DEFAULT_TIME_ZONE } from "./timezones";

/*
 * Schedule domain logic. Pure — no React.
 *
 * D21 is the rule this file exists to enforce: the user's computer clock and
 * browser timezone never affect a schedule value. So nothing here uses
 * `new Date("YYYY-MM-DDTHH:mm")`, `Date#getHours()` and friends, or
 * `toLocaleString()` without a `timeZone` — each of those silently falls back
 * to the browser's zone. Wall-clock ⇄ UTC always goes through an explicit IANA
 * zone. The only thing taken from the machine is "now", an absolute instant.
 */

/** PRD defaults: Immediate / Indefinite / America/New_York (R1, D6). */
export const defaultSchedule = (timeZone: string = DEFAULT_TIME_ZONE): Schedule => ({
  start: { kind: "immediate" },
  end: { kind: "indefinite" },
  timeZone,
});

/** A bound whose value depends on the timezone (D22). */
export const hasSpecificBound = (s: Schedule): boolean =>
  s.start.kind === "specific" || s.end.kind === "specific";

/* ---------------------------- wall clock ⇄ UTC --------------------------- */

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

const partsFormatter = (zone: string): Intl.DateTimeFormat => {
  let dtf = partsFormatters.get(zone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(zone, dtf);
  }
  return dtf;
};

interface WallParts {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

const wallParts = (utcMs: number, zone: string): WallParts => {
  const get = (type: string) =>
    Number(
      partsFormatter(zone)
        .formatToParts(utcMs)
        .find((p) => p.type === type)?.value ?? 0,
    );
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    h: get("hour") % 24,
    mi: get("minute"),
    s: get("second"),
  };
};

/** The zone's offset from UTC at `utcMs`, in ms (e.g. −4h for EDT). */
const tzOffsetMs = (utcMs: number, zone: string): number => {
  const whole = Math.floor(utcMs / 1000) * 1000;
  const p = wallParts(whole, zone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - whole;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A wall-clock reading in a zone, as the editor's date + time strings. */
export interface WallClock {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm", 24-hour */
  time: string;
}

export const utcToWallClock = (utcMs: number, zone: string): WallClock => {
  const p = wallParts(utcMs, zone);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
};

export type WallClockResult =
  | { ok: true; utcMs: number; ambiguous: boolean }
  | { ok: false; reason: "incomplete" | "invalid" | "nonexistent" };

const DAY_MS = 86_400_000;

/**
 * "2026-10-08" + "09:00" in `zone` → a UTC instant.
 *
 * DST edges: a time skipped by spring-forward is `nonexistent`; a time that
 * occurs twice at fall-back resolves to the earlier instant, flagged
 * `ambiguous`.
 */
export const wallClockToUtc = (
  date: string,
  time: string,
  zone: string,
): WallClockResult => {
  if (!date || !time) return { ok: false, reason: "incomplete" };
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})/.exec(time);
  if (!dm || !tm) return { ok: false, reason: "invalid" };
  const [y, m, d, h, mi] = [dm[1], dm[2], dm[3], tm[1], tm[2]].map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const candidates = Array.from(
    new Set(
      [guess - DAY_MS, guess, guess + DAY_MS].map(
        (probe) => guess - tzOffsetMs(probe, zone),
      ),
    ),
  );
  const matches = candidates
    .filter((c) => {
      const w = utcToWallClock(c, zone);
      return w.date === date && w.time === `${pad(h)}:${pad(mi)}`;
    })
    .sort((a, b) => a - b);
  if (matches.length === 0) return { ok: false, reason: "nonexistent" };
  return { ok: true, utcMs: matches[0], ambiguous: matches.length > 1 };
};

/* -------------------------------- display -------------------------------- */

const displayFormatters = new Map<string, Intl.DateTimeFormat>();

const displayFormatter = (
  zone: string,
  kind: "full" | "date" | "time",
): Intl.DateTimeFormat => {
  const key = `${zone}|${kind}`;
  let dtf = displayFormatters.get(key);
  if (!dtf) {
    const date = { month: "short", day: "numeric", year: "numeric" } as const;
    const time = {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    } as const;
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      ...(kind !== "time" ? date : {}),
      ...(kind !== "date" ? time : {}),
    });
    displayFormatters.set(key, dtf);
  }
  return dtf;
};

/** "Oct 8, 2026, 9:00 AM EDT" — always in the given zone (D19). */
export const formatInZone = (utcMs: number, zone: string): string =>
  displayFormatter(zone, "full").format(utcMs);

export const formatDateInZone = (utcMs: number, zone: string): string =>
  displayFormatter(zone, "date").format(utcMs);

export const formatTimeInZone = (utcMs: number, zone: string): string =>
  displayFormatter(zone, "time").format(utcMs);

/**
 * How a bound reads in a summary or table cell. Immediate/Indefinite lead with
 * the setting, not a time (D14, D22); a specific bound shows date + time.
 */
export interface BoundDisplay {
  primary: string;
  secondary?: string;
}

export const describeStart = (s: Schedule, now: number): BoundDisplay => {
  if (s.start.kind === "immediate") {
    if (!s.start.resolvedAt) {
      return { primary: "Immediate", secondary: "Starts when activated" };
    }
    const at = Date.parse(s.start.resolvedAt);
    return {
      primary: "Immediate",
      secondary: `${at <= now ? "Started" : "Starts"} ${formatInZone(at, s.timeZone)}`,
    };
  }
  const at = Date.parse(s.start.utc);
  return {
    primary: formatDateInZone(at, s.timeZone),
    secondary: formatTimeInZone(at, s.timeZone),
  };
};

export const describeEnd = (s: Schedule): BoundDisplay => {
  if (s.end.kind === "indefinite") {
    return { primary: "Indefinite", secondary: "No end date" };
  }
  const at = Date.parse(s.end.utc);
  return {
    primary: formatDateInZone(at, s.timeZone),
    secondary: formatTimeInZone(at, s.timeZone),
  };
};

/* ------------------------------- evaluation ------------------------------ */

/** Start in ms; −∞ for an unresolved Immediate (legacy/unsaved). */
export const startMs = (s: Schedule): number =>
  s.start.kind === "specific"
    ? Date.parse(s.start.utc)
    : s.start.kind === "immediate" && s.start.resolvedAt
      ? Date.parse(s.start.resolvedAt)
      : Number.NEGATIVE_INFINITY;

/** End in ms; +∞ for Indefinite. The end is exclusive. */
export const endMs = (s: Schedule): number =>
  s.end.kind === "specific"
    ? Date.parse(s.end.utc)
    : Number.POSITIVE_INFINITY;

/** One level of the hierarchy, as the evaluator sees it. */
export interface ScheduledEntity {
  /** "Campaign", "Line item" — used in reasons. */
  kind: string;
  /** Campaigns and line items; creatives have none (PRD R7). */
  status?: AdminStatus;
  schedule: Schedule;
}

/**
 * The PRD's hierarchical check (workflow §4), top-down, first failure wins:
 * parent not serving (inactive or pending, merged per D17) → parent expired →
 * own inactive → pending start → schedule expired → serving.
 *
 * `ancestors` is ordered outermost first (campaign, then line item …).
 */
export const evaluateRunning = (
  self: ScheduledEntity,
  ancestors: ScheduledEntity[],
  now: number,
): RunningEvaluation => {
  for (const parent of ancestors) {
    const tz = parent.schedule.timeZone;
    if (parent.status === "inactive") {
      return {
        state: "parentNotServing",
        cause: "parentInactive",
        detail: `${parent.kind} is set to Inactive.`,
      };
    }
    if (now < startMs(parent.schedule)) {
      return {
        state: "parentNotServing",
        cause: "parentPending",
        detail: `${parent.kind} starts ${formatInZone(startMs(parent.schedule), tz)}.`,
      };
    }
    if (now >= endMs(parent.schedule)) {
      return {
        state: "parentExpired",
        detail: `${parent.kind} ended ${formatInZone(endMs(parent.schedule), tz)}.`,
      };
    }
  }
  const tz = self.schedule.timeZone;
  if (self.status === "inactive") {
    return { state: "inactive", detail: "Status is set to Inactive." };
  }
  if (now < startMs(self.schedule)) {
    return {
      state: "pendingStart",
      detail: `Starts ${formatInZone(startMs(self.schedule), tz)}.`,
    };
  }
  if (now >= endMs(self.schedule)) {
    return {
      state: "scheduleExpired",
      detail: `Ended ${formatInZone(endMs(self.schedule), tz)}.`,
    };
  }
  return {
    state: "serving",
    detail:
      self.schedule.end.kind === "indefinite"
        ? "Serving with no end date."
        : `Serving until ${formatInZone(endMs(self.schedule), tz)}.`,
  };
};

/**
 * Immediate resolves at save, or at activation if saved Inactive (PRD R2, D14).
 * Returns the schedule with `resolvedAt` filled in when it should be.
 */
export const resolveImmediate = (
  s: Schedule,
  status: AdminStatus,
  now: number,
): Schedule =>
  s.start.kind === "immediate" && !s.start.resolvedAt && status === "active"
    ? { ...s, start: { kind: "immediate", resolvedAt: new Date(now).toISOString() } }
    : s;

export const schedulesEqual = (a: Schedule, b: Schedule): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
