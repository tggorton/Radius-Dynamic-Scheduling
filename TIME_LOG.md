# Time Log — Radius Dynamic Scheduling

Effort for the Dynamic Scheduling phase only. Baseline effort (Sessions 1–12, ~7h 46m
Prompting / ~17h 05m AI Work) is in the source project's `TIME_LOG.md`.

Tracks approximate effort across the project's lifecycle in two columns:

1. **AI Work** — wall-clock between meaningful checkpoints (commits, push
   points), minus obvious idle gaps.
2. **Prompting** — user time spent reading my output, deciding next
   steps, and typing prompts. Estimated per-message via archetype.

If a Prompting estimate feels off, say so and I'll recalibrate the
per-archetype defaults so future entries land closer.

## Methodology

### AI Work column (well-grounded)

Anchored on git commit timestamps and tool-call cadence. Each block is
wall-clock between commits or visible session boundaries, minus obvious
idle stretches (long gaps between messages where the user was clearly
away). Roughly accurate ±5–10 min.

### Prompting column (estimated)

Per user message:

```
prompting_time =
    reading_time   (user reading my prior response)
  + thinking_time  (deciding, weighing options)
  + typing_time    (user_message_chars / ~130 chars-per-min)
```

Three rough archetypes I classify each user message into:

| Type | Pattern | Reading | Thinking | Typing |
|---|---|---:|---:|---:|
| **Quick approval** | "go", "yes", "looks good" | 1–2m | ≤30s | ≤30s |
| **Decision / lightweight** | choosing between options, brief feedback | 2–3m | 1–2m | 1–3m |
| **Intricate** | technical prompts with context, bug reports with screenshots/repros, multi-decision messages | 3–5m | 3–8m | 4–10m |

**What's NOT counted as Prompting:**

- Time the AI is working (tool calls, file writes, builds, agent
  exploration) — user can be doing other things in parallel, even if
  some of it requires occasional approval clicks. Those clicks
  themselves are minimal and absorbed into the next message.
- Visual verification time clicking through the live app between
  prompts.
- Breaks, meetings, or errands during long gaps.

**What IS counted:**

- Reading my output before responding.
- Deciding on next steps or approach.
- Typing the message itself.
- Reviewing actual file changes before replying (e.g. opening files I
  edited and reading them).

### Calibration note

Commit-timestamp arithmetic over-credits AI Work for stretches where
the human is actually doing the work — reading, taking screenshots,
composing a debug report, verifying in the browser, away from the
desk. The AI is *not* running tools during those stretches even
though the wall-clock keeps moving.

The reduction factor depends on commit density. Dense-commit sessions
(steady AI-driven cadence) need a smaller cut than sparse-commit
sessions (one big commit covers hours of conversation):

| Commit pattern | Reduction off raw wall-clock |
|---|---|
| **Dense** (multiple commits per hour) | 20–25% |
| **Moderate** (1–2 commits per hour) | 30–40% |
| **Sparse** (1 commit per several hours, conversation-heavy) | 50–60% |

**Cross-session recalibration (2026-05-05).** Initial pass used a
flat ~20–25% reduction across all sessions — too generous for the
sparse-commit days. After user feedback that Session 5 (4h window,
2 commits) wasn't actually 4h of active AI tool time, applied the
density-aware reductions retroactively to all five sessions:

| Session | Commits | Density | Original | Recalibrated | Cut |
|---|---:|---|---:|---:|---:|
| S1 (04-25) | 2 | Moderate (heavy scaffolding) | 188m | 120m | 36% |
| S2 (04-27) | 3 | Moderate | 93m | 60m | 35% |
| S3 (04-28) | 2 | Moderate-dense | 45m | 35m | 22% |
| S4 (04-29) | 1 | Sparse | 98m | 55m | 44% |
| S5 (05-05) | 2 | Sparse | 263m | 117m | 56% |

Prompting figures stayed unchanged — those are anchored on
per-message archetype × character count, and the human is the
authority on their own time anyway. The codified methodology lives
at `.claude/skills/log-time/SKILL.md` for future sessions.

### Measured method (2026-10-02) — use this whenever transcripts exist

The user's rule: **don't count dead time.** If they don't respond for 15+ minutes after the
last back-and-forth, that stretch isn't work. Commit-density estimates can't see this, and
for Session 3 they overstated AI Work about 4× (2h 45m estimated vs ~43m measured).

Claude Code writes every message with a timestamp to
`~/.claude/projects/<project-path>/<session-id>.jsonl`. From those:

- **AI Work** = the time from each user message to the last AI/tool event before the
  next user message, summed per message. Any single gap of 15m+ inside that stretch is
  dropped as idle.
- **Prompting** = the gap from the AI's last event to the user's next message. Gaps under
  15m count in full. A gap of 15m+ is idle, and only **5m** of it is credited (reading +
  typing). Time spent answering an AskUserQuestion prompt counts as Prompting, not AI Work.
- Machine clock is Central; transcripts are UTC; tables are written in ET.

The script lives in the session scratchpad (`active2.py`); the logic is in the skill.

---

## Sessions

All sessions below are **measured from the Claude Code transcripts** (per-message
timestamps), not estimated. See *Measured method (2026-10-02)* above.

### 2026-09-28 — Session 1: Project setup + planning passes 1–5

**Wall-clock span:** 2026-09-28, 3:08–5:53 PM ET. Idle excluded: ~1h 45m (two long gaps of 42m and 64m).

| Block | Prompting | AI Work | Notes |
|---|---:|---:|---|
| Kickoff + setup | 0m | 5m | Snapshot the baseline into a new project, retarget port/storage/name, docs + spec skeleton. |
| Planning passes 1–5 | 46m | 8m | Seven messages, mostly intricate decision answers (hierarchy, PRD, timezone rules, D1–D23). |
| **Session subtotal** | **~46m** | **~13m** | Replaces the earlier estimate (8m / 20m), which predates the measured method. |

### 2026-09-28 — Session 2: Initial build (line item + campaign views)

**Wall-clock span:** 2026-09-28, 6:14–6:30 PM ET.

| Block | Prompting | AI Work | Notes |
|---|---:|---:|---|
| Initial build + verification | 6m | 15m | Domain layer, seeded campaign, line-item schedule row, campaign page, editor, timezone picker, demo clock, headless-Chrome checks. |
| **Session subtotal** | **~6m** | **~15m** | Previously unlogged (the chat was "lost" but its transcript survived). |

### 2026-09-30 → 10-01 — Session 3: Review feedback, inheritance, creatives, fresh-campaign flow

**Wall-clock span:** 2026-09-30 2:10–2:31 PM ET; 2026-10-01 12:42–5:43 PM ET. Idle excluded:
the overnight gap plus ~3h 20m of 15m+ gaps on 10-01 (the longest were 51m, 62m, and 39m).

| Block | Prompting | AI Work | Notes |
|---|---:|---:|---|
| Context recovery + localhost + chevron menu (09-30) | 7m | 2m | Re-read docs/vault, restarted the dev server, breadcrumb → chevron parent menu. |
| Schedule editor rework | 5m | 3m | Immediate/Indefinite in the Date dropdown (custom calendar), Timezone first. |
| Timezone inheritance planning (D24–D27) | 24m | 5m | Docs only; four decision-heavy messages plus question rounds. |
| Creatives pass (D28 + Phase 2b) | 13m | 12m | Multi-creative repo review, creative schedules, weighting among Serving, inheritance cascade, browser tests. |
| Creatives aligned with production | 5m | 4m | Weighted Creatives layout, Add Creatives, remove, selection, sort. |
| Fresh campaign flow | 5m | 7m | Preset sample / Demo workspaces, Advertiser page, Create dialogs, multi-campaign state. |
| Unscheduled new entities (D29) + Match parent (D30) | 14m | 5m | Includes one question round. |
| Top-bar polish + hide role toggle | 6m | 1m | |
| Logging for the day | 5m | 2m | Session log, Obsidian, first (overstated) time entry. |
| **Session subtotal** | **~1h 24m** | **~43m** | The first entry for this session estimated 1h 30m / 2h 45m from elapsed wall-clock. Measuring showed most of each block was the user reviewing, testing, or away. |

### 2026-10-02 — Session 4: Time-log recalibration

| Block | Prompting | AI Work | Notes |
|---|---:|---:|---|
| 15-minute idle rule + measured method | 5m | 4m | Built the transcript measurement, rewrote S1–S3, updated the skill. |
| **Session subtotal** | **~5m** | **~4m** | Re-measured on 10-14 (first written as an in-progress estimate of 10m). |

### 2026-10-07 → 10-14 — Session 5: PRD review, product-lead feedback (D32), UX sweep

**Wall-clock span:** 10-07 1:19–1:30 PM ET; 10-09 1:30–2:30 PM ET; 10-14 12:46–2:10 PM ET.
Idle excluded: the multi-day gaps plus ~1h 25m of 15m+ gaps (presentation prep and review).

| Block | Prompting | AI Work | Notes |
|---|---:|---:|---|
| PRD / requirements review + HubSpot → D31 (10-07) | 10m | 2m | Info-only report, then one decision. |
| Localhost restarts + presentation checklists (10-09) | 15m | 1m | Full then simplified UX-only walkthrough lists. |
| Product-lead feedback → D32 build (10-14) | 9m | 8m | Inherit bounds, no cascade, defaults back to Immediate / Indefinite, Match removed, migration, browser tests. |
| Run-state and "Immediate · Started" questions | 10m | 1m | Info only, no changes. |
| Campaign-view line item editing + UX consistency sweep | 8m | 3m | Shared `ScheduleCell`, Schedule → Run State everywhere. |
| Logging | 3m | 3m | Session/time logs, Obsidian, memory. |
| **Session subtotal** | **~55m** | **~18m** | Measured from transcript timestamps (15m idle rule). |

## Running totals

| Session | Prompting | AI Work |
|---|---:|---:|
| Session 1 (2026-09-28) — Setup + planning | 46m | 13m |
| Session 2 (2026-09-28) — Initial build | 6m | 15m |
| Session 3 (2026-09-30 → 10-01) — Review feedback, inheritance, creatives, fresh-campaign flow | 1h 24m | 43m |
| Session 4 (2026-10-02) — Time-log recalibration | 5m | 4m |
| Session 5 (2026-10-07 → 10-14) — PRD review, product-lead feedback, UX sweep | 55m | 18m |
| **Total** | **~3h 16m** | **~1h 33m** |

---

## How this gets updated

Use the `log-time` project skill (`.claude/skills/log-time/SKILL.md`). Measure each new
session from its transcript with `.claude/skills/log-time/measure_active.py` (15m idle
rule), append a session block, then update Running totals.
