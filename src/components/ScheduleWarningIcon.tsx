import { Box, Stack, Tooltip, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import {
  highestSeverity,
  type ScheduleWarning,
} from "../lib/scheduleWarnings";

interface Props {
  warnings: ScheduleWarning[];
}

/**
 * A compact out-of-sync indicator for table rows: an icon (never a status dot,
 * so it can't be mistaken for a run state) with every message in the tooltip.
 * Renders nothing when there's nothing to say.
 */
export const ScheduleWarningIcon = ({ warnings }: Props) => {
  const severity = highestSeverity(warnings);
  if (!severity) return null;
  const Icon = severity === "high" ? ErrorOutlineRoundedIcon : WarningAmberRoundedIcon;
  return (
    <Tooltip
      title={
        <Stack spacing={0.75} sx={{ py: 0.5 }}>
          {warnings.map((w) => (
            <Typography key={w.id} variant="caption" component="div">
              {w.message}
            </Typography>
          ))}
        </Stack>
      }
    >
      <Box
        component="span"
        aria-label={`${warnings.length} schedule warning${warnings.length === 1 ? "" : "s"}`}
        sx={{ display: "inline-flex", alignItems: "center" }}
      >
        <Icon
          sx={{
            fontSize: 18,
            color: severity === "high" ? "error.main" : "warning.main",
          }}
        />
      </Box>
    </Tooltip>
  );
};
