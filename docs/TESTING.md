# Testing the Dynamic Scheduling prototype

For engineers verifying behavior. **What** each feature does is in
[handoff-dynamic-scheduling.md](handoff-dynamic-scheduling.md) (*How it works now*). This
guide covers **how to test it**: the prototype-only controls, what's seeded and what it
should show, step-by-step scenarios with expected results, and how to reset.

## 1. Run it

```bash
npm install
npm run dev          # http://localhost:5176 (strict port)
npx tsc --noEmit     # the only automated gate (no test suite, no linter)
```

There's no backend. Everything runs and persists in the browser.

## 2. The testing controls

The top bar reads **Demo clock | Preset sample ⇄ Demo ↻**. All of it is prototype-only.

| Control | What it does |
|---|---|
| **Preset sample** (default) | Loads seeded campaign **4074** with 4 line items and 9 creatives (section 4). Lands on line item 25095. |
| **Demo** | Starts empty on the **advertiser page** (Kerv). Build everything with Add New Campaign → Add New Line Item → Add Weighted Creatives. |
| **↻ Restart demo** | Shown only in Demo. Confirms, then empties the Demo data and returns to the advertiser page. **Never touches the preset sample.** |
| **Demo clock** | Shifts "now": +1 hour, +1 day, +1 week, +30 days, −1 day, −1 week. It turns amber while shifted; **Back to real time** clears it. One clock for both modes. |

### How it works underneath

- **Storage:** all app state is one JSON object in `localStorage` under
  **`radius.scheduling.v1`**, written on every change. It's per browser profile: testers
  never share data, and a fresh browser starts at the defaults.
- **Two workspaces:** `state.mode` is `"sample"` or `"demo"`. The active mode's
  `campaigns`, `lineItems`, `creatives`, and `view` (current page) sit at the top level of
  state; the other mode's sit in `state.parkedWorkspace`. Toggling swaps them (reducer
  `setMode`), so each mode resumes exactly where it was left.
- **Restart** (reducer `resetDemo`) replaces only the Demo workspace with an empty one.
- **Seeds:** `src/state/seedScheduling.ts`. `sampleWorkspace()` builds the preset sample,
  and `emptyDemoWorkspace()` builds the empty demo. Edit or add seed scenarios there.
- **Clock:** `now = Date.now() + state.clockOffsetMs`, re-evaluated every 15 s. Every
  schedule check reads `now` from `useApp()`, so the offset applies everywhere. The offset is
  saved, so it survives reloads.
- **New ids** continue above both workspaces: campaigns from 3876, line items from 23255,
  creatives keep their library id.
- **Old saves** are migrated on load (`loadFromStorage` in `src/state/AppContext.tsx`).

## 3. Resetting

| Goal | How |
|---|---|
| Clear only the Demo | **↻** in the top bar (Demo mode). |
| Undo time travel | Demo clock → **Back to real time**. |
| Reset everything (both modes, the clock, the page) | Browser console: `localStorage.removeItem('radius.scheduling.v1'); location.reload()` |
| Jump to an exact moment | Browser console (replace the date): `const s = JSON.parse(localStorage.getItem('radius.scheduling.v1')); s.clockOffsetMs = Date.parse('2026-11-05T17:00:00Z') - Date.now(); localStorage.setItem('radius.scheduling.v1', JSON.stringify(s)); location.reload()` |

**Start every test pass with a full reset**, so the sample matches the tables below.

## 4. Preset sample: what's seeded and what it should show

The sample runs on **real time**, so what you see depends on the date. The tables below
are the expected results at three reference moments (noon ET). Use the "exact moment"
snippet in section 3 to reproduce them. All rows were captured from the running app.

### Seeded schedules

| Item | Schedule (as entered) | Notes |
|---|---|---|
| **Campaign 4074** | Sep 15, 2026 12:00 AM → Dec 31, 2026 11:59 PM, New York | |
| Line item **25095** (…Community Forums_Disney+) | Immediate (started Sep 15, 9:30 AM EDT) → Indefinite, NY | Runs past the campaign's end |
| · Stratos_Hero_30s (8421) | Immediate (Sep 15, 9:30 AM) → Indefinite | Typed weight **60%** |
| · Stratos_Cutdown_15s (8422) | Immediate (Sep 15, 9:30 AM) → Oct 31, 11:59 PM EDT | |
| · Stratos_Holiday_15s (8423) | Nov 20, 12:00 AM EST → Dec 31, 11:59 PM EST | |
| · Stratos_Teaser_06s (8424) | Sep 15, 12:00 AM EDT → Sep 30, 11:59 PM EDT | Starts before its line item (9:30 AM) |
| Line item **25096** (…Community Forums_Hulu) | Oct 8, 12:00 AM EDT → Nov 29, 11:59 PM EST | |
| · Kooth_Hulu_30s (8431) | Oct 8, 12:00 AM EDT → Nov 29, 11:59 PM EST | Same window as its line item (its own copy) |
| · Kooth_Hulu_15s (8432) | Oct 22, 12:00 AM EDT → Nov 29, 11:59 PM EST | |
| Line item **25097** (…Dog Probs_Disney+) | Oct 8, 12:00 AM **PDT** → Nov 29, 11:59 PM **PST** (Los Angeles) | Different zone from the campaign |
| · DogProbs_Disney_30s (8441) | Oct 8, 12:00 AM PDT → Nov 29, 11:59 PM PST | Same window as its line item |
| · DogProbs_Disney_Promo_15s (8442) | Oct 20, 9:00 AM PDT → Nov 15, 11:59 PM PST | |
| Line item **25098** (…Dog Probs_Hulu) | Sep 1, 12:00 AM EDT → Sep 20, 11:59 PM EDT | Starts before the campaign; already ended |
| · DogProbs_Hulu_30s (8451) | Sep 1, 12:00 AM EDT → Sep 20, 11:59 PM EDT | Same window as its line item |

### Expected Run State, weight, and warnings

| Item | Oct 15, 2026 | Nov 5, 2026 | Nov 22, 2026 |
|---|---|---|---|
| Campaign 4074 | Serving | Serving | Serving |
| **25095** | Serving | Serving | Serving |
| · Hero | Serving · **60%** | Serving · **100%** | Serving · **60%** |
| · Cutdown | Serving · **40%** | Schedule Expired · – | Schedule Expired · – |
| · Holiday | Pending Start · – | Pending Start · – | Serving · **40%** |
| · Teaser | Schedule Expired · – ▲ | Schedule Expired · – ▲ | Schedule Expired · – ▲ |
| **25096** | Serving | Serving | Serving |
| · Kooth_Hulu_30s | Serving · **100%** | Serving · **50%** | Serving · **50%** |
| · Kooth_Hulu_15s | Pending Start · – | Serving · **50%** | Serving · **50%** |
| **25097** | Serving ▲ | Serving ▲ | Serving ▲ |
| · DogProbs_Disney_30s | Serving · **100%** | Serving · **50%** | Serving · **100%** |
| · DogProbs_Disney_Promo_15s | Pending Start · – | Serving · **50%** | Schedule Expired · – |
| **25098** | Schedule Expired ▲ | Schedule Expired ▲ | Schedule Expired ▲ |
| · DogProbs_Hulu_30s | Parent Expired · – | Parent Expired · – | Parent Expired · – |

After Dec 31, 2026 11:59 PM EST the campaign is **Schedule Expired**, and everything under
it reads **Parent Expired**.

**Warnings (▲) in the sample, all dates:**

| Where | Message |
|---|---|
| 25097 panel + row | "Set to its own timezone, Los Angeles time (PDT); the campaign uses New York time (EDT). The line item starts Oct 8, 2026, 12:00 AM PDT (Oct 8, 2026, 3:00 AM EDT campaign time) and ends Nov 29, 2026, 11:59 PM PST (Nov 30, 2026, 2:59 AM EST campaign time)." |
| 25098 panel + row | "Starts Sep 1, 2026, 12:00 AM EDT, before the campaign starts (Sep 15, 2026, 12:00 AM EDT). It won't serve until then." |
| Teaser row (on 25095) | Starts before its line item (Sep 15, 12:00 AM vs. 9:30 AM). |
| Campaign panel | "2 line items out of sync with this schedule", one line per line item. |

25095 (Immediate → Indefinite) has **no** warning even though the campaign ends Dec 31: an
Immediate start or Indefinite end never triggers "Starts before" / "Ends after" (PRD R18).

## 5. Scenarios

Run each from a **full reset at real time** unless it says otherwise. "Expected" is what
should happen.

| # | Area | Steps | Expected |
|---|---|---|---|
| 1 | **No inheritance** | Sample → line item **25096** → Edit Schedule → set End to Dec 20, 11:59 PM → Save. | Its creatives keep their own ends (both still Nov 29). Children never take parent values (PRD R1). |
| 2 | **Clear a date** | On 25096, open Kooth_Hulu_15s's editor (row pencil) → **×** on End date → Save. | End date returns to **Indefinite** and the time field shows "—". The row reads "→ Indefinite". No "Ends after" warning (Indefinite never triggers it). |
| 3 | **No cascade** | Campaign page → Edit Schedule → Timezone to Sydney → Save. | Line items with their own dates keep their dates and zones (25096 still EDT, 25097 still PDT). Nothing under the campaign is rewritten. |
| 4 | **Defaults (Demo)** | Toggle **Demo** → Add New Campaign (any Name / Vertical / Line of Business) → Edit Schedule → Timezone to Sydney → Save → Add New Line Item (any) → Add Weighted Creatives (pick one). | Campaign: Immediate (started now) → Indefinite, Sydney, **Serving**. Line item: Immediate (started now) → Indefinite, **New York** (not Sydney), Serving. Creative: the same, Serving, **100%**, with no status. |
| 5 | **No time for Immediate / Indefinite** | Any editor → choose Immediate (start) and Indefinite (end). | Time fields show "—" and Save is enabled. Picking a calendar date instead requires a time ("Add a start time. Both are required."). |
| 6 | **Warning: never overlaps** | Sample → 25098 → set End to Sep 10, 11:59 PM → Save. | A red ● "Never serves: its whole schedule falls outside the campaign's (…)." on the row, in the panel, and live in the editor. |
| 7 | **Warning: coverage** | Sample at real time → 25096 → trash **Kooth_Hulu_30s** → confirm. | The line item panel shows red ● "The line item is Serving, but none of its 1 creative is. Nothing is delivering." (Kooth_Hulu_15s hasn't started). |
| 8 | **Warning: timezone** | Any line item with its own dates → Timezone to Chicago → Save. | Amber ▲ "Set to its own timezone, Chicago time (CDT); the campaign uses New York time (EDT)…". |
| 9 | **Stop-delivery confirm** | Sample → 25096 (Serving) → set End to yesterday → Save. | "Stop delivery now?" lists **This line item** and each of its creatives that is Serving (e.g. **Creative Kooth_Hulu_30s**), since they'd become Parent Expired. Cancel leaves everything unchanged. |
| 10 | **Inactive confirm** | Sample → 25096 → Status pencil → Inactive. | "Stop delivery now?" first. After confirming: the line item is **Inactive**, and its creatives are **Parent Not Serving** ("Line item is set to Inactive."). |
| 11 | **Extending revives** | Sample → 25098 (Schedule Expired) → set End to Dec 1 → Save. | No confirmation. 25098 is **Serving**. DogProbs_Hulu_30s goes from Parent Expired to **Schedule Expired**: its own end (Sep 20) has passed, and the line item's change doesn't reach it. Extend the creative's end too, and it's Serving. |
| 12 | **Weights re-balance** | Sample → 25095 → Demo clock **+30 days** → then **+1 week** twice. | Hero 60 / Cutdown 40 → Hero 100% (Cutdown ended) → Hero 60 / Holiday 40. Typed weights persist; reset (↻ on the Weighting header) returns to an even split. |
| 13 | **Edit from tables** | Campaign page → a line item row's **pencil** in the Schedule column. Advertiser page → the campaign row's pencil. | Opens the same editor as on the item's own page; saving updates the row in place with "Schedule saved for …". |
| 14 | **Mode isolation** | Sample → change something → toggle Demo → build something → toggle back → **↻** in Demo. | Each mode keeps its own changes and page. Restart clears Demo only; the sample keeps its change. |
| 15 | **No browser-timezone dependence (D21)** | Note several displayed times → change the computer's timezone (macOS: System Settings → General → Date & Time) → reload. | **Nothing changes.** Every time reads in the item's own zone. |
| 16 | **Run State tooltips** | Hover any Run State chip. | It shows what the state means plus why, e.g. "Pending start — Active, but its start time hasn't arrived. Starts Nov 20, 2026, 12:00 AM EST." |
| 17 | **Time field** | Any editor → pick a calendar date → click its time field; scroll the list to the bottom and keep scrolling. Then type `21:30` and press Tab; then `930p` (watch the list); then `25:00` and Tab. | The list holds 12:00 AM … 11:45 PM in 15-minute steps plus 11:59 PM, opens at the current time, and **stops at the end** (no looping). `21:30` displays **9:30 PM**. Typing `930p` narrows the list to 9:30 PM. `25:00` shows "Enter a time like 9:30 AM or 21:30." and isn't saved. |

## 6. Gotchas

- **The sample moves with real time.** On a later date some items will have started or
  ended. Use the reference-moment snippet when comparing against section 4.
- **The demo clock is saved and shared by both modes.** If states look wrong, check the top
  bar; an amber clock means time is shifted.
- **Data is per browser.** Clearing site data, or a private window, starts fresh.
- **Distribution tags, Transcoding, and Push** are shared baseline demo data on every line
  item in both modes. They have no schedule (D1).
- A creative belongs to **one line item**; the Add Creatives list hides creatives already
  in use.
- The baseline's **User / Admin** toggle is hidden (`SHOW_ROLE_TOGGLE` in `PageTopBar`).
