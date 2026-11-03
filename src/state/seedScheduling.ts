import type { Campaign, Creative, LineItem, Schedule, View, Workspace } from "../types";

/*
 * Demo campaign + line items for Dynamic Scheduling, from the campaign page
 * sample (_Assets-Reference/Campaign-Page_Sample.png). Schedules are chosen so
 * that, around the end of Sep 2026, the page shows a spread of run states and
 * warnings without touching anything. UTC values are annotated with the wall
 * clock they were entered as.
 */

const CAMPAIGN_ID = 4074;
const BASE = "Disney_Kooth Digital_Soluna_L-bar_Q4'26";

export const SEED_CAMPAIGN: Campaign = {
  id: CAMPAIGN_ID,
  name: BASE,
  status: "active",
  schedule: {
    // Sep 15, 2026 12:00 AM EDT → Dec 31, 2026 11:59 PM EST
    start: { kind: "specific", utc: "2026-09-15T04:00:00.000Z" },
    end: { kind: "specific", utc: "2027-01-01T04:59:00.000Z" },
    timeZone: "America/New_York",
  },
  vertical: "Technology & Computing",
  lineOfBusiness: "Publisher Solutions",
  clickThroughRate: "-- %",
  interactionRate: "-- %",
  activityRate: "-- %",
  opportunityId: "No Opportunity ID",
  dealId: "No Deal ID",
  purchaseOrderId: "No Purchase Order ID",
  impressionGoal: 1_395_066,
  publisher: "<not assigned>",
};

const lineItem = (
  id: number,
  suffix: string,
  schedule: LineItem["schedule"],
  impressionGoal: number,
): LineItem => ({
  id,
  campaignId: CAMPAIGN_ID,
  name: `${BASE}_${suffix}`,
  status: "active",
  schedule,
  creativeType: "video",
  rate: "$1.65 CPM",
  impressionGoal,
});

export const SEED_LINE_ITEMS: LineItem[] = [
  // Serving now; Indefinite under a campaign that ends → "runs past" warning.
  lineItem(
    25095,
    "Community Forums_Disney+_30s_Sync+L",
    {
      // Immediate, resolved Sep 15, 2026 9:30 AM EDT
      start: { kind: "immediate", resolvedAt: "2026-09-15T13:30:00.000Z" },
      end: { kind: "indefinite" },
      timeZone: "America/New_York",
    },
    348_768,
  ),
  // Pending start; fits inside the campaign cleanly.
  lineItem(
    25096,
    "Community Forums_Hulu_30s_Sync+L",
    {
      // Oct 8, 2026 12:00 AM EDT → Nov 29, 2026 11:59 PM EST
      start: { kind: "specific", utc: "2026-10-08T04:00:00.000Z" },
      end: { kind: "specific", utc: "2026-11-30T04:59:00.000Z" },
      timeZone: "America/New_York",
    },
    348_766,
  ),
  // Pending start, entered in Pacific time → timezone-mismatch warning.
  lineItem(
    25097,
    "Dog Probs_Disney+_30s_Sync+L",
    {
      // Oct 8, 2026 12:00 AM PDT → Nov 29, 2026 11:59 PM PST
      start: { kind: "specific", utc: "2026-10-08T07:00:00.000Z" },
      end: { kind: "specific", utc: "2026-11-30T07:59:00.000Z" },
      timeZone: "America/Los_Angeles",
      },
    348_766,
  ),
  // Already ended, and started before the campaign → expired + warning.
  lineItem(
    25098,
    "Dog Probs_Hulu_30s_Sync+L",
    {
      // Sep 1, 2026 12:00 AM EDT → Sep 20, 2026 11:59 PM EDT
      start: { kind: "specific", utc: "2026-09-01T04:00:00.000Z" },
      end: { kind: "specific", utc: "2026-09-21T03:59:00.000Z" },
      timeZone: "America/New_York",
    },
    348_766,
  ),
];

const NY = "America/New_York";
const LA = "America/Los_Angeles";

/** A creative's schedule, entered in `zone`. */
const own = (
  zone: string,
  start: Schedule["start"],
  end: Schedule["end"],
): Schedule => ({ start, end, timeZone: zone });


const creative = (
  id: number,
  lineItemId: number,
  name: string,
  schedule: Schedule,
  customWeight: number | null = null,
): Creative => ({ id, lineItemId, name, schedule, customWeight });

/**
 * Creatives per line item. On 25095, two are Serving now (a typed 60% plus an
 * auto 40%, the baseline's split), one ended, and one starts later, so jumping
 * the demo clock shows the weights re-balance among whatever is Serving (D28).
 */
export const SEED_CREATIVES: Creative[] = [
  // 25095 — Serving line item, New York.
  creative(
    8421,
    25095,
    "Stratos_Hero_30s",
    // Immediate, resolved Sep 15, 2026 9:30 AM EDT → Indefinite
    own(NY, { kind: "immediate", resolvedAt: "2026-09-15T13:30:00.000Z" }, { kind: "indefinite" }),
    60,
  ),
  creative(
    8422,
    25095,
    "Stratos_Cutdown_15s",
    // Immediate, resolved Sep 15, 2026 9:30 AM EDT → Oct 31, 2026 11:59 PM EDT
    own(
      NY,
      { kind: "immediate", resolvedAt: "2026-09-15T13:30:00.000Z" },
      { kind: "specific", utc: "2026-11-01T03:59:00.000Z" },
    ),
  ),
  creative(
    8423,
    25095,
    "Stratos_Holiday_15s",
    // Nov 20, 2026 12:00 AM EST → Dec 31, 2026 11:59 PM EST
    own(
      NY,
      { kind: "specific", utc: "2026-11-20T05:00:00.000Z" },
      { kind: "specific", utc: "2027-01-01T04:59:00.000Z" },
    ),
  ),
  creative(
    8424,
    25095,
    "Stratos_Teaser_06s",
    // Sep 15, 2026 12:00 AM EDT → Sep 30, 2026 11:59 PM EDT (already ended)
    own(
      NY,
      { kind: "specific", utc: "2026-09-15T04:00:00.000Z" },
      { kind: "specific", utc: "2026-10-01T03:59:00.000Z" },
    ),
  ),
  // 25096 — pending line item, New York.
  creative(
    8431,
    25096,
    "Kooth_Hulu_30s",
    // Oct 8, 2026 12:00 AM EDT → Nov 29, 2026 11:59 PM EST (same window as its line item)
    own(
      NY,
      { kind: "specific", utc: "2026-10-08T04:00:00.000Z" },
      { kind: "specific", utc: "2026-11-30T04:59:00.000Z" },
    ),
  ),
  creative(
    8432,
    25096,
    "Kooth_Hulu_15s",
    // Oct 22, 2026 12:00 AM EDT → Nov 29, 2026 11:59 PM EST
    own(
      NY,
      { kind: "specific", utc: "2026-10-22T04:00:00.000Z" },
      { kind: "specific", utc: "2026-11-30T04:59:00.000Z" },
    ),
  ),
  // 25097 — Pacific line item; its creatives use Pacific time too.
  creative(
    8441,
    25097,
    "DogProbs_Disney_30s",
    // Oct 8, 2026 12:00 AM PDT → Nov 29, 2026 11:59 PM PST (same window as its line item)
    own(
      LA,
      { kind: "specific", utc: "2026-10-08T07:00:00.000Z" },
      { kind: "specific", utc: "2026-11-30T07:59:00.000Z" },
    ),
  ),
  creative(
    8442,
    25097,
    "DogProbs_Disney_Promo_15s",
    // Oct 20, 2026 9:00 AM PDT → Nov 15, 2026 11:59 PM PST
    own(
      LA,
      { kind: "specific", utc: "2026-10-20T16:00:00.000Z" },
      { kind: "specific", utc: "2026-11-16T07:59:00.000Z" },
    ),
  ),
  // 25098 — expired line item.
  creative(
    8451,
    25098,
    "DogProbs_Hulu_30s",
    // Sep 1, 2026 12:00 AM EDT → Sep 20, 2026 11:59 PM EDT (same window as its line item)
    own(
      NY,
      { kind: "specific", utc: "2026-09-01T04:00:00.000Z" },
      { kind: "specific", utc: "2026-09-21T03:59:00.000Z" },
    ),
  ),
];

/** The baseline's default page is a line item, so that stays the landing view. */
export const SEED_VIEW: View = { page: "lineItem", lineItemId: 25095 };

/** "Preset sample" mode: the seeded campaign 4074. */
export const sampleWorkspace = (): Workspace => ({
  campaigns: [SEED_CAMPAIGN],
  lineItems: SEED_LINE_ITEMS,
  creatives: SEED_CREATIVES,
  view: SEED_VIEW,
});

/** "Demo" mode: nothing yet — the reviewer starts at the advertiser. */
export const emptyDemoWorkspace = (): Workspace => ({
  campaigns: [],
  lineItems: [],
  creatives: [],
  view: { page: "advertiser" },
});
