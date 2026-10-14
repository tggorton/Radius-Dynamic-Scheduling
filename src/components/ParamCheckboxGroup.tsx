import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { ParamDef } from "../types";

interface Props {
  title: string;
  params: ParamDef[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  /** Renders the pencil/edit icon next to the title. Pass a handler to wire
   * it to a manage-params dialog (handles add/edit/delete in one place). */
  onEditRequest?: () => void;
  /** When true, the title is rendered in the primary color. */
  primaryTitle?: boolean;
}

export const ParamCheckboxGroup = ({
  title,
  params,
  selectedIds,
  onChange,
  onEditRequest,
  primaryTitle = true,
}: Props) => {
  const allSelected = params.every((p) => selectedIds.includes(p.id));
  const someSelected = params.some((p) => selectedIds.includes(p.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange(selectedIds.filter((id) => !params.some((p) => p.id === id)));
    } else {
      const merged = new Set([...selectedIds, ...params.map((p) => p.id)]);
      onChange(Array.from(merged));
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: primaryTitle ? "primary.main" : "text.primary",
            fontWeight: 500,
            fontSize: 20,
          }}
        >
          {title}
        </Typography>
        {onEditRequest && (
          <Tooltip title="Add, edit, or remove parameters">
            <IconButton
              size="small"
              onClick={onEditRequest}
              sx={{ color: "text.primary" }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onChange={toggleAll}
            />
          }
          label={<Typography variant="body2">Select All</Typography>}
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          rowGap: 0.5,
          columnGap: 1,
        }}
      >
        {params.map((p) => (
          <FormControlLabel
            key={p.id}
            control={
              <Checkbox
                size="small"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
            }
            label={<Typography variant="body2">{p.label}</Typography>}
          />
        ))}
      </Box>
    </Box>
  );
};
