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

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const ManageRegionsDialog = ({ open, onClose, onSaved }: Props) => {
  const { state, addRegion, updateRegion, deleteRegion } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const lastRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddMode(false);
    setNewName("");
    setNewBaseUrl("");
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

  const regions = state.regions;

  const handleNameEdit = (id: string, name: string) => {
    const existing = regions.find((r) => r.id === id);
    if (!existing) return;
    updateRegion({ ...existing, name });
  };

  const handleBaseUrlEdit = (id: string, baseUrl: string) => {
    const existing = regions.find((r) => r.id === id);
    if (!existing) return;
    updateRegion({ ...existing, baseUrl });
  };

  const handleDelete = async (id: string, name: string) => {
    if (regions.length <= 1) {
      onSaved?.(
        "Can't delete the last region — add another one first.",
      );
      return;
    }
    const ok = await confirm({
      title: "Delete region?",
      message: `"${name}" will be removed. Existing distros tied to this region fall back to a default base URL. This cannot be undone.`,
    });
    if (!ok) return;
    deleteRegion(id);
    onSaved?.(`Removed region "${name}"`);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = `region-${newId().slice(0, 8)}`;
    const name = newName.trim();
    addRegion({ id, name, baseUrl: newBaseUrl.trim() });
    onSaved?.(`Added region "${name}"`);
    setPendingScrollId(id);
    setNewName("");
    setNewBaseUrl("");
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
      <DialogHeader title="Manage Regions" onClose={onClose} tier="sub" />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Edit any field to update a region immediately. Removing a region
            affects this list only — distros tied to a deleted region fall
            back to a default base URL until you reassign them.
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
            {regions.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No regions yet — click <strong>+ Add Region</strong> below.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {regions.map((r, i) => (
                  <Stack
                    key={r.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    ref={i === regions.length - 1 ? lastRowRef : undefined}
                  >
                    <TextField
                      label="Name"
                      size="small"
                      value={r.name}
                      onChange={(e) => handleNameEdit(r.id, e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Base URL"
                      size="small"
                      value={r.baseUrl}
                      onChange={(e) => handleBaseUrlEdit(r.id, e.target.value)}
                      placeholder="https://radius.video/v1/distributions"
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
                        onClick={() => handleDelete(r.id, r.name)}
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
                label="Name"
                size="small"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                sx={{ flex: 1 }}
                autoFocus
              />
              <TextField
                label="Base URL"
                size="small"
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
                placeholder="https://radius.video/v1/distributions"
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
                disabled={!newName.trim()}
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
                + Add Region
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
