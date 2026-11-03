# Radius — Dynamic Scheduling (Q4 phase)

A clickable prototype of **Dynamic Scheduling** for Radius: granular run schedules
(start/end date + time, timezone, start-immediately, always-on) across campaigns, line
items, and creatives, plus a visible **running status** for each. React + TypeScript +
MUI v5, Vite. No backend — all state lives in React and persists to localStorage.

**This is a separate project built on a frozen baseline.** `src/` started as a copy of
`../Radius-AdTags-Prototype` at commit `1d3cc2e` (the Transcoding + 3rd-Party Push
prototype). Everything that baseline does must keep working here. That repo is the
record for the baseline features; it is never edited from here. Provenance, what was
changed at the split, and the baseline docs are in [docs/BASELINE.md](docs/BASELINE.md).
The feature spec for this phase is
[docs/handoff-dynamic-scheduling.md](docs/handoff-dynamic-scheduling.md).

`npm run dev` serves on **port 5176** (strict; the baseline uses 5174 and
`kerv-companion-demo` uses 5175, so all three can run side by side). `npm run build`
typechecks (`tsc --noEmit`) then builds. There is no test suite and no linter;
**typecheck is the gate**. Run `npx tsc --noEmit` before calling a change done.

Node comes from nvm (`~/.nvm`). A non-interactive shell may not have it on `PATH`, so
prefix commands with `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"` if
`npm` is not found.

## Dynamic Scheduling (this phase)

Scheduling is new work. Keep it separable from the baseline so the diff between the two
projects stays easy to read:

- Put scheduling domain logic in its own `src/lib/schedule*.ts` modules and its UI in its
  own components. Change baseline files only where scheduling has to hook in (for
  example `types.ts`, `AppContext.tsx`, or the section a schedule control appears in),
  and keep those edits small.
- Record every behavior and decision in
  [docs/handoff-dynamic-scheduling.md](docs/handoff-dynamic-scheduling.md). It is the
  living hand-off doc for this phase. Update its Changelog whenever it changes.
- Running status should reuse the shared [StatusChip](src/components/StatusChip.tsx)
  (dot + label) and follow the same readability rules as the two baseline statuses.

**What exists now** (full map in the spec's *Implementation map*):

- **Pages:** there's no router. `state.view` (`{ page: "advertiser" }`,
  `{ page: "campaign", campaignId }`, or `{ page: "lineItem", lineItemId }`) picks the page
  in [CurrentPage](src/components/CurrentPage.tsx). Navigate with `setView`. Each page's
  title chevron ([ParentMenuButton](src/components/ParentMenuButton.tsx)) opens a menu with
  its parent: line item → campaign → advertiser.
- **Preset sample / Demo** (top-bar toggle, prototype-only): `state.mode` picks the active
  workspace (`campaigns`, `lineItems`, `creatives`, `view`); the other sits in
  `state.parkedWorkspace`. Always filter line items by `campaignId`. There's no single
  `state.campaign`; pages receive their campaign as a prop. New entities come from
  `createCampaign` / `createLineItem` (builders in
  [newEntities.ts](src/lib/newEntities.ts)).
- **Domain:** [schedule.ts](src/lib/schedule.ts) (conversion, formatting, `evaluateRunning`),
  [timezones.ts](src/lib/timezones.ts), [scheduleWarnings.ts](src/lib/scheduleWarnings.ts),
  [scheduleMigration.ts](src/lib/scheduleMigration.ts) (converts older saved schedules),
  [scheduleTime.ts](src/lib/scheduleTime.ts) (time-field parsing / list),
  [scheduleWeights.ts](src/lib/scheduleWeights.ts) (D28 weighting among Serving creatives),
  [scheduleCalendar.ts](src/lib/scheduleCalendar.ts) (date-dropdown month grid),
  [hierarchy.ts](src/lib/hierarchy.ts) (campaign → line item → creative wiring and D20
  impact), and [runningStatus.ts](src/lib/runningStatus.ts).
- **No inheritance (D33, PRD R1):** every campaign, line item, and creative has its own
  schedule and timezone, defaulting to Immediate → Indefinite in New York. Children never
  take parent values, and parent edits never touch children. Don't reintroduce "follow the
  parent". **Creatives have no administrative status** (PRD R7): `Creative` has no
  `status`, and the evaluator treats a missing status as eligible.
- **Warnings (PRD R18):** "Starts before parent" / "Ends after parent" fire only for a
  child's *specific* start / end, never Immediate / Indefinite.
- **Schedules in tables** always use the shared [ScheduleCell](src/components/ScheduleCell.tsx)
  (one Schedule column + pencil, placed before Run State). Don't reintroduce separate
  Start / End columns.
- **Creatives** live in `state.creatives`, one line item each (`lineItemId`). Weight shares
  are computed with `weightShares`, never stored; only `customWeight` is.
- **`now` comes from `useApp()`.** It's the real instant plus the demo-clock offset, and it
  ticks every 15 s. Never call `Date.now()` in components for schedule logic, or the demo
  clock is bypassed.
- **Hard rule, D21:** a schedule value must never depend on the browser's timezone. Don't use
  `new Date("YYYY-MM-DDTHH:mm")`, `Date#getHours()`-style getters, or `toLocaleString()`
  without a `timeZone` for schedule values. Go through the `schedule.ts` helpers, which take
  the IANA zone explicitly. Native date/time inputs are fine as *string* sources only.
  QA check: change the computer's timezone and reload; nothing should change.
- **Vocabulary:** "Active"/"Inactive" is the *administrative* status (`AdminStatus`). The
  computed state is **Run State**, and its good value is **Serving**, never "Active" (D12).
- **Snackbars:** the baseline keeps one Snackbar in `DistrosSection`. The scheduling panels
  (`LineItemDetails`, `CampaignDetails`, `CreativesSection`) each own one for their own dialogs' `onSaved`
  messages, because DistrosSection isn't on the campaign page. Dialogs still never own a
  Snackbar.

The rest of this file is the baseline's architecture and conventions. They apply to
everything built here.

## Architecture

- [src/App.tsx](src/App.tsx) — `ThemeProvider` → `AppProvider` → sidebar + page sections.
  The page is a single line-item screen; most sections are static stubs.
- [src/state/AppContext.tsx](src/state/AppContext.tsx) — the entire app state, one
  `useReducer`. Persists to localStorage under `radius.scheduling.v1`.
- [src/lib/](src/lib/) — pure domain logic. **No React imports here.** Tag-string and
  URL construction lives in `tagBuilder.ts`; keep it out of components.
- [src/components/](src/components/) — one component per file, PascalCase filename.
- [src/theme.ts](src/theme.ts) — the single source of color, type, and component defaults.

Key domain distinctions:

- A **Template** is a reusable preset; a **Distro** is a self-contained snapshot created
  from one. Editing or deleting a template never retroactively changes existing distros.
- A **Platform** ([src/lib/pushTargets.ts](src/lib/pushTargets.ts)) is a push target —
  a DSP today (Nexxen, The Trade Desk), an SSP later. Both are literally platforms, so
  don't narrow the naming to "DSP". Advertisers are platform-scoped: each platform
  returns its own set, which is why the Advertiser dropdown depends on the Platform one.
- "Distro" always means a distribution *tag*, never a DSP/SSP. Say **Platform** for that.
- Distros carry **two independent statuses**, one column each, both rendered by the shared
  [StatusChip](src/components/StatusChip.tsx) (dot + label + optional suffix):
  - **Transcoding Status** (`Distro.status`, [src/lib/distroStatus.ts](src/lib/distroStatus.ts))
    — the creative/transcoding pipeline.
  - **Platform Status** (`Distro.platformStatus`, [src/lib/platformStatus.ts](src/lib/platformStatus.ts))
    — delivery to a push platform: `notPushed` (grey ring), `pushing` (amber), `success`
    (green), `error` (red). Driven by Push Tags to Platform; the per-distro `pushTarget`
    supplies the chip suffix ("Success: Nexxen"). Each has a "Set … status (prototype)"
    block in the ⋯ menu (prototype stand-ins; the backend owns both lifecycles).
- The transcoding status ([src/lib/distroStatus.ts](src/lib/distroStatus.ts)) values are
  `default` (green ring), `live` (green), `processing` (amber), `error` (red), `outOfSpec`
  (orange, `palette.outOfSpec`), `inactive` (grey).
  **The backend owns this lifecycle** — the UI reflects it and offers a restart.
  - `default` vs `live`: both green and both serve, but `default` means "running on the
    video baseline, no platform preset officially applied," while `live` means "conformed
    to a chosen preset." They're kept apart by a ring-vs-solid dot (`STATUS_META.outlined`),
    not by hue — so the label still can't be dropped.
  - `error` vs `outOfSpec`: `error` is a *run* failure (retrying may fix it); `outOfSpec`
    is a *config* problem — settings were manually overridden and may not meet the target
    platform's spec. Different colors because they demand different responses.
  - Restart is therefore valid from `inactive` (rebuild a dormant distro) and `error`
    (retry a failed transcode) only — never `live`, `processing`, or `outOfSpec`, where
    re-running the same overridden settings would just reproduce the problem
    (`isRestartable`).
  - The status column shows a dot **and** a label. Several states share warm colors, so
    color alone doesn't carry the meaning — don't drop the label.
  - When a real publisher preset is applied, the chip appends the pub — "Live: Hulu
    (Disney)", "Out of Spec: Hulu (Disney)" — derived from `activePublisher(state.transcoding)`
    (line-item-wide, so identical across rows). The full name shows at wide widths and the
    `shortName` ("Hulu") below MUI's `lg` breakpoint; adjust that breakpoint in
    `DistroStatusChip` if the cutoff needs tuning.
  - Two things in the UI are prototype stand-ins that disappear once the API lands: the
    "Set status" block in the ⋯ menu, and `RESTART_SIMULATION_MS` (which fakes the
    processing → live transition).
- **Transcoding** ([src/lib/transcodePresets.ts](src/lib/transcodePresets.ts)) is a
  per-line-item settings sheet (`AppState.transcoding`). One fixed field set
  (`TRANSCODE_FIELDS`, mirroring a publisher delivery spec) is shared by every preset,
  which differ only in *values*. Presets are **publisher** specs — DSPs (Nexxen, TTD) are
  push targets, not transcode presets. Only Hulu's numbers are from a real sheet; the rest
  are illustrative and marked as such.
  - **Presets are mutable admin state** (`AppState.transcodePresets`), seeded from
    `SEED_TRANSCODE_PRESETS` — same pattern as the mutable region/param catalogs. Because
    they're state, the helpers (`isCustomTranscoding`, `transcodeLandingStatus`,
    `activePublisher`, `describeTranscoding`) take the presets array as a second argument;
    pass `state.transcodePresets`. The `default` baseline is protected (`isProtectedPreset`)
    — not editable/deletable in the admin UI, and its id anchors the `default` status.
  - Admins (role toggle) get a pencil next to the Preset dropdown in Transcoding Settings
    that opens [ManageTranscodePresetsDialog](src/components/ManageTranscodePresetsDialog.tsx)
    (Save New / Update / Delete). Regular users don't see it. The field sheet itself is the
    shared [TranscodeFieldsGrid](src/components/TranscodeFieldsGrid.tsx), used by both.
  - Picking a preset fills the sheet; editing a field is a **one-off override for the
    line-item and never mutates the preset**. `isCustomTranscoding` = sheet diverges from
    its preset.
  - Applying settings re-transcodes every distro: all go `processing`, then land on
    `transcodeLandingStatus(config)` — `outOfSpec` if hand-edited, `default` if the
    untouched Default baseline, else `live`. New distros inherit this same landing status
    from the line-item's current config (not a hardcoded default). The `processing →
    landing` delay reuses `RESTART_SIMULATION_MS`, a prototype stand-in for the backend.
  - Preset numbers are illustrative, not real encoding specs. Hulu is the authoritative
    sheet the others were derived from.

## Conventions

Follow these when adding features — the codebase is consistent about them today.

### Styling

- **MUI `sx` props only.** No `styled()`, no CSS/SCSS files, no CSS modules, no
  `className`. This is a hard rule; there are currently zero exceptions.
- **Never hardcode a color.** Use theme tokens as `sx` strings: `primary.main`,
  `text.secondary`, `text.disabled`, `divider`, `background.paper`,
  `background.sunken` (recessed panels, e.g. TagPreview), `secondary.main` (nav blue).
  If you need a color that isn't in the theme, add it to the theme.
  The only literal hexes in the codebase are the brand SVG fills in `KervLogo.tsx`.
- **Monospace** (tag strings, param outputs, base URLs): import `MONO_FONT_STACK` from
  [src/theme.ts](src/theme.ts). Don't retype a font stack inline.
- Spacing uses the MUI scale (`px: 4`, `spacing={3}`), never raw pixel values.
- Prefer theme-level defaults over per-component overrides. Buttons, Tabs, TableCells,
  and OutlinedInputs are already themed in `theme.ts` — just use the component.

### Components

- Named arrow-function exports: `export const Foo = ({ ... }: Props) => ...`. No default
  exports (except `App`), no class components.
- Props typed via a local `interface Props` directly above the component.
- Domain types come from [src/types.ts](src/types.ts) — that's the single home for
  `Template`, `Distro`, `ParamDef`, etc. Don't re-export them from other modules.

### Dialogs

Most features here are dialogs, and they follow one shape. Copy an existing one
([ManageRegionsDialog.tsx](src/components/ManageRegionsDialog.tsx) is the cleanest
small example) rather than writing a new one from scratch.

- Props are always `{ open, onClose, onSaved?: (message: string) => void }`.
- `<Dialog maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: "background.paper", borderRadius: 1 } }}>`
  — `md` for form-heavy dialogs (Tag Editor, Manage Templates), `sm` for compact ones
  (Push Tags, Delete Templates), `xs` for the confirm dialog.
- The header is the shared [DialogHeader.tsx](src/components/DialogHeader.tsx): render
  `<DialogHeader title={...} onClose={onClose} />` for a top-level dialog or add
  `tier="sub"` for a nested one — don't hand-roll the `DialogTitle` + close-button block.
  (The one exception is [ConfirmDialog.tsx](src/components/ConfirmDialog.tsx), which has no
  close button by design.)
- Dismiss/close buttons use `color="primary"` (the `sx={{ color: "primary.main" }}` form is
  equivalent for text but loses the pink hover — don't use it).
- **Title hierarchy:** top-level dialogs (Tag Editor, Manage Templates) use a pink `h4`
  (`variant="h4"`, `color: "primary.main"`, `fontWeight: 400`). Nested sub-dialogs
  (Manage Regions / Params / Delete Templates) use a white `h6` (`fontWeight: 500`).
  Pick the tier that matches how the dialog is opened.
- Reset all form state in a `useEffect` keyed on `open`.
- **Dialogs never own a Snackbar.** Report success by calling `onSaved(message)`; the
  message bubbles up to the single `Snackbar` in
  [DistrosSection.tsx](src/components/DistrosSection.tsx). Informational warnings
  ("can't delete the last region") go through `onSaved` too.

### Confirmation and destructive actions

Never use `window.confirm` or `window.alert` — a native browser modal breaks the dark
theme. Use the promise-based hook in
[ConfirmDialog.tsx](src/components/ConfirmDialog.tsx):

```tsx
const { confirm, confirmDialog } = useConfirm();

const handleDelete = async () => {
  const ok = await confirm({
    title: "Delete region?",
    message: `"${name}" will be removed. This cannot be undone.`,
  });
  if (!ok) return;
  deleteRegion(id);
  onSaved?.(`Removed region "${name}"`);
};

// render {confirmDialog} once, anywhere in the returned tree
```

### State

All app state is in one reducer. Components never `dispatch` directly — they call
helpers off `useApp()`. To add a new piece of state, do all four steps:

1. Add/extend the type in [src/types.ts](src/types.ts) (and `AppState` if it's a new field).
2. Add a variant to the `Action` union in [AppContext.tsx](src/state/AppContext.tsx).
3. Add the `case` to `reducer` — return new objects, never mutate.
4. Add the helper to both `AppContextValue` and the `useMemo` value.

State auto-persists on every change. If you change the shape of a persisted entity,
add a migration in `loadFromStorage` (see `migrateCustomFields` / `migrateEntityRegion`
for the pattern) — users have existing localStorage and a bad load silently resets it.

### IDs

`newId()` from [src/lib/ids.ts](src/lib/ids.ts), with a domain prefix:
`` `tpl-${newId().slice(0, 8)}` ``, `param-…`, `region-…`.

## Roles

A `user` / `admin` toggle lives in the top bar (prototype affordance, not real auth).
**In this project it's hidden** (`SHOW_ROLE_TOGGLE` in
[PageTopBar](src/components/PageTopBar.tsx)), since nothing in scheduling is admin-gated, and
a saved Admin role falls back to User. The admin entry points below still exist; flip the
flag to reach them.
Admin-only affordances are gated on `state.role === "admin"`. The convention is an
**edit (pencil) icon next to the relevant dropdown inside a modal**, not a separate
top-level button — it opens the catalog manager for that thing:
- Tag Template dropdown in [TagEditorDialog](src/components/TagEditorDialog.tsx) → pencil →
  [ManageTemplatesDialog](src/components/ManageTemplatesDialog.tsx) (which itself nests the
  param and region managers via their own pencils).
- Preset dropdown in [TranscodingSettingsDialog](src/components/TranscodingSettingsDialog.tsx)
  → pencil → [ManageTranscodePresetsDialog](src/components/ManageTranscodePresetsDialog.tsx).

Keep new admin catalog-management entry points on this pattern rather than adding buttons
to the Distributions header.
