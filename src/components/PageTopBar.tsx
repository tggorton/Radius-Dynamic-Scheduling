import {
  Box,
  Divider,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useApp } from "../state/AppContext";
import { SimulatedClockControl } from "./SimulatedClockControl";
import { useConfirm } from "./ConfirmDialog";

/**
 * The baseline's User / Admin role toggle. Hidden in this prototype: none of
 * the scheduling work is admin-gated. Flip to bring it (and the admin pencils
 * in Tag Editor / Transcoding) back.
 */
const SHOW_ROLE_TOGGLE = false;

export const PageTopBar = () => {
  const { state, setRole, setMode, resetDemo } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const isAdmin = state.role === "admin";
  const isDemo = state.mode === "demo";

  // With the toggle hidden, a saved Admin role would leave admin-only controls
  // showing with no way to switch them off, so fall back to User.
  useEffect(() => {
    if (!SHOW_ROLE_TOGGLE && isAdmin) setRole("user");
  }, [isAdmin, setRole]);

  const handleRestart = async () => {
    const ok = await confirm({
      title: "Restart the demo?",
      message:
        "Every campaign, line item, and creative built in Demo mode is removed, and you start again at the advertiser. The preset sample isn't affected.",
      confirmLabel: "Restart",
    });
    if (ok) resetDemo();
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      sx={{ px: 4, pt: 2, pb: 1, gap: 2 }}
    >
      <SimulatedClockControl />
      <Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />
      {/* Prototype-only: preset sample data vs. building a campaign from scratch.
          The restart sits right beside the toggle it belongs to. */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
        <Tooltip
          title={
            isDemo
              ? "Demo: start at the advertiser and build a campaign, line items, and creatives. Toggle for the preset sample."
              : "Preset sample: the seeded campaign 4074. Toggle for Demo, which starts empty at the advertiser."
          }
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="caption" color={isDemo ? "text.secondary" : "text.primary"}>
              Preset sample
            </Typography>
            <Switch
              size="small"
              checked={isDemo}
              onChange={(e) => setMode(e.target.checked ? "demo" : "sample")}
              inputProps={{ "aria-label": "Demo mode" }}
            />
            <Typography variant="caption" color={isDemo ? "text.primary" : "text.secondary"}>
              Demo
            </Typography>
          </Box>
        </Tooltip>
        {isDemo && (
          <Tooltip title="Restart the demo">
            <IconButton size="small" onClick={handleRestart} sx={{ color: "text.secondary" }}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {SHOW_ROLE_TOGGLE && (
        <>
          <Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />
          <Tooltip
            title={`Prototype role: ${isAdmin ? "Admin" : "User"} — toggle to switch`}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography
                variant="caption"
                color={isAdmin ? "text.secondary" : "text.primary"}
              >
                User
              </Typography>
              <Switch
                size="small"
                checked={isAdmin}
                onChange={(e) => setRole(e.target.checked ? "admin" : "user")}
              />
              <Typography
                variant="caption"
                color={isAdmin ? "text.primary" : "text.secondary"}
              >
                Admin
              </Typography>
            </Box>
          </Tooltip>
        </>
      )}
      <IconButton size="small" sx={{ color: "text.secondary" }}>
        <NotificationsNoneIcon />
      </IconButton>
      {confirmDialog}
    </Stack>
  );
};
