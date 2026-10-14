import type { ParamDef, ParamsCatalog } from "../types";

// Order in each array defines the on-screen 3-column grid order, top-to-bottom
// row-by-row.
export const SEED_NEXXEN_PARAMS: ParamDef[] = [
  { id: "app_bundle", label: "app_bundle", output: "&app_bundle=$!{APP_ID}" },
  { id: "auction_id", label: "auction_id", output: "&auction_id=$!{AD_CALL_ID}" },
  { id: "clicktracker", label: "clicktracker", output: "&clicktracker=XXCLICK_FORM_URL[]XX" },
  { id: "device_id", label: "device_id", output: "&device_id=$!{DEVICE_SHA1}" },
  { id: "domain", label: "domain", output: "&domain=$!{SITE_URL}" },
  { id: "gdpr", label: "gdpr", output: "&gdpr=${IS_GDPR}" },
  { id: "percentage_weight", label: "percentage_weight", output: "&tgt=pw" },
  { id: "tag", label: "tag", output: "&tag=" },
  { id: "usp", label: "usp", output: "&usp=$!{US_PRIVACY}" },
  { id: "AppBundle", label: "AppBundle", output: "&app={{APP_NAME}}" },
  { id: "NEXXEN_ZIP_MACRO", label: "NEXXEN_ZIP_MACRO", output: "&tgt=direct&tg=$!{USER_POSTAL_CODE}" },
  { id: "Weather_Alpha", label: "Weather_Alpha", output: "&tgt=geo-weather" },
  { id: "nonskippable", label: "nonskippable", output: "&nonskippable=1" },
];

export const SEED_TTD_PARAMS: ParamDef[] = [
  { id: "clicktracer", label: "clicktracer", output: "&clicktracker=%%TTD_CLK_ESC%%" },
  { id: "dealid", label: "dealid", output: "&dealid=%%TTD_DEALID%%" },
  { id: "device_id", label: "device_id", output: "&device_id=%%TTD_DEVICEID%%" },
  { id: "device_type", label: "device_type", output: "&device_type=%%TTD_DEVICETYPE%%" },
  { id: "domain", label: "domain", output: "&domain=%%TTD_SITE%%" },
  { id: "percentage_weight", label: "percentage_weight", output: "&tgt=pw" },
  { id: "tag", label: "tag", output: "&tag=" },
  { id: "AdImpression", label: "AdImpression", output: "&AdImpression=%%TTD_IMPRESSIONID%%" },
  { id: "TTD_Auction_Macro", label: "TTD_Auction_Macro", output: "&auction_id=%%TTD_IMPRESSIONID%%" },
  { id: "TTD_ZIP_DYNAMIC_MACRO", label: "TTD_ZIP_DYNAMIC_MACRO", output: "&tgt=direct&tg=%%TTD_ZIPCODE%%" },
  { id: "TTD_GENRE_DYNAMIC_MACRO", label: "TTD_GENRE_DYNAMIC_MACRO", output: "&tgt=direct&tg=%%TTD_GENRE%%" },
  { id: "Weather_Alpha", label: "Weather_Alpha", output: "&tgt=geo-weather" },
  { id: "nonskippable", label: "nonskippable", output: "&nonskippable=1" },
];

export const SEED_CREATIVE_PARAMS: ParamDef[] = [
  { id: "autopop_first", label: "autopop_first", output: "&autopop_first=1" },
  { id: "player_font", label: "player_font", output: "&player_font=Montserrat" },
  { id: "cta", label: "cta", output: "&cta=1" },
  { id: "rand_titles", label: "rand_titles", output: "&rand_tiles=1" },
];

export const SEED_PARAMS_CATALOG: ParamsCatalog = {
  nexxen: SEED_NEXXEN_PARAMS,
  ttd: SEED_TTD_PARAMS,
  creative: SEED_CREATIVE_PARAMS,
};
