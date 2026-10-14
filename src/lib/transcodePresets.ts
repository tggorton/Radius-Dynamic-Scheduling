import type {
  DistroStatus,
  TranscodePreset,
  TranscodeSettings,
  TranscodingConfig,
} from "../types";

export type { TranscodePreset } from "../types";

/**
 * Transcoding is modelled as one fixed set of fields shared by every preset —
 * the presets differ only in *values*, never in which fields exist. The field
 * set mirrors a publisher delivery spec (based on Hulu's). `select` fields carry
 * a superset of options across all presets so any preset's value is selectable
 * on any other; `text` fields hold ranges the user reads and tweaks freely.
 *
 * These numbers are illustrative prototype values, not authoritative encoding
 * specs — enough to show a preset filling the sheet and a manual override.
 */

export type TranscodeFieldType = "select" | "text";
export type TranscodeFieldGroup = "video" | "audio";

export interface TranscodeField {
  id: string;
  label: string;
  type: TranscodeFieldType;
  group: TranscodeFieldGroup;
  options?: string[];
  helperText?: string;
}

export const TRANSCODE_FIELDS: TranscodeField[] = [
  {
    id: "container",
    label: "Container",
    type: "select",
    group: "video",
    options: ["MP4", "MOV", "WebM", "MXF", "MPEG-TS", "HLS", "DASH"],
  },
  {
    id: "videoCodec",
    label: "Video Codec",
    type: "select",
    group: "video",
    options: [
      "H.264 (AVC)",
      "H.265 (HEVC)",
      "AV1",
      "VP9",
      "VP8",
      "MPEG-2",
      "Apple ProRes",
    ],
  },
  {
    id: "resolution",
    label: "Resolution",
    type: "select",
    group: "video",
    options: [
      "3840×2160 (2160p)",
      "1920×1080 (1080p)",
      "1280×720 (720p)",
      "720×480 (480p SD)",
      "1080×1080 (1:1)",
      "1080×1920 (9:16)",
      "Adaptive",
    ],
  },
  {
    id: "aspectRatio",
    label: "Aspect Ratio",
    type: "select",
    group: "video",
    options: ["16:9", "4:3", "1:1", "9:16", "3:4"],
  },
  {
    id: "duration",
    label: "Duration",
    type: "text",
    group: "video",
    helperText: "e.g. :15 / :30",
  },
  {
    id: "bitrate",
    label: "Video Bitrate",
    type: "text",
    group: "video",
    helperText: "e.g. 15–30 Mbps",
  },
  {
    id: "frameRate",
    label: "Frame Rate",
    type: "select",
    group: "video",
    options: [
      "23.976",
      "24",
      "25",
      "29.97",
      "30",
      "50",
      "59.94",
      "60",
      "Preserve source",
    ],
  },
  {
    id: "scanType",
    label: "Scan Type",
    type: "select",
    group: "video",
    options: ["Progressive", "Interlaced", "Progressive segmented (PsF)"],
  },
  {
    id: "chroma",
    label: "Chroma Subsampling",
    type: "select",
    group: "video",
    options: ["4:2:0", "4:2:2", "4:4:4", "4:1:1"],
  },
  {
    id: "color",
    label: "Color",
    type: "select",
    group: "video",
    options: [
      "Rec.709",
      "Rec.601 (SD)",
      "Rec.2020",
      "Rec.2100 (HDR)",
      "DCI-P3",
      "sRGB",
    ],
  },
  {
    id: "audioCodec",
    label: "Audio Codec",
    type: "select",
    group: "audio",
    options: [
      "AAC",
      "HE-AAC",
      "AC-3 (Dolby Digital)",
      "E-AC-3 (Dolby Digital Plus)",
      "AC-4",
      "Opus",
      "MP3",
      "PCM (LPCM)",
    ],
  },
  {
    id: "audioSampleRate",
    label: "Audio Sample Rate",
    type: "select",
    group: "audio",
    options: ["32 kHz", "44.1 kHz", "48 kHz", "96 kHz"],
  },
  {
    id: "audioBitrate",
    label: "Audio Bitrate",
    type: "text",
    group: "audio",
    helperText: "e.g. ≥192 kbps",
  },
  {
    id: "audioChannels",
    label: "Audio Channels",
    type: "select",
    group: "audio",
    options: ["Mono", "Stereo", "5.1", "7.1", "Dolby Atmos"],
  },
  {
    id: "loudness",
    label: "Loudness",
    type: "text",
    group: "audio",
    helperText: "e.g. -24 LKFS",
  },
];

/** Drop a trailing "(...)" qualifier: "Hulu (Disney)" → "Hulu". Used to derive a
 *  preset's `shortName` (compact form for tight UI like the status chip). */
export const shortenName = (name: string): string =>
  name.replace(/\s*\([^)]*\)\s*$/, "").trim();

// Presets are *publisher* delivery specs (Hulu is a pub). DSPs like Nexxen / The
// Trade Desk are push targets, not transcode presets — they live in the
// Push-to-Platform flow, not here.
const HULU_SETTINGS: TranscodeSettings = {
  container: "MP4",
  videoCodec: "H.264 (AVC)",
  resolution: "1920×1080 (1080p)",
  aspectRatio: "16:9",
  duration: ":15 / :30",
  bitrate: "15–30 Mbps",
  frameRate: "29.97",
  scanType: "Progressive",
  chroma: "4:2:0",
  color: "Rec.709",
  audioCodec: "AAC",
  audioSampleRate: "48 kHz",
  audioBitrate: "≥192 kbps",
  audioChannels: "Stereo",
  loudness: "-24 LKFS",
};

// The video's own baseline — deliberately a little lighter/more generic than any
// platform spec, so picking a platform preset visibly overrides it.
const DEFAULT_SETTINGS: TranscodeSettings = {
  ...HULU_SETTINGS,
  resolution: "1280×720 (720p)",
  duration: ":30",
  bitrate: "8–12 Mbps",
  frameRate: "29.97",
  audioBitrate: "128 kbps",
  loudness: "-23 LKFS",
};

export const DEFAULT_PRESET_ID = "default";

/**
 * Publisher presets. Only Hulu's numbers came from a real spec sheet; the rest
 * are ILLUSTRATIVE prototype values built on standard CTV ad-delivery
 * conventions and varied by platform tier (premium SVOD-with-ads run higher
 * bitrate / 5.1 audio; FAST channels run lighter). They are NOT verified
 * per-publisher specs — swap in real numbers when a partner sheet is available.
 * Each seed lists only what differs from the Hulu baseline.
 */
interface PresetSeed {
  id: string;
  name: string;
  overrides?: Partial<TranscodeSettings>;
}

const PUBLISHER_SEEDS: PresetSeed[] = [
  { id: "hulu", name: "Hulu (Disney)" },
  {
    id: "disney-plus",
    name: "Disney+ (Ads)",
    overrides: { bitrate: "20–30 Mbps", audioBitrate: "≥256 kbps", audioChannels: "5.1" },
  },
  { id: "espn", name: "ESPN", overrides: { frameRate: "29.97", bitrate: "15–25 Mbps" } },
  { id: "abc", name: "ABC", overrides: { frameRate: "29.97", bitrate: "12–20 Mbps" } },
  { id: "peacock", name: "Peacock", overrides: { bitrate: "16–24 Mbps", audioBitrate: "≥256 kbps" } },
  {
    id: "paramount-plus",
    name: "Paramount+",
    overrides: { bitrate: "15–25 Mbps", audioChannels: "5.1" },
  },
  { id: "pluto-tv", name: "Pluto TV", overrides: { bitrate: "8–12 Mbps", audioBitrate: "128 kbps" } },
  {
    id: "netflix",
    name: "Netflix (Ads)",
    overrides: {
      videoCodec: "H.265 (HEVC)",
      bitrate: "18–30 Mbps",
      audioBitrate: "≥256 kbps",
      audioChannels: "5.1",
      loudness: "-27 LKFS",
    },
  },
  {
    id: "amazon-prime",
    name: "Amazon Prime Video",
    overrides: { bitrate: "18–30 Mbps", audioBitrate: "≥256 kbps", audioChannels: "5.1" },
  },
  { id: "freevee", name: "Freevee (legacy)", overrides: { bitrate: "10–15 Mbps" } },
  { id: "roku-channel", name: "Roku Channel", overrides: { frameRate: "29.97", bitrate: "10–16 Mbps" } },
  { id: "tubi", name: "Tubi", overrides: { bitrate: "8–12 Mbps" } },
  { id: "max", name: "Max", overrides: { bitrate: "16–28 Mbps", audioChannels: "5.1" } },
  { id: "discovery-plus", name: "Discovery+", overrides: { bitrate: "14–22 Mbps" } },
  { id: "sling", name: "Sling TV", overrides: { frameRate: "29.97", bitrate: "10–16 Mbps" } },
  { id: "fubo", name: "Fubo", overrides: { frameRate: "29.97", bitrate: "12–18 Mbps" } },
  { id: "philo", name: "Philo", overrides: { bitrate: "8–14 Mbps" } },
  { id: "crackle", name: "Crackle", overrides: { bitrate: "6–10 Mbps", audioBitrate: "128 kbps" } },
  { id: "xumo", name: "Xumo Play", overrides: { bitrate: "8–12 Mbps" } },
  { id: "plex", name: "Plex", overrides: { bitrate: "6–12 Mbps" } },
  { id: "samsung-tv-plus", name: "Samsung TV Plus", overrides: { bitrate: "8–15 Mbps" } },
  { id: "lg-channels", name: "LG Channels", overrides: { bitrate: "8–15 Mbps" } },
  { id: "vizio-watchfree", name: "Vizio WatchFree+", overrides: { bitrate: "8–14 Mbps" } },
];

/**
 * The built-in preset list used to seed `AppState.transcodePresets`. Presets are
 * mutable admin-managed state from there on; this constant is only the seed and
 * the reset fallback. The `default` baseline is always first and is protected in
 * the admin UI (see `isProtectedPreset`).
 */
export const SEED_TRANSCODE_PRESETS: TranscodePreset[] = [
  {
    id: DEFAULT_PRESET_ID,
    name: "Default (video baseline)",
    shortName: "Default",
    settings: DEFAULT_SETTINGS,
  },
  ...PUBLISHER_SEEDS.map(
    (seed): TranscodePreset => ({
      id: seed.id,
      name: seed.name,
      shortName: shortenName(seed.name),
      settings: { ...HULU_SETTINGS, ...seed.overrides } as TranscodeSettings,
    }),
  ),
];

/** The "default" baseline is not editable/deletable in the admin preset manager. */
export const isProtectedPreset = (id: string): boolean => id === DEFAULT_PRESET_ID;

export const findPreset = (
  presets: TranscodePreset[],
  id: string,
): TranscodePreset | undefined => presets.find((p) => p.id === id);

/** The config a fresh line-item starts with: the default baseline, untouched. */
export const DEFAULT_TRANSCODING: TranscodingConfig = {
  presetId: DEFAULT_PRESET_ID,
  settings: { ...DEFAULT_SETTINGS },
};

/** A fresh line-item applies a single config — the default baseline. */
export const DEFAULT_TRANSCODINGS: TranscodingConfig[] = [DEFAULT_TRANSCODING];

export const settingsEqual = (
  a: TranscodeSettings,
  b: TranscodeSettings,
): boolean => TRANSCODE_FIELDS.every((f) => a[f.id] === b[f.id]);

/**
 * True when the effective settings have been hand-edited away from the preset
 * they were derived from — i.e. a one-off override. This is what makes distros
 * land `outOfSpec` rather than `live` after a re-transcode.
 */
export const isCustomTranscoding = (
  config: TranscodingConfig,
  presets: TranscodePreset[],
): boolean => {
  const preset = findPreset(presets, config.presetId);
  if (!preset) return true;
  return !settingsEqual(config.settings, preset.settings);
};

/**
 * The distro status a re-transcode lands on for a given config:
 *   - hand-edited away from its preset  → `outOfSpec` (orange)
 *   - the Default baseline, untouched   → `default`   (green, not officially set)
 *   - any other clean platform preset   → `live`      (green, conformed)
 */
export const transcodeLandingStatus = (
  config: TranscodingConfig,
  presets: TranscodePreset[],
): DistroStatus => {
  if (isCustomTranscoding(config, presets)) return "outOfSpec";
  return config.presetId === DEFAULT_PRESET_ID ? "default" : "live";
};

/**
 * The publisher a transcode names, for the status chip suffix ("Live: Hulu
 * (Disney)"). Returns both the full and compact form so the chip can pick by
 * available width. Null on the Default baseline — no publisher to name, so the
 * chip stays a plain "Default".
 */
export const transcodePublisher = (
  presetId: string,
  presets: TranscodePreset[],
): { full: string; short: string } | null => {
  if (presetId === DEFAULT_PRESET_ID) return null;
  const preset = findPreset(presets, presetId);
  if (!preset) return null;
  return { full: preset.name, short: preset.shortName };
};

/**
 * Short human summary of a config for the modal ("Hulu (modified)"). */
export const describeConfig = (
  config: TranscodingConfig,
  presets: TranscodePreset[],
): string => {
  const preset = findPreset(presets, config.presetId);
  const name = preset?.name ?? "Custom";
  return isCustomTranscoding(config, presets) ? `${name} (modified)` : name;
};

/** Comma-joined summary of the applied configs for the section subheading. */
export const describeTranscodings = (
  configs: TranscodingConfig[],
  presets: TranscodePreset[],
): string =>
  configs.length === 0
    ? "None"
    : configs.map((c) => describeConfig(c, presets)).join(", ");

/**
 * Backfill any missing fields so a settings sheet always matches the schema, and
 * heal `select` values that are no longer valid options (e.g. after an option
 * was renamed — "Rec.709 / YUV" → "Rec.709") back to the baseline, so a stale
 * value can't render as a blank dropdown.
 */
const normalizeSettings = (
  raw: TranscodeSettings | undefined,
): TranscodeSettings => {
  const settings: TranscodeSettings = {};
  for (const f of TRANSCODE_FIELDS) {
    const stored = raw?.[f.id];
    const invalidSelect =
      f.type === "select" && (stored === undefined || !f.options?.includes(stored));
    settings[f.id] =
      stored === undefined || invalidSelect ? DEFAULT_SETTINGS[f.id] : stored;
  }
  return settings;
};

const normalizeConfig = (raw: TranscodingConfig): TranscodingConfig => ({
  presetId: raw.presetId || DEFAULT_PRESET_ID,
  settings: normalizeSettings(raw.settings),
});

/**
 * Coerce persisted transcoding into the current list shape. Handles the pre-
 * multi single-config object (wraps it), an empty/missing value (default), and
 * normalizes each config's settings to the field schema.
 */
export const ensureTranscodings = (raw: unknown): TranscodingConfig[] => {
  const list: TranscodingConfig[] = Array.isArray(raw)
    ? (raw as TranscodingConfig[])
    : raw && typeof raw === "object" && "settings" in raw
      ? [raw as TranscodingConfig]
      : [];
  const valid = list.filter((c) => c && c.settings);
  if (valid.length === 0) return DEFAULT_TRANSCODINGS;
  return valid.map(normalizeConfig);
};

/**
 * Validate the persisted preset catalog: fall back to the seed when empty, keep
 * the protected `default` baseline present (prepended if a stored list dropped
 * it), and normalize every preset's settings to the current field schema.
 */
export const ensureTranscodePresets = (
  raw: TranscodePreset[] | undefined,
): TranscodePreset[] => {
  if (!raw || raw.length === 0) return SEED_TRANSCODE_PRESETS;
  const normalized = raw.map((p) => ({
    ...p,
    shortName: p.shortName || shortenName(p.name),
    settings: normalizeSettings(p.settings),
  }));
  if (!normalized.some((p) => p.id === DEFAULT_PRESET_ID)) {
    return [SEED_TRANSCODE_PRESETS[0], ...normalized];
  }
  return normalized;
};
