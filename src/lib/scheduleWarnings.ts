import {
  endMs,
  formatInZone,
  hasSpecificBound,
  startMs,
  type ScheduledEntity,
} from "./schedule";
import { zoneAbbreviation, zoneCity } from "./timezones";

/*
 * Out-of-sync schedule warnings (D10). Computed, never stored, and never
 * blocking — they exist so a mismatch is caught before something quietly
 * doesn't serve. First-pass rules; expect tuning after team feedback.
 *
 * Messages print each entity's times in that entity's own zone (D13); the
 * timezone-mismatch rule is the one place both zones appear together (D18).
 */

export type WarningSeverity = "warning" | "high";

export interface ScheduleWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const zoneName = (zone: string, atMs: number) => {
  const abbr = zoneAbbreviation(zone, atMs);
  return `${zoneCity(zone)} time${abbr ? ` (${abbr})` : ""}`;
};

/**
 * Parent/child rules: child starts before parent, runs past parent, never
 * overlaps parent, or uses a different timezone while specific times are in
 * play (D18, scoped by D22). Pass *effective* schedules (inherited bounds
 * resolved, D32); a bound the child inherits always matches the parent's.
 */
export const parentChildWarnings = (
  child: ScheduledEntity,
  parent: ScheduledEntity,
): ScheduleWarning[] => {
  const warnings: ScheduleWarning[] = [];
  const cs = startMs(child.schedule);
  const ce = endMs(child.schedule);
  const ps = startMs(parent.schedule);
  const pe = endMs(parent.schedule);
  const ctz = child.schedule.timeZone;
  const ptz = parent.schedule.timeZone;
  const p = lower(parent.kind);

  if (ce <= ps || cs >= pe) {
    warnings.push({
      id: "no-overlap",
      severity: "high",
      message: `Never serves: its whole schedule falls outside the ${p}'s (${
        Number.isFinite(ps) ? formatInZone(ps, ptz) : "Immediate"
      } → ${Number.isFinite(pe) ? formatInZone(pe, ptz) : "Indefinite"}).`,
    });
  } else {
    if (cs < ps) {
      const childStart = Number.isFinite(cs)
        ? `Starts ${formatInZone(cs, ctz)}`
        : "Starts immediately";
      warnings.push({
        id: "starts-before-parent",
        severity: "warning",
        message: `${childStart}, before the ${p} starts (${formatInZone(ps, ptz)}). It won't serve until then.`,
      });
    }
    if (ce > pe) {
      warnings.push({
        id: "ends-after-parent",
        severity: "warning",
        message:
          child.schedule.end.kind === "indefinite"
            ? `Runs indefinitely, but the ${p} ends ${formatInZone(pe, ptz)}. It stops serving then.`
            : `Ends ${formatInZone(ce, ctz)}, after the ${p} ends (${formatInZone(pe, ptz)}). It stops serving then.`,
      });
    }
  }

  if (
    ctz !== ptz &&
    (hasSpecificBound(child.schedule) || hasSpecificBound(parent.schedule))
  ) {
    const ref = Number.isFinite(cs) ? cs : Number.isFinite(ps) ? ps : Date.now();
    const examples: string[] = [];
    if (child.schedule.start.kind === "specific") {
      examples.push(
        `starts ${formatInZone(cs, ctz)} (${formatInZone(cs, ptz)} ${p} time)`,
      );
    }
    if (child.schedule.end.kind === "specific") {
      examples.push(
        `ends ${formatInZone(ce, ctz)} (${formatInZone(ce, ptz)} ${p} time)`,
      );
    }
    // Pass effective schedules: a child only reads in a different zone when
    // it has a date of its own, set in its own zone (D32), so name it as such.
    const lead = `Set to its own timezone, ${zoneName(ctz, ref)}; the ${p} uses ${zoneName(ptz, ref)}.`;
    warnings.push({
      id: "timezone-mismatch",
      severity: "warning",
      message: `${lead}${
        examples.length ? ` The ${lower(child.kind)} ${examples.join(" and ")}.` : ""
      }`,
    });
  }

  return warnings;
};

export const highestSeverity = (
  warnings: ScheduleWarning[],
): WarningSeverity | null =>
  warnings.length === 0
    ? null
    : warnings.some((w) => w.severity === "high")
      ? "high"
      : "warning";
