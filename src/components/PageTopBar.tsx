import {
  Box,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useApp } from "../state/AppContext";

export const PageTopBar = () => {
  const { state, setRole } = useApp();
  const isAdmin = state.role === "admin";

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-end"
      sx={{ px: 4, pt: 2, pb: 1, gap: 2 }}
    >
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
      <IconButton size="small" sx={{ color: "text.secondary" }}>
        <NotificationsNoneIcon />
      </IconButton>
    </Stack>
  );
};
