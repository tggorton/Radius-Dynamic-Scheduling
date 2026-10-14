import { Box, Button, Stack, Typography } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import type { ReactNode } from "react";
import type { RunningEvaluation, Schedule } from "../types";
import { describeEnd, describeStart, hasSpecificBound, type BoundDisplay } from "../lib/schedule";
import { describeTimeZone } from "../lib/timezones";
import type { ScheduleWarning } from "../lib/scheduleWarnings";
import { useApp } from "../state/AppContext";
import { RunningStateChip } from "./RunningStateChip";
import { ScheduleWarningList } from "./ScheduleWarningList";

interface Props {
  /** The *effective* schedule (inherited bounds resolved, D32). */
  schedule: Schedule;
  evaluation: RunningEvaluation;
  warnings: ScheduleWarning[];
  /** Heading above the warning list, e.g. "2 line items out of sync". */
  warningsHeading?: string;
  /** Child levels: which bounds follow the parent, and the parent's kind ("campaign"). */
  inherited?: { start: boolean; end: boolean; parentKind: string };
  onEdit: () => void;
}

const Cell = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", fontSize: 12, mb: 0.5 }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

const Bound = ({ value, muted, from }: { value: BoundDisplay; muted?: boolean; from?: string }) => (
  <>
    <Typography variant="body2" sx={{ fontSize: 14 }} color={muted ? "text.secondary" : "text.primary"}>
      {value.primary}
    </Typography>
    {value.secondary && (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {value.secondary}
      </Typography>
    )}
    {from && (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        From {from}
      </Typography>
    )}
  </>
);

/**
 * The schedule row inside a details panel: Start · End · Timezone · Run State,
 * then any out-of-sync warnings spelled out. Immediate/Indefinite lead with the
 * setting (D14, D22); the timezone reads muted until a bound is Specific. A
 * bound a line item or creative inherits shows its parent's value plus
 * "From campaign" (D32).
 */
export const ScheduleSummary = ({
  schedule,
  evaluation,
  warnings,
  warningsHeading,
  inherited,
  onEdit,
}: Props) => {
  const { now } = useApp();
  const zoneMatters = hasSpecificBound(schedule);
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          Schedule
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<EventIcon />}
          onClick={onEdit}
        >
          Edit Schedule
        </Button>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          columnGap: 2,
        }}
      >
        <Cell label="Start">
          <Bound value={describeStart(schedule, now)} from={inherited?.start ? inherited.parentKind : undefined} />
        </Cell>
        <Cell label="End">
          <Bound value={describeEnd(schedule)} from={inherited?.end ? inherited.parentKind : undefined} />
        </Cell>
        <Cell label="Timezone">
          <Bound
            muted={!zoneMatters}
            value={{
              primary: describeTimeZone(schedule.timeZone, now),
              secondary:
                inherited?.start && inherited.end
                  ? `From ${inherited.parentKind}`
                  : zoneMatters
                    ? schedule.timeZone
                    : "Applies when specific times are set",
            }}
          />
        </Cell>
        <Cell label="Run State">
          <RunningStateChip evaluation={evaluation} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {evaluation.detail}
          </Typography>
        </Cell>
      </Box>
      {warnings.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {warningsHeading && (
            <Typography variant="caption" color="warning.main" sx={{ display: "block", mb: 0.75 }}>
              {warningsHeading}
            </Typography>
          )}
          <ScheduleWarningList warnings={warnings} />
        </Box>
      )}
    </Box>
  );
};
