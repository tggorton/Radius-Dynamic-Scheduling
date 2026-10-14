export type Role = "user" | "admin";

/**
 * A region is a string id pointing into AppState.regions. Seed ids
 * ("us-east-1", "australia", "europe") match the original literal union;
 * admin-added regions get auto-generated ids.
 */
export type Region = string;

export interface RegionDef {
  id: string;
  name: string;
  baseUrl: string;
}

export type TemplateFamily = "nexxen" | "ttd";

export interface CustomKeyValue {
  id: string;
  key: string;
  value: string;
}

export interface Template {
  id: string;
  name: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
  isBuiltIn?: boolean;
  /**
   * Optional advertiser scope. When set, the template only appears in the
   * Tag Template dropdown for users on a campaign tied to this advertiser.
   * Templates with no advertiserId are visible to everyone.
   */
  advertiserId?: string;
  /**
   * When true, the template is hidden from the main Add Distribution Tag
   * dropdown but remains visible (greyed out) in the admin Manage Templates
   * picker so an admin can re-enable it. Existing distros that referenced
   * this template are unaffected — they're self-contained snapshots.
   */
  disabled?: boolean;
}

/**
 * Delivery status of a distro's underlying creatives / transcoding pipeline.
 * The backend owns the real lifecycle; the UI reflects it and offers a restart.
 *
 *   default    green  — running on the video baseline; no platform preset has
 *                       been officially applied yet. Fine to serve (hence green),
 *                       but distinct from `live` so an un-set line-item is visible.
 *   live       green  — conformed to a chosen platform preset; ready to serve
 *   processing amber  — transcoding / in flight
 *   error      red    — the transcode failed; retrying may fix it
 *   outOfSpec  orange — transcode settings were manually overridden and may not
 *                       meet the target pub/platform's spec. A *config* problem,
 *                       not a run failure — re-running the same settings would
 *                       reproduce it, so this is not restartable.
 *   inactive   grey   — off / dormant; restart rebuilds it
 */
export type DistroStatus =
  | "default"
  | "live"
  | "processing"
  | "error"
  | "outOfSpec"
  | "inactive";

/**
 * Delivery status of pushing a distro's tag to a platform (Push Tags to
 * Platform). Independent of transcoding — a distro can be transcoded `live` yet
 * never pushed, or pushed and rejected.
 *
 *   notPushed  grey ring — never pushed to a platform
 *   pushing    amber     — push in flight
 *   success    green     — the platform accepted the tag
 *   error      red       — the push failed or the platform rejected it
 *   inactive   grey      — was linked to a platform, then unlinked
 */
export type PlatformStatus =
  | "notPushed"
  | "pushing"
  | "success"
  | "error"
  | "inactive";

export interface Distro {
  id: string;
  name: string;
  templateId: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
  distributionId: number;
  lineItemId: number;
  createdAt: string;
  /** Transcode status per applied preset (one entry per line-item config). */
  transcodes: DistroTranscode[];
  /** Delivery-to-platform status (Push Tags to Platform). */
  platformStatus: PlatformStatus;
  /** Where this distro was last pushed — platform, advertiser name, advertiser id. */
  pushTarget?: { platform: string; advertiser: string; advertiserId?: string };
}

export interface ParamDef {
  id: string;
  label: string;
  output: string;
}

export interface ParamsCatalog {
  nexxen: ParamDef[];
  ttd: ParamDef[];
  creative: ParamDef[];
}

export type ParamFamilyKey = "nexxen" | "ttd" | "creative";

/**
 * A flat map of transcode field id → value. Values are stored as strings even
 * for numeric-looking fields ("15–30 Mbps") — this is a settings sheet the user
 * reads and tweaks, not something we compute with.
 */
export type TranscodeSettings = Record<string, string>;

/**
 * One transcoding config the line-item applies. `presetId` records which preset
 * the settings were derived from; `settings` is the effective (possibly
 * hand-edited) value set. When `settings` diverges from that preset's canonical
 * values, the config is a one-off override for this line-item — the preset
 * itself is never mutated. A line-item applies a *list* of these
 * (`AppState.transcoding`); each distro is transcoded once per config.
 */
export interface TranscodingConfig {
  presetId: string;
  settings: TranscodeSettings;
}

/**
 * One distro's result for one applied transcoding config: which preset it was
 * transcoded for, and the resulting transcode status. A distro holds one of
 * these per config in the line-item's transcoding list.
 */
export interface DistroTranscode {
  presetId: string;
  status: DistroStatus;
}

/**
 * A named transcoding preset (a publisher spec, plus the protected "default"
 * baseline). Admin-managed and mutable — lives in AppState, seeded from the
 * built-in list. `shortName` is the compact form for tight UI (status chips).
 */
export interface TranscodePreset {
  id: string;
  name: string;
  shortName: string;
  settings: TranscodeSettings;
}

/* ------------------------------------------------------------------ */
/* Dynamic Scheduling (see docs/handoff-dynamic-scheduling.md)         */
/* ------------------------------------------------------------------ */

/**
 * The manual on/off switch that exists today ("Status: Active"). The clock never
 * changes it (PRD R11) — whether something is actually serving is computed, see
 * `RunningState`.
 */
export type AdminStatus = "active" | "inactive";

/**
 * Start bound. `immediate` resolves to a real instant at save, or at activation
 * if saved Inactive (D14); `resolvedAt` stays undefined until then. `specific`
 * always carries both a date and a time (D23), stored as UTC. `inherit` (line
 * items and creatives only) means the start was left empty, so it follows the
 * parent's start live (D32).
 */
export type ScheduleStart =
  | { kind: "inherit" }
  | { kind: "immediate"; resolvedAt?: string }
  | { kind: "specific"; utc: string };

/**
 * End bound. `indefinite` is never evaluated (PRD R3). The end is exclusive.
 * `inherit` follows the parent's end live (D32).
 */
export type ScheduleEnd =
  | { kind: "inherit" }
  | { kind: "indefinite" }
  | { kind: "specific"; utc: string };

/**
 * One schedule shape for campaigns, line items, and creatives — as the user
 * set it on that entity. Times are UTC; `timeZone` is the IANA zone they were
 * entered in and are shown in (D13, D19). It only carries meaning for this
 * entity's own `specific` bounds (D22). Inherited bounds are resolved against
 * the parent with `effectiveSchedule` (scheduleInheritance.ts) before display
 * or evaluation; a parent edit never rewrites a child's stored schedule (D32).
 */
export interface Schedule {
  start: ScheduleStart;
  end: ScheduleEnd;
  timeZone: string;
}

/**
 * Computed run state (PRD R13). Never stored. `serving` is the PRD's computed
 * "Active", renamed so it can't be confused with AdminStatus "active" (D12).
 * `parentNotServing` merges "parent inactive" and "parent pending" (D17) — the
 * cause is kept on `RunningEvaluation.cause` so the two can be split again.
 */
export type RunningState =
  | "serving"
  | "pendingStart"
  | "scheduleExpired"
  | "inactive"
  | "parentNotServing"
  | "parentExpired";

export interface RunningEvaluation {
  state: RunningState;
  /** Only for `parentNotServing`: which of the merged causes applied (D17). */
  cause?: "parentInactive" | "parentPending";
  /** Human-readable reason, e.g. "Campaign starts Oct 5, 2026, 9:00 AM EDT". */
  detail: string;
}

export interface Campaign {
  id: number;
  name: string;
  status: AdminStatus;
  schedule: Schedule;
  vertical: string;
  lineOfBusiness: string;
  clickThroughRate: string;
  interactionRate: string;
  activityRate: string;
  opportunityId: string;
  dealId: string;
  purchaseOrderId: string;
  impressionGoal: number;
  publisher: string;
}

export interface LineItem {
  id: number;
  campaignId: number;
  name: string;
  status: AdminStatus;
  schedule: Schedule;
  creativeType: string;
  rate: string;
  impressionGoal: number;
}

/**
 * A creative on a line item. One line item per creative in this pass (D27's
 * shared "home" rule comes later). `id` is the Creative ID shown in the table.
 */
export interface Creative {
  id: number;
  lineItemId: number;
  name: string;
  status: AdminStatus;
  schedule: Schedule;
  /** A weight the user typed (0–100), kept until reset. `null` = auto-split.
   *  The share actually applied is computed among Serving creatives (D28). */
  customWeight: number | null;
}

/** Which page is showing. The prototype has no router; this is it. */
export type View =
  | { page: "advertiser" }
  | { page: "campaign"; campaignId: number }
  | { page: "lineItem"; lineItemId: number };

/**
 * Prototype-only: which dataset is on screen. `sample` is the seeded campaign
 * 4074; `demo` starts empty at the advertiser so a reviewer builds a campaign,
 * line items, and creatives from scratch.
 */
export type ExperienceMode = "sample" | "demo";

/** The scheduling data one experience mode owns. */
export interface Workspace {
  campaigns: Campaign[];
  lineItems: LineItem[];
  creatives: Creative[];
  view: View;
}

export interface AppState {
  role: Role;
  templates: Template[];
  distros: Distro[];
  nextDistributionId: number;
  paramsCatalog: ParamsCatalog;
  regions: RegionDef[];
  /** The transcoding configs the line-item applies — each distro gets one
   *  transcode per entry. */
  transcoding: TranscodingConfig[];
  transcodePresets: TranscodePreset[];
  /** The last advertiser pushed to per platform id, so further pushes to that
   *  platform default to it. Advertiser type lives in lib/pushTargets. */
  platformAdvertisers: Record<
    string,
    { id: string; name: string; advertiserId: string }
  >;
  /** Dynamic Scheduling: the active workspace's campaigns (all under one advertiser). */
  campaigns: Campaign[];
  lineItems: LineItem[];
  creatives: Creative[];
  view: View;
  /** Which workspace is on screen; the other one is parked, untouched. */
  mode: ExperienceMode;
  parkedWorkspace: Workspace;
  /** Prototype-only simulated clock: ms added to the real current instant. */
  clockOffsetMs: number;
}
