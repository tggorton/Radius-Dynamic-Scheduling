import { Box, Stack, Tooltip, Typography } from "@mui/material";

interface Props {
  /** Theme color token for the dot, e.g. "success.main". */
  color: string;
  label: string;
  /** Tooltip text. */
  description: string;
  /** Render the dot as a ring rather than a filled circle. */
  outlined?: boolean;
  /** Trailing context, e.g. "Live: Hulu (Disney)". `full` shows at wide widths,
   *  `short` below the `lg` breakpoint. */
  suffix?: { full: string; short: string } | null;
}

/**
 * Colored dot + label (+ optional suffix), shared by the Transcoding Status and
 * Platform Status columns. The dot alone would encode meaning in color only,
 * which fails for color-blind users — the label is what makes it readable.
 */
export const StatusChip = ({
  color,
  label,
  description,
  outlined,
  suffix,
}: Props) => {
  // Only split into responsive spans when the two forms actually differ.
  const responsive = suffix && suffix.full !== suffix.short;
  return (
    <Tooltip title={description}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ display: "inline-flex" }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: outlined ? "transparent" : color,
            border: outlined ? "1.5px solid" : "none",
            borderColor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
          {suffix &&
            (responsive ? (
              <>
                {": "}
                <Box
                  component="span"
                  sx={{ display: { xs: "none", lg: "inline" } }}
                >
                  {suffix.full}
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: "inline", lg: "none" } }}
                >
                  {suffix.short}
                </Box>
              </>
            ) : (
              `: ${suffix.full}`
            ))}
        </Typography>
      </Stack>
    </Tooltip>
  );
};
