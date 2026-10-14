import { createTheme } from "@mui/material/styles";

const PINK = "#EF0078";
const PINK_HOVER = "#D82388";
const NAV_BLUE = "#001529";
const PAPER = "#383838";
const SUNKEN = "#1a1a1a";
const BORDER = "#5D5D5D";

/**
 * Deep orange for the `outOfSpec` distro status. It has to sit clearly apart
 * from BOTH neighbours it will be scanned against in the status column:
 * `processing` amber (#ffa726, yellow-leaning) and `error` red (#f44336).
 */
const OUT_OF_SPEC_ORANGE = "#F26522";

const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Monospace stack for tag strings, param outputs, and base URLs — anywhere the
 * user reads raw tag syntax. Import this rather than re-typing a stack inline.
 */
export const MONO_FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/**
 * `background.sunken` is a recessed surface that reads as *below* the paper
 * surface — used for read-only code/preview panels (see TagPreview).
 *
 * `outOfSpec` is a status color, not a UI intent — see lib/distroStatus.ts.
 * MUI has no built-in slot between `warning` and `error`, so it gets its own.
 */
declare module "@mui/material/styles" {
  interface TypeBackground {
    sunken: string;
  }
  interface Palette {
    outOfSpec: Palette["primary"];
  }
  interface PaletteOptions {
    outOfSpec?: PaletteOptions["primary"];
  }
}

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: PINK, dark: PINK_HOVER, contrastText: "#ffffff" },
    secondary: { main: NAV_BLUE },
    outOfSpec: { main: OUT_OF_SPEC_ORANGE, contrastText: "#000000" },
    background: { default: "#000000", paper: PAPER, sunken: SUNKEN },
    text: {
      primary: "#ffffff",
      secondary: "#cdcdcd",
      disabled: "rgba(255,255,255,0.38)",
    },
    divider: BORDER,
    action: {
      hover: "#1e1e1e",
      selected: "rgba(239,0,120,0.12)",
    },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: SYSTEM_FONT_STACK,
    h4: { fontWeight: 400, letterSpacing: 0 },
    h5: { fontWeight: 400, letterSpacing: 0 },
    h6: { fontWeight: 500, letterSpacing: "0.0075em" },
    overline: { letterSpacing: "0.08em" },
    button: { fontWeight: 600, letterSpacing: "0.04em" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontWeight: 600,
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCheckbox: { defaultProps: { color: "primary" } },
    MuiRadio: { defaultProps: { color: "primary" } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: "rgba(255,255,255,0.23)" },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: PINK, height: 3 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontWeight: 600,
          minWidth: 80,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "12px 16px",
          borderColor: BORDER,
        },
        head: {
          color: "#cdcdcd",
          fontWeight: 500,
          backgroundColor: "transparent",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: BORDER },
      },
    },
  },
});
