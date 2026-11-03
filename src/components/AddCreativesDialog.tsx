import { useEffect, useState } from "react";
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";
import type { LineItem } from "../types";
import { CREATIVE_LIBRARY, type LibraryCreative } from "../lib/creativeLibrary";
import { useApp } from "../state/AppContext";
import { DialogHeader } from "./DialogHeader";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
  lineItem: LineItem;
}

/**
 * Add Creatives (from the multi-creative demo and the production picker):
 * search the creative library, pick one or more, Add. New creatives start
 * at the PRD defaults, Immediate → Indefinite in New York (R1, D33); their
 * weight joins the auto split. Creatives already on a line item aren't listed
 * — a creative belongs to one line item until shared creatives (D27) land.
 */
export const AddCreativesDialog = ({ open, onClose, onSaved, lineItem }: Props) => {
  const { state, addCreatives } = useApp();
  const [selected, setSelected] = useState<LibraryCreative[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const taken = new Set(state.creatives.map((c) => c.id));
  const options = CREATIVE_LIBRARY.filter((c) => !taken.has(c.id));

  const handleAdd = () => {
    if (selected.length === 0) return;
    addCreatives(lineItem.id, selected);
    onSaved?.(
      selected.length === 1
        ? `Added ${selected[0].name}`
        : `Added ${selected.length} creatives`,
    );
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
      <DialogHeader title="Add Creatives" onClose={onClose} />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Autocomplete<LibraryCreative, true>
          multiple
          options={options}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          noOptionsText="No creatives left to add"
          renderOption={(props, option) => {
            const liProps: Record<string, unknown> = { ...props };
            delete liProps.key;
            return (
              <li {...liProps} key={option.id}>
                {option.name}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {option.id}
                </Typography>
              </li>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} label={option.name} size="small" color="primary" {...tagProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              label="Search to Select"
              placeholder={selected.length === 0 ? "Start typing…" : ""}
              sx={{ mt: 1 }}
            />
          )}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          New creatives start Immediate → Indefinite in New York time. Set their own dates
          from their row.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={selected.length === 0} onClick={handleAdd}>
          Add{selected.length > 0 ? ` (${selected.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
