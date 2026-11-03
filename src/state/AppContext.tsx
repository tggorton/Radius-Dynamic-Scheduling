import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type {
  AdminStatus,
  AppState,
  Creative,
  CustomKeyValue,
  Distro,
  DistroStatus,
  DistroTranscode,
  ParamDef,
  ParamFamilyKey,
  ParamsCatalog,
  PlatformStatus,
  RegionDef,
  Role,
  Template,
  TranscodePreset,
  TranscodingConfig,
  Schedule,
  View,
  Campaign,
  ExperienceMode,
  LineItem,
  Workspace,
} from "../types";
import type { PlatformAdvertiser } from "../lib/pushTargets";
import { seedRegions, seedTemplates } from "./seedData";
import {
  SEED_CREATIVES,
  SEED_LINE_ITEMS,
  emptyDemoWorkspace,
  sampleWorkspace,
} from "./seedScheduling";
import { defaultSchedule, resolveImmediate } from "../lib/schedule";
import { migrateSchedule } from "../lib/scheduleMigration";
import type { LibraryCreative } from "../lib/creativeLibrary";
import { newCampaign, newLineItem, nextId } from "../lib/newEntities";
import { SEED_PARAMS_CATALOG } from "../lib/paramCatalog";
import { DEFAULT_DISTRO_STATUS } from "../lib/distroStatus";
import { DEFAULT_PLATFORM_STATUS } from "../lib/platformStatus";
import {
  DEFAULT_PRESET_ID,
  DEFAULT_TRANSCODINGS,
  SEED_TRANSCODE_PRESETS,
  ensureTranscodings,
  ensureTranscodePresets,
} from "../lib/transcodePresets";

const STORAGE_KEY = "radius.scheduling.v1";

const initialState: AppState = {
  role: "user",
  templates: seedTemplates,
  distros: [],
  nextDistributionId: 12100,
  paramsCatalog: SEED_PARAMS_CATALOG,
  regions: seedRegions,
  transcoding: DEFAULT_TRANSCODINGS,
  transcodePresets: SEED_TRANSCODE_PRESETS,
  platformAdvertisers: {},
  ...sampleWorkspace(),
  mode: "sample",
  parkedWorkspace: emptyDemoWorkspace(),
  clockOffsetMs: 0,
};

/** How often computed run states re-evaluate against the (simulated) clock. */
const CLOCK_TICK_MS = 15_000;

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setRole"; role: Role }
  | { type: "addDistro"; distro: Distro }
  | { type: "updateDistro"; distro: Distro }
  | { type: "removeDistro"; id: string }
  | { type: "setDistroTranscodes"; id: string; transcodes: DistroTranscode[] }
  | {
      type: "setDistrosTranscodes";
      entries: { id: string; transcodes: DistroTranscode[] }[];
    }
  | {
      type: "setDistrosPlatformStatus";
      ids: string[];
      status: PlatformStatus;
      target?: { platform: string; advertiser: string; advertiserId?: string };
    }
  | { type: "setTranscodings"; configs: TranscodingConfig[] }
  | {
      type: "rememberPlatformAdvertiser";
      platformId: string;
      advertiser: PlatformAdvertiser;
    }
  | { type: "addTranscodePreset"; preset: TranscodePreset }
  | { type: "updateTranscodePreset"; preset: TranscodePreset }
  | { type: "deleteTranscodePreset"; id: string }
  | { type: "addTemplate"; template: Template }
  | { type: "updateTemplate"; template: Template }
  | { type: "deleteTemplates"; ids: string[] }
  | { type: "setTemplateDisabled"; id: string; disabled: boolean }
  | { type: "addParam"; family: ParamFamilyKey; param: ParamDef }
  | { type: "updateParam"; family: ParamFamilyKey; param: ParamDef }
  | { type: "deleteParam"; family: ParamFamilyKey; paramId: string }
  | { type: "addRegion"; region: RegionDef }
  | { type: "updateRegion"; region: RegionDef }
  | { type: "deleteRegion"; id: string }
  | { type: "setView"; view: View }
  | { type: "setClockOffset"; offsetMs: number }
  | { type: "setCampaignSchedule"; id: number; schedule: Schedule }
  | { type: "setCampaignStatus"; id: number; status: AdminStatus; now: number }
  | { type: "addCampaign"; campaign: Campaign }
  | { type: "addLineItem"; lineItem: LineItem }
  | { type: "setMode"; mode: ExperienceMode }
  | { type: "resetDemo" }
  | { type: "setLineItemSchedule"; id: number; schedule: Schedule }
  | { type: "setLineItemStatus"; id: number; status: AdminStatus; now: number }
  | { type: "setCreativeSchedule"; id: number; schedule: Schedule }
  | { type: "setCreativeWeight"; id: number; weight: number | null }
  | { type: "resetCreativeWeights"; lineItemId: number }
  | { type: "addCreatives"; lineItemId: number; items: LibraryCreative[]; now: number }
  | { type: "removeCreative"; id: number };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setRole":
      return { ...state, role: action.role };
    case "addDistro":
      return {
        ...state,
        distros: [...state.distros, action.distro],
        nextDistributionId: Math.max(
          state.nextDistributionId,
          action.distro.distributionId + 1,
        ),
      };
    case "updateDistro":
      return {
        ...state,
        distros: state.distros.map((d) =>
          d.id === action.distro.id ? action.distro : d,
        ),
      };
    case "removeDistro":
      return {
        ...state,
        distros: state.distros.filter((d) => d.id !== action.id),
      };
    case "setDistroTranscodes":
      return {
        ...state,
        distros: state.distros.map((d) =>
          d.id === action.id ? { ...d, transcodes: action.transcodes } : d,
        ),
      };
    case "setDistrosTranscodes": {
      const map = new Map(action.entries.map((e) => [e.id, e.transcodes]));
      return {
        ...state,
        distros: state.distros.map((d) =>
          map.has(d.id) ? { ...d, transcodes: map.get(d.id)! } : d,
        ),
      };
    }
    case "setDistrosPlatformStatus": {
      const idSet = new Set(action.ids);
      return {
        ...state,
        distros: state.distros.map((d) => {
          if (!idSet.has(d.id)) return d;
          // Explicit target wins; resetting to notPushed clears any prior target.
          const pushTarget =
            action.target ??
            (action.status === "notPushed" ? undefined : d.pushTarget);
          return { ...d, platformStatus: action.status, pushTarget };
        }),
      };
    }
    case "setTranscodings":
      return { ...state, transcoding: action.configs };
    case "rememberPlatformAdvertiser":
      return {
        ...state,
        platformAdvertisers: {
          ...state.platformAdvertisers,
          [action.platformId]: action.advertiser,
        },
      };
    case "addTranscodePreset":
      return {
        ...state,
        transcodePresets: [...state.transcodePresets, action.preset],
      };
    case "updateTranscodePreset":
      return {
        ...state,
        transcodePresets: state.transcodePresets.map((p) =>
          p.id === action.preset.id ? action.preset : p,
        ),
      };
    case "deleteTranscodePreset":
      return {
        ...state,
        transcodePresets: state.transcodePresets.filter(
          (p) => p.id !== action.id,
        ),
      };
    case "addTemplate":
      return { ...state, templates: [...state.templates, action.template] };
    case "updateTemplate":
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.template.id ? action.template : t,
        ),
      };
    case "deleteTemplates": {
      const idSet = new Set(action.ids);
      return {
        ...state,
        templates: state.templates.filter((t) => !idSet.has(t.id)),
      };
    }
    case "setTemplateDisabled":
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.id ? { ...t, disabled: action.disabled } : t,
        ),
      };
    case "addParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: [
            ...state.paramsCatalog[action.family],
            action.param,
          ],
        },
      };
    case "updateParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: state.paramsCatalog[action.family].map((p) =>
            p.id === action.param.id ? action.param : p,
          ),
        },
      };
    case "deleteParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: state.paramsCatalog[action.family].filter(
            (p) => p.id !== action.paramId,
          ),
        },
      };
    case "addRegion":
      return { ...state, regions: [...state.regions, action.region] };
    case "updateRegion":
      return {
        ...state,
        regions: state.regions.map((r) =>
          r.id === action.region.id ? action.region : r,
        ),
      };
    case "deleteRegion":
      return {
        ...state,
        regions: state.regions.filter((r) => r.id !== action.id),
      };
    case "setView":
      return { ...state, view: action.view };
    case "setClockOffset":
      return { ...state, clockOffsetMs: action.offsetMs };
    case "setCampaignSchedule": {
      const campaign = state.campaigns.find((c) => c.id === action.id);
      if (!campaign) return state;
      // Children's schedules are their own; a campaign edit never changes them
      // (PRD R1, D33).
      const next = { ...campaign, schedule: action.schedule };
      return {
        ...state,
        campaigns: state.campaigns.map((c) => (c.id === next.id ? next : c)),
      };
    }
    case "setCampaignStatus":
      // Activating resolves a still-pending Immediate start (PRD R2, D14).
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.id
            ? {
                ...c,
                status: action.status,
                schedule: resolveImmediate(c.schedule, action.status, action.now),
              }
            : c,
        ),
      };
    case "addCampaign":
      return {
        ...state,
        campaigns: [...state.campaigns, action.campaign],
        view: { page: "campaign", campaignId: action.campaign.id },
      };
    case "addLineItem":
      return {
        ...state,
        lineItems: [...state.lineItems, action.lineItem],
        view: { page: "lineItem", lineItemId: action.lineItem.id },
      };
    case "setMode": {
      if (action.mode === state.mode) return state;
      // Park the active workspace and bring the other one back, untouched.
      const parked: Workspace = {
        campaigns: state.campaigns,
        lineItems: state.lineItems,
        creatives: state.creatives,
        view: state.view,
      };
      return { ...state, ...state.parkedWorkspace, mode: action.mode, parkedWorkspace: parked };
    }
    case "resetDemo":
      return state.mode === "demo"
        ? { ...state, ...emptyDemoWorkspace() }
        : { ...state, parkedWorkspace: emptyDemoWorkspace() };
    case "setLineItemSchedule":
      return {
        ...state,
        lineItems: state.lineItems.map((li) =>
          li.id === action.id ? { ...li, schedule: action.schedule } : li,
        ),
      };
    case "setLineItemStatus":
      return {
        ...state,
        lineItems: state.lineItems.map((li) =>
          li.id === action.id
            ? {
                ...li,
                status: action.status,
                schedule: resolveImmediate(li.schedule, action.status, action.now),
              }
            : li,
        ),
      };
    case "setCreativeSchedule":
      return {
        ...state,
        creatives: state.creatives.map((c) =>
          c.id === action.id ? { ...c, schedule: action.schedule } : c,
        ),
      };
    case "setCreativeWeight":
      return {
        ...state,
        creatives: state.creatives.map((c) =>
          c.id === action.id ? { ...c, customWeight: action.weight } : c,
        ),
      };
    case "resetCreativeWeights":
      return {
        ...state,
        creatives: state.creatives.map((c) =>
          c.lineItemId === action.lineItemId ? { ...c, customWeight: null } : c,
        ),
      };
    case "addCreatives": {
      const lineItem = state.lineItems.find((li) => li.id === action.lineItemId);
      if (!lineItem) return state;
      const added: Creative[] = action.items
        .filter((item) => !state.creatives.some((c) => c.id === item.id))
        .map((item) => ({
          id: item.id,
          lineItemId: lineItem.id,
          name: item.name,
          // PRD defaults: Immediate (stamped on add) → Indefinite, New York.
          // Never the line item's values (PRD R1, D33).
          schedule: resolveImmediate(defaultSchedule(), "active", action.now),
          customWeight: null,
        }));
      return { ...state, creatives: [...state.creatives, ...added] };
    }
    case "removeCreative":
      return { ...state, creatives: state.creatives.filter((c) => c.id !== action.id) };
    default:
      return state;
  }
};

interface AppContextValue {
  state: AppState;
  setRole: (role: Role) => void;
  addDistro: (distro: Distro) => void;
  updateDistro: (distro: Distro) => void;
  removeDistro: (id: string) => void;
  setDistroTranscodes: (id: string, transcodes: DistroTranscode[]) => void;
  setDistrosTranscodes: (
    entries: { id: string; transcodes: DistroTranscode[] }[],
  ) => void;
  setDistrosPlatformStatus: (
    ids: string[],
    status: PlatformStatus,
    target?: { platform: string; advertiser: string; advertiserId?: string },
  ) => void;
  setTranscodings: (configs: TranscodingConfig[]) => void;
  rememberPlatformAdvertiser: (
    platformId: string,
    advertiser: PlatformAdvertiser,
  ) => void;
  addTranscodePreset: (preset: TranscodePreset) => void;
  updateTranscodePreset: (preset: TranscodePreset) => void;
  deleteTranscodePreset: (id: string) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplates: (ids: string[]) => void;
  setTemplateDisabled: (id: string, disabled: boolean) => void;
  addParam: (family: ParamFamilyKey, param: ParamDef) => void;
  updateParam: (family: ParamFamilyKey, param: ParamDef) => void;
  deleteParam: (family: ParamFamilyKey, paramId: string) => void;
  addRegion: (region: RegionDef) => void;
  updateRegion: (region: RegionDef) => void;
  deleteRegion: (id: string) => void;
  nextDistributionId: () => number;
  /** The current instant, simulated-clock offset applied. Re-evaluates on a
   *  tick so run states flip without a reload. An absolute instant — never
   *  interpreted in the browser's zone (D21). */
  now: number;
  setView: (view: View) => void;
  setClockOffset: (offsetMs: number) => void;
  setCampaignSchedule: (id: number, schedule: Schedule) => void;
  setCampaignStatus: (id: number, status: AdminStatus) => void;
  /** Create Campaign: adds it under the advertiser and opens it. */
  createCampaign: (fields: { name: string; vertical: string; lineOfBusiness: string }) => void;
  /** Create Line Item: adds it to the campaign and opens it. */
  createLineItem: (
    campaignId: number,
    fields: { name: string; mediaType: string; rateType: string },
  ) => void;
  /** Prototype-only: switch between the preset sample and the build-it-yourself demo. */
  setMode: (mode: ExperienceMode) => void;
  /** Prototype-only: empty the demo workspace back to the advertiser page. */
  resetDemo: () => void;
  setLineItemSchedule: (id: number, schedule: Schedule) => void;
  setLineItemStatus: (id: number, status: AdminStatus) => void;
  setCreativeSchedule: (id: number, schedule: Schedule) => void;
  /** A typed weight (0–100), or null to go back to the auto split (D28). */
  setCreativeWeight: (id: number, weight: number | null) => void;
  resetCreativeWeights: (lineItemId: number) => void;
  /** Attach library creatives to a line item, Immediate → Indefinite in its zone. */
  addCreatives: (lineItemId: number, items: LibraryCreative[]) => void;
  removeCreative: (id: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Migrate legacy entities that had `customMacros` (now consolidated into
 * `customKeyValues`). The macro `{ macro, token }` shape is mapped to
 * `{ key: macro, value: token }` and merged into `customKeyValues`.
 */
const migrateCustomFields = <T extends { customKeyValues: CustomKeyValue[] }>(
  entity: T,
): T => {
  const legacyMacros = (
    entity as unknown as {
      customMacros?: Array<{ id: string; macro: string; token: string }>;
    }
  ).customMacros;
  if (!legacyMacros || legacyMacros.length === 0) return entity;
  return {
    ...entity,
    customKeyValues: [
      ...entity.customKeyValues,
      ...legacyMacros.map((m) => ({ id: m.id, key: m.macro, value: m.token })),
    ],
  };
};

/**
 * Bring a persisted distro up to the current shape:
 *  - the single `status` field became a `transcodes` list (one entry per applied
 *    preset). Legacy single status → one transcode, associated with the line-item's
 *    first preset. The old `cold` value maps to `inactive`.
 *  - distros persisted before Platform Status existed default to `notPushed`.
 */
const migrateDistroTranscodes = (
  distro: Distro,
  firstPresetId: string,
): Distro => {
  let next = distro;
  const legacy = next as unknown as {
    status?: string;
    transcodes?: DistroTranscode[];
  };
  if (!Array.isArray(legacy.transcodes)) {
    let status = (legacy.status as DistroStatus) ?? DEFAULT_DISTRO_STATUS;
    if ((status as string) === "cold") status = "inactive";
    next = { ...next, transcodes: [{ presetId: firstPresetId, status }] };
  }
  if (!next.platformStatus) {
    next = { ...next, platformStatus: DEFAULT_PLATFORM_STATUS };
  }
  return next;
};

const ensureCatalog = (raw: ParamsCatalog | undefined): ParamsCatalog => {
  if (!raw || !raw.nexxen || !raw.ttd || !raw.creative) {
    return SEED_PARAMS_CATALOG;
  }
  return raw;
};

/**
 * Map legacy region ids ("us-east-1" / "europe") onto their post-migration
 * equivalents ("usa" / "uk-europe"). Australia keeps its id.
 */
const LEGACY_REGION_ID_MAP: Record<string, string> = {
  "us-east-1": "usa",
  europe: "uk-europe",
};

const migrateRegionId = (id: string): string =>
  LEGACY_REGION_ID_MAP[id] ?? id;

const migrateEntityRegion = <T extends { region: string }>(entity: T): T => {
  const next = migrateRegionId(entity.region);
  if (next === entity.region) return entity;
  return { ...entity, region: next };
};

/**
 * If localStorage carries the original 3-region seed (us-east-1, australia,
 * europe) with default names, replace with the new 5-region seed so existing
 * users see the expanded catalog. Customized region lists are left alone.
 */
const LEGACY_SEED_IDS = new Set(["us-east-1", "australia", "europe"]);
const isLegacyRegionSeed = (regions: RegionDef[]): boolean =>
  regions.length === 3 && regions.every((r) => LEGACY_SEED_IDS.has(r.id));

const ensureRegions = (raw: RegionDef[] | undefined): RegionDef[] => {
  if (!raw || raw.length === 0) return seedRegions;
  if (isLegacyRegionSeed(raw)) return seedRegions;
  return raw;
};

/**
 * A persisted view pointing at something that no longer exists falls back to
 * the workspace's default. A pre-multi-campaign `{ page: "campaign" }` (no
 * id) opens the first campaign.
 */
const ensureView = (view: View | undefined, ws: Omit<Workspace, "view">, fallback: View): View => {
  const exists = (v: View) =>
    v.page === "advertiser" ||
    (v.page === "campaign" && ws.campaigns.some((c) => c.id === v.campaignId)) ||
    (v.page === "lineItem" && ws.lineItems.some((li) => li.id === v.lineItemId));
  if (view?.page === "campaign" && view.campaignId === undefined && ws.campaigns[0]) {
    return { page: "campaign", campaignId: ws.campaigns[0].id };
  }
  if (view && exists(view)) return view;
  return exists(fallback) ? fallback : { page: "advertiser" };
};

/** A saved workspace, possibly from before multi-campaign (one `campaign`). */
type RawWorkspace = Partial<Workspace> & { campaign?: Campaign };

/**
 * Scheduling migrations. Older saves had one `campaign` (it becomes the sample
 * workspace's only campaign). Bounds from earlier builds (`unset`, `inherit`)
 * and `timeZoneSource` are converted by `migrateSchedule`; creatives lose the
 * administrative status they no longer have (PRD R7).
 * Creatives arrived after line items, so older sample saves get the seeded
 * creatives. A workspace with nothing saved gets `fallback`.
 */
const migrateWorkspace = (raw: RawWorkspace | undefined, fallback: Workspace): Workspace => {
  if (!raw || (!raw.campaigns && !raw.campaign)) return fallback;
  const legacy = !raw.campaigns;
  const campaigns = (raw.campaigns ?? [raw.campaign as Campaign]).map((c) => ({
    ...c,
    schedule: migrateSchedule(c.schedule, null),
  }));
  const campaignSchedule = (id: number) => campaigns.find((c) => c.id === id)?.schedule ?? null;
  const lineItems = (legacy && !raw.lineItems?.length ? SEED_LINE_ITEMS : raw.lineItems ?? []).map(
    (li) => ({ ...li, schedule: migrateSchedule(li.schedule, campaignSchedule(li.campaignId)) }),
  );
  const creatives = (legacy && !raw.creatives?.length ? SEED_CREATIVES : raw.creatives ?? [])
    .filter((c) => lineItems.some((li) => li.id === c.lineItemId))
    .map((c) => ({
      id: c.id,
      lineItemId: c.lineItemId,
      name: c.name,
      customWeight: c.customWeight ?? null,
      schedule: migrateSchedule(
        c.schedule,
        lineItems.find((li) => li.id === c.lineItemId)?.schedule ?? null,
      ),
    }));
  const ws = { campaigns, lineItems, creatives };
  return { ...ws, view: ensureView(raw.view, ws, fallback.view) };
};

/** Active + parked workspaces; whichever isn't saved gets its mode's default. */
const migrateScheduling = (
  parsed: Partial<AppState> & { campaign?: Campaign },
): Pick<AppState, "campaigns" | "lineItems" | "creatives" | "view" | "mode" | "parkedWorkspace"> => {
  const mode: ExperienceMode = parsed.mode === "demo" ? "demo" : "sample";
  const fallbackFor = (m: ExperienceMode) => (m === "sample" ? sampleWorkspace() : emptyDemoWorkspace());
  const active = migrateWorkspace(parsed, fallbackFor(mode));
  const parked = migrateWorkspace(parsed.parkedWorkspace, fallbackFor(mode === "sample" ? "demo" : "sample"));
  return { ...active, mode, parkedWorkspace: parked };
};

const loadFromStorage = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.templates || !parsed.distros) return null;
    // We intentionally do NOT re-merge missing built-in templates here so that
    // admin deletions persist across reloads. New users (no localStorage yet)
    // still get the full seed set via `initialState`.
    const transcoding = ensureTranscodings(parsed.transcoding);
    const firstPresetId = transcoding[0]?.presetId ?? DEFAULT_PRESET_ID;
    return {
      ...initialState,
      ...parsed,
      templates: parsed.templates
        .map(migrateCustomFields)
        .map(migrateEntityRegion),
      distros: parsed.distros
        .map(migrateCustomFields)
        .map(migrateEntityRegion)
        .map((d) => migrateDistroTranscodes(d, firstPresetId)),
      paramsCatalog: ensureCatalog(parsed.paramsCatalog),
      regions: ensureRegions(parsed.regions),
      transcoding,
      transcodePresets: ensureTranscodePresets(parsed.transcodePresets),
      platformAdvertisers: parsed.platformAdvertisers ?? {},
      // Scheduling state arrived with this project; older saves get the seed.
      ...migrateScheduling(parsed),
      clockOffsetMs: parsed.clockOffsetMs ?? 0,
    };
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const fromStorage = loadFromStorage();
    return fromStorage ?? init;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const [realNow, setRealNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setRealNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  const now = realNow + state.clockOffsetMs;

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setRole: (role) => dispatch({ type: "setRole", role }),
      addDistro: (distro) => dispatch({ type: "addDistro", distro }),
      updateDistro: (distro) => dispatch({ type: "updateDistro", distro }),
      removeDistro: (id) => dispatch({ type: "removeDistro", id }),
      setDistroTranscodes: (id, transcodes) =>
        dispatch({ type: "setDistroTranscodes", id, transcodes }),
      setDistrosTranscodes: (entries) =>
        dispatch({ type: "setDistrosTranscodes", entries }),
      setDistrosPlatformStatus: (ids, status, target) =>
        dispatch({ type: "setDistrosPlatformStatus", ids, status, target }),
      setTranscodings: (configs) =>
        dispatch({ type: "setTranscodings", configs }),
      rememberPlatformAdvertiser: (platformId, advertiser) =>
        dispatch({ type: "rememberPlatformAdvertiser", platformId, advertiser }),
      addTranscodePreset: (preset) =>
        dispatch({ type: "addTranscodePreset", preset }),
      updateTranscodePreset: (preset) =>
        dispatch({ type: "updateTranscodePreset", preset }),
      deleteTranscodePreset: (id) =>
        dispatch({ type: "deleteTranscodePreset", id }),
      addTemplate: (template) => dispatch({ type: "addTemplate", template }),
      updateTemplate: (template) =>
        dispatch({ type: "updateTemplate", template }),
      deleteTemplates: (ids) => dispatch({ type: "deleteTemplates", ids }),
      setTemplateDisabled: (id, disabled) =>
        dispatch({ type: "setTemplateDisabled", id, disabled }),
      addParam: (family, param) => dispatch({ type: "addParam", family, param }),
      updateParam: (family, param) =>
        dispatch({ type: "updateParam", family, param }),
      deleteParam: (family, paramId) =>
        dispatch({ type: "deleteParam", family, paramId }),
      addRegion: (region) => dispatch({ type: "addRegion", region }),
      updateRegion: (region) => dispatch({ type: "updateRegion", region }),
      deleteRegion: (id) => dispatch({ type: "deleteRegion", id }),
      nextDistributionId: () => state.nextDistributionId,
      now,
      setView: (view) => dispatch({ type: "setView", view }),
      setClockOffset: (offsetMs) => {
        // Re-anchor on the real clock so a jump lands exactly where expected.
        setRealNow(Date.now());
        dispatch({ type: "setClockOffset", offsetMs });
      },
      setCampaignSchedule: (id, schedule) =>
        dispatch({ type: "setCampaignSchedule", id, schedule }),
      setCampaignStatus: (id, status) =>
        dispatch({ type: "setCampaignStatus", id, status, now }),
      createCampaign: (fields) => {
        // Ids continue above both workspaces, so a switch never collides.
        const id = nextId(
          [...state.campaigns, ...state.parkedWorkspace.campaigns].map((c) => c.id),
          3876,
        );
        dispatch({ type: "addCampaign", campaign: newCampaign(id, fields, now) });
      },
      createLineItem: (campaignId, fields) => {
        const campaign = state.campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        const id = nextId(
          [...state.lineItems, ...state.parkedWorkspace.lineItems].map((li) => li.id),
          23255,
        );
        dispatch({ type: "addLineItem", lineItem: newLineItem(id, campaign, fields, now) });
      },
      setMode: (mode) => dispatch({ type: "setMode", mode }),
      resetDemo: () => dispatch({ type: "resetDemo" }),
      setLineItemSchedule: (id, schedule) =>
        dispatch({ type: "setLineItemSchedule", id, schedule }),
      setLineItemStatus: (id, status) =>
        dispatch({ type: "setLineItemStatus", id, status, now }),
      setCreativeSchedule: (id, schedule) =>
        dispatch({ type: "setCreativeSchedule", id, schedule }),
      setCreativeWeight: (id, weight) =>
        dispatch({ type: "setCreativeWeight", id, weight }),
      resetCreativeWeights: (lineItemId) =>
        dispatch({ type: "resetCreativeWeights", lineItemId }),
      addCreatives: (lineItemId, items) =>
        dispatch({ type: "addCreatives", lineItemId, items, now }),
      removeCreative: (id) => dispatch({ type: "removeCreative", id }),
    }),
    [state, now],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
