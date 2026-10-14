import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useState } from "react";
import { DialogHeader } from "./DialogHeader";
import { useConfirm } from "./ConfirmDialog";
import { useApp } from "../state/AppContext";
import { PLATFORM_STATUS_META } from "../lib/platformStatus";
import {
  PUSH_PLATFORMS,
  fetchPlatformAdvertisers,
  platformForFamily,
  type PlatformAdvertiser,
  type PushPlatform,
} from "../lib/pushTargets";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Fires the push: the selected distro ids plus the chosen destination. */
  onPush: (
    ids: string[],
    platform: PushPlatform,
    advertiser: PlatformAdvertiser,
  ) => void;
  /** Pre-select a platform on open (used by "Add + Push"). */
  initialPlatformId?: string | null;
  /** Pre-select these tags on open (else the chosen platform's tags are selected). */
  initialSelectedIds?: string[];
  /** Lock the platform picker — the destination is fixed by the tag. */
  lockPlatform?: boolean;
}

export const PushTagsDialog = ({
  open,
  onClose,
  onPush,
  initialPlatformId,
  initialSelectedIds,
  lockPlatform = false,
}: Props) => {
  const { state } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const distros = state.distros;

  const [platform, setPlatform] = useState<PushPlatform | null>(null);
  const [advertiser, setAdvertiser] = useState<PlatformAdvertiser | null>(null);
  const [advertisers, setAdvertisers] = useState<PlatformAdvertiser[]>([]);
  const [loadingAdvertisers, setLoadingAdvertisers] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const initPlatform = initialPlatformId
      ? PUSH_PLATFORMS.find((p) => p.id === initialPlatformId) ?? null
      : null;
    setPlatform(initPlatform);
    setAdvertiser(null);
    setAdvertisers([]);
    setLoadingAdvertisers(false);
    // No platform yet → nothing selected; choosing a platform selects its tags.
    // A caller can override with an explicit initial selection (Add + Push).
    setSelectedIds(
      initialSelectedIds ??
        (initPlatform
          ? distros.filter((d) => d.family === initPlatform.id).map((d) => d.id)
          : []),
    );
  }, [open, distros, initialPlatformId, initialSelectedIds]);

  // Advertisers are platform-scoped, so (re)fetch whenever the platform changes
  // OR the dialog opens. The `open` dep matters for "Add + Push": the platform is
  // set on open and may be the same object as last time (PUSH_PLATFORMS is a
  // stable constant), so a platform-only dep wouldn't refire and the list — just
  // cleared on open — would stay empty. `stale` guards against a slow response
  // for a platform the user has already switched away from.
  useEffect(() => {
    if (!open || !platform) {
      setAdvertisers([]);
      return;
    }
    let stale = false;
    setLoadingAdvertisers(true);
    fetchPlatformAdvertisers(platform.id).then((result) => {
      if (stale) return;
      setAdvertisers(result);
      setLoadingAdvertisers(false);
      // Sticky advertiser: default to the last one pushed to this platform.
      const remembered = state.platformAdvertisers[platform.id];
      if (remembered) {
        const match = result.find((a) => a.id === remembered.id);
        if (match) setAdvertiser(match);
      }
    });
    return () => {
      stale = true;
    };
  }, [open, platform, state.platformAdvertisers]);

  // Once a platform has an advertiser for this line-item, it's LOCKED — the
  // advertiser can't be changed (linking a platform+advertiser is non-trivial
  // on the backend, so a line-item keeps one advertiser per platform). Only the
  // first push to a platform picks the advertiser.
  const advertiserLocked = Boolean(
    platform && state.platformAdvertisers[platform.id],
  );

  // A tag can only be pushed to the platform it was built for (its family). The
  // platform picker always lists every platform; choosing one auto-selects that
  // platform's tags and disables the rest, so the user rarely touches the
  // checklist — they just switch platform to push a different set.
  const isEligible = (family: string) => platform !== null && family === platform.id;
  const eligibleDistros = useMemo(
    () => (platform ? distros.filter((d) => d.family === platform.id) : []),
    [distros, platform],
  );

  const handlePlatformChange = (next: PushPlatform | null) => {
    setPlatform(next);
    // The old advertiser belongs to the old platform — never carry it across.
    setAdvertiser(null);
    // Auto-select every tag built for the chosen platform (deselect the rest).
    // The user can still uncheck individual tags for a partial push.
    setSelectedIds(
      next ? distros.filter((d) => d.family === next.id).map((d) => d.id) : [],
    );
  };

  const selectedCount = selectedIds.length;
  const allSelected =
    eligibleDistros.length > 0 && selectedCount === eligibleDistros.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : eligibleDistros.map((d) => d.id));

  const canPush = Boolean(platform && advertiser && selectedCount > 0);

  const pushLabel = useMemo(
    () =>
      selectedCount > 0
        ? `Push ${selectedCount} Tag${selectedCount === 1 ? "" : "s"}`
        : "Push Tags",
    [selectedCount],
  );

  const handlePush = async () => {
    if (!platform || !advertiser || selectedCount === 0) return;
    // The FIRST push to a platform locks its advertiser for this line-item, so
    // spell out the scope before it happens. Once locked (advertiserLocked), later
    // pushes reuse it silently and skip this.
    if (!advertiserLocked) {
      const ok = await confirm({
        title: "Lock this advertiser to the platform?",
        message:
          "Assigning an advertiser locks it to this 3rd party system globally within the Radius Platform. The association is significant and can't be changed without support. Make sure this is the right advertiser before continuing.",
        confirmLabel: "Assign & Push",
      });
      if (!ok) return;
    }
    onPush(selectedIds, platform, advertiser);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none",
          borderRadius: 1,
        },
      }}
    >
      <DialogHeader title="Push Tags to Platform" onClose={onClose} />
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            A tag can only be pushed to the platform it was built for. Pick a
            platform and its tags are selected automatically (the others are
            disabled); switch platforms to push a different set. One push goes to a
            single platform + advertiser.
          </Typography>

          <Autocomplete
            value={platform}
            onChange={(_, newValue) => handlePlatformChange(newValue)}
            options={PUSH_PLATFORMS}
            getOptionLabel={(opt) => opt.name}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            disabled={lockPlatform}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Platform"
                placeholder="Select a platform — start typing to search"
                InputLabelProps={{ shrink: true }}
                helperText={
                  lockPlatform
                    ? "Locked to this tag's platform"
                    : "Selecting a platform selects its tags"
                }
              />
            )}
          />

          <Autocomplete
            value={advertiser}
            onChange={(_, newValue) => setAdvertiser(newValue)}
            options={advertisers}
            getOptionLabel={(opt) => `${opt.name} · ${opt.advertiserId}`}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            // Once set, the advertiser is truly locked: the field is *disabled*
            // (not merely read-only) and carries a lock icon + "contact support"
            // tooltip, since re-linking a platform+advertiser is a backend op.
            disabled={!platform || loadingAdvertisers || advertiserLocked}
            loading={loadingAdvertisers}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Advertiser"
                placeholder={
                  platform
                    ? "Select an advertiser — start typing to search"
                    : "Select a platform first"
                }
                InputLabelProps={{ shrink: true }}
                helperText={
                  advertiserLocked
                    ? "Locked — this platform uses one advertiser across all of Radius"
                    : platform
                      ? "Advertisers available on this platform"
                      : "Enabled once a platform is selected"
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingAdvertisers && (
                        <CircularProgress color="inherit" size={16} />
                      )}
                      {advertiserLocked && (
                        <Tooltip title="This advertiser is locked. Contact support to change the advertiser for this platform.">
                          {/* span keeps the icon hoverable inside the disabled
                              input, so the tooltip still fires. */}
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              pointerEvents: "auto",
                              color: "text.secondary",
                            }}
                          >
                            <LockOutlinedIcon fontSize="small" />
                          </Box>
                        </Tooltip>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {platform && advertiser && !advertiserLocked && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
                backgroundColor: "background.sunken",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                px: 1.5,
                py: 1.25,
              }}
            >
              <LockOutlinedIcon
                fontSize="small"
                sx={{ color: "warning.main", mt: "1px", flexShrink: 0 }}
              />
              <Typography variant="caption" color="text.secondary">
                Pushing locks this advertiser to the 3rd-party platform{" "}
                <strong>across all of Radius</strong> — every line item, not just
                this one, now and going forward. It's a significant association and
                can't be changed here.
              </Typography>
            </Box>
          )}

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 0.5 }}
            >
              <FormControlLabel
                disabled={!platform}
                control={
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                }
                label={<Typography variant="body2">Select all</Typography>}
              />
              <Typography variant="caption" color="text.secondary">
                {platform
                  ? `${selectedCount} of ${eligibleDistros.length} ${platform.name} tag${eligibleDistros.length === 1 ? "" : "s"} selected`
                  : "Pick a platform to select its tags"}
              </Typography>
            </Stack>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                maxHeight: 240,
                overflowY: "auto",
                px: 1.5,
                py: 1,
              }}
            >
              <Stack spacing={0.5}>
                {distros.map((d) => {
                  const eligible = isEligible(d.family);
                  const tagPlatform = platformForFamily(d.family);
                  return (
                    <Stack
                      key={d.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <FormControlLabel
                        disabled={!eligible}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedIds.includes(d.id)}
                            onChange={() => toggle(d.id)}
                          />
                        }
                        label={<Typography variant="body2">{d.name}</Typography>}
                      />
                      <Stack alignItems="flex-end" sx={{ pl: 1 }}>
                        <Typography
                          variant="caption"
                          color={eligible ? "text.secondary" : "text.disabled"}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {tagPlatform?.name ?? "—"} ·{" "}
                          {PLATFORM_STATUS_META[d.platformStatus].label}
                        </Typography>
                        {d.pushTarget?.advertiser && (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ whiteSpace: "nowrap", lineHeight: 1.3 }}
                          >
                            {d.pushTarget.advertiser}
                            {d.pushTarget.advertiserId
                              ? ` · ${d.pushTarget.advertiserId}`
                              : ""}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handlePush}
          disabled={!canPush}
          sx={{ color: canPush ? "primary.main" : "text.disabled" }}
        >
          {pushLabel}
        </Button>
      </DialogActions>
      {confirmDialog}
    </Dialog>
  );
};
