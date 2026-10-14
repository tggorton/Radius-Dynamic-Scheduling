import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { SectionHeader } from "./SectionHeader";

const creatives = [
  {
    name: "Stratos_Hero_30s",
    creativeId: "8421",
    playbackMode: "CTV",
    status: "Active",
    weighting: "60%",
  },
  {
    name: "Stratos_Cutdown_15s",
    creativeId: "8422",
    playbackMode: "Mobile",
    status: "Active",
    weighting: "40%",
  },
];

export const CreativesStub = () => (
  <Box>
    <SectionHeader
      title="Creatives"
      actions={
        <Button variant="outlined" color="primary" size="small">
          Add Creative
        </Button>
      }
    />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Creative ID</TableCell>
          <TableCell>Playback Mode</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <span>Weighting</span>
              <Tooltip title="Recalculate weights (visual only)">
                <IconButton size="small" sx={{ color: "text.secondary", p: 0.25 }}>
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {creatives.map((c) => (
          <TableRow key={c.creativeId} hover>
            <TableCell>
              <Typography variant="body2">{c.name}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {c.creativeId}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{c.playbackMode}</Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={c.status}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 22 }}
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2">{c.weighting}</Typography>
            </TableCell>
            <TableCell align="right">
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);
