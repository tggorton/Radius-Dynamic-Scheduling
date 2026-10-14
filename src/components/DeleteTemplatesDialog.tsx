import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useApp } from "../state/AppContext";
import { DialogHeader } from "./DialogHeader";
import { useConfirm } from "./ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const DeleteTemplatesDialog = ({ open, onClose, onSaved }: Props) => {
  const { state, deleteTemplates, setTemplateDisabled } = useApp();
  const { confirm, confirmDialog } = useConfirm();

  const handleToggleEnabled = (id: string, currentlyDisabled: boolean) => {
    const template = state.templates.find((t) => t.id === id);
    if (!template) return;
    // Checkbox checked = enabled, unchecked = disabled. So this is a flip.
    const nextDisabled = !currentlyDisabled;
    setTemplateDisabled(id, nextDisabled);
    onSaved?.(
      `${nextDisabled ? "Disabled" : "Enabled"} template "${template.name}"`,
    );
  };

  const handleDeleteOne = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete template?",
      message: `"${name}" will be removed entirely. Existing distros that used this template are unaffected — they're self-contained snapshots. This cannot be undone.`,
    });
    if (!ok) return;
    deleteTemplates([id]);
    onSaved?.(`Deleted "${name}"`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: "background.paper", borderRadius: 1 },
      }}
    >
      <DialogHeader title="Delete / Disable Templates" onClose={onClose} tier="sub" />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        {state.templates.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            No templates available.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Checkbox</strong> toggles enabled / disabled. A disabled
              template stays hidden from the regular Add Distribution Tag
              dropdown but remains visible (greyed out) here so it can be
              re-enabled. The <strong>trash</strong> icon deletes a template
              entirely — existing distros that used it are unaffected.
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              <List dense disablePadding>
                {state.templates.map((t) => {
                  const isDisabled = Boolean(t.disabled);
                  return (
                    <ListItem
                      key={t.id}
                      disablePadding
                      sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        "&:last-of-type": { borderBottom: 0 },
                        py: 0.5,
                        opacity: isDisabled ? 0.55 : 1,
                      }}
                      secondaryAction={
                        <Tooltip title="Delete template entirely">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDeleteOne(t.id, t.name)}
                            sx={{ color: "text.secondary", mr: 0.5 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 44, pl: 1 }}>
                        <Tooltip
                          title={
                            isDisabled
                              ? "Disabled — check to re-enable"
                              : "Enabled — uncheck to disable"
                          }
                        >
                          <Checkbox
                            edge="start"
                            checked={!isDisabled}
                            onChange={() =>
                              handleToggleEnabled(t.id, isDisabled)
                            }
                            size="small"
                          />
                        </Tooltip>
                      </ListItemIcon>
                      <ListItemText
                        primary={t.name}
                        secondary={
                          <>
                            {t.family.toUpperCase()}
                            {t.advertiserId ? ` · ${t.advertiserId}` : ""}
                            {isDisabled ? " · disabled" : ""}
                          </>
                        }
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          sx: { letterSpacing: "0.04em" },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Stack>
        )}
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
