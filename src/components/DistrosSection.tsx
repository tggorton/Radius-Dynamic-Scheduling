import { Box, Button, Snackbar, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/AppContext";
import type {
  Distro,
  DistroStatus,
  DistroTranscode,
  PlatformStatus,
  TranscodingConfig,
} from "../types";
import { buildDistroUrl } from "../lib/tagBuilder";
import { downloadCsv } from "../lib/csvExport";
import { RESTART_SIMULATION_MS, STATUS_META } from "../lib/distroStatus";
import { PLATFORM_STATUS_META } from "../lib/platformStatus";
import type { PlatformAdvertiser, PushPlatform } from "../lib/pushTargets";
import {
  describeTranscodings,
  settingsEqual,
  transcodeLandingStatus,
} from "../lib/transcodePresets";
import { DistroTable } from "./DistroTable";
import { TagEditorDialog } from "./TagEditorDialog";
import { PushTagsDialog } from "./PushTagsDialog";
import { TranscodingSettingsDialog } from "./TranscodingSettingsDialog";
import { SectionHeader } from "./SectionHeader";
import { useConfirm } from "./ConfirmDialog";

export const DistrosSection = () => {
  const {
    state,
    removeDistro,
    setDistroTranscodes,
    setDistrosTranscodes,
    setDistrosPlatformStatus,
    setTranscodings,
    rememberPlatformAdvertiser,
  } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const presets = state.transcodePresets;
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Distro | null>(null);
  const [pushOpen, setPushOpen] = useState(false);
  // When set, the push dialog opens scoped to one just-added tag with its
  // platform locked (the "Add + Push" flow). Null = a normal, unscoped push.
  const [pushScope, setPushScope] = useState<{
    platformId: string;
    selectedIds: string[];
  } | null>(null);
  const [transcodeOpen, setTranscodeOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const hasDistros = state.distros.length > 0;

  const handleCopy = async (distro: Distro) => {
    await navigator.clipboard.writeText(
      buildDistroUrl(distro, state.paramsCatalog, state.regions),
    );
    setSnack(`Copied tag URL for "${distro.name}"`);
  };

  const handleDelete = async (distro: Distro) => {
    const ok = await confirm({
      title: "Delete distribution?",
      message: `"${distro.name}" will be removed. This cannot be undone.`,
    });
    if (!ok) return;
    removeDistro(distro.id);
    setSnack(`Deleted "${distro.name}"`);
  };

  // Prototype stand-in for the backend's transcode lifecycle: a restarted distro
  // sits in Processing, then reports Live. Tracked so a pending timer can't fire
  // a status write after unmount.
  const restartTimers = useRef<number[]>([]);
  useEffect(
    () => () => restartTimers.current.forEach((t) => window.clearTimeout(t)),
    [],
  );

  // Restart re-transcodes the distro to the line-item's current plan: every
  // transcode goes Processing, then lands on its config's status. Confirmed
  // first so it can't be triggered by accident.
  const handleRestart = async (distro: Distro) => {
    const ok = await confirm({
      title: "Restart transcoding?",
      message:
        "Are you sure you want to start a re-process for transcoding for this distribution?",
      confirmLabel: "Restart",
    });
    if (!ok) return;
    const retrying = distro.transcodes.some((t) => t.status === "error");
    const processing = state.transcoding.map(
      (c): DistroTranscode => ({ presetId: c.presetId, status: "processing" }),
    );
    setDistroTranscodes(distro.id, processing);
    setSnack(
      retrying
        ? `Retrying transcode for "${distro.name}"…`
        : `Restarting creatives for "${distro.name}"…`,
    );
    const timer = window.setTimeout(() => {
      const landing = state.transcoding.map(
        (c): DistroTranscode => ({
          presetId: c.presetId,
          status: transcodeLandingStatus(c, presets),
        }),
      );
      setDistroTranscodes(distro.id, landing);
      setSnack(`"${distro.name}" re-transcoded`);
    }, RESTART_SIMULATION_MS);
    restartTimers.current.push(timer);
  };

  // Prototype affordance: force every one of the distro's transcodes to a status.
  const handleSetStatus = (distro: Distro, status: DistroStatus) => {
    setDistroTranscodes(
      distro.id,
      distro.transcodes.map((t) => ({ ...t, status })),
    );
    setSnack(`"${distro.name}" transcodes set to ${STATUS_META[status].label}`);
  };

  // Push the selected distros: they go Pushing, then land Success (optimistic —
  // the backend reports the real outcome once the push API is live; use the ⋯
  // "Set platform status" affordance to demo an Error/rejection meanwhile).
  const handlePush = (
    ids: string[],
    platform: PushPlatform,
    advertiser: PlatformAdvertiser,
  ) => {
    // Sticky advertiser: remember this choice for the platform so further pushes
    // to it default to the same advertiser.
    rememberPlatformAdvertiser(platform.id, advertiser);
    const target = {
      platform: platform.name,
      advertiser: advertiser.name,
      advertiserId: advertiser.advertiserId,
    };
    setDistrosPlatformStatus(ids, "pushing", target);
    setSnack(`Pushing ${ids.length} tag(s) to ${platform.name}…`);
    const timer = window.setTimeout(() => {
      setDistrosPlatformStatus(ids, "success");
      setSnack(
        `Pushed ${ids.length} tag(s) to ${platform.name} — ${advertiser.name}`,
      );
    }, RESTART_SIMULATION_MS);
    restartTimers.current.push(timer);
  };

  const openPush = () => {
    setPushScope(null);
    setPushOpen(true);
  };

  const closePush = () => {
    setPushOpen(false);
    setPushScope(null);
  };

  // "Add + Push": the tag is already created; open push scoped to it, platform
  // locked to the tag's family.
  const handleAddAndPush = (distro: Distro) => {
    setPushScope({ platformId: distro.family, selectedIds: [distro.id] });
    setPushOpen(true);
  };

  const handleSetPlatformStatus = (distro: Distro, status: PlatformStatus) => {
    setDistrosPlatformStatus([distro.id], status);
    setSnack(
      `"${distro.name}" platform status set to ${PLATFORM_STATUS_META[status].label}`,
    );
  };

  // Unlink from the platform → Inactive. The push target stays, so the chip reads
  // "Inactive: Nexxen" (which platform it was unlinked from) and it can relink.
  // Confirmed first — breaking a platform connection shouldn't fire by accident.
  const handleUnlinkPlatform = async (distro: Distro) => {
    const ok = await confirm({
      title: "Unlink platform?",
      message:
        "Are you sure you want to un-link the platform connection for this distribution?",
      confirmLabel: "Unlink",
    });
    if (!ok) return;
    setDistrosPlatformStatus([distro.id], "inactive");
    setSnack(
      `"${distro.name}" unlinked${distro.pushTarget ? ` from ${distro.pushTarget.platform}` : ""}`,
    );
  };

  // Relink an Inactive tag back to its original platform → Success (the push
  // target is preserved, so the chip returns to "Success: Nexxen"). Confirmed
  // first — re-establishing the platform link shouldn't fire by accident.
  const handleRelinkPlatform = async (distro: Distro) => {
    const ok = await confirm({
      title: "Re-link platform?",
      message:
        "Are you sure you want to re-establish a platform connection for this distribution?",
      confirmLabel: "Re-link",
    });
    if (!ok) return;
    setDistrosPlatformStatus([distro.id], "success");
    setSnack(
      `"${distro.name}" relinked${distro.pushTarget ? ` to ${distro.pushTarget.platform}` : ""}`,
    );
  };

  const handleApplyTranscoding = (configs: TranscodingConfig[]) => {
    const prevConfigs = state.transcoding;
    setTranscodings(configs);
    const label = describeTranscodings(configs, presets);
    if (!hasDistros) {
      setSnack(`Transcoding settings saved — ${label}`);
      return;
    }
    // Only re-transcode presets that are new or changed vs. what was already
    // applied — a preset unchanged since last apply keeps each distro's existing
    // status (it can stay as it is). "Changed" = same preset id but different
    // settings, or a preset the previous plan didn't have.
    const isChanged = (c: TranscodingConfig) =>
      !prevConfigs.some(
        (p) => p.presetId === c.presetId && settingsEqual(p.settings, c.settings),
      );
    const changedCount = configs.filter(isChanged).length;

    // Build each distro's transcode list for the new plan. A config that needs
    // reprocessing (changed, or the distro has no status for it yet) → the given
    // `active` status; otherwise carry the distro's current status forward.
    const buildEntries = (activeStatus: (c: TranscodingConfig) => DistroTranscode["status"]) =>
      state.distros.map((d) => {
        const current = new Map(d.transcodes.map((t) => [t.presetId, t.status]));
        return {
          id: d.id,
          transcodes: configs.map((c): DistroTranscode => {
            const reprocess = isChanged(c) || !current.has(c.presetId);
            return {
              presetId: c.presetId,
              status: reprocess ? activeStatus(c) : current.get(c.presetId)!,
            };
          }),
        };
      });

    const landed = buildEntries((c) => transcodeLandingStatus(c, presets));

    // Nothing new/changed (e.g. only a reorder or removal) — commit without a
    // Processing pass.
    if (changedCount === 0) {
      setDistrosTranscodes(landed);
      setSnack(`Transcoding updated — ${label}`);
      return;
    }

    setDistrosTranscodes(buildEntries(() => "processing"));
    setSnack(
      `Re-transcoding ${changedCount} preset${changedCount === 1 ? "" : "s"} across ${state.distros.length} distribution(s)…`,
    );
    const timer = window.setTimeout(() => {
      setDistrosTranscodes(landed);
      setSnack(`Transcode complete — ${label}`);
    }, RESTART_SIMULATION_MS);
    restartTimers.current.push(timer);
  };

  const handleExport = () => {
    if (!hasDistros) {
      setSnack("No distributions to export");
      return;
    }
    downloadCsv(state.distros, state.paramsCatalog, state.regions);
    setSnack(`Exported ${state.distros.length} distribution(s) to CSV`);
  };

  return (
    <Box>
      <SectionHeader
        title="Distributions"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setAddOpen(true)}
            >
              + Add Distribution Tag
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setTranscodeOpen(true)}
            >
              Transcoding Settings
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={openPush}
              disabled={!hasDistros}
            >
              Push Tags to Platform
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleExport}
              disabled={!hasDistros}
            >
              Export Tags
            </Button>
          </Stack>
        }
      />
      <DistroTable
        distros={state.distros}
        onCopy={handleCopy}
        onEdit={(d) => setEditing(d)}
        onDelete={handleDelete}
        onRestart={handleRestart}
        onSetStatus={handleSetStatus}
        onSetPlatformStatus={handleSetPlatformStatus}
        onUnlinkPlatform={handleUnlinkPlatform}
        onRelinkPlatform={handleRelinkPlatform}
      />
      <TagEditorDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(message) => setSnack(message)}
        onAndPush={handleAddAndPush}
      />
      <TagEditorDialog
        open={Boolean(editing)}
        editingDistro={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => setSnack(message)}
        onAndPush={handleAddAndPush}
      />
      <PushTagsDialog
        open={pushOpen}
        onClose={closePush}
        onPush={handlePush}
        initialPlatformId={pushScope?.platformId ?? null}
        initialSelectedIds={pushScope?.selectedIds}
        lockPlatform={pushScope !== null}
      />
      <TranscodingSettingsDialog
        open={transcodeOpen}
        onClose={() => setTranscodeOpen(false)}
        onApply={handleApplyTranscoding}
        onSaved={(message) => setSnack(message)}
      />
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      {confirmDialog}
    </Box>
  );
};
