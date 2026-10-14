# Session Log — Radius Dynamic Scheduling

**Coverage:** 2026-09-28 to present (this phase only).
**Audience:** anyone who needs the *narrative* behind the commits: what was discussed,
which trade-offs were weighed, and what's still open.

The git log is the technical record. [`TIME_LOG.md`](TIME_LOG.md) covers hours. The
feature spec and its decisions are in
[`docs/handoff-dynamic-scheduling.md`](docs/handoff-dynamic-scheduling.md). For the
baseline's history (Sessions 1–12 of the earlier prototype), read the source project's
`SESSION_LOG.md`. See [`docs/BASELINE.md`](docs/BASELINE.md).

---

## Engagement framing

A new **Q4 phase** of the Radius prototype work: **Dynamic Scheduling**. Users get granular
run schedules across a campaign: date **and time**, a real timezone list (not US-only),
**start immediately**, and **always on** (no end date). The schedule applies at the
campaign, line item, and creative level, with a visible **running status** at each level.
The kickoff called for a reusable scheduling component and **new pages outside the current
line-item page**.

The user wanted **cleaner separation** than last time. The Transcoding + 3rd-Party Push
work moved to a new remote but kept one continuous repo. This phase is instead its own
project folder with its own docs, built on a frozen snapshot of that prototype. Everything
the baseline does must stay intact.

---

## Sessions

### 2026-09-28 — Session 1: Project setup

- Reviewed the full source project (`../Radius-AdTags-Prototype`): code, `CLAUDE.md`,
  `RESUME.md`, both hand-offs, session/time logs, the `log-time` skill, and memory.
- Took a **snapshot of `src/` at `1d3cc2e`** into this folder, with no git history carried
  over. Retargeted only what was needed to run side by side: port **5176** (5174 = baseline,
  5175 = `kerv-companion-demo`), storage key `radius.scheduling.v1`, package name, and page
  title. Full list in [`docs/BASELINE.md`](docs/BASELINE.md).
- `npm ci` + `npx tsc --noEmit` green; the dev server serves at `localhost:5176`.
- New docs: `CLAUDE.md` (a phase section on top of the inherited conventions), `README.md`,
  `docs/README.md`, `docs/BASELINE.md`, frozen baseline hand-offs under `docs/baseline/`,
  and the living spec [`docs/handoff-dynamic-scheduling.md`](docs/handoff-dynamic-scheduling.md)
  holding the ask, what the baseline shows today, and eight open questions.

**Planning pass (same day, no code).** The user clarified the hierarchy and supplied the PRD
(`_Assets-Reference/Timezone-Scheduling PRD.pdf`, WEB-1812):
- **Distros have no schedule.** They belong to a line item, and line items have schedules.
- **Campaign → Line Items → Creatives**, each with its own schedule. Line items within a
  campaign, and creatives within a line item, can each differ. Creatives are associated
  with a line item, possibly several.
- **The first surface is the Start/End Date fields** at the top of the line-item page. The
  campaign section waits until the user provides context and examples.
- The PRD's key UI rules: defaults of Immediate / Indefinite / `America/New_York`;
  administrative status is never changed by the clock; the computed state (*Active*,
  *Pending Start*, *Schedule Expired*, *Parent Expired*) is shown separately; extending an
  end revives delivery.
- The spec now holds decisions D1–D8, a draft `Schedule` model, the computed-state order, a
  simulated-clock prototype affordance, a phased build plan, and eight open questions.
- The user keeps feature documentation in the Obsidian vault at `Projects/_documentation`
  and wants ample docs there. The note structure for this project is still to be agreed.

**Planning pass 2 (same day, no code).** User decisions:
- **The timezone is always explicit.** Campaign setup often happens from a different zone than
  the one the campaign runs in, so nothing is auto-applied (no browser detection, no silent
  parent inheritance). Default is US Eastern (`America/New_York`). → D9.
- **Warn on out-of-sync parent/child and sibling schedules** so they get fixed quickly. The
  warnings are non-blocking and may be tuned later. → D10, with a first-pass rule set and
  surfaces in the spec (inline, row icon, count, top-bar bell).
- **One schedule per creative**, changed everywhere it's used. → D11.
- **The computed "Active" is labeled "Serving"** (provisional; to be called out in the docs
  and the Artifact, and may change after team feedback). → D12.
- **Obsidian is organized project by project**, with links between related projects. Created
  `_documentation/Radius Dynamic Scheduling.md` (project note, planning status) and added a
  backlink under *Related resources* in `Radius Ad-Tags.md`.

**Planning pass 3 (same day, no code).** The user answered the remaining questions. These
are now D13–D19 in the spec:
- Each level shows its own schedule, in its own zone.
- Immediate resolves to the real start time and state.
- Immediate and Indefinite count as values.
- Start is movable; moving an end into the past always confirms.
- **Parent Pending + Parent Inactive merge** into "Parent Not Serving". The user flagged this
  as possibly reversible, so the evaluator keeps the two causes apart and only the label is
  shared.
- A timezone mismatch between parent and child is a full Warning ("something will not be
  serving as expected").
- Times always print in the entity's selected zone. There's no app clock, so the proposed
  "your local time" reference was dropped. A zone change keeps the typed wall-clock time;
  that part is my interpretation, to confirm in Phase 2.
- Figma most likely won't be used. Design input will come as context and examples.

**Planning pass 4: planning complete.** Confirmed the "Parent Not Serving" label and the
zone-change behavior (the typed time stays). New decisions:
- **D20:** any start/end change that affects something currently Serving (the item or its
  children) asks for confirmation and lists what's affected. Resume/extend doesn't confirm.
- **D21:** the user clarified that no clock matters except the one on their own computer,
  and neither it nor the browser timezone should affect platform inputs or outputs. Recorded
  as a hard rule, with a build note that bans browser-local JavaScript date APIs for schedule
  values and a QA check: change the computer's timezone and nothing should change.
- Spec status: planning complete, awaiting go-ahead for Phase 1. No open questions.

**Pass 5.** The user stressed that for Immediate ("now") and Indefinite the timezone
doesn't matter, so the UI must make those *settings* visible rather than times, and that a
non-Immediate/Indefinite bound needs **both** a date and a time. Recorded as D22 and D23;
D14 is amended (the display leads with "Immediate") and D18 is scoped (the zone-mismatch
warning needs a Specific time).

**Noticed in the source project (not acted on):** its `main` is 4 commits ahead of `origin`
(`8221fc4`…`1d3cc2e`, the doc hand-off + advertiser-lock work). Push those there if the
GitHub repo should match.

### 2026-09-28 — Session 2: Initial build (line item + campaign views)

The user approved the muted-timezone recommendation and supplied the production campaign
page (`_Assets-Reference/Campaign-Page_Sample.png`). The ask was to rebuild its vertical
details list into the line-item grid format, add a way from the line item back to the
campaign, and do the initial pass on both views. Creatives are omitted for now.

- **Built:** the domain layer (types, UTC ⇄ wall clock through an explicit zone with DST
  handling, the PRD evaluation cascade, warnings, D20 impact), a seeded campaign 4074 with
  its 4 line items from the sample, the page switch, the line-item breadcrumb, the Schedule
  row, the real Status switch, the shared schedule editor, the timezone picker, the campaign
  page (grid details, schedule + roll-up, line-items table, empty pixels), and the demo clock.
- **Verified:** typecheck and build pass; the D21 date math is byte-identical under three
  machine zones; headless-Chrome walkthroughs of navigation, editor validation, the save
  flows, both D20 confirmations, and the clock jump; a baseline smoke test.
- **Judgment calls:**
  - The Tags column is static `1`, and distros stay shared across line items. The baseline
    had only one line item; making distros per line item would reach into
    Transcoding/Push, which is out of scope for this pass.
  - The run-state column is named "Run State".
  - The campaign table wraps line-item names instead of truncating them, since the names
    only differ at the end.
  - Each scheduling panel owns its own Snackbar.
- `CampaignDetailsStub.tsx` was removed, replaced by `LineItemDetails.tsx`.

### 2026-09-30 → 10-01 — Session 3: Review feedback, inheritance, creatives, fresh-campaign flow

- **Recovered context** after the chat history was lost. The docs and code were intact.
  The dev server had simply stopped with the old session. It's now started detached
  (`nohup`) so it outlives Claude sessions.
- **Line-item header:** the breadcrumb (back arrow + campaign name) is replaced by the
  campaign header's chevron button. It opens a menu listing the parent campaign; picking it
  navigates back. The user didn't want the campaign name exposed outright.
- **Schedule editor simplified:** the Immediate/Specific and Indefinite/Specific toggles
  are gone. Immediate and Indefinite are now the top option in each Date field's dropdown,
  above a custom month calendar (no date-picker library; the calendar math is UTC-only, so
  it doesn't depend on the browser's zone, per D21). The Timezone field moved to the top
  as the first field. Headless-Chrome walkthrough confirmed the flow.
- **D24, timezone inheritance (planning only, not built):** the campaign defaults to New
  York (PRD). Line items and creatives default to their parent's zone and **follow it until
  overridden**. Example: a campaign moved to `Australia/Sydney` takes its children with
  it, and a line item can still be set to Perth by hand. Amends D9. The user asked what
  "D9" meant. The D-numbers are our spec's decision IDs. D9's New York default came from
  the PRD; its "no copying the parent's zone" part came from planning, and its concern was
  the *browser's* zone. D24 slightly refines PRD R1 (New York at every level), flagged for
  the PRD owner. Logged in the spec (new section, Phase 2b, three open questions with
  proposed answers) and the Obsidian note.
- **D24 follow-ups:** the user answered the open questions. A differing override warns
  (D25). An override never re-follows on its own (D26). On shared creatives, the user
  asked whether delivering per line item regardless of zone causes problems. It doesn't for
  delivery (per-association UTC cascade). The catches: one schedule can't express "9 AM in
  each market", and the creative needs one parent for its default zone. Q1 stays open
  with the proposed answer (follow the first line item) and guidance (keep shared
  creatives Immediate → Indefinite).
- **Q1 resolved → D27** (amends D11), after a clarifying question. A shared creative's
  **home** is the first line item it was added to. Its zone follows the home, its Specific
  dates/times apply only there, and under other line items it runs Immediate → Indefinite.
  The user accepted this "for now" and expects to revisit it. I filled in the implied
  details (edits always target the home schedule, display under non-home line items, run
  state, warnings, the next home when the home association is removed) and marked them to
  confirm during Phase 4.
- **The user wants D24 in the visual Artifact and the team hand-off.** It's now a Phase 7
  requirement. No Artifact exists for this project yet.

**Creatives pass (same session, built).** The user asked to add schedules to creatives (a
Schedule column that shows the current schedule and opens the editor), with weighting in
mind, and pointed to `github.com/tggorton/Line-Item-Multi-Creative` for creative demo
behavior. In that repo, weights split among Active creatives (typed weights kept, the rest
even, one creative = 100%, reset to even). Its previous commit had per-creative dates,
dayparting, and a "default creative", all removed in its last commit. Scope answers:
- **Weighting → D28:** weights only among creatives Serving right now. Built as a live
  split, so the clock never rewrites stored weights. Typed weights persist and come back
  when a creative returns.
- **From the demo:** editable weights + reset only.
- **No shared creative yet** (D27 waits).
- **Build inheritance now:** Phase 2b done for all three levels.

Built: `Creative` in state (seeded per line item), `timeZoneSource` + migration,
`scheduleInheritance.ts` (cascade with wall-clock kept, reach text), `scheduleWeights.ts`,
`CreativesSection` (Schedule + Run State columns, weight field, reset) replacing
`CreativesStub`, the "Same as …" option in the picker, a coverage warning, and
cascade-aware warnings + D20. Verified in headless Chrome (weights 60/40 → 30/70 → clock
re-balance; Sydney cascade to 3 line items + 7 creatives with the Pacific override left
alone; a creative override surviving a line item zone change).

**Creatives aligned with production (same session).** The user shared production
screenshots of *Weighted Creatives* and its *Add Creatives* picker and asked to bring in
Add, align functionality as closely as possible, and drop Status (Run State replaces it).
Built: the title and subtitle, Add Weighted Creatives → a multi-select library search
(new creatives in the line item's zone, inherited; they start unscheduled since D29), trash-icon
remove with confirm, Pixel Name ("No Pixels"), row selection with count, pagination, and
weight sort. Also dropped Playback Mode and Actions, since production has neither. Verified
add/sort/remove and the weight re-split in headless Chrome.

**Fresh campaign flow (same session).** The user asked for a way to start a campaign from
scratch, per `_Assets-Reference/Campaing-Line-Item_Reference/` (advertiser page, Create
Campaign and Create Line Item forms, the new campaign and line item start pages). Notes:
start from the advertiser, Vertical = only the screenshot's entries, the top sections use
this prototype's formatting (which the user wants production to adopt), and a top-bar toggle
switches "preset sample" (today's data) and "demo" (build from the advertiser). Built: the
toggle with two persisted workspaces plus a demo restart, the Advertiser page, the two
Create dialogs, the campaign chevron → advertiser, and multi-campaign state (`campaigns[]`,
`campaignId` views, migration). Verified the whole demo build in headless Chrome.

**New entities start unscheduled → D29 (same session).** Reviewing a new campaign, the user
said a brand-new campaign shouldn't default to Immediate / Indefinite: the user should set
the dates. Scope answers: applies to all new entities (campaign, line item, creative), and
no auto-open of the editor (the page shows "Not set"). Built `unset` bounds, a Not
Scheduled run state, a "parent has no schedule yet" cause, an empty-editor start, and
warning skips. This departs from PRD R1, so it's flagged in the spec. Verified in headless
Chrome.

**Match parent schedule → D30 (same session).** The user asked for a "match parent
schedule" option so a line item (or creative) can take the campaign's (or line item's)
timeline without manual entry. Built as a one-time autofill button in the child editors,
reading "Matches …" when equal and disabled under an unscheduled parent. Verified in
headless Chrome.

**Prototype top bar (same session).** Added vertical dividers between Demo clock | Preset
sample / Demo (+ restart) | role, and moved the restart icon in next to the toggle. Then
the user said this prototype doesn't need the User / Admin toggle, so it's hidden behind
`SHOW_ROLE_TOGGLE` in `PageTopBar`, and a saved Admin role falls back to User. The admin
code paths are untouched.

#### Where things stand (end of 2026-10-01; superseded by the 10-14 summary below)

**Built and demoable** (two modes, via the top-bar toggle):
- **Preset sample:** campaign 4074 with 4 line items and 9 creatives across a spread of run
  states, warnings, and timezones (one Pacific override).
- **Demo:** start empty at the advertiser (Kerv) and build Create Campaign → Create Line
  Item → Add Weighted Creatives. Everything new starts **Not Scheduled** (D29).
- **Scheduling at all three levels:** shared editor (Timezone first, Immediate /
  Indefinite inside the date dropdowns, Match parent schedule), Run State chips, out-of-sync
  and coverage warnings, D20 stop-delivery confirmations, demo clock.
- **Timezone inheritance (D24–D26):** "Same as …" option, cascade with wall-clock times
  kept, reach text, overrides stay put.
- **Weighted Creatives (D28):** shares split among Serving creatives, editable weights,
  reset, sort, add from library, remove, row selection, pagination.
- **Navigation:** title chevrons open the parent (line item → campaign → advertiser).

**Decisions logged today:** D24–D30 (inheritance, override warning, overrides never
re-follow, shared-creative home rule, weighting among Serving, new entities unscheduled,
match parent schedule).

**Flags for the PRD owner:** D24 (children default to the parent's zone, not New York
everywhere) and D29 (no Immediate / Indefinite default) both refine PRD R1.

**Not built yet:** shared creatives (D27), a per-creative Active switch, per-line-item
distros (they're still shared demo data across line items and modes), the warnings roll-up
and top-bar bell (Phase 5), and the visual Artifact (Phase 7: must cover D12 and D24–D30).

**Housekeeping:** no git commits yet (the repo has none at all) and no remote. The dev
server runs detached on :5176.

### 2026-10-02 — Session 4: Time-log recalibration

- The user's rule for hours: **count only active time.** A 15+ minute gap with no response
  isn't work.
- Measured every session from the Claude Code transcripts (per-message timestamps)
  instead of estimating. The Sep 28 transcript survived, so Sessions 1 and 2 are now
  measured too. Session 3's first entry (2h 45m AI) dropped to ~43m.
- Running total: ~2h 21m Prompting / ~1h 21m AI Work.
- The measuring script now lives at `.claude/skills/log-time/measure_active.py`, and the
  skill uses it first.

### 2026-10-07 → 10-14 — Session 5: PRD review, product-lead feedback (D32), UX sweep

- **10-07:** reviewed the build against the PRD and requirements (info only). HubSpot was
  ruled back-end only (D31).
- **10-09:** restarted localhost, and prepared a walkthrough checklist for the product-lead
  review. It was simplified to UX only, since back-end engineering is separate.

**10-14:** the user presented to the product lead. Five adjustments came back:
1. Empty start/end auto-selects Immediate / Indefinite.
2. Immediate / Indefinite need no time.
3. Edits don't cascade between campaign, line item, and creative.
4. Instead of a Match button, empty line-item / creative dates follow the parent.
5. Show that the schedule is coming from the parent.

Interpreted and built as **D32**:
- Per-bound `inherit` on children, followed live.
- Campaigns default to Immediate / Indefinite again (D29 reversed).
- No zone cascade (D24–D26 superseded).
- Match removed (D30 replaced).
- "Same as campaign" first in the date dropdown, with a clear (×) on picked dates.
- "From campaign" captions in the editor, summaries, and tables.
- `effectiveSchedule` used everywhere for display and evaluation.
- A storage migration for old saves.

Verified in headless Chrome: a following creative tracks its line item's end change; clearing a
creative's end makes it follow; a campaign zone change leaves line items' stored
schedules untouched; a new campaign is Immediate → Indefinite (Serving); a new line item
reads "From campaign" with Save enabled and no time required.

- **Same session, follow-ups:**
  - Answered two questions (no changes): why line items under an Immediate → Indefinite
    campaign aren't all Serving (each level must pass its own window; a parent only
    blocks), and what "Immediate · Started …" means (the moment Immediate took effect).
    Suggested, not built: drop the timezone-mismatch warning when the parent has no
    specific times.
  - Built: edit-schedule pencil per row in the campaign's Line Items table.
  - UX sweep (user: the campaign view's line items had separate Start / End columns and
    the pencil only on End, unlike the line item's creatives table). Built a shared
    `ScheduleCell` used by all three tables, with Schedule → Run State order everywhere.
    The Campaigns table gained edit too. Also unified the "From campaign" style, save
    messages, and empty states.

---

#### Where things stand (end of 2026-10-14)

The user is pausing to sit with it before finalizing, and is moving to other projects
meanwhile. Built and demoable:
- **Two modes:**
  - **Preset sample:** campaign 4074, 4 line items, 9 creatives.
  - **Demo:** start at the advertiser and build a campaign, line items, and creatives.
- **Schedules at every level:** one shared editor with Timezone first and Immediate /
  Indefinite in the date dropdowns. Only a specific date needs a time.
- **D32 inheritance:**
  - Empty campaign dates = Immediate / Indefinite.
  - Empty line-item / creative dates follow the parent live ("From campaign"), per bound.
  - No cascading edits.
- **Tables use one Schedule column** (`ScheduleCell`, with a pencil) before Run State.
  Line items can be edited from the campaign view, and campaigns from the advertiser.
- **Weighted Creatives (D28):** shares split among Serving creatives; add, remove, sort,
  reset.
- **Also built:** warnings, D20 stop-delivery confirmations, and the demo clock.

**Decisions:** D1–D32 in the spec; superseded ones are marked inline.
**PRD flags still open:** D24's remnant (a child's zone defaults to its parent's) is
minor. D29's conflict with R1 is gone (reversed by D32).

## Open threads

- **Pick up here:** the user is reviewing at their own pace. Wait for their go-ahead or
  more feedback before changing behavior.
- **Next step 1, finalize the hand-off:**
  - Bring `docs/handoff-dynamic-scheduling.md` up to date as a clean read. The
    *What's built* sections are written per pass and partly superseded; consolidate them
    to the current behavior.
  - Build the visual **Artifact** (Phase 7): Serving = the PRD's computed "Active" (D12),
    D32 inheritance, D28 weighting, and Demo mode.
  - Finalize the Obsidian note.
- **Done 2026-10-16, committed and pushed** to the private repo
  `github.com/tggorton/Radius-Dynamic-Scheduling` (`main`):
  - `930f476`: the baseline, i.e. src + config exactly as in Radius-AdTags-Prototype
    @ `1d3cc2e`.
  - `ecc87bc`: the Dynamic Scheduling prototype and docs. Diff the two commits to see
    everything this phase changed.
  - The push used a temporary token inline only. `.git/config` holds the plain URL, and
    the keychain didn't store the token. **Revoke that token.**
- **Possible refinements (not requested):**
  - Skip the timezone-mismatch warning when the parent has no specific times.
  - Wording for "Immediate · Started …".
  - Pagination parity between tables.
- **Not built:**
  - Per-creative Active switch.
  - Shared creatives (D27).
  - Warnings roll-up (the bell).
  - Migration cases (R16–R17).
  - Distribution tags per line item.

## Process commitments (carried from the baseline)

- **Pushes are never automatic.** Only on explicit request, using a temporary PAT inline
  in the push URL (never written to `.git/config`). Verify the config is clean afterwards
  and revoke the PAT.
- **Port hygiene:** check `lsof -i :5176` before `npm run dev` (strict port).
- **Plan first** for non-trivial features; just do minor edits and fixes.
- **Time logging** via the `log-time` skill on request or after meaningful blocks.
