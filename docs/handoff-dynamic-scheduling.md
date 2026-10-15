# Dynamic Scheduling · Prototype Hand-off

> **Status (2026-10-15): UX built and reviewed with the product lead; feedback applied
> (D32).** Repo: `github.com/tggorton/Radius-Dynamic-Scheduling` (private). *How it works
> now* is the current behavior; the *Decisions log* and *Changelog* are history.
> Source PRD: **WEB-1812 — Timezone-Aware Hierarchical Scheduling Engine**
> ([`../_Assets-Reference/Timezone-Scheduling PRD.pdf`](../_Assets-Reference/Timezone-Scheduling%20PRD.pdf)).
> Baseline this builds on: [`BASELINE.md`](BASELINE.md).
> **Visual hand-off (Artifact):** https://claude.ai/artifact/Sh1bMjimkqC9Waz6FafHXi (private;
> share it from its Share menu). A copy of the page is at [`dynamic-scheduling-handoff.html`](dynamic-scheduling-handoff.html).

## Read this first

This is a **UX and functionality prototype**, not a partial implementation. There is no
backend and no real authentication. All state lives in the browser (localStorage), and the
clock can be simulated. Its job is to pin down the intended behavior and screens; **back-end
engineering implements however it sees fit** (storage, ad-server evaluation, HubSpot,
reporting).

**Run it:** `npm install`, then `npm run dev` → `localhost:5176`. Reset demo data from the
browser console: `localStorage.removeItem('radius.scheduling.v1'); location.reload()`.

**Vocabulary:** **Active / Inactive** is the manual *administrative* status. **Run State** is
computed, and its good value is **Serving**: the PRD's computed "Active", renamed so the two
aren't confused (D12).

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
  Indefinite at any time. **As built (D32):** a campaign's empty start / end *is*
  Immediate / Indefinite in New York, matching R1. A line item's or creative's empty start /
  end follows its **parent's** live, so a child of an Immediate → Indefinite, New York
  campaign also reads that way. That refines R1 for child levels; flag it to the PRD owner.
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

## How it works now

### 1. Hierarchy and pages

- **Advertiser → Campaign → Line Item → Creative.** Each campaign, line item, and creative
  has its own schedule and its own administrative status. Distribution tags have no
  schedule; they follow their line item (D1).
- **Pages:** Advertiser (campaigns table), Campaign (details + line items table), Line Item
  (details + Weighted Creatives table). There's no breadcrumb. Each page title's
  **chevron** opens a menu with its parent: line item → campaign → advertiser.
- **Details panels** (top of the campaign and line-item pages) use a label-over-value grid
  with a **Schedule** row: Start · End · Timezone · Run State, plus an **Edit Schedule**
  button. This grid layout is proposed as the production style for these top sections.

### 2. The schedule and its defaults

A schedule is a **start**, an **end**, and an **IANA timezone**:

| Bound | Choices | If left empty |
|---|---|---|
| Start | **Immediate**, or a **specific date + time** | Campaign: **Immediate**. Line item / creative: **follows the parent's start** |
| End | **Indefinite**, or a **specific date + time** | Campaign: **Indefinite**. Line item / creative: **follows the parent's end** |
| Timezone | Any IANA zone (US zones pinned first). Default **New York** | Only matters for a specific date + time (D22) |

- **Immediate** starts the moment it's saved, or the moment the item is set Active if it's
  saved Inactive (PRD R2). The display keeps the setting and adds when it took effect:
  "Immediate · Started Sep 15, 2026, 9:30 AM EDT". That moment is fixed; switching an item
  to Immediate later moves its start to that later moment.
- **Indefinite** never ends (PRD R3).
- **A specific bound needs both a date and a time** (D23); no date-only schedules. Immediate
  and Indefinite need **no time**.
- **The end is exclusive:** at exactly the end time it has ended. The end must be after the
  start.
- **Daylight saving:** a time skipped by spring-forward is an error. A time that happens
  twice at fall-back uses the first occurrence, with a note.
- **New items:** a new campaign is Immediate → Indefinite in New York (PRD R1). A new line
  item or creative starts **fully following** its parent.
- **Times always read in the item's own zone** (D13, D19). The computer's clock and the
  browser's timezone never change a value (D21). QA check: change the computer's timezone,
  reload, and nothing changes.

### 3. Parent / child dependencies (D32)

- **Empty means follow.** A line item's or creative's start or end left empty follows the
  parent's **live**: if the parent changes, it changes too. This works per bound, so a
  creative can set its own start and still follow its line item's end. Following is
  transitive: a creative following a line item that follows the campaign tracks the
  campaign.
- **Inherited bounds say so:** "From campaign: Oct 8, 2026, 12:00 AM EDT" in the editor,
  "From campaign" in the details panel, and "Start & end from line item" on table rows.
- **No cascading edits.** Editing a campaign never changes its line items' own dates or
  timezones; editing a line item never changes the campaign or its creatives' own dates.
  Only bounds left empty move with the parent.
- **A parent can stop a child, never extend it.** A child serves only if every level above
  it is Active and inside its window **and** the child itself is. A parent set to Immediate
  → Indefinite doesn't make its children Serving; each child still has to be inside its own
  window. Example: a line item that ended Sep 20 reads **Schedule Expired** under an
  Indefinite campaign until its own end is extended, or cleared so it follows the campaign.
- **Extending revives** (PRD R12): move an expired end into the future (or clear it to
  follow a parent that's still running) and it serves again, with no reactivation.

### 4. Run State (computed, never stored)

Shown with the shared status chip (dot + label; the label always shows because colors
repeat). **Hovering the chip** shows what the state means plus why this item is in it.
Checks run top-down (campaign → line item → creative), and the first failure wins:

| Order | State | Dot | Meaning (tooltip) | Example detail |
|---|---|---|---|---|
| 1 | **Parent Not Serving** | amber ring | Its own schedule is fine, but a parent is Inactive or hasn't started. | "Campaign is set to Inactive." / "Campaign starts Oct 5, 2026, 9:00 AM EDT." |
| 2 | **Parent Expired** | amber | Its own schedule is fine, but a parent's schedule has ended. | "Line item ended Sep 20, 2026, 11:59 PM EDT." |
| 3 | **Inactive** | grey ring | Its status is switched off. | "Status is set to Inactive." |
| 4 | **Pending Start** | blue ring | Active, but its start time hasn't arrived. | "Starts Nov 20, 2026, 12:00 AM EST." |
| 5 | **Schedule Expired** | grey | Its end time has passed. Extending the end resumes serving; no reactivation needed. | "Ended Sep 30, 2026, 11:59 PM EDT." |
| 6 | **Serving** | green | Active and inside its schedule, and so is everything above it. | "Serving until Dec 31, 2026, 11:59 PM EST." / "Serving with no end date." |

*Parent Not Serving* merges two causes, inactive and not started (D17); the evaluator keeps
them apart so they can be split later. The details panel shows the detail line under the
chip, and tables show it on hover.

### 5. Warnings (out-of-sync schedules)

Warnings are computed, **never block a save**, and exist so a schedule that won't serve the
way it reads is caught early (D10). Two severities: **Warning** (amber triangle) and
**High** (red circle).

**Parent / child rules** (campaign ↔ line item, line item ↔ creative), checked on the
schedules as they apply, with inherited bounds resolved:

| Rule | Severity | Message (example) |
|---|---|---|
| Never overlaps: the child's whole window falls outside the parent's | **High** | "Never serves: its whole schedule falls outside the campaign's (Sep 15, 2026, 12:00 AM EDT → Dec 31, 2026, 11:59 PM EST)." |
| Starts before the parent starts | Warning | "Starts Sep 1, 2026, 12:00 AM EDT, before the campaign starts (Sep 15, 2026, 12:00 AM EDT). It won't serve until then." |
| Ends after the parent ends (incl. Indefinite under a parent with an end) | Warning | "Runs indefinitely, but the campaign ends Dec 31, 2026, 11:59 PM EST. It stops serving then." |
| Different timezone from the parent, when a specific time is involved (D18, D22) | Warning | "Set to its own timezone, Los Angeles time (PDT); the campaign uses New York time (EDT). The line item starts Oct 8, 2026, 12:00 AM PDT (Oct 8, 2026, 3:00 AM EDT campaign time)…" |

A bound the child **follows** always matches the parent, so it never triggers these. "Never
overlaps" replaces the start / end rules when it applies.

**Coverage rule** (the line item and its creatives as a group):

| Rule | Severity | Message |
|---|---|---|
| The line item is Serving, but none of its creatives are | **High** | "The line item is Serving, but none of its 2 creatives are. Nothing is delivering." |

**Where warnings show:**

| Place | What it shows |
|---|---|
| **Schedule editor** (every level) | An "Out of sync" list that updates live as you edit, with "You can still save." For a campaign or line item it covers the children it would knock out of sync. |
| **Table rows** (campaigns, line items, creatives) | A triangle / circle icon next to the Run State chip; hover lists every message. The campaigns table's icon summarizes out-of-sync line items. |
| **Line item details panel** | "Schedule warnings": its own rules against the campaign, plus the coverage rule. |
| **Campaign details panel** | "N line items out of sync with this schedule", one line per line item. |

**Stop-delivery confirmations** (these *do* ask first, D20). Any save that would stop
something **currently Serving** asks "Stop delivery now?" and lists everything it stops,
including children that follow the changed dates. Triggers: a start or end change, or
setting a campaign or line item **Inactive**. Changes that only resume or extend delivery
save without asking. Removing a creative also confirms.

### 6. Schedule editor (one dialog for every level)

- **Timezone first.** The helper text says what it applies to: "Applies when you set a date
  of its own. Until then it follows the campaign."
- **Start date / End date dropdowns** list the no-date choices above a calendar:
  - Campaign: **Immediate** / **Indefinite**.
  - Line item / creative: **Same as campaign** (or *line item*) first, with the parent's
    value shown, then Immediate / Indefinite.
- **Specific dates:** picking a calendar day makes the bound specific and requires a time.
  A picked date has an **×** to clear it back to the default.
- **Live warnings, D20 confirmation, and a "Schedule saved for {name}" message.**
- Opened from **Edit Schedule** in a details panel, or the **pencil in any table's Schedule
  column**. A line item's schedule can be edited from the campaign view, and a campaign's
  from the advertiser view.

### 7. Tables: one Schedule column

Every table shows a schedule the same way: one **Schedule** column (start, "→ end", then a
caption with the zone when a specific time applies, and what comes from the parent), with
a **pencil** that opens that row's editor, followed by **Run State**. Separate Start / End
columns were combined into this column to simplify the tables.

| Table | Columns |
|---|---|
| Advertiser → **Campaigns** | Campaign Name · ID · Status · **Schedule** · **Run State** · Impressions Goal · Line Items · Actions |
| Campaign → **Line Items** | Name · Creative Type · Status · **Schedule** · **Run State** · Rate · Impressions Goal · Tags · Actions |
| Line Item → **Weighted Creatives** | Name (trash = remove) · Creative Id · **Schedule** · **Run State** · Weighting · Pixel Name |

Weighted Creatives has no Status column: production has none, and Run State covers it.

### 8. Weighted Creatives and weighting (D28)

- Laid out like production: subtitle "Used as fallback when no target type provided or
  targeting doesn't match", **Add Weighted Creatives** (multi-select library search), a
  trash icon to remove (with confirmation), row selection ("1 row selected"), pagination,
  Pixel Name.
- **Weights split delivery only among creatives Serving right now.** A creative that isn't
  Serving shows "–". One Serving creative is 100%. With no typed weights the split is even.
  Typed weights are kept, and the rest share the remainder. Over 100% (or all typed) scales
  to fit, in whole percents that always total 100.
- The split re-balances on its own as creatives start and end. A typed weight is kept while
  its creative isn't Serving and applies again when it's back. The reset icon clears typed
  weights; the arrow sorts by share.
- A creative belongs to **one line item** in this prototype; sharing across line items
  (D27) isn't built.

### 9. Creating from scratch

- **Add New Campaign** (advertiser): Name, Vertical, Line of Business, all required. It opens
  the new campaign, Immediate → Indefinite in New York.
- **Add New Line Item** (campaign): Line Item Name, Media Type (banner / video), Rate Type
  (CPC / CPE / CPM / Flat Fee). It opens the new line item, following the campaign's
  schedule.
- **Add Weighted Creatives** (line item): new creatives follow the line item's schedule.

### 10. Testing: Preset sample, Demo, restart, demo clock (prototype-only)

The top bar reads **Demo clock | Preset sample ⇄ Demo ↻**. None of these exist in
production.

| Control | What it does | Use it to |
|---|---|---|
| **Preset sample** (default) | Seeded campaign 4074: 4 line items, 9 creatives, a spread of Run States, warnings, and timezones (one Los Angeles line item). Three creatives follow their line item. Opens on line item 25095. | See every state and warning without setup. |
| **Demo** | Starts empty on the advertiser page (Kerv). Build a campaign, line items, and creatives with the create forms. | Test the first-time flow and defaults: a new campaign is Immediate → Indefinite; new children follow their parent. |
| **↻ Restart demo** (Demo only) | Confirms, then clears everything built in Demo and returns to an empty advertiser. **The preset sample isn't touched.** | Re-run the build-from-scratch flow cleanly. |
| **Demo clock** | Jumps +1 hour / +1 day / +1 week / +30 days / −1 day / −1 week. It turns amber while simulated; *Back to real time* resets it. It applies in both modes. | Watch Pending Start → Serving → Schedule Expired, warnings change, and weights re-balance. |

- **Each mode keeps its own data** (campaigns, line items, creatives, and the current page).
  Switching never loses work.
- **Data lives in this browser only** (localStorage, `radius.scheduling.v1`) and survives
  reloads. Another browser or machine starts fresh, and testers don't share changes.
- **The preset sample runs on real time,** so its states depend on today's date. Use the
  demo clock to show a specific moment.
- **Full reset** (both modes and the clock), in the browser console:
  `localStorage.removeItem('radius.scheduling.v1'); location.reload()`.
- **Good test passes:**
  - **States:** in the sample, jump +30 days and back.
  - **Inheritance:** change the campaign's end; following children move, and ones with
    their own dates stay put.
  - **Defaults:** in Demo, create a campaign and line item; the line item reads "From
    campaign".
  - **Warnings:** give a line item a start before the campaign's, or another timezone.
- The baseline's User / Admin toggle is hidden (`SHOW_ROLE_TOGGLE`).

### 11. Back end / out of scope

Storage (UTC + IANA, R4), ad-server evaluation and timing (R8–R10), warehouse isolation and
event streaming (R14–R15), and **HubSpot** in both directions (R5–R7, D31) are
engineering's. The prototype only models their visible result.

## Not built yet / open refinements

- **Not built:** a per-creative Active / Inactive switch; shared creatives across line
  items (D27, decided "for now"); a warnings roll-up in the top-bar bell; the migration
  cases (R16 objects without dates, R17 flag serving objects for release); distribution
  tags per line item (shared demo data today).
- **Possible refinements (not requested):** skip the timezone warning when the parent has
  no specific times (its zone can't shift anything); wording for "Immediate · Started …";
  pagination parity between tables.
- **Provisional names (D12, D17):** "Serving" and the merged "Parent Not Serving".

## Decisions log

The full history, D1–D32, in the order they were made. Rows marked *Superseded* /
*Reversed* / *Replaced* are kept for the record. **The current behavior is in *How it works
now* above.**

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

## Implementation map

| Piece | Where |
|---|---|
| Types: `Schedule` (`ScheduleStart` / `ScheduleEnd`, incl. `inherit`), `RunningState`, `Campaign`, `LineItem`, `Creative`, `View`, `ExperienceMode`, `Workspace` | [`../src/types.ts`](../src/types.ts) |
| Wall-clock ⇄ UTC via an explicit zone, DST, formatting, `evaluateRunning` (PRD order), `resolveImmediate` | [`../src/lib/schedule.ts`](../src/lib/schedule.ts) |
| Inheritance: `effectiveSchedule` / `effectiveLineItemSchedule` / `effectiveCreativeSchedule`, `childDefaultSchedule`, `inheritedNote`, storage migration | [`../src/lib/scheduleInheritance.ts`](../src/lib/scheduleInheritance.ts) |
| Warning rules (parent/child) | [`../src/lib/scheduleWarnings.ts`](../src/lib/scheduleWarnings.ts) |
| Hierarchy wiring, roll-ups, coverage rule, D20 impact | [`../src/lib/hierarchy.ts`](../src/lib/hierarchy.ts) |
| Run State labels / colors / tooltips | [`../src/lib/runningStatus.ts`](../src/lib/runningStatus.ts) |
| Weighting among Serving creatives | [`../src/lib/scheduleWeights.ts`](../src/lib/scheduleWeights.ts) |
| Timezone catalog; date-dropdown month grid | [`../src/lib/timezones.ts`](../src/lib/timezones.ts), [`../src/lib/scheduleCalendar.ts`](../src/lib/scheduleCalendar.ts) |
| New campaign / line item builders and form options; creative library | [`../src/lib/newEntities.ts`](../src/lib/newEntities.ts), [`../src/lib/creativeLibrary.ts`](../src/lib/creativeLibrary.ts) |
| State, actions, Preset sample / Demo workspaces, migrations; seed data | [`../src/state/AppContext.tsx`](../src/state/AppContext.tsx), [`../src/state/seedScheduling.ts`](../src/state/seedScheduling.ts) |
| Pages | [`CurrentPage`](../src/components/CurrentPage.tsx) → [`AdvertiserPage`](../src/components/AdvertiserPage.tsx) / [`CampaignPage`](../src/components/CampaignPage.tsx) / [`LineItemPage`](../src/components/LineItemPage.tsx); [`ParentMenuButton`](../src/components/ParentMenuButton.tsx) |
| Schedule UI | [`ScheduleEditorDialog`](../src/components/ScheduleEditorDialog.tsx), [`ScheduleDateField`](../src/components/ScheduleDateField.tsx), [`TimeZonePicker`](../src/components/TimeZonePicker.tsx), [`ScheduleSummary`](../src/components/ScheduleSummary.tsx), [`ScheduleCell`](../src/components/ScheduleCell.tsx), [`RunningStateChip`](../src/components/RunningStateChip.tsx), [`ScheduleWarningIcon`](../src/components/ScheduleWarningIcon.tsx), [`ScheduleWarningList`](../src/components/ScheduleWarningList.tsx), [`AdminStatusField`](../src/components/AdminStatusField.tsx) |
| Tables and panels | [`CampaignDetails`](../src/components/CampaignDetails.tsx), [`CampaignLineItemsTable`](../src/components/CampaignLineItemsTable.tsx), [`LineItemDetails`](../src/components/LineItemDetails.tsx), [`CreativesSection`](../src/components/CreativesSection.tsx), [`CreativeWeightField`](../src/components/CreativeWeightField.tsx) |
| Create flows | [`CreateCampaignDialog`](../src/components/CreateCampaignDialog.tsx), [`CreateLineItemDialog`](../src/components/CreateLineItemDialog.tsx), [`AddCreativesDialog`](../src/components/AddCreativesDialog.tsx) |
| Prototype controls | [`PageTopBar`](../src/components/PageTopBar.tsx), [`SimulatedClockControl`](../src/components/SimulatedClockControl.tsx) |

**Back-end swap points:** `evaluateRunning` mirrors the ad server's check; `resolveImmediate`
should be stamped by the server; storage is already UTC + IANA (R4); the demo clock, the
Preset sample / Demo toggle, and the creative library are prototype stand-ins.

## Build plan status

| Phase | Status |
|---|---|
| 0 Plan · 1 Domain + clock · 2 Schedule control · 3 Line item details | ✅ |
| 4 Creatives (schedules, weighting, add / remove) | ✅ except shared creatives (D27) |
| 5 Warnings roll-up | 🟡 inline, row icons, panel lists, and confirmations built; top-bar bell not built |
| 6 Campaign + advertiser pages, create flows | ✅ (HubSpot back-end only, D31) |
| 7 Hand-off: this doc, Obsidian note, visual Artifact | ✅ (2026-10-15) |

## Changelog

- **2026-10-15**: Published the **visual hand-off Artifact**
  (https://claude.ai/artifact/Sh1bMjimkqC9Waz6FafHXi), built from *How it works now*; a copy
  of the page is at `docs/dynamic-scheduling-handoff.html`.

- **2026-10-15**: **Doc consolidated to current behavior.** New *How it works now* covers
  hierarchy, the schedule and defaults, parent/child dependencies, Run States with tooltips,
  every warning rule and where it shows, stop-delivery confirmations, the editor, the
  combined Schedule column, weighting, create flows, and prototype controls. It replaces
  the per-pass *What's built* sections and the draft model / timezone / warnings /
  shared-creative sections; D1–D32 and this log keep the history. The implementation map
  and build-plan status are refreshed. Section 10 documents testing with Preset sample /
  Demo / restart / the demo clock.

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
