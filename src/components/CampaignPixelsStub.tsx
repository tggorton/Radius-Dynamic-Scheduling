import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { SectionHeader } from "./SectionHeader";

/** Campaign-level pixels — empty, as in the production sample. Visual only. */
export const CampaignPixelsStub = () => (
  <Box>
    <SectionHeader
      title="Pixels"
      actions={
        <Stack direction="row" spacing={1}>
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
          <TableCell>Pixel Name</TableCell>
          <TableCell>Event Types</TableCell>
          <TableCell>URL</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 5, textAlign: "center" }}>
            <InboxOutlinedIcon sx={{ fontSize: 32, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary">
              No data
            </Typography>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Box>
);
