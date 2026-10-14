import { Button, Divider, ListSubheader, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useState } from "react";
import { useApp } from "../state/AppContext";
import { formatInZone } from "../lib/schedule";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const JUMPS: Array<{ label: string; ms: number }> = [
  { label: "+1 hour", ms: HOUR },
  { label: "+1 day", ms: DAY },
  { label: "+1 week", ms: 7 * DAY },
  { label: "+30 days", ms: 30 * DAY },
  { label: "−1 day", ms: -DAY },
  { label: "−1 week", ms: -7 * DAY },
];

const describeOffset = (ms: number): string => {
  const sign = ms < 0 ? "−" : "+";
  let rest = Math.abs(ms);
  const d = Math.floor(rest / DAY);
  rest -= d * DAY;
  const h = Math.floor(rest / HOUR);
  const m = Math.round((rest - h * HOUR) / 60_000);
  const parts = [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean);
  return `${sign}${parts.join(" ") || "0m"}`;
};

/**
 * PROTOTYPE-ONLY demo clock. Lets a reviewer jump time forward/back to watch
 * run states change (Pending Start → Serving → Schedule Expired) without
 * waiting. Not part of the product — the real platform has no clock control.
 *
 * It's shown in US Eastern, named explicitly, so it never depends on the
 * reviewer's computer zone (D21).
 */
export const SimulatedClockControl = () => {
  const { state, now, setClockOffset } = useApp();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const offset = state.clockOffsetMs;
  const simulated = offset !== 0;

  return (
    <>
      <Tooltip title="Prototype only: simulate the passage of time to watch run states change. Not part of the product.">
        <Button
          size="small"
          startIcon={<ScheduleIcon fontSize="small" />}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            color: simulated ? "warning.main" : "text.secondary",
            textTransform: "none",
            fontWeight: 500,
            letterSpacing: 0,
          }}
        >
          Demo clock: {formatInZone(now, DEFAULT_TIME_ZONE)}
          {simulated && (
            <Typography component="span" variant="caption" sx={{ ml: 1 }}>
              (simulated {describeOffset(offset)})
            </Typography>
          )}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <ListSubheader sx={{ lineHeight: "32px", backgroundColor: "transparent" }}>
          Jump the demo clock
        </ListSubheader>
        {JUMPS.map((j) => (
          <MenuItem key={j.label} onClick={() => setClockOffset(offset + j.ms)}>
            {j.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          disabled={!simulated}
          onClick={() => {
            setClockOffset(0);
            setAnchor(null);
          }}
        >
          Back to real time
        </MenuItem>
      </Menu>
    </>
  );
};
