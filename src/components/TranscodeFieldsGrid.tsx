import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { TranscodeSettings } from "../types";
import {
  TRANSCODE_FIELDS,
  type TranscodeField,
  type TranscodeFieldGroup,
} from "../lib/transcodePresets";

const GROUP_TITLES: Record<TranscodeFieldGroup, string> = {
  video: "Video",
  audio: "Audio",
};

const GROUPS: TranscodeFieldGroup[] = ["video", "audio"];

const FieldInput = ({
  field,
  value,
  onChange,
}: {
  field: TranscodeField;
  value: string;
  onChange: (value: string) => void;
}) => (
  <TextField
    select={field.type === "select"}
    label={field.label}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    size="small"
    fullWidth
    InputLabelProps={{ shrink: true }}
    helperText={field.type === "text" ? field.helperText : undefined}
  >
    {field.type === "select" &&
      field.options?.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
  </TextField>
);

interface Props {
  settings: TranscodeSettings;
  onChange: (id: string, value: string) => void;
}

/**
 * The Video / Audio transcode field grid, shared by the user's Transcoding
 * Settings dialog and the admin preset manager so both render an identical sheet.
 */
export const TranscodeFieldsGrid = ({ settings, onChange }: Props) => (
  <Stack spacing={3}>
    {GROUPS.map((group) => (
      <Box key={group}>
        <Typography
          variant="h6"
          sx={{ color: "primary.main", fontWeight: 500, fontSize: 20, mb: 1.5 }}
        >
          {GROUP_TITLES[group]}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: 2,
            rowGap: 2,
          }}
        >
          {TRANSCODE_FIELDS.filter((f) => f.group === group).map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={settings[f.id]}
              onChange={(value) => onChange(f.id, value)}
            />
          ))}
        </Box>
      </Box>
    ))}
  </Stack>
);
