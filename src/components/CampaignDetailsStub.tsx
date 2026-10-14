import { Box, Paper, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type { ReactNode } from "react";

type Field = {
  label: string;
  value: string;
  decoration?: "edit" | "calendar" | "none";
};

const FIELDS: Field[] = [
  { label: "Line Item ID", value: "18", decoration: "none" },
  { label: "Status", value: "Active", decoration: "edit" },
  { label: "Start Date", value: "3/1/2025", decoration: "calendar" },
  { label: "End Date", value: "5/31/2025", decoration: "calendar" },
  { label: "Rate", value: "$ 0", decoration: "edit" },
  { label: "Impression Budget", value: "0", decoration: "edit" },
  { label: "Reverse Wrap Tag", value: "<not assigned>", decoration: "edit" },
  { label: "3rd Party Tag", value: "<not assigned>", decoration: "edit" },
  { label: "External Name", value: "<not assigned>", decoration: "edit" },
  { label: "Type", value: "video", decoration: "none" },
  { label: "Creative", value: "2 assigned", decoration: "none" },
];

const Decoration = ({ kind }: { kind?: Field["decoration"] }): ReactNode => {
  if (kind === "edit") {
    return (
      <EditIcon
        sx={{
          fontSize: 14,
          color: "text.secondary",
          ml: 0.5,
          verticalAlign: "middle",
        }}
      />
    );
  }
  if (kind === "calendar") {
    return (
      <CalendarTodayIcon
        sx={{
          fontSize: 14,
          color: "text.secondary",
          ml: 0.5,
          verticalAlign: "middle",
        }}
      />
    );
  }
  return null;
};

export const CampaignDetailsStub = () => (
  <Paper
    variant="outlined"
    sx={{
      p: 3,
      borderColor: "divider",
      backgroundColor: "background.paper",
    }}
  >
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
        columnGap: 2,
        rowGap: 0,
      }}
    >
      {FIELDS.map((f) => (
        <Box key={f.label}>
          <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              {f.label}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center">
            <Typography variant="body2" sx={{ fontSize: 14 }}>
              {f.value}
            </Typography>
            <Decoration kind={f.decoration} />
          </Stack>
        </Box>
      ))}
    </Box>
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", fontSize: 12, mb: 0.5 }}
      >
        Creative Playback Version
      </Typography>
      <Typography variant="body2">CTV</Typography>
    </Box>
  </Paper>
);
