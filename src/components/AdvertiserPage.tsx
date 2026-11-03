import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Link,
  Paper,
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
import EditIcon from "@mui/icons-material/Edit";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import type { Campaign } from "../types";
import { campaignChildWarnings, campaignImpact, evaluateCampaign } from "../lib/hierarchy";
import { ADVERTISER, formatGoal } from "../lib/newEntities";
import { useApp } from "../state/AppContext";
import { DetailsGrid } from "./DetailsGrid";
import { SectionHeader } from "./SectionHeader";
import { RunningStateChip } from "./RunningStateChip";
import { ScheduleWarningIcon } from "./ScheduleWarningIcon";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { KervLogo } from "./KervLogo";
import { ScheduleCell } from "./ScheduleCell";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";


/**
 * The advertiser — the top of the hierarchy and where Demo mode starts. Details
 * use the same label-over-value grid as the campaign and line item (the style
 * this prototype proposes for production). The Campaigns table lists every
 * campaign with the shared Schedule column (its pencil opens the Campaign
 * Schedule editor) and Run State; Add New Campaign opens Create Campaign.
 *
 * Owns its Snackbar for its dialog's `onSaved`, like the other panels.
 */
export const AdvertiserPage = () => {
  const { state, now, setView, setCampaignSchedule } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const { campaigns, lineItems } = state;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {ADVERTISER.name}
        </Typography>
        <IconButton size="small" sx={{ color: "text.secondary", ml: 0.5 }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Stack spacing={5}>
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider", backgroundColor: "background.paper" }}>
          <DetailsGrid
            columns={6}
            fields={[
              { label: "Agency ID", value: String(ADVERTISER.agencyId) },
              { label: "Advertiser Url", value: ADVERTISER.url, editable: true },
              { label: "Vertical", value: ADVERTISER.vertical, editable: true },
              { label: "Disable Powered-By", value: "No", editable: true },
              {
                label: "Brand Logo",
                value: (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: "background.sunken", display: "flex" }}>
                      <KervLogo size={28} />
                    </Box>
                    <Button variant="outlined" color="primary" size="small">
                      Upload Logo
                    </Button>
                  </Stack>
                ),
              },
            ]}
          />
        </Paper>

        <Box>
          <SectionHeader
            title="Campaigns"
            actions={
              <Button variant="outlined" color="primary" size="small" onClick={() => setCreateOpen(true)}>
                Add New Campaign
              </Button>
            }
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Campaign Name</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Run State</TableCell>
                <TableCell>Impressions Goal</TableCell>
                <TableCell>Line Items</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No campaigns yet. Click Add New Campaign to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {campaigns.map((c) => {
                const own = lineItems.filter((li) => li.campaignId === c.id);
                return (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        onClick={() => setView({ page: "campaign", campaignId: c.id })}
                        sx={{ display: "block", textAlign: "left", overflowWrap: "anywhere" }}
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {c.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.status === "active" ? "Active" : "Inactive"}</Typography>
                    </TableCell>
                    <TableCell>
                      <ScheduleCell schedule={c.schedule} name={c.name} onEdit={() => setEditing(c)} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <RunningStateChip evaluation={evaluateCampaign(c, now)} />
                        <ScheduleWarningIcon warnings={campaignChildWarnings(c, own)} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatGoal(c.impressionGoal)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{own.length}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ color: "text.secondary" }}>
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={campaigns.length}
            page={0}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
            onPageChange={() => undefined}
          />
        </Box>
      </Stack>
      <CreateCampaignDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={setSnack} />
      {editing && (
        <ScheduleEditorDialog
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => setSnack(`Schedule saved for ${editing.name}`)}
          title="Campaign Schedule"
          entityKind="campaign"
          schedule={editing.schedule}
          status={editing.status}
          warningsFor={(draft) =>
            campaignChildWarnings(
              { ...editing, schedule: draft },
              lineItems.filter((li) => li.campaignId === editing.id),
            )
          }
          impactOf={(draft) =>
            campaignImpact(
              editing,
              { ...editing, schedule: draft },
              lineItems.filter((li) => li.campaignId === editing.id),
              state.creatives,
              now,
            )
          }
          onSave={(schedule) => setCampaignSchedule(editing.id, schedule)}
        />
      )}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
};
