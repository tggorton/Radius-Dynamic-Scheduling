import {
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useState, type MouseEvent } from "react";
import type { Distro, DistroStatus, PlatformStatus } from "../types";
import { buildDistroUrl } from "../lib/tagBuilder";
import { STATUS_META, STATUS_ORDER, isRestartable } from "../lib/distroStatus";
import {
  PLATFORM_STATUS_META,
  PLATFORM_STATUS_ORDER,
} from "../lib/platformStatus";
import { transcodePublisher } from "../lib/transcodePresets";
import { useApp } from "../state/AppContext";
import { StatusChip } from "./StatusChip";

interface Props {
  distros: Distro[];
  onCopy: (distro: Distro) => void;
  onEdit: (distro: Distro) => void;
  onDelete: (distro: Distro) => void;
  onRestart: (distro: Distro) => void;
  /**
   * Prototype-only affordances: force a status from the ⋯ menu so the restart /
   * push flows are demoable. The backend owns these lifecycles in production.
   */
  onSetStatus: (distro: Distro, status: DistroStatus) => void;
  onSetPlatformStatus: (distro: Distro, status: PlatformStatus) => void;
  onUnlinkPlatform: (distro: Distro) => void;
  onRelinkPlatform: (distro: Distro) => void;
}

const platformSuffix = (distro: Distro) =>
  distro.pushTarget
    ? { full: distro.pushTarget.platform, short: distro.pushTarget.platform }
    : null;

export const DistroTable = ({
  distros,
  onCopy,
  onEdit,
  onDelete,
  onRestart,
  onSetStatus,
  onSetPlatformStatus,
  onUnlinkPlatform,
  onRelinkPlatform,
}: Props) => {
  const { state } = useApp();
  const catalog = state.paramsCatalog;
  const regions = state.regions;
  const presets = state.transcodePresets;
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeDistro, setActiveDistro] = useState<Distro | null>(null);

  const openMenu = (event: MouseEvent<HTMLButtonElement>, distro: Distro) => {
    setMenuAnchor(event.currentTarget);
    setActiveDistro(distro);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setActiveDistro(null);
  };

  const handleEdit = () => {
    if (activeDistro) onEdit(activeDistro);
    closeMenu();
  };

  const handleDelete = () => {
    if (activeDistro) onDelete(activeDistro);
    closeMenu();
  };

  const handleSetStatus = (status: DistroStatus) => {
    if (activeDistro) onSetStatus(activeDistro, status);
    closeMenu();
  };

  const handleSetPlatformStatus = (status: PlatformStatus) => {
    if (activeDistro) onSetPlatformStatus(activeDistro, status);
    closeMenu();
  };

  if (distros.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 6, textAlign: "center" }}
      >
        No distributions yet — click <strong>+ Add Distribution Tag</strong> to
        create one.
      </Typography>
    );
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell sx={{ minWidth: 180 }}>Transcode Status</TableCell>
            <TableCell sx={{ minWidth: 150 }}>Platform Status</TableCell>
            <TableCell>Distribution Tag</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {distros.map((d) => {
            const url = buildDistroUrl(d, catalog, regions);
            const restartable = d.transcodes.some((t) =>
              isRestartable(t.status),
            );
            // Link icon reflects STATE: a successful push shows the linked
            // (link-on) icon and can be unlinked; Error / Inactive show the
            // unlinked (link-off) icon and can be relinked to their remembered
            // target. Not pushed / Pushing → disabled.
            const linkedOn = d.platformStatus === "success";
            const canRelink =
              (d.platformStatus === "inactive" ||
                d.platformStatus === "error") &&
              Boolean(d.pushTarget);
            const linkEnabled = linkedOn || canRelink;
            const linkTip = linkedOn
              ? `Unlink from ${d.pushTarget?.platform ?? "platform"}`
              : canRelink
                ? `Link to ${d.pushTarget?.platform ?? "platform"}`
                : d.platformStatus === "pushing"
                  ? "Pushing…"
                  : "Not pushed — nothing to link";
            return (
              <TableRow key={d.id} hover>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>
                    {d.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", py: 1 }}>
                  <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
                    {d.transcodes.map((t, i) => (
                      <StatusChip
                        key={i}
                        {...STATUS_META[t.status]}
                        suffix={transcodePublisher(t.presetId, presets)}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <StatusChip
                    {...PLATFORM_STATUS_META[d.platformStatus]}
                    suffix={platformSuffix(d)}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 540 }}>
                  <Typography
                    variant="body2"
                    title={url}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {url}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                    <Tooltip title="Copy tag URL">
                      <IconButton
                        size="small"
                        onClick={() => onCopy(d)}
                        sx={{ color: "text.secondary" }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        restartable
                          ? "Restart the distro's transcodes (retries Error, rebuilds Inactive)"
                          : "Restart applies when a transcode is Inactive or Error"
                      }
                    >
                      {/* span: a disabled button emits no events, so the Tooltip
                          needs a wrapper to stay hoverable. */}
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onRestart(d)}
                          disabled={!restartable}
                          sx={{ color: "text.secondary" }}
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={linkTip}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() =>
                            linkedOn ? onUnlinkPlatform(d) : onRelinkPlatform(d)
                          }
                          disabled={!linkEnabled}
                          sx={{ color: "text.secondary" }}
                        >
                          {linkedOn ? (
                            <LinkIcon fontSize="small" />
                          ) : (
                            <LinkOffIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, d)}
                        sx={{ color: "text.secondary" }}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 0.5 },
          },
        }}
      >
        <MenuItem onClick={handleEdit}>Edit Tag</MenuItem>
        <MenuItem onClick={closeMenu}>Launch Test Page</MenuItem>
        <MenuItem onClick={closeMenu}>Launch Test Page (3rd Party Tag)</MenuItem>
        <MenuItem onClick={closeMenu}>View Report</MenuItem>
        <Divider />
        <ListItemText
          sx={{ px: 2, py: 0.5, m: 0 }}
          primary="Set transcode status — all (prototype)"
          primaryTypographyProps={{
            variant: "overline",
            color: "text.secondary",
          }}
        />
        {STATUS_ORDER.map((status) => (
          <MenuItem
            key={status}
            selected={activeDistro?.transcodes.every(
              (t) => t.status === status,
            )}
            onClick={() => handleSetStatus(status)}
          >
            <StatusChip {...STATUS_META[status]} />
          </MenuItem>
        ))}
        <Divider />
        <ListItemText
          sx={{ px: 2, py: 0.5, m: 0 }}
          primary="Set platform status (prototype)"
          primaryTypographyProps={{
            variant: "overline",
            color: "text.secondary",
          }}
        />
        {PLATFORM_STATUS_ORDER.map((status) => (
          <MenuItem
            key={status}
            selected={activeDistro?.platformStatus === status}
            onClick={() => handleSetPlatformStatus(status)}
          >
            <StatusChip {...PLATFORM_STATUS_META[status]} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={handleDelete}
          sx={{ color: "primary.main" }}
        >
          Delete Tag
        </MenuItem>
      </Menu>
    </>
  );
};
