# Radius — Dynamic Scheduling

Q4 prototype: granular run schedules (date + time, timezone, start immediately, always
on) for campaigns, line items, and creatives, with a running status at each level.

Built on a frozen snapshot of the Radius Ad-Tags / Transcoding / 3rd-Party Push prototype.
See [docs/BASELINE.md](docs/BASELINE.md).

```bash
npm install
npm run dev        # http://localhost:5176
npx tsc --noEmit   # the gate (no tests, no linter)
```

Reset demo state (browser console): `localStorage.removeItem('radius.scheduling.v1'); location.reload()`

Docs index: [docs/README.md](docs/README.md).
