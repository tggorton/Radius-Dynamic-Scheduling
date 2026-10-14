import type { Campaign, LineItem } from "../types";
import { defaultSchedule, resolveImmediate } from "./schedule";
import { childDefaultSchedule } from "./scheduleInheritance";

/*
 * Building new campaigns and line items (the Create Campaign / Create Line
 * Item forms). Pure — no React. Option lists mirror the production forms
 * (_Assets-Reference/Campaing-Line-Item_Reference).
 */

/** The advertiser every campaign in the prototype sits under. */
export const ADVERTISER = {
  name: "Kerv",
  agencyId: 1,
  url: "https://kervit.com/",
  vertical: "<not assigned>",
} as const;

/** The production Vertical list as far as the reference screenshot shows it. */
export const VERTICALS = [
  "Alcohol",
  "Attractions",
  "Automotive",
  "Books and Literature",
  "Business and Finance",
  "Careers",
  "Communication",
  "Crime",
];

export const LINES_OF_BUSINESS = ["Platform Solutions", "Publisher Solutions", "Managed Media"];

export const MEDIA_TYPES = ["banner", "video"];

export const RATE_TYPES = ["CPC", "CPE", "CPM", "Flat Fee"];

/** Next id above everything in use, never below `floor` (the production-like range). */
export const nextId = (ids: number[], floor: number): number =>
  Math.max(floor - 1, ...ids) + 1;

/**
 * A new campaign: Active, at the PRD defaults — Immediate (resolved now, PRD
 * R2) → Indefinite, New York (R1, D32). The other fields read as unset, like a
 * fresh production campaign.
 */
export const newCampaign = (
  id: number,
  fields: { name: string; vertical: string; lineOfBusiness: string },
  now: number,
): Campaign => ({
  id,
  name: fields.name,
  status: "active",
  schedule: resolveImmediate(defaultSchedule(), "active", now),
  vertical: fields.vertical,
  lineOfBusiness: fields.lineOfBusiness,
  clickThroughRate: "-- %",
  interactionRate: "-- %",
  activityRate: "-- %",
  opportunityId: "No Opportunity ID",
  dealId: "No Deal ID",
  purchaseOrderId: "No Purchase Order ID",
  impressionGoal: 0,
  publisher: "<not assigned>",
});

/**
 * A new line item: start and end left empty, so it follows the campaign's
 * timeline (D32). Media Type is the line item's creative type; the rate starts at $0
 * in the chosen rate type, like production.
 */
export const newLineItem = (
  id: number,
  campaign: Campaign,
  fields: { name: string; mediaType: string; rateType: string },
): LineItem => ({
  id,
  campaignId: campaign.id,
  name: fields.name,
  status: "active",
  schedule: childDefaultSchedule(campaign.schedule.timeZone),
  creativeType: fields.mediaType,
  rate: `$0 ${fields.rateType}`,
  impressionGoal: 0,
});

/** "1,395,066", or "- -" for an unset goal (as production shows it). */
export const formatGoal = (n: number): string => (n > 0 ? n.toLocaleString("en-US") : "- -");
