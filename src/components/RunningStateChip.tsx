import type { RunningEvaluation } from "../types";
import { RUNNING_STATE_META, runningTooltip } from "../lib/runningStatus";
import { StatusChip } from "./StatusChip";

interface Props {
  evaluation: RunningEvaluation;
}

/** The computed run state (Serving, Pending Start, …) via the shared StatusChip. */
export const RunningStateChip = ({ evaluation }: Props) => {
  const meta = RUNNING_STATE_META[evaluation.state];
  return (
    <StatusChip
      color={meta.color}
      label={meta.label}
      outlined={meta.outlined}
      description={runningTooltip(evaluation)}
    />
  );
};
