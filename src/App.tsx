import { Box, CssBaseline, Stack, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { AppProvider } from "./state/AppContext";
import { AppSidebar } from "./components/AppSidebar";
import { PageTopBar } from "./components/PageTopBar";
import { LineItemHeader } from "./components/LineItemHeader";
import { CampaignDetailsStub } from "./components/CampaignDetailsStub";
import { CreativesStub } from "./components/CreativesStub";
import { DistrosSection } from "./components/DistrosSection";
import { PixelsStub } from "./components/PixelsStub";

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
            <LineItemHeader name="RedBull_Vid_Stratos_Awareness_Q1_2019" />
            <Stack spacing={5}>
              <CampaignDetailsStub />
              <CreativesStub />
              <DistrosSection />
              <PixelsStub />
            </Stack>
          </Box>
        </Box>
      </Box>
    </AppProvider>
  </ThemeProvider>
);

export default App;
