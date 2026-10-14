import { Button, IconButton, Stack, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EditIcon from "@mui/icons-material/Edit";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

interface Props {
  name: string;
}

export const LineItemHeader = ({ name }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ mb: 3 }}
  >
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton size="small" sx={{ color: "text.secondary" }}>
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>
      <NavigateNextIcon sx={{ color: "text.secondary", fontSize: 18 }} />
      <Typography variant="h6" sx={{ ml: 1, fontWeight: 500 }}>
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
      }}
    >
      Clone This Line Item
    </Button>
  </Stack>
);
