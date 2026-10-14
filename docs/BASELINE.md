# Baseline — where this project came from

This project is a **separate build**, not a branch of the earlier prototype. Its `src/`
started as a snapshot of that prototype. The snapshot is frozen here as the baseline that
Dynamic Scheduling builds on.

| | |
|---|---|
| **Source project** | `../Radius-AdTags-Prototype` (same Dropbox `Projects/` folder) |
| **Source repo** | [`tggorton/Tag-Distribution_3rdPartyPush-Transcoding_v1`](https://github.com/tggorton/Tag-Distribution_3rdPartyPush-Transcoding_v1) |
| **Snapshot commit** | `1d3cc2e` — *3rd-Party Push: advertiser lock is account-wide across Radius, not per line item* (2026-09-03) |
| **Snapshot taken** | 2026-09-28 |
| **Git history** | Not carried over. This repo starts fresh; the source repo is the history for everything up to the snapshot. |

## Rules

- **The source project is never edited from here.** Baseline bug fixes found while
  working here are fixed here. If the fix also matters to the source project, note it in
  the [session log](../SESSION_LOG.md) so it can be ported on purpose.
- **Every baseline behavior must keep working.** That covers tag templates, distros, the
  admin catalogs, Transcoding, and 3rd-Party Push. Scheduling adds to the app and does not
  replace any of it.

## What changed at the split

Only what was needed for the two projects to run side by side:

| Change | From → To | Why |
|---|---|---|
| Dev port | `5174` → `5176` | Run next to the baseline (5174) and `kerv-companion-demo` (5175). |
| localStorage key | `radius.adtags.v1` → `radius.scheduling.v1` | Keep demo state clearly separate. The port change already puts it on a separate origin. |
| `package.json` name | `radius-adtags-prototype` → `radius-dynamic-scheduling` | Identity. |
| Page `<title>` | *Radius — Ad Tags Prototype* → *Radius — Dynamic Scheduling* | Tell the browser tabs apart. |

Nothing else in `src/` was changed.

**Not copied:** `_Code-Reference/` and `_Image-Reference/` (design inputs for the
baseline features; they stay in the source project), the source `SESSION_LOG.md` /
`TIME_LOG.md` (history for the baseline), `node_modules/`, and `dist/`. The `log-time`
project skill was copied to `.claude/skills/`.

## Baseline docs (frozen copies)

These describe features that exist in this app unchanged. They are frozen at the snapshot
and are **not** living docs here. Their source-code links were adjusted to resolve from
this folder.

| Feature | Doc |
|---|---|
| Transcoding | [baseline/handoff-transcoding.md](baseline/handoff-transcoding.md) |
| 3rd-Party Push | [baseline/handoff-3rd-party-push.md](baseline/handoff-3rd-party-push.md) |
| 3rd-Party Push (visual page source) | [baseline/artifacts/handoff-push.html](baseline/artifacts/handoff-push.html) |

Published baseline Artifacts, owned by the earlier Claude account:
[Transcoding](https://claude.ai/code/artifact/4d591c16-e0ca-47a3-821b-aeb8e410039f) ·
[3rd-Party Push](https://claude.ai/code/artifact/3d3e2a14-5296-4beb-b21c-654a60b5451e).

For the narrative behind baseline decisions (the *why*), read the source project's
`SESSION_LOG.md` and `docs/RESUME.md`.
