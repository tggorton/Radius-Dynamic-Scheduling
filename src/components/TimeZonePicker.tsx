import { Autocomplete, TextField } from "@mui/material";
import { useMemo } from "react";
import { buildTimeZoneOptions, type TimeZoneOption } from "../lib/timezones";

interface Props {
  value: string;
  onChange: (zone: string) => void;
  /** The instant offsets/abbreviations are shown for. */
  now: number;
  /** D22: no specific times of this entity's own, so the zone has no effect yet. */
  muted?: boolean;
  /** Helper text under the field (what the zone applies to right now). */
  helperText: string;
}

/**
 * Searchable IANA timezone picker: US zones pinned first, then every zone by
 * region. Nothing here detects or applies the browser's zone (D9, D21).
 */
export const TimeZonePicker = ({ value, onChange, now, muted, helperText }: Props) => {
  const options = useMemo(() => buildTimeZoneOptions(now), [now]);
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <Autocomplete<TimeZoneOption, false, true>
      options={options}
      value={selected ?? undefined}
      onChange={(_, option) => option && onChange(option.id)}
      groupBy={(o) => o.group}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.key === b.key}
      disableClearable
      size="small"
      fullWidth
      renderOption={(props, option) => {
        const liProps: Record<string, unknown> = { ...props };
        delete liProps.key;
        return (
          <li {...liProps} key={option.key}>
            {option.label}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Timezone"
          helperText={helperText}
          sx={muted ? { "& .MuiInputBase-input": { color: "text.secondary" } } : undefined}
        />
      )}
    />
  );
};
