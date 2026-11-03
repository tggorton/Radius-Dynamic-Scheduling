import type { Campaign, Creative, LineItem, RunningEvaluation } from "../types";
import { evaluateRunning, type ScheduledEntity } from "./schedule";
import { parentChildWarnings, type ScheduleWarning } from "./scheduleWarnings";

/*
 * Campaign → Line Item → Creative wiring for the pure schedule logic. Each
 * level is evaluated on its own schedule (children never inherit, PRD R1);
 * creatives have no administrative status (PRD R7).
 */

export const campaignEntity = (c: Campaign): ScheduledEntity => ({
  kind: "Campaign",
  status: c.status,
  schedule: c.schedule,
});

export const lineItemEntity = (li: LineItem): ScheduledEntity => ({
  kind: "Line item",
  status: li.status,
  schedule: li.schedule,
});

export const creativeEntity = (cr: Creative): ScheduledEntity => ({
  kind: "Creative",
  schedule: cr.schedule,
});

export const evaluateCampaign = (c: Campaign, now: number): RunningEvaluation =>
  evaluateRunning(campaignEntity(c), [], now);

export const evaluateLineItem = (
  li: LineItem,
  c: Campaign,
  now: number,
): RunningEvaluation => evaluateRunning(lineItemEntity(li), [campaignEntity(c)], now);

export const evaluateCreative = (
  cr: Creative,
  li: LineItem,
  c: Campaign,
  now: number,
): RunningEvaluation =>
  evaluateRunning(creativeEntity(cr), [campaignEntity(c), lineItemEntity(li)], now);

export const lineItemWarnings = (li: LineItem, c: Campaign): ScheduleWarning[] =>
  parentChildWarnings(lineItemEntity(li), campaignEntity(c));

export const creativeWarnings = (cr: Creative, li: LineItem): ScheduleWarning[] =>
  parentChildWarnings(creativeEntity(cr), lineItemEntity(li));

export const creativesOf = (li: LineItem, creatives: Creative[]): Creative[] =>
  creatives.filter((cr) => cr.lineItemId === li.id);

/** A line item's name without the campaign prefix, for compact messages. */
export const shortLineItemName = (li: LineItem, c: Campaign): string =>
  li.name.startsWith(`${c.name}_`) ? li.name.slice(c.name.length + 1) : li.name;

/** Collapse each child's warnings into one line, for a parent-level summary. */
const summarizeChildren = (
  children: Array<{ key: string; label: string; warnings: ScheduleWarning[] }>,
): ScheduleWarning[] =>
  children.flatMap(({ key, label, warnings }) =>
    warnings.length === 0
      ? []
      : [
          {
            id: key,
            severity: warnings.some((w) => w.severity === "high") ? "high" : "warning",
            message: `${label}: ${warnings.map((w) => w.message).join(" ")}`,
          } satisfies ScheduleWarning,
        ],
  );

/**
 * One warning per out-of-sync line item, for the campaign-level summary and the
 * campaign schedule editor.
 */
export const campaignChildWarnings = (
  c: Campaign,
  lineItems: LineItem[],
): ScheduleWarning[] =>
  summarizeChildren(
    lineItems.map((li) => ({
      key: `li-${li.id}`,
      label: shortLineItemName(li, c),
      warnings: lineItemWarnings(li, c),
    })),
  );

/** One warning per out-of-sync creative, for the line-item summary and editor. */
export const lineItemChildWarnings = (
  li: LineItem,
  creatives: Creative[],
): ScheduleWarning[] =>
  summarizeChildren(
    creativesOf(li, creatives).map((cr) => ({
      key: `cr-${cr.id}`,
      label: cr.name,
      warnings: creativeWarnings(cr, li),
    })),
  );

/**
 * Sibling coverage (D10): the line item is Serving but none of its creatives
 * are, so nothing is actually delivering.
 */
export const lineItemCoverageWarnings = (
  li: LineItem,
  c: Campaign,
  creatives: Creative[],
  now: number,
): ScheduleWarning[] => {
  const own = creativesOf(li, creatives);
  if (own.length === 0 || evaluateLineItem(li, c, now).state !== "serving") return [];
  if (own.some((cr) => evaluateCreative(cr, li, c, now).state === "serving")) return [];
  return [
    {
      id: "no-creative-serving",
      severity: "high",
      message: `The line item is Serving, but none of its ${own.length} creative${
        own.length === 1 ? " is" : "s are"
      }. Nothing is delivering.`,
    },
  ];
};

/**
 * D20: which of these items are Serving now but wouldn't be after a change.
 * Pass the same items, in the same order, before and after.
 */
export const stoppedServing = (
  before: Array<{ label: string; evaluation: RunningEvaluation }>,
  after: RunningEvaluation[],
): string[] =>
  before
    .filter((b, i) => b.evaluation.state === "serving" && after[i]?.state !== "serving")
    .map((b) => b.label);

/** Every creative's evaluation under its line item, in a stable order. */
const creativeEvaluations = (
  lineItems: LineItem[],
  creatives: Creative[],
  c: Campaign,
  now: number,
) =>
  lineItems.flatMap((li) =>
    creativesOf(li, creatives).map((cr) => ({
      label: `Creative ${cr.name}`,
      evaluation: evaluateCreative(cr, li, c, now),
    })),
  );

/**
 * Everything a campaign-level change could stop: the campaign, its line items,
 * and their creatives.
 */
export const campaignImpact = (
  current: Campaign,
  next: Campaign,
  lineItems: LineItem[],
  creatives: Creative[],
  now: number,
): string[] =>
  stoppedServing(
    [
      { label: "This campaign", evaluation: evaluateCampaign(current, now) },
      ...lineItems.map((li) => ({
        label: `Line item ${shortLineItemName(li, current)}`,
        evaluation: evaluateLineItem(li, current, now),
      })),
      ...creativeEvaluations(lineItems, creatives, current, now),
    ],
    [
      evaluateCampaign(next, now),
      ...lineItems.map((li) => evaluateLineItem(li, next, now)),
      ...creativeEvaluations(lineItems, creatives, next, now).map((e) => e.evaluation),
    ],
  );

/** A line-item change: the line item and its creatives. */
export const lineItemImpact = (
  current: LineItem,
  next: LineItem,
  c: Campaign,
  creatives: Creative[],
  now: number,
): string[] =>
  stoppedServing(
    [
      { label: "This line item", evaluation: evaluateLineItem(current, c, now) },
      ...creativeEvaluations([current], creatives, c, now),
    ],
    [
      evaluateLineItem(next, c, now),
      ...creativeEvaluations([next], creatives, c, now).map((e) => e.evaluation),
    ],
  );

export const creativeImpact = (
  current: Creative,
  next: Creative,
  li: LineItem,
  c: Campaign,
  now: number,
): string[] =>
  stoppedServing(
    [{ label: "This creative", evaluation: evaluateCreative(current, li, c, now) }],
    [evaluateCreative(next, li, c, now)],
  );
