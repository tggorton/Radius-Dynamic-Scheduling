import type { DistroStatus } from "../types";

/**
 * Presentation metadata for each delivery status. `color` is a theme token, not
 * a hex — the dot, the label, and anything else status-colored all read from
 * here so the four states stay visually consistent.
 */
export const STATUS_META: Record<
  DistroStatus,
  { label: string; color: string; description: string; outlined?: boolean }
> = {
  default: {
    label: "Default",
    color: "success.main",
    outlined: true,
    description:
      "Default — running on the video baseline. No platform preset applied yet; fine to serve, but not conformed to a publisher spec.",
  },
  live: {
    label: "Live",
    color: "success.main",
    description:
      "Live — conformed to a platform preset. Creatives are transcoded and ready to serve.",
  },
  processing: {
    label: "Processing",
    color: "warning.main",
    description: "Processing — transcoding is in flight.",
  },
  error: {
    label: "Error",
    color: "error.main",
    description: "Error — transcoding failed. Restart to try again.",
  },
  outOfSpec: {
    label: "Out of Spec",
    color: "outOfSpec.main",
    description:
      "Out of spec — transcode settings were manually overridden and may not meet the target platform's spec. Fix the settings; a restart won't clear this.",
  },
  inactive: {
    label: "Inactive",
    color: "text.disabled",
    description: "Inactive — dormant. Restart to rebuild source creatives.",
  },
};

export const STATUS_ORDER: DistroStatus[] = [
  "default",
  "live",
  "processing",
  "error",
  "outOfSpec",
  "inactive",
];

/**
 * Fallback for a distro whose pipeline state is unknown — legacy rows persisted
 * before the status column existed. New distros instead derive their status from
 * the line-item's current transcoding config (see `transcodeLandingStatus`).
 */
export const DEFAULT_DISTRO_STATUS: DistroStatus = "live";

/**
 * A restart re-runs the distro's source creatives / transcoding. Valid from two
 * states: `inactive` (dormant — rebuild it) and `error` (transcode failed — try
 * again). A `live` distro has nothing to fix, and a `processing` one is already
 * mid-run.
 *
 * `outOfSpec` is deliberately excluded: it's a *settings* problem, so re-running
 * the same overridden settings would just reproduce it. The fix is to edit the
 * distro, not to restart it.
 */
export const isRestartable = (status: DistroStatus): boolean =>
  status === "inactive" || status === "error";

/** Restarting a dead distro and retrying a failed one are different user intents. */
export const restartActionLabel = (status: DistroStatus): string =>
  status === "error"
    ? "Retry transcoding"
    : "Restart source creatives / transcoding";

/**
 * Why the restart button is disabled. A greyed-out control with no explanation
 * is a support ticket — say what state it's in, and what would actually help.
 */
export const restartDisabledReason = (status: DistroStatus): string => {
  if (status === "outOfSpec") {
    return "Out of spec is a settings problem — edit the distro's transcode settings. A restart would re-run the same overrides.";
  }
  return `Restart applies to an Inactive or Error distro (this one is ${STATUS_META[status].label}).`;
};

/**
 * Prototype stand-in: how long a restarted distro sits in `processing` before
 * flipping to `live`. In production the backend drives this transition (a
 * webhook or poll), and this constant goes away.
 */
export const RESTART_SIMULATION_MS = 2500;
