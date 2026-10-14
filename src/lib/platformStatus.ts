import type { PlatformStatus } from "../types";

/**
 * Presentation metadata for each platform-delivery status. Same shape as
 * `STATUS_META` in distroStatus.ts so both feed the shared `StatusChip`.
 * The backend owns this lifecycle once the push API is real; today the push
 * flow simulates it.
 */
export const PLATFORM_STATUS_META: Record<
  PlatformStatus,
  { label: string; color: string; description: string; outlined?: boolean }
> = {
  notPushed: {
    label: "Not pushed",
    color: "text.disabled",
    outlined: true,
    description: "Not pushed — this tag hasn't been sent to a platform yet.",
  },
  pushing: {
    label: "Pushing",
    color: "warning.main",
    description: "Pushing — the tag is being sent to the platform.",
  },
  success: {
    label: "Success",
    color: "success.main",
    description: "Success — the platform accepted the tag.",
  },
  error: {
    label: "Error",
    color: "error.main",
    description: "Error — the push failed or the platform rejected the tag.",
  },
  inactive: {
    label: "Inactive",
    color: "text.disabled",
    description:
      "Inactive — unlinked from its platform. Push again to relink.",
  },
};

export const PLATFORM_STATUS_ORDER: PlatformStatus[] = [
  "notPushed",
  "pushing",
  "success",
  "error",
  "inactive",
];

export const DEFAULT_PLATFORM_STATUS: PlatformStatus = "notPushed";
