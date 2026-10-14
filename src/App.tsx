import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { AppProvider } from "./state/AppContext";
import { AppSidebar } from "./components/AppSidebar";
import { PageTopBar } from "./components/PageTopBar";
import { CurrentPage } from "./components/CurrentPage";

export const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AppProvider>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
        }}
      >
        <AppSidebar />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PageTopBar />
          <Box sx={{ px: 4, pb: 8 }}>
            <CurrentPage />
          </Box>
        </Box>
      </Box>
    </AppProvider>
  </ThemeProvider>
);

export default App;
