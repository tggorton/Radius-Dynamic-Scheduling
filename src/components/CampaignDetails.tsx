import { Box, Divider, Paper, Snackbar } from "@mui/material";
import { useState } from "react";
import type { AdminStatus, Campaign } from "../types";
import { formatGoal } from "../lib/newEntities";
import {
  campaignChildWarnings,
  campaignImpact,
  evaluateCampaign,
} from "../lib/hierarchy";
import { useApp } from "../state/AppContext";
import { AdminStatusField } from "./AdminStatusField";
import { DetailsGrid } from "./DetailsGrid";
import { ScheduleSummary } from "./ScheduleSummary";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";
import { useConfirm } from "./ConfirmDialog";

/**
 * Campaign details, rebuilt from the production page's vertical list into the
 * same label-over-value grid as the line-item strip, plus the campaign's
 * Schedule row. Warnings here summarize line items that are out of sync.
 */
interface Props {
  campaign: Campaign;
}

export const CampaignDetails = ({ campaign }: Props) => {
  const { state, now, setCampaignSchedule, setCampaignStatus } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const { creatives } = state;
  const lineItems = state.lineItems.filter((li) => li.campaignId === campaign.id);

  const evaluation = evaluateCampaign(campaign, now);
  const childWarnings = campaignChildWarnings(campaign, lineItems);
  const lineItemTotal = lineItems.reduce((sum, li) => sum + li.impressionGoal, 0);

  const handleStatus = async (status: AdminStatus) => {
    const stopped = campaignImpact(campaign, { ...campaign, status }, lineItems, creatives, now);
    if (stopped.length > 0) {
      const ok = await confirm({
        title: "Stop delivery now?",
        confirmLabel: "Set Inactive",
        message: (
          <>
            Setting the campaign to Inactive stops delivery immediately for:
            {stopped.map((label) => (
              <Box component="span" key={label} sx={{ display: "block", pl: 1.5, mt: 0.5 }}>
                • {label}
              </Box>
            ))}
          </>
        ),
      });
      if (!ok) return;
    }
    setCampaignStatus(campaign.id, status);
    setSnack(`Campaign set to ${status === "active" ? "Active" : "Inactive"}`);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderColor: "divider", backgroundColor: "background.paper" }}
    >
      <DetailsGrid
        columns={7}
        fields={[
          { label: "Campaign ID", value: String(campaign.id) },
          {
            label: "Status",
            value: <AdminStatusField status={campaign.status} onChange={handleStatus} />,
          },
          { label: "Vertical", value: campaign.vertical, editable: true },
          { label: "Line of Business", value: campaign.lineOfBusiness, editable: true },
          { label: "Click Through Rate", value: campaign.clickThroughRate, editable: true },
          { label: "Interaction Rate", value: campaign.interactionRate, editable: true },
          { label: "Activity Rate", value: campaign.activityRate, editable: true },
          { label: "Opportunity ID", value: campaign.opportunityId, editable: true },
          { label: "Deal ID", value: campaign.dealId, editable: true },
          { label: "Purchase Order ID", value: campaign.purchaseOrderId, editable: true },
          {
            label: "Impression Goal",
            value: formatGoal(campaign.impressionGoal),
            editable: true,
          },
          { label: "Line Item Impressions Total", value: formatGoal(lineItemTotal) },
          { label: "Publisher", value: campaign.publisher, editable: true },
        ]}
      />
      <Divider sx={{ my: 2.5 }} />
      <ScheduleSummary
        schedule={campaign.schedule}
        evaluation={evaluation}
        warnings={childWarnings}
        warningsHeading={`${childWarnings.length} line item${childWarnings.length === 1 ? "" : "s"} out of sync with this schedule`}
        onEdit={() => setEditOpen(true)}
      />
      <ScheduleEditorDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setSnack(`Schedule saved for ${campaign.name}`)}
        title="Campaign Schedule"
        entityKind="campaign"
        schedule={campaign.schedule}
        status={campaign.status}
        warningsFor={(draft) => campaignChildWarnings({ ...campaign, schedule: draft }, lineItems)}
        impactOf={(draft) =>
          campaignImpact(campaign, { ...campaign, schedule: draft }, lineItems, creatives, now)
        }
        onSave={(schedule) => setCampaignSchedule(campaign.id, schedule)}
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
