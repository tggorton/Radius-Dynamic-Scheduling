import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogHeader } from "./DialogHeader";
import type {
  CustomKeyValue,
  ParamFamilyKey,
  Region,
  Template,
  TemplateFamily,
} from "../types";
import { buildTagString } from "../lib/tagBuilder";
import { newId } from "../lib/ids";
import { ADVERTISER_OPTIONS } from "../lib/advertisers";
import { useApp } from "../state/AppContext";
import { TagPreview } from "./TagPreview";
import { ParamCheckboxGroup } from "./ParamCheckboxGroup";
import { CustomFieldsSection } from "./CustomFieldsSection";
import { DeleteTemplatesDialog } from "./DeleteTemplatesDialog";
import { ManageParamsDialog } from "./ManageParamsDialog";
import { ManageRegionsDialog } from "./ManageRegionsDialog";

interface ManageFormState {
  templateName: string;
  advertiserId: string; // "" means none / all advertisers
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
}

const emptyManageState = (): ManageFormState => ({
  templateName: "",
  advertiserId: "",
  family: "nexxen",
  region: "usa",
  selectedParams: [],
  selectedCreativeParams: [],
  customKeyValues: [],
});

const templateToManageState = (t: Template): ManageFormState => ({
  templateName: t.name,
  advertiserId: t.advertiserId ?? "",
  family: t.family,
  region: t.region,
  selectedParams: [...t.selectedParams],
  selectedCreativeParams: [...t.selectedCreativeParams],
  customKeyValues: t.customKeyValues.map((kv) => ({ ...kv, id: newId() })),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const ManageTemplatesDialog = ({ open, onClose, onSaved }: Props) => {
  const { state, addTemplate, updateTemplate } = useApp();
  const catalog = state.paramsCatalog;

  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ManageFormState>(emptyManageState);
  const [nameErrorMessage, setNameErrorMessage] = useState<string>("");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [manageParamsFamily, setManageParamsFamily] =
    useState<ParamFamilyKey | null>(null);
  const [manageRegionsOpen, setManageRegionsOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setForm(emptyManageState());
    setNameErrorMessage("");
    setBulkDeleteOpen(false);
    setManageParamsFamily(null);
    setManageRegionsOpen(false);
  }, [open]);

  const tagString = useMemo(
    () =>
      buildTagString(
        {
          family: form.family,
          selectedParams: form.selectedParams,
          selectedCreativeParams: form.selectedCreativeParams,
          customKeyValues: form.customKeyValues,
        },
        catalog,
      ),
    [form, catalog],
  );

  const update = <K extends keyof ManageFormState>(
    key: K,
    value: ManageFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedTemplate = useMemo(
    () => state.templates.find((t) => t.id === selectedId) ?? null,
    [selectedId, state.templates],
  );

  const handleTemplatePick = (id: string) => {
    setSelectedId(id);
    setNameErrorMessage("");
    if (!id) {
      setForm(emptyManageState());
      return;
    }
    const tpl = state.templates.find((t) => t.id === id);
    if (!tpl) return;
    setForm(templateToManageState(tpl));
  };

  const handleFamilyChange = (_: unknown, value: TemplateFamily) => {
    if (value === form.family) return;
    setForm((prev) => ({
      ...prev,
      family: value,
      selectedParams: [],
    }));
  };

  const handleNameChange = (value: string) => {
    update("templateName", value);
    if (nameErrorMessage) setNameErrorMessage("");
  };

  const handleAdvertiserChange = (value: string) => {
    update("advertiserId", value);
    if (nameErrorMessage) setNameErrorMessage("");
  };

  const flagNameError = (message: string) => {
    setNameErrorMessage(message);
    nameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(
      () => nameInputRef.current?.focus({ preventScroll: true }),
      120,
    );
  };

  const requireName = (): boolean => {
    if (form.templateName.trim().length > 0) return true;
    flagNameError("Template Name is required");
    return false;
  };

  /**
   * Templates are uniquely identified by the (name, advertiserId) tuple. Two
   * templates with identical name + advertiser would be indistinguishable in
   * the dropdown; the user explicitly does not want this. Same name + a
   * different advertiser is fine — the dropdown renders "name — advertiser-XX"
   * so they're visually distinguishable.
   */
  const findNameConflict = (excludeId?: string) => {
    const targetName = form.templateName.trim().toLowerCase();
    const targetAdv = form.advertiserId || undefined;
    return state.templates.find(
      (t) =>
        t.id !== excludeId &&
        t.name.trim().toLowerCase() === targetName &&
        (t.advertiserId ?? undefined) === targetAdv,
    );
  };

  const conflictMessage = (conflict: Template): string => {
    const advClause = conflict.advertiserId
      ? `for advertiser "${conflict.advertiserId}"`
      : `with no advertiser scope`;
    return `A template named "${conflict.name}" ${advClause} already exists. Use a different name (e.g. "${conflict.name}b") or pick a different advertiser to differentiate.`;
  };

  // Save New is enabled when there's any meaningful configuration to save.
  const hasAnySelection =
    form.selectedParams.length > 0 ||
    form.selectedCreativeParams.length > 0 ||
    form.customKeyValues.some((kv) => kv.key.trim().length > 0);

  // Update is enabled when the form has actually diverged from the loaded
  // template (including name + advertiser, since this view edits both).
  const hasChanges = useMemo(() => {
    if (!selectedTemplate) return false;
    if (form.templateName.trim() !== selectedTemplate.name) return true;
    if (form.advertiserId !== (selectedTemplate.advertiserId ?? ""))
      return true;
    if (form.family !== selectedTemplate.family) return true;
    if (form.region !== selectedTemplate.region) return true;
    const sameSet = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      const sa = [...a].sort();
      const sb = [...b].sort();
      return sa.every((v, i) => v === sb[i]);
    };
    if (!sameSet(form.selectedParams, selectedTemplate.selectedParams))
      return true;
    if (
      !sameSet(
        form.selectedCreativeParams,
        selectedTemplate.selectedCreativeParams,
      )
    )
      return true;
    if (form.customKeyValues.length !== selectedTemplate.customKeyValues.length)
      return true;
    const formKvs = form.customKeyValues
      .map((kv) => JSON.stringify([kv.key, kv.value]))
      .sort();
    const origKvs = selectedTemplate.customKeyValues
      .map((kv) => JSON.stringify([kv.key, kv.value]))
      .sort();
    return formKvs.some((v, i) => v !== origKvs[i]);
  }, [form, selectedTemplate]);

  const handleSaveNew = () => {
    if (!requireName()) return;
    // Block duplicate (name, advertiser) tuples so the dropdown stays
    // unambiguous. Don't exclude any existing template — this is a brand-new
    // template, so any existing match is a conflict.
    const conflict = findNameConflict();
    if (conflict) {
      flagNameError(conflictMessage(conflict));
      return;
    }
    const newTemplate: Template = {
      id: `tpl-${newId().slice(0, 8)}`,
      name: form.templateName.trim(),
      family: form.family,
      region: form.region,
      selectedParams: form.selectedParams,
      selectedCreativeParams: form.selectedCreativeParams,
      customKeyValues: form.customKeyValues,
      advertiserId: form.advertiserId || undefined,
    };
    addTemplate(newTemplate);
    setSelectedId(newTemplate.id);
    setForm(templateToManageState(newTemplate));
    onSaved?.(`Saved template "${newTemplate.name}"`);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    if (!requireName()) return;
    // For Update, exclude the template being updated from the conflict scan —
    // updating a template to its own current (name, advertiser) is a no-op,
    // not a conflict. But renaming/rescoping into another existing template's
    // tuple still gets blocked.
    const conflict = findNameConflict(selectedTemplate.id);
    if (conflict) {
      flagNameError(conflictMessage(conflict));
      return;
    }
    const updated: Template = {
      ...selectedTemplate,
      name: form.templateName.trim(),
      family: form.family,
      region: form.region,
      selectedParams: form.selectedParams,
      selectedCreativeParams: form.selectedCreativeParams,
      customKeyValues: form.customKeyValues,
      advertiserId: form.advertiserId || undefined,
    };
    updateTemplate(updated);
    // Re-sync form so hasChanges flips back to false on the now-saved state.
    setForm(templateToManageState(updated));
    onSaved?.(`Updated template "${updated.name}"`);
  };

  // If the currently-selected template was deleted from elsewhere (e.g. via
  // the Delete/Disable Templates dialog), clear the form so the picker
  // doesn't dangle on a stale id.
  useEffect(() => {
    if (selectedId && !state.templates.find((t) => t.id === selectedId)) {
      setSelectedId("");
      setForm(emptyManageState());
    }
  }, [selectedId, state.templates]);

  const familyTitle = form.family === "nexxen" ? "Nexxen Params" : "TTD Params";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none",
          borderRadius: 1,
        },
      }}
    >
      <DialogHeader title="Manage Templates" onClose={onClose} />
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Template Name"
            value={form.templateName}
            onChange={(e) => handleNameChange(e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            error={Boolean(nameErrorMessage)}
            helperText={nameErrorMessage || undefined}
            inputRef={nameInputRef}
          />

          <Stack spacing={0.5}>
            <Autocomplete
              value={state.templates.find((t) => t.id === selectedId) ?? null}
              onChange={(_, newValue) =>
                handleTemplatePick(newValue?.id ?? "")
              }
              options={state.templates}
              getOptionLabel={(opt) => {
                const base = opt.advertiserId
                  ? `${opt.name} — ${opt.advertiserId}`
                  : opt.name;
                return opt.disabled ? `${base} (disabled)` : base;
              }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  key={option.id}
                  sx={{ opacity: option.disabled ? 0.5 : 1 }}
                >
                  {option.advertiserId
                    ? `${option.name} — ${option.advertiserId}`
                    : option.name}
                  {option.disabled ? " (disabled)" : ""}
                </Box>
              )}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tag Template"
                  placeholder="Select a template to edit, or leave blank to create new"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                onClick={() => setBulkDeleteOpen(true)}
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontSize: 12,
                  minWidth: 0,
                  px: 0.5,
                }}
              >
                Delete / Disable Templates
              </Button>
            </Box>
          </Stack>

          <Autocomplete
            value={form.advertiserId || null}
            onChange={(_, newValue) => handleAdvertiserChange(newValue ?? "")}
            options={ADVERTISER_OPTIONS}
            isOptionEqualToValue={(opt, val) => opt === val}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Advertiser"
                placeholder="None (all advertisers) — start typing to search"
                InputLabelProps={{ shrink: true }}
                helperText="Optional — limits this template's visibility to a specific advertiser"
              />
            )}
          />

          <FormControl>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <FormLabel
                sx={{
                  color: "primary.main",
                  "&.Mui-focused": { color: "primary.main" },
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Region
              </FormLabel>
              <Tooltip title="Add, edit, or remove regions">
                <IconButton
                  size="small"
                  onClick={() => setManageRegionsOpen(true)}
                  sx={{ color: "text.primary" }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <RadioGroup
              row
              value={form.region}
              onChange={(e) => update("region", e.target.value as Region)}
            >
              {state.regions.map((r) => (
                <FormControlLabel
                  key={r.id}
                  value={r.id}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">{r.name}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <TagPreview tagString={tagString} />

          <Box>
            <Tabs
              value={form.family}
              onChange={handleFamilyChange}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab value="nexxen" label="NEXXEN" />
              <Tab value="ttd" label="TTD" />
            </Tabs>
            <Box sx={{ pt: 3 }}>
              <ParamCheckboxGroup
                title={familyTitle}
                params={catalog[form.family]}
                selectedIds={form.selectedParams}
                onChange={(next) => update("selectedParams", next)}
                onEditRequest={() => setManageParamsFamily(form.family)}
              />
            </Box>
          </Box>

          <ParamCheckboxGroup
            title="Creative Params"
            params={catalog.creative}
            selectedIds={form.selectedCreativeParams}
            onChange={(next) => update("selectedCreativeParams", next)}
            onEditRequest={() => setManageParamsFamily("creative")}
          />

          <CustomFieldsSection
            items={form.customKeyValues}
            onChange={(items) => update("customKeyValues", items)}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 0.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleSaveNew}
          disabled={!hasAnySelection}
          sx={{
            color: hasAnySelection ? "primary.main" : "text.disabled",
          }}
        >
          Save New Template
        </Button>
        {selectedTemplate && (
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges}
            sx={{
              color: hasChanges ? "primary.main" : "text.disabled",
            }}
          >
            Update
          </Button>
        )}
      </DialogActions>
      <DeleteTemplatesDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onSaved={onSaved}
      />
      <ManageParamsDialog
        open={Boolean(manageParamsFamily)}
        family={manageParamsFamily}
        onClose={() => setManageParamsFamily(null)}
        onSaved={onSaved}
      />
      <ManageRegionsDialog
        open={manageRegionsOpen}
        onClose={() => setManageRegionsOpen(false)}
        onSaved={onSaved}
      />
    </Dialog>
  );
};
