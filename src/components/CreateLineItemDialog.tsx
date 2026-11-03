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
import type { Campaign } from "../types";
import { MEDIA_TYPES, RATE_TYPES } from "../lib/newEntities";
import { useApp } from "../state/AppContext";
import { DialogHeader } from "./DialogHeader";
import { FormPicker } from "./FormPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
  campaign: Campaign;
}

/**
 * Create Line Item, from the campaign's Add New Line Item: Line Item Name,
 * Media Type, Rate Type (the production form). Saving opens the new line item.
 * It starts at the PRD defaults, Immediate → Indefinite in New York, and
 * never inherits the campaign's values (PRD R1, D33); creatives are added
 * from its Weighted Creatives section.
 */
export const CreateLineItemDialog = ({ open, onClose, onSaved, campaign }: Props) => {
  const { createLineItem } = useApp();
  const [name, setName] = useState("");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [rateType, setRateType] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setMediaType(null);
      setRateType(null);
    }
  }, [open]);

  const valid = name.trim() !== "" && mediaType !== null && rateType !== null;

  const handleSave = () => {
    if (!name.trim() || !mediaType || !rateType) return;
    createLineItem(campaign.id, { name: name.trim(), mediaType, rateType });
    onSaved?.(`Created line item "${name.trim()}"`);
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
      <DialogHeader title="Create Line Item" onClose={onClose} />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Line Item Name"
            placeholder="Enter Line Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormPicker
            label="Media Type"
            placeholder="Enter Media Type"
            options={MEDIA_TYPES}
            value={mediaType}
            onChange={setMediaType}
          />
          <FormPicker
            label="Rate Type"
            placeholder="Enter Rate Type"
            options={RATE_TYPES}
            value={rateType}
            onChange={setRateType}
          />
          <Typography variant="caption" color="text.secondary">
            The line item starts Immediate → Indefinite in New York time, independent of the
            campaign's schedule. Set its own dates on the line item page.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!valid} onClick={handleSave}>
          Save Line Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};
