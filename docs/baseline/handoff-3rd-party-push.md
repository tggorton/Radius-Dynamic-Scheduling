# Distribution Tags — 3rd-Party Push · Prototype Hand-off

> **Living document (draft).** Reflects the prototype as of **2026-08-03** and will be
> updated as the design evolves. See the Changelog at the bottom.
> Companion doc: **Transcoding** (`handoff-transcoding.md`).
> **Frozen baseline copy** (snapshot `1d3cc2e`, 2026-09-28) — see [`../BASELINE.md`](../BASELINE.md). Not maintained in this project.

## Read this first

This is a **UX and functionality prototype**, not a partial implementation. There is no
backend and no real authentication — all state lives in the browser (localStorage), and
every external call (advertiser lookup, push) is **simulated**. Its job is to pin down the
intended behavior and screens so the team can scope and build the real thing. Each feature
below is split into *what the prototype does* vs. *what production needs to own*.

Stack: React + TypeScript + MUI. Runs at `localhost:5174` (`npm run dev`).

## Foundations (shared)

- **Two status lifecycles.** Every distribution tag carries **two independent statuses**,
  one column each: **Platform Status** (this doc) and **Transcode Status** (the Transcoding
  doc). A tag can be transcoded and live yet never pushed — or pushed and rejected.
- **Platform, not DSP.** Today a platform means a **DSP** (Nexxen, The Trade Desk); the
  naming deliberately spans **DSP and SSP** so supply-side targets fit later without renaming.
- **Readability.** Each status renders as a colored dot *and* a label; same-hue states are
  told apart by a **ring vs. solid** dot.
- **Prototype affordance to ignore in production:** each row's `⋯` menu has a "Set platform
  status" block so a reviewer can force any state (e.g. show an error) during a walkthrough.
  It disappears once the real push API drives status.

## Feature inventory

Everything the 3rd-Party Push track adds, at a glance — each is detailed in the sections
below.

**Pushing tags**
- **Push Tags to Platform** dialog — pick a platform + advertiser, choose which tags, push.
- **Platform-drives-selection** — choosing a platform auto-selects that platform's tags and
  disables the rest; switching platforms swaps the selection.
- **family→platform lock** — a tag can only be pushed to the platform it was built for (its
  `family`); one push targets exactly one platform.
- **Partial push** — uncheck any of a platform's tags before pushing; a live "N of M selected"
  count and a count-aware button (`Push 3 Tags`).
- **Add + Push / Save + Push** — push straight from the tag editor (in both create and edit
  mode), opening the flow pre-scoped to that tag's platform + that one tag.

**Advertiser model**
- **Platform-scoped advertisers** — each platform returns its own advertiser set; the
  advertiser dropdown is dependent on the platform (platform must be chosen first).
- **Name + ID display** — `Advertiser 1 · 012345` (ID format is a placeholder).
- **One advertiser per platform, locked globally** — the first push binds an advertiser to
  that 3rd-party platform **across all of Radius** (every line item, current and future — not
  just this one); after that the field is **disabled** (not just read-only), greyed, with a
  **lock icon** + a *contact support* tooltip. Each platform keeps its own advertiser.
- **Lock announced before it's set** — an inline notice on selecting an advertiser, plus a
  confirmation on the first push, both spelling out the account-wide scope in intentionally
  generic copy.
- **Async load with a stale-response guard** so a slow reply can't overwrite a newer
  platform's list.

**Platform Status (per distro)**
- A dedicated **Platform Status** column, fully independent of Transcode Status, rendered by
  the shared `StatusChip`.
- Five states — Not pushed / Pushing / Success / Error / Inactive — with the chip naming the
  destination (`Success: Nexxen`).
- **Link / Unlink row icon** — unlink a Success tag → Inactive (keeps the target); relink an
  Inactive/Error tag → Success. Both **confirm first**.

**Prototype-only affordances (gone in production)**
- `⋯` menu "Set platform status" block to force any state during a walkthrough.
- Optimistic push (always lands Success) and mocked advertiser lists.

## What it does

**Push Tags to Platform** (button in the Distributions section, disabled until at least one
tag exists) opens a dialog to choose a destination and exactly which tags to send.

- Advertisers are **scoped to the platform** — each platform returns its own set — so the
  platform must be chosen before the advertiser field enables.
- Each advertiser shows as **name + advertiser ID** — e.g. `Advertiser 1 · 012345`. *(The ID
  format is a placeholder; the real format is TBD.)*
- **One advertiser per platform, locked globally within Radius.** The **first** push to a
  platform sets its advertiser; every push after that **reuses it and the advertiser field is
  disabled** — not merely read-only. The field greys out, a **lock icon** sits at its right
  edge, and hovering it shows *"This advertiser is locked. Contact support to change the
  advertiser for this platform."* The binding is **account-wide across Radius** — the advertiser
  is locked to that 3rd-party system for every line item, current and future, not just this one.
  Each platform keeps its own advertiser (Nexxen and TTD independently). Rationale: linking a
  platform + advertiser is a **significant** backend association, so it's set once and changed
  only through support — never a casual self-serve toggle. *(In the prototype there's no in-app
  way to change a locked advertiser — clearing demo state resets it.)*
- **The lock is made explicit before it happens.** Because that first push is what sets the
  lock, the user is told twice: an **inline notice** appears under the advertiser field the
  moment an advertiser is chosen (before it's locked), and the first push raises a
  **confirmation** — *"Lock this advertiser to the platform?"* — spelling out that assigning an
  advertiser locks it to that 3rd-party system **globally within the Radius Platform**, for
  every line item and not just this one, and that it can't be changed without support. Later
  pushes reuse the locked advertiser silently. **The copy is intentionally generic** (no
  advertiser or platform name interpolated) so it never has to be generated per-platform.
- The advertiser list loads **asynchronously** with a spinner, and a stale-response guard
  keeps a slow reply from overwriting a newer platform's list.

## A tag can only go to its own platform

A tag is **built for one platform** — its `family` (Nexxen or TTD today) — and can only be
pushed there: a Nexxen tag → Nexxen, a TTD tag → The Trade Desk. One push targets a single
platform, and the platform **drives the selection**:

- The **platform picker always lists every platform** — the user can switch to any of them at
  any time.
- **Choosing a platform auto-selects that platform's tags** and disables the rest. Pick
  Nexxen and every Nexxen tag is checked, ready to push; switch to The Trade Desk and the
  selection swaps to the TTD tags. The user can still uncheck individual tags for a partial
  push.

So a distro list mixing Nexxen + TTD (+ future platforms) needs no manual sorting — the user
just picks the platform and pushes, then picks the next and pushes those. The mapping is a
direct lookup, so future platforms are covered as their family is added.

> In the prototype every tag is a Nexxen or TTD tag, so the platform options are exactly those
> two. **In the final version, tags sync with the platforms (DSPs / SSPs / etc.) directly** —
> the family→platform lock is the prototype stand-in for that sync. Users can still add
> custom key-values / macros regardless.

## Choosing what to push

- Until a platform is chosen, **nothing is selected** — the checklist prompts "Pick a platform
  to select its tags." Choosing one selects that platform's tags automatically.
- The dialog lists every tag with a checkbox; each row shows its **platform + current platform
  status**, and — for a tag already pushed — the **advertiser + ID it was last assigned to**
  (`Advertiser 1 · 012345`). So a user can see what's already gone out and where. Tags that
  don't belong to the chosen platform are disabled.
- A select-all toggle and a live "3 of 6 Nexxen tags selected" count cover the chosen
  platform's tags. The push button reflects the count — `Push 3 Tags` — and stays disabled
  until a platform, an advertiser, and at least one tag are selected.

## Add + Push / Save + Push (from the tag editor)

The tag editor has a **push button in both modes**, so a tag can be pushed the moment it's
created *or* any time afterward:

- **Add mode:** alongside **Add**, there's **Add + Push**.
- **Edit mode:** alongside **Save**, there's **Save + Push** — this closes the gap where a tag
  added without pushing had no easy per-tag push later.

Either one saves the tag, then opens the push flow **pre-scoped**: the platform is **locked to
the tag's family** (a Nexxen tag opens push locked to Nexxen) and that one tag is pre-selected.
With the sticky advertiser (above), the advertiser is often pre-filled too — so it can be a
single confirm.

## Platform Status — the states

| State | Color | Means |
|---|---|---|
| **Not pushed** | Grey **ring** | Never pushed to a platform (default for a new tag). |
| **Pushing** | Amber | Push in flight. |
| **Success** | Green | The platform accepted the tag. Chip names the destination — `Success: Nexxen`. |
| **Error** | Red | The push failed **or** the platform rejected the tag. |
| **Inactive** | Grey | Was linked to a platform, then **unlinked**. Chip keeps the platform — `Inactive: Nexxen`. |

On push, the selected tags go **Pushing**, then land **Success**, with the destination
recorded per tag (from the platform + advertiser chosen).

**Unlink / Link.** Each distro row has a **link/unlink icon** in its actions (right of the
transcode restart icon). The icon reflects **state**, and clicking it toggles:

- **Success** → **link-on** icon (actively linked) → click **unlinks** → **Inactive** (push
  target kept, so the chip reads `Inactive: Nexxen`).
- **Inactive** or **Error** → **link-off** icon (unlinked) → click **relinks** to the
  remembered platform → **Success**.
- **Not pushed / Pushing** → disabled (link-off, nothing to toggle).

**Both unlink and re-link ask for confirmation first** — they change the platform connection,
which shouldn't happen by accident (transcode restart is guarded the same way). The prompts are
generic ("…for this distribution?"), not platform-specific.

## In the prototype vs. For production

| In the prototype | For production |
|---|---|
| Advertiser lists are **mocked** — a fixed "Advertiser 1–10" per platform, with simulated latency. | Real **per-platform advertiser API** (each platform authenticated independently). |
| Pushing is **optimistic**: every push lands Success. No request leaves the browser. | Real **push API** returning success / error / rejection — the UI already models `pushing → success/error`. |
| Error/rejection shown only via the `⋯` "Set platform status" affordance. | Surface **rejection reasons** and a retry path on Error. |
| Only the **last** push target + status is kept per tag. | Persist **push history** (platform, advertiser, timestamp, outcome). |

## Implementation map (for the build team)

Where each piece lives today. All state is a single `useReducer` in
[`../../src/state/AppContext.tsx`](../../src/state/AppContext.tsx), persisted to `localStorage`
(`radius.adtags.v1`); components call helpers off `useApp()` and never `dispatch` directly.
Domain logic in `src/lib/` is pure (no React imports).

**Types** ([`../../src/types.ts`](../../src/types.ts))
- `PlatformStatus = "notPushed" | "pushing" | "success" | "error" | "inactive"`.
- `Distro.platformStatus: PlatformStatus` — the per-distro status.
- `Distro.pushTarget?: { platform; advertiser; advertiserId? }` — the last destination; drives
  the chip suffix (`Success: Nexxen`) and the relink action.
- `AppState.platformAdvertisers: Record<platformId, { id; name; advertiserId }>` — the locked
  advertiser per platform (the "one advertiser per platform" rule).

**Domain logic**
- [`../../src/lib/pushTargets.ts`](../../src/lib/pushTargets.ts) — `PUSH_PLATFORMS`,
  `platformForFamily(family)`, `PlatformAdvertiser`, and `fetchPlatformAdvertisers(platformId)`
  (mock async — **the swap point for the real per-platform advertiser API**).
- [`../../src/lib/platformStatus.ts`](../../src/lib/platformStatus.ts) — `PLATFORM_STATUS_META`
  (dot color / label / description per state), `PLATFORM_STATUS_ORDER`,
  `DEFAULT_PLATFORM_STATUS`.

**State / reducer** ([`../../src/state/AppContext.tsx`](../../src/state/AppContext.tsx))
- `setDistrosPlatformStatus(ids, status, target?)` — bulk-set status and record the target.
- `rememberPlatformAdvertiser(platformId, advertiser)` — sets the locked advertiser (first push
  only). Persisted under `platformAdvertisers`.

**Components**
- [`../../src/components/PushTagsDialog.tsx`](../../src/components/PushTagsDialog.tsx) — the push
  dialog: platform-drives-selection, the disabled+locked advertiser field (lock icon + tooltip),
  the stale-guarded advertiser fetch.
- [`../../src/components/DistroTable.tsx`](../../src/components/DistroTable.tsx) — the Platform Status
  column and the link/unlink row icon (state → icon, confirm → toggle).
- [`../../src/components/DistrosSection.tsx`](../../src/components/DistrosSection.tsx) — `handlePush`,
  `handleUnlinkPlatform`, `handleRelinkPlatform`.
- [`../../src/components/TagEditorDialog.tsx`](../../src/components/TagEditorDialog.tsx) — Add + Push /
  Save + Push (via the `onAndPush` callback).
- [`../../src/components/StatusChip.tsx`](../../src/components/StatusChip.tsx) — the shared
  dot + label + suffix chip (also used by Transcode Status).

**Backend swap points**
1. `fetchPlatformAdvertisers` → the real advertiser API (per-platform, independently authed).
2. `handlePush`'s optimistic `pushing → success` → the real push API returning
   success / error / rejection. The UI already models `pushing → success/error`, so only the
   data source changes.
3. Add **push-history** persistence — today only the last target + status is kept per distro.

## Open questions for the team

1. **Do SSPs use "advertisers," or a different association?** Supply-side may bind to a
   publisher or seat instead. If so, the second dropdown's *label* becomes platform-dependent,
   and the advertiser API needs to return the field name alongside the list.
2. **Should transcode state gate a push?** Right now any tag is pushable regardless of its
   transcode status. Should a non-Live tag (still processing, or errored) be blocked or warned
   before it can be pushed?
3. **Re-push semantics.** What happens when a tag already Successful is pushed again —
   overwrite, version, or no-op?

## Walkthrough

1. **Add distribution tags** — Distributions → *+ Add Distribution Tag*, choosing the **Nexxen**
   or **TTD** tab. Each appears with a `Not pushed` Platform Status.
2. **Add + Push** — while adding a Nexxen tag, click **Add + Push**. The push dialog opens with
   the platform **locked to Nexxen** and the new tag pre-selected; pick an advertiser and push.
3. **Platform drives the selection** — with a mix of Nexxen and TTD tags, open *Push Tags to
   Platform*, pick **Nexxen** → all Nexxen tags auto-select (TTD disabled) → push; then pick
   **The Trade Desk** → the selection swaps to the TTD tags → push those.
4. **Push just some** — after picking a platform, uncheck any of its tags you want to hold back
   before pushing.
5. **Show a rejection** — use a row's `⋯` menu to force **Error** on the platform status.

## Known limitations & not-yet-built

- No backend or real auth; all data is in the browser and resets if localStorage is cleared.
- Advertiser lookup and push are simulated (timers + mock data); no request leaves the browser.
- No push history and no retry/rejection-reason UI yet — both flagged above as production work.

## Changelog

- **2026-08-14** — **Corrected the lock scope: it's account-wide, not per-line-item.** The
  advertiser↔platform binding is locked **globally within Radius** — every line item, current
  and future — not just the current one. Reworded the inline notice, the confirmation, and the
  field helper accordingly (still generic copy); updated this doc's framing throughout.
- **2026-08-13** — **Advertiser lock is now announced before it's set.** Choosing an advertiser
  shows an inline notice, and the first push raises a confirmation. The copy is intentionally
  generic (no advertiser/platform name interpolated). *(Scope corrected 2026-08-14, above.)*
- **2026-08-13** — **Expanded for the build team.** Added a **Feature inventory** (every
  unique behavior at a glance) and an **Implementation map** (types, domain logic, state
  actions, components, and the backend swap points). No behavior change — documentation only.
- **2026-08-03** — **Locked advertiser is now fully disabled.** Once an advertiser is set for a
  platform, the field is **disabled** (not just read-only), with a **lock icon** and a tooltip
  directing the user to **contact support** to change it — making clear it's a support
  operation, not a self-serve control.
- **2026-08-03** — **Unlink and re-link now confirm.** Both platform-link toggles ask for
  confirmation first (generic prompts), paired with the same guard on transcode restart —
  guarding against accidental changes to a platform connection.
- **2026-08-03** — **One advertiser per platform, locked.** The first push to a platform sets
  its advertiser; further pushes reuse it with the field locked (no changing it — the backend
  linking is non-trivial). Each platform keeps its own. (Confirmed by product review.)
- **2026-08-03** — Tag editor's push button now works in **edit mode** too (**Save + Push**),
  so a tag added without pushing can be pushed later without the bulk dialog.
- **2026-08-03** — Added an **Inactive** platform status and a **link/unlink toggle**, exposed
  as an **icon** in each distro's row actions (right of the restart icon). The icon reflects
  state: **link-on** for Success (click unlinks → Inactive), **link-off** for Inactive/Error
  (click relinks → Success), disabled for Not pushed / Pushing.
- **2026-07-31** — Advertisers now show **name + advertiser ID** (`Advertiser 1 · 012345`;
  ID format is a placeholder). The push dialog's tag list also shows the **advertiser + ID
  each already-pushed tag is assigned to**.
- **2026-07-30** — Fixed **Add + Push** showing "No options" for advertisers: the advertiser
  fetch now also refires when the dialog opens (not only on platform change), so a pre-locked
  platform loads its advertisers even when it matches the previously-used platform.
- **2026-07-30** — Reworked the push editor to a **platform-drives-selection** model: the
  platform picker always lists every platform, and choosing one auto-selects that platform's
  tags (disabling the rest) so a mixed Nexxen+TTD list needs no manual sorting. Replaces the
  bidirectional lock (which limited the dropdown by the selection).
- **2026-07-29** — Added the family→platform push lock (a tag can only be pushed to the
  platform it was built for) and the **Add + Push** button in the tag editor (creates the tag
  and opens push pre-scoped, platform locked to the tag's family). Made the main push editor's
  lock **bidirectional** — selecting tags now limits the platform picker to their platform,
  not just the reverse. Noted that tags will sync with platforms directly in the final version.
- **2026-07-28** — Initial hand-off. Split out from the combined overview.
