import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogHeader } from "./DialogHeader";
import { TranscodeFieldsGrid } from "./TranscodeFieldsGrid";
import { ManageTranscodePresetsDialog } from "./ManageTranscodePresetsDialog";
import { useConfirm } from "./ConfirmDialog";
import { useApp } from "../state/AppContext";
import { newId } from "../lib/ids";
import type { TranscodeSettings, TranscodingConfig } from "../types";
import {
  DEFAULT_PRESET_ID,
  findPreset,
  settingsEqual,
} from "../lib/transcodePresets";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (configs: TranscodingConfig[]) => void;
  /** Surfaces admin preset-catalog changes to the top-level Snackbar. */
  onSaved?: (message: string) => void;
}

/** A row in the modal — a config plus a stable key for React and expand state. */
interface Row {
  key: string;
  presetId: string;
  settings: TranscodeSettings;
}

const rowsMatchConfigs = (rows: Row[], configs: TranscodingConfig[]): boolean =>
  rows.length === configs.length &&
  rows.every(
    (r, i) =>
      r.presetId === configs[i].presetId &&
      settingsEqual(r.settings, configs[i].settings),
  );

export const TranscodingSettingsDialog = ({
  open,
  onClose,
  onApply,
  onSaved,
}: Props) => {
  const { state } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const configs = state.transcoding;
  const presets = state.transcodePresets;
  const isAdmin = state.role === "admin";
  const distroCount = state.distros.length;

  const [rows, setRows] = useState<Row[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [managePresetsOpen, setManagePresetsOpen] = useState(false);
  // The just-added row to scroll into view (see addRow).
  const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null);
  const newRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(
      configs.map((c) => ({
        key: newId(),
        presetId: c.presetId,
        settings: c.settings,
      })),
    );
    setExpanded(new Set()); // all collapsed by default
  }, [open, configs]);

  // After a preset is added, jump to it — otherwise the shift can happen below
  // an expanded row, out of the user's sightline.
  useEffect(() => {
    if (!pendingScrollKey) return;
    newRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingScrollKey(null);
  }, [pendingScrollKey]);

  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Picking a preset overwrites that row's sheet. It never mutates the preset.
  const changeRowPreset = (key: string, presetId: string) => {
    const preset = findPreset(presets, presetId);
    if (!preset) return;
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, presetId, settings: { ...preset.settings } } : r,
      ),
    );
  };

  const updateRowField = (key: string, fieldId: string, value: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, settings: { ...r.settings, [fieldId]: value } }
          : r,
      ),
    );

  const addRow = () => {
    const preset = findPreset(presets, DEFAULT_PRESET_ID) ?? presets[0];
    const key = newId();
    // Prepend so the new preset lands at the top, collapsed, then scroll to it
    // (any expanded rows below stay expanded).
    setRows((prev) => [
      { key, presetId: preset.id, settings: { ...preset.settings } },
      ...prev,
    ]);
    setPendingScrollKey(key);
  };

  const removeRow = async (key: string) => {
    // Deleting one of several just drops it. Deleting the last one is a reset —
    // confirm, then return the plan to the Default baseline (never zero presets).
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.key !== key));
      return;
    }
    const ok = await confirm({
      title: "Delete preset?",
      message:
        "This is the only preset. Deleting it returns the transcoding settings to Default.",
    });
    if (!ok) return;
    const preset = findPreset(presets, DEFAULT_PRESET_ID) ?? presets[0];
    setRows([
      { key: newId(), presetId: preset.id, settings: { ...preset.settings } },
    ]);
  };

  const hasChanges = useMemo(
    () => !rowsMatchConfigs(rows, configs),
    [rows, configs],
  );

  const handleApply = () => {
    onApply(rows.map((r) => ({ presetId: r.presetId, settings: r.settings })));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none",
          borderRadius: 1,
        },
      }}
    >
      <DialogHeader title="Transcoding Settings" onClose={onClose} />
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Apply one or more presets — every distribution tag is transcoded once
            per preset. Each preset's settings are collapsed; expand a preset to
            override any field (a one-off for this line-item; the preset is never
            changed).
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ flex: 1 }}
            >
              Presets to apply ({rows.length})
            </Typography>
            {isAdmin && (
              <Tooltip title="Add, edit, or remove presets (admin)">
                <IconButton
                  size="small"
                  onClick={() => setManagePresetsOpen(true)}
                  sx={{ color: "text.primary" }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={addRow}
            >
              + Add Preset
            </Button>
          </Stack>

          <Stack spacing={2} divider={<Divider />}>
            {rows.map((row) => {
              const preset = findPreset(presets, row.presetId);
              const modified =
                !preset || !settingsEqual(row.settings, preset.settings);
              const isOpen = expanded.has(row.key);
              const isOnly = rows.length === 1;
              // On the Default baseline the picker reads as enabled-but-not-active:
              // no floating "Preset" label and muted interior text, so it doesn't
              // present as an official selection. A chosen preset shows the label
              // and normal text. The border stays solid in both.
              const isDefault = row.presetId === DEFAULT_PRESET_ID;
              // The only preset can be deleted (resets to Default) — unless it's
              // already Default, since Default is the floor and must remain.
              const canDelete = !(isOnly && isDefault);
              return (
                <Box
                  key={row.key}
                  ref={row.key === pendingScrollKey ? newRowRef : undefined}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Autocomplete
                      value={preset ?? null}
                      onChange={(_, next) => next && changeRowPreset(row.key, next.id)}
                      options={presets}
                      getOptionLabel={(opt) => opt.name}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      sx={{
                        minWidth: 260,
                        flex: 1,
                        ...(isDefault && {
                          "& .MuiInputBase-input": { color: "text.secondary" },
                        }),
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={isDefault ? undefined : "Preset"}
                          placeholder="Select a publisher preset"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                    {modified && (
                      <Chip
                        label="Modified"
                        size="small"
                        sx={{
                          backgroundColor: "outOfSpec.main",
                          color: "outOfSpec.contrastText",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {/* Row controls grouped together, expand next to delete. */}
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title={isOpen ? "Collapse" : "Expand settings"}>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(row.key)}
                          sx={{ color: "text.secondary" }}
                        >
                          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          !canDelete
                            ? "Default must stay — the only preset can't be removed when it's already Default"
                            : isOnly
                              ? "Delete preset — returns settings to Default"
                              : "Remove this preset"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => removeRow(row.key)}
                            disabled={!canDelete}
                            sx={{ color: "text.secondary" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Collapse in={isOpen} unmountOnExit>
                    <Box sx={{ pt: 2 }}>
                      <TranscodeFieldsGrid
                        settings={row.settings}
                        onChange={(id, value) =>
                          updateRowField(row.key, id, value)
                        }
                      />
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {distroCount === 0
              ? "No distributions yet — settings are saved for this line-item."
              : `Applying re-transcodes ${distroCount} distribution${distroCount === 1 ? "" : "s"} with ${rows.length} preset${rows.length === 1 ? "" : "s"} (each lands on its own status).`}
          </Typography>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleApply}
          disabled={!hasChanges}
          sx={{ color: hasChanges ? "primary.main" : "text.disabled" }}
        >
          Apply Settings
        </Button>
      </DialogActions>
      <ManageTranscodePresetsDialog
        open={managePresetsOpen}
        onClose={() => setManagePresetsOpen(false)}
        onSaved={onSaved}
      />
      {confirmDialog}
    </Dialog>
  );
};
