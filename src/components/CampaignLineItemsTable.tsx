import {
  Box,
  Button,
  IconButton,
  Link,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  evaluateLineItem,
  lineItemChildWarnings,
  lineItemImpact,
  lineItemWarnings,
} from "../lib/hierarchy";
import { useState } from "react";
import type { Campaign, LineItem } from "../types";
import { formatGoal } from "../lib/newEntities";
import { useApp } from "../state/AppContext";
import { CreateLineItemDialog } from "./CreateLineItemDialog";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";
import { ScheduleCell } from "./ScheduleCell";
import { SectionHeader } from "./SectionHeader";
import { RunningStateChip } from "./RunningStateChip";
import { ScheduleWarningIcon } from "./ScheduleWarningIcon";


/**
 * The campaign's line items. Each name opens that line item. The Schedule
 * column (shared `ScheduleCell`, same as the creatives table) reads in each
 * line item's own zone (D13); its pencil opens the same Line Item Schedule editor as the line-item page. Run
 * State is evaluated against the campaign, with an icon when out of sync. Add New Line
 * Item opens Create Line Item; the other header buttons are visual only.
 *
 * Owns its Snackbar for the editor's `onSaved`, like the other scheduling panels.
 */
interface Props {
  campaign: Campaign;
}

export const CampaignLineItemsTable = ({ campaign }: Props) => {
  const { state, now, setView, setLineItemSchedule } = useApp();
  const lineItems = state.lineItems.filter((li) => li.campaignId === campaign.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LineItem | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  return (
    <Box>
      <SectionHeader
        title="Line Items"
        actions={
          <Stack direction="row" spacing={1}>
            {[
              "Bulk Update Line Items",
              "Create Bulk Line Items",
              "Distribute Impressions",
              "Add New Line Item",
              "Export Campaign Distribution Tags",
            ].map((label) => (
              <Button
                key={label}
                variant="outlined"
                color="primary"
                size="small"
                onClick={label === "Add New Line Item" ? () => setCreateOpen(true) : undefined}
              >
                {label}
              </Button>
            ))}
          </Stack>
        }
      />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Creative Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Run State</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Impressions Goal</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  No line items yet. Click Add New Line Item to create one.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {lineItems.map((li) => (
            <TableRow key={li.id} hover>
              <TableCell sx={{ maxWidth: 360 }}>
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => setView({ page: "lineItem", lineItemId: li.id })}
                  sx={{ display: "block", textAlign: "left", overflowWrap: "anywhere" }}
                >
                  {li.name}
                </Link>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{li.creativeType}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {li.status === "active" ? "Active" : "Inactive"}
                </Typography>
              </TableCell>
              <TableCell>
                <ScheduleCell
                  schedule={li.schedule}
                  name={li.name}
                  onEdit={() => setEditing(li)}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <RunningStateChip evaluation={evaluateLineItem(li, campaign, now)} />
                  <ScheduleWarningIcon warnings={lineItemWarnings(li, campaign)} />
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap>
                  {li.rate}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatGoal(li.impressionGoal)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">1</Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" sx={{ color: "text.secondary" }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={lineItems.length}
        page={0}
        rowsPerPage={100}
        rowsPerPageOptions={[100]}
        onPageChange={() => undefined}
      />
      <CreateLineItemDialog open={createOpen} onClose={() => setCreateOpen(false)} campaign={campaign} />
      {editing && (
        <ScheduleEditorDialog
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => setSnack(`Schedule saved for ${editing.name}`)}
          title="Line Item Schedule"
          entityKind="line item"
          schedule={editing.schedule}
          status={editing.status}
          warningsFor={(draft) => {
            const next = { ...editing, schedule: draft };
            return [
              ...lineItemWarnings(next, campaign),
              ...lineItemChildWarnings(next, state.creatives),
            ];
          }}
          impactOf={(draft) =>
            lineItemImpact(editing, { ...editing, schedule: draft }, campaign, state.creatives, now)
          }
          onSave={(schedule) => setLineItemSchedule(editing.id, schedule)}
        />
      )}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
