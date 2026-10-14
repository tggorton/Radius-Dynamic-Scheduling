import { Box, Stack, Typography, type StackProps } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  actions?: ReactNode;
  spacing?: StackProps["spacing"];
}

export const SectionHeader = ({ title, actions, spacing = 1 }: Props) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ mb: spacing }}
  >
    <Typography variant="h6" sx={{ fontWeight: 400 }}>
      {title}
    </Typography>
    {actions && <Box>{actions}</Box>}
  </Stack>
);
