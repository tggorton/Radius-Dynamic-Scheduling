import { Box, Stack, Typography, type StackProps } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  /** A one-line caption under the title (e.g. Weighted Creatives' fallback note). */
  subtitle?: string;
  actions?: ReactNode;
  spacing?: StackProps["spacing"];
}

export const SectionHeader = ({ title, subtitle, actions, spacing = 1 }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ mb: spacing }}
  >
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 400 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Box>{actions}</Box>}
  </Stack>
);
