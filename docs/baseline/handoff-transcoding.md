# Distribution Tags — Transcoding · Prototype Hand-off

> **Living document (draft).** Reflects the prototype as of **2026-08-03** and will be
> updated as the design evolves. See the Changelog at the bottom.
> Companion doc: **3rd-Party Push** (`handoff-3rd-party-push.md`).
> **Frozen baseline copy** (snapshot `1d3cc2e`, 2026-09-28) — see [`../BASELINE.md`](../BASELINE.md). Not maintained in this project.

## Read this first

This is a **UX and functionality prototype**, not a partial implementation. There is no
backend and no real authentication — all state lives in the browser (localStorage), and
every external call (transcode, etc.) is **simulated**. Its job is to pin down the intended
behavior and screens so the team can scope and build the real thing. Each feature below is
split into *what the prototype does* vs. *what production needs to own*.

Stack: React + TypeScript + MUI. Runs at `localhost:5174` (`npm run dev`).

## Foundations (shared)

- **Roles.** A top-bar toggle flips between a regular user and an admin (a stand-in for real
  auth). Admin-only tools appear as an **edit pencil next to the relevant dropdown inside a
  modal** — never as extra top-level buttons.
- **Two status lifecycles.** Every distribution tag carries **two independent statuses**,
  one column each: **Transcode Status** (this doc) and **Platform Status** (the Push doc). A
  tag can be transcoded and live yet never pushed.
- **Readability.** Each status renders as a colored dot *and* a label. Several states share
  warm colors, so color alone never carries the meaning; same-hue states are told apart by a
  **ring vs. solid** dot.
- **Prototype affordance to ignore in production:** each row's `⋯` menu has a "Set transcode
  status" block so a reviewer can force any state during a walkthrough. It disappears once the
  real backend drives status.

## Feature inventory

Everything the Transcoding track adds, at a glance — each is detailed in the sections below.

**Applying presets**
- **Transcoding Settings** modal — a per-line-item sheet that applies **one or more presets**;
  every distro is transcoded **once per preset**.
- **~15 fields** grouped Video / Audio (mirroring a publisher delivery spec), shared by every
  preset — presets differ only in *values*, never in which fields exist.
- **Collapsible preset rows** — collapsed by default; expand a row to view/edit its fields.
- **+ Add Preset** — inserts a new row at the top and scrolls to it; rows are separated by
  hairline dividers (no boxed cards).
- **Per-line-item overrides** — editing a field is a one-off for this line-item and **never
  mutates the preset**; a "Modified" chip flags a diverged row.
- **Incremental apply** — only new or changed presets reprocess; unchanged presets keep each
  distro's current status.
- **Delete a preset** — dropping one of several is immediate; deleting the **last** confirms →
  resets to the Default baseline (which always remains — it's the floor).

**Presets & the admin catalog**
- Presets are **publisher specs** (Hulu from a real sheet; ~23 CTV pubs illustrative). DSPs are
  **push targets, not presets**.
- **Mutable admin catalog** — admin pencil beside the preset picker → Save New / Update /
  Delete. The `Default` baseline is protected (not editable or deletable).
- The **Default baseline reads as "not set"** — muted picker, no floating label — distinct from
  an official preset selection.

**Transcode Status (per distro)**
- A dedicated **Transcode Status** column, fully independent of Platform Status, rendered by the
  shared `StatusChip`.
- Six states — Default (green ring) / Live / Processing / Error / Out of Spec (orange) /
  Inactive — where color alone never carries meaning (ring-vs-solid + label).
- **One chip per applied preset**, stacked; each names its publisher (`Live: Hulu (Disney)`),
  shortening to `Live: Hulu` on narrow screens.
- **Landing logic** — a config lands `outOfSpec` if hand-edited, `default` if it's the untouched
  baseline, otherwise `live`. New tags inherit the line-item's current plan.
- **Restart row icon** — re-transcodes the whole plan; enabled **only** when a transcode is
  Inactive or Error (never re-runs Out-of-Spec overrides); confirms first.

**Prototype-only affordances (gone in production)**
- `⋯` menu "Set transcode status" block to force any state during a walkthrough.
- `Processing → landing` is a fixed timer (`RESTART_SIMULATION_MS`), a stand-in for the pipeline.

## What it does

**Transcoding Settings** (button in the Distributions section, available to all users) opens
a per-line-item panel that applies **one or more presets**. Every distribution tag is
transcoded **once per preset**, and each tag's applied presets and their statuses show as a
stack of chips in its **Transcode Status** column — so the plan is read per-distro in the
table, not from a section subheading.

- The panel shows a **list of preset rows**. Each row is a **preset picker** over ~15 fields
  grouped **Video / Audio** (container, codec, resolution, aspect ratio, duration, bitrate,
  frame rate, scan type, chroma, color, audio codec / sample rate / bitrate / channels,
  loudness).
- **The settings are collapsed by default.** Expand a row (chevron) to see and edit its
  fields; collapse it again to keep the panel tidy.
- A **"+ Add Preset"** adds a new row **at the top** (collapsed) and **scrolls to it**, so
  the addition is visible even when a row lower down is expanded. Rows are separated by
  hairline dividers (no boxed cards).
- A **trash** icon removes a preset. Deleting one of several just drops it; deleting the
  **last** one prompts a confirm ("returns the transcoding settings to Default") and, on
  confirm, resets the plan to the Default baseline. Delete is **disabled** only when the sole
  preset is *already* Default — Default is the floor and always remains.
- Picking a preset **fills that row's sheet**. Editing any field is a **one-off override for
  this line-item and never mutates the preset**; a "Modified" chip appears on that row when it
  diverges.
- **Applying only reprocesses what's new or changed.** A preset unchanged since the last
  apply keeps each tag's current status; a **newly added** preset, or one whose **settings
  were edited**, goes Processing → its landing status. So adding "Netflix" to an
  already-applied "Hulu, ABC, Peacock" reprocesses **only Netflix** — the rest stay put.
  (Changed = same preset with different settings, or a preset the previous plan didn't have.)

## Presets & the admin catalog

- Presets are **publisher specs** — a protected `Default` baseline plus **23 CTV publishers**
  (Hulu, Disney+, ESPN, Peacock, Paramount+, Netflix, Amazon, Max, Tubi, Roku Channel, Pluto,
  Xumo, Samsung TV Plus, LG Channels, Vizio WatchFree+, …).
- **Only Hulu's numbers come from a real spec sheet.** The rest are **illustrative**, varied
  by platform tier (premium ad-SVOD run higher bitrate / 5.1; FAST channels run lighter) and
  clearly marked as such in code.
- The catalog is **mutable admin state**. Admins get a **pencil** beside the preset picker
  that opens a manager to **Save New / Update / Delete** presets — i.e. add new pubs. The
  `Default` baseline can't be edited or deleted. Regular users just pick and apply.
- DSPs (Nexxen, The Trade Desk) are **push targets, not transcode presets** — they live in the
  Push flow, not here.

## Transcode Status — the states

| State | Color | Means | Restart? |
|---|---|---|---|
| **Default** | Green **ring** | Running on the video baseline — no publisher preset officially applied. Serves fine, but distinct from Live so an un-set line item is visible. | — |
| **Live** | Green | Conformed to a chosen preset; ready to serve. Chip names the pub — `Live: Hulu (Disney)`, shortening to `Live: Hulu` on narrow screens. | — |
| **Processing** | Amber | Transcoding in flight (after Apply, or after a restart). | — |
| **Error** | Red | The transcode **run** failed. Retrying may fix it. | **Yes** — retry |
| **Out of Spec** | Orange | Settings were manually overridden and may not meet the target pub's spec. A **config** problem, not a run failure — orange to separate it from Error red. | **No** — fix settings |
| **Inactive** | Grey | Dormant / off. | **Yes** — rebuild |

**One status per applied preset.** Each tag now shows a **stack of status chips in the
Transcode Status column — one per preset applied** (e.g. `Live: Hulu (Disney)` above
`Out of Spec: Netflix`). Each chip names its preset. **Landing per config:** `outOfSpec` if
that row was hand-edited, `default` if it's the untouched baseline, otherwise `live`. New tags
inherit the line item's current plan (one transcode per applied preset).

**Restart:** a per-row restart icon re-transcodes the tag against the **current line-item
plan** (all its transcodes → Processing → their landing statuses). It's enabled when any of
the tag's transcodes is **Inactive** or **Error**; disabled otherwise. **Restart asks for
confirmation first** so it can't be triggered by accident. The `⋯` "Set transcode status"
affordance forces **all** of a tag's transcodes to one status (prototype only).

## In the prototype vs. For production

| In the prototype | For production |
|---|---|
| Preset numbers are **illustrative** — only Hulu is a real sheet. | Load **real publisher specs**; likely constrain valid options per pub. |
| `Processing → Live` is a fixed timer, not a real transcode. | Apply kicks a **real re-transcode**; status comes from the pipeline (webhook / poll). |
| Option lists are a flat superset; a preset does not **constrain** which options are valid. | Model **per-pub option constraints** and validate overrides against them. |
| Catalog edits persist to localStorage. | Persist the admin **preset catalog** server-side with real auth. |
| Backend does not exist. | The **backend owns the transcode lifecycle** — the UI reflects state and offers restart. |

## Implementation map (for the build team)

Same architecture as the Push track — one `useReducer` in
[`../../src/state/AppContext.tsx`](../../src/state/AppContext.tsx), `localStorage`-persisted, helpers
off `useApp()`, pure logic in `src/lib/` (no React imports).

**Types** ([`../../src/types.ts`](../../src/types.ts))
- `DistroStatus = "default" | "live" | "processing" | "error" | "outOfSpec" | "inactive"`.
- `DistroTranscode = { presetId; status: DistroStatus }`; `Distro.transcodes: DistroTranscode[]`
  — one entry per applied preset (replaced a single `status`, with a migration).
- `TranscodingConfig = { presetId; settings }` — a row in the line-item plan;
  `AppState.transcoding: TranscodingConfig[]`.
- `TranscodePreset` (id, name, settings, …); `AppState.transcodePresets: TranscodePreset[]` —
  the mutable admin catalog.

**Domain logic**
- [`../../src/lib/transcodePresets.ts`](../../src/lib/transcodePresets.ts) — `TRANSCODE_FIELDS` (the
  shared field sheet), `SEED_TRANSCODE_PRESETS`, `DEFAULT_PRESET_ID`, `isProtectedPreset`, and
  the preset-aware helpers `findPreset`, `settingsEqual`, `isCustomTranscoding`,
  `transcodeLandingStatus`, `transcodePublisher`, `describeTranscodings` (each takes the presets
  array as an argument — pass `state.transcodePresets`).
- [`../../src/lib/distroStatus.ts`](../../src/lib/distroStatus.ts) — `STATUS_META` (dot color / label /
  description / `outlined` per state), `STATUS_ORDER`, `isRestartable`, and
  `RESTART_SIMULATION_MS` (the prototype Processing→landing timer).

**State / reducer** ([`../../src/state/AppContext.tsx`](../../src/state/AppContext.tsx))
- `setTranscodings(configs)` — set the line-item plan (drives the incremental-apply diff).
- `setDistroTranscodes` / `setDistrosTranscodes` — set one / many distros' per-preset statuses.
- Preset CRUD — add / update / delete transcode presets (`Default` protected).

**Components**
- [`../../src/components/TranscodingSettingsDialog.tsx`](../../src/components/TranscodingSettingsDialog.tsx)
  — the apply modal (collapsible rows, + Add Preset, incremental apply).
- [`../../src/components/ManageTranscodePresetsDialog.tsx`](../../src/components/ManageTranscodePresetsDialog.tsx)
  — the admin catalog manager (Save New / Update / Delete).
- [`../../src/components/TranscodeFieldsGrid.tsx`](../../src/components/TranscodeFieldsGrid.tsx) — the
  shared Video/Audio field sheet, used by both dialogs.
- [`../../src/components/DistroTable.tsx`](../../src/components/DistroTable.tsx) — the Transcode Status
  column (stacked chips) + the restart row icon.
- [`../../src/components/StatusChip.tsx`](../../src/components/StatusChip.tsx) — the shared chip (also
  used by Platform Status).

**Backend swap points**
1. The `Processing → landing` timer (`RESTART_SIMULATION_MS`) → the real transcode pipeline;
   status arrives via webhook/poll. The backend owns the lifecycle; the UI reflects it.
2. Preset catalog persistence → server-side with real auth (today localStorage).
3. Per-publisher **option constraints** → validate overrides against the target pub's real spec
   (today the field options are a flat superset with no per-pub constraint).

## Open questions for the team

1. **Should editing a preset re-flag line items that already used it?** A line item snapshots
   its settings, so after an admin edits (say) the Hulu preset, an existing "Live: Hulu" item
   reads as "Hulu (modified)" against the new spec. Desirable signal, or should edits leave
   existing line items untouched?
2. **Is the Default baseline "in spec"?** Currently a clean Default lands green (its own
   state), not Live and not Out of Spec. Confirm that's the intended treatment for "no pub
   chosen yet."
3. **Per-pub option constraints.** Real specs allow only certain codecs/resolutions per
   publisher. Model that, or keep the flat option set?

## Walkthrough

1. **Add a distribution tag** — Distributions → *+ Add Distribution Tag*. It appears with one
   Transcode Status chip per applied preset.
2. **Apply multiple presets** — *Transcoding Settings* → the first row is Default → change it
   to **Hulu** → **+ Add preset** → set the new row to **Netflix** → **Apply**. Every tag now
   shows two chips: `Live: Hulu` and `Live: Netflix`.
3. **Override one preset** — expand the Netflix row (chevron), tweak a field ("Modified"
   appears), Apply → that tag's Netflix chip lands **Out of Spec** while Hulu stays Live.
4. **Manage presets as admin** — flip the top-bar toggle to **Admin**, open Transcoding
   Settings, and use the **pencil** to add or edit a publisher preset.
5. **Show failure & recovery** — use a row's `⋯` menu to force **Error**, then the **restart**
   icon to re-transcode the whole plan.

## Known limitations & not-yet-built

- No backend or real auth; the role is a toggle and data resets if localStorage is cleared.
- The transcode itself is simulated (a timer), not a real pipeline.
- Illustrative preset specs for every publisher except Hulu.
- No per-pub option constraints yet.

## Changelog

- **2026-08-13** — **Expanded for the build team.** Added a **Feature inventory** (every unique
  behavior at a glance) and an **Implementation map** (types, domain logic, state actions,
  components, and the backend swap points). No behavior change — documentation only.
- **2026-08-03** — **Dropped the Distributions section subheading.** The line-item's transcode
  plan was echoed as a `Transcoding: …` subtitle under the section title; it's redundant now
  that each distro's Transcode Status column shows a chip per applied preset, so the subheading
  was removed (the section has no subtitle).
- **2026-08-03** — **Restart now confirms.** A confirmation dialog guards the per-row restart
  so a re-transcode isn't triggered by accident.
- **2026-07-31** — **Incremental apply.** Applying now reprocesses only new or changed presets
  (Processing → landing); presets unchanged since the last apply keep each distro's current
  status. Editing a preset's settings counts as changed. (State: apply diffs the new plan
  against the previously-applied one and updates each distro's transcodes per-preset.)
- **2026-07-30** — A row set to the **Default baseline** shows its preset picker in an
  enabled-but-not-active state: **no floating "Preset" label** and muted interior text (solid
  border unchanged), so it doesn't read as an official preset selection — mirroring the
  green-ring `default` status chip. A chosen preset shows the label and normal text.
- **2026-07-30** — Preset rows lost their boxed cards (hairline dividers between them instead).
  Delete is now always available: deleting the last preset confirms and resets the plan to
  Default rather than being blocked.
- **2026-07-30** — "+ Add Preset" now inserts the new row at the **top** and scrolls to it, so
  the addition stays in the user's sightline instead of appearing off-screen below an expanded
  row.
- **2026-07-30** — **Multiple presets per line-item.** The modal now applies a list of presets
  (collapsible rows, "+ Add preset" / remove); every distro is transcoded once per preset and
  the Transcode Status column shows one chip per applied preset. Restart re-transcodes the
  whole plan. Data model: `AppState.transcoding` is now a `TranscodingConfig[]` and each
  distro holds a `transcodes: { presetId, status }[]` (was a single `status`), with a
  migration from the old shape.
- **2026-07-28** — Initial hand-off. Split out from the combined overview.
