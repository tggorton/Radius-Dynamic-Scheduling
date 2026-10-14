import { useState } from "react";
import {
  Box,
  ButtonBase,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  WEEKDAYS,
  formatIsoDate,
  formatMonth,
  monthGrid,
  parseIsoDate,
  shiftMonth,
  type YearMonth,
} from "../lib/scheduleCalendar";

/** A no-date choice listed above the calendar, e.g. "Same as campaign" or "Immediate". */
export interface DatePreset {
  key: string;
  label: string;
  /** Secondary text in the menu, e.g. the parent's value. */
  detail?: string;
}

interface Props {
  label: string;
  /** No-date choices, default first (what an empty field means). */
  presets: DatePreset[];
  /** The chosen preset's key, or null while a Specific date is chosen. */
  selectedPreset: string | null;
  /** "YYYY-MM-DD", or "" when no date is picked yet. */
  date: string;
  /** Today in the schedule's zone ("YYYY-MM-DD"), highlighted in the grid. */
  today: string;
  error?: boolean;
  onSelectPreset: (key: string) => void;
  onSelectDate: (date: string) => void;
}

/**
 * A date field whose dropdown offers the no-date choices (for a campaign,
 * Immediate / Indefinite; for a child, "Same as …" first) above a month
 * calendar, so the mode isn't a separate control. A picked date can be
 * cleared, which returns to the default (first) preset — "leave it empty"
 * (D32). Dates are plain "YYYY-MM-DD" strings; nothing here reads the
 * browser's zone (D21).
 */
export const ScheduleDateField = ({
  label,
  presets,
  selectedPreset,
  date,
  today,
  error,
  onSelectPreset,
  onSelectDate,
}: Props) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [month, setMonth] = useState<YearMonth>({ y: 2026, m: 1 });

  const open = (el: HTMLElement) => {
    const p = parseIsoDate(date) ?? parseIsoDate(today);
    if (p) setMonth({ y: p.y, m: p.m });
    setAnchor(el);
  };
  const close = () => setAnchor(null);

  const weeks = monthGrid(month).filter((w) => w.some(Boolean));
  const isPreset = selectedPreset !== null;
  const display = isPreset
    ? (presets.find((p) => p.key === selectedPreset)?.label ?? "")
    : formatIsoDate(date);

  return (
    <>
      <TextField
        label={label}
        size="small"
        value={display}
        placeholder="Select a date"
        error={error}
        onClick={(e) => open(e.currentTarget)}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              {!isPreset && (
                <Tooltip title={`Clear (${presets[0].label})`}>
                  <IconButton
                    size="small"
                    aria-label={`Clear ${label.toLowerCase()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPreset(presets[0].key);
                    }}
                    sx={{ color: "text.secondary", mr: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <CalendarTodayIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
        sx={{ flex: 1, "& .MuiInputBase-root, & input": { cursor: "pointer" } }}
      />
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 280 } }}
      >
        {presets.map((p) => (
          <MenuItem
            key={p.key}
            selected={selectedPreset === p.key}
            onClick={() => {
              onSelectPreset(p.key);
              close();
            }}
            sx={{ py: 1.25, display: "block" }}
          >
            {p.label}
            {p.detail && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {p.detail}
              </Typography>
            )}
          </MenuItem>
        ))}
        <Divider sx={{ my: 0 }} />
        <Box sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <IconButton size="small" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatMonth(month)}
            </Typography>
            <IconButton size="small" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
            {WEEKDAYS.map((d) => (
              <Typography key={d} variant="caption" align="center" sx={{ color: "text.disabled", py: 0.5 }}>
                {d}
              </Typography>
            ))}
            {weeks.flat().map((iso, i) => {
              if (!iso) return <Box key={`blank-${i}`} />;
              const selected = !isPreset && iso === date;
              const isToday = iso === today;
              return (
                <ButtonBase
                  key={iso}
                  onClick={() => {
                    onSelectDate(iso);
                    close();
                  }}
                  sx={{
                    height: 34,
                    borderRadius: 1,
                    typography: "body2",
                    border: 1,
                    borderColor: isToday && !selected ? "divider" : "transparent",
                    backgroundColor: selected ? "primary.main" : "transparent",
                    color: selected ? "primary.contrastText" : "text.primary",
                    "&:hover": { backgroundColor: selected ? "primary.dark" : "action.hover" },
                  }}
                >
                  {Number(iso.slice(8))}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
