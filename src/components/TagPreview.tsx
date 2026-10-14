import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";
import { MONO_FONT_STACK } from "../theme";

interface Props {
  tagString: string;
  placeholder?: string;
}

export const TagPreview = ({
  tagString,
  placeholder = "OVERLAY STRING PREVIEW",
}: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tagString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: "background.sunken",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        minHeight: 120,
        px: 2,
        py: 1.5,
        pr: 6,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontFamily: MONO_FONT_STACK,
          fontSize: 12,
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
          color: tagString ? "text.primary" : "text.secondary",
          letterSpacing: tagString ? "normal" : "0.08em",
          textTransform: tagString ? "none" : "uppercase",
        }}
      >
        {tagString || placeholder}
      </Typography>
      <Tooltip title={copied ? "Copied!" : "Copy"}>
        <span>
          <IconButton
            size="small"
            onClick={handleCopy}
            disabled={!tagString}
            sx={{ position: "absolute", top: 6, right: 6, color: "text.primary" }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
