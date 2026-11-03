import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import type { Schedule } from "../types";
import { formatDateInZone, formatTimeInZone, hasSpecificBound } from "../lib/schedule";
import { describeTimeZone } from "../lib/timezones";
import { useApp } from "../state/AppContext";

interface Props {
  schedule: Schedule;
  /** Row name, for the pencil's accessible label. */
  name: string;
  onEdit: () => void;
}

/** "Immediate" / "Indefinite", or "Nov 20, 2026 · 12:00 AM EST" in the schedule's zone. */
const boundText = (s: Schedule, which: "start" | "end"): string => {
  const b = which === "start" ? s.start : s.end;
  if (b.kind !== "specific") return which === "start" ? "Immediate" : "Indefinite";
  const at = Date.parse(b.utc);
  return `${formatDateInZone(at, s.timeZone)} · ${formatTimeInZone(at, s.timeZone)}`;
};

/**
 * The Schedule column, shared by every table (campaigns, line items,
 * creatives) so a schedule reads and edits the same way everywhere: start,
 * "→ end", then a caption with the zone when a specific time is in play. The
 * pencil opens that row's schedule editor.
 */
export const ScheduleCell = ({ schedule, name, onEdit }: Props) => {
  const { now } = useApp();
  // The zone only matters once a specific time is in play (D22).
  const caption = hasSpecificBound(schedule) ? describeTimeZone(schedule.timeZone, now) : null;

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {boundText(schedule, "start")}
        </Typography>
        <Typography variant="body2" noWrap>
          → {boundText(schedule, "end")}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
            {caption}
          </Typography>
        )}
      </Box>
      <Tooltip title="Edit schedule">
        <IconButton
          size="small"
          onClick={(e) => {
            // Rows can be clickable (selection); the pencil shouldn't toggle them.
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Edit schedule for ${name}`}
          sx={{ color: "text.secondary" }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
