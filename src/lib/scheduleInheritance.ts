import type { Campaign, Creative, LineItem, Schedule } from "../types";
import { hasSpecificBound } from "./schedule";

/*
 * Schedule inheritance (D32). Pure — no React.
 *
 * Campaign → line item → creative. A line item's or creative's start or end
 * left empty is stored as `inherit` and follows the parent's bound *live*:
 * resolve it with `effectiveSchedule` for display and evaluation. Bounds the
 * user set on the child are its own — a parent edit never rewrites them, nor
 * the child's timezone (no cascade). Nothing here reads the browser's zone (D21).
 */

/**
 * A new line item's or creative's schedule: both bounds empty, so it follows
 * its parent's timeline (D32). The zone is only a default for when the user
 * sets a date of its own.
 */
export const childDefaultSchedule = (parentZone: string): Schedule => ({
  start: { kind: "inherit" },
  end: { kind: "inherit" },
  timeZone: parentZone,
});

/** Which of this entity's bounds follow the parent. */
export const inheritedBounds = (s: Schedule): { start: boolean; end: boolean } => ({
  start: s.start.kind === "inherit",
  end: s.end.kind === "inherit",
});

export const inheritsAny = (s: Schedule): boolean =>
  s.start.kind === "inherit" || s.end.kind === "inherit";

/**
 * The schedule as it actually applies: `inherit` bounds replaced by the
 * parent's effective bounds (Immediate / Indefinite at the top, where nothing
 * is inherited). The zone is this entity's own while it has a Specific bound
 * of its own; with none, it reads in the parent's zone.
 */
export const effectiveSchedule = (own: Schedule, parent: Schedule | null): Schedule => ({
  start:
    own.start.kind === "inherit" ? (parent ? parent.start : { kind: "immediate" }) : own.start,
  end: own.end.kind === "inherit" ? (parent ? parent.end : { kind: "indefinite" }) : own.end,
  timeZone: hasSpecificBound(own) || !parent ? own.timeZone : parent.timeZone,
});

export const effectiveLineItemSchedule = (li: LineItem, c: Campaign): Schedule =>
  effectiveSchedule(li.schedule, c.schedule);

export const effectiveCreativeSchedule = (cr: Creative, li: LineItem, c: Campaign): Schedule =>
  effectiveSchedule(cr.schedule, effectiveLineItemSchedule(li, c));

/** "Start from campaign" / "End from line item" / "Start & end from campaign", or null. */
export const inheritedNote = (s: Schedule, parentKind: string): string | null => {
  const { start, end } = inheritedBounds(s);
  if (start && end) return `Start & end from ${parentKind}`;
  if (start) return `Start from ${parentKind}`;
  if (end) return `End from ${parentKind}`;
  return null;
};

/**
 * Storage/seed migration from the D24/D29 shapes: drop `timeZoneSource`; an
 * `unset` bound becomes Immediate / Indefinite on a campaign (PRD R1) and
 * `inherit` on a child (D32).
 */
export const migrateSchedule = (raw: unknown, isTopLevel: boolean): Schedule => {
  const s = raw as {
    start: { kind: string } & Record<string, unknown>;
    end: { kind: string } & Record<string, unknown>;
    timeZone: string;
  };
  const start =
    s.start.kind === "unset"
      ? isTopLevel
        ? { kind: "immediate" as const }
        : { kind: "inherit" as const }
      : (s.start as unknown as Schedule["start"]);
  const end =
    s.end.kind === "unset"
      ? isTopLevel
        ? { kind: "indefinite" as const }
        : { kind: "inherit" as const }
      : (s.end as unknown as Schedule["end"]);
  return { start, end, timeZone: s.timeZone };
};
