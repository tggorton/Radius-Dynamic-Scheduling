import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogHeader } from "./DialogHeader";
import { TranscodeFieldsGrid } from "./TranscodeFieldsGrid";
import { useConfirm } from "./ConfirmDialog";
import { useApp } from "../state/AppContext";
import { newId } from "../lib/ids";
import type { TranscodePreset, TranscodeSettings } from "../types";
import {
  DEFAULT_PRESET_ID,
  findPreset,
  isProtectedPreset,
  settingsEqual,
  shortenName,
} from "../lib/transcodePresets";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

interface FormState {
  name: string;
  settings: TranscodeSettings;
}

export const ManageTranscodePresetsDialog = ({
  open,
  onClose,
  onSaved,
}: Props) => {
  const { state, addTranscodePreset, updateTranscodePreset, deleteTranscodePreset } =
    useApp();
  const { confirm, confirmDialog } = useConfirm();
  const presets = state.transcodePresets;

  // New presets start from the Default baseline so every field is populated.
  const baselineSettings =
    findPreset(presets, DEFAULT_PRESET_ID)?.settings ?? presets[0].settings;

  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<FormState>({
    name: "",
    settings: { ...baselineSettings },
  });
  const [nameError, setNameError] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Admins manage publisher presets; the Default baseline is protected.
  const editablePresets = useMemo(
    () => presets.filter((p) => !isProtectedPreset(p.id)),
    [presets],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setForm({ name: "", settings: { ...baselineSettings } });
    setNameError("");
    // Reset only when the dialog opens; baselineSettings is derived from presets
    // and intentionally excluded so re-renders don't clobber in-progress edits.
  }, [open]);

  const selectedPreset = findPreset(presets, selectedId) ?? null;

  const handlePick = (id: string) => {
    setSelectedId(id);
    setNameError("");
    const preset = findPreset(presets, id);
    if (!preset) {
      setForm({ name: "", settings: { ...baselineSettings } });
      return;
    }
    setForm({ name: preset.name, settings: { ...preset.settings } });
  };

  const updateField = (id: string, value: string) =>
    setForm((prev) => ({ ...prev, settings: { ...prev.settings, [id]: value } }));

  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
    if (nameError) setNameError("");
  };

  const flagNameError = (message: string) => {
    setNameError(message);
    nameInputRef.current?.focus({ preventScroll: true });
  };

  const nameConflict = (excludeId?: string): TranscodePreset | undefined => {
    const target = form.name.trim().toLowerCase();
    return presets.find(
      (p) => p.id !== excludeId && p.name.trim().toLowerCase() === target,
    );
  };

  const requireValidName = (excludeId?: string): boolean => {
    if (!form.name.trim()) {
      flagNameError("Preset name is required");
      return false;
    }
    if (nameConflict(excludeId)) {
      flagNameError(`A preset named "${form.name.trim()}" already exists.`);
      return false;
    }
    return true;
  };

  const hasChanges = useMemo(() => {
    if (!selectedPreset) return false;
    if (form.name.trim() !== selectedPreset.name) return true;
    return !settingsEqual(form.settings, selectedPreset.settings);
  }, [form, selectedPreset]);

  const handleSaveNew = () => {
    if (!requireValidName()) return;
    const name = form.name.trim();
    const preset: TranscodePreset = {
      id: `pub-${newId().slice(0, 8)}`,
      name,
      shortName: shortenName(name),
      settings: { ...form.settings },
    };
    addTranscodePreset(preset);
    setSelectedId(preset.id);
    onSaved?.(`Added preset "${name}"`);
  };

  const handleUpdate = () => {
    if (!selectedPreset) return;
    if (!requireValidName(selectedPreset.id)) return;
    const name = form.name.trim();
    updateTranscodePreset({
      ...selectedPreset,
      name,
      shortName: shortenName(name),
      settings: { ...form.settings },
    });
    onSaved?.(`Updated preset "${name}"`);
  };

  const handleDelete = async () => {
    if (!selectedPreset || isProtectedPreset(selectedPreset.id)) return;
    const ok = await confirm({
      title: "Delete preset?",
      message: `"${selectedPreset.name}" will be removed from the preset catalog. Line-items already transcoded with it keep their settings. This cannot be undone.`,
    });
    if (!ok) return;
    deleteTranscodePreset(selectedPreset.id);
    onSaved?.(`Deleted preset "${selectedPreset.name}"`);
    setSelectedId("");
    setForm({ name: "", settings: { ...baselineSettings } });
  };

  const canDelete = Boolean(selectedPreset) && !isProtectedPreset(selectedId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: "background.paper", borderRadius: 1 },
      }}
    >
      <DialogHeader
        title="Manage Transcoding Presets"
        onClose={onClose}
        tier="sub"
      />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Edit a publisher preset or leave the picker blank to create a new
            one. Presets are shared across all line-items; the Default baseline
            can't be edited here.
          </Typography>

          <Autocomplete
            value={selectedPreset}
            onChange={(_, next) => handlePick(next?.id ?? "")}
            options={editablePresets}
            getOptionLabel={(opt) => opt.name}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Preset"
                placeholder="Select a preset to edit, or leave blank to create new"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />

          <TextField
            label="Preset Name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            error={Boolean(nameError)}
            helperText={nameError || undefined}
            inputRef={nameInputRef}
          />

          <TranscodeFieldsGrid settings={form.settings} onChange={updateField} />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 0.5 }}>
        <Button onClick={handleDelete} disabled={!canDelete} color="primary">
          Delete
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleSaveNew}
          disabled={!form.name.trim()}
          sx={{ color: form.name.trim() ? "primary.main" : "text.disabled" }}
        >
          Save New Preset
        </Button>
        {selectedPreset && (
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges}
            sx={{ color: hasChanges ? "primary.main" : "text.disabled" }}
          >
            Update
          </Button>
        )}
      </DialogActions>
      {confirmDialog}
    </Dialog>
  );
};
