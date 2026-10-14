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
import { ManageTemplatesDialog } from "./ManageTemplatesDialog";
import type {
  CustomKeyValue,
  Distro,
  Region,
  Template,
  TemplateFamily,
} from "../types";
import { buildTagString } from "../lib/tagBuilder";
import { newId } from "../lib/ids";
import { transcodeLandingStatus } from "../lib/transcodePresets";
import { platformForFamily } from "../lib/pushTargets";
import { isVisibleForCurrentAdvertiser } from "../lib/advertisers";
import { useApp } from "../state/AppContext";
import { TagPreview } from "./TagPreview";
import { ParamCheckboxGroup } from "./ParamCheckboxGroup";
import { CustomFieldsSection } from "./CustomFieldsSection";

interface FormState {
  name: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
}

const emptyFormState = (): FormState => ({
  name: "",
  family: "nexxen",
  region: "usa",
  selectedParams: [],
  selectedCreativeParams: [],
  customKeyValues: [],
});

const distroToFormState = (d: Distro): FormState => ({
  name: d.name,
  family: d.family,
  region: d.region,
  selectedParams: [...d.selectedParams],
  selectedCreativeParams: [...d.selectedCreativeParams],
  customKeyValues: d.customKeyValues.map((kv) => ({ ...kv })),
});

type TemplateFormFields = Omit<FormState, "name">;

const templateToFormFields = (t: Template): TemplateFormFields => ({
  family: t.family,
  region: t.region,
  selectedParams: [...t.selectedParams],
  selectedCreativeParams: [...t.selectedCreativeParams],
  customKeyValues: t.customKeyValues.map((kv) => ({ ...kv, id: newId() })),
});

interface Props {
  open: boolean;
  /** Pass an existing distro to open the editor in "edit" mode. */
  editingDistro?: Distro | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
  /** Save the distro (add or update) and hand it to the push flow, locked to the
   *  tag's platform (its family). Powers "Add + Push" / "Save + Push"; omit to hide it. */
  onAndPush?: (distro: Distro) => void;
}

export const TagEditorDialog = ({
  open,
  editingDistro,
  onClose,
  onSaved,
  onAndPush,
}: Props) => {
  const { state, addDistro, updateDistro, nextDistributionId } = useApp();
  const catalog = state.paramsCatalog;
  const isEditMode = Boolean(editingDistro);
  const isAdmin = state.role === "admin";

  const [templateId, setTemplateId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [nameError, setNameError] = useState(false);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editingDistro) {
      setForm(distroToFormState(editingDistro));
    } else {
      setForm(emptyFormState());
    }
    setTemplateId("");
    setNameError(false);
    setManageTemplatesOpen(false);
  }, [open, editingDistro]);

  const tagString = useMemo(() => buildTagString(form, catalog), [form, catalog]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFamilyChange = (_: unknown, value: TemplateFamily) => {
    if (value === form.family) return;
    setForm((prev) => ({
      ...prev,
      family: value,
      selectedParams: [], // family-specific params don't carry across tabs
    }));
  };

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    // The distro-name field is the user's responsibility — never overwrite
    // it when a template is picked or cleared.
    if (!newTemplateId) {
      setForm((prev) => ({ ...emptyFormState(), name: prev.name }));
      return;
    }
    const tpl = state.templates.find((t) => t.id === newTemplateId);
    if (!tpl) return;
    setForm((prev) => ({ name: prev.name, ...templateToFormFields(tpl) }));
  };

  const requireName = (): boolean => {
    if (form.name.trim().length > 0) return true;
    setNameError(true);
    nameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(
      () => nameInputRef.current?.focus({ preventScroll: true }),
      120,
    );
    return false;
  };

  const handleNameChange = (value: string) => {
    update("name", value);
    if (nameError && value.trim().length > 0) setNameError(false);
  };

  const showTemplateSelector = !isEditMode;
  const dialogTitle = isEditMode ? "Edit Distribution" : "Add New Tag";
  const submitLabel = isEditMode ? "Save" : "Add";
  const familyTitle = form.family === "nexxen" ? "Nexxen Params" : "TTD Params";

  // Distro creators (reg users + admins on Add Distribution Tag) only see
  // templates that are (a) not disabled and (b) unscoped or scoped to the
  // current advertiser.
  const visibleTemplates = useMemo(
    () =>
      state.templates.filter(
        (t) => !t.disabled && isVisibleForCurrentAdvertiser(t.advertiserId),
      ),
    [state.templates],
  );

  const buildNewDistro = (): Distro => ({
    id: newId(),
    name: form.name.trim(),
    templateId: templateId || "manual",
    family: form.family,
    region: form.region,
    selectedParams: form.selectedParams,
    selectedCreativeParams: form.selectedCreativeParams,
    customKeyValues: form.customKeyValues,
    distributionId: nextDistributionId(),
    lineItemId: 4387,
    createdAt: new Date().toISOString(),
    // A new distro inherits the line-item's current transcode plan — one
    // transcode per applied config, each landing on its config's status.
    transcodes: state.transcoding.map((c) => ({
      presetId: c.presetId,
      status: transcodeLandingStatus(c, state.transcodePresets),
    })),
    platformStatus: "notPushed",
  });

  const buildUpdatedDistro = (): Distro => ({
    ...editingDistro!,
    name: form.name.trim(),
    family: form.family,
    region: form.region,
    selectedParams: form.selectedParams,
    selectedCreativeParams: form.selectedCreativeParams,
    customKeyValues: form.customKeyValues,
  });

  const handleSubmit = () => {
    if (!requireName()) return;
    if (isEditMode && editingDistro) {
      updateDistro(buildUpdatedDistro());
      onSaved?.(`Updated "${form.name.trim()}"`);
    } else {
      const distro = buildNewDistro();
      addDistro(distro);
      onSaved?.(`Added "${distro.name}"`);
    }
    onClose();
  };

  // Save the tag (add or update), then hand it to the push flow (platform locked
  // to its family). Available in both modes so a tag can be pushed any time — no
  // "saved" toast here, the push dialog is the feedback.
  const handleSubmitAndPush = () => {
    if (!requireName()) return;
    let distro: Distro;
    if (isEditMode && editingDistro) {
      distro = buildUpdatedDistro();
      updateDistro(distro);
    } else {
      distro = buildNewDistro();
      addDistro(distro);
    }
    onAndPush?.(distro);
    onClose();
  };

  const pushPlatform = platformForFamily(form.family);

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
      <DialogHeader title={dialogTitle} onClose={onClose} />
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Distro Name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            error={nameError}
            helperText={nameError ? "Distro Name is required" : undefined}
            inputRef={nameInputRef}
          />

          {showTemplateSelector && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Autocomplete
                value={
                  visibleTemplates.find((t) => t.id === templateId) ?? null
                }
                onChange={(_, newValue) =>
                  handleTemplateChange(newValue?.id ?? "")
                }
                options={visibleTemplates}
                getOptionLabel={(opt) => opt.name}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tag Template"
                    placeholder="Select Template (optional) — start typing to search"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              {isAdmin && (
                <Tooltip title="Add, edit, or remove templates (admin)">
                  <IconButton
                    size="small"
                    onClick={() => setManageTemplatesOpen(true)}
                    sx={{ color: "text.primary" }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}

          <FormControl>
            <FormLabel
              sx={{
                color: "primary.main",
                "&.Mui-focused": { color: "primary.main" },
                fontSize: 14,
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              Region
            </FormLabel>
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
              />
            </Box>
          </Box>

          <ParamCheckboxGroup
            title="Creative Params"
            params={catalog.creative}
            selectedIds={form.selectedCreativeParams}
            onChange={(next) => update("selectedCreativeParams", next)}
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
        <Button onClick={handleSubmit} sx={{ color: "primary.main" }}>
          {submitLabel}
        </Button>
        {onAndPush && pushPlatform && (
          <Tooltip
            title={`${isEditMode ? "Saves" : "Adds"} the tag, then opens push locked to ${pushPlatform.name}`}
          >
            <Button
              onClick={handleSubmitAndPush}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 1 }}
            >
              {isEditMode ? "Save + Push" : "Add + Push"}
            </Button>
          </Tooltip>
        )}
      </DialogActions>
      {isAdmin && showTemplateSelector && (
        <ManageTemplatesDialog
          open={manageTemplatesOpen}
          onClose={() => setManageTemplatesOpen(false)}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
};
