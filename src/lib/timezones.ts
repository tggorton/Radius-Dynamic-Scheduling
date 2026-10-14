/**
 * The IANA timezone catalog for the schedule editor.
 *
 * Nothing here reads the browser's own zone (D21) — every formatter is built
 * with an explicit `timeZone`. The zone is always a user choice (D9); the only
 * default is US Eastern (PRD R1).
 */

export const DEFAULT_TIME_ZONE = "America/New_York";

/** Pinned at the top of the picker, in this order. */
export const US_TIME_ZONES: Array<{ id: string; name: string }> = [
  { id: "America/New_York", name: "Eastern" },
  { id: "America/Chicago", name: "Central" },
  { id: "America/Denver", name: "Mountain" },
  { id: "America/Phoenix", name: "Arizona (no DST)" },
  { id: "America/Los_Angeles", name: "Pacific" },
  { id: "America/Anchorage", name: "Alaska" },
  { id: "Pacific/Honolulu", name: "Hawaii" },
];

/** Used only if the runtime can't enumerate zones (very old browsers). */
const FALLBACK_ZONES = [
  ...US_TIME_ZONES.map((z) => z.id),
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const REGION_GROUPS: Array<{ prefix: string; group: string }> = [
  { prefix: "America/", group: "Americas" },
  { prefix: "Europe/", group: "Europe" },
  { prefix: "Africa/", group: "Africa" },
  { prefix: "Asia/", group: "Asia" },
  { prefix: "Australia/", group: "Australia & Pacific" },
  { prefix: "Pacific/", group: "Australia & Pacific" },
  { prefix: "Atlantic/", group: "Atlantic" },
  { prefix: "Indian/", group: "Indian Ocean" },
  { prefix: "Antarctica/", group: "Antarctica" },
  { prefix: "Arctic/", group: "Antarctica" },
];

const GROUP_ORDER = [
  "Americas",
  "Europe",
  "Africa",
  "Asia",
  "Australia & Pacific",
  "Atlantic",
  "Indian Ocean",
  "Antarctica",
  "Other",
];

export const US_GROUP = "United States";

const regionGroup = (zone: string): string =>
  REGION_GROUPS.find((g) => zone.startsWith(g.prefix))?.group ?? "Other";

export const listTimeZones = (): string[] => {
  const intl = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
  };
  const zones = intl.supportedValuesOf?.("timeZone") ?? FALLBACK_ZONES;
  return zones.includes("UTC") ? zones : [...zones, "UTC"];
};

export const isValidTimeZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/** "America/Los_Angeles" → "Los Angeles"; "America/Argentina/Buenos_Aires" → "Buenos Aires". */
export const zoneCity = (zone: string): string =>
  (zone.split("/").pop() ?? zone).replace(/_/g, " ");

const nameFormatters = new Map<string, Intl.DateTimeFormat>();

const zoneNamePart = (
  zone: string,
  atMs: number,
  style: "short" | "longOffset",
): string => {
  const key = `${zone}|${style}`;
  let dtf = nameFormatters.get(key);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: style,
    });
    nameFormatters.set(key, dtf);
  }
  return (
    dtf.formatToParts(atMs).find((p) => p.type === "timeZoneName")?.value ?? ""
  );
};

/** Current UTC offset at `atMs`, e.g. "UTC−04:00". DST-aware. */
export const zoneOffsetLabel = (zone: string, atMs: number): string => {
  const raw = zoneNamePart(zone, atMs, "longOffset"); // "GMT-04:00" | "GMT"
  const offset = raw.replace("GMT", "") || "+00:00";
  return `UTC${offset.replace("-", "−")}`;
};

/**
 * Letter abbreviation at `atMs` ("EDT", "PST") when the locale knows one;
 * null when it would only be a numeric "GMT+1".
 */
export const zoneAbbreviation = (zone: string, atMs: number): string | null => {
  const raw = zoneNamePart(zone, atMs, "short");
  return /^[A-Z]{2,5}$/.test(raw) ? raw : null;
};

export interface TimeZoneOption {
  /** Unique per list entry — US zones appear twice (pinned + their region). */
  key: string;
  id: string;
  group: string;
  label: string;
}

const optionLabel = (zone: string, atMs: number, name?: string): string => {
  const abbr = zoneAbbreviation(zone, atMs);
  const offset = zoneOffsetLabel(zone, atMs);
  const head = name ? `${zoneCity(zone)} — ${name}` : zoneCity(zone);
  return `${head} · ${offset}${abbr ? ` (${abbr})` : ""} · ${zone}`;
};

let optionsCache: { hour: number; options: TimeZoneOption[] } | null = null;

/**
 * Every option for the picker, ordered so MUI's `groupBy` sees each group
 * contiguously: the pinned US group first, then regions. Offsets are computed
 * at `atMs` (cached per hour — building ~420 labels isn't free).
 */
export const buildTimeZoneOptions = (atMs: number): TimeZoneOption[] => {
  const hour = Math.floor(atMs / 3_600_000);
  if (optionsCache?.hour === hour) return optionsCache.options;

  const pinned: TimeZoneOption[] = US_TIME_ZONES.map((z) => ({
    key: `us|${z.id}`,
    id: z.id,
    group: US_GROUP,
    label: optionLabel(z.id, atMs, z.name),
  }));
  const rest: TimeZoneOption[] = listTimeZones()
    .map((id) => ({
      key: `all|${id}`,
      id,
      group: regionGroup(id),
      label: optionLabel(id, atMs),
    }))
    .sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) ||
        a.label.localeCompare(b.label),
    );
  const options = [...pinned, ...rest];
  optionsCache = { hour, options };
  return options;
};

/** Compact display for a summary: "New York (EDT) · UTC−04:00". */
export const describeTimeZone = (zone: string, atMs: number): string => {
  const abbr = zoneAbbreviation(zone, atMs);
  return `${zoneCity(zone)}${abbr ? ` (${abbr})` : ""} · ${zoneOffsetLabel(zone, atMs)}`;
};
