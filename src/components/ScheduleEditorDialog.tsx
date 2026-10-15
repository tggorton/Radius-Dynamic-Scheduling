import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { AdminStatus, Schedule, ScheduleEnd, ScheduleStart } from "../types";
import {
  describeBoundLine,
  formatInZone,
  hasSpecificBound,
  resolveImmediate,
  schedulesEqual,
  utcToWallClock,
  wallClockToUtc,
  type WallClockResult,
} from "../lib/schedule";
import { effectiveSchedule } from "../lib/scheduleInheritance";
import { zoneCity } from "../lib/timezones";
import type { ScheduleWarning } from "../lib/scheduleWarnings";
import { useApp } from "../state/AppContext";
import { DialogHeader } from "./DialogHeader";
import { TimeZonePicker } from "./TimeZonePicker";
import { ScheduleDateField, type DatePreset } from "./ScheduleDateField";
import { ScheduleTimeField } from "./ScheduleTimeField";
import { ScheduleWarningList } from "./ScheduleWarningList";
import { useConfirm } from "./ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
  /** "Line Item Schedule", "Campaign Schedule". */
  title: string;
  /** "line item", "campaign" — used in copy. */
  entityKind: string;
  /** This entity's own schedule (inherited bounds unresolved). */
  schedule: Schedule;
  status: AdminStatus;
  /** Live out-of-sync warnings for a candidate (own) schedule (D10). */
  warningsFor: (draft: Schedule) => ScheduleWarning[];
  /** Items Serving now that this candidate would stop (D20). */
  impactOf: (draft: Schedule) => string[];
  onSave: (schedule: Schedule) => void;
  /**
   * Line items and creatives: the parent and its *effective* schedule. A
   * bound left empty follows it (D32).
   */
  parent?: { kind: string; schedule: Schedule };
}

type StartMode = "inherit" | "immediate" | "specific";
type EndMode = "inherit" | "indefinite" | "specific";

interface Draft {
  startMode: StartMode;
  startDate: string;
  startTime: string;
  endMode: EndMode;
  endDate: string;
  endTime: string;
  zone: string;
}

const toDraft = (s: Schedule, parent: Schedule | null): Draft => {
  const start = s.start.kind === "specific" ? utcToWallClock(Date.parse(s.start.utc), s.timeZone) : null;
  const end = s.end.kind === "specific" ? utcToWallClock(Date.parse(s.end.utc), s.timeZone) : null;
  return {
    startMode: s.start.kind,
    startDate: start?.date ?? "",
    startTime: start?.time ?? "",
    endMode: s.end.kind,
    endDate: end?.date ?? "",
    endTime: end?.time ?? "",
    // With no date of its own, a child's zone defaults to the parent's for
    // when the user does set one.
    zone: hasSpecificBound(s) || !parent ? s.timeZone : parent.timeZone,
  };
};

/** The parent's bound for "From campaign: …", with a resolved Immediate's time. */
const parentBoundText = (p: Schedule, which: "start" | "end"): string =>
  which === "start" && p.start.kind === "immediate" && p.start.resolvedAt
    ? `Immediate (started ${formatInZone(Date.parse(p.start.resolvedAt), p.timeZone)})`
    : describeBoundLine(p, which);

/** Prompt / error text under a Specific date + time pair (D23, DST). */
const boundProblem = (
  which: "start" | "end",
  date: string,
  time: string,
  result: WallClockResult,
  zone: string,
): { text: string; error: boolean } | null => {
  if (result.ok) {
    return result.ambiguous
      ? {
          text: `This time happens twice in ${zoneCity(zone)} (clocks fall back). Using the first occurrence.`,
          error: false,
        }
      : null;
  }
  if (result.reason === "incomplete") {
    const missing = !date && !time ? "date and time" : !date ? "date" : "time";
    return { text: `Add ${which === "end" ? "an" : "a"} ${which} ${missing}. Both are required.`, error: false };
  }
  if (result.reason === "nonexistent") {
    return {
      text: `This time doesn't exist in ${zoneCity(zone)} (clocks spring forward). Pick another time.`,
      error: true,
    };
  }
  return { text: "Enter a valid date and time.", error: true };
};

/**
 * The reusable schedule control, used for campaigns, line items, and creatives.
 *
 * - Timezone comes first. Each bound is a date + time pair; the date's
 *   dropdown holds the no-date choices above a calendar:
 *   - campaign: Immediate / Indefinite — what an empty bound means (PRD R1);
 *   - line item / creative: "Same as campaign" (or line item) first — an
 *     empty bound follows the parent live, shown as "From campaign: …" —
 *     then Immediate / Indefinite as explicit choices (D32).
 * - Only a Specific date needs a time, and then it needs both (D23).
 * - Dates/times are plain strings read in the selected zone (D19, D21).
 * - Warnings update live and never block (D10); a save that would stop
 *   something currently Serving confirms first and lists what (D20).
 */
export const ScheduleEditorDialog = ({
  open,
  onClose,
  onSaved,
  title,
  entityKind,
  schedule,
  status,
  warningsFor,
  impactOf,
  onSave,
  parent,
}: Props) => {
  const { now } = useApp();
  const { confirm, confirmDialog } = useConfirm();
  const parentSchedule = parent?.schedule ?? null;
  const [draft, setDraft] = useState<Draft>(() => toDraft(schedule, parentSchedule));

  useEffect(() => {
    if (open) setDraft(toDraft(schedule, parentSchedule));
    // Reset only when the dialog opens, not on every upstream re-render.
  }, [open]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const startResult = wallClockToUtc(draft.startDate, draft.startTime, draft.zone);
  const endResult = wallClockToUtc(draft.endDate, draft.endTime, draft.zone);
  const startProblem =
    draft.startMode === "specific"
      ? boundProblem("start", draft.startDate, draft.startTime, startResult, draft.zone)
      : null;
  const endProblem =
    draft.endMode === "specific"
      ? boundProblem("end", draft.endDate, draft.endTime, endResult, draft.zone)
      : null;

  /** The (own) schedule this draft would save, or null while it's incomplete/invalid. */
  const candidate = ((): Schedule | null => {
    let start: ScheduleStart;
    if (draft.startMode === "inherit") {
      start = { kind: "inherit" };
    } else if (draft.startMode === "immediate") {
      // Keep an already-resolved Immediate; a newly chosen one resolves at save.
      start = schedule.start.kind === "immediate" ? schedule.start : { kind: "immediate" };
    } else {
      if (!startResult.ok) return null;
      start = { kind: "specific", utc: new Date(startResult.utcMs).toISOString() };
    }
    let end: ScheduleEnd;
    if (draft.endMode === "inherit") {
      end = { kind: "inherit" };
    } else if (draft.endMode === "indefinite") {
      end = { kind: "indefinite" };
    } else {
      if (!endResult.ok) return null;
      end = { kind: "specific", utc: new Date(endResult.utcMs).toISOString() };
    }
    return resolveImmediate({ start, end, timeZone: draft.zone }, status, now);
  })();

  // End must come after the effective start (an unresolved Immediate = now),
  // inherited bounds included.
  const orderError = (() => {
    if (!candidate) return null;
    const eff = effectiveSchedule(candidate, parentSchedule);
    if (eff.end.kind !== "specific") return null;
    const s =
      eff.start.kind === "specific"
        ? Date.parse(eff.start.utc)
        : eff.start.kind === "immediate" && eff.start.resolvedAt
          ? Date.parse(eff.start.resolvedAt)
          : now;
    return Date.parse(eff.end.utc) <= s ? "The end must be after the start." : null;
  })();

  const valid = candidate !== null && orderError === null;
  const warnings = valid && candidate ? warningsFor(candidate) : [];
  const anySpecific = draft.startMode === "specific" || draft.endMode === "specific";

  const handleSave = async () => {
    if (!candidate || !valid) return;
    if (schedulesEqual(candidate, schedule)) {
      onClose();
      return;
    }
    const stopped = impactOf(candidate);
    if (stopped.length > 0) {
      const ok = await confirm({
        title: "Stop delivery now?",
        confirmLabel: "Save and stop",
        message: (
          <>
            This change stops delivery immediately for:
            {stopped.map((label) => (
              <Box component="span" key={label} sx={{ display: "block", pl: 1.5, mt: 0.5 }}>
                • {label}
              </Box>
            ))}
          </>
        ),
      });
      if (!ok) return;
    }
    onSave(candidate);
    onSaved?.(`${title} saved`);
    onClose();
  };

  const today = utcToWallClock(now, draft.zone).date;

  const presetsFor = (which: "start" | "end"): DatePreset[] => {
    const own: DatePreset =
      which === "start" ? { key: "immediate", label: "Immediate" } : { key: "indefinite", label: "Indefinite" };
    if (!parent) return [own];
    return [
      {
        key: "inherit",
        label: `Same as ${parent.kind}`,
        detail: parentBoundText(parent.schedule, which),
      },
      own,
    ];
  };

  const immediateNote =
    schedule.start.kind === "immediate" && schedule.start.resolvedAt
      ? `Started ${formatInZone(Date.parse(schedule.start.resolvedAt), schedule.timeZone)}.`
      : status === "active"
        ? `Starts the moment you save. No time needed.`
        : `Starts when this ${entityKind} is set to Active.`;

  const boundRow = (which: "start" | "end") => {
    const label = which === "start" ? "Start" : "End";
    const mode = which === "start" ? draft.startMode : draft.endMode;
    const date = which === "start" ? draft.startDate : draft.endDate;
    const time = which === "start" ? draft.startTime : draft.endTime;
    const problem = which === "start" ? startProblem : endProblem;
    const caption: { text: string; error: boolean } | null =
      mode === "specific"
        ? problem
        : mode === "inherit" && parent
          ? { text: `From ${parent.kind}: ${parentBoundText(parent.schedule, which)}`, error: false }
          : mode === "immediate"
            ? { text: immediateNote, error: false }
            : null;
    return (
      <Box>
        <Stack direction="row" spacing={1.5}>
          <ScheduleDateField
            label={`${label} date`}
            presets={presetsFor(which)}
            selectedPreset={mode === "specific" ? null : mode}
            date={date}
            today={today}
            error={mode === "specific" && problem?.error}
            onSelectPreset={(key) =>
              set(which === "start" ? { startMode: key as StartMode } : { endMode: key as EndMode })
            }
            onSelectDate={(d) =>
              set(which === "start" ? { startMode: "specific", startDate: d } : { endMode: "specific", endDate: d })
            }
          />
          {mode === "specific" ? (
            <ScheduleTimeField
              label={`${label} time`}
              value={time}
              onChange={(t) => set(which === "start" ? { startTime: t } : { endTime: t })}
              error={problem?.error}
            />
          ) : (
            <TextField label={`${label} time`} size="small" value="—" disabled InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
          )}
        </Stack>
        {caption && (
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.75, color: caption.error ? "error.main" : "text.secondary" }}
          >
            {caption.text}
          </Typography>
        )}
      </Box>
    );
  };

  const zoneHelper = anySpecific
    ? "Dates set here are entered and shown in this zone."
    : parent
      ? `Applies when you set a date of its own. Until then it follows the ${parent.kind}.`
      : "Applies when a specific start or end time is set.";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { backgroundColor: "background.paper", borderRadius: 1 } }}
    >
      <DialogHeader title={title} onClose={onClose} />
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TimeZonePicker
            value={draft.zone}
            onChange={(zone) => set({ zone })}
            now={now}
            muted={!anySpecific}
            helperText={zoneHelper}
          />

          {boundRow("start")}

          <Box>
            {boundRow("end")}
            {orderError && (
              <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "error.main" }}>
                {orderError}
              </Typography>
            )}
          </Box>

          {warnings.length > 0 && (
            <>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  Out of sync
                </Typography>
                <ScheduleWarningList warnings={warnings} />
                <Typography variant="caption" color="text.disabled">
                  You can still save. Warnings flag schedules that won't serve the way they read.
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!valid} onClick={handleSave}>
          Save Schedule
        </Button>
      </DialogActions>
      {confirmDialog}
    </Dialog>
  );
};
