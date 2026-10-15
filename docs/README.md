# Docs

| Doc | What it is |
|---|---|
| [handoff-dynamic-scheduling.md](handoff-dynamic-scheduling.md) | **This phase's living hand-off.** *How it works now* (current behavior), decisions D1–D32, implementation map, changelog. |
| [TESTING.md](TESTING.md) | **Engineer test guide:** Preset sample / Demo / restart / demo clock, the seeded data with expected states at reference dates, 17 scenarios with expected results, reset options. |
| [dynamic-scheduling-handoff.html](dynamic-scheduling-handoff.html) | The visual hand-off page (copy of the Artifact at claude.ai/artifact/Sh1bMjimkqC9Waz6FafHXi). Open in a browser. |
| [BASELINE.md](BASELINE.md) | Where this project came from: source project + snapshot commit, what changed at the split, links to the frozen baseline docs. |
| [baseline/](baseline/) | Frozen copies of the baseline hand-offs (Transcoding, 3rd-Party Push). Reference only; not maintained here. |
| [../CLAUDE.md](../CLAUDE.md) | Architecture + conventions. Read before coding. |
| [../SESSION_LOG.md](../SESSION_LOG.md) | Narrative history for this phase (the *why* behind decisions). |
| [../TIME_LOG.md](../TIME_LOG.md) | Effort log for this phase. |

> **Reminder:** this is a UX/functionality prototype. There is no backend, no real auth,
> and all state is in localStorage. The docs mark what's a stand-in and what production
> must own.
