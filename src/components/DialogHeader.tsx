import { DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  title: string;
  onClose: () => void;
  /**
   * Which dialog tier this is (see CLAUDE.md):
   *   "primary" — top-level dialog, pink h4 title (Tag Editor, Manage Templates…)
   *   "sub"     — nested sub-dialog, white h6 title (Manage Regions/Params…)
   */
  tier?: "primary" | "sub";
}

/**
 * The shared dialog header: title + absolutely-positioned close button. Both
 * tiers were duplicated verbatim across every dialog; this is the single source
 * so the title hierarchy stays consistent.
 */
export const DialogHeader = ({ title, onClose, tier = "primary" }: Props) => {
  const isPrimary = tier === "primary";
  return (
    <DialogTitle sx={isPrimary ? { pr: 6, pt: 3, pb: 2 } : { pr: 6, py: 2 }}>
      <Typography
        variant={isPrimary ? "h4" : "h6"}
        component="div"
        sx={
          isPrimary
            ? { color: "primary.main", fontWeight: 400 }
            : { fontWeight: 500 }
        }
      >
        {title}
      </Typography>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};
