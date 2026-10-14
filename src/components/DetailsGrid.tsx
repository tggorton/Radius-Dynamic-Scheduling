import { Box, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import type { ReactNode } from "react";

export interface DetailField {
  label: string;
  value: ReactNode;
  /** A decorative pencil, as on the existing strip (fields not yet editable). */
  editable?: boolean;
}

interface Props {
  fields: DetailField[];
  columns: number;
}

/**
 * The label-over-value grid used by the line-item details strip, shared with
 * the campaign details so both pages read the same way.
 */
export const DetailsGrid = ({ fields, columns }: Props) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      columnGap: 2,
      rowGap: 2.5,
    }}
  >
    {fields.map((f) => (
      <Box key={f.label} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontSize: 12, mb: 0.5 }}
        >
          {f.label}
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ minWidth: 0 }}>
          {typeof f.value === "string" ? (
            <Typography variant="body2" noWrap title={f.value} sx={{ fontSize: 14 }}>
              {f.value}
            </Typography>
          ) : (
            f.value
          )}
          {f.editable && (
            <EditIcon sx={{ fontSize: 14, color: "text.secondary", ml: 0.5, flexShrink: 0 }} />
          )}
        </Stack>
      </Box>
    ))}
  </Box>
);
