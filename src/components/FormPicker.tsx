import { Autocomplete, TextField } from "@mui/material";

interface Props {
  label: string;
  placeholder: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/** A searchable single-choice field, like the production create forms' dropdowns. */
export const FormPicker = ({ label, placeholder, options, value, onChange }: Props) => (
  <Autocomplete<string>
    options={options}
    value={value}
    onChange={(_, v) => onChange(v)}
    renderInput={(params) => (
      <TextField {...params} label={label} placeholder={placeholder} InputLabelProps={{ shrink: true }} />
    )}
  />
);
