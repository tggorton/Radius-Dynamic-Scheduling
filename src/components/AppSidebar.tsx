import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { KervLogo } from "./KervLogo";

const ICON_BASE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com";

const NAV_ITEMS: Array<{ key: string; tooltip: string; src: string }> = [
  {
    key: "advertisers",
    tooltip: "Advertisers",
    src: `${ICON_BASE}/advertisers-EC4ZJ9kp79Ke3WTLMlrHY3eywSwYap.png`,
  },
  {
    key: "creatives",
    tooltip: "Creatives",
    src: `${ICON_BASE}/creatives-Xqkj3NjXpc79TcEuz3XEanlm6hWuhX.png`,
  },
  {
    key: "io-tool",
    tooltip: "IO Tool",
    src: `${ICON_BASE}/io-tool-iGbeIPETENaG3HMc4vqIkepLZlAumI.png`,
  },
  {
    key: "pixels",
    tooltip: "Pixels",
    src: `${ICON_BASE}/pixels-XCMiqGo4zuv0I1nxQGI069kc9jznCR.png`,
  },
  {
    key: "segments",
    tooltip: "Segments",
    src: `${ICON_BASE}/segments-p2FLgDddfptE6Epdo4BGIGYmn4tUfY.png`,
  },
  {
    key: "products",
    tooltip: "Products",
    src: `${ICON_BASE}/products-G3JPk9tRbj92OSOQK4LNsF0HsWOySS.png`,
  },
  {
    key: "reporting",
    tooltip: "Reporting",
    src: `${ICON_BASE}/reporting-KXnw1mzm7NbKEH54WguCFNxIHNz9Iz.png`,
  },
  {
    key: "admin",
    tooltip: "Admin",
    src: `${ICON_BASE}/admin-lU7qIzZqk8v4Bs96p2D7m8v5rtGykC.png`,
  },
  {
    key: "support",
    tooltip: "Support",
    src: `${ICON_BASE}/support-8m3XYHIj6J8jOxYru251SigB0Bn8cS.png`,
  },
];

const LOGOUT = {
  key: "logout",
  tooltip: "Logout",
  src: `${ICON_BASE}/logout-8kRgp4U9Xb7A8c3iVYAxgw8CinX9tG.png`,
};

const NavIcon = ({
  src,
  tooltip,
}: {
  src: string;
  tooltip: string;
}) => (
  <Tooltip title={tooltip} placement="right">
    <IconButton
      size="small"
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        opacity: 0.75,
        transition: "opacity 120ms",
        "&:hover": { opacity: 1, backgroundColor: "rgba(255,255,255,0.06)" },
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        sx={{ width: 22, height: 22, display: "block" }}
      />
    </IconButton>
  </Tooltip>
);

export const AppSidebar = () => (
  <Box
    component="aside"
    aria-label="Primary navigation"
    sx={{
      width: 80,
      backgroundColor: "secondary.main",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      pt: 4,
      pb: 2,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
    }}
  >
    <KervLogo size={44} />
    <Stack spacing={1} sx={{ flex: 1, alignItems: "center", mt: 5 }}>
      {NAV_ITEMS.map((item) => (
        <NavIcon key={item.key} src={item.src} tooltip={item.tooltip} />
      ))}
    </Stack>
    <NavIcon src={LOGOUT.src} tooltip={LOGOUT.tooltip} />
  </Box>
);
