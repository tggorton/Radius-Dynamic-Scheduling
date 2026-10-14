import { useEffect, useState } from "react";
import { InputAdornment, TextField, Tooltip, Typography } from "@mui/material";

interface Props {
  /** The share applied right now, or null when this creative isn't Serving (D28). */
  share: number | null;
  /** The weight the user typed, kept until reset; null = auto split. */
  customWeight: number | null;
  /** How many creatives on this line item are Serving right now. */
  servingCount: number;
  onChange: (weight: number | null) => void;
}

/**
 * The Weighting cell. Weights only split delivery among Serving creatives, so
 * a creative that isn't Serving shows "–", and the only Serving creative is a
 * fixed 100%. Otherwise the applied share is editable: typing sets a weight
 * the others re-balance around; clearing the field goes back to the auto split.
 * Commits on blur or Enter so the other rows don't jump while typing.
 */
export const CreativeWeightField = ({ share, customWeight, servingCount, onChange }: Props) => {
  const [draft, setDraft] = useState(share === null ? "" : String(share));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(share === null ? "" : String(share));
  }, [share, editing]);

  if (share === null) {
    return (
      <Tooltip
        title={`Not serving right now, so it gets no share.${
          customWeight !== null ? ` Your ${customWeight}% applies again once it's serving.` : ""
        }`}
      >
        <Typography variant="body2" color="text.disabled" sx={{ display: "inline-block", px: 1 }}>
          –
        </Typography>
      </Tooltip>
    );
  }

  if (servingCount === 1) {
    return (
      <Tooltip title="The only creative serving right now always gets 100%.">
        <Typography variant="body2" sx={{ display: "inline-block", px: 1 }}>
          100%
        </Typography>
      </Tooltip>
    );
  }

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(null);
      return;
    }
    const n = Number.parseInt(trimmed, 10);
    if (Number.isNaN(n)) return;
    onChange(Math.min(100, Math.max(0, n)));
  };

  const scaled = customWeight !== null && customWeight !== share;

  return (
    <Tooltip
      title={
        customWeight !== null
          ? `Set to ${customWeight}%. Clear the field to go back to the auto split.`
          : "Auto split among the serving creatives. Type a weight to set it."
      }
    >
      <TextField
        size="small"
        value={draft}
        onFocus={() => setEditing(true)}
        onChange={(e) => {
          if (/^\d{0,3}$/.test(e.target.value)) setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        helperText={scaled ? `set ${customWeight}%` : undefined}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        }}
        inputProps={{ "aria-label": "Creative weight percentage", inputMode: "numeric" }}
        sx={{
          width: 88,
          "& input": { textAlign: "right", color: customWeight !== null ? "text.primary" : "text.secondary" },
          "& .MuiFormHelperText-root": { mx: 0 },
        }}
      />
    </Tooltip>
  );
};
