import { useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Campaign, Creative, LineItem } from "../types";
import {
  creativeImpact,
  creativeWarnings,
  creativesOf,
  evaluateCreative,
} from "../lib/hierarchy";
import {
  effectiveCreativeSchedule,
  effectiveLineItemSchedule,
} from "../lib/scheduleInheritance";
import { weightShares } from "../lib/scheduleWeights";
import { useApp } from "../state/AppContext";
import { SectionHeader } from "./SectionHeader";
import { RunningStateChip } from "./RunningStateChip";
import { ScheduleWarningIcon } from "./ScheduleWarningIcon";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";
import { CreativeWeightField } from "./CreativeWeightField";
import { AddCreativesDialog } from "./AddCreativesDialog";
import { ScheduleCell } from "./ScheduleCell";
import { useConfirm } from "./ConfirmDialog";

interface Props {
  lineItem: LineItem;
  campaign: Campaign;
}

type SortDir = "asc" | "desc" | null;


/** Clicks on a row's controls shouldn't toggle the row's selection. */
const stop = (e: MouseEvent) => e.stopPropagation();

/**
 * Weighted Creatives, aligned with the production section: Name (with remove),
 * Creative Id, Weighting (reset + sort), Pixel Name, row selection and
 * pagination — plus this phase's Schedule and Run State columns. The Schedule
 * column opens the shared editor; Run State is evaluated campaign → line item →
 * creative. Weights split delivery among the creatives Serving right now (D28).
 *
 * Owns its Snackbar for its dialogs' `onSaved`, like the other scheduling
 * panels — DistrosSection's isn't the right scope for these messages.
 */
export const CreativesSection = ({ lineItem, campaign }: Props) => {
  const {
    state,
    now,
    setCreativeSchedule,
    setCreativeWeight,
    resetCreativeWeights,
    removeCreative,
  } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const [editing, setEditing] = useState<Creative | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const creatives = creativesOf(lineItem, state.creatives);
  const evaluated = creatives.map((cr) => ({
    creative: cr,
    evaluation: evaluateCreative(cr, lineItem, campaign, now),
    warnings: creativeWarnings(cr, lineItem, campaign),
    effective: effectiveCreativeSchedule(cr, lineItem, campaign),
  }));
  const shares = weightShares(
    evaluated.map((r) => ({
      id: r.creative.id,
      customWeight: r.creative.customWeight,
      serving: r.evaluation.state === "serving",
    })),
  );
  const servingCount = evaluated.filter((r) => r.evaluation.state === "serving").length;
  const anyCustom = creatives.some((cr) => cr.customWeight !== null);

  // Sort by the applied share; creatives with no share ("–") always sort last.
  const rows = sortDir
    ? [...evaluated].sort((a, b) => {
        const wa = shares.get(a.creative.id) ?? null;
        const wb = shares.get(b.creative.id) ?? null;
        if (wa === null || wb === null) return wa === wb ? 0 : wa === null ? 1 : -1;
        return sortDir === "asc" ? wa - wb : wb - wa;
      })
    : evaluated;
  const visible = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const selectedCount = creatives.filter((cr) => selected.has(cr.id)).length;

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleRemove = async (cr: Creative) => {
    const ok = await confirm({
      title: "Remove creative?",
      message: `"${cr.name}" will be removed from this line item, and its share re-split among the other serving creatives.`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    removeCreative(cr.id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(cr.id);
      return next;
    });
    setSnack(`Removed ${cr.name}`);
  };

  const cycleSort = () => setSortDir((d) => (d === null ? "asc" : d === "asc" ? "desc" : null));

  return (
    <Box>
      <SectionHeader
        title="Weighted Creatives"
        subtitle="Used as fallback when no target type provided or targeting doesn't match"
        actions={
          <Button variant="outlined" color="primary" size="small" onClick={() => setAddOpen(true)}>
            Add Weighted Creatives
          </Button>
        }
      />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Creative Id</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Run State</TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <span>Weighting</span>
                <Tooltip
                  title={
                    anyCustom
                      ? "Clear typed weights and split evenly among the serving creatives"
                      : "Weights already split evenly"
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      disabled={!anyCustom}
                      onClick={() => {
                        resetCreativeWeights(lineItem.id);
                        setSnack("Weights reset to an even split");
                      }}
                      sx={{ color: "text.secondary", p: 0.25 }}
                    >
                      <RefreshIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    sortDir === null
                      ? "Sort by weight"
                      : sortDir === "asc"
                        ? "Sorted lowest first"
                        : "Sorted highest first"
                  }
                >
                  <IconButton
                    size="small"
                    onClick={cycleSort}
                    aria-label="Sort by weight"
                    sx={{ color: sortDir ? "text.primary" : "text.disabled", p: 0.25 }}
                  >
                    <ArrowUpwardIcon
                      sx={{ fontSize: 16, transform: sortDir === "desc" ? "rotate(180deg)" : "none" }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
            <TableCell>Pixel Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No creatives yet. Click Add Weighted Creatives to add one.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {visible.map(({ creative: cr, evaluation, warnings, effective }) => (
            <TableRow
              key={cr.id}
              hover
              selected={selected.has(cr.id)}
              onClick={() => toggleRow(cr.id)}
              sx={{ cursor: "pointer" }}
            >
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Tooltip title="Remove creative">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        stop(e);
                        void handleRemove(cr);
                      }}
                      aria-label={`Remove ${cr.name}`}
                      sx={{ color: "text.secondary" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="body2">{cr.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {cr.id}
                </Typography>
              </TableCell>
              <TableCell>
                <ScheduleCell
                  effective={effective}
                  own={cr.schedule}
                  parentKind="line item"
                  name={cr.name}
                  onEdit={() => setEditing(cr)}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <RunningStateChip evaluation={evaluation} />
                  <ScheduleWarningIcon warnings={warnings} />
                </Stack>
              </TableCell>
              <TableCell>
                <Box onClick={stop} sx={{ display: "inline-block" }}>
                  <CreativeWeightField
                    share={shares.get(cr.id) ?? null}
                    customWeight={cr.customWeight}
                    servingCount={servingCount}
                    onChange={(weight) => setCreativeWeight(cr.id, weight)}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  No Pixels
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
          {selectedCount > 0 ? `${selectedCount} row${selectedCount === 1 ? "" : "s"} selected` : ""}
        </Typography>
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
        />
      </Stack>
      {editing && (
        <ScheduleEditorDialog
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => setSnack(`Schedule saved for ${editing.name}`)}
          title="Creative Schedule"
          entityKind="creative"
          schedule={editing.schedule}
          status={editing.status}
          warningsFor={(draft) => creativeWarnings({ ...editing, schedule: draft }, lineItem, campaign)}
          impactOf={(draft) =>
            creativeImpact(editing, { ...editing, schedule: draft }, lineItem, campaign, now)
          }
          parent={{ kind: "line item", schedule: effectiveLineItemSchedule(lineItem, campaign) }}
          onSave={(schedule) => setCreativeSchedule(editing.id, schedule)}
        />
      )}
      <AddCreativesDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={setSnack}
        lineItem={lineItem}
      />
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      {confirmDialog}
    </Box>
  );
};
