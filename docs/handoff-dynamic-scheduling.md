# Dynamic Scheduling · Prototype Hand-off

> **Living document (built: campaign, line item, and creative schedules; timezone inheritance; weighting under scheduling).** Started **2026-09-28**. See the
> Changelog at the bottom.
> Source PRD: **WEB-1812 — Timezone-Aware Hierarchical Scheduling Engine**
> ([`../_Assets-Reference/Timezone-Scheduling PRD.pdf`](../_Assets-Reference/Timezone-Scheduling%20PRD.pdf)).
> Baseline this builds on: [`BASELINE.md`](BASELINE.md).

## Read this first

This is a **UX and functionality prototype**, not a partial implementation. There is no
backend and no real authentication. All state lives in the browser (localStorage), and the
clock can be simulated. Its job is to pin down the intended behavior and screens so the
team can scope and build the real thing. As in the baseline hand-offs, each feature will be
split into *what the prototype does* and *what production needs to own*.

**Initiative:** Q4. Stack: React + TypeScript + MUI. Runs at `localhost:5176`
(`npm run dev`).

## The ask

From the request notes, confirmed by the PRD:

1. **Start and end as a datetime** (date + time), not just a date.
2. At three levels: **campaigns, line items, and creatives**.
3. **Start "Immediate"** as a start option.
4. **End "Indefinite"** (always on) as an end option.
5. **An IANA timezone picker** covering every zone, not US-only, with US zones easy to
   reach.
6. **Running status** at each level: a visual indicator of whether it's eligible to serve
   right now.

Framing from the kickoff: a reusable **scheduling component** used at every level, and
**new pages outside the current line-item page** (the campaign level first).

## What the PRD adds (UI-relevant)

Numbers are the PRD's requirement numbers.

- **Defaults (R1, workflow §1):** Start = **Immediate**, End = **Indefinite**, Timezone =
  **`America/New_York`**, for all three levels. The user can switch back to Immediate or
  Indefinite at any time. *Refined by D29:* a new entity gets **no** start or end by default; the user sets them. *Refined by D24:* New York is the default zone for the **campaign**.
  A line item or creative defaults to its **parent's** zone, which is New York unless the
  parent was changed. **Flag to the PRD owner:** R1 reads as New York at every level, so
  this is a deliberate refinement of it.
- **Immediate (R2)** sets the effective start to the moment the object is **saved or
  activated**.
- **Indefinite (R3)** means the end is never evaluated.
- **Storage (R4):** a UTC timestamp plus the IANA zone string. The zone is for *presentation*:
  times are entered and shown in the entity's zone, and all comparisons happen in UTC.
- **Eligibility window:** `start ≤ now < end`. The **end is exclusive**: at exactly the end
  time the entity has ended.
- **Hierarchical evaluation (R8–R10, workflow §4):** Campaign → Line Item → Creative, in
  that order. A creative serves only if its campaign, its line item, *and* itself are each
  administratively Active **and** inside their own windows. The first failing level stops
  the chain.
- **Administrative status is never changed by the clock (R11).** Today's `Status: Active`
  field is the *administrative* status (Active / Inactive). An end date passing doesn't flip
  it. Serving state is **computed**, not stored.
- **Extending revives (R12, workflow §6):** move an expired end into the future and the entity
  serves again on the next request, with no reactivation step.
- **Computed runtime states in the UI (R13):** examples given are *Active*, *Pending Start*,
  *Schedule Expired*, *Parent Expired*. They are displayed without touching administrative
  status.
- **HubSpot (R5–R7, campaigns only):** a campaign created from a HubSpot push takes its
  start, end, and zone from HubSpot **once, at creation**. After that, Radius is the system of
  record and the fields are editable in Radius. Later HubSpot edits don't sync.
  **Back-end only (D31):** no UI work in this prototype.

- **Migration (R16–R17):** existing objects without dates get none added. Serving objects
  that have dates are flagged for the release but not changed.

Backend-only items (ad-server evaluation, async event streaming, warehouse isolation, R14–R15)
have no UI. The prototype only models their visible result.

## Decisions so far

| # | Decision | Source |
|---|---|---|
| D1 | **Distros have no schedule.** They live on a line item and follow its schedule. | User, 2026-09-28 |
| D2 | **Hierarchy:** Campaign → Line Items → Creatives. Each level has its **own** schedule. | User + PRD |
| D3 | **Siblings differ freely.** Line items in one campaign can have different schedules, and creatives within a line item can too. | User |
| D4 | **Creatives are associated with line items, possibly more than one.** A creative has one schedule of its own, but its *computed* state depends on which line item it's viewed under (parent context). | User ("line-item/line-items") |
| D5 | **A child outside its parent's window is not blocked.** The cascade simply won't serve it then (e.g. *Parent Expired*). Whether the UI warns is still open (Q2). | PRD cascade |
| D6 | **Defaults:** Immediate / Indefinite / `America/New_York`. *Amended by D29:* a new entity gets no dates; New York stays the campaign's default zone. | PRD R1 |
| D7 | **Administrative status and computed state are separate things**, shown separately. | PRD R11, R13 |
| D8 | **First build surface is the line-item details strip** (the Start/End Date fields at the top of the default page). The campaign section waits for your context and examples. | User |
| D9 | **The timezone is always an explicit, user-set field.** Nothing is detected automatically: no browser or user-locale detection, and no silent copying of the parent's zone. The person setting up the campaign is often in a different zone from the one it runs in, so the zone must always be visible and easy to change. **Default: `America/New_York`** (US Eastern) at every level. *Amended by D24 (2026-10-01):* children now take their default zone from their parent. The rest of D9 stands: nothing is ever taken from the browser or the user's locale. | User, 2026-09-28 + PRD R1 |
| D10 | **Out-of-sync schedules raise warnings.** When a parent/child or sibling relationship doesn't line up, the user is told so it can be fixed. Warnings are **non-blocking** (saving is always allowed), per PRD D5. Rules and surfaces are below; they may be adjusted after team feedback. | User, 2026-09-28 |
| D11 | **One schedule per creative.** Editing a creative's schedule changes it for **every** line item the creative is associated with. The editor must say so ("Applies to all 3 line items using this creative"). *Amended by D27 (2026-10-01):* a creative still has one schedule, but its Specific dates/times apply only under its **home** line item. | User, 2026-09-28 |
| D12 | **The computed "Active" state is labeled "Serving"** in the UI, to keep it apart from the administrative status value "Active". **Provisional:** the name and the state logic may change after team feedback. The hand-off doc and the Artifact must call out that "Serving" is the PRD's computed "Active". | User, 2026-09-28 |
| D13 | **Each level shows its own schedule in its own timezone.** The campaign view shows the campaign's schedule, a line item shows the line item's, and a creative shows the creative's, each in the zone it was set in. No level re-renders another level's times in its own zone. | User, 2026-09-28 |
| D14 | **Immediate resolves to a real time, but the setting stays visible.** Internally the start resolves at save, or at activation if saved Inactive (PRD R2). The display **leads with the setting**, "Immediate", with the resolved time as secondary detail ("Immediate · started Sep 28, 2:14 PM EDT"). *Amended by D22.* | User, 2026-09-28 |
| D15 | **Immediate and Indefinite count as values.** A schedule always has a start and an end, which satisfies PRD R1's "required" with no empty state. *Amended by D29:* a brand-new entity's schedule is empty ("Not set") until the user sets it; once set, it's never empty again. | User, 2026-09-28 |
| D16 | **Start can be moved** at any time, including on something already Serving. **Moving an end into the past always asks for confirmation** ("This will stop delivery immediately"). | User, 2026-09-28 |
| D17 | **Parent Pending and Parent Inactive merge into one state**, with the specific reason in the tooltip. Parent Expired stays separate. ⚠️ **Revisit flag:** this merge may need to be undone after team feedback, so keep the two causes distinguishable in the logic even though they share a label. | User, 2026-09-28 |
| D18 | **A timezone mismatch between parent and child is a real Warning, not Info.** Mismatched zones shift windows by hours, so something won't serve when expected. The message shows both schedules in both zones. **Scoped by D22:** it only fires when at least one side has a Specific date+time that the zone actually affects. | User, 2026-09-28 |
| D19 | **Displayed times always read in the entity's selected zone.** There's no app clock and no "your local time" line. A time typed into the editor means that time in the selected zone, so changing the zone keeps the typed wall-clock time ("9:00 AM" stays 9:00 AM, now in the new zone) and the stored UTC instant moves with it. | User, 2026-09-28 (confirmed) |
| D20 | **Confirm any date change that affects something currently Serving.** If moving a start or end, at any level, would stop or change delivery of anything that's Serving right now (the entity itself or anything under it), the save asks first and lists what's affected ("This stops delivery for the line item and 2 of its creatives"). This covers an end moved into the past (D16), a start moved into the future on a Serving item, and a parent edit that cuts off Serving children. Changes that only *resume* or *extend* delivery don't confirm (PRD R12: extending should be frictionless). | User, 2026-09-28 |
| D22 | **Immediate and Indefinite are modes where the timezone doesn't matter.** "Now" is the same instant everywhere, and "never ends" has no time at all. So for those bounds, the UI must make the **setting itself** obvious ("Immediate", "Indefinite") rather than a time. The timezone only carries meaning for a bound set to a **Specific** date + time. A schedule that's Immediate → Indefinite has no zone-dependent value. The zone is still stored (PRD R4, default New York) but is de-emphasized in the display (see Timezone control). | User, 2026-09-28 |
| D23 | **A Specific bound needs BOTH a date and a time.** Unless a start is Immediate or an end is Indefinite, the user must enter a date **and** a time. There is no date-only schedule and no implied default time (no silent midnight). Save stays disabled with an inline prompt ("Add a start time") until both are filled. | User, 2026-09-28 |
| D21 | **The user's computer clock and browser timezone never affect platform inputs or outputs.** Every entered or displayed time is interpreted in the entity's IANA zone only. The one thing taken from the machine is *now*, an absolute instant that's the same in every zone. Changing the computer's timezone must not change a single displayed or stored value. | User, 2026-09-28 |
| D24 | *Superseded by D32 (2026-10-14):* no live zone-following or cascade. A child's empty start/end follows the parent live instead; a child's own dates and zone never change when the parent does. **The parent's timezone is the child's default.** The campaign defaults to `America/New_York` (PRD R1). A line item defaults to its campaign's zone, and a creative defaults to its line item's zone. If the campaign is changed from New York to, say, `Australia/Sydney`, its line items and creatives follow it to Sydney, since the whole campaign is now targeted there. **A child follows its parent until a user picks a different zone on that child (an override).** An overridden child keeps its own zone when the parent changes. The user can always override any child. Amends D9 ("no silent copying of the parent's zone"), whose concern was the *browser's* zone; the parent's zone is a deliberate user choice. Rules: [Timezone inheritance (D24)](#timezone-inheritance-d24). | User, 2026-10-01 |
| D25 | *Superseded by D32:* the mismatch warning stays (D18), with the "own timezone" wording, since a child only reads in another zone when it has dates of its own. **An overridden zone that differs from its parent's raises a Warning** (confirms D18 under D24). The copy names it as a choice: "Set to its own timezone (Perth); the campaign uses Sydney." Scoped by D22: it only fires when a Specific date+time makes the zone matter. | User, 2026-10-01 |
| D26 | *Superseded by D32:* there's no zone-following to re-follow. **An override never goes back to following on its own.** It was set deliberately, so a later parent change, even to the same zone, doesn't make it follow again. Only the user picking "Same as campaign" (or "Same as line item") does. While the zones happen to match, the D25 warning is quiet. | User, 2026-10-01 |
| D29 | *Reversed by D32 (2026-10-14):* new campaigns are Immediate → Indefinite again (PRD R1); new line items / creatives follow their parent. **A brand-new campaign, line item, or creative has no schedule until the user sets one.** No Immediate / Indefinite (or any date) is pre-selected. The entity is **Not Scheduled** (a new run state, grey ring) and doesn't serve; its children read **Parent Not Serving** ("Campaign has no schedule yet"). The editor opens with empty date and time fields, Save stays disabled until both bounds are set, and Immediate / Indefinite remain available in the date dropdowns as explicit choices. A new child still pre-fills its **timezone** from its parent (D24); only dates are left unset. Out-of-sync warnings skip a pair until both sides have a schedule. Nothing opens the editor automatically after Create; the page shows "Not set" and the user clicks Edit Schedule. **Amends D6 and D15 and departs from PRD R1** (defaults Immediate / Indefinite), so **flag to the PRD owner.** Existing (sample/seeded) entities are unchanged. | User, 2026-10-01 |
| D30 | *Replaced by D32 (2026-10-14):* the Match button is removed; leaving a child's dates empty follows the parent live. **"Match parent schedule" in the child editors.** The line item editor has **Match campaign schedule**; the creative editor has **Match line item schedule**. It fills the draft with the parent's start, end, and timezone, with the zone set to follow the parent ("Same as …", D24). It's a **one-time copy**: the fields stay editable and nothing stays linked to the parent's dates. The button shows the parent's schedule on one line beside it, reads **Matches …** (disabled) while the draft already equals the parent's, and is disabled with a tooltip when the parent has no schedule yet (D29). An Immediate parent copies as Immediate, which resolves when the child is saved. | User, 2026-10-01 |
| D32 | **Empty means default, and edits don't cascade** (product-lead feedback, 2026-10-14). **(1)** A campaign's start or end left empty is **Immediate** / **Indefinite** (PRD R1; new campaigns start there). **(2)** Immediate / Indefinite never need a time; only a Specific date needs both date and time (D23). **(3)** Editing a campaign never changes its line items, and editing a line item never changes the campaign or its creatives: a child's own dates **and timezone** are never rewritten. **(4)** A line item's or creative's start or end left empty **follows the parent's** live, per bound (`inherit`), so a child can set its own start and still follow the parent's end. New line items and creatives start fully following. **(5)** Inherited bounds say so: "From campaign: …" in the editor, "From campaign" in summaries and tables ("Start & end from line item" on creative rows). In the editor the date dropdown lists **"Same as campaign"** (the default) above Immediate / Indefinite, and a picked date has a clear (×) button that goes back to following. Replaces D24–D26's zone cascade, D29, and D30. | Product lead via user, 2026-10-14 |
| D31 | **HubSpot scheduling is back-end work; the prototype adds no HubSpot UI.** Users set schedules in Radius. Engineering owns both directions: **HubSpot → Radius** (R5–R6: a HubSpot-created campaign takes its start, end, and zone once at creation; later HubSpot edits don't sync) and **Radius → HubSpot** (when a campaign is pushed to HubSpot, the back end converts the schedule — UTC + IANA zone, Immediate / Indefinite, and possibly an unset schedule under D29 — into whatever HubSpot expects). R7 (editable in Radius after creation) is already met, since every campaign's schedule is editable. The planned HubSpot-origin indicator is dropped. | User, 2026-10-07 |
| D28 | **Weights split delivery only among the creatives Serving right now.** A creative that's Pending Start, Expired, Inactive, or under a parent that isn't serving gets no share ("–"). The split is computed live, so it re-balances as creatives start and end, with no stored weights rewritten. A weight the user typed is kept until reset, including while its creative isn't Serving, and applies again when that creative is back. Split rules follow the multi-creative demo (`Line-Item-Multi-Creative`): one Serving creative = 100%, no typed weights = even split, typed weights honored with the rest shared evenly, over-100% (or all-typed under 100%) scaled to fit, whole percents totaling 100. | User, 2026-10-01 |
| D27 | **A shared creative's schedule applies under its home line item only.** The **home** is the line item the creative was first added to. The creative's zone follows the home line item (D24). Its Specific start/end dates and times apply only under the home. Under every other associated line item, the creative runs **Immediate → Indefinite**, so that line item's own window (in its own zone) controls it. Answers D24 open question 1; amends D11. ⚠️ **Revisit flag:** good for now, may be adjusted later. Rules: [Shared creatives](#shared-creatives-d4-d11-d27). | User, 2026-10-01 |

## What's built (initial pass, 2026-09-28)

Scope approved: the line-item and campaign views. **Creatives are omitted for now.** The
work covers Phases 1–3 of the plan plus a first pass of Phase 6 (the campaign page).

**Line-item view** (the default page)
- **Way back to the campaign:** the chevron button left of the line-item title (the same
  control the campaign header has). It opens a menu listing the parent campaign; picking
  it opens the campaign view. The campaign name isn't shown outright.
- **Status is a real administrative switch** (Active / Inactive via the pencil). Setting
  something Inactive while it's Serving confirms first (D20).
- **The static Start/End Date fields became a Schedule row:** Start · End · Timezone · Run
  State, with an **Edit Schedule** button. Immediate/Indefinite lead with the setting
  (D14, D22), and the timezone reads muted until a bound is Specific.
- **Out-of-sync warnings** against the campaign are spelled out under the row (D10).

**Campaign view** (new; reached from the line-item chevron menu)
- Header in the line-item style: name, **Export Campaign Details**, **Clone This Campaign**.
- **Details rebuilt from the production page's vertical list into the line-item grid:**
  Campaign ID, Status, Vertical, Line of Business, CTR, Interaction Rate, Activity Rate,
  Opportunity ID, Deal ID, Purchase Order ID, Impression Goal, Line Item Impressions Total
  (computed), and Publisher.
- The campaign's own **Schedule row**, plus a roll-up of every out-of-sync line item
  ("3 line items out of sync with this schedule").
- **Line Items table:** each name opens that line item. It shows the administrative Status,
  the **Run State** chip with a warning icon when out of sync, and Start/End in each line
  item's own zone (D13), plus Rate, Impressions Goal, Tags, and Actions.
- **Pixels:** the empty state, as in the production sample.

**Schedule editor** (one dialog for both levels)
- **Field order: Timezone first**, then Start (date + time), then End (date + time).
- **No separate mode toggle.** Each bound's Date field opens a dropdown with the no-date
  setting at the top (**Immediate** for the start, **Indefinite** for the end) above a month
  calendar. Picking a calendar day makes the bound Specific; picking the top option reverts
  it. While a bound is Immediate/Indefinite, its Time field shows "—" and is disabled.
  The calendar math ([`scheduleCalendar.ts`](../src/lib/scheduleCalendar.ts)) works on plain
  "YYYY-MM-DD" dates and uses only UTC getters, so the browser's zone never applies (D21).
- A Specific bound requires **both** date and time. Save stays disabled with a prompt until
  both are filled (D23).
- Daylight-saving checks: a spring-forward time that doesn't exist is an error; a
  fall-back time that happens twice notes that the first occurrence is used.
- The end must be after the start.
- **Timezone picker:** US zones pinned, then all ~420 IANA zones by region, each with its
  current offset. It's muted with "Applies when a specific start or end time is set" when
  nothing is Specific (D22). Changing the zone keeps the typed time (D19).
- **Live out-of-sync warnings** that never block the save.
- **The stop-delivery confirmation** lists everything Serving that the save would stop
  (D20). For a campaign that includes its line items.

**Demo clock (prototype-only):** a top-bar control ("Demo clock: …") that jumps time
±hours, days, or weeks, and a "Back to real time" option. It turns amber while simulated.
It's shown in US Eastern, labeled, so it never depends on the reviewer's computer zone.

**Seeded demo** (campaign 4074 and its 4 line items from the production sample). Around
the end of Sep 2026, the four line items show:
- Serving (Immediate → Indefinite, so it runs past the campaign's end)
- Pending Start
- Pending Start in Pacific time (timezone mismatch)
- Schedule Expired (started before the campaign)

Jump the clock +30 days and the pending two flip to Serving.

**Verified:**
- Typecheck and production build pass.
- The date math produced byte-identical output with the computer's zone set to New York,
  Tokyo, and UTC+14 (the D21 check).
- Tested in headless Chrome: navigation both ways, the editor's required-field and ordering
  rules, Immediate save → Serving, end moved into the past → confirmation → Schedule
  Expired, campaign → Inactive confirmation listing the Serving items, and the clock jump
  re-evaluating states.
- Baseline smoke test: add a distribution tag, open Transcoding Settings.

## What's built (creatives pass, 2026-10-01)

Scope approved: **creative schedules (Phase 4, without shared creatives)**, **timezone
inheritance across all three levels (Phase 2b, D24–D26)**, and **weighting under
scheduling (D28)**, with the editable weights and reset from the multi-creative demo
(`github.com/tggorton/Line-Item-Multi-Creative`). A follow-up the same day added Add
Creatives and remove, and aligned the table with the production section. Not built: the
per-creative Active switch. Shared creatives (D27) wait.

**Weighted Creatives table** (line-item page; replaces the static stub). Aligned in
function with the production section (title, subtitle "Used as fallback when no target type
provided or targeting doesn't match", columns, row selection, pagination), plus this
phase's two columns.
- Creatives are in app state, **per line item**, each with its own schedule.
- Columns: Name (with a trash icon to remove) · Creative Id · **Schedule** · **Run State** ·
  Weighting (reset + sort) · Pixel Name ("No Pixels", as in production). Status was dropped,
  since Run State replaces it and production has none. Playback Mode and the ⋯ Actions
  menu were dropped too, as production has neither.
- **Add Weighted Creatives** opens **Add Creatives**: a multi-select "Search to Select"
  over a creative library (the production picker's names plus the demo creatives), then
  **Add (n)**. A new creative starts Immediate (resolved on add) → Indefinite, in the line
  item's zone and following it (D24), with its weight in the auto split. Creatives already
  on a line item aren't offered, since shared creatives (D27) aren't built.
- **Remove** (trash icon) confirms, then removes the creative from the line item. Its share
  re-splits among the other Serving creatives.
- **Row selection:** click a row to select it. The footer reads "1 row selected" next to
  the rows-per-page pagination. Selection has no bulk action yet, matching production.
- **Weighting sort:** the arrow cycles lowest-first → highest-first → off, by applied
  share. Creatives with no share ("–") always sort last.
- **Schedule column:** the start and end ("Immediate", "Indefinite", or date · time in the
  creative's zone) and, when a bound is Specific, the zone plus its source ("New York (EDT)
  · Same as line item"). The pencil opens the shared schedule editor for that creative.
- **Run State:** evaluated campaign → line item → creative, with a warning icon when the
  creative is out of sync with its line item.
- **Weighting (D28):** Serving creatives show their applied share. With two or more Serving,
  the share is editable: typing sets a weight, clearing it returns to the auto split, and
  a scaled weight shows "set 70%" under the field. The only Serving creative is a fixed
  100%. Non-Serving creatives show "–", with a tooltip noting a kept typed weight. The
  header's reset icon clears typed weights.
- The line item's **Creative** field counts its creatives. A new coverage warning on the
  line item fires when it's Serving but none of its creatives are (D10).

**Timezone inheritance (D24–D26)**
- Every schedule carries `timeZoneSource` (`inherited` / `override`).
- Line item and creative editors list **"Same as campaign"** / **"Same as line item"**
  first in the timezone picker. Picking any other zone (even the parent's) is an override.
  The helper text says which applies.
- Saving a campaign or line item zone change **cascades** to following children, keeping
  their typed wall-clock times. Overrides stay put. The parent's editor shows the reach:
  "3 line items and 7 creatives follow this timezone and will move to it, keeping their
  typed times. 1 line item has its own timezone and won't change."
- Live warnings and the D20 stop-delivery check are computed **after** the cascade, so a
  zone change that would stop something Serving confirms first.
- Summaries show the source ("Same as campaign · America/New_York" / "Set on this line
  item"). The mismatch warning names an override as a choice (D25).
- Storage migration: a child whose zone equals its parent's becomes `inherited`, otherwise
  `override`. The seeded Pacific line item is an override, and its creatives follow it.

**Seeded creatives.** Line item 25095 has four: two Serving (a typed 60% and an auto 40%,
the baseline's split), one Pending Start (Nov 20), and one Expired. Jump the clock past Oct
31 and the Cutdown ends, so the Hero gets 100%. Past Nov 20 the Holiday creative starts and
the split becomes 60/40 Hero/Holiday. The other line items have one or two creatives each.

**Verified (headless Chrome):**
- Weights: 60/40 today, a typed 30% gives 30/70, and the clock jump re-balances.
- The creative editor offers "Same as line item".
- Campaign → Sydney cascades to 3 line items and 7 creatives with their wall-clock times
  kept. The Pacific override and its creatives stay put.
- A creative override (Chicago) survives a line item zone change, and the reach text
  counts it.
- Typecheck passes.

## What's built (fresh campaign flow, 2026-10-01)

The prototype can now start from nothing and build the whole hierarchy, following the
production flow (`_Assets-Reference/Campaing-Line-Item_Reference/`): advertiser → **Add New
Campaign** → campaign page → **Add New Line Item** → line item page → **Add Weighted
Creatives**. Forms follow production's fields. Pages and dialogs use this prototype's
formatting (the details grid, pink dialog titles), the style proposed for production's top
sections.

- **Preset sample / Demo toggle** (prototype-only, top bar, next to User/Admin):
  - **Preset sample** is the seeded campaign 4074, as before.
  - **Demo** starts empty at the advertiser.
  - Each mode keeps its own workspace (campaigns, line items, creatives, current page), so
    switching never loses work.
  - In Demo, a restart icon (with a confirmation) empties the demo workspace back to the
    advertiser.
- **Advertiser page** (Kerv): details in the grid (Agency ID, Advertiser Url, Vertical,
  Disable Powered-By, Brand Logo), then a **Campaigns** table: name (opens it), ID, Status,
  **Run State** with a warning icon for out-of-sync line items, Impressions Goal, Start/End
  in the campaign's zone, Line Items count. Empty state: "No campaigns yet."
- **Create Campaign:** Name, Vertical (the 8 in the reference: Alcohol … Crime), Line of
  Business (Platform Solutions, Publisher Solutions, Managed Media). All three required.
  Saving opens the campaign. It's Active, in New York, with **no schedule** ("Not set",
  Run State **Not Scheduled**) until the user sets one (D29). Unset fields read like production ("- -", "No Deal
  ID", …).
- **Create Line Item** (the campaign's Add New Line Item): Line Item Name, Media Type
  (banner, video), Rate Type (CPC, CPE, CPM, Flat Fee). All required. Saving opens the line
  item. It's Active, **unscheduled** (D29), with its zone **following the campaign's** (D24). Rate
  "$0 CPM", goal unset, Type = media type.
- **Navigation:** the campaign header's chevron (a dead control until now) opens a menu
  with the advertiser, the same pattern as the line item's chevron → campaign (shared
  `ParentMenuButton`).
- **Model:** `campaigns[]` replaces the single `campaign`. The campaign view carries a
  `campaignId`, and an `advertiser` view was added. Storage migration: an older single
  campaign save becomes the sample workspace, and the demo workspace starts empty.

**Verified (headless Chrome):** the sample still lands on line item 25095. In Demo:
advertiser (empty) → Create Campaign → campaign page (Serving, Immediate → Indefinite) →
Create Line Item → line item page ("Same as campaign") → add 2 creatives (50/50) →
chevrons back up to the campaign and advertiser (1 line item counted). Switching to the
sample and back keeps both, it survives a reload, and an older single-campaign save
migrates. Typecheck passes.

## Implementation map

| Piece | Where |
|---|---|
| Types: `AdminStatus`, `Schedule` (`ScheduleStart` / `ScheduleEnd`, `timeZoneSource`), `TimeZoneSource`, `RunningState`, `RunningEvaluation`, `Campaign`, `LineItem`, `Creative`, `View`; `AppState.campaign / lineItems / creatives / view / clockOffsetMs` | [`../src/types.ts`](../src/types.ts) |
| Timezone inheritance: `retimeToZone`, `cascadeCampaignZone`, `cascadeLineItemZone`, `zoneChangeReach`, `zoneSourceLabel`, `withZoneSource` (migration) | [`../src/lib/scheduleInheritance.ts`](../src/lib/scheduleInheritance.ts) |
| Weighting among Serving creatives (`weightShares`) | [`../src/lib/scheduleWeights.ts`](../src/lib/scheduleWeights.ts) |
| Wall-clock ⇄ UTC through an explicit zone, DST handling, display formatting, `evaluateRunning` (PRD cascade), `resolveImmediate` | [`../src/lib/schedule.ts`](../src/lib/schedule.ts) |
| IANA catalog, pinned US group, offsets/abbreviations | [`../src/lib/timezones.ts`](../src/lib/timezones.ts) |
| Out-of-sync rules | [`../src/lib/scheduleWarnings.ts`](../src/lib/scheduleWarnings.ts) |
| Campaign → line item → creative wiring, roll-ups, coverage warning, D20 impact (`campaignImpact`, `lineItemImpact`, `creativeImpact`, all zone-cascade aware) | [`../src/lib/hierarchy.ts`](../src/lib/hierarchy.ts) |
| Run-state labels/colors/tooltips | [`../src/lib/runningStatus.ts`](../src/lib/runningStatus.ts) |
| Seed campaign, line items, creatives | [`../src/state/seedScheduling.ts`](../src/state/seedScheduling.ts) |
| Reducer actions `setView`, `setClockOffset`, `setCampaignSchedule/Status`, `setLineItemSchedule/Status` (both cascade zones), `setCreativeSchedule`, `setCreativeWeight`, `resetCreativeWeights`, `addCreatives`, `removeCreative`; `now` (ticks every 15 s, offset applied); storage migration | [`../src/state/AppContext.tsx`](../src/state/AppContext.tsx) |
| Page switch (no router) | [`CurrentPage`](../src/components/CurrentPage.tsx) → [`AdvertiserPage`](../src/components/AdvertiserPage.tsx) / [`CampaignPage`](../src/components/CampaignPage.tsx) / [`LineItemPage`](../src/components/LineItemPage.tsx) |
| Schedule UI | [`ScheduleEditorDialog`](../src/components/ScheduleEditorDialog.tsx), [`ScheduleDateField`](../src/components/ScheduleDateField.tsx) (date dropdown with Immediate/Indefinite + calendar), [`ScheduleSummary`](../src/components/ScheduleSummary.tsx), [`TimeZonePicker`](../src/components/TimeZonePicker.tsx), [`RunningStateChip`](../src/components/RunningStateChip.tsx), [`ScheduleWarningIcon`](../src/components/ScheduleWarningIcon.tsx), [`ScheduleWarningList`](../src/components/ScheduleWarningList.tsx), [`AdminStatusField`](../src/components/AdminStatusField.tsx) |
| Pages' parts | [`LineItemHeader`](../src/components/LineItemHeader.tsx) (chevron → campaign menu), [`LineItemDetails`](../src/components/LineItemDetails.tsx) (replaces the static stub), [`CampaignHeader`](../src/components/CampaignHeader.tsx), [`CampaignDetails`](../src/components/CampaignDetails.tsx), [`CampaignLineItemsTable`](../src/components/CampaignLineItemsTable.tsx), [`CampaignPixelsStub`](../src/components/CampaignPixelsStub.tsx), [`DetailsGrid`](../src/components/DetailsGrid.tsx), [`CreativesSection`](../src/components/CreativesSection.tsx) (replaces `CreativesStub`), [`CreativeWeightField`](../src/components/CreativeWeightField.tsx), [`AddCreativesDialog`](../src/components/AddCreativesDialog.tsx) |
| New campaign / line item builders, form option lists, the advertiser constant, `nextId`, `formatGoal` | [`../src/lib/newEntities.ts`](../src/lib/newEntities.ts) |
| Advertiser page, create forms, parent chevron menu, Preset sample / Demo toggle | [`AdvertiserPage`](../src/components/AdvertiserPage.tsx), [`CreateCampaignDialog`](../src/components/CreateCampaignDialog.tsx), [`CreateLineItemDialog`](../src/components/CreateLineItemDialog.tsx), [`FormPicker`](../src/components/FormPicker.tsx), [`ParentMenuButton`](../src/components/ParentMenuButton.tsx), [`PageTopBar`](../src/components/PageTopBar.tsx) |
| Creative library (mock catalog for Add Creatives) | [`../src/lib/creativeLibrary.ts`](../src/lib/creativeLibrary.ts) |
| Demo clock | [`SimulatedClockControl`](../src/components/SimulatedClockControl.tsx) (in `PageTopBar`) |

**Backend swap points:**
1. `evaluateRunning` mirrors the ad server's check (PRD workflow §4). In production the
   server is authoritative and the UI either displays its computed state or runs the same
   rule.
2. `resolveImmediate` sets the start at save or activation. The server should stamp this.
3. Storage is UTC plus the IANA string, already in the PRD's R4 shape.
4. The demo clock and `clockOffsetMs` go away.

## Known limitations of this pass

- **Creatives:** no per-creative Active switch (every creative is Active), no shared
  creatives (D27), and row selection has no bulk action. The creative library is a fixed
  mock list ([`creativeLibrary.ts`](../src/lib/creativeLibrary.ts)). Pixel Name is static.
- **One advertiser** (Kerv) for both modes; its fields aren't editable. Campaign/line-item
  ids continue above both workspaces (so the first demo campaign is 4075, not production's
  range). The Create forms' Vertical list is the reference screenshot's 8 entries only.
- **Distributions, Transcoding, and Push are shared demo data across line items** (and
  across both modes). The
  baseline had one line item, so every line item page shows the same distros. The **Tags**
  column is static (`1`, as in the sample).
- **Only the Status field is editable** in the details grids. The other pencils are
  decorative, as in the baseline.
- **The warnings roll-up** (top-bar bell, Phase 5) isn't built. Warnings show inline, on
  rows, and as the campaign summary.
- Zone abbreviations come from the browser's `Intl` data for `en-US`, so some zones read
  as offsets ("GMT+11" for Sydney) rather than letters ("AEDT").
- Run-state colors are a first pass (Serving green, Pending Start blue ring, Expired grey,
  Inactive grey ring, Parent states amber).

## Starting point in the baseline (before the initial pass)

| Surface | Today | Becomes |
|---|---|---|
| Line item details strip ([`CampaignDetailsStub`](../src/components/CampaignDetailsStub.tsx)) | Static `Status: Active`, `Start Date: 3/1/2025`, `End Date: 5/31/2025` (date only, no zone, decorative icons) | The line item's schedule (start / end / zone) + editor, administrative status, and a computed-state chip. **First build target.** |
| Creatives table (`CreativesStub`, now removed) | Two hardcoded rows, static `Active` chip, not in app state | Creatives in state, each with an administrative status, its own schedule, and a computed-state chip evaluated under *this* line item |
| Campaign | Nothing. One line-item screen with no router; the breadcrumb in [`LineItemHeader`](../src/components/LineItemHeader.tsx) is decorative | A seeded campaign entity (schedule + status) first, so line items and creatives can show *Parent* states. The campaign page itself comes later, once there are examples to design from. |
| Distros | Transcode + Platform statuses | No change (D1) |

## Proposed model (draft, for review)

**Schedule** (the same shape at every level):

```ts
interface Schedule {
  start: { kind: "immediate"; resolvedAt?: string /* UTC ISO, set on save/activation; shown once set (D14) */ }
       | { kind: "at"; utc: string };
  end:   { kind: "indefinite" } | { kind: "at"; utc: string };
  timeZone: string; // IANA, default "America/New_York"
}
```

Each bound has two modes: **start = Immediate | Specific**, **end = Indefinite | Specific**.
A Specific bound needs both a date and a time (D23). The user types a wall-clock time in the
entity's zone, and it's converted to UTC on save.
There is no empty state: Immediate and Indefinite are values (D15). A legacy entity with
no dates (R16) is treated as Immediate / Indefinite.

**Computed state:** evaluated top-down, the first failing check wins.

| Order | Check | Computed state (draft label) |
|---|---|---|
| 1 | A parent is administratively Inactive, **or** a parent's start hasn't arrived | **Parent Not Serving** (merged, D17). The tooltip names the cause: "Campaign is Inactive" or "Campaign starts Oct 5, 9:00 AM BST" |
| 2 | A parent's end has passed | Parent Expired |
| 3 | Own administrative status is Inactive | Inactive |
| 4 | `now < start` | Pending Start |
| 5 | `now ≥ end` | Schedule Expired |
| 6 | otherwise | **Serving** (the PRD's computed "Active", D12) |

Rendered with the shared `StatusChip` (dot + label) as a **third status lifecycle**, with its
own `*_META` table in `src/lib/`. Colors and ring/solid choices come later. Labels stay
visible because several states will share hues.

*D21 implementation note (important for the build):* JavaScript silently falls back to the
browser's zone in several places, so they're banned for schedule values:
`new Date("2026-10-01T09:00")` (parsed as browser-local), `Date#getHours()` and similar
getters, `toLocaleString()` without a `timeZone` option, and the native
`<input type="datetime-local">` as a source of truth. All conversion and formatting goes
through `schedule.ts` helpers that take the IANA zone explicitly. **QA check:** switch the
computer's timezone and reload; nothing on screen should change.

*D17 implementation note:* the evaluator returns the specific cause (`parentInactive` or
`parentPending`) and only the *display* maps both to "Parent Not Serving". Splitting them
again later is then a label change, not a logic change.


**Pure logic** (no React), in new modules: `src/lib/schedule.ts` (local ↔ UTC conversion,
evaluation, formatting), `src/lib/scheduleWarnings.ts` (the out-of-sync rules below), and
`src/lib/timezones.ts` (the zone catalog). The browser's `Intl` API covers all of it, with no
new dependency: `Intl.supportedValuesOf("timeZone")` gives the full IANA list, and
`Intl.DateTimeFormat` handles offsets and DST.

**Prototype-only: simulated clock.** A top-bar "Now" control (next to the role toggle) that
can jump time forward and back. A reviewer can watch states go Pending Start → Serving →
Schedule Expired, then back to Serving after an extension, without waiting. It's the same
kind of stand-in as the baseline's "Set status" menu blocks, and it goes away in production.

## Timezone control (draft, D9, D24)

- **Always visible, always explicit.** The Timezone field is the first field in every
  schedule editor and sits next to Start and End in every summary. A campaign's is
  pre-filled with `America/New_York`. A line item's or creative's is pre-filled from its
  parent and follows it until overridden (D24). Nothing ever applies a zone from the
  browser or the user's locale.
- **Easy to change:** a searchable dropdown.
  - **Pinned "US" group** at the top: Eastern (New York), Central (Chicago), Mountain
    (Denver), Arizona (Phoenix, no DST), Pacific (Los Angeles), Alaska (Anchorage), Hawaii
    (Honolulu).
  - **Then every IANA zone**, grouped by region (Americas, Europe, Asia, …).
  - Each option shows the city, a friendly name, and its **current** UTC offset and
    abbreviation, e.g. "New York — Eastern · UTC−04:00 (EDT)". Search matches city, zone
    id, abbreviation, or offset.
- **The entity's zone is the only one shown.** Every printed time (editor, summary, chip
  tooltips) reads in the entity's selected zone, with its abbreviation ("9:00 AM EDT"). No
  "your local time" reference (D19).
- **Changing the zone keeps the typed wall-clock time and moves the instant** (D19).
  "9:00 AM" stays 9:00 AM, now in the new zone.
- **The zone matters only for Specific bounds (D22).** When both bounds are Immediate /
  Indefinite, the summary reads "Immediate → Indefinite" with no times, and the zone is
  shown muted (e.g. "Timezone: America/New_York, applies when specific times are set").
  It's still editable. Once either bound is set to Specific, the zone is shown at full
  weight next to that date + time.
- **Each level shows its own zone** (D13). Cross-level comparisons live in warning messages
  (see D18), not in the schedule displays.
- **DST edge cases:** a time that doesn't exist on a spring-forward date is flagged in the
  input. A time that occurs twice on a fall-back date resolves to the first occurrence,
  with a note.

## Timezone inheritance (D24)

**The rule.** The campaign's zone defaults to New York. A child's zone defaults to its
parent's, and **keeps following the parent until someone overrides it**:

| Level | Default zone | Follows |
|---|---|---|
| Campaign | `America/New_York` (PRD R1). A HubSpot-created campaign takes HubSpot's zone (R5). | Nothing (top of the hierarchy) |
| Line item | The campaign's zone | The campaign, until overridden |
| Creative | Its **home** line item's zone (D27) | Its home line item, until overridden |

**Example.** A user sets up a campaign and changes its zone from New York to
`Australia/Sydney`. Every line item and creative that hasn't been overridden now reads
Sydney, because the whole campaign is targeted for Australia. If one line item needs to
run on Perth time, the user picks `Australia/Perth` on that line item. It's then an
override, and it stays Perth even if the campaign's zone changes again later.

**Behavior details:**

- **Two zone states per child.** *Following* ("Same as campaign · Sydney") or *Overridden*
  (an explicitly picked zone). Picking any zone in a child's picker makes it an override,
  even if it happens to equal the parent's.
- **Back to following.** The child's picker offers "Same as campaign (Sydney)" (or "Same as
  line item") as its first option. Picking it clears the override.
- **The cascade is transitive.** Campaign → line item → creative. A creative following a
  line item that follows the campaign moves when the campaign moves. A creative following
  an *overridden* line item follows that line item's zone, not the campaign's.
- **Specific times keep their wall-clock reading (D19).** When a following child's zone
  changes because its parent's did, its Specific dates and times keep the typed reading
  ("9:00 AM" stays 9:00 AM, now Sydney time), so the stored UTC instants move. This is
  intended: the schedule is now meant for the new market. Immediate/Indefinite bounds
  aren't affected (D22).
- **The parent's save says what moves.** Changing a parent's zone lists the reach in the
  editor: "2 line items and 5 creatives follow this zone and will move to Sydney time.
  1 line item has its own zone and won't change." If that shift stops or changes delivery
  of anything currently Serving, the D20 confirmation applies and lists it.
- **Always visible (D9 still holds).** The child's zone is never hidden. Summaries show
  the zone plus its source: "Sydney (AEST) · same as campaign" vs "Perth (AWST) · set on
  this line item".
- **The browser is still never consulted (D21).** Inheritance only ever reads the
  parent's stored zone.
- **Mismatch warning (D18, D25) only applies to overrides.** A following child can't
  differ from its parent, so the timezone-mismatch warning only fires for an overridden
  child whose zone differs from its parent's.
- **Overrides stay overrides (D26).** A parent change never pulls an overridden child back
  into following, even if the parent moves to the child's zone. Only "Same as campaign"
  does.
- **Shared creatives (resolved by D27, see *Shared creatives*).** Delivery is unaffected: the cascade runs per
  association in UTC, so a creative serves under each line item against that line item's
  own window, whatever that line item's zone is. But the creative has one schedule (D11)
  in one zone, so (a) a Specific creative time is a single instant everywhere ("9:00 AM New
  York" is about midnight in Sydney), and (b) it needs one parent to inherit its default
  zone from. Guidance for shared-across-markets creatives: keep the creative Immediate →
  Indefinite and let each line item's schedule do the local timing (D22, so no zone
  applies). Per-market creative times mean duplicating the creative.

**Model.** The stored zone stays a concrete IANA string at every level, so the backend
always has an explicit zone (R4). A flag records where it came from:

```ts
interface Schedule {
  // ...start, end as before
  timeZone: string;                          // always the effective IANA zone
  timeZoneSource: "inherited" | "override";  // D24; campaigns are always "override"
}
```

A parent zone change rewrites `timeZone` on every `inherited` descendant, re-deriving their
Specific UTC instants from the kept wall-clock readings. **Migration:** existing children
whose zone equals their parent's become `inherited`; any other zone becomes `override`.

**Prototype status:** logged and planned, **not built yet** (see the Build plan). The
current prototype still stores a plain zone per entity, and the seeded Pacific line item
would become an override.

## Schedule warnings — out-of-sync relationships (draft, D10)

Warnings are **computed** like the running state: they're never stored, and they're
**non-blocking**. They exist so a mismatch is caught and fixed quickly, not discovered when
something doesn't serve. The rule set and severities below are a first pass, open to
adjustment after team feedback.

**Parent / child** (campaign ↔ line item, line item ↔ creative):

| Rule | Example message | Severity |
|---|---|---|
| Child starts before its parent | "Starts Oct 1, before the campaign starts (Oct 5). It won't serve until Oct 5." | Warning |
| Child ends after its parent, or is Indefinite under a parent with an end | "Runs past the line item's end (Dec 31). It stops serving then." | Warning |
| Child's window doesn't overlap its parent's at all | "Never serves: its whole schedule falls outside the campaign's." | High |
| Child's timezone differs from its parent's (only possible for an **overridden** child, D24) | "Line item runs in New York time; the campaign runs in London time. Line item starts 9:00 AM EDT (2:00 PM BST); campaign starts 9:00 AM BST (4:00 AM EDT)." | **Warning** (D18) |

**Siblings / coverage** (the children as a group):

| Rule | Example message | Severity |
|---|---|---|
| Gap in creative coverage: part of the line item's window has no creative scheduled | "No creative is scheduled Nov 10–Nov 14. The line item is serving but has nothing to serve." | Warning |
| Nothing serving right now: the parent is Serving but every child is Pending, Expired, or Inactive | "Line item is serving, but none of its 3 creatives are." | High |
| *(Later, with campaign)* Gaps where no line item covers the campaign's window | — | Warning |

**Where warnings show up:**

1. **Inline in the schedule editor**, live while editing (before save), under the field
   that causes them.
2. **On the row or field itself**: a warning icon next to the running-state chip, with the
   message in a tooltip and a *Fix* action that opens the editor.
3. **A roll-up:** a count on the line-item details strip ("2 schedule warnings"). The
   top-bar bell (currently a dead icon in `PageTopBar`) lists every warning with a link to
   each item.
4. **When a parent edit creates child conflicts**, the save shows a summary ("This change
   puts 2 creatives outside the line item's schedule"). It doesn't stop the save. An
   optional quick fix could be *Align to parent*.

**Confirmations (these do block until answered), D20:** any start or end change, at any
level, that would stop or alter delivery of something currently Serving: the item itself or
its children. The dialog lists every affected item. This is where item 4 above becomes a
confirmation rather than a notice. It uses the baseline's `useConfirm` pattern. Changes that
only resume or extend delivery save without a prompt.

Warning styling must stay visually distinct from the three status lifecycles (it's an alert
about configuration, not a state). Exact treatment comes during build.

## Shared creatives (D4, D11, D27)

A creative has one schedule and one administrative status. Its **computed state is per
association**: the same creative can be Serving under one line item and Parent Expired
under another.

**Home line item (D27).** The line item a creative was first added to is its **home**.

| | Under the home line item | Under any other associated line item |
|---|---|---|
| Timezone | Follows the home line item until overridden (D24) | Not applicable (no Specific bounds, D22) |
| Start / End | The creative's own schedule (Immediate or a Specific date+time; Indefinite or a Specific date+time) | **Immediate → Indefinite**: the creative is gated only by this line item's window and the hierarchy |
| Admin status | Shared | Shared |

Why: delivery already runs per association in UTC, so each line item's own schedule is
what localizes delivery for its market. A creative's Specific time is a single instant, and
applying it under line items in other markets would put it at the wrong local hour.

**Details (logged with D27, to confirm during the Phase 4 build):**

- **Editing.** The schedule can be opened from any associated line item, and it always
  edits the home schedule. The editor says so: "These dates apply under *Line Item A* (home).
  Under the 2 other line items, this creative runs Immediate → Indefinite." This replaces
  D11's "Applies to all 3 line items" notice.
- **Display.** Under a non-home line item, the creatives table reads "Immediate →
  Indefinite · follows this line item", with the home named in a tooltip.
- **Run state.** Under a non-home line item, the creative's own window never causes
  Pending Start or Schedule Expired. Only its admin status and its parents can stop it.
- **Warnings.** The zone-mismatch warning (D25) only applies under the home. Under other
  line items, the zone doesn't matter (D22). Coverage warnings use whichever schedule
  applies under each line item.
- **Removing the home association.** The earliest remaining association becomes the new
  home. A following zone then follows the new home.
- ⚠️ **Revisit flag:** the user accepted this "for now" and expects to come back to it.
  Keep the home concept isolated so it can change without touching the evaluator's shape.

## Build plan (phased — nothing starts until approved)

| Phase | Scope | Depends on |
|---|---|---|
| **0 — Plan** ✅ | PRD synthesis, decisions, open questions, doc structure | — |
| **1 — Domain + clock** ✅ | `Schedule` type; `schedule.ts`, `timezones.ts`, and `scheduleWarnings.ts`; computed-state + warning evaluation; a seeded campaign (stand-in, no page), line item, and creatives (with line-item associations) in state, with a storage migration; simulated clock | — (ready once approved) |
| **2 — Schedule control** ✅ | The reusable component: Start (Immediate ⇄ Specific date **and** time), End (Indefinite ⇄ Specific date **and** time), the explicit timezone picker (muted when no Specific bounds, D22), validation (both date and time required for Specific per D23, end after start, DST), inline warnings, and a read-only summary that leads with the mode | Phase 1 |
| **3 — Line item details** ✅ | Replace the static Start/End/Status fields with the schedule summary + editor, administrative status, the Serving/… chip, and parent warnings against the stand-in campaign | Phase 2 |
| **4 — Creatives** ✅ *(shared creatives / D27 still to do)* | Per-creative schedule + administrative status + chip evaluated under this line item; home line item (D27): schedule applies at home, Immediate → Indefinite elsewhere, with the home notice in the editor; sibling coverage warnings; zone inherited from the home line item (D24) | Phase 3 |
| **5 — Warnings roll-up** | Details-strip count, the top-bar bell list with jump links, the Serving-impact confirmation (D20) across levels | Phases 3–4 |
| **6 — Campaign** 🟡 first pass | Campaign page/section and navigation; ~~HubSpot-origin indicator (R5–R7)~~ (back-end only, D31); campaign-level coverage warnings | Your context + examples |
| **2b — Timezone inheritance (D24)** ✅ | `timeZoneSource` on `Schedule` + storage migration; "Same as campaign / line item" option at the top of the child picker; the cascade on a parent zone change (rewrite inherited descendants, keep wall-clock times); the reach summary in the parent editor; D20 confirmation for shifts that stop Serving items; the zone-source line in summaries; D18 limited to overrides | Phases 2–3, 6 (campaign + line item now; creatives with Phase 4) |
| **7 — Hand-off** | This doc completed, a visual Artifact, and Obsidian notes. The Artifact must call out *Serving* = the PRD's computed *Active* (D12) **and explain timezone inheritance (D24–D26) and the home line item rule for shared creatives (D27)**: the campaign defaults to New York, children follow their parent until overridden, with the Australia example | Ongoing each phase |

## Open questions

Raised by D24 (timezone inheritance), each with a proposed answer to confirm:

1. ~~Which parent does a shared creative follow?~~ **Resolved → D27:** its home line item
   (the first one it was added to). Its Specific dates/times apply only there; elsewhere it
   runs Immediate → Indefinite. ⚠️ Revisit flag. The original analysis follows.
   *(Was open.)* A creative can be associated
   with several line items (D4) but has one schedule (D11). The user confirmed it should
   deliver under each line item independently, whatever their zones, and it does: the
   cascade runs per association in UTC (see *Timezone inheritance*). What's left is where
   its **default zone** comes from. *Proposed:* the line item it was first added under; if
   that association is removed, it falls back to the campaign's zone. Under its other line
   items, the D25 mismatch warning fires only when the creative has a Specific time.
2. ~~Is a deliberate override still a full Warning?~~ **Resolved → D25:** yes.
3. ~~Does an override re-follow if the parent moves to its zone?~~ **Resolved → D26:** no;
   an override only follows again when the user picks "Same as campaign".

Known candidates for revisiting after team feedback: D12 (the "Serving" label and state
logic) and D17 (the merged parent state).

## Changelog

- **2026-10-14**: **UX consistency sweep.**
  - Every table now uses one shared **Schedule** column (`ScheduleCell`): start,
    "→ end", then a caption with the zone when a specific time is in play and which
    bounds come from the parent. Its pencil opens that row's editor. This applies to
    Advertiser → Campaigns, Campaign → Line Items (replacing separate Start / End
    columns), and Line Item → Weighted Creatives.
  - Column order is **Schedule → Run State** everywhere, matching the details panel.
  - The Campaigns table gained the edit pencil, which opens the Campaign Schedule editor.
  - The "From campaign" caption has one plain style (no italics).
  - Save messages read "Schedule saved for {name}" everywhere.
  - Empty states read "No X yet. Click Y …".

- **2026-10-14**: Campaign view → **Line Items** table: an edit-schedule pencil beside each
  row's End opens the same Line Item Schedule editor as the line-item page (same
  warnings, D20 confirmation, and "Same as campaign" choices). The row updates in place.

- **2026-10-14**: Product-lead feedback → **D32**: empty campaign bounds = Immediate /
  Indefinite; empty child bounds follow the parent live (per bound, "From campaign"); no
  cascades (a parent edit never rewrites a child, timezone included); Match button removed;
  no time needed for Immediate / Indefinite. Model: `inherit` bounds replace D29's `unset`,
  `timeZoneSource` removed, `effectiveSchedule` resolves inheritance for display and
  evaluation, and a storage migration converts old saves. D24–D26, D29, and D30 are
  marked superseded. Sample creatives 8431 / 8441 / 8451 now follow their line items.

- **2026-10-07**: Added **D31**: HubSpot scheduling (R5–R7, and pushes to HubSpot) is
  back-end only; no prototype UI. The HubSpot-origin indicator is dropped from Phase 6
  and the known limitations.

- **2026-10-01**: Prototype top bar: dividers between Demo clock | Preset sample / Demo (+
  restart) | role. The baseline's **User / Admin toggle is hidden** for this prototype
  (`SHOW_ROLE_TOGGLE`); the role is pinned to User.

- **2026-10-01**: Added **D30**: Match campaign / line item schedule in the child schedule
  editors (one-time fill of start, end, and the following timezone).

- **2026-10-01**: Added **D29**: new campaigns, line items, and creatives start with **no
  schedule** (new `unset` bounds, a **Not Scheduled** run state, parents' "has no schedule
  yet" cause); the editor opens empty and requires both bounds. Amends D6/D15; departs
  from PRD R1, so it's flagged. Create-dialog copy updated.

- **2026-10-01**: **Fresh campaign flow.** Preset sample / Demo toggle with separate
  workspaces and a demo restart; Advertiser page with a Campaigns table; Create Campaign
  (Name, Vertical, Line of Business) and Create Line Item (Name, Media Type, Rate Type)
  dialogs; the campaign chevron → advertiser menu. `campaigns[]` + `campaignId` views,
  with a migration. Added *What's built (fresh campaign flow)*.

- **2026-10-01**: Creatives section aligned with production: **Weighted Creatives** title
  and subtitle, **Add Weighted Creatives** → **Add Creatives** (multi-select library
  search), trash-icon remove with confirmation, Pixel Name column, row selection with
  count, pagination, and weight sort. Status, Playback Mode, and Actions columns removed
  (Run State replaces Status). `Creative.playbackMode` dropped from the model.
  `SectionHeader` gained an optional subtitle.

- **2026-10-01**: **Creatives pass built.** Creative schedules with a Schedule and Run
  State column and the shared editor; timezone inheritance across all levels (Phase 2b,
  D24–D26: zone source, "Same as …" option, cascade, reach text, cascade-aware warnings
  and D20, migration); **D28** weighting among Serving creatives, with editable weights +
  reset from the multi-creative demo; line-item coverage warning; seeded creatives. Added
  *What's built (creatives pass)*; updated the implementation map, limitations, and plan.

- **2026-10-01**: Open question 1 resolved as **D27** (amends D11). A shared creative's
  home is the line item it was first added to. Its zone follows the home, its Specific
  dates/times apply only there, and under other line items it runs Immediate → Indefinite.
  Shared creatives section rewritten with the home table and details. Phase 4 and the
  Phase 7 Artifact requirement updated. Revisit flag. No open questions remain.

- **2026-10-01**: The user answered the D24 questions. Q2 → **D25** (a differing override
  warns). Q3 → **D26** (an override never re-follows on its own). Q1 stays open with
  analysis: a shared creative delivers per line item regardless of zone, but its one
  schedule can't express "9 AM in each market", and it needs one parent for its default
  zone. Guidance and proposed answer added.

- **2026-10-01**: Added **D24, timezone inheritance**. The campaign defaults to New York.
  Line items and creatives default to their parent's zone and follow it until overridden.
  Amends D9. Added the *Timezone inheritance (D24)* section (rules, the Australia example,
  model flag, migration), Phase 2b in the plan, a Phase 7 Artifact requirement, a D18 scope
  note, a PRD-refinement flag on R1, and three open questions. Not built yet.

- **2026-10-01**: Schedule editor simplified. The Immediate/Specific and Indefinite/Specific
  toggles are gone: Immediate and Indefinite are now the top option in each Date field's
  dropdown, above a calendar. Timezone moved to the top of the dialog as the first field.
  New `ScheduleDateField` component and `src/lib/scheduleCalendar.ts`.

- **2026-09-30**: The line-item breadcrumb (back arrow + campaign name) is replaced by the
  campaign header's chevron button. It opens a menu listing the parent campaign, and
  choosing it navigates there, so the campaign name is no longer exposed in the title row.

- **2026-09-28**: **Initial build pass.** Line-item view (breadcrumb back to the campaign, a
  real Status switch, the Schedule row replacing the static dates, warnings) and a new
  campaign view (details rebuilt into the grid format from the production sample's
  vertical list, Schedule row with the out-of-sync roll-up, Line Items table linking into
  each line item, empty Pixels). Added the shared schedule editor, the timezone picker, the
  run-state chip, and the demo clock. Creatives deferred. Added *What's built*, the
  *Implementation map*, and *Known limitations*. Plan statuses updated.

- **2026-09-28**: Added D22 (Immediate/Indefinite are modes where the zone doesn't matter;
  the UI surfaces the setting, not a time, and mutes the zone when no bound is Specific) and
  D23 (a Specific bound needs both a date and a time; no date-only schedules and no implied
  time). Amended D14 (the display leads with "Immediate", with the resolved time secondary)
  and scoped D18 (the zone-mismatch warning only fires when a Specific time is involved).

- **2026-09-28**: Planning complete. Confirmed the "Parent Not Serving" label and the D19
  zone-change behavior. Added D20 (confirm any date change that affects something currently
  Serving, listing the affected items; resume/extend doesn't confirm) and D21 (the computer
  clock and browser timezone never affect platform values; only *now* comes from the
  machine), plus an implementation note banning browser-local date APIs and a QA check.
  Open questions cleared.

- **2026-09-28**: Planning pass 3. Resolved the open questions as D13 (each level shows its
  own schedule and zone), D14 (Immediate resolves to a real time), D15 (Immediate and
  Indefinite count as values), D16 (start is movable; an end moved into the past always
  confirms), D17 (Parent Pending and Parent Inactive merge into **Parent Not Serving**,
  flagged for possible reversal), D18 (timezone mismatch raised to Warning), and D19 (times
  read in the entity's zone; a zone change keeps the typed wall-clock time; the "your local
  time" reference was dropped). The computed-state table is now six rows. Added a
  confirmations note. Three minor open items remain.

- **2026-09-28**: Planning pass 2. Added decisions D9 (the timezone is always explicit and
  user-set, never auto-applied; default `America/New_York`), D10 (non-blocking out-of-sync
  warnings), D11 (one schedule per creative across all its line items), and D12 (the computed
  "Active" state is labeled **Serving**, provisionally). Added the Timezone control, Schedule
  warnings, and Shared creatives sections. Added a warnings roll-up phase to the plan
  (campaign → 6, hand-off → 7). Resolved the old questions on inheritance, warnings, shared
  creatives, and naming; open questions are now 1–7.
- **2026-09-28**: Planning pass. Added the PRD (WEB-1812) synthesis, decisions D1–D8 (distros
  have no schedule; hierarchy and sibling independence; creatives may belong to several
  line items; first surface is the line-item details strip), a draft data model, the
  computed-state order, the simulated clock, a phased build plan, and revised open
  questions.
- **2026-09-28**: Doc created at project setup.
