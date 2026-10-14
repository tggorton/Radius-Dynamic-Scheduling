import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { SectionHeader } from "./SectionHeader";

const pixels: Array<{ name: string; url: string; events: string }> = [
  {
    name: "test pcta",
    url: "https://radius.video/v1/distributions/7097?line-item-id=18",
    events: "test pcta",
  },
  {
    name: "stratos_completion",
    url: "https://radius.video/v1/distributions/7098?line-item-id=18",
    events: "Completion, Quartile",
  },
  {
    name: "stratos_clickthrough",
    url: "https://radius.video/v1/distributions/7099?line-item-id=18",
    events: "Click",
  },
];

export const PixelsStub = () => (
  <Box>
    <SectionHeader
      title="Pixels"
      actions={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="primary" size="small">
            Import Pixels
          </Button>
          <Button variant="outlined" color="primary" size="small">
            Export CSV Template
          </Button>
          <Button variant="outlined" color="primary" size="small">
            Link Event Pixels
          </Button>
          <Button variant="outlined" color="primary" size="small">
            Create Event Pixel
          </Button>
        </Stack>
      }
    />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Pixel URL</TableCell>
          <TableCell>Event Types</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {pixels.map((p) => (
          <TableRow key={p.name} hover>
            <TableCell>
              <Typography variant="body2">{p.name}</Typography>
            </TableCell>
            <TableCell sx={{ maxWidth: 540 }}>
              <Typography
                variant="body2"
                title={p.url}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.url}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{p.events}</Typography>
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
