import { Box, Divider, Paper, Snackbar, Typography } from "@mui/material";
import { useState } from "react";
import type { AdminStatus, Campaign, LineItem } from "../types";
import { formatGoal } from "../lib/newEntities";
import {
  creativesOf,
  evaluateLineItem,
  lineItemChildWarnings,
  lineItemCoverageWarnings,
  lineItemImpact,
  lineItemWarnings,
} from "../lib/hierarchy";
import { useApp } from "../state/AppContext";
import { AdminStatusField } from "./AdminStatusField";
import { DetailsGrid } from "./DetailsGrid";
import { ScheduleSummary } from "./ScheduleSummary";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";
import { useConfirm } from "./ConfirmDialog";

interface Props {
  lineItem: LineItem;
  campaign: Campaign;
}

/**
 * The line-item details strip. Replaces the static stub: Status is the real
 * administrative switch, and the date-only Start/End fields became the
 * Schedule row (start · end · timezone · run state + warnings).
 */
export const LineItemDetails = ({ lineItem, campaign }: Props) => {
  const { state, now, setLineItemSchedule, setLineItemStatus } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const { creatives } = state;
  const ownCreatives = creativesOf(lineItem, creatives);

  const evaluation = evaluateLineItem(lineItem, campaign, now);
  // Against the campaign, then whether any creative is actually delivering (D10).
  const warnings = [
    ...lineItemWarnings(lineItem, campaign),
    ...lineItemCoverageWarnings(lineItem, campaign, creatives, now),
  ];

  const handleStatus = async (status: AdminStatus) => {
    const next = { ...lineItem, status };
    const stopped = lineItemImpact(lineItem, next, campaign, creatives, now);
    if (stopped.length > 0) {
      const ok = await confirm({
        title: "Stop delivery now?",
        message: "Setting this line item to Inactive stops delivery immediately.",
        confirmLabel: "Set Inactive",
      });
      if (!ok) return;
    }
    setLineItemStatus(lineItem.id, status);
    setSnack(`Line item set to ${status === "active" ? "Active" : "Inactive"}`);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderColor: "divider", backgroundColor: "background.paper" }}
    >
      <DetailsGrid
        columns={9}
        fields={[
          { label: "Line Item ID", value: String(lineItem.id) },
          {
            label: "Status",
            value: <AdminStatusField status={lineItem.status} onChange={handleStatus} />,
          },
          { label: "Rate", value: lineItem.rate, editable: true },
          {
            label: "Impression Budget",
            value: formatGoal(lineItem.impressionGoal),
            editable: true,
          },
          { label: "Reverse Wrap Tag", value: "<not assigned>", editable: true },
          { label: "3rd Party Tag", value: "<not assigned>", editable: true },
          { label: "External Name", value: "<not assigned>", editable: true },
          { label: "Type", value: lineItem.creativeType },
          { label: "Creative", value: `${ownCreatives.length} assigned` },
        ]}
      />
      <Divider sx={{ my: 2.5 }} />
      <ScheduleSummary
        schedule={lineItem.schedule}
        evaluation={evaluation}
        warnings={warnings}
        warningsHeading="Schedule warnings"
        onEdit={() => setEditOpen(true)}
      />
      <Divider sx={{ my: 2.5 }} />
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontSize: 12, mb: 0.5 }}
        >
          Creative Playback Version
        </Typography>
        <Typography variant="body2">CTV</Typography>
      </Box>
      <ScheduleEditorDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setSnack(`Schedule saved for ${lineItem.name}`)}
        title="Line Item Schedule"
        entityKind="line item"
        schedule={lineItem.schedule}
        status={lineItem.status}
        warningsFor={(draft) => {
          const next = { ...lineItem, schedule: draft };
          return [
            ...lineItemWarnings(next, campaign),
            ...lineItemChildWarnings(next, creatives),
          ];
        }}
        impactOf={(draft) =>
          lineItemImpact(lineItem, { ...lineItem, schedule: draft }, campaign, creatives, now)
        }
        onSave={(schedule) => setLineItemSchedule(lineItem.id, schedule)}
      />
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      {confirmDialog}
    </Paper>
  );
};
