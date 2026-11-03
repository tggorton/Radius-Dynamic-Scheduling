import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LINES_OF_BUSINESS, VERTICALS } from "../lib/newEntities";
import { useApp } from "../state/AppContext";
import { DialogHeader } from "./DialogHeader";
import { FormPicker } from "./FormPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

/**
 * Create Campaign, from the advertiser page: Name, Vertical, Line of Business
 * (the production form). Saving opens the new campaign. It starts at the PRD
 * defaults, Immediate → Indefinite in New York time (R1, D33).
 */
export const CreateCampaignDialog = ({ open, onClose, onSaved }: Props) => {
  const { createCampaign } = useApp();
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState<string | null>(null);
  const [lineOfBusiness, setLineOfBusiness] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setVertical(null);
      setLineOfBusiness(null);
    }
  }, [open]);

  const valid = name.trim() !== "" && vertical !== null && lineOfBusiness !== null;

  const handleSave = () => {
    if (!name.trim() || !vertical || !lineOfBusiness) return;
    createCampaign({ name: name.trim(), vertical, lineOfBusiness });
    onSaved?.(`Created campaign "${name.trim()}"`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: "background.paper", borderRadius: 1 } }}
    >
      <DialogHeader title="Create Campaign" onClose={onClose} />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            placeholder="Enter Campaign Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormPicker
            label="Vertical"
            placeholder="Select Vertical"
            options={VERTICALS}
            value={vertical}
            onChange={setVertical}
          />
          <FormPicker
            label="Line of Business"
            placeholder="Select Line of Business"
            options={LINES_OF_BUSINESS}
            value={lineOfBusiness}
            onChange={setLineOfBusiness}
          />
          <Typography variant="caption" color="text.secondary">
            The campaign starts Immediate → Indefinite in New York time. Set specific dates
            and a timezone with Edit Schedule on the campaign page.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!valid} onClick={handleSave}>
          Save Campaign
        </Button>
      </DialogActions>
    </Dialog>
  );
};
