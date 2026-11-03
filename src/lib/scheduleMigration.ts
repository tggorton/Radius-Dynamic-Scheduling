import type { Schedule, ScheduleEnd, ScheduleStart } from "../types";
import { hasSpecificBound } from "./schedule";

/*
 * Migrating saved schedules (localStorage) to the current shape. Pure — no React.
 *
 * Earlier builds stored bounds that no longer exist:
 * - `unset` (D29): a new item's empty date. Now Immediate / Indefinite.
 * - `inherit` (D32, since replaced): a child's empty date that followed its parent live.
 *   Children no longer inherit (PRD R1, D33), so each is replaced, once, with
 *   a fixed copy of the parent's bound as it stood — nothing changes state on
 *   load, and later parent edits no longer reach it.
 * - `timeZoneSource` (D24): dropped.
 *
 * Pass the parent's already-migrated schedule (null for a campaign).
 */

interface RawSchedule {
  start: { kind: string } & Record<string, unknown>;
  end: { kind: string } & Record<string, unknown>;
  timeZone: string;
}

export const migrateSchedule = (raw: unknown, parent: Schedule | null): Schedule => {
  const s = raw as RawSchedule;
  const start: ScheduleStart =
    s.start.kind === "inherit" && parent
      ? parent.start
      : s.start.kind === "inherit" || s.start.kind === "unset"
        ? { kind: "immediate" }
        : (s.start as unknown as ScheduleStart);
  const end: ScheduleEnd =
    s.end.kind === "inherit" && parent
      ? parent.end
      : s.end.kind === "inherit" || s.end.kind === "unset"
        ? { kind: "indefinite" }
        : (s.end as unknown as ScheduleEnd);
  // A copied specific date reads in the parent's zone, unless the child also
  // has a specific date of its own (whose zone then applies to both).
  const ownSpecific = s.start.kind === "specific" || s.end.kind === "specific";
  const timeZone =
    !ownSpecific && parent && hasSpecificBound({ start, end, timeZone: s.timeZone })
      ? parent.timeZone
      : s.timeZone;
  return { start, end, timeZone };
};
