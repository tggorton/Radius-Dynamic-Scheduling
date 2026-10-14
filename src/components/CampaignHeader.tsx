import { Button, IconButton, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { ADVERTISER } from "../lib/newEntities";
import { ParentMenuButton } from "./ParentMenuButton";

interface Props {
  name: string;
  onBackToAdvertiser: () => void;
}

/**
 * Campaign title row — same shape as the line-item header. The chevron opens
 * a menu with the advertiser. The buttons are visual only.
 */
export const CampaignHeader = ({ name, onBackToAdvertiser }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={2}
    sx={{ mb: 3 }}
  >
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
      <ParentMenuButton kind="Advertiser" name={ADVERTISER.name} onSelect={onBackToAdvertiser} />
      <Typography variant="h6" noWrap title={name} sx={{ ml: 1, fontWeight: 500, minWidth: 0 }}>
        {name}
      </Typography>
      <IconButton size="small" sx={{ color: "text.secondary", ml: 0.5 }}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Stack>
    <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
      <Button variant="outlined" color="primary" sx={{ px: 2.5, py: 1 }}>
        Export Campaign Details
      </Button>
      <Button
        variant="contained"
        color="primary"
        sx={{
          backgroundColor: "primary.main",
          "&:hover": { backgroundColor: "primary.dark" },
          px: 2.5,
          py: 1,
        }}
      >
        Clone This Campaign
      </Button>
    </Stack>
  </Stack>
);
