---
name: log-time
description: Append a session block to TIME_LOG.md after a checkpoint or push. Anchor AI Work on git commit timestamps with a density-aware reduction (sparse-commit days need a bigger cut than dense-commit days). Use prompting archetypes for the user side. Trigger when the user asks to update the time log, add a checkpoint, or after pushing a meaningful chunk of work.
---

# Log Time

Maintain `TIME_LOG.md` at the project root. Each session is a level-3
heading with the date + one-line summary, followed by a wall-clock
span line, a `Block | Prompting | AI Work | Notes` table, and a
subtotal row. After all session tables, a `## Running totals` table
sums everything up.

The canonical format is whatever's already in `TIME_LOG.md`. Match it.

## When to use

- User says "update the time log" / "checkpoint" / "log this session"
- User asks to push to repo (good moment to add a row before/after)
- End of a meaningful work block

## Measured method — use this first

**The user's rule: don't count dead time.** If they haven't responded for 15+ minutes
after the last back-and-forth, that stretch isn't work. Estimating from wall-clock (even
with the reductions below) can't see these gaps. For Session 3 of this project it
overstated AI Work about 4× (2h 45m estimated vs ~43m measured).

Claude Code transcripts carry a timestamp on every message, so measure instead:

```bash
python3 .claude/skills/log-time/measure_active.py \
  ~/.claude/projects/<project-path>/<session-id>.jsonl
```

It prints, per user message, `AI` (that message's AI/tool stretch, minus any single 15m+
gap), `you` (the reply gap before it: in full under 15m, else 5m credited), and `idle`.
AskUserQuestion waits count as the user's time. Group the rows into blocks by topic,
sum, and round to whole minutes. Older sessions' transcripts sit in the same folder; list
it to find them. The machine clock is Central and transcripts are UTC, so write tables in
ET.

Fall back to the commit-density estimate below only when no transcript exists.

## AI Work calibration — the part that's easy to get wrong

Anchor on `git log --pretty=format:'%h %ai %s'` commit timestamps,
then apply a reduction factor based on **commit density**.
Wall-clock between commits is NOT active AI tool time when commits
are sparse — most of the elapsed time is conversation, screenshot
analysis, verification, and idle.

| Commit pattern | Reduction off raw wall-clock |
|---|---|
| **Dense** (multiple commits per hour, steady AI-driven cadence) | 20–25% |
| **Moderate** (1–2 commits per hour, mixed conversation + tool work) | 30–40% |
| **Sparse** (1 commit per several hours, conversation-heavy refactor days) | 50–60% |

Picking a bucket:

- Count commits per hour in the wall-clock window
- Count user messages per commit. Ratio above ~5:1 → sparse
- Were screenshots / debug back-and-forth involved? That eats wall-clock without AI tool time → push toward sparse
- Was it a single-big-commit refactor day (one commit covering several distinct features)? → sparse
- Was it scaffold/style iteration with frequent small commits? → moderate or dense

When in doubt, lean toward MORE reduction. The original methodology
under-cut by leaning toward less.

### Why this matters

This project's first-cut TIME_LOG used a flat ~20–25% reduction
across all sessions. User pushed back on Session 5 (4h window, 2
commits, sparse): the active AI tool time was nowhere near 4h. After
recalibration, Session 5 went from 263m → 117m (56% cut) and the
broader recalibration of S1–S4 brought total AI Work from 11h to
~6.5h. The original methodology was systematically over-crediting AI
Work for stretches where the human was reading, verifying, or away.

## Prompting estimation

Per user message:

```
prompting_time = reading_time + thinking_time + typing_time
```

Three archetypes:

| Type | Pattern | Reading | Thinking | Typing |
|---|---|---:|---:|---:|
| **Quick approval** | "go", "yes", "looks good" | 1–2m | ≤30s | ≤30s |
| **Decision / lightweight** | choosing between options, brief feedback | 2–3m | 1–2m | 1–3m |
| **Intricate** | technical prompts with context, bug reports with screenshots/repros, multi-decision messages | 3–5m | 3–8m | 4–10m |

NOT counted as prompting:

- Time the AI is working (tool calls, file writes, builds)
- Visual verification clicking through the live app
- Breaks/errands during long gaps

IS counted:

- Reading my output before responding
- Deciding next steps
- Typing the message itself
- Reviewing actual file changes before replying

## Workflow when adding a checkpoint

1. Run `git log --pretty=format:'%h %ai %s' <last-logged-commit>..HEAD`
   to see what's been committed since the last session block. If the
   log is empty (no new commits), you're capturing pure conversation
   work — that should usually be a single small block, not a full
   session.
2. Group commits by date. One session per day unless a stretch
   genuinely spans multiple days as one continuous work arc (rare).
3. For each new session:
   - Pick the density bucket (dense / moderate / sparse) based on the
     commit-per-hour ratio across the wall-clock window.
   - Draft per-block rows. Each block should map to a coherent unit
     of work (one feature, one refactor, one push) — not one row per
     commit.
   - AI Work per block: estimate wall-clock between the relevant
     start and end, then apply the density reduction. Round to clean
     numbers (5m / 10m / 15m).
   - Prompting per block: count user messages in that window,
     classify each into an archetype, sum.
4. Append the new session table to `TIME_LOG.md`.
5. Update the `Running totals` table.
6. Confirm with the user. Offer to recalibrate if anything feels off
   — the user is the authority on their own time.

## Format details (match the existing TIME_LOG.md)

- Per-session heading: `### YYYY-MM-DD — Session N: <one-line summary>`
- Wall-clock line: `**Wall-clock span:** ...`
- Table columns: `Block | Prompting | AI Work | Notes`, with `---:`
  alignment on the time columns
- Time format: `12m`, `35m`, `2h 15m` for longer ones
- Subtotal row at bottom of each table: bold "Session subtotal" with
  `**~XXm**` style for the totals
- A short note in the Notes cell of the subtotal row explaining
  density bucket + any session-specific calibration choices

## Recalibration policy

If the user pushes back on an estimate, recalibrate:

1. Adjust the flagged session(s) per the user's reality check.
2. Apply the same logic to other sessions if the methodology issue
   was systemic (not just session-specific).
3. Update the Methodology / Calibration note in `TIME_LOG.md` to
   record the lesson.
4. Update this skill if the issue revealed a methodology gap.

The user's time perception is more reliable than commit-timestamp
arithmetic. Trust their pushback over the math.
