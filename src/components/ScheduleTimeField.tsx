import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { TIME_OPTIONS, formatTime12, parseTimeInput } from "../lib/scheduleTime";

interface Props {
  label: string;
  /** "HH:mm" (24-hour), or "" when no time is set. */
  value: string;
  onChange: (hhmm: string) => void;
  error?: boolean;
}

/** Lowercase with spaces, dots, and colons removed: "9:30 PM" → "930pm", "21:30" → "2130". */
const squash = (s: string) => s.toLowerCase().replace(/[\s.:]/g, "");

/**
 * The time half of a Specific bound. Replaces the browser's native time
 * picker, whose scrolling columns loop endlessly and are easy to overshoot.
 *
 * - Type any time ("9:30 PM", "930pm", "21:30"); it's read when you leave the
 *   field or press Enter.
 * - Or pick from a plain list — every 15 minutes, 12:00 AM to 11:45 PM, plus
 *   11:59 PM for end-of-day ends. The list stops at both ends (no looping),
 *   opens scrolled to the current time, and narrows as you type.
 *
 * Only "HH:mm" strings pass through here, so the browser's timezone never
 * applies (D21).
 */
export const ScheduleTimeField = ({ label, value, onChange, error }: Props) => {
  const [input, setInput] = useState(formatTime12(value));
  const [invalid, setInvalid] = useState(false);

  // Follow outside changes (dialog reset, preset switch).
  useEffect(() => {
    setInput(formatTime12(value));
    setInvalid(false);
  }, [value]);

  const commit = (text: string) => {
    if (text.trim() === "") {
      setInvalid(false);
      onChange("");
      return;
    }
    const parsed = parseTimeInput(text);
    if (parsed) {
      setInvalid(false);
      setInput(formatTime12(parsed));
      onChange(parsed);
    } else {
      setInvalid(true);
    }
  };

  return (
    <Autocomplete<string, false, false, true>
      freeSolo
      openOnFocus
      forcePopupIcon
      popupIcon={<AccessTimeIcon fontSize="small" />}
      options={TIME_OPTIONS}
      value={value || null}
      inputValue={input}
      getOptionLabel={(o) => formatTime12(o) || o}
      // Show the whole list while the field holds its current time; narrow it
      // once the user starts typing something else.
      filterOptions={(options, state) => {
        const q = squash(state.inputValue);
        if (!q || state.inputValue === formatTime12(value)) return options;
        return options.filter((o) => squash(formatTime12(o)).startsWith(q) || squash(o).startsWith(q));
      }}
      onInputChange={(_, v, reason) => {
        if (reason === "input" || reason === "clear") setInput(v);
      }}
      onChange={(_, v) => commit(v ?? "")}
      onBlur={() => commit(input)}
      ListboxProps={{ style: { maxHeight: 264 } }}
      size="small"
      sx={{
        flex: 1,
        // A clock icon shouldn't flip upside down like a dropdown caret.
        "& .MuiAutocomplete-popupIndicatorOpen": { transform: "none" },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="e.g. 9:30 AM"
          error={error || invalid}
          helperText={invalid ? "Enter a time like 9:30 AM or 21:30." : undefined}
          InputLabelProps={{ shrink: true }}
        />
      )}
    />
  );
};
