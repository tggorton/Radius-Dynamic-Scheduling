import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import type { Schedule } from "../types";
import { formatDateInZone, formatTimeInZone, hasSpecificBound } from "../lib/schedule";
import { inheritedNote } from "../lib/scheduleInheritance";
import { describeTimeZone } from "../lib/timezones";
import { useApp } from "../state/AppContext";

interface Props {
  /** The schedule as it applies (inherited bounds resolved, D32). */
  effective: Schedule;
  /** This entity's own schedule, to say which bounds come from the parent. */
  own: Schedule;
  /** "campaign" / "line item" for children; omit at the top level. */
  parentKind?: string;
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
 * "→ end", then one caption line — the zone when a specific time is in play,
 * and which bounds come from the parent (D32). The pencil opens that row's
 * schedule editor.
 */
export const ScheduleCell = ({ effective, own, parentKind, name, onEdit }: Props) => {
  const { now } = useApp();
  const caption = [
    hasSpecificBound(effective) ? describeTimeZone(effective.timeZone, now) : null,
    parentKind ? inheritedNote(own, parentKind) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {boundText(effective, "start")}
        </Typography>
        <Typography variant="body2" noWrap>
          → {boundText(effective, "end")}
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
