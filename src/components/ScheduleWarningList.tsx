import { Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import type { ScheduleWarning } from "../lib/scheduleWarnings";

interface Props {
  warnings: ScheduleWarning[];
}

/** Out-of-sync messages spelled out, one per line — for summaries and editors. */
export const ScheduleWarningList = ({ warnings }: Props) => {
  if (warnings.length === 0) return null;
  return (
    <Stack spacing={0.75}>
      {warnings.map((w) => {
        const high = w.severity === "high";
        const Icon = high ? ErrorOutlineRoundedIcon : WarningAmberRoundedIcon;
        return (
          <Stack key={w.id} direction="row" spacing={1} alignItems="flex-start">
            <Icon
              sx={{
                fontSize: 18,
                mt: "1px",
                color: high ? "error.main" : "warning.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {w.message}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};
