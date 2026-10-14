import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DialogHeader } from "./DialogHeader";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/AppContext";
import { newId } from "../lib/ids";
import { MONO_FONT_STACK } from "../theme";
import { useConfirm } from "./ConfirmDialog";
import type { ParamFamilyKey } from "../types";

interface Props {
  open: boolean;
  family: ParamFamilyKey | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

const TITLES: Record<ParamFamilyKey, string> = {
  nexxen: "Manage Nexxen Params",
  ttd: "Manage TTD Params",
  creative: "Manage Creative Params",
};

const SECTION_NAMES: Record<ParamFamilyKey, string> = {
  nexxen: "Nexxen Params",
  ttd: "TTD Params",
  creative: "Creative Params",
};

export const ManageParamsDialog = ({
  open,
  family,
  onClose,
  onSaved,
}: Props) => {
  const { state, addParam, updateParam, deleteParam } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const [addMode, setAddMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newOutput, setNewOutput] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const lastRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddMode(false);
    setNewLabel("");
    setNewOutput("");
    setPendingScrollId(null);
  }, [open]);

  useEffect(() => {
    if (!pendingScrollId) return;
    lastRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setPendingScrollId(null);
  }, [pendingScrollId]);

  if (!family) return null;

  const params = state.paramsCatalog[family];
  const title = TITLES[family];

  const handleLabelEdit = (id: string, label: string) => {
    const existing = params.find((p) => p.id === id);
    if (!existing) return;
    updateParam(family, { ...existing, label });
  };

  const handleOutputEdit = (id: string, output: string) => {
    const existing = params.find((p) => p.id === id);
    if (!existing) return;
    updateParam(family, { ...existing, output });
  };

  const handleDelete = async (id: string, label: string) => {
    const ok = await confirm({
      title: "Delete parameter?",
      message: `"${label}" will be removed. Existing templates and distros that referenced it will silently lose this output. This cannot be undone.`,
    });
    if (!ok) return;
    deleteParam(family, id);
    onSaved?.(`Removed "${label}" from ${SECTION_NAMES[family]}`);
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const id = `param-${newId().slice(0, 8)}`;
    const label = newLabel.trim();
    addParam(family, {
      id,
      label,
      output: newOutput.trim(),
    });
    onSaved?.(`Added "${label}" to ${SECTION_NAMES[family]}`);
    setPendingScrollId(id);
    setNewLabel("");
    setNewOutput("");
    setAddMode(false);
  };

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
      <DialogHeader title={title} onClose={onClose} tier="sub" />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Edit any field to update a parameter immediately. Removing a
            parameter affects this catalog only — selections on existing
            templates/distros that referenced it stop emitting output.
          </Typography>
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              maxHeight: 360,
              overflowY: "auto",
              p: 1.5,
            }}
          >
            {params.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No parameters yet — click <strong>+ Add Param</strong> below.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {params.map((p, i) => (
                  <Stack
                    key={p.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    ref={i === params.length - 1 ? lastRowRef : undefined}
                  >
                    <TextField
                      label="Label"
                      size="small"
                      value={p.label}
                      onChange={(e) => handleLabelEdit(p.id, e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Output"
                      size="small"
                      value={p.output}
                      onChange={(e) => handleOutputEdit(p.id, e.target.value)}
                      sx={{
                        flex: 2,
                        "& .MuiInputBase-input": {
                          fontFamily: MONO_FONT_STACK,
                          fontSize: 12,
                        },
                      }}
                    />
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(p.id, p.label)}
                        sx={{ color: "text.secondary" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
          {addMode ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Label"
                size="small"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                sx={{ flex: 1 }}
                autoFocus
              />
              <TextField
                label="Output"
                size="small"
                value={newOutput}
                onChange={(e) => setNewOutput(e.target.value)}
                placeholder="&key=value"
                sx={{
                  flex: 2,
                  "& .MuiInputBase-input": {
                    fontFamily: MONO_FONT_STACK,
                    fontSize: 12,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleAdd}
                disabled={!newLabel.trim()}
              >
                Add
              </Button>
              <Button
                size="small"
                onClick={() => setAddMode(false)}
                color="primary"
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Box>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setAddMode(true)}
              >
                + Add Param
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Done
        </Button>
      </DialogActions>
      {confirmDialog}
    </Dialog>
  );
};
