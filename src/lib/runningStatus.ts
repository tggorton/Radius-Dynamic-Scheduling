import type { RunningEvaluation, RunningState } from "../types";

/**
 * Presentation metadata for the computed run state — the third status
 * lifecycle, rendered by the shared StatusChip like Transcode and Platform
 * status. Colors are theme tokens and provisional (see the hand-off doc);
 * labels always show because several states share hues.
 *
 * "Serving" is the PRD's computed "Active" (D12) — named apart from the
 * administrative "Active" on purpose.
 */
export const RUNNING_STATE_META: Record<
  RunningState,
  { label: string; color: string; description: string; outlined?: boolean }
> = {
  serving: {
    label: "Serving",
    color: "success.main",
    description:
      "Serving — Active and inside its schedule, and so is everything above it.",
  },
  pendingStart: {
    label: "Pending Start",
    color: "info.main",
    outlined: true,
    description: "Pending start — Active, but its start time hasn't arrived.",
  },
  scheduleExpired: {
    label: "Schedule Expired",
    color: "text.disabled",
    description:
      "Schedule expired — its end time has passed. Extending the end resumes serving; no reactivation needed.",
  },
  inactive: {
    label: "Inactive",
    color: "text.disabled",
    outlined: true,
    description: "Inactive — its status is switched off.",
  },
  parentNotServing: {
    label: "Parent Not Serving",
    color: "warning.main",
    outlined: true,
    description:
      "Parent not serving — its own schedule is fine, but a parent is Inactive or hasn't started.",
  },
  parentExpired: {
    label: "Parent Expired",
    color: "warning.main",
    description:
      "Parent expired — its own schedule is fine, but a parent's schedule has ended.",
  },
};

/** Tooltip text: what the state means, then why this entity is in it. */
export const runningTooltip = (evaluation: RunningEvaluation): string =>
  `${RUNNING_STATE_META[evaluation.state].description} ${evaluation.detail}`;
