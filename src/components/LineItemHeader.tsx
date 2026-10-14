import { Button, IconButton, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { ParentMenuButton } from "./ParentMenuButton";

interface Props {
  name: string;
  campaignName: string;
  onBackToCampaign: () => void;
}

/**
 * Line-item title row. The way back to the campaign lives behind the same
 * chevron the campaign header uses: it opens a menu listing the parent
 * campaign, and picking it opens the campaign view.
 */
export const LineItemHeader = ({ name, campaignName, onBackToCampaign }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={2}
    sx={{ mb: 3 }}
  >
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
      <ParentMenuButton kind="Campaign" name={campaignName} onSelect={onBackToCampaign} />
      <Typography variant="h6" noWrap title={name} sx={{ ml: 1, fontWeight: 500, minWidth: 0 }}>
        {name}
      </Typography>
      <IconButton size="small" sx={{ color: "text.secondary", ml: 0.5 }}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Stack>
    <Button
      variant="contained"
      color="primary"
      sx={{
        backgroundColor: "primary.main",
        "&:hover": { backgroundColor: "primary.dark" },
        px: 2.5,
        py: 1,
        flexShrink: 0,
      }}
    >
      Clone This Line Item
    </Button>
  </Stack>
);
